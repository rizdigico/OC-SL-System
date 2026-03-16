/**
 * agent-store.ts — Module-level singleton for OpenClaw agent state.
 *
 * Uses an in-memory map as the primary store (fast, zero-latency reads).
 * Syncs to data/agent-state.json on every write so state survives dev-server
 * restarts. For a production deployment swap the two functions below for a
 * real database call (Supabase, MongoDB, Redis, …).
 */

import fs   from "fs";
import path from "path";

// ── Shared types (re-exported for the frontend hook) ─────────────────────────

export type AgentStatus = "IDLE" | "EXECUTING" | "FAILED" | "COMPLETED";

export interface AgentPayload {
    agentId:     string;
    status:      AgentStatus;
    /** 0-100 */
    progress:    number;
    currentTask: string;
    updatedAt:   string;
}

export type AgentStateMap = Record<string, AgentPayload>;

// ── Persistence paths ─────────────────────────────────────────────────────────

const DATA_DIR  = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "agent-state.json");

// ── In-memory singleton ───────────────────────────────────────────────────────

let _store: AgentStateMap | null = null;

function load(): AgentStateMap {
    if (_store !== null) return _store;
    try {
        if (fs.existsSync(DATA_FILE)) {
            _store = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as AgentStateMap;
            return _store;
        }
    } catch {
        // Corrupt file — reset to empty
    }
    _store = {};
    return _store;
}

function persist(state: AgentStateMap): void {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (e) {
        console.warn("[agent-store] Could not write agent-state.json:", e);
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Upsert a single agent record and sync to disk. */
export function upsertAgent(
    payload: Omit<AgentPayload, "updatedAt">,
): AgentPayload {
    const state  = load();
    const entry: AgentPayload = { ...payload, updatedAt: new Date().toISOString() };
    state[payload.agentId] = entry;
    persist(state);
    return entry;
}

/** Return the full snapshot of all known agents. */
export function getState(): AgentStateMap {
    return load();
}
