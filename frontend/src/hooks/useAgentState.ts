"use client";

/**
 * useAgentState — polls GET /api/webhooks/openclaw every 2 s.
 *
 * Returns:
 *  agents       — full AgentStateMap keyed by agentId
 *  maxProgress  — best available progress number (see logic below); null only
 *                 before the first successful poll with any data
 *  hasLiveData  — true once ≥1 agent has ever reported (even IDLE/COMPLETED)
 *  loading      — true on first fetch
 *  lastPoll     — Date of last successful poll
 *  error        — last error string, or null
 */

import { useState, useEffect, useCallback } from "react";
import type { AgentStateMap } from "@/lib/agent-store";

// Re-export so callers don't need a second import
export type { AgentStateMap, AgentPayload, AgentStatus } from "@/lib/agent-store";

const POLL_MS  = 2_000;
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
            // ?t= cache-buster defeats any CDN or browser cache that ignores headers
            const res = await fetch(`${ENDPOINT}?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${SECRET}` },
                cache:   "no-store",
            });
            if (res.ok) {
                const data = await res.json();
                console.log("[UI FETCH] Polled Data:", data);
                // Guard against null/non-object responses (e.g. empty Redis hash)
                setAgents(data && typeof data === "object" && !Array.isArray(data) ? data as AgentStateMap : {});
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

    const allAgents       = Object.values(agents);
    const executingAgents = allAgents.filter(a => a.status === "EXECUTING");

    /**
     * Progress shown to the auto-battler:
     *   - Any agents EXECUTING  → highest progress among them
     *   - Any agents COMPLETED  → 100 (battle already won)
     *   - Agents exist but all IDLE/FAILED → 0 (standby)
     *   - No agents at all      → null (fall back to dev slider)
     */
    const maxProgress: number | null =
        allAgents.length === 0   ? null :
        executingAgents.length > 0
            ? Math.max(...executingAgents.map(a => a.progress))
            : allAgents.some(a => a.status === "COMPLETED")
                ? 100
                : 0;

    return {
        agents,
        loading,
        lastPoll,
        error,
        maxProgress,
        /** True once ≥1 agent has reported — stays true even after they go IDLE/COMPLETED */
        hasLiveData: allAgents.length > 0,
    };
}
