"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Zap, RefreshCw, AlertTriangle } from "lucide-react";

interface DevPanelProps {
    isPenaltyZone?:  boolean;
    onForcePenalty?: () => void;
    onClearPenalty?: () => void;
}

export function DevPanel({ isPenaltyZone = false, onForcePenalty, onClearPenalty }: DevPanelProps) {
    if (process.env.NODE_ENV !== "development") return null;

    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
