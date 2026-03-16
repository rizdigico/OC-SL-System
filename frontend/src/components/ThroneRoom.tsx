"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Cpu, Settings } from "lucide-react";
import { getCurrentArc } from "@/lib/StorylineEngine";
import { AutoBattler } from "@/components/dungeon/AutoBattler";
import { ShadowBarracks } from "@/components/army/ShadowBarracks";
import { DEFAULT_OWNED_SHADOWS } from "@/lib/ShadowData";
import { SystemConfig } from "@/components/SystemConfig";
import { GuildMetrics } from "@/components/dashboard/GuildMetrics";
import { useAgentState } from "@/hooks/useAgentState";

// ── Dummy Data ────────────────────────────────────────────────────────────────

interface DummyAgent {
    id:     string;
    name:   string;
    rank:   string;
    status: "Executing" | "Idle" | "Success" | "Failed" | "Offline";
    task:   string;
    sr:     number;
    tasks:  number;
}

const DUMMY_AGENTS: DummyAgent[] = [
    { id: "beru",  name: "BERU",  rank: "Commander", status: "Executing", task: "Data Scraping Sprint", sr: 94, tasks: 847 },
    { id: "igris", name: "IGRIS", rank: "Knight",    status: "Idle",      task: "",                    sr: 88, tasks: 312 },
    { id: "bellion", name: "BELLION", rank: "Grand Marshal", status: "Failed", task: "Email Outreach", sr: 72, tasks: 156 },
];

// ── Colour maps ───────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { color: string; pulse: boolean; label: string }> = {
    Executing: { color: "#3b82f6", pulse: true,  label: "EXECUTING" },
    Idle:      { color: "#64748b", pulse: false, label: "IDLE"      },
    Success:   { color: "#22c55e", pulse: false, label: "SUCCESS"   },
    Failed:    { color: "#ef4444", pulse: false, label: "FAILED"    },
    Offline:   { color: "#1e293b", pulse: false, label: "OFFLINE"   },
};

const AGENT_RANK_COLOR: Record<string, string> = {
    Scout:          "#64748b",
    Knight:         "#3b82f6",
    Commander:      "#a855f7",
    General:        "#f97316",
    Marshal:        "#eab308",
    "Grand Marshal": "#f43f5e",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function GlassPanel({
    children,
    className = "",
    accentColor = "#3b82f6",
}: {
    children: React.ReactNode;
    className?: string;
    accentColor?: string;
}) {
    return (
        <div
            className={`relative rounded-xl backdrop-blur-md overflow-hidden ${className}`}
            style={{
                background:   "rgba(9,11,17,0.75)",
                border:       `1px solid ${accentColor}40`,
                boxShadow:    `0 0 30px ${accentColor}18, inset 0 1px 0 ${accentColor}15`,
            }}
        >
            {/* Top glow line */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
            />
            {children}
        </div>
    );
}

function PanelHeader({
    title,
    badge,
    accentColor = "#3b82f6",
    icon,
}: {
    title: string;
    badge?: string;
    accentColor?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div
            className="flex items-center gap-2.5 px-4 py-3 border-b"
            style={{ borderColor: `${accentColor}25` }}
        >
            {icon && <span style={{ color: accentColor }}>{icon}</span>}
            <span
                className="text-[10px] font-black tracking-[0.3em] uppercase"
                style={{ color: accentColor }}
            >
                {title}
            </span>
            {badge && (
                <span className="ml-auto text-[9px] font-bold text-zinc-500 tracking-widest">
                    {badge}
                </span>
            )}
        </div>
    );
}

function AgentCard({ agent }: { agent: DummyAgent }) {
    const cfg       = STATUS_CFG[agent.status]    ?? STATUS_CFG.Offline;
    const rankColor = AGENT_RANK_COLOR[agent.rank] ?? "#64748b";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg p-3 border border-zinc-800/50 bg-zinc-900/30 hover:border-purple-500/25 transition-colors"
        >
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    {/* Status dot */}
                    <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.pulse ? "animate-pulse" : ""}`}
                        style={{ background: cfg.color, boxShadow: cfg.pulse ? `0 0 8px ${cfg.color}` : "none" }}
                    />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                        {agent.name}
                    </span>
                </div>
                <span
                    className="text-[9px] font-black tracking-[0.15em] px-1.5 py-0.5 border rounded"
                    style={{ color: rankColor, borderColor: `${rankColor}40`, background: `${rankColor}12` }}
                >
                    {agent.rank.toUpperCase()}
                </span>
            </div>

            <p className="text-[10px] pl-4 mb-2 truncate" style={{ color: agent.task ? cfg.color : "#374151" }}>
                {agent.task || "— awaiting orders —"}
            </p>

            <div className="flex items-center gap-3 pl-4">
                <span className="text-[9px] font-bold tracking-widest" style={{ color: cfg.color }}>
                    {cfg.label}
                </span>
                <span className="text-[9px] text-zinc-600 ml-auto">{agent.sr}% SR</span>
                <span className="text-[9px] text-zinc-700">{agent.tasks.toLocaleString()} tasks</span>
            </div>

            {/* Success rate bar */}
            <div className="mt-2 h-0.5 bg-zinc-900 rounded-full ml-4 overflow-hidden">
                <div
                    className="h-full rounded-full"
                    style={{
                        width:      `${agent.sr}%`,
                        background: `linear-gradient(90deg, ${cfg.color}50, ${cfg.color})`,
                    }}
                />
            </div>
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ThroneRoom({ user, isPenaltyZone = false, onClearPenalty }: {
    user?: any;
    isPenaltyZone?: boolean;
    onClearPenalty?: () => void;
}) {
    const [initialized,      setInitialized]      = useState(false);
    const [mockTaskProgress, setMockTaskProgress] = useState(0);
    const [isBarracksOpen,   setIsBarracksOpen]   = useState(false);
    const [isConfigOpen,     setIsConfigOpen]     = useState(false);

    const { agents, hasLiveData, maxProgress } = useAgentState();

    // Merge live webhook data over DUMMY_AGENTS (preserves sr/tasks/rank; overrides status/task)
    const STATUS_MAP: Record<string, DummyAgent["status"]> = {
        EXECUTING: "Executing",
        IDLE:      "Idle",
        FAILED:    "Failed",
        COMPLETED: "Success",
    };
    const mergedAgents: DummyAgent[] = DUMMY_AGENTS.map(dummy => {
        const live = agents[dummy.id];
        if (!live) return dummy;
        return {
            ...dummy,
            status: STATUS_MAP[live.status] ?? "Idle",
            task:   live.currentTask,
        };
    });

    // Live agents drive the battler; dev slider is fallback when nothing is executing
    const effectiveProgress = hasLiveData ? (maxProgress ?? 0) : mockTaskProgress;

    const systemAccent = isPenaltyZone ? "#ef4444" : "#3b82f6";
    const userLevel = user?.stats?.level ?? 17;

    // ── System Initialized audio cue ──────────────────────────────────────────
    useEffect(() => {
        if (initialized) return;
        setInitialized(true);
        if (typeof window === "undefined" || !window.speechSynthesis) return;

        // Small delay so the page has settled before speaking
        const timeout = setTimeout(() => {
            const utter       = new SpeechSynthesisUtterance("System Initialized");
            utter.pitch       = 0.7;
            utter.rate        = 0.85;
            utter.volume      = 0.6;
            window.speechSynthesis.speak(utter);
        }, 600);

        return () => clearTimeout(timeout);
    }, [initialized]);

    return (
        <div className="relative w-full min-h-[calc(100vh-120px)]">

            {/* ── Ambient background ──────────────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                <div
                    className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full"
                    style={{ background: isPenaltyZone ? "rgba(239,68,68,0.07)" : "rgba(59,130,246,0.05)" }}
                />
                <div
                    className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] blur-[100px] rounded-full"
                    style={{ background: isPenaltyZone ? "rgba(239,68,68,0.05)" : "rgba(126,34,206,0.05)" }}
                />
                {/* Scan lines */}
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${systemAccent}cc 2px, ${systemAccent}cc 3px)`,
                        backgroundSize:  "100% 4px",
                    }}
                />
                {/* Penalty vignette */}
                {isPenaltyZone && (
                    <motion.div
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{ boxShadow: "inset 0 0 80px rgba(239,68,68,0.15)" }}
                    />
                )}
            </div>

            {/* ── Initialization banner ───────────────────────────────────── */}
            <AnimatePresence>
                {initialized && (
                    <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -8 }}
                        transition={{ delay: 2.5, duration: 0.8 }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-b-lg bg-blue-950/90 border border-t-0 border-blue-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase">
                                System Initialized
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Auto-Battler + dev slider ────────────────────────────── */}
            <div className="relative mb-4 space-y-2">
                <AutoBattler
                    progress={effectiveProgress}
                    arcData={getCurrentArc(userLevel)}
                />
                {/* Dev slider — visible only in development */}
                {process.env.NODE_ENV === "development" && (
                    <div
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
                        style={{
                            background:  "rgba(9,11,17,0.7)",
                            borderColor: hasLiveData ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)",
                        }}
                    >
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {hasLiveData && (
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                            )}
                            <span
                                className="text-[9px] font-black tracking-[0.3em] uppercase whitespace-nowrap"
                                style={{ color: hasLiveData ? "#22c55e" : "#52525b" }}
                            >
                                {hasLiveData ? "Live Agent" : "Task Progress"}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={effectiveProgress}
                            onChange={e => {
                                if (!hasLiveData) setMockTaskProgress(Number(e.target.value));
                            }}
                            disabled={hasLiveData}
                            className="flex-1 accent-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                        <span
                            className="text-[10px] font-black tabular-nums w-8 text-right"
                            style={{ color: hasLiveData ? "#22c55e" : "#52525b" }}
                        >
                            {effectiveProgress}%
                        </span>
                    </div>
                )}
            </div>

            {/* ── 2-panel grid ────────────────────────────────────────────── */}
            <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">

                {/* ══════════════════════════════════════════════════════════
                    CENTER PANEL — Mission Control
                ══════════════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y:  0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <GlassPanel accentColor={systemAccent} className="h-fit">
                        <PanelHeader
                            title="Mission Control"
                            accentColor={systemAccent}
                            icon={<Swords className="w-3.5 h-3.5" />}
                        />
                        <div className="p-4">
                            <GuildMetrics isPenaltyZone={isPenaltyZone} liveAgents={agents} />
                        </div>
                    </GlassPanel>
                </motion.div>

                {/* ══════════════════════════════════════════════════════════
                    RIGHT PANEL — Shadow Army Roster
                ══════════════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x:  0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <GlassPanel accentColor="#a855f7" className="h-fit">
                        <PanelHeader
                            title="Shadow Army"
                            accentColor="#a855f7"
                            icon={<Cpu className="w-3.5 h-3.5" />}
                        />

                        {/* Live badge */}
                        <div
                            className="flex items-center gap-2 px-4 py-2 border-b"
                            style={{ borderColor: "rgba(168,85,247,0.15)" }}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasLiveData ? "bg-green-400" : "bg-purple-500"}`} />
                            <span className={`text-[9px] font-black tracking-[0.3em] ${hasLiveData ? "text-green-400" : "text-purple-500"}`}>
                                {hasLiveData ? "LIVE SIGNAL" : "LIVE TRACKING"}
                            </span>
                            <span className="ml-auto text-[9px] text-zinc-600">
                                {mergedAgents.filter(a => a.status !== "Offline").length} online
                            </span>
                        </div>

                        {/* Fleet summary */}
                        <div
                            className="grid grid-cols-3 divide-x divide-purple-900/30 px-1 py-2 border-b"
                            style={{ borderColor: "rgba(168,85,247,0.12)" }}
                        >
                            {[
                                { label: "Active",    val: mergedAgents.filter(a => a.status === "Executing").length, color: "#3b82f6" },
                                { label: "Idle",      val: mergedAgents.filter(a => a.status === "Idle").length,      color: "#64748b" },
                                { label: "Failed",    val: mergedAgents.filter(a => a.status === "Failed").length,    color: "#ef4444" },
                            ].map(({ label, val, color }) => (
                                <div key={label} className="flex flex-col items-center py-1 gap-0.5">
                                    <span className="text-base font-black" style={{ color }}>{val}</span>
                                    <span className="text-[9px] text-zinc-600 tracking-widest uppercase">{label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 space-y-3">
                            <AnimatePresence>
                                {mergedAgents.map((agent, i) => (
                                    <motion.div
                                        key={agent.id}
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x:  0 }}
                                        transition={{ delay: 0.3 + i * 0.08 }}
                                    >
                                        <AgentCard agent={agent} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* ENTER SHADOW ARMY */}
                            <div className="relative group mt-2">
                                <motion.button
                                    whileHover={!isPenaltyZone ? { scale: 1.02 } : {}}
                                    whileTap={!isPenaltyZone ? { scale: 0.98 } : {}}
                                    onClick={() => !isPenaltyZone && setIsBarracksOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-black text-[10px] tracking-[0.3em] uppercase transition-all duration-200"
                                    style={isPenaltyZone ? {
                                        color:       "#52525b",
                                        borderColor: "rgba(255,255,255,0.08)",
                                        background:  "transparent",
                                        cursor:      "not-allowed",
                                        opacity:     0.5,
                                    } : {
                                        color:       "#b200ff",
                                        borderColor: "rgba(178,0,255,0.45)",
                                        background:  "rgba(178,0,255,0.07)",
                                        boxShadow:   "0 0 16px rgba(178,0,255,0.12), inset 0 0 16px rgba(178,0,255,0.05)",
                                        textShadow:  "0 0 10px rgba(178,0,255,0.6)",
                                    }}
                                >
                                    <Swords className="w-3.5 h-3.5" style={isPenaltyZone ? {} : { filter: "drop-shadow(0 0 4px rgba(178,0,255,0.8))" }} />
                                    Enter Shadow Army
                                </motion.button>
                                {isPenaltyZone && (
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center whitespace-nowrap px-2 py-1 rounded bg-zinc-900 border border-red-500/30 text-[9px] font-bold text-red-400 tracking-wider pointer-events-none z-10">
                                        🔒 LOCKED — Clear Penalty Zone first
                                    </div>
                                )}
                            </div>

                            {/* SYSTEM CONFIG */}
                            <button
                                onClick={() => setIsConfigOpen(true)}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border font-black text-[9px] tracking-[0.25em] uppercase transition-all hover:border-blue-500/30 hover:bg-blue-500/05"
                                style={{
                                    color:       "#3f3f46",
                                    borderColor: "rgba(255,255,255,0.06)",
                                    background:  "transparent",
                                }}
                            >
                                <Settings className="w-3 h-3" />
                                System Config
                            </button>

                            {/* Webhook reference */}
                            <div
                                className="rounded-lg p-3 border"
                                style={{ background: "rgba(168,85,247,0.04)", borderColor: "rgba(168,85,247,0.15)" }}
                            >
                                <p className="text-[9px] font-black tracking-[0.2em] text-purple-500/60 uppercase mb-1.5">
                                    Bind Real Agent
                                </p>
                                <p className="text-[9px] text-zinc-700 font-mono leading-relaxed break-all">
                                    POST /api/agents/webhook<br />
                                    Authorization: Bearer $SECRET
                                </p>
                            </div>
                        </div>
                    </GlassPanel>
                </motion.div>

            </div>

            {/* ── Shadow Barracks modal ────────────────────────────────────── */}
            <ShadowBarracks
                isOpen={isBarracksOpen}
                onClose={() => setIsBarracksOpen(false)}
                ownedShadows={DEFAULT_OWNED_SHADOWS}
            />

            {/* ── System Config modal ──────────────────────────────────────── */}
            <SystemConfig
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
            />
        </div>
    );
}
