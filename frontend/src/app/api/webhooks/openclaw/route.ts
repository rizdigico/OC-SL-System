// Obliterate all Next.js caching layers on this route
export const dynamic     = "force-dynamic";
export const fetchCache  = "force-no-store";
export const revalidate  = 0;

/**
 * POST /api/webhooks/openclaw
 *   Receive a status ping from a running OpenClaw agent.
 *   Headers: Authorization: Bearer <OPENCLAW_SECRET>
 *   Body:    { agentId, status, progress, currentTask }
 *
 * GET  /api/webhooks/openclaw
 *   Return the current snapshot of all known agents.
 *   Headers: Authorization: Bearer <OPENCLAW_SECRET>
 *
 * Storage strategy:
 *   - Redis (via REDIS_URL env var): used in production on Vercel
 *   - In-memory agent-store: fallback for local dev (no Redis credentials)
 *
 * Redis hash key: "shadow_army_state"
 *   Each field = agentId, value = JSON-serialised AgentPayload
 *
 * To test from cURL:
 *   curl -X POST http://localhost:3000/api/webhooks/openclaw \
 *     -H "Authorization: Bearer SOVEREIGN_SECRET_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{"agentId":"beru","status":"EXECUTING","progress":42,"currentTask":"Scraping page 5/12"}'
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "redis";
import { upsertAgent, getState, AgentPayload, AgentStateMap } from "@/lib/agent-store";
import type { SovereignState } from "@/app/api/sovereign/route";

// ── Auth ──────────────────────────────────────────────────────────────────────

const SECRET = process.env.OPENCLAW_SECRET ?? process.env.SOVEREIGN_SECRET_KEY ?? "SOVEREIGN_SECRET_KEY";

function authorized(req: NextRequest): boolean {
    const header = req.headers.get("authorization") ?? "";
    return header === `Bearer ${SECRET}`;
}

// ── Redis helpers ─────────────────────────────────────────────────────────────

const REDIS_KEY = "shadow_army_state";

function redisAvailable(): boolean {
    return Boolean(process.env.REDIS_URL);
}

/**
 * Run `fn` with a connected Redis client and always disconnect afterward,
 * even if `fn` throws. Safe for serverless — no connection leaks.
 *
 * TLS note: Upstash (Vercel marketplace Redis) uses rediss:// (TLS required).
 * We force tls:true for rediss:// so the handshake doesn't silently fail.
 */
async function withRedis<T>(fn: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
    const url    = process.env.REDIS_URL!;
    const isTLS  = url.startsWith("rediss://");
    const client = createClient({
        url,
        socket: isTLS ? { tls: true, rejectUnauthorized: false } : undefined,
    });

    // Surface connection errors loudly — no silent fallback
    client.on("error", err => console.error("[REDIS CLIENT ERROR]", err.message));

    console.log(`[REDIS] Connecting to ${isTLS ? "rediss://" : "redis://"} (TLS: ${isTLS})`);
    try {
        await client.connect();
        console.log("[REDIS] Connected OK");
    } catch (err) {
        console.error("[REDIS] Connection FAILED:", (err as Error).message);
        throw err; // propagate — caller will return 500
    }

    try {
        return await fn(client);
    } finally {
        await client.disconnect();
    }
}

async function redisSet(payload: AgentPayload): Promise<void> {
    await withRedis(client =>
        client.hSet(REDIS_KEY, payload.agentId, JSON.stringify(payload)),
    );
}

async function redisGetAll(): Promise<AgentStateMap> {
    return withRedis(async client => {
        // hGetAll returns Record<string, string> — values are JSON strings.
        // Returns null/empty-object when the key doesn't exist yet.
        const raw = await client.hGetAll(REDIS_KEY);
        if (!raw) return {};
        const result: AgentStateMap = {};
        for (const [agentId, json] of Object.entries(raw)) {
            try {
                result[agentId] = JSON.parse(json) as AgentPayload;
            } catch {
                // Skip corrupt entries
            }
        }
        return result;
    });
}

// ── Sovereign EXP bridge ──────────────────────────────────────────────────────

const SOVEREIGN_KEY = "sovereign_state";

const SOVEREIGN_DEFAULTS: SovereignState = {
    level: 17, exp: 4200, maxExp: 7009, title: "Wolf Slayer",
    hp: 900, maxHp: 900, fatigue: 12,
    str: 40, agi: 35, vit: 40, int: 60, per: 30, availablePoints: 5,
    gold: 5000, inventory: [], alerts: [], quests: [],
};

function parseSovereignState(raw: string | null): SovereignState {
    if (!raw) return { ...SOVEREIGN_DEFAULTS };
    try {
        const p = JSON.parse(raw) as Partial<SovereignState>;
        return {
            ...SOVEREIGN_DEFAULTS,
            ...p,
            gold:      p.gold      ?? SOVEREIGN_DEFAULTS.gold,
            inventory: Array.isArray(p.inventory) ? p.inventory : [],
        };
    } catch {
        return { ...SOVEREIGN_DEFAULTS };
    }
}

function applyExpGain(state: SovereignState, amount: number): SovereignState {
    let { level, exp, maxExp, title, availablePoints } = { ...state, exp: state.exp + amount };
    while (exp >= maxExp) {
        exp            -= maxExp;
        level          += 1;
        availablePoints += 5;
        maxExp          = Math.round(maxExp * 1.2);
    }
    if (level >= 40) title = "Shadow Monarch";
    else if (level >= 30) title = "Elite Knight";
    else if (level >= 20) title = "Shadow Infantry";
    return { ...state, level, exp, maxExp, title, availablePoints };
}

/** Single-connection atomic read → mutate EXP → write. Never opens two connections. */
async function injectSovereignExp(expReward: number): Promise<void> {
    await withRedis(async client => {
        const raw     = await client.get(SOVEREIGN_KEY);
        const current = parseSovereignState(raw);
        const updated = applyExpGain(current, expReward);
        const json    = JSON.stringify(updated);
        await client.set(SOVEREIGN_KEY, json);
        console.log(`[SOVEREIGN] +${expReward} EXP — ${json.length}b — gold=${updated.gold} inv=${updated.inventory.length} — Lv${current.level}→${updated.level}`);
    });
}

// ── POST — receive agent ping ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    if (!authorized(req)) {
        return NextResponse.json(
            { error: "Unauthorized — include: Authorization: Bearer <secret>" },
            { status: 401 },
        );
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
    }

    const { agentId, status, progress, currentTask } = body;

    const VALID_STATUSES = ["IDLE", "EXECUTING", "FAILED", "COMPLETED"] as const;

    if (
        typeof agentId     !== "string" || !agentId.trim() ||
        typeof status      !== "string" || !(VALID_STATUSES as readonly string[]).includes(status) ||
        typeof progress    !== "number" || progress < 0 || progress > 100 ||
        typeof currentTask !== "string"
    ) {
        return NextResponse.json(
            {
                error:  "Invalid payload",
                schema: {
                    agentId:     "string (non-empty)",
                    status:      "IDLE | EXECUTING | FAILED | COMPLETED",
                    progress:    "number 0–100",
                    currentTask: "string",
                },
            },
            { status: 422 },
        );
    }

    const payload: AgentPayload = {
        agentId:     agentId.trim().toLowerCase(),   // normalise so Redis keys are always lowercase
        status:      status as AgentPayload["status"],
        progress:    Math.round(progress),
        currentTask: currentTask.trim(),
        updatedAt:   new Date().toISOString(),
    };

    if (redisAvailable()) {
        try {
            await redisSet(payload);
            console.log("[POST] Saved to Redis:", payload.agentId, payload.status, payload.progress);
        } catch (err) {
            console.error("[POST] Redis write FAILED — falling back to memory:", (err as Error).message);
            upsertAgent(payload);
        }

        // ── EXP injection on COMPLETED ────────────────────────────────────────
        if (payload.status === "COMPLETED") {
            const expReward = typeof body.expReward === "number" && body.expReward > 0
                ? Math.round(body.expReward)
                : 50;
            try {
                await injectSovereignExp(expReward);
            } catch (err) {
                // Non-fatal — agent tracking already succeeded
                console.error("[POST] Sovereign EXP injection FAILED:", (err as Error).message);
            }
        }
    } else {
        console.log("[POST] REDIS_URL not set — using in-memory store (local dev only)");
        upsertAgent(payload);
    }

    return NextResponse.json({ ok: true, agent: payload }, { status: 200 });
}

// ── GET — return current snapshot ────────────────────────────────────────────

export async function GET(_req: NextRequest) {
    // No auth required on GET — the dashboard page itself is gated by Basic Auth
    // middleware. The Bearer check only protects the write (POST) endpoint.
    let data: AgentStateMap;
    if (redisAvailable()) {
        try {
            data = await redisGetAll();
            console.log("[GET] Redis read OK. Keys:", Object.keys(data));
        } catch (err) {
            console.error("[GET] Redis read FAILED — returning empty state:", (err as Error).message);
            data = {};
        }
    } else {
        console.log("[GET] REDIS_URL not set — reading in-memory store (local dev only)");
        data = getState();
    }
    console.log("[GET] Returning state:", JSON.stringify(data));

    return NextResponse.json(data, {
        headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    });
}
