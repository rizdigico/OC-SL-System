"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock, CheckCircle2, Swords, Map, Zap,
    Clock, Target, AlertTriangle, SkipForward,
} from "lucide-react";
import { STORY_ARCS, type StoryArc } from "@/lib/StorylineEngine";
import { AutoBattler } from "@/components/dungeon/AutoBattler";
import { MissionBriefing } from "@/components/dungeon/MissionBriefing";

// ── Shared encounter type (exported for MissionBriefing) ──────────────────────

export interface EncounterData {
    id:            string;
    title:         string;
    rank:          string;
    isRedGate:     boolean;
    boss?:         string;
    goal:          string;
    description:   string;
    timeLimitDays: number;
    exp:           number;
    gold:          number;
    mobs?:         string[];
    unlocks?:      string;
    /** Arc reference for AutoBattler */
    storyArc?:     StoryArc;
}

// ── Rank / colour maps ────────────────────────────────────────────────────────

const ARC_RANK: Record<string, string> = {
    "The Double Dungeon":  "E",
    "C-Rank Strike Squad": "C",
    "The Red Gate":        "B",
    "Job Change Quest":    "S",
    "Demon Castle":        "A",
    "Jeju Island Raid":    "S",
    "The Monarch War":     "S",
    "The Final Battle":    "??",
};

const RANK_COLOR: Record<string, string> = {
    E:  "#64748b",
    D:  "#22c55e",
    C:  "#3b82f6",
    B:  "#f97316",
    A:  "#ef4444",
    S:  "#a855f7",
    "??": "#fde047",
};

// ── Active Gate dummy data ─────────────────────────────────────────────────────

interface GateData {
    id:          string;
    rank:        string;
    title:       string;
    description: string;
    goal:        string;
    timeLimit:   string;
    timeDays:    number;
    exp:         number;
    gold:        number;
    isRedGate:   boolean;
}

const DUMMY_GATES: GateData[] = [
    {
        id:          "revenue-sprint",
        rank:        "C",
        title:       "Revenue Sprint: $1,000",
        description: "Agents have detected a high-value opportunity window. Execute fast and close before the gate collapses.",
        goal:        "Close 2 Deals",
        timeLimit:   "7 Days",
        timeDays:    7,
        exp:         300,
        gold:        1000,
        isRedGate:   false,
    },
    {
        id:          "deep-work",
        rank:        "B",
        title:       "Deep Work Isolation",
        description: "A Red Gate has manifested. No retreat is possible. The outside world is cut off. Achieve focused output or face penalty.",
        goal:        "Code for 20 hours",
        timeLimit:   "3 Days",
        timeDays:    3,
        exp:         500,
        gold:        2000,
        isRedGate:   true,
    },
    {
        id:          "cold-outreach",
        rank:        "D",
        title:       "Cold Outreach Blitz",
        description: "Shadow scouts have identified 50 high-value targets. Contact them all before the window closes.",
        goal:        "Send 50 outreach messages",
        timeLimit:   "5 Days",
        timeDays:    5,
        exp:         150,
        gold:        500,
        isRedGate:   false,
    },
];

// ── Conversion helpers ─────────────────────────────────────────────────────────

function arcToEncounter(arc: StoryArc): EncounterData {
    const rank = ARC_RANK[arc.arc] ?? "E";
    return {
        id:            arc.arc,
        title:         arc.arc,
        rank,
        isRedGate:     arc.arc === "The Red Gate",
        boss:          arc.boss,
        goal:          `Defeat ${arc.boss}`,
        description:   `Enter the ${arc.arc} dungeon and conquer every enemy within.`,
        timeLimitDays: 30,
        exp:           arc.minLevel * 50,
        gold:          arc.minLevel * 25,
        mobs:          arc.mobs,
        unlocks:       arc.unlocks,
        storyArc:      arc,
    };
}

function gateToEncounter(gate: GateData): EncounterData {
    return {
        id:            gate.id,
        title:         gate.title,
        rank:          gate.rank,
        isRedGate:     gate.isRedGate,
        goal:          gate.goal,
        description:   gate.description,
        timeLimitDays: gate.timeDays,
        exp:           gate.exp,
        gold:          gate.gold,
        storyArc: {
            minLevel: 1,
            maxLevel: 999,
            arc:      gate.title,
            mobs:     ["Gate Enemy"],
            boss:     gate.title,
        },
    };
}

// ── Arc node status ────────────────────────────────────────────────────────────

type ArcStatus = "CLEARED" | "ACTIVE" | "LOCKED";

function getArcStatus(arc: StoryArc, userLevel: number): ArcStatus {
    if (userLevel > arc.maxLevel)                               return "CLEARED";
    if (userLevel >= arc.minLevel && userLevel <= arc.maxLevel) return "ACTIVE";
    return "LOCKED";
}

// ── Penalty Zone overlay ──────────────────────────────────────────────────────

function PenaltyZone({ onDismiss }: { onDismiss: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/97 backdrop-blur-md overflow-hidden"
            style={{ pointerEvents: "all" }}
        >
            {/* Aggressive red vignette */}
            <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.15) 0%, transparent 65%)" }}
            />

            {/* Scanlines */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,1) 2px, rgba(239,68,68,1) 3px)",
                    backgroundSize:  "100% 4px",
                }}
            />

            {/* Flashing border frame */}
            <motion.div
                animate={{ borderColor: ["rgba(239,68,68,0.2)", "rgba(239,68,68,0.9)", "rgba(239,68,68,0.2)"] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                className="absolute inset-4 rounded-2xl border-2 pointer-events-none"
            />

            {/* Content */}
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1,    opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 180 }}
                className="flex flex-col items-center gap-6 text-center px-8 max-w-md"
            >
                <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                >
                    <AlertTriangle
                        className="w-20 h-20"
                        style={{
                            color:  "#ef4444",
                            filter: "drop-shadow(0 0 20px rgba(239,68,68,0.9))",
                        }}
                    />
                </motion.div>

                <div className="space-y-2">
                    <motion.p
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="text-3xl font-black tracking-[0.4em] uppercase"
                        style={{ color: "#ef4444", textShadow: "0 0 30px rgba(239,68,68,0.8)" }}
                    >
                        Penalty Zone
                    </motion.p>
                    <p className="text-[11px] font-black tracking-[0.3em] uppercase text-red-500/60">
                        System Penalty Active
                    </p>
                </div>

                <div
                    className="rounded-xl border p-4 w-full"
                    style={{
                        background:  "rgba(239,68,68,0.05)",
                        borderColor: "rgba(239,68,68,0.35)",
                    }}
                >
                    <p className="text-[10px] font-black text-red-400 leading-relaxed tracking-wide">
                        YOU HAVE FAILED TO COMPLETE YOUR MISSION WITHIN
                        THE ALLOTTED TIME. THE SYSTEM HAS DETECTED YOUR
                        WEAKNESS. PENALTY PROTOCOL ENGAGED.
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-[9px] text-zinc-700 tracking-widest uppercase">
                        Dashboard access suspended
                    </p>
                    <p className="text-[9px] text-zinc-800 tracking-widest uppercase">
                        Complete your obligations to lift the penalty
                    </p>
                </div>

                {/* Dev-only dismiss */}
                {process.env.NODE_ENV === "development" && (
                    <button
                        onClick={onDismiss}
                        className="text-[8px] font-black tracking-[0.3em] uppercase px-4 py-2 rounded-lg border transition-all hover:scale-105"
                        style={{
                            color:       "#ef4444",
                            borderColor: "rgba(239,68,68,0.3)",
                            background:  "rgba(239,68,68,0.07)",
                        }}
                    >
                        [DEV] Lift Penalty
                    </button>
                )}
            </motion.div>
        </motion.div>
    );
}

// ── Timeline node ──────────────────────────────────────────────────────────────

function TimelineNode({
    arc,
    status,
    isLast,
    idx,
    onEnter,
}: {
    arc:     StoryArc;
    status:  ArcStatus;
    isLast:  boolean;
    idx:     number;
    onEnter: (arc: StoryArc) => void;
}) {
    const rank      = ARC_RANK[arc.arc] ?? "E";
    const rankColor = RANK_COLOR[rank] ?? "#64748b";

    const nodeColor =
        status === "CLEARED" ? "#3b82f6" :
        status === "ACTIVE"  ? "#a855f7" :
        "#27272a";

    const borderColor =
        status === "CLEARED" ? "#3b82f6" :
        status === "ACTIVE"  ? "#a855f7" :
        "#27272a";

    return (
        <div className="relative flex gap-4">
            {/* Spine */}
            <div className="flex flex-col items-center flex-shrink-0 w-8">
                <motion.div
                    animate={status === "ACTIVE" ? {
                        boxShadow: [`0 0 0px ${nodeColor}`, `0 0 18px ${nodeColor}`, `0 0 0px ${nodeColor}`],
                    } : {}}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10"
                    style={{
                        background:  status === "LOCKED" ? "rgba(9,8,18,0.9)" : `${nodeColor}18`,
                        borderColor: nodeColor,
                    }}
                >
                    {status === "CLEARED" ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "#3b82f6" }} />
                    ) : status === "ACTIVE" ? (
                        <Swords className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
                    ) : (
                        <Lock className="w-3 h-3 text-zinc-700" />
                    )}
                </motion.div>
                {!isLast && (
                    <div
                        className="w-px flex-1 mt-1"
                        style={{
                            minHeight:  "32px",
                            background: status === "CLEARED"
                                ? "linear-gradient(180deg, #3b82f660, #27272a)"
                                : status === "ACTIVE"
                                ? "linear-gradient(180deg, #a855f760, #27272a)"
                                : "#1c1c1e",
                        }}
                    />
                )}
            </div>

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.3 }}
                className="relative flex-1 rounded-xl border mb-4 overflow-hidden"
                style={{
                    background:  "rgba(9,8,18,0.8)",
                    borderColor: borderColor + (status === "LOCKED" ? "28" : "55"),
                    boxShadow:   status !== "LOCKED" ? `0 0 18px ${nodeColor}18` : "none",
                    opacity:     status === "CLEARED" ? 0.72 : 1,
                }}
            >
                {status !== "LOCKED" && (
                    <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: `linear-gradient(90deg, transparent, ${borderColor}80, transparent)` }}
                    />
                )}

                <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="text-[8px] font-black tracking-[0.2em] px-1.5 py-0.5 rounded border"
                                style={{
                                    color:       rankColor,
                                    borderColor: `${rankColor}50`,
                                    background:  `${rankColor}15`,
                                }}
                            >
                                {rank}-RANK
                            </span>
                            {status === "CLEARED" && (
                                <span className="text-[8px] font-black tracking-widest text-blue-400">✓ CLEARED</span>
                            )}
                            {status === "ACTIVE" && (
                                <motion.span
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    className="text-[8px] font-black tracking-widest uppercase"
                                    style={{ color: "#a855f7" }}
                                >
                                    ◆ ACTIVE
                                </motion.span>
                            )}
                        </div>
                        <span className="text-[9px] text-zinc-600 font-bold flex-shrink-0">
                            LV {arc.minLevel === arc.maxLevel ? arc.minLevel : `${arc.minLevel}–${arc.maxLevel === Infinity ? "∞" : arc.maxLevel}`}
                        </span>
                    </div>

                    <p
                        className="text-sm font-black uppercase tracking-wide mb-1"
                        style={{
                            color: status === "LOCKED" ? "#3f3f46" :
                                   status === "CLEARED" ? "#60a5fa" : "#c4b5fd",
                        }}
                    >
                        {arc.arc}
                    </p>

                    <p className="text-[10px] mb-3" style={{ color: status === "LOCKED" ? "#27272a" : "#71717a" }}>
                        Boss: <span style={{ color: status === "LOCKED" ? "#3f3f46" : "#ef4444" }}>{arc.boss}</span>
                    </p>

                    {arc.unlocks && status !== "LOCKED" && (
                        <div
                            className="flex items-center gap-1.5 mb-3 px-2 py-1 rounded-lg border w-fit"
                            style={{ background: "rgba(168,85,247,0.07)", borderColor: "rgba(168,85,247,0.25)" }}
                        >
                            <Zap className="w-2.5 h-2.5 text-purple-400" />
                            <span className="text-[8px] font-black text-purple-400 tracking-widest uppercase">
                                Unlocks: {arc.unlocks}
                            </span>
                        </div>
                    )}

                    {status === "ACTIVE" && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onEnter(arc)}
                            className="w-full py-2.5 rounded-lg border font-black text-[10px] tracking-[0.3em] uppercase"
                            style={{
                                color:       "#c4b5fd",
                                borderColor: "rgba(168,85,247,0.55)",
                                background:  "rgba(168,85,247,0.1)",
                                boxShadow:   "0 0 14px rgba(168,85,247,0.2)",
                                textShadow:  "0 0 8px rgba(168,85,247,0.6)",
                            }}
                        >
                            Enter Dungeon →
                        </motion.button>
                    )}

                    {status === "LOCKED" && (
                        <div
                            className="flex items-center gap-2 py-2 px-3 rounded-lg border"
                            style={{ background: "rgba(9,8,18,0.5)", borderColor: "rgba(255,255,255,0.05)" }}
                        >
                            <Lock className="w-3 h-3 text-zinc-700" />
                            <span className="text-[9px] font-black tracking-widest text-zinc-700 uppercase">
                                Requires Level {arc.minLevel}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// ── Gate card ──────────────────────────────────────────────────────────────────

function GateCard({ gate, idx, onEnter }: { gate: GateData; idx: number; onEnter: (g: GateData) => void }) {
    const rankColor = RANK_COLOR[gate.rank] ?? "#64748b";
    const accent    = gate.isRedGate ? "#ef4444" : rankColor;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y:  0 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            className={`relative rounded-xl border overflow-hidden flex flex-col ${gate.isRedGate ? "animate-pulse" : ""}`}
            style={{
                background:  `${accent}08`,
                borderColor: `${accent}${gate.isRedGate ? "80" : "45"}`,
                boxShadow:   gate.isRedGate
                    ? `0 0 30px ${accent}35, 0 0 60px ${accent}15`
                    : `0 0 16px ${accent}18`,
            }}
        >
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                    background: gate.isRedGate
                        ? `linear-gradient(90deg, transparent, ${accent}, transparent)`
                        : `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
                }}
            />
            {gate.isRedGate && (
                <motion.div
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 100% 0%, ${accent}30 0%, transparent 70%)` }}
                />
            )}

            <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span
                            className="text-[8px] font-black tracking-[0.2em] px-1.5 py-0.5 rounded border"
                            style={{ color: accent, borderColor: `${accent}55`, background: `${accent}15` }}
                        >
                            {gate.rank}-RANK
                        </span>
                        {gate.isRedGate && (
                            <motion.span
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                                className="text-[8px] font-black tracking-widest text-red-400 uppercase"
                            >
                                ⚠ RED GATE
                            </motion.span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-zinc-600">
                        <Clock className="w-3 h-3" />
                        <span className="text-[9px] font-bold">{gate.timeLimit}</span>
                    </div>
                </div>

                <p className="text-sm font-black uppercase tracking-wide leading-tight"
                   style={{ color: accent, textShadow: `0 0 8px ${accent}40` }}>
                    {gate.title}
                </p>

                <p className="text-[10px] text-zinc-600 leading-relaxed flex-1">{gate.description}</p>

                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{ background: `${accent}0a`, borderColor: `${accent}28` }}
                >
                    <Target className="w-3 h-3 flex-shrink-0" style={{ color: accent }} />
                    <span className="text-[10px] font-black tracking-wider" style={{ color: accent }}>
                        {gate.goal}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-blue-400">{gate.exp} EXP</span>
                    <span className="text-[9px] font-bold text-yellow-400">{gate.gold.toLocaleString()} G</span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onEnter(gate)}
                    className="w-full py-2.5 rounded-lg border font-black text-[10px] tracking-[0.3em] uppercase mt-auto"
                    style={{
                        color:       accent,
                        borderColor: `${accent}55`,
                        background:  `${accent}10`,
                        boxShadow:   `0 0 14px ${accent}20`,
                        textShadow:  `0 0 8px ${accent}60`,
                    }}
                >
                    {gate.isRedGate ? "⚠ Enter Red Gate" : "Enter Gate →"}
                </motion.button>
            </div>
        </motion.div>
    );
}

// ── Battle screen ──────────────────────────────────────────────────────────────

function BattleScreen({
    encounter,
    onTimeout,
}: {
    encounter: EncounterData;
    onTimeout: () => void;
}) {
    const [progress, setProgress] = useState(0);
    const accent = encounter.isRedGate ? "#ef4444" : (RANK_COLOR[encounter.rank] ?? "#3b82f6");

    const arc: StoryArc = encounter.storyArc ?? {
        minLevel: 1,
        maxLevel: 999,
        arc:      encounter.title,
        mobs:     encounter.mobs ?? ["Enemy"],
        boss:     encounter.boss ?? encounter.title,
    };

    return (
        <div className="space-y-4">
            {/* Lock banner */}
            <motion.div
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style={{
                    background:  `${accent}07`,
                    borderColor: `${accent}40`,
                    boxShadow:   `0 0 16px ${accent}12`,
                }}
            >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: accent }}>
                    Gate Active — You are locked in. Complete your objective.
                </p>
            </motion.div>

            {/* AutoBattler */}
            <AutoBattler progress={progress} arcData={arc} />

            {/* Dev controls */}
            {process.env.NODE_ENV === "development" && (
                <div
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
                    style={{ background: "rgba(9,11,17,0.7)", borderColor: "rgba(255,255,255,0.07)" }}
                >
                    <span className="text-[9px] font-black tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
                        Battle Progress
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={progress}
                        onChange={e => setProgress(Number(e.target.value))}
                        className="flex-1 accent-purple-500 cursor-pointer"
                    />
                    <span className="text-[10px] font-black text-zinc-500 tabular-nums w-8 text-right">
                        {progress}%
                    </span>
                    <button
                        onClick={onTimeout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black tracking-wider uppercase"
                        style={{
                            color:       "#ef4444",
                            borderColor: "rgba(239,68,68,0.4)",
                            background:  "rgba(239,68,68,0.07)",
                        }}
                    >
                        <SkipForward className="w-3 h-3" />
                        Force Timeout
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface DungeonSystemProps {
    userLevel: number;
}

export function DungeonSystem({ userLevel }: DungeonSystemProps) {
    const [tab,             setTab]             = useState<"storyline" | "gates">("storyline");
    const [activeEncounter, setActiveEncounter] = useState<EncounterData | null>(null);
    const [inBattle,        setInBattle]        = useState(false);
    const [isPenalty,       setIsPenalty]       = useState(false);

    const handleEnterArc  = (arc:  StoryArc) => { setActiveEncounter(arcToEncounter(arc));  setInBattle(false); };
    const handleEnterGate = (gate: GateData) => { setActiveEncounter(gateToEncounter(gate)); setInBattle(false); };
    const handleAccept    = ()               => { setInBattle(true); };
    const handleDecline   = ()               => { setActiveEncounter(null); setInBattle(false); };
    const handleTimeout   = ()               => { setIsPenalty(true); };
    const handleLiftPenalty = ()             => { setIsPenalty(false); setInBattle(false); setActiveEncounter(null); };

    return (
        <>
            <div
                className="rounded-xl overflow-hidden border"
                style={{
                    background:  "rgba(6,7,14,0.92)",
                    borderColor: "rgba(99,102,241,0.25)",
                    boxShadow:   "0 0 30px rgba(99,102,241,0.08)",
                }}
            >
                {/* Top glow */}
                <div
                    className="h-px w-full"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(59,130,246,0.6), transparent)" }}
                />

                {/* ── Tab bar ──────────────────────────────────────────────── */}
                {!inBattle && (
                    <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <button
                            onClick={() => setTab("storyline")}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-[10px] font-black tracking-[0.25em] uppercase relative transition-colors"
                            style={{ color: tab === "storyline" ? "#c4b5fd" : "#3f3f46" }}
                        >
                            <Map className="w-3.5 h-3.5" />
                            Main Storyline
                            {tab === "storyline" && (
                                <motion.div
                                    layoutId="dungeon-tab"
                                    className="absolute bottom-0 left-0 right-0 h-px"
                                    style={{ background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() => setTab("gates")}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-[10px] font-black tracking-[0.25em] uppercase relative transition-colors"
                            style={{ color: tab === "gates" ? "#60a5fa" : "#3f3f46" }}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            Active Gates
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            {tab === "gates" && (
                                <motion.div
                                    layoutId="dungeon-tab"
                                    className="absolute bottom-0 left-0 right-0 h-px"
                                    style={{ background: "linear-gradient(90deg, transparent, #3b82f6, transparent)" }}
                                />
                            )}
                        </button>
                    </div>
                )}

                {/* ── Body ─────────────────────────────────────────────────── */}
                <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>

                    {/* Battle mode */}
                    {inBattle && activeEncounter ? (
                        <BattleScreen encounter={activeEncounter} onTimeout={handleTimeout} />
                    ) : (
                        <AnimatePresence mode="wait">

                            {/* Storyline tab */}
                            {tab === "storyline" && (
                                <motion.div
                                    key="storyline"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* Legend */}
                                    <div className="flex items-center gap-4 mb-5 flex-wrap">
                                        {([
                                            { color: "#3b82f6", label: "Cleared" },
                                            { color: "#a855f7", label: "Active"  },
                                            { color: "#3f3f46", label: "Locked"  },
                                        ] as const).map(({ color, label }) => (
                                            <div key={label} className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{label}</span>
                                            </div>
                                        ))}
                                        <span className="ml-auto text-[9px] text-zinc-700 font-bold">
                                            Your Level: <span className="text-zinc-400">{userLevel}</span>
                                        </span>
                                    </div>

                                    {STORY_ARCS.map((arc, i) => (
                                        <TimelineNode
                                            key={arc.arc}
                                            arc={arc}
                                            status={getArcStatus(arc, userLevel)}
                                            isLast={i === STORY_ARCS.length - 1}
                                            idx={i}
                                            onEnter={handleEnterArc}
                                        />
                                    ))}
                                </motion.div>
                            )}

                            {/* Gates tab */}
                            {tab === "gates" && (
                                <motion.div
                                    key="gates"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-[9px] font-black tracking-[0.35em] text-blue-500/60 uppercase">
                                                Agent-Generated Gates
                                            </p>
                                            <p className="text-[8px] text-zinc-700 mt-0.5">
                                                Optional side-dungeons with real-world objectives
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[8px] font-bold text-blue-500/60 tracking-widest uppercase">
                                                {DUMMY_GATES.length} Active
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {DUMMY_GATES.map((gate, i) => (
                                            <GateCard key={gate.id} gate={gate} idx={i} onEnter={handleEnterGate} />
                                        ))}
                                    </div>

                                    <p className="text-[9px] text-zinc-800 text-center mt-6 tracking-widest uppercase">
                                        New gates spawn as OpenClaw agents detect opportunities
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* ── Mission Briefing overlay ─────────────────────────────────── */}
            <AnimatePresence>
                {activeEncounter && !inBattle && (
                    <MissionBriefing
                        encounter={activeEncounter}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                    />
                )}
            </AnimatePresence>

            {/* ── Penalty Zone overlay ─────────────────────────────────────── */}
            <AnimatePresence>
                {isPenalty && <PenaltyZone onDismiss={handleLiftPenalty} />}
            </AnimatePresence>
        </>
    );
}
