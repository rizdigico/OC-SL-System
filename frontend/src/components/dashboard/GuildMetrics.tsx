"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, Dumbbell, BookOpen,
    ArrowUpRight, CheckCircle2, AlertTriangle,
    Flame, FileText, Radio,
} from "lucide-react";
import type { AgentStateMap } from "@/lib/agent-store";

// ── Types ──────────────────────────────────────────────────────────────────────

type Guild      = "Business" | "Fitness" | "Life";
type TaskStatus = "running"  | "queued"  | "done"   | "failed";
type Priority   = "critical" | "high"    | "medium" | "low";

// ── Mock Data ─────────────────────────────────────────────────────────────────

const BUSINESS = {
    mrr:      "$12,450",
    mrrChange: "+8.3%",
    clients: [
        { name: "Quantum Corp",    pct: 78, color: "#3b82f6" },
        { name: "NovaMind AI",     pct: 45, color: "#a855f7" },
        { name: "Apex Capital",    pct: 91, color: "#22c55e" },
        { name: "SkyBridge Media", pct: 33, color: "#f97316" },
    ],
    kpis: [
        { label: "Conversion Rate", value: "4.2%" },
        { label: "Active Leads",    value: "14"   },
        { label: "Avg Agent SR",    value: "96%"  },
        { label: "Churn Rate",      value: "1.8%" },
    ],
    pipeline: [
        { name: "Founder AI",      stage: "Demo Scheduled", value: "$2,400/mo", hot: true  },
        { name: "Torchlight Labs", stage: "Proposal Sent",  value: "$1,800/mo", hot: true  },
        { name: "NexGen Capital",  stage: "First Contact",  value: "$900/mo",   hot: false },
        { name: "Vortex Studio",   stage: "Negotiation",    value: "$3,200/mo", hot: false },
    ],
    agentReports: [
        { title: "Weekly Scraping Summary",   status: "READY FOR REVIEW", color: "#3b82f6" },
        { title: "Outreach Campaign Alpha",   status: "CONCLUDED",         color: "#22c55e" },
        { title: "Competitor Price Analysis", status: "IN PROGRESS",       color: "#f97316" },
    ],
    quarterlyGoals: [
        { label: "Hit $15k MRR",       pct: 83, color: "#3b82f6" },
        { label: "Close 3 Enterprise", pct: 67, color: "#a855f7" },
        { label: "Hire 2nd Dev",       pct: 40, color: "#22c55e" },
    ],
    tasks: [
        { agent: "BERU",   task: "Scraping competitor pricing — page 3/12",  status: "running" as TaskStatus },
        { agent: "IGRIS",  task: "Drafting proposal: Apex Capital Q3 deal",  status: "running" as TaskStatus },
        { agent: "IRON",   task: "Follow-up email sequence: 7 leads queued", status: "queued"  as TaskStatus },
        { agent: "BERU",   task: "LinkedIn outreach: SaaS founders batch",   status: "done"    as TaskStatus },
        { agent: "SYSTEM", task: "CRM sync: 23 contacts updated",            status: "done"    as TaskStatus },
    ],
};

const FITNESS = {
    bodyFat: 14,
    prs: [
        { lift: "Bench",    weight: 102.5, unit: "kg", delta: "+2.5kg" },
        { lift: "Squat",    weight: 140,   unit: "kg", delta: "+5.0kg" },
        { lift: "Deadlift", weight: 175,   unit: "kg", delta: "—"      },
    ],
    week: [
        { day: "M", done: true  },
        { day: "T", done: true  },
        { day: "W", done: false },
        { day: "T", done: true  },
        { day: "F", done: true  },
        { day: "S", done: false },
        { day: "S", done: false },
    ],
    todaySplit: {
        day:       "Day 3",
        focus:     "Pull — Back / Biceps",
        type:      "Hypertrophy",
        exercises: ["Deadlift 4×5", "Barbell Row 4×8", "Pull-ups 3×F", "Bicep Curl 3×12"],
    },
    trends: [
        { lift: "Bench Press", trend: "+10 lbs",  dir:  1 },
        { lift: "Squat",       trend: "+15 lbs",  dir:  1 },
        { lift: "Deadlift",    trend: "+0 lbs",   dir:  0 },
        { lift: "Body Weight", trend: "-1.2 lbs", dir: -1 },
    ],
};

const LIFE = {
    deepWork: { hours: 22.5, goal: 30 },
    habits: [
        { name: "Reading",     streak: 14, color: "#3b82f6" },
        { name: "Meditation",  streak:  7, color: "#a855f7" },
        { name: "Cold Shower", streak: 21, color: "#22c55e" },
        { name: "No Sugar",    streak:  3, color: "#f97316" },
    ],
    events: [
        { name: "Midterm Exam",       date: "Friday",   priority: "critical" as Priority, tag: "[SYSTEM OVERRIDE: Low-tier tasks paused]" },
        { name: "Networking Dinner",  date: "Saturday", priority: "high"     as Priority, tag: null },
        { name: "Portfolio Review",   date: "Next Mon", priority: "medium"   as Priority, tag: null },
        { name: "Doctor Appointment", date: "Next Wed", priority: "low"      as Priority, tag: null },
    ],
    selfCare: [
        { name: "10-min Meditation", done: true  },
        { name: "Read 30 Pages",     done: true  },
        { name: "Cold Shower",       done: true  },
        { name: "No Social Media",   done: false },
        { name: "Sleep by 10PM",     done: false },
    ],
};

// ── Guild config ──────────────────────────────────────────────────────────────

const GUILDS: { id: Guild; color: string; label: string; icon: React.ReactNode }[] = [
    { id: "Business", color: "#3b82f6", label: "BUSINESS", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: "Fitness",  color: "#22c55e", label: "FITNESS",  icon: <Dumbbell   className="w-3.5 h-3.5" /> },
    { id: "Life",     color: "#a855f7", label: "LIFE",     icon: <BookOpen   className="w-3.5 h-3.5" /> },
];

const PRIORITY_COLOR: Record<Priority, string> = {
    critical: "#ef4444",
    high:     "#f97316",
    medium:   "#eab308",
    low:      "#64748b",
};

// ── Shared primitives ─────────────────────────────────────────────────────────

function Widget({
    children,
    color     = "#3b82f6",
    className = "",
}: {
    children:   React.ReactNode;
    color?:     string;
    className?: string;
}) {
    return (
        <div
            className={`rounded-xl border p-4 ${className}`}
            style={{ background: `${color}06`, borderColor: `${color}20` }}
        >
            {children}
        </div>
    );
}

function WLabel({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <p className="text-[9px] font-black tracking-[0.35em] uppercase mb-3" style={{ color: `${color}90` }}>
            {children}
        </p>
    );
}

function Bar({ pct, color, h = "h-1.5" }: { pct: number; color: string; h?: string }) {
    return (
        <div className={`w-full ${h} bg-zinc-900 rounded-full overflow-hidden`}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className={`${h} rounded-full`}
                style={{
                    background: `linear-gradient(90deg, ${color}70, ${color})`,
                    boxShadow:  `0 0 6px ${color}50`,
                }}
            />
        </div>
    );
}

// ── Business View ─────────────────────────────────────────────────────────────

function BusinessView({
    liveAgents  = {},
    hasLiveData = false,
}: {
    liveAgents?:  AgentStateMap;
    hasLiveData?: boolean;
}) {
    const c = "#3b82f6";

    // Merge live agent data over mock tasks.
    // Live agents take priority; mock fills in for IDs not yet reported.
    const STATUS_MAP: Record<string, TaskStatus> = {
        EXECUTING: "running",
        IDLE:      "queued",
        COMPLETED: "done",
        FAILED:    "failed",
    };

    const liveTasks = Object.values(liveAgents).map(a => ({
        agent:    a.agentId.toUpperCase(),
        task:     a.currentTask || "— awaiting orders —",
        status:   STATUS_MAP[a.status] ?? "queued" as TaskStatus,
        progress: a.progress,
        live:     true,
    }));

    // Keep mock tasks for agents that haven't sent a webhook yet
    const liveIds = new Set(Object.keys(liveAgents).map(k => k.toLowerCase()));
    const mockFallback = BUSINESS.tasks
        .filter(t => !liveIds.has(t.agent.toLowerCase()))
        .map(t => ({ ...t, progress: undefined as number | undefined, live: false }));

    const mergedTasks = [...liveTasks, ...mockFallback];
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Revenue / MRR */}
            <Widget color={c}>
                <WLabel color={c}>Revenue / MRR</WLabel>
                <div className="flex items-end justify-between">
                    <span
                        className="text-3xl font-black tracking-tight"
                        style={{ color: c, textShadow: `0 0 24px ${c}60` }}
                    >
                        {BUSINESS.mrr}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-black text-green-400 mb-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {BUSINESS.mrrChange} MoM
                    </span>
                </div>
                <p className="text-[9px] text-zinc-700 mt-1 tracking-widest uppercase">Monthly Recurring Revenue</p>
            </Widget>

            {/* KPI Matrix */}
            <Widget color={c}>
                <WLabel color={c}>KPI Matrix</WLabel>
                <div className="grid grid-cols-2 gap-2">
                    {BUSINESS.kpis.map(kpi => (
                        <div
                            key={kpi.label}
                            className="rounded-lg px-3 py-2.5 border"
                            style={{ background: `${c}08`, borderColor: `${c}18` }}
                        >
                            <p className="text-[8px] text-zinc-600 font-bold tracking-wider uppercase mb-1 leading-tight">
                                {kpi.label}
                            </p>
                            <p className="text-base font-black" style={{ color: c }}>{kpi.value}</p>
                        </div>
                    ))}
                </div>
            </Widget>

            {/* Client Sprint Progress */}
            <Widget color={c}>
                <WLabel color={c}>Client Sprint Progress</WLabel>
                <div className="space-y-3">
                    {BUSINESS.clients.map(cl => (
                        <div key={cl.name}>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                    {cl.name}
                                </span>
                                <span className="text-[10px] font-black tabular-nums" style={{ color: cl.color }}>
                                    {cl.pct}%
                                </span>
                            </div>
                            <Bar pct={cl.pct} color={cl.color} />
                        </div>
                    ))}
                </div>
            </Widget>

            {/* Pipeline */}
            <Widget color={c}>
                <WLabel color={c}>Upcoming Pipeline</WLabel>
                <div className="space-y-0.5">
                    {BUSINESS.pipeline.map(lead => (
                        <div
                            key={lead.name}
                            className="flex items-center gap-2.5 py-2 border-b border-zinc-800/30 last:border-0"
                        >
                            {lead.hot
                                ? <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                                : <div className="w-3 flex-shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-white truncate">{lead.name}</p>
                                <p className="text-[9px] text-zinc-600">{lead.stage}</p>
                            </div>
                            <span className="text-[10px] font-black text-green-400 flex-shrink-0">{lead.value}</span>
                        </div>
                    ))}
                </div>
            </Widget>

            {/* Quarterly Goals — full width */}
            <Widget color={c} className="lg:col-span-2">
                <WLabel color={c}>Quarterly Goals</WLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {BUSINESS.quarterlyGoals.map(g => (
                        <div key={g.label}>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                    {g.label}
                                </span>
                                <span className="text-[10px] font-black tabular-nums" style={{ color: g.color }}>
                                    {g.pct}%
                                </span>
                            </div>
                            <Bar pct={g.pct} color={g.color} />
                        </div>
                    ))}
                </div>
            </Widget>

            {/* Live Agent Tasks — full width */}
            <Widget color={c} className="lg:col-span-2">
                <div className="flex items-center justify-between mb-2">
                    <WLabel color={c}>Live Agent Tasks</WLabel>
                    {hasLiveData ? (
                        <div className="flex items-center gap-1.5">
                            <Radio className="w-3 h-3 text-green-500" />
                            <motion.span
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                                className="text-[8px] font-black tracking-[0.2em] uppercase text-green-500"
                            >
                                LIVE
                            </motion.span>
                        </div>
                    ) : (
                        <span className="text-[8px] font-black tracking-widest text-zinc-700 uppercase">
                            MOCK DATA
                        </span>
                    )}
                </div>
                <div
                    className="rounded-lg border overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.55)", borderColor: `${c}18` }}
                >
                    {mergedTasks.map((t, i) => {
                        const rowColor =
                            t.status === "done"    ? "#374151" :
                            t.status === "failed"  ? "#ef4444" :
                            t.status === "running" ? c
                            : "#78716c";
                        return (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 px-3 py-2 border-b last:border-0 font-mono"
                                style={{ borderColor: `${c}10` }}
                            >
                                {/* Live dot */}
                                {t.live && t.status === "running" && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                                )}
                                <span
                                    className="text-[9px] font-black tracking-wider flex-shrink-0"
                                    style={{ color: rowColor }}
                                >
                                    [{t.agent}]
                                </span>
                                <span
                                    className="text-[10px] flex-1 truncate"
                                    style={{ color: t.status === "done" ? "#374151" : "#a1a1aa" }}
                                >
                                    {t.task}
                                </span>
                                {/* Progress for live entries */}
                                {t.live && t.progress !== undefined && t.status === "running" && (
                                    <span className="text-[8px] text-zinc-600 tabular-nums flex-shrink-0">
                                        {t.progress}%
                                    </span>
                                )}
                                <span className="flex-shrink-0 text-[9px] font-black tracking-wider">
                                    {t.status === "running" ? (
                                        <motion.span
                                            animate={{ opacity: [1, 0.25, 1] }}
                                            transition={{ duration: 0.9, repeat: Infinity }}
                                            style={{ color: c }}
                                        >▶ RUN</motion.span>
                                    ) : t.status === "queued" ? (
                                        <span className="text-zinc-600">QUEUE</span>
                                    ) : t.status === "failed" ? (
                                        <span style={{ color: "#ef4444" }}>✕ FAIL</span>
                                    ) : (
                                        <span className="text-green-900">✓ DONE</span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </Widget>

            {/* Agent Performance Reports — full width */}
            <Widget color={c} className="lg:col-span-2">
                <WLabel color={c}>Agent Performance Reports</WLabel>
                <div className="space-y-0.5">
                    {BUSINESS.agentReports.map((r, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 py-2.5 border-b border-zinc-800/30 last:border-0"
                        >
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: r.color }} />
                            <span className="text-[10px] font-black text-zinc-300 flex-1">{r.title}</span>
                            <span
                                className="text-[8px] font-black tracking-widest px-2 py-0.5 rounded border flex-shrink-0"
                                style={{ color: r.color, borderColor: `${r.color}40`, background: `${r.color}10` }}
                            >
                                {r.status}
                            </span>
                        </div>
                    ))}
                </div>
            </Widget>
        </div>
    );
}

// ── Fitness View ──────────────────────────────────────────────────────────────

function FitnessView() {
    const c = "#22c55e";
    const sessionsDone = FITNESS.week.filter(d => d.done).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Body Composition */}
            <Widget color={c}>
                <WLabel color={c}>Body Composition</WLabel>
                <div className="flex items-end gap-4 mb-3">
                    <div>
                        <span
                            className="text-4xl font-black leading-none"
                            style={{ color: c, textShadow: `0 0 24px ${c}50` }}
                        >
                            {FITNESS.bodyFat}%
                        </span>
                        <p className="text-[9px] text-zinc-600 tracking-widest uppercase mt-1">Body Fat</p>
                    </div>
                    <div className="flex-1 pb-1">
                        <p className="text-[8px] text-zinc-700 text-right mb-1.5">Target: &lt;12%</p>
                        <Bar pct={(1 - FITNESS.bodyFat / 30) * 100} color={c} h="h-2.5" />
                    </div>
                </div>
            </Widget>

            {/* Today's Split */}
            <Widget color={c}>
                <WLabel color={c}>Today's Split</WLabel>
                <div className="mb-2.5">
                    <span
                        className="text-[9px] font-black tracking-widest px-2 py-1 rounded border"
                        style={{ color: c, borderColor: `${c}40`, background: `${c}10` }}
                    >
                        {FITNESS.todaySplit.day} · {FITNESS.todaySplit.type}
                    </span>
                </div>
                <p
                    className="text-[12px] font-black uppercase tracking-wide mb-3"
                    style={{ color: c, textShadow: `0 0 10px ${c}40` }}
                >
                    {FITNESS.todaySplit.focus}
                </p>
                <div className="space-y-1.5">
                    {FITNESS.todaySplit.exercises.map((ex, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                            <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: `${c}80` }} />
                            <span className="text-zinc-500 font-bold">{ex}</span>
                        </div>
                    ))}
                </div>
            </Widget>

            {/* Weekly PRs */}
            <Widget color={c}>
                <WLabel color={c}>Weekly PRs</WLabel>
                <div className="grid grid-cols-3 gap-2">
                    {FITNESS.prs.map(pr => (
                        <div
                            key={pr.lift}
                            className="rounded-lg p-3 border text-center"
                            style={{ background: `${c}08`, borderColor: `${c}20` }}
                        >
                            <p className="text-[8px] text-zinc-600 font-bold tracking-wider uppercase mb-2 leading-tight">
                                {pr.lift}
                            </p>
                            <p className="text-xl font-black leading-none" style={{ color: c }}>{pr.weight}</p>
                            <p className="text-[9px] text-zinc-600">{pr.unit}</p>
                            <p className={`text-[9px] font-black mt-1.5 ${pr.delta === "—" ? "text-zinc-700" : "text-green-400"}`}>
                                {pr.delta}
                            </p>
                        </div>
                    ))}
                </div>
            </Widget>

            {/* Historical Progress */}
            <Widget color={c}>
                <WLabel color={c}>Historical Progress</WLabel>
                <div className="space-y-0.5">
                    {FITNESS.trends.map(t => (
                        <div
                            key={t.lift}
                            className="flex items-center justify-between py-2 border-b border-zinc-800/30 last:border-0"
                        >
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                {t.lift}
                            </span>
                            <span className={`text-[11px] font-black ${
                                t.dir > 0 ? "text-green-400" : t.dir < 0 ? "text-blue-400" : "text-zinc-600"
                            }`}>
                                {t.dir > 0 ? "↑" : t.dir < 0 ? "↓" : "→"} {t.trend}
                            </span>
                        </div>
                    ))}
                </div>
            </Widget>

            {/* Weekly Consistency — full width */}
            <Widget color={c} className="lg:col-span-2">
                <WLabel color={c}>Weekly Consistency</WLabel>
                <div className="flex items-center gap-2 mb-3">
                    {FITNESS.week.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                                className="w-full aspect-square rounded-lg flex items-center justify-center border"
                                style={{
                                    background:  d.done ? `${c}18` : "rgba(255,255,255,0.02)",
                                    borderColor: d.done ? `${c}45` : "rgba(255,255,255,0.06)",
                                    boxShadow:   d.done ? `0 0 8px ${c}25` : "none",
                                }}
                            >
                                {d.done && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: c }} />}
                            </div>
                            <span className="text-[8px] text-zinc-600 font-bold">{d.day}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1"><Bar pct={(sessionsDone / 7) * 100} color={c} h="h-1" /></div>
                    <span className="text-[9px] text-zinc-600 flex-shrink-0 tabular-nums">{sessionsDone}/7 sessions</span>
                </div>
            </Widget>
        </div>
    );
}

// ── Life View ─────────────────────────────────────────────────────────────────

function LifeView() {
    const c   = "#a855f7";
    const pct = (LIFE.deepWork.hours / LIFE.deepWork.goal) * 100;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Deep Work */}
            <Widget color={c}>
                <WLabel color={c}>Deep Work / Study Hours</WLabel>
                <div className="flex items-end justify-between mb-3">
                    <span className="text-3xl font-black" style={{ color: c, textShadow: `0 0 20px ${c}50` }}>
                        {LIFE.deepWork.hours}h
                    </span>
                    <span className="text-[10px] text-zinc-600 mb-0.5">/ {LIFE.deepWork.goal}h weekly goal</span>
                </div>
                <Bar pct={pct} color={c} h="h-2" />
                <p className="text-[9px] text-zinc-700 text-right mt-1.5 tabular-nums">
                    {(LIFE.deepWork.goal - LIFE.deepWork.hours).toFixed(1)}h remaining
                </p>
            </Widget>

            {/* Upcoming Events */}
            <Widget color={c}>
                <WLabel color={c}>Upcoming Critical Events</WLabel>
                <div className="space-y-0.5">
                    {LIFE.events.map((ev, i) => {
                        const evColor = PRIORITY_COLOR[ev.priority];
                        return (
                            <div key={i} className="py-2 border-b border-zinc-800/30 last:border-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ background: evColor, boxShadow: `0 0 5px ${evColor}` }}
                                        />
                                        <span className="text-[10px] font-black text-white">{ev.name}</span>
                                    </div>
                                    <span className="text-[9px] font-bold flex-shrink-0" style={{ color: evColor }}>
                                        {ev.date}
                                    </span>
                                </div>
                                {ev.tag && (
                                    <p
                                        className="text-[8px] font-black tracking-wider px-2 py-0.5 rounded ml-3.5"
                                        style={{
                                            color:       "#ef4444",
                                            background:  "rgba(239,68,68,0.08)",
                                            border:      "1px solid rgba(239,68,68,0.2)",
                                        }}
                                    >
                                        {ev.tag}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Widget>

            {/* Habit Streaks */}
            <Widget color={c}>
                <WLabel color={c}>Habit Streaks</WLabel>
                <div className="space-y-3">
                    {LIFE.habits.map(h => (
                        <div key={h.name} className="flex items-center gap-3">
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: h.color, boxShadow: `0 0 5px ${h.color}` }}
                            />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider w-24 flex-shrink-0">
                                {h.name}
                            </span>
                            <div className="flex-1">
                                <Bar pct={Math.min(100, (h.streak / 30) * 100)} color={h.color} />
                            </div>
                            <span
                                className="text-[11px] font-black tabular-nums w-8 text-right flex-shrink-0"
                                style={{ color: h.color }}
                            >
                                {h.streak}d
                            </span>
                        </div>
                    ))}
                </div>
            </Widget>

            {/* Self-Care Routine */}
            <Widget color={c}>
                <WLabel color={c}>Self-Care Routine</WLabel>
                <div className="space-y-0.5">
                    {LIFE.selfCare.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 py-2 border-b border-zinc-800/30 last:border-0"
                        >
                            <div
                                className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                                style={{
                                    background:  item.done ? `${c}20` : "transparent",
                                    borderColor: item.done ? c : "rgba(255,255,255,0.1)",
                                }}
                            >
                                {item.done && <CheckCircle2 className="w-3 h-3" style={{ color: c }} />}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider flex-1 ${
                                item.done ? "text-zinc-600 line-through" : "text-zinc-300"
                            }`}>
                                {item.name}
                            </span>
                            {!item.done && (
                                <span className="text-[8px] text-zinc-700 font-bold tracking-widest">PENDING</span>
                            )}
                        </div>
                    ))}
                </div>
            </Widget>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface GuildMetricsProps {
    isPenaltyZone?: boolean;
    /** Live agent state fed from the webhook polling hook in ThroneRoom */
    liveAgents?:    AgentStateMap;
}

export function GuildMetrics({ isPenaltyZone = false, liveAgents = {} }: GuildMetricsProps) {
    const [activeGuild, setActiveGuild] = useState<Guild>("Business");
    const ac = GUILDS.find(g => g.id === activeGuild)!.color;
    const hasLiveData = Object.values(liveAgents).some(a => a.status === "EXECUTING");

    return (
        <div className="flex flex-col gap-4">

            {/* ── Penalty Alert ─────────────────────────────────────────── */}
            {isPenaltyZone && (
                <motion.div
                    animate={{
                        opacity:   [1, 0.75, 1],
                        boxShadow: [
                            "0 0 14px rgba(239,68,68,0.2)",
                            "0 0 26px rgba(239,68,68,0.4)",
                            "0 0 14px rgba(239,68,68,0.2)",
                        ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="rounded-xl border p-3 flex items-center gap-3"
                    style={{ background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.45)" }}
                >
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-red-500">
                            S-Rank Active: PENALTY ZONE SURVIVAL
                        </p>
                        <p className="text-[8px] text-red-800 mt-0.5">
                            Eliminate distractions. Complete objectives before deadline.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ── Guild Selector ─────────────────────────────────────────── */}
            <div
                className="flex rounded-xl overflow-hidden border"
                style={{ borderColor: `${ac}30`, background: "rgba(9,11,17,0.85)" }}
            >
                {GUILDS.map((g, i) => {
                    const active = g.id === activeGuild;
                    return (
                        <button
                            key={g.id}
                            onClick={() => setActiveGuild(g.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black tracking-[0.28em] uppercase transition-all duration-200 ${i > 0 ? "border-l border-white/[0.05]" : ""}`}
                            style={{
                                color:      active ? g.color : "#52525b",
                                background: active ? `${g.color}12` : "transparent",
                                boxShadow:  active ? `inset 0 -2px 0 ${g.color}` : "none",
                                textShadow: active ? `0 0 14px ${g.color}60` : "none",
                            }}
                        >
                            {g.icon}
                            {g.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Guild Content ──────────────────────────────────────────── */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeGuild}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y:  0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.18 }}
                    >
                        {activeGuild === "Business" && <BusinessView liveAgents={liveAgents} hasLiveData={hasLiveData} />}
                        {activeGuild === "Fitness"  && <FitnessView  />}
                        {activeGuild === "Life"     && <LifeView      />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
