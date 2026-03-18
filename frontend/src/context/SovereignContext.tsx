"use client";

import React from "react";
import useSWR from "swr";
import type { SovereignState } from "@/app/api/sovereign/route";

/* ── SWR fetcher — cache: "no-store" prevents Next.js from caching the response ── */
const fetcher = (url: string) =>
    fetch(url, { cache: "no-store" }).then((res) => res.json());

const SWR_KEY = "/api/sovereign";

/**
 * Drop-in replacement for the old Context-based hook.
 * SWR's global cache means every component calling useSovereign()
 * shares the same data and polling interval — no Provider needed.
 */
export function useSovereign() {
    const { data: sovereign = null, mutate } = useSWR<SovereignState>(
        SWR_KEY,
        fetcher,
        { refreshInterval: 2000, revalidateOnFocus: true },
    );

    /** Re-fetches sovereign state from the server (GET). */
    const refreshSovereign = async () => {
        await mutate();
    };

    /** Optimistically overwrites sovereign state from a POST response body — no extra GET needed. */
    const updateSovereign = (state: SovereignState) => {
        mutate(state, { revalidate: false });
    };

    return { sovereign, refreshSovereign, updateSovereign };
}

/* ── Passthrough Provider — kept so dashboard/page.tsx JSX doesn't need changes ── */
export function SovereignProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
