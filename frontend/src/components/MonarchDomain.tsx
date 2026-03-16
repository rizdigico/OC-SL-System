"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Plus, Check, Sparkles, Trash2, Lock, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Objective {
    id: string;
    description: string;
    exp: number;
    status: "active" | "fulfilled";
}

interface MonarchDomainProps {
    user: any;
    onExpGranted?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

async function grantMonarchExp(exp: number): Promise<boolean> {
    const token = localStorage.getItem("system_token");
    const res = await fetch("http://localhost:5000/api/users/me/monarch-grant", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exp }),
    });
    return res.ok;
}

async function attackInvasion(damage: number): Promise<any> {
    const token = localStorage.getItem("system_token");
    const res = await fetch("http://localhost:5000/api/invasion/attack", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ damage }),
    });
    return res.ok ? await res.json() : null;
}

async function reincarnatePrestige(): Promise<boolean> {
    const token = localStorage.getItem("system_token");
    const res = await fetch("http://localhost:5000/api/prestige/reincarnate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
}

function fmtExp(exp: number) {
    if (exp >= 1000) return `${(exp / 1000).toFixed(exp % 1000 === 0 ? 0 : 1)}k`;
    return String(exp);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function MonarchDomain({ user, onExpGranted }: MonarchDomainProps) {
    const router = useRouter();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [newTask,    setNewTask]    = useState("");
    const [newExp,     setNewExp]     = useState<number | "">("");
    const [loadingId,  setLoadingId]  = useState<string | null>(null);
    const [errorMsg,   setErrorMsg]   = useState<string | null>(null);
    const [sessionExp, setSessionExp] = useState(0);
    const [showReincarnateConfirm, setShowReincarnateConfirm] = useState(false);

    // ── Add ────────────────────────────────────────────────────────────────────
    const handleAdd = useCallback(() => {
        const expVal = Number(newExp);
        if (!newTask.trim() || !expVal || expVal <= 0) return;
        setObjectives(prev => [
            { id: uid(), description: newTask.trim(), exp: expVal, status: "active" },
            ...prev,
        ]);
        setNewTask("");
        setNewExp("");
    }, [newTask, newExp]);

    const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleAdd(); };

    // ── Fulfill ────────────────────────────────────────────────────────────────
    const handleFulfill = useCallback(async (obj: Objective) => {
        if (loadingId) return;
        setLoadingId(obj.id);
        setErrorMsg(null);
        try {
            let ok = false;
            
            if (user?.activeInvasion?.monarch) {
                const attackRes = await attackInvasion(obj.exp);
                if (attackRes && attackRes.success) {
                    ok = true;
                    if (!attackRes.defeated) {
                         await grantMonarchExp(obj.exp);
                    }
                }
            } else {
                ok = await grantMonarchExp(obj.exp);
            }

            if (ok) {
                setObjectives(prev =>
                    prev.map(o => o.id === obj.id ? { ...o, status: "fulfilled" } : o)
                );
                setSessionExp(prev => prev + obj.exp);
                onExpGranted?.();
            } else {
                setErrorMsg("The System rejected this claim.");
            }
        } catch {
            setErrorMsg("Cannot reach the System. Is the server running?");
        } finally {
            setLoadingId(null);
        }
    }, [loadingId, onExpGranted, user]);

    const handleRemove = (id: string) =>
        setObjectives(prev => prev.filter(o => o.id !== id));

    const handleReincarnate = async () => {
        const ok = await reincarnatePrestige();
        if (ok) {
            router.push("/dashboard");
        } else {
            setErrorMsg("Reincarnation failed.");
        }
    };

    if (!user) return null;

    const active    = objectives.filter(o => o.status === "active");
    const fulfilled = objectives.filter(o => o.status === "fulfilled");

    const invasion = user?.activeInvasion;
    const hasInvasion = invasion && invasion.monarch;
    const canReincarnate = user.unlockedCup;

    let invColor = "rgba(255,255,255,1)";
    let invBgClass = "bg-white/10";
    let invBorderClass = "border-white/30";
    let invTextClass = "text-white";
    let invDebuffText = "";

    if (hasInvasion) {
        if (invasion.monarch.includes("Plague")) {
            invColor = "rgba(34,197,94,1)"; // Green-500
            invBgClass = "bg-green-900/40";
            invBorderClass = "border-green-500/50";
            invTextClass = "text-green-400";
            invDebuffText = "Debuff: Rot (10% EXP deduction on standard objectives)";
        } else if (invasion.monarch.includes("Frost")) {
            invColor = "rgba(56,189,248,1)"; // Cyan-400 (Icy Blue)
            invBgClass = "bg-cyan-900/40";
            invBorderClass = "border-cyan-500/50";
            invTextClass = "text-cyan-400";
            invDebuffText = `Debuff: Frozen Systems (${invasion.frozenTabs?.join(', ') || 'Unknown'})`;
        } else if (invasion.monarch.includes("Beast")) {
            invColor = "rgba(234,88,12,1)"; // Orange-500 (Blood Orange)
            invBgClass = "bg-orange-900/40";
            invBorderClass = "border-orange-500/50";
            invTextClass = "text-orange-400";
            invDebuffText = "Debuff: Predatory Regeneration (Escapes in 3 hours if not defeated)";
        }
    }

    return (
        <div className="space-y-5 relative">
            {showReincarnateConfirm && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border border-yellow-500/50 p-8 rounded-xl max-w-lg w-full text-center space-y-6 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                        <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
                        <h2 className="text-2xl font-black text-yellow-500 uppercase tracking-widest">Reincarnation Warning</h2>
                        <p className="text-gray-300">
                            Drinking from the Cup of Reincarnation will reset your Level, EXP, Inventory, and Demon Castle progress back to zero.
                        </p>
                        <p className="text-yellow-400 font-bold">
                            You will lose your Transcendent state and return to the System, but you will permanently gain a 1.5x global EXP multiplier and the title of "Dragon Monarch".
                        </p>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setShowReincarnateConfirm(false)} className="flex-1 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700">Cancel</button>
                            <button onClick={handleReincarnate} className="flex-1 py-3 bg-yellow-600 text-black font-bold rounded-lg hover:bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]">I Accept</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes md-aura {
                    0%, 100% { opacity: 0.10; transform: scale(1); }
                    50%      { opacity: 0.22; transform: scale(1.07); }
                }
                @keyframes md-crown {
                    0%, 100% { filter: drop-shadow(0 0 8px rgba(164,128,242,0.5)); }
                    50%      { filter: drop-shadow(0 0 24px rgba(164,128,242,1)); }
                }
                @keyframes md-scan {
                    0%   { top: -2px; }
                    100% { top: 100%; }
                }
            `}</style>

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden border border-[#A480F2]/30 bg-black shadow-[0_0_50px_rgba(164,128,242,0.10)] px-6 py-5">
                {/* Purple aura */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[110%] h-40 rounded-full blur-[70px] pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse, rgba(110,50,230,0.35), transparent 65%)",
                        animation:  "md-aura 6s ease-in-out infinite",
                    }}
                />
                {/* Scanline */}
                <div
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A480F2]/40 to-transparent pointer-events-none"
                    style={{ animation: "md-scan 5s linear infinite" }}
                />
                {/* Watermark */}
                <Crown className="absolute -bottom-4 right-2 w-36 h-36 text-[#A480F2] opacity-[0.035] pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <Crown
                            className="w-6 h-6 text-[#A480F2]"
                            style={{ animation: "md-crown 3s ease-in-out infinite" }}
                        />
                        <h3 className="text-xl font-caros font-black text-[#A480F2] uppercase tracking-[0.3em]">
                            Monarch Domain
                        </h3>
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed max-w-lg ml-9">
                        The System no longer governs you. Define your own Sovereign Objectives,
                        assign your own rewards, and claim what you have earned.
                    </p>

                    {sessionExp > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 ml-9 inline-flex items-center gap-2 px-3 py-1 rounded-lg
                                bg-[#A480F2]/10 border border-[#A480F2]/25"
                        >
                            <Sparkles className="w-3 h-3 text-[#A480F2]" />
                            <span className="text-[#A480F2] text-xs font-bold tracking-wider">
                                +{sessionExp.toLocaleString()} EXP claimed this session
                            </span>
                        </motion.div>
                    )}

                    {canReincarnate && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                            className="mt-6 ml-9"
                        >
                            <button
                                onClick={() => setShowReincarnateConfirm(true)}
                                className="w-full max-w-sm flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold
                                text-sm tracking-[0.2em] uppercase transition-all
                                bg-yellow-600/20 border-2 border-yellow-500/50 text-yellow-500
                                hover:bg-yellow-500/30 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                            >
                                <Trophy className="w-5 h-5" />
                                Cup of Reincarnation
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>

            {hasInvasion && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative w-full rounded-2xl p-6 ${invBgClass} ${invBorderClass} border-2 overflow-hidden shadow-[0_0_30px_${invColor}]`}
                >
                    <div className="relative z-10 text-center space-y-4">
                        <h2 className={`text-4xl font-caros font-black ${invTextClass} uppercase tracking-[0.2em] drop-shadow-md`}>
                            {invasion.monarch} INVASION
                        </h2>
                        <p className={`font-bold uppercase tracking-widest text-sm ${invTextClass} bg-black/50 inline-block px-4 py-1 rounded-lg`}>
                            {invDebuffText}
                        </p>
                        
                        {invasion.expiresAt && (
                            <p className="text-gray-300 font-mono text-sm tracking-widest">
                                Time Limit: {new Date(invasion.expiresAt).toLocaleString()}
                            </p>
                        )}

                        <div className="w-full max-w-2xl mx-auto h-6 bg-black/90 border rounded-sm relative overflow-hidden mt-4" style={{ borderColor: invColor }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(0, (invasion.hp / invasion.maxHp) * 100)}%` }}
                                transition={{ duration: 1.0 }}
                                className="absolute top-0 left-0 h-full shadow-lg"
                                style={{ backgroundColor: invColor, boxShadow: `0 0 15px ${invColor}` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-white drop-shadow-md text-sm">
                                {invasion.hp.toLocaleString()} / {invasion.maxHp.toLocaleString()} HP
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Add form ───────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-[#A480F2]/20 bg-black/70 backdrop-blur-sm p-5 space-y-3">
                <p className="text-[10px] font-bold tracking-[0.35em] text-[#A480F2]/50 uppercase">
                    New Sovereign Objective
                </p>

                <input
                    type="text"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="State your objective..."
                    maxLength={120}
                    className="w-full bg-[#A480F2]/5 border border-[#A480F2]/20 rounded-xl px-4 py-3 text-sm text-white
                        placeholder:text-[#A480F2]/20 focus:outline-none focus:border-[#A480F2]/55
                        focus:shadow-[0_0_18px_rgba(164,128,242,0.12)] transition-all"
                />

                <div className="flex gap-3">
                    <input
                        type="number"
                        value={newExp}
                        onChange={e => setNewExp(e.target.value === "" ? "" : Number(e.target.value))}
                        onKeyDown={onKey}
                        placeholder="EXP..."
                        min={1}
                        max={999999}
                        className="w-36 bg-[#A480F2]/5 border border-[#A480F2]/20 rounded-xl px-4 py-3 text-sm text-white
                            placeholder:text-[#A480F2]/20 focus:outline-none focus:border-[#A480F2]/55
                            focus:shadow-[0_0_18px_rgba(164,128,242,0.12)] transition-all"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newTask.trim() || !newExp || Number(newExp) <= 0}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold
                            text-xs tracking-[0.15em] uppercase transition-all
                            bg-[#A480F2]/15 border border-[#A480F2]/35 text-[#A480F2]
                            hover:bg-[#A480F2]/28 hover:shadow-[0_0_20px_rgba(164,128,242,0.22)]
                            disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>

                {errorMsg && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-xs tracking-wide"
                    >
                        ⚠ {errorMsg}
                    </motion.p>
                )}
            </div>

            {/* ── Active objectives ──────────────────────────────────────────── */}
            {active.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-bold tracking-[0.35em] text-[#A480F2]/50 uppercase px-1">
                        Active — {active.length}
                    </p>
                    <AnimatePresence initial={false}>
                        {active.map(obj => (
                            <motion.div
                                key={obj.id}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-black
                                    border border-[#A480F2]/18 hover:border-[#A480F2]/38
                                    hover:shadow-[0_0_18px_rgba(164,128,242,0.07)] transition-all"
                            >
                                {/* EXP badge */}
                                <div className="shrink-0 w-14 text-center py-1 rounded-lg bg-[#A480F2]/10 border border-[#A480F2]/20">
                                    <span className="text-[#A480F2] text-xs font-bold font-caros">{fmtExp(obj.exp)}</span>
                                    <span className="block text-[#A480F2]/45 text-[8px] tracking-widest uppercase">EXP</span>
                                </div>

                                <p className="flex-1 text-sm text-gray-300 leading-snug">{obj.description}</p>

                                {/* Remove (hover only) */}
                                <button
                                    onClick={() => handleRemove(obj.id)}
                                    className="p-1.5 rounded-lg text-gray-700 hover:text-red-400/80 hover:bg-red-400/10
                                        opacity-0 group-hover:opacity-100 transition-all"
                                    title="Remove"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Fulfill */}
                                <button
                                    onClick={() => handleFulfill(obj)}
                                    disabled={!!loadingId}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                                        tracking-[0.1em] uppercase transition-all
                                        bg-[#A480F2]/12 border border-[#A480F2]/35 text-[#A480F2]
                                        hover:bg-[#A480F2]/28 hover:shadow-[0_0_14px_rgba(164,128,242,0.28)]
                                        disabled:opacity-35 disabled:cursor-not-allowed"
                                >
                                    {loadingId === obj.id ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                                            className="w-3.5 h-3.5 border-2 border-[#A480F2]/35 border-t-[#A480F2] rounded-full"
                                        />
                                    ) : (
                                        <Check className="w-3.5 h-3.5" />
                                    )}
                                    Fulfill
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Empty state ────────────────────────────────────────────────── */}
            {objectives.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Lock className="w-9 h-9 text-[#A480F2]/15 mb-3"
                        style={{ filter: "drop-shadow(0 0 6px rgba(164,128,242,0.15))" }} />
                    <p className="text-[#A480F2]/30 text-xs font-bold tracking-[0.25em] uppercase">No objectives set</p>
                    <p className="text-gray-800 text-xs mt-1">A Monarch without purpose is just a ghost.</p>
                </div>
            )}

            {/* ── Fulfilled ──────────────────────────────────────────────────── */}
            {fulfilled.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold tracking-[0.35em] text-gray-800 uppercase px-1">
                        Fulfilled — {fulfilled.length}
                    </p>
                    {fulfilled.map(obj => (
                        <div key={obj.id}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/30
                                border border-white/[0.04] opacity-40"
                        >
                            <div className="shrink-0 w-14 text-center py-1 rounded-lg bg-white/5 border border-white/8">
                                <span className="text-gray-700 text-xs font-bold font-caros">+{fmtExp(obj.exp)}</span>
                                <span className="block text-gray-800 text-[8px] tracking-widest uppercase">EXP</span>
                            </div>
                            <p className="flex-1 text-sm text-gray-700 line-through leading-snug">{obj.description}</p>
                            <Check className="w-4 h-4 text-[#A480F2]/40 shrink-0" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
