"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SovereignState } from "@/app/api/sovereign/route";

interface SovereignContextValue {
    sovereign:        SovereignState | null;
    refreshSovereign: () => Promise<void>;
}

const SovereignContext = createContext<SovereignContextValue>({
    sovereign:        null,
    refreshSovereign: async () => {},
});

export function SovereignProvider({ children }: { children: React.ReactNode }) {
    const [sovereign, setSovereign] = useState<SovereignState | null>(null);

    const refreshSovereign = useCallback(async () => {
        try {
            const res = await fetch("/api/sovereign", { cache: "no-store" });
            if (res.ok) setSovereign(await res.json());
        } catch (err) {
            console.error("[SovereignContext] Fetch failed:", err);
        }
    }, []);

    useEffect(() => { refreshSovereign(); }, [refreshSovereign]);

    return (
        <SovereignContext.Provider value={{ sovereign, refreshSovereign }}>
            {children}
        </SovereignContext.Provider>
    );
}

export function useSovereign() {
    return useContext(SovereignContext);
}
