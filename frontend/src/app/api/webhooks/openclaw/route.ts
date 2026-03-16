// Force Next.js to never cache this route — live state must always be fresh
export const dynamic = "force-dynamic";

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
 */
async function withRedis<T>(fn: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
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
        // hGetAll returns Record<string, string> — values are JSON strings
        const raw = await client.hGetAll(REDIS_KEY);
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
        agentId:     agentId.trim(),
        status:      status as AgentPayload["status"],
        progress:    Math.round(progress),
        currentTask: currentTask.trim(),
        updatedAt:   new Date().toISOString(),
    };

    if (redisAvailable()) {
        await redisSet(payload);
    } else {
        upsertAgent(payload);
    }

    return NextResponse.json({ ok: true, agent: payload }, { status: 200 });
}

// ── GET — return current snapshot ────────────────────────────────────────────

export async function GET(req: NextRequest) {
    if (!authorized(req)) {
        return NextResponse.json(
            { error: "Unauthorized — include: Authorization: Bearer <secret>" },
            { status: 401 },
        );
    }

    const state = redisAvailable() ? await redisGetAll() : getState();

    return NextResponse.json(state, {
        headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    });
}
