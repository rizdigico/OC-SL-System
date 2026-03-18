"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Zap, RefreshCw, AlertTriangle } from "lucide-react";
import { useSovereign } from "@/context/SovereignContext";

interface DevPanelProps {
    isPenaltyZone?:  boolean;
    onForcePenalty?: () => void;
    onClearPenalty?: () => void;
}

export function DevPanel({ isPenaltyZone = false, onForcePenalty, onClearPenalty }: DevPanelProps) {
    const router = useRouter();
    const { updateSovereign } = useSovereign();
    const [collapsed,   setCollapsed]   = useState(false);
    const [levelInput,  setLevelInput]  = useState("");
    const [levelStatus, setLevelStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

    const handleSetLevel = async () => {
        const newLevel = parseInt(levelInput, 10);
        if (isNaN(newLevel) || newLevel < 1 || newLevel > 200) {
            setLevelStatus("err");
            setTimeout(() => setLevelStatus("idle"), 1500);
            return;
        }
        setLevelStatus("loading");
        try {
            const res = await fetch("/api/sovereign", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ action: "devSetLevel", newLevel }),
            });
            if (res.ok) {
                updateSovereign(await res.json());
                setLevelStatus("ok");
                setLevelInput("");
            } else {
                setLevelStatus("err");
            }
        } catch {
            setLevelStatus("err");
        } finally {
            setTimeout(() => setLevelStatus("idle"), 1500);
        }
    };

    const handleAwakeningReset = () => {
        localStorage.clear();
        router.push("/assessment");
    };

    return (
        <div className="fixed bottom-4 left-4 z-[9998] select-none">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-black/80 border border-white/10 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.6)] overflow-hidden w-52"
            >
                {/* Header */}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-yellow-500/90">
                            Dev Panel
                        </span>
                    </div>
                    {collapsed
                        ? <ChevronUp className="w-3.5 h-3.5 text-white/40" />
                        : <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                    }
                </button>

                <AnimatePresence initial={false}>
                    {!collapsed && (
                        <motion.div
                            key="body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-2 pb-2 pt-2 border-t border-white/10 space-y-2">

                                {/* ── Level Override ── */}
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black tracking-[0.25em] uppercase text-yellow-600/70 px-0.5">
                                        Level Gate Test
                                    </p>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="number"
                                            min={1}
                                            max={200}
                                            value={levelInput}
                                            onChange={e => setLevelInput(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && handleSetLevel()}
                                            placeholder="1 – 200"
                                            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-black/60 border text-[11px] font-mono text-white placeholder-zinc-700 outline-none focus:border-yellow-500/60 transition-colors"
                                            style={{
                                                borderColor: levelStatus === "err" ? "rgba(239,68,68,0.7)"
                                                           : levelStatus === "ok"  ? "rgba(34,197,94,0.7)"
                                                           : "rgba(255,255,255,0.1)",
                                            }}
                                        />
                                        <button
                                            onClick={handleSetLevel}
                                            disabled={levelStatus === "loading"}
                                            className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase border transition-all disabled:opacity-50"
                                            style={{
                                                background:  levelStatus === "ok"  ? "rgba(34,197,94,0.2)"
                                                           : levelStatus === "err" ? "rgba(239,68,68,0.2)"
                                                           : "rgba(234,179,8,0.15)",
                                                borderColor: levelStatus === "ok"  ? "rgba(34,197,94,0.6)"
                                                           : levelStatus === "err" ? "rgba(239,68,68,0.6)"
                                                           : "rgba(234,179,8,0.5)",
                                                color:       levelStatus === "ok"  ? "#4ade80"
                                                           : levelStatus === "err" ? "#f87171"
                                                           : "#facc15",
                                            }}
                                        >
                                            {levelStatus === "loading" ? "…"
                                           : levelStatus === "ok"      ? "✓"
                                           : levelStatus === "err"     ? "✗"
                                           : "SET"}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-zinc-700 px-0.5">
                                        +50 ability pts • exp reset to 0
                                    </p>
                                </div>

                                <div className="border-t border-white/08 pt-2 space-y-2">
                                <button
                                    onClick={handleAwakeningReset}
                                    className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-black tracking-wide uppercase bg-red-950/40 hover:bg-red-900/50 border border-red-600/70 text-red-400 transition-all"
                                >
                                    <RefreshCw className="w-3 h-3 flex-shrink-0" />
                                    Trigger Awakening (Reset)
                                </button>
                                <button
                                    onClick={onForcePenalty}
                                    className={`w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-black tracking-wide uppercase border transition-all ${
                                        isPenaltyZone
                                            ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse"
                                            : "bg-orange-950/40 hover:bg-orange-900/50 border-orange-600/70 text-orange-400"
                                    }`}
                                >
                                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                    {isPenaltyZone ? "PENALTY ACTIVE" : "Force Penalty Zone"}
                                </button>
                                {isPenaltyZone && (
                                    <button
                                        onClick={onClearPenalty}
                                        className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-black tracking-wide uppercase border border-green-600/70 bg-green-950/40 hover:bg-green-900/50 text-green-400 transition-all"
                                    >
                                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                        Clear Penalty
                                    </button>
                                )}
                                </div>{/* /border-t section */}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
