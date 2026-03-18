"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Skull } from "lucide-react";
import { useSovereign } from "@/context/SovereignContext";

// ── Phase I Dungeon Registry ──────────────────────────────────────────────────

interface DungeonEntry {
    id:        string;
    rank:      string;
    title:     string;
    boss:      string;
    reqLevel:  number;
    reward?:   string;
    isInstant?: boolean;
}

const PHASE_I_DUNGEONS: DungeonEntry[] = [
    {
        id:       "double_dungeon",
        rank:     "D",
        title:    "The Double Dungeon",
        boss:     "Statue of God",
        reqLevel: 1,
    },
    {
        id:        "hapjeong_subway",
        rank:      "E",
        title:     "Hapjeong Subway Station",
        boss:      "Blue Venom-Fang Kasaka",
        reqLevel:  10,
        reward:    "Kasaka's Venom Fang (+15 STR)",
        isInstant: true,
    },
    {
        id:       "dungeon_lizards",
        rank:     "C",
        title:    "Dungeon & Lizards",
        boss:     "Giant Arachnid Buryura",
        reqLevel: 15,
    },
    {
        id:      "dungeon_prisoners",
        rank:    "B",
        title:   "Dungeon & Prisoners",
        boss:    "Kang Taeshik",
        reqLevel: 20,
        reward:  "Stealth + Bloodlust Skills",
    },
];

const RANK_COLOR: Record<string, string> = {
    E: "#11D2EF",
    D: "#60a5fa",
    C: "#4ade80",
    B: "#facc15",
    A: "#f97316",
    S: "#ef4444",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MainStoryline() {
    const { sovereign } = useSovereign();
    const [awaitingAssessment, setAwaitingAssessment] = useState<string | null>(null);

    const clearedDungeons = sovereign?.clearedDungeons ?? [];
    const activeDungeon   = sovereign?.activeDungeon ?? null;
    const level           = sovereign?.level ?? 1;

    // The first dungeon not yet cleared is the "active" candidate
    const nextIdx    = PHASE_I_DUNGEONS.findIndex(d => !clearedDungeons.includes(d.id));
    const allCleared = nextIdx === -1;

    return (
        <div className="sl-panel">
            <span className="sl-corner-tl"/><span className="sl-corner-tr"/>
            <span className="sl-corner-bl"/><span className="sl-corner-br"/>

            <div className="sl-panel-header" style={{ borderColor: "rgba(199,31,22,0.5)" }}>
                <span className="sl-notif-icon" style={{ borderColor: "rgba(199,31,22,0.8)" }}>!</span>
                <span>PHASE I — MAIN STORYLINE</span>
                <span className="ml-auto text-xs sl-text-dim font-normal normal-case tracking-normal">
                    {clearedDungeons.length} / {PHASE_I_DUNGEONS.length} Cleared
                </span>
            </div>

            <div className="divide-y divide-[rgba(30,68,200,0.15)]">
                {PHASE_I_DUNGEONS.map((dungeon, idx) => {
                    const isCleared = clearedDungeons.includes(dungeon.id);
                    const isNext    = idx === nextIdx;
                    const isActive  = isNext && level >= dungeon.reqLevel;
                    const rankColor = RANK_COLOR[dungeon.rank] ?? "#7a9abf";

                    return (
                        <motion.div
                            key={dungeon.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={`p-4 flex items-center gap-4 transition-opacity ${isCleared ? "opacity-35" : ""}`}
                        >
                            {/* Rank badge */}
                            <div
                                className="w-10 h-10 flex-shrink-0 flex items-center justify-center border text-xs font-black tracking-wider"
                                style={{
                                    borderColor: isCleared ? "rgba(100,100,100,0.4)" : `${rankColor}66`,
                                    color:        isCleared ? "#444" : rankColor,
                                    background:   isCleared ? "transparent" : `${rankColor}11`,
                                    boxShadow:    isActive  ? `0 0 12px ${rankColor}44` : "none",
                                }}
                            >
                                {dungeon.rank}
                            </div>

                            {/* Dungeon info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-xs font-black uppercase tracking-wider truncate ${isCleared ? "text-gray-600" : "text-white"}`}>
                                        {dungeon.title}
                                    </span>
                                    {dungeon.isInstant && !isCleared && (
                                        <span className="text-[9px] font-black tracking-widest text-[#11D2EF] border border-[#11D2EF]/40 px-1 py-0.5 flex-shrink-0">
                                            INSTANT
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sl-text-dim">
                                    <span>
                                        BOSS:{" "}
                                        <span className={`font-bold ${isCleared ? "text-gray-600" : "text-red-400/80"}`}>
                                            {dungeon.boss}
                                        </span>
                                    </span>
                                    <span>REQ LV {dungeon.reqLevel}</span>
                                    {dungeon.reward && (
                                        <span className={`font-bold ${isCleared ? "text-gray-600" : "text-[#A480F2]/80"}`}>
                                            ✦ {dungeon.reward}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* State indicator */}
                            {isCleared ? (
                                <CheckCircle2 className="w-5 h-5 text-[#11D2EF]/40 flex-shrink-0" />
                            ) : activeDungeon?.id === dungeon.id ? (
                                /* This dungeon is currently active — show progress */
                                <div className="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-red-400">
                                    <Skull className="w-3.5 h-3.5 animate-pulse" />
                                    <span>{activeDungeon.progress}% done</span>
                                </div>
                            ) : isActive ? (
                                /* Awaiting OpenClaw AI to generate tasks */
                                awaitingAssessment === dungeon.id ? (
                                    <div
                                        className="flex-shrink-0 text-[9px] font-black tracking-wide text-right leading-tight"
                                        style={{ maxWidth: "9rem", color: "#f59e0b" }}
                                    >
                                        Awaiting Architect Assessment to generate milestone tasks.
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAwaitingAssessment(dungeon.id)}
                                        className="sl-btn sl-btn-red flex-shrink-0 text-xs px-3 py-1.5 flex items-center gap-1.5"
                                        style={{ minWidth: "7.5rem" }}
                                    >
                                        <Skull className="w-3.5 h-3.5" />
                                        ENTER DUNGEON
                                    </button>
                                )
                            ) : isNext && level < dungeon.reqLevel ? (
                                <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-gray-600 font-bold">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>LV {dungeon.reqLevel}</span>
                                </div>
                            ) : (
                                <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-gray-600 font-bold">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>CLEAR PREV</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {allCleared && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 text-center"
                >
                    <CheckCircle2 className="w-10 h-10 text-[#11D2EF] mx-auto mb-3" />
                    <p className="text-sm font-black tracking-widest text-[#11D2EF] uppercase">Phase I Complete</p>
                    <p className="text-xs sl-text-dim mt-1">All dungeons cleared. Await Phase II.</p>
                </motion.div>
            )}
        </div>
    );
}
