import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Zap, Brain, Eye, Activity, Shield } from "lucide-react";
import { useSystemAudio } from "@/hooks/useSystemAudio";
import type { SovereignState } from "@/app/api/sovereign/route";

interface StatusWindowProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    setUser: (user: any) => void;
}

const HeartIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

const statsConfig = [
    { key: "str", label: "STR", icon: <Shield className="w-3.5 h-3.5" /> },
    { key: "agi", label: "AGI", icon: <Activity className="w-3.5 h-3.5" /> },
    { key: "vit", label: "VIT", icon: <HeartIcon className="w-3.5 h-3.5" /> },
    { key: "int", label: "INT", icon: <Brain className="w-3.5 h-3.5" /> },
    { key: "per", label: "PER", icon: <Eye className="w-3.5 h-3.5" /> },
];

export function StatusWindow({ isOpen, onClose, user, setUser }: StatusWindowProps) {
    const { playClick, playError } = useSystemAudio();
    const [sovereign, setSovereign] = useState<SovereignState | null>(null);

    const fetchSovereign = useCallback(async () => {
        try {
            const res = await fetch("/api/sovereign", { cache: "no-store" });
            if (res.ok) setSovereign(await res.json());
        } catch (err) {
            console.error("[StatusWindow] Failed to fetch sovereign state:", err);
        }
    }, []);

    // Fetch on open
    useEffect(() => {
        if (isOpen) fetchSovereign();
    }, [isOpen, fetchSovereign]);

    if (!user) return null;

    const mpMax         = 50 + (user.stats?.intelligence ?? 1) * 10;
    const isTranscended = user.isTranscended;

    const handleAllocate = async (statKey: string) => {
        if (!sovereign || sovereign.availablePoints <= 0) { playError(); return; }
        try {
            const res = await fetch("/api/sovereign", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ action: "allocate", stat: statKey }),
            });
            if (res.ok) {
                setSovereign(await res.json());
            } else {
                playError();
            }
        } catch {
            playError();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="status-window"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 h-full w-full sm:w-[380px] z-50 flex flex-col"
                    style={{
                        background: 'rgba(0, 3, 22, 0.97)',
                        borderLeft: `1px solid ${isTranscended ? 'rgba(164,128,242,0.65)' : 'rgba(40,90,255,0.65)'}`,
                        boxShadow: isTranscended
                            ? '-8px 0 40px rgba(164,128,242,0.2), inset 0 0 40px rgba(60,20,120,0.2)'
                            : '-8px 0 40px rgba(30,68,255,0.2), inset 0 0 40px rgba(10,25,100,0.2)',
                        backgroundImage: `
                            repeating-linear-gradient(62deg, transparent 0px, transparent 22px, rgba(30,68,200,0.035) 22px, rgba(30,68,200,0.035) 23px),
                            repeating-linear-gradient(-62deg, transparent 0px, transparent 35px, rgba(30,68,200,0.025) 35px, rgba(30,68,200,0.025) 36px)
                        `,
                    }}
                >
                    {/* ── Header bar ──────────────────────────────────── */}
                    <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
                        style={{
                            background: 'rgba(0, 5, 35, 0.95)',
                            borderBottom: `1px solid ${isTranscended ? 'rgba(164,128,242,0.35)' : 'rgba(40,90,255,0.35)'}`,
                        }}
                    >
                        <span className="text-white font-black tracking-[0.3em] uppercase text-sm">STATUS</span>
                        <div className="ml-auto">
                            <button
                                onClick={() => { playClick(); onClose(); }}
                                className="w-8 h-8 flex items-center justify-center border border-[rgba(40,90,255,0.4)] text-[#7a9abf] hover:text-white hover:border-[rgba(80,150,255,0.8)] transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Level / Job / Title block ────────────────────── */}
                    <div className="flex items-center gap-4 px-5 py-4 flex-shrink-0"
                        style={{borderBottom: 'rgba(30,68,200,0.2) 1px solid'}}
                    >
                        <div className="text-center flex-shrink-0">
                            <div className="text-6xl font-black text-white font-caros leading-none"
                                style={{textShadow: isTranscended ? '0 0 20px rgba(164,128,242,0.6)' : '0 0 20px rgba(17,210,239,0.4)'}}>
                                {sovereign?.level ?? user.stats?.level ?? "—"}
                            </div>
                            <div className="text-[10px] text-[#7a9abf] tracking-[0.25em] uppercase mt-1">LEVEL</div>
                        </div>
                        <div className="flex-1 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-[#7a9abf] tracking-widest uppercase">JOB</span>
                                <span className="text-white font-semibold">{user.job || "None"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#7a9abf] tracking-widest uppercase">TITLE</span>
                                <span className="text-white font-semibold text-right max-w-[160px] truncate">
                                    {sovereign?.title ?? user.title ?? "None"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#7a9abf] tracking-widest uppercase">RANK</span>
                                <span className="font-bold" style={{color: isTranscended ? '#A480F2' : '#11D2EF'}}>{user.rank}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── HP / MP / Fatigue ────────────────────────────── */}
                    <div className="px-5 py-3 flex-shrink-0 space-y-2.5"
                        style={{borderBottom:'1px solid rgba(30,68,200,0.15)'}}
                    >
                        {/* HP */}
                        <div className="flex items-center gap-2">
                            <HeartIcon className="w-4 h-4 text-[#5599ff] flex-shrink-0" />
                            <div className="sl-bar-track">
                                <div className="sl-bar-fill-hp" style={{
                                    width: sovereign
                                        ? `${Math.min(100, (sovereign.hp / sovereign.maxHp) * 100)}%`
                                        : "100%"
                                }} />
                            </div>
                            <span className="text-[10px] text-[#7a9abf] font-bold tabular-nums w-20 text-right">
                                {sovereign?.hp ?? "—"}/{sovereign?.maxHp ?? "—"}
                            </span>
                        </div>
                        {/* MP */}
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-[#33bbff] flex-shrink-0" />
                            <div className="sl-bar-track">
                                <div className="sl-bar-fill-mp" style={{
                                    width: `${Math.min(100, ((user.stats?.mana ?? 0) / mpMax) * 100)}%`
                                }} />
                            </div>
                            <span className="text-[10px] text-[#7a9abf] font-bold tabular-nums w-20 text-right">
                                {user.stats?.mana ?? 0}/{mpMax}
                            </span>
                        </div>
                        {/* Fatigue */}
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[#7a9abf] tracking-widest uppercase">FATIGUE</span>
                            <span className="text-white font-bold">{sovereign?.fatigue ?? user.stats?.fatigue ?? 0}</span>
                        </div>
                    </div>

                    {/* ── Stat rows ────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto">
                        {statsConfig.map(({ key, label, icon }) => {
                            const val     = sovereign ? (sovereign as any)[key] : "—";
                            const canSpend = (sovereign?.availablePoints ?? 0) > 0;
                            return (
                                <div key={key}
                                    className="flex items-center justify-between px-5 py-3 group transition-colors"
                                    style={{borderBottom:'1px solid rgba(30,68,200,0.12)'}}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#5588cc] group-hover:text-[#11D2EF] transition-colors">{icon}</span>
                                        <span className="text-[#7a9abf] group-hover:text-white text-xs font-semibold tracking-[0.15em] uppercase transition-colors w-8">{label}</span>
                                        <span className="text-white text-xl font-black font-caros tabular-nums">{val}</span>
                                    </div>
                                    <button
                                        onClick={() => { playClick(); handleAllocate(key); }}
                                        disabled={!canSpend}
                                        className="w-8 h-8 flex items-center justify-center transition-all duration-200"
                                        style={canSpend ? {
                                            border: '1px solid rgba(40,90,255,0.7)',
                                            background: 'rgba(10,25,80,0.4)',
                                            color: '#b0ccff',
                                            boxShadow: '0 0 8px rgba(30,68,255,0.3)',
                                        } : {
                                            border: '1px solid rgba(80,80,80,0.3)',
                                            background: 'rgba(20,20,20,0.4)',
                                            color: 'rgba(100,100,100,0.5)',
                                            cursor: 'not-allowed',
                                        }}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Available points footer ───────────────────────── */}
                    <div className="px-5 py-4 flex-shrink-0"
                        style={{
                            background: 'rgba(0,5,35,0.9)',
                            borderTop: `1px solid ${isTranscended ? 'rgba(164,128,242,0.3)' : 'rgba(40,90,255,0.3)'}`,
                        }}
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-[#7a9abf] text-xs tracking-widest uppercase">Available Ability Points</span>
                            <span className="text-3xl font-black font-caros"
                                style={{
                                    color: isTranscended ? '#A480F2' : '#11D2EF',
                                    textShadow: isTranscended ? '0 0 12px rgba(164,128,242,0.8)' : '0 0 12px rgba(17,210,239,0.8)',
                                }}
                            >
                                {sovereign?.availablePoints ?? "—"}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
