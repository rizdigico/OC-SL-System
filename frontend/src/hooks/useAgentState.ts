"use client";

/**
 * useAgentState — polls GET /api/webhooks/openclaw every 5 s.
 *
 * Returns:
 *  agents       — full AgentStateMap keyed by agentId
 *  maxProgress  — highest progress among EXECUTING agents (null if none)
 *  hasLiveData  — true when ≥1 agent is currently EXECUTING
 *  loading      — true on first fetch
 *  lastPoll     — Date of last successful poll
 *  error        — last error string, or null
 */

import { useState, useEffect, useCallback } from "react";
import type { AgentStateMap } from "@/lib/agent-store";

// Re-export so callers don't need a second import
export type { AgentStateMap, AgentPayload, AgentStatus } from "@/lib/agent-store";

const POLL_MS  = 5_000;
const ENDPOINT = "/api/webhooks/openclaw";
// NEXT_PUBLIC_ so the browser bundle can read it
const SECRET   = process.env.NEXT_PUBLIC_OPENCLAW_SECRET ?? "SOVEREIGN_SECRET_KEY";

export function useAgentState() {
    const [agents,   setAgents]   = useState<AgentStateMap>({});
    const [loading,  setLoading]  = useState(true);
    const [lastPoll, setLastPoll] = useState<Date | null>(null);
    const [error,    setError]    = useState<string | null>(null);

    const poll = useCallback(async () => {
        try {
            const res = await fetch(ENDPOINT, {
                headers: { Authorization: `Bearer ${SECRET}` },
                cache:   "no-store",
            });
            if (res.ok) {
                const data = (await res.json()) as AgentStateMap;
                setAgents(data);
                setError(null);
            } else {
                setError(`HTTP ${res.status}`);
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
            setLastPoll(new Date());
        }
    }, []);

    useEffect(() => {
        poll();
        const id = setInterval(poll, POLL_MS);
        return () => clearInterval(id);
    }, [poll]);

    const executingAgents = Object.values(agents).filter(a => a.status === "EXECUTING");

    const maxProgress: number | null = executingAgents.length > 0
        ? Math.max(...executingAgents.map(a => a.progress))
        : null;

    return {
        agents,
        loading,
        lastPoll,
        error,
        maxProgress,
        /** True when at least one agent is actively EXECUTING */
        hasLiveData: maxProgress !== null,
    };
}
