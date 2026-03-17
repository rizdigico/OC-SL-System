export const dynamic    = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InventoryItem {
    id:          string;
    name:        string;
    type:        "consumable" | "gear";
    description: string;
    effect:      Record<string, number>;  // e.g. { str: 5, vit: 10, hp: 100 }
    quantity:    number;
    equipped:    boolean;
}

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
    gold:            number;
    inventory:       InventoryItem[];
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
    gold:            5000,
    inventory:       [],
};

const REDIS_KEY   = "sovereign_state";
const VALID_STATS = ["str", "agi", "vit", "int", "per"] as const;
type  StatKey     = typeof VALID_STATS[number];

// Normalize Express item effect keys (long names) → sovereign stat keys (short names)
const STAT_KEY_MAP: Record<string, string> = {
    strength:     "str",
    agility:      "agi",
    vitality:     "vit",
    intelligence: "int",
    sense:        "per",
    perception:   "per",
};

function normalizeGearEffect(raw: Record<string, unknown>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
        // Fix 2: coerce — accept both number and stringified number; discard only on NaN
        const parsed = Number(v);
        if (isNaN(parsed)) continue;  // skip slot, paralysis, boolean flags, etc.
        const key = STAT_KEY_MAP[k] ?? k;
        if ((VALID_STATS as readonly string[]).includes(key) || key === "hp") {
            result[key] = parsed;
        }
    }
    return result;
}

function normalizeConsumableEffect(raw: Record<string, unknown>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
        // Fix 2: coerce — accept both number and stringified number; discard only on NaN
        const parsed = Number(v);
        if (isNaN(parsed)) continue;
        // For consumables: vitality = HP restore, not stat increase
        if (k === "vitality") { result["hp"] = parsed; continue; }
        const key = STAT_KEY_MAP[k] ?? k;
        result[key] = parsed;
    }
    return result;
}

// ── Redis helpers ──────────────────────────────────────────────────────────────

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
            const parsed = JSON.parse(raw) as SovereignState;
            // Backfill new fields for states persisted before inventory system
            return {
                ...DEFAULT_STATE,
                ...parsed,
                gold:      parsed.gold      ?? DEFAULT_STATE.gold,
                inventory: parsed.inventory ?? [],
            };
        } catch {
            return { ...DEFAULT_STATE };
        }
    });
}

async function redisSet(state: SovereignState): Promise<void> {
    await withRedis(client => client.set(REDIS_KEY, JSON.stringify(state)));
}

// ── RPG business logic ─────────────────────────────────────────────────────────

function resolveTitle(level: number, currentTitle: string): string {
    if (level >= 40) return "Shadow Monarch";
    if (level >= 30) return "Elite Knight";
    if (level >= 20) return "Shadow Infantry";
    return currentTitle;
}

function processLevelUp(state: SovereignState): SovereignState {
    let { level, exp, maxExp, title, availablePoints } = state;
    while (exp >= maxExp) {
        exp             -= maxExp;
        level           += 1;
        availablePoints += 5;
        maxExp           = Math.round(maxExp * 1.2);
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
    if (stat === "vit") {
        next.maxHp += 10;
        next.hp    += 10;
    }
    return next;
}


// ── GET — fetch current sovereign state ────────────────────────────────────────

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

// ── POST — mutate sovereign state ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
    }

    const { action } = body as { action?: string };

    // Fix 1: Never ghost-save. If Redis is unavailable, refuse the mutation with 503.
    if (!redisAvailable()) {
        return NextResponse.json({ error: "Redis is required for mutations — REDIS_URL is not set" }, { status: 503 });
    }

    let state: SovereignState;
    try {
        state = await redisGet();
    } catch (err) {
        console.error("[SOVEREIGN POST] Redis read failed:", (err as Error).message);
        return NextResponse.json({ error: "Redis unavailable" }, { status: 503 });
    }

    // ── allocate ─────────────────────────────────────────────────────────────
    if (action === "allocate") {
        const { stat } = body as { stat?: string };
        if (!stat || !(VALID_STATS as readonly string[]).includes(stat)) {
            return NextResponse.json({ error: "Invalid stat. Must be one of: str, agi, vit, int, per" }, { status: 422 });
        }
        if (state.availablePoints <= 0) {
            return NextResponse.json({ error: "No available points" }, { status: 422 });
        }
        state = allocateStat(state, stat as StatKey);

    // ── addExp ───────────────────────────────────────────────────────────────
    } else if (action === "addExp") {
        const { amount } = body as { amount?: number };
        if (typeof amount !== "number" || amount < 0) {
            return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 422 });
        }
        state = processLevelUp({ ...state, exp: state.exp + amount });

    // ── buyItem ──────────────────────────────────────────────────────────────
    } else if (action === "buyItem") {
        const { itemId, name, type, description, effect, cost } = body as any;
        if (!itemId || !name || !["consumable", "gear"].includes(type) || typeof cost !== "number") {
            return NextResponse.json({ error: "buyItem requires: itemId, name, type (consumable|gear), cost" }, { status: 422 });
        }
        if (state.gold < cost) {
            return NextResponse.json({ error: "Insufficient gold" }, { status: 422 });
        }
        const normalizedEffect = type === "consumable"
            ? normalizeConsumableEffect((effect ?? {}) as Record<string, unknown>)
            : normalizeGearEffect((effect ?? {}) as Record<string, unknown>);

        const existingIdx = state.inventory.findIndex(i => i.id === itemId);
        let newInventory: InventoryItem[];
        if (existingIdx >= 0 && type === "consumable") {
            newInventory = state.inventory.map((item, i) =>
                i === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else if (existingIdx >= 0 && type === "gear") {
            return NextResponse.json({ error: "You already own this item" }, { status: 422 });
        } else {
            newInventory = [...state.inventory, {
                id:          itemId,
                name,
                type:        type as "consumable" | "gear",
                description: description ?? "",
                effect:      normalizedEffect,
                quantity:    1,
                equipped:    false,
            }];
        }
        state = { ...state, gold: state.gold - cost, inventory: newInventory };

    // ── equipItem ────────────────────────────────────────────────────────────
    // NOTE: base stats (str/agi/vit/int/per/maxHp) are NEVER modified by equip.
    // Totals = base + equipment bonuses are computed in the frontend so there is
    // no risk of data drift from repeated equip/unequip cycles.
    } else if (action === "equipItem") {
        const { itemId } = body as { itemId?: string };
        const idx = state.inventory.findIndex(i => i.id === itemId);
        if (idx < 0) return NextResponse.json({ error: "Item not in inventory" }, { status: 422 });
        const item = state.inventory[idx];
        if (item.type !== "gear") return NextResponse.json({ error: "Only gear can be equipped" }, { status: 422 });
        if (item.equipped)        return NextResponse.json({ error: "Already equipped" }, { status: 422 });
        state = {
            ...state,
            inventory: state.inventory.map((i, n) => n === idx ? { ...i, equipped: true } : i),
        };

    // ── unequipItem ──────────────────────────────────────────────────────────
    } else if (action === "unequipItem") {
        const { itemId } = body as { itemId?: string };
        const idx = state.inventory.findIndex(i => i.id === itemId);
        if (idx < 0) return NextResponse.json({ error: "Item not in inventory" }, { status: 422 });
        const item = state.inventory[idx];
        if (!item.equipped) return NextResponse.json({ error: "Item not equipped" }, { status: 422 });
        state = {
            ...state,
            inventory: state.inventory.map((i, n) => n === idx ? { ...i, equipped: false } : i),
        };

    // ── consumeItem ──────────────────────────────────────────────────────────
    } else if (action === "consumeItem") {
        const { itemId } = body as { itemId?: string };
        const idx = state.inventory.findIndex(i => i.id === itemId);
        if (idx < 0) return NextResponse.json({ error: "Item not in inventory" }, { status: 422 });
        const item = state.inventory[idx];
        if (item.type !== "consumable") return NextResponse.json({ error: "Only consumables can be consumed" }, { status: 422 });
        // Apply consumable effect
        if (item.effect.hp)  state = { ...state, hp: Math.min(state.hp + item.effect.hp, state.maxHp) };
        if (item.effect.exp) state = processLevelUp({ ...state, exp: state.exp + item.effect.exp });
        // Decrement quantity or remove
        const newQty = item.quantity - 1;
        state = {
            ...state,
            inventory: newQty > 0
                ? state.inventory.map((i, n) => n === idx ? { ...i, quantity: newQty } : i)
                : state.inventory.filter((_, n) => n !== idx),
        };

    } else {
        return NextResponse.json(
            { error: "Unknown action. Supported: allocate | addExp | buyItem | equipItem | unequipItem | consumeItem" },
            { status: 422 },
        );
    }

    // redisAvailable() is guaranteed true here (checked above)
    try {
        await redisSet(state);
    } catch (err) {
        console.error("[SOVEREIGN POST] Redis write failed:", (err as Error).message);
        return NextResponse.json({ error: "Redis write failed" }, { status: 503 });
    }

    return NextResponse.json(state);
}
