"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SovereignState } from "@/app/api/sovereign/route";

interface SovereignContextValue {
    sovereign:        SovereignState | null;
    /** Re-fetches sovereign state from the server (GET). Use on initial load or manual refresh. */
    refreshSovereign: () => Promise<void>;
    /** Directly overwrites sovereign state from a POST response body — no extra GET needed. */
    updateSovereign:  (state: SovereignState) => void;
}

const SovereignContext = createContext<SovereignContextValue>({
    sovereign:        null,
    refreshSovereign: async () => {},
    updateSovereign:  () => {},
});

export function SovereignProvider({ children }: { children: React.ReactNode }) {
    const [sovereign, setSovereign] = useState<SovereignState | null>(null);

    const refreshSovereign = useCallback(async () => {
        try {
            // ?t= busts Next.js's internal fetch deduplication cache
            const res = await fetch(`/api/sovereign?t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) setSovereign(await res.json());
        } catch (err) {
            console.error("[SovereignContext] Fetch failed:", err);
        }
    }, []);

    // Direct setter — used by mutation callers to apply POST response without a second GET
    const updateSovereign = useCallback((state: SovereignState) => {
        setSovereign(state);
    }, []);

    useEffect(() => { refreshSovereign(); }, [refreshSovereign]);

    return (
        <SovereignContext.Provider value={{ sovereign, refreshSovereign, updateSovereign }}>
            {children}
        </SovereignContext.Provider>
    );
}

export function useSovereign() {
    return useContext(SovereignContext);
}
