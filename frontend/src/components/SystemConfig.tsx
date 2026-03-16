"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, ShieldOff, ShieldCheck, Plus, Trash2 } from "lucide-react";

// ── Default lists ──────────────────────────────────────────────────────────────

const DEFAULT_BLACKLIST = ["Netflix", "Steam", "Reddit", "YouTube", "Twitch"];
const WHITELIST         = ["LinkedIn", "TikTok", "Instagram", "Twitter / X", "Notion"];

// ── Main Component ─────────────────────────────────────────────────────────────

interface SystemConfigProps {
    isOpen:  boolean;
    onClose: () => void;
}

export function SystemConfig({ isOpen, onClose }: SystemConfigProps) {
    const [blacklist,  setBlacklist]  = useState<string[]>(DEFAULT_BLACKLIST);
    const [inputValue, setInputValue] = useState("");

    const addToBlacklist = () => {
        const trimmed = inputValue.trim();
        if (!trimmed || blacklist.includes(trimmed)) return;
        setBlacklist(prev => [...prev, trimmed]);
        setInputValue("");
    };

    const removeFromBlacklist = (site: string) => {
        setBlacklist(prev => prev.filter(s => s !== site));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="cfg-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[9992] bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        key="cfg-panel"
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1,    y:  0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="fixed inset-0 z-[9993] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="relative w-full max-w-md rounded-2xl overflow-hidden pointer-events-auto"
                            style={{
                                background:     "rgba(5,5,14,0.98)",
                                border:         "1px solid rgba(59,130,246,0.25)",
                                boxShadow:      "0 0 50px rgba(59,130,246,0.1), inset 0 0 30px rgba(59,130,246,0.02)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-px"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)" }}
                            />

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b"
                                style={{ borderColor: "rgba(59,130,246,0.12)" }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}
                                    >
                                        <Settings className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black tracking-[0.35em] uppercase text-blue-400">
                                            System Config
                                        </p>
                                        <p className="text-[8px] text-zinc-700 tracking-widest uppercase">
                                            Webhook & Focus Control
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all"
                                >
                                    <X className="w-3.5 h-3.5 text-zinc-500" />
                                </button>
                            </div>

                            <div className="p-5 space-y-5">

                                {/* ── Blacklist ──────────────────────────────── */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldOff className="w-3.5 h-3.5 text-red-500/70" />
                                        <p className="text-[9px] font-black tracking-[0.35em] text-red-500/70 uppercase">
                                            Distraction Blacklist
                                        </p>
                                        <span className="ml-auto text-[8px] font-bold text-zinc-700 tracking-widest">
                                            {blacklist.length} SITES
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <AnimatePresence>
                                            {blacklist.map(site => (
                                                <motion.div
                                                    key={site}
                                                    initial={{ opacity: 0, scale: 0.85 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.85 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border group"
                                                    style={{
                                                        background:  "rgba(239,68,68,0.07)",
                                                        borderColor: "rgba(239,68,68,0.3)",
                                                    }}
                                                >
                                                    <span className="text-[9px] font-bold text-red-400">{site}</span>
                                                    <button
                                                        onClick={() => removeFromBlacklist(site)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5 text-red-500/60 hover:text-red-400" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    {/* Add input */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={e => setInputValue(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && addToBlacklist()}
                                            placeholder="Add site to blacklist..."
                                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-bold text-zinc-400 placeholder-zinc-700 outline-none focus:border-red-600/50 transition-colors"
                                        />
                                        <button
                                            onClick={addToBlacklist}
                                            className="px-3 py-2 rounded-lg border text-[9px] font-black tracking-wider uppercase transition-all hover:scale-105"
                                            style={{
                                                color:       "#ef4444",
                                                borderColor: "rgba(239,68,68,0.4)",
                                                background:  "rgba(239,68,68,0.08)",
                                            }}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                                {/* ── Whitelist ──────────────────────────────── */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldCheck className="w-3.5 h-3.5 text-green-500/70" />
                                        <p className="text-[9px] font-black tracking-[0.35em] text-green-500/70 uppercase">
                                            Whitelist — Work Tools
                                        </p>
                                    </div>
                                    <p className="text-[8px] text-zinc-700 mb-3 leading-relaxed">
                                        The System recognizes these as business tools, not distractions. Access is always permitted.
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {WHITELIST.map(site => (
                                            <div
                                                key={site}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
                                                style={{
                                                    background:  "rgba(34,197,94,0.06)",
                                                    borderColor: "rgba(34,197,94,0.25)",
                                                }}
                                            >
                                                <span className="text-[9px] font-bold text-green-400">{site}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer note */}
                                <div className="text-[8px] text-zinc-800 text-center tracking-widest uppercase">
                                    Webhook enforcement requires OpenClaw integration
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
