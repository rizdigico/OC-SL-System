"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle, Clock, Target, Trophy,
    ChevronRight, X, Timer, Zap, Skull,
} from "lucide-react";
import type { EncounterData } from "@/components/dungeon/DungeonSystem";

// ── Constants ──────────────────────────────────────────────────────────────────

const RANK_COLOR: Record<string, string> = {
    E:  "#64748b",
    D:  "#22c55e",
    C:  "#3b82f6",
    B:  "#f97316",
    A:  "#ef4444",
    S:  "#a855f7",
    "??": "#fde047",
};

const MAX_EXTENSIONS   = 3;
const EXTENSION_DAYS   = 2;

// ── Sub-components ─────────────────────────────────────────────────────────────

function DataRow({
    label,
    value,
    accent,
    icon,
}: {
    label:  string;
    value:  React.ReactNode;
    accent: string;
    icon?:  React.ReactNode;
}) {
    return (
        <div
            className="flex items-center justify-between py-2.5 px-3 rounded-lg border"
            style={{ background: `${accent}07`, borderColor: `${accent}20` }}
        >
            <div className="flex items-center gap-2">
                {icon && <span style={{ color: accent }}>{icon}</span>}
                <span className="text-[9px] font-black tracking-[0.25em] uppercase text-zinc-500">
                    {label}
                </span>
            </div>
            <span className="text-[11px] font-black" style={{ color: accent }}>
                {value}
            </span>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface MissionBriefingProps {
    encounter: EncounterData;
    onAccept:  () => void;
    onDecline: () => void;
}

export function MissionBriefing({ encounter, onAccept, onDecline }: MissionBriefingProps) {
    const [timeExtensions, setTimeExtensions] = useState(0);

    const accent        = encounter.isRedGate ? "#ef4444" : (RANK_COLOR[encounter.rank] ?? "#3b82f6");
    const effectiveDays = encounter.timeLimitDays + timeExtensions * EXTENSION_DAYS;
    const extensionsLeft = MAX_EXTENSIONS - timeExtensions;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9982] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
            {/* ── Ambient corner glow ──────────────────────────────────────── */}
            <div
                className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
                style={{ background: `radial-gradient(circle at 0% 0%, ${accent}12 0%, transparent 70%)` }}
            />
            <div
                className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
                style={{ background: `radial-gradient(circle at 100% 100%, ${accent}10 0%, transparent 70%)` }}
            />

            {/* ── Scanlines ────────────────────────────────────────────────── */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.025]"
                style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${accent} 2px, ${accent} 3px)`,
                    backgroundSize:  "100% 4px",
                }}
            />

            {/* ── Panel ────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ scale: 0.94, y: 20 }}
                animate={{ scale: 1,    y:  0 }}
                exit={{ scale: 0.94, y: 20 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="relative w-full max-w-lg rounded-2xl overflow-hidden"
                style={{
                    background:     "rgba(4,4,12,0.98)",
                    border:         `1px solid ${accent}50`,
                    boxShadow:      `0 0 50px ${accent}20, 0 0 120px ${accent}08, inset 0 0 40px ${accent}04`,
                    backdropFilter: "blur(20px)",
                }}
            >
                {/* Top glow line */}
                <motion.div
                    animate={{
                        opacity: encounter.isRedGate ? [0.6, 1, 0.6] : 1,
                    }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                />

                {/* ── Header ───────────────────────────────────────────────── */}
                <div
                    className="px-6 py-4 border-b flex items-center justify-between"
                    style={{ borderColor: `${accent}20` }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                                background: `${accent}15`,
                                border:     `1.5px solid ${accent}50`,
                                boxShadow:  `0 0 12px ${accent}30`,
                            }}
                        >
                            <Skull className="w-4 h-4" style={{ color: accent }} />
                        </div>
                        <div>
                            <p
                                className="text-[10px] font-black tracking-[0.4em] uppercase"
                                style={{ color: accent, textShadow: `0 0 12px ${accent}60` }}
                            >
                                Mission Briefing
                            </p>
                            <p className="text-[8px] text-zinc-700 tracking-widest uppercase">
                                {encounter.isRedGate ? "Red Gate — No Retreat" : `${encounter.rank}-Rank Gate`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onDecline}
                        className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all"
                    >
                        <X className="w-3.5 h-3.5 text-zinc-600" />
                    </button>
                </div>

                <div className="p-6 space-y-5">

                    {/* ── Gate title ───────────────────────────────────────── */}
                    <div>
                        <p
                            className="text-xl font-black uppercase tracking-widest leading-tight"
                            style={{ color: accent, textShadow: `0 0 16px ${accent}60` }}
                        >
                            {encounter.title}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">
                            {encounter.description}
                        </p>
                    </div>

                    {/* ── Intel block ──────────────────────────────────────── */}
                    <div className="space-y-2">
                        <p className="text-[8px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-3">
                            Gate Intel
                        </p>

                        <DataRow
                            label="Objective"
                            value={encounter.goal}
                            accent={accent}
                            icon={<Target className="w-3.5 h-3.5" />}
                        />

                        {encounter.boss && (
                            <DataRow
                                label="Boss"
                                value={encounter.boss}
                                accent="#ef4444"
                                icon={<Skull className="w-3.5 h-3.5" />}
                            />
                        )}

                        <DataRow
                            label="Time Limit"
                            value={
                                <span className="flex items-center gap-1.5">
                                    <span>{effectiveDays} Days</span>
                                    {timeExtensions > 0 && (
                                        <span className="text-[8px] text-green-400">
                                            +{timeExtensions * EXTENSION_DAYS}d
                                        </span>
                                    )}
                                </span>
                            }
                            accent="#eab308"
                            icon={<Clock className="w-3.5 h-3.5" />}
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <DataRow
                                label="EXP"
                                value={`+${encounter.exp.toLocaleString()}`}
                                accent="#3b82f6"
                                icon={<Zap className="w-3.5 h-3.5" />}
                            />
                            <DataRow
                                label="Gold"
                                value={`+${encounter.gold.toLocaleString()} G`}
                                accent="#eab308"
                                icon={<Trophy className="w-3.5 h-3.5" />}
                            />
                        </div>

                        {encounter.unlocks && (
                            <DataRow
                                label="Unlocks"
                                value={encounter.unlocks}
                                accent="#a855f7"
                                icon={<Zap className="w-3.5 h-3.5" />}
                            />
                        )}
                    </div>

                    {/* ── Extension control ────────────────────────────────── */}
                    <div
                        className="rounded-xl border p-3"
                        style={{ background: "rgba(234,179,8,0.04)", borderColor: "rgba(234,179,8,0.18)" }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Timer className="w-3.5 h-3.5 text-yellow-500/60" />
                                <span className="text-[9px] font-black tracking-widest text-yellow-500/60 uppercase">
                                    Time Extensions
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: MAX_EXTENSIONS }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-4 h-1.5 rounded-full"
                                        style={{
                                            background: i < timeExtensions
                                                ? "rgba(234,179,8,0.8)"
                                                : "rgba(255,255,255,0.08)",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <motion.button
                            whileHover={extensionsLeft > 0 ? { scale: 1.02 } : {}}
                            whileTap={extensionsLeft > 0 ? { scale: 0.97 } : {}}
                            onClick={() => extensionsLeft > 0 && setTimeExtensions(e => e + 1)}
                            className="w-full mt-2.5 py-2 rounded-lg border text-[9px] font-black tracking-[0.25em] uppercase transition-all"
                            style={
                                extensionsLeft > 0
                                    ? {
                                          color:       "#eab308",
                                          borderColor: "rgba(234,179,8,0.35)",
                                          background:  "rgba(234,179,8,0.07)",
                                      }
                                    : {
                                          color:       "#3f3f46",
                                          borderColor: "rgba(255,255,255,0.05)",
                                          background:  "transparent",
                                          cursor:      "not-allowed",
                                      }
                            }
                        >
                            {extensionsLeft > 0
                                ? `Request Extension  (${extensionsLeft} Remaining)`
                                : "No Extensions Remaining"}
                        </motion.button>
                    </div>

                    {/* ── Danger warning ───────────────────────────────────── */}
                    <motion.div
                        animate={encounter.isRedGate ? { opacity: [1, 0.7, 1] } : {}}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="rounded-xl border p-3"
                        style={{
                            background:  "rgba(239,68,68,0.05)",
                            borderColor: "rgba(239,68,68,0.35)",
                            boxShadow:   "0 0 16px rgba(239,68,68,0.1)",
                        }}
                    >
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p
                                className="text-[9px] font-black leading-relaxed tracking-wide"
                                style={{
                                    color:      "#ef4444",
                                    textShadow: "0 0 8px rgba(239,68,68,0.4)",
                                }}
                            >
                                WARNING: ONCE ENTERED, YOU CANNOT LEAVE.
                                FAILURE TO COMPLETE OBJECTIVES BEFORE THE
                                DEADLINE RESULTS IN SYSTEM PENALTY.
                            </p>
                        </div>
                    </motion.div>

                    {/* ── Action buttons ───────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onDecline}
                            className="py-3 rounded-xl border font-black text-[10px] tracking-[0.25em] uppercase transition-all"
                            style={{
                                color:       "#52525b",
                                borderColor: "rgba(255,255,255,0.08)",
                                background:  "transparent",
                            }}
                        >
                            Decline
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onAccept}
                            className="py-3 rounded-xl border font-black text-[10px] tracking-[0.3em] uppercase"
                            style={{
                                color:       accent,
                                borderColor: `${accent}55`,
                                background:  `${accent}12`,
                                boxShadow:   `0 0 20px ${accent}25`,
                                textShadow:  `0 0 10px ${accent}70`,
                            }}
                        >
                            Accept <ChevronRight className="inline w-3.5 h-3.5" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
