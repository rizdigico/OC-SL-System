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

export interface DailyQuestState {
    pushups:   number;
    situps:    number;
    squats:    number;
    run:       number;
    completed: boolean;
    lastReset: number;
}

export interface DungeonTask {
    id:          string;
    text:        string;
    isCompleted: boolean;
}

export interface ActiveDungeon {
    id:           string;
    milestoneName: string;
    tasks:         DungeonTask[];
    progress:      number;
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
    clearedDungeons: string[];
    skills:          string[];
    activeDungeon:   ActiveDungeon | null;
    dailyQuest:      DailyQuestState;
    penaltyActive:   boolean;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_DAILY_QUEST: DailyQuestState = {
    pushups: 0, situps: 0, squats: 0, run: 0, completed: false, lastReset: 0,
};

const DEFAULT_STATE: SovereignState = {
    level:           17,
    exp:             4200,
    maxExp:          7009,
    title:           "The Weakest Hunter of All Mankind",
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
    clearedDungeons: [],
    skills:          [],
    activeDungeon:   null,
    dailyQuest:      { ...DEFAULT_DAILY_QUEST },
    penaltyActive:   false,
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
            gold:            p.gold      ?? DEFAULT_STATE.gold,
            inventory:       Array.isArray(p.inventory)       ? p.inventory       : [],
            alerts:          Array.isArray(p.alerts)          ? p.alerts          : [],
            quests:          Array.isArray(p.quests)          ? p.quests          : [],
            clearedDungeons: Array.isArray(p.clearedDungeons) ? p.clearedDungeons : [],
            skills:          Array.isArray(p.skills)          ? p.skills          : [],
            activeDungeon:   p.activeDungeon ?? null,
            dailyQuest:      p.dailyQuest ? { ...DEFAULT_DAILY_QUEST, ...p.dailyQuest } : { ...DEFAULT_DAILY_QUEST },
            penaltyActive:   p.penaltyActive ?? false,
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
    const lvlAlerts: SovereignAlert[] = [];
    while (exp >= maxExp) {
        exp             -= maxExp;
        level           += 1;
        availablePoints += 5;
        maxExp           = Math.round(maxExp * 1.2);
        lvlAlerts.push({
            id:        `lvl-${level}-${Date.now()}`,
            message:   `[SYSTEM ALARM] You have reached Level ${level}!`,
            type:      'success',
            timestamp: Date.now(),
        });
    }
    title = resolveTitle(level, title);
    const alerts = [...state.alerts, ...lvlAlerts].slice(-5);
    return { ...state, level, exp, maxExp, title, availablePoints, alerts };
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

// ── Dungeon clear rewards ────────────────────────────────────────────────────
// Shared by clearDungeon action and auto-clear on completeDungeonTask.

function awardDungeonClear(state: SovereignState, dungeonId: string): SovereignState {
    if (dungeonId === "double_dungeon") {
        // Awakening — Sovereign becomes "Player"
        return processLevelUp({
            ...state,
            title:           "Player",
            clearedDungeons: [...state.clearedDungeons, dungeonId],
        });
    } else if (dungeonId === "hapjeong_subway") {
        const venomFang: InventoryItem = {
            id:          "kasaka_venom_fang",
            name:        "Kasaka's Venom Fang",
            type:        "gear",
            description: "A deadly fang harvested from the Blue Venom-Fang Kasaka. Radiates dark energy.",
            effect:      { str: 15 },
            quantity:    1,
            equipped:    false,
        };
        return processLevelUp({
            ...state,
            exp:             state.exp + 3000,
            inventory:       [...state.inventory, venomFang],
            clearedDungeons: [...state.clearedDungeons, dungeonId],
        });
    } else if (dungeonId === "dungeon_prisoners") {
        return processLevelUp({
            ...state,
            exp:             state.exp + 5000,
            skills:          [...state.skills, "Stealth", "Bloodlust"],
            clearedDungeons: [...state.clearedDungeons, dungeonId],
        });
    } else {
        return processLevelUp({
            ...state,
            clearedDungeons: [...state.clearedDungeons, dungeonId],
        });
    }
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

            } else if (action === "completeQuest") {
                const { questId } = body as { questId?: string };
                if (!questId) throw { userError: true, msg: "completeQuest requires: questId", status: 422 };
                const quest = state.quests.find(q => q.id === questId);
                if (!quest) throw { userError: true, msg: "Quest not found", status: 404 };
                state = processLevelUp({
                    ...state,
                    exp:    state.exp  + quest.expReward,
                    gold:   state.gold + quest.goldReward,
                    quests: state.quests.filter(q => q.id !== questId),
                });

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

            } else if (action === "clearDungeon") {
                const { dungeonId } = body as { dungeonId?: string };
                if (!dungeonId) throw { userError: true, msg: "clearDungeon requires: dungeonId", status: 422 };
                if (state.clearedDungeons.includes(dungeonId))
                    throw { userError: true, msg: "Dungeon already cleared", status: 422 };
                state = awardDungeonClear(state, dungeonId);

            } else if (action === "startDungeon") {
                const { dungeonId, milestoneName, tasks } = body as any;
                if (!dungeonId || !milestoneName || !Array.isArray(tasks) || tasks.length === 0)
                    throw { userError: true, msg: "startDungeon requires: dungeonId, milestoneName, tasks (non-empty array)", status: 422 };
                if (state.clearedDungeons.includes(String(dungeonId)))
                    throw { userError: true, msg: "Dungeon already cleared", status: 422 };
                const normalizedTasks: DungeonTask[] = (tasks as any[]).map((t, i) => ({
                    id:          String(t.id ?? `task-${i}`),
                    text:        String(t.text ?? t.description ?? ""),
                    isCompleted: false,
                }));
                state = {
                    ...state,
                    activeDungeon: {
                        id:           String(dungeonId),
                        milestoneName: String(milestoneName),
                        tasks:         normalizedTasks,
                        progress:      0,
                    },
                };

            } else if (action === "completeDungeonTask") {
                const { taskId } = body as { taskId?: string };
                if (!taskId) throw { userError: true, msg: "completeDungeonTask requires: taskId", status: 422 };
                if (!state.activeDungeon) throw { userError: true, msg: "No active dungeon", status: 422 };

                const dungeonId    = state.activeDungeon.id;
                const updatedTasks = state.activeDungeon.tasks.map(t =>
                    t.id === taskId ? { ...t, isCompleted: true } : t
                );
                const completedCount = updatedTasks.filter(t => t.isCompleted).length;
                const progress       = Math.round((completedCount / updatedTasks.length) * 100);

                state = {
                    ...state,
                    activeDungeon: { ...state.activeDungeon, tasks: updatedTasks, progress },
                };

                // Auto-clear on 100%: grant rewards and null out activeDungeon
                if (progress >= 100) {
                    if (!state.clearedDungeons.includes(dungeonId)) {
                        state = awardDungeonClear({ ...state, activeDungeon: null }, dungeonId);
                    } else {
                        state = { ...state, activeDungeon: null };
                    }
                }

            } else if (action === "updateDailyQuest") {
                const { type, amount } = body as { type?: string; amount?: number };
                const QUEST_METRICS = ["pushups", "situps", "squats", "run"] as const;
                if (!type || !(QUEST_METRICS as readonly string[]).includes(type))
                    throw { userError: true, msg: "updateDailyQuest requires: type (pushups|situps|squats|run)", status: 422 };
                if (typeof amount !== "number" || amount <= 0)
                    throw { userError: true, msg: "updateDailyQuest requires: amount (positive number)", status: 422 };

                const dq = { ...state.dailyQuest };
                (dq as Record<string, unknown>)[type] = (dq[type as keyof typeof dq] as number) + amount;

                const isNowComplete = !dq.completed
                    && dq.pushups >= 100 && dq.situps >= 100
                    && dq.squats  >= 100 && dq.run    >= 10;

                if (isNowComplete) {
                    dq.completed = true;
                    const lootBox: InventoryItem = {
                        id:          `loot-box-${Date.now()}`,
                        name:        "Random Loot Box",
                        type:        "consumable",
                        description: "A mysterious box containing random rewards from the System.",
                        effect:      { exp: 500 },
                        quantity:    1,
                        equipped:    false,
                    };
                    const completionAlert: SovereignAlert = {
                        id:        `daily-complete-${Date.now()}`,
                        message:   "[SYSTEM] Daily Quest Complete! The System rewards the diligent.",
                        type:      "success",
                        timestamp: Date.now(),
                    };
                    state = {
                        ...state,
                        dailyQuest:      dq,
                        availablePoints: state.availablePoints + 3,
                        hp:              state.maxHp,
                        inventory:       [...state.inventory, lootBox],
                        alerts:          [...state.alerts, completionAlert].slice(-5),
                    };
                } else {
                    state = { ...state, dailyQuest: dq };
                }

            } else if (action === "triggerPenalty") {
                state = { ...state, penaltyActive: true };

            } else if (action === "devSetLevel") {
                const { newLevel } = body as { newLevel?: number };
                if (typeof newLevel !== "number" || newLevel < 1 || newLevel > 200)
                    throw { userError: true, msg: "devSetLevel requires: newLevel (1–200)", status: 422 };
                state = {
                    ...state,
                    level:           newLevel,
                    exp:             0,
                    title:           resolveTitle(newLevel, state.title),
                    availablePoints: state.availablePoints + 50,
                };

            } else {
                throw { userError: true, msg: "Unknown action", status: 422 };
            }

            // WRITE — same connection, same socket, no gap
            const json = JSON.stringify(state);
            await client.set(REDIS_KEY, json);
            console.log(`[SOVEREIGN POST] ${action} OK — ${json.length}b — gold=${state.gold} inv=${state.inventory.length} alerts=${state.alerts.length} quests=${state.quests.length} dungeons=${state.clearedDungeons.length} skills=${state.skills.length}`);

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
