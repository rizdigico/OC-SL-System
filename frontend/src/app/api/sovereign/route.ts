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
    effect:      Record<string, number>;
    quantity:    number;
    equipped:    boolean;
}

export interface SovereignAlert {
    id: string; message: string; type: 'info' | 'warning' | 'success'; timestamp: number;
}
export interface SovereignQuest {
    id: string; title: string; description: string;
    expReward: number; goldReward: number; status: 'active';
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
    alerts:          SovereignAlert[];
    quests:          SovereignQuest[];
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
    alerts:          [],
    quests:          [],
};

const REDIS_KEY   = "sovereign_state";
const VALID_STATS = ["str", "agi", "vit", "int", "per"] as const;
type  StatKey     = typeof VALID_STATS[number];

// ── Effect normalization ─────────────────────────────────────────────────────

const STAT_KEY_MAP: Record<string, string> = {
    strength: "str", agility: "agi", vitality: "vit",
    intelligence: "int", sense: "per", perception: "per",
};

function normalizeGearEffect(raw: Record<string, unknown>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
        const n = Number(v);
        if (isNaN(n)) continue;
        const key = STAT_KEY_MAP[k] ?? k;
        if ((VALID_STATS as readonly string[]).includes(key) || key === "hp") result[key] = n;
    }
    return result;
}

function normalizeConsumableEffect(raw: Record<string, unknown>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
        const n = Number(v);
        if (isNaN(n)) continue;
        if (k === "vitality") { result["hp"] = n; continue; }
        const key = STAT_KEY_MAP[k] ?? k;
        result[key] = n;
    }
    return result;
}

// ── Redis: single-connection helper ──────────────────────────────────────────

async function withRedis<T>(fn: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
    const url   = process.env.REDIS_URL!;
    const isTLS = url.startsWith("rediss://");
    const client = createClient({
        url,
        socket: isTLS ? { tls: true, rejectUnauthorized: false } : undefined,
    });
    client.on("error", err => console.error("[SOVEREIGN REDIS ERROR]", err.message));
    await client.connect();
    try     { return await fn(client); }
    finally { await client.disconnect(); }
}

/** Parse the raw JSON blob from Redis into a SovereignState with backfilled defaults. */
function parseState(raw: string | null): SovereignState {
    if (!raw) return { ...DEFAULT_STATE };
    try {
        const p = JSON.parse(raw) as Partial<SovereignState>;
        return {
            ...DEFAULT_STATE,
            ...p,
            gold:      p.gold      ?? DEFAULT_STATE.gold,
            inventory: Array.isArray(p.inventory) ? p.inventory : [],
            alerts:    Array.isArray(p.alerts)    ? p.alerts    : [],
            quests:    Array.isArray(p.quests)    ? p.quests    : [],
        };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

// ── RPG business logic ──────────────────────────────────────────────────────

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
    const next: SovereignState = {
        ...state,
        [stat]:          state[stat] + 1,
        availablePoints: state.availablePoints - 1,
    };
    if (stat === "vit") { next.maxHp += 10; next.hp += 10; }
    return next;
}

// ── GET — single connection: read → respond ─────────────────────────────────

export async function GET() {
    if (!process.env.REDIS_URL) {
        return NextResponse.json(DEFAULT_STATE, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
    }
    try {
        const state = await withRedis(async client => {
            const raw = await client.get(REDIS_KEY);
            return parseState(raw);
        });
        return NextResponse.json(state, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
    } catch (err) {
        console.error("[SOVEREIGN GET] Redis failed:", (err as Error).message);
        return NextResponse.json(DEFAULT_STATE, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
    }
}

// ── POST — single connection: read → mutate → write → respond ───────────────

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
    }

    if (!process.env.REDIS_URL) {
        return NextResponse.json({ error: "Redis is required for mutations — REDIS_URL not set" }, { status: 503 });
    }

    const { action } = body as { action?: string };

    try {
        // ── One connection: read → mutate → write ────────────────────────────
        const saved = await withRedis(async client => {
            // READ
            const raw = await client.get(REDIS_KEY);
            let state = parseState(raw);

            // MUTATE
            if (action === "allocate") {
                const { stat } = body as { stat?: string };
                if (!stat || !(VALID_STATS as readonly string[]).includes(stat)) {
                    throw { userError: true, msg: "Invalid stat", status: 422 };
                }
                if (state.availablePoints <= 0) {
                    throw { userError: true, msg: "No available points", status: 422 };
                }
                state = allocateStat(state, stat as StatKey);

            } else if (action === "addExp") {
                const { amount } = body as { amount?: number };
                if (typeof amount !== "number" || amount < 0) {
                    throw { userError: true, msg: "amount must be a non-negative number", status: 422 };
                }
                state = processLevelUp({ ...state, exp: state.exp + amount });

            } else if (action === "buyItem") {
                const { itemId, name, type, description, effect, cost } = body as any;
                if (!itemId || !name || !["consumable", "gear"].includes(type) || typeof cost !== "number") {
                    throw { userError: true, msg: "buyItem requires: itemId, name, type (consumable|gear), cost", status: 422 };
                }
                if (state.gold < cost) {
                    throw { userError: true, msg: "Insufficient gold", status: 422 };
                }
                const normalizedEffect = type === "consumable"
                    ? normalizeConsumableEffect((effect ?? {}) as Record<string, unknown>)
                    : normalizeGearEffect((effect ?? {}) as Record<string, unknown>);

                const existingIdx = state.inventory.findIndex(i => i.id === itemId);
                if (existingIdx >= 0 && type === "consumable") {
                    state = {
                        ...state,
                        gold:      state.gold - cost,
                        inventory: state.inventory.map((item, i) =>
                            i === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
                        ),
                    };
                } else if (existingIdx >= 0 && type === "gear") {
                    throw { userError: true, msg: "You already own this item", status: 422 };
                } else {
                    state = {
                        ...state,
                        gold:      state.gold - cost,
                        inventory: [...state.inventory, {
                            id: itemId, name,
                            type:        type as "consumable" | "gear",
                            description: description ?? "",
                            effect:      normalizedEffect,
                            quantity:    1,
                            equipped:    false,
                        }],
                    };
                }

            } else if (action === "equipItem") {
                const { itemId } = body as { itemId?: string };
                const idx = state.inventory.findIndex(i => i.id === itemId);
                if (idx < 0) throw { userError: true, msg: "Item not in inventory", status: 422 };
                const item = state.inventory[idx];
                if (item.type !== "gear") throw { userError: true, msg: "Only gear can be equipped", status: 422 };
                if (item.equipped)        throw { userError: true, msg: "Already equipped", status: 422 };
                state = {
                    ...state,
                    inventory: state.inventory.map((i, n) => n === idx ? { ...i, equipped: true } : i),
                };

            } else if (action === "unequipItem") {
                const { itemId } = body as { itemId?: string };
                const idx = state.inventory.findIndex(i => i.id === itemId);
                if (idx < 0) throw { userError: true, msg: "Item not in inventory", status: 422 };
                if (!state.inventory[idx].equipped) throw { userError: true, msg: "Item not equipped", status: 422 };
                state = {
                    ...state,
                    inventory: state.inventory.map((i, n) => n === idx ? { ...i, equipped: false } : i),
                };

            } else if (action === "consumeItem") {
                const { itemId } = body as { itemId?: string };
                const idx = state.inventory.findIndex(i => i.id === itemId);
                if (idx < 0) throw { userError: true, msg: "Item not in inventory", status: 422 };
                const item = state.inventory[idx];
                if (item.type !== "consumable") throw { userError: true, msg: "Only consumables can be consumed", status: 422 };
                if (item.effect.hp)  state = { ...state, hp: Math.min(state.hp + item.effect.hp, state.maxHp) };
                if (item.effect.exp) state = processLevelUp({ ...state, exp: state.exp + item.effect.exp });
                const newQty = item.quantity - 1;
                state = {
                    ...state,
                    inventory: newQty > 0
                        ? state.inventory.map((i, n) => n === idx ? { ...i, quantity: newQty } : i)
                        : state.inventory.filter((_, n) => n !== idx),
                };

            } else if (action === "addAlert") {
                const { id, message, type } = body as { id?: string; message?: string; type?: string };
                if (!id || !message || !['info','warning','success'].includes(type ?? ''))
                    throw { userError: true, msg: "addAlert requires: id, message, type", status: 422 };
                const newAlert: SovereignAlert = { id, message, type: type as SovereignAlert['type'], timestamp: Date.now() };
                state = { ...state, alerts: [...state.alerts, newAlert].slice(-5) };

            } else if (action === "addQuest") {
                const { id, title, description, expReward, goldReward } = body as any;
                if (!id || !title || typeof expReward !== 'number' || typeof goldReward !== 'number')
                    throw { userError: true, msg: "addQuest requires: id, title, expReward, goldReward", status: 422 };
                const newQuest: SovereignQuest = { id, title, description: description ?? '', expReward, goldReward, status: 'active' };
                if (!state.quests.find(q => q.id === id))
                    state = { ...state, quests: [...state.quests, newQuest] };

            } else {
                throw { userError: true, msg: "Unknown action", status: 422 };
            }

            // WRITE — same connection, same socket, no gap
            const json = JSON.stringify(state);
            await client.set(REDIS_KEY, json);
            console.log(`[SOVEREIGN POST] ${action} OK — ${json.length}b — gold=${state.gold} inv=${state.inventory.length} alerts=${state.alerts.length} quests=${state.quests.length}`);

            return state;
        });

        return NextResponse.json(saved);

    } catch (err: any) {
        if (err?.userError) {
            return NextResponse.json({ error: err.msg }, { status: err.status });
        }
        console.error("[SOVEREIGN POST] Redis failed:", (err as Error).message);
        return NextResponse.json({ error: "Redis operation failed" }, { status: 503 });
    }
}
