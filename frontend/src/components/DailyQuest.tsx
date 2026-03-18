"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSovereign } from "@/context/SovereignContext";

// ── Quest config ──────────────────────────────────────────────────────────────

type QuestMetric = "pushups" | "situps" | "squats" | "run";

interface QuestRow {
    metric:    QuestMetric;
    label:     string;
    goal:      number;
    unit:      string;
    step:      number;
    stepLabel: string;
}

const QUEST_ROWS: QuestRow[] = [
    { metric: "pushups", label: "Push-Ups", goal: 100, unit: "reps", step: 10, stepLabel: "+10" },
    { metric: "situps",  label: "Sit-Ups",  goal: 100, unit: "reps", step: 10, stepLabel: "+10" },
    { metric: "squats",  label: "Squats",   goal: 100, unit: "reps", step: 10, stepLabel: "+10" },
    { metric: "run",     label: "Running",  goal: 10,  unit: "km",   step: 1,  stepLabel: "+1 km" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function DailyQuest() {
    const { sovereign, updateSovereign } = useSovereign();
    const [loading, setLoading] = useState<QuestMetric | null>(null);

    const dq            = sovereign?.dailyQuest;
    const penaltyActive = sovereign?.penaltyActive ?? false;
    const isCompleted   = dq?.completed ?? false;

    // ── Penalty Zone override ─────────────────────────────────────────────────
    if (penaltyActive) {
        return (
            <motion.div
                animate={{ boxShadow: [
                    "0 0 16px rgba(239,68,68,0.25)",
                    "0 0 36px rgba(239,68,68,0.55)",
                    "0 0 16px rgba(239,68,68,0.25)",
                ]}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="rounded-xl border p-4 text-center space-y-1"
                style={{ background: "rgba(127,29,29,0.15)", borderColor: "rgba(239,68,68,0.5)" }}
            >
                <motion.p
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="text-xs font-black tracking-[0.25em] uppercase text-red-500"
                >
                    ⚠ PENALTY ZONE ACTIVE ⚠
                </motion.p>
                <p className="text-[10px] text-red-400/60 font-bold tracking-wide">
                    Survive for 4 hours. The System is watching.
                </p>
            </motion.div>
        );
    }

    // ── Increment handler ─────────────────────────────────────────────────────
    const handleIncrement = async (metric: QuestMetric, amount: number) => {
        setLoading(metric);
        try {
            const res = await fetch("/api/sovereign", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ action: "updateDailyQuest", type: metric, amount }),
            });
            if (res.ok) updateSovereign(await res.json());
        } finally {
            setLoading(null);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div
            className="rounded-xl border overflow-hidden"
            style={{
                background:  "rgba(9,11,17,0.6)",
                borderColor: isCompleted ? "rgba(34,197,94,0.3)" : "rgba(30,68,200,0.2)",
            }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-2 px-3 py-2.5 border-b"
                style={{ borderColor: isCompleted ? "rgba(34,197,94,0.15)" : "rgba(30,68,200,0.12)" }}
            >
                <span
                    className="text-[9px] font-black tracking-[0.3em] uppercase"
                    style={{ color: isCompleted ? "#4ade80" : "#3b82f6" }}
                >
                    Daily Quest: Becoming Strong
                </span>
                {isCompleted && (
                    <span className="ml-auto text-[9px] font-black tracking-widest text-green-500">
                        ✓ COMPLETE
                    </span>
                )}
            </div>

            {/* Progress rows */}
            <div className="p-3 space-y-2.5">
                {QUEST_ROWS.map(row => {
                    const current = (dq?.[row.metric] as number | undefined) ?? 0;
                    const pct     = Math.min(100, (current / row.goal) * 100);
                    const done    = current >= row.goal;

                    return (
                        <div key={row.metric} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                                        {row.label}
                                    </span>
                                    <span className="text-[9px] text-zinc-600 tabular-nums">
                                        {current}/{row.goal} {row.unit}
                                    </span>
                                </div>
                                {done ? (
                                    <span className="text-[9px] font-black text-green-500">✓</span>
                                ) : !isCompleted && (
                                    <button
                                        onClick={() => handleIncrement(row.metric, row.step)}
                                        disabled={loading === row.metric}
                                        className="text-[9px] font-black tracking-wide px-2 py-0.5 rounded border transition-all disabled:opacity-40"
                                        style={{
                                            color:       "#3b82f6",
                                            borderColor: "rgba(59,130,246,0.35)",
                                            background:  "rgba(59,130,246,0.08)",
                                        }}
                                    >
                                        {loading === row.metric ? "…" : row.stepLabel}
                                    </button>
                                )}
                            </div>
                            <div className="h-1 rounded-full bg-zinc-900/80 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    style={{
                                        background: done
                                            ? "linear-gradient(90deg, #15803d, #4ade80)"
                                            : "linear-gradient(90deg, #1d4ed8, #60a5fa)",
                                        boxShadow: done ? "0 0 5px #22c55e" : "0 0 4px #3b82f6",
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}

                {isCompleted && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pt-1 text-center text-[9px] font-black tracking-widest text-green-500/60 uppercase"
                    >
                        Status fully recovered • +3 Ability Points rewarded
                    </motion.p>
                )}
            </div>
        </div>
    );
}
