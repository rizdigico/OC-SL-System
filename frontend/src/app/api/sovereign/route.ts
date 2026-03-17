export const dynamic    = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SovereignState {
    level:           number;
    exp:             number;
    maxExp:          number;
    title:           string;
    hp:              number;
    maxHp:           number;
    fatigue:         number;
    str:             number;
    agi:             number;
    vit:             number;
    int:             number;
    per:             number;
    availablePoints: number;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_STATE: SovereignState = {
    level:           17,
    exp:             4200,
    maxExp:          7009,
    title:           "Wolf Slayer",
    hp:              900,
    maxHp:           900,
    fatigue:         12,
    str:             40,
    agi:             35,
    vit:             40,
    int:             60,
    per:             30,
    availablePoints: 5,
};

const REDIS_KEY    = "sovereign_state";
const VALID_STATS  = ["str", "agi", "vit", "int", "per"] as const;
type  StatKey      = typeof VALID_STATS[number];

// ── Redis helpers (same TLS pattern as openclaw webhook) ──────────────────────

function redisAvailable(): boolean {
    return Boolean(process.env.REDIS_URL);
}

async function withRedis<T>(
    fn: (client: ReturnType<typeof createClient>) => Promise<T>,
): Promise<T> {
    const url   = process.env.REDIS_URL!;
    const isTLS = url.startsWith("rediss://");
    const client = createClient({
        url,
        socket: isTLS ? { tls: true, rejectUnauthorized: false } : undefined,
    });
    client.on("error", err => console.error("[SOVEREIGN REDIS ERROR]", err.message));
    await client.connect();
    try {
        return await fn(client);
    } finally {
        await client.disconnect();
    }
}

async function redisGet(): Promise<SovereignState> {
    return withRedis(async client => {
        const raw = await client.get(REDIS_KEY);
        if (!raw) return { ...DEFAULT_STATE };
        try {
            return JSON.parse(raw) as SovereignState;
        } catch {
            return { ...DEFAULT_STATE };
        }
    });
}

async function redisSet(state: SovereignState): Promise<void> {
    await withRedis(client => client.set(REDIS_KEY, JSON.stringify(state)));
}

// ── RPG business logic ────────────────────────────────────────────────────────

function resolveTitle(level: number, currentTitle: string): string {
    if (level >= 40) return "Shadow Monarch";
    if (level >= 30) return "Elite Knight";
    if (level >= 20) return "Shadow Infantry";
    return currentTitle;
}

/** Processes any pending level-ups (handles chained overflows). */
function processLevelUp(state: SovereignState): SovereignState {
    let { level, exp, maxExp, title, availablePoints } = state;
    while (exp >= maxExp) {
        exp            -= maxExp;
        level          += 1;
        availablePoints += 5;
        maxExp          = Math.round(maxExp * 1.2);
    }
    title = resolveTitle(level, title);
    return { ...state, level, exp, maxExp, title, availablePoints };
}

function allocateStat(state: SovereignState, stat: StatKey): SovereignState {
    let next: SovereignState = {
        ...state,
        [stat]:          state[stat] + 1,
        availablePoints: state.availablePoints - 1,
    };
    // VIT: each point increases both max and current HP by 10
    if (stat === "vit") {
        next.maxHp += 10;
        next.hp    += 10;
    }
    return next;
}

// ── GET — fetch current sovereign state ───────────────────────────────────────

export async function GET() {
    let state: SovereignState;
    if (redisAvailable()) {
        try {
            state = await redisGet();
        } catch (err) {
            console.error("[SOVEREIGN GET] Redis failed:", (err as Error).message);
            state = { ...DEFAULT_STATE };
        }
    } else {
        console.log("[SOVEREIGN GET] No REDIS_URL — returning defaults");
        state = { ...DEFAULT_STATE };
    }
    return NextResponse.json(state, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
}

// ── POST — mutate sovereign state ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
    }

    const { action, stat, amount } = body as {
        action?: string;
        stat?:   string;
        amount?: number;
    };

    let state: SovereignState;
    if (redisAvailable()) {
        try {
            state = await redisGet();
        } catch (err) {
            console.error("[SOVEREIGN POST] Redis read failed:", (err as Error).message);
            return NextResponse.json({ error: "Redis unavailable" }, { status: 503 });
        }
    } else {
        state = { ...DEFAULT_STATE };
    }

    // ── action: allocate ──
    if (action === "allocate") {
        if (!stat || !(VALID_STATS as readonly string[]).includes(stat)) {
            return NextResponse.json({ error: "Invalid stat. Must be one of: str, agi, vit, int, per" }, { status: 422 });
        }
        if (state.availablePoints <= 0) {
            return NextResponse.json({ error: "No available points" }, { status: 422 });
        }
        state = allocateStat(state, stat as StatKey);

    // ── action: addExp ──
    } else if (action === "addExp") {
        if (typeof amount !== "number" || amount < 0) {
            return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 422 });
        }
        state = processLevelUp({ ...state, exp: state.exp + amount });

    } else {
        return NextResponse.json(
            { error: "Unknown action. Supported: allocate | addExp" },
            { status: 422 },
        );
    }

    if (redisAvailable()) {
        try {
            await redisSet(state);
        } catch (err) {
            console.error("[SOVEREIGN POST] Redis write failed:", (err as Error).message);
            return NextResponse.json({ error: "Redis write failed" }, { status: 503 });
        }
    }

    return NextResponse.json(state);
}
