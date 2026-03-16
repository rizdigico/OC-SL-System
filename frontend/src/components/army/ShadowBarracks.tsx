"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Swords, BookOpen, Zap } from "lucide-react";
import {
    SHADOW_INDEX,
    type ShadowEntry,
    type OwnedShadow,
} from "@/lib/ShadowData";

// ── Rank colour map ────────────────────────────────────────────────────────────

const RANK_COLOR: Record<string, string> = {
    E:      "#64748b",
    D:      "#22c55e",
    C:      "#eab308",
    B:      "#f97316",
    A:      "#ef4444",
    S:      "#a855f7",
    UNIQUE: "#b200ff",
};

// ── Collection Book card ───────────────────────────────────────────────────────

function ShadowCard({
    shadow,
    owned,
    ownedData,
}: {
    shadow:    ShadowEntry;
    owned:     boolean;
    ownedData: OwnedShadow | undefined;
}) {
    const rankColor = RANK_COLOR[shadow.rank] ?? "#64748b";
    const accent    = owned ? rankColor : "#1c1c2e";

    return (
        <motion.div
            layout
            whileHover={owned ? { scale: 1.02, y: -2 } : {}}
            className="relative rounded-xl border overflow-hidden flex flex-col"
            style={{
                background:  owned ? `${rankColor}0d` : "rgba(10,8,20,0.7)",
                borderColor: owned ? `${rankColor}50` : "rgba(255,255,255,0.06)",
                boxShadow:   owned ? `0 0 18px ${rankColor}22, inset 0 0 20px ${rankColor}08` : "none",
                minHeight:   "130px",
            }}
        >
            {/* Top glow line for owned */}
            {owned && (
                <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${rankColor}80, transparent)` }}
                />
            )}

            <div className="p-3 flex flex-col gap-1.5 flex-1">
                {/* Rank badge */}
                <div className="flex items-center justify-between">
                    <span
                        className="text-[8px] font-black tracking-[0.2em] px-1.5 py-0.5 rounded border"
                        style={{
                            color:       rankColor,
                            borderColor: `${rankColor}45`,
                            background:  `${rankColor}18`,
                        }}
                    >
                        {shadow.isBoss ? "UNIQUE" : `${shadow.rank}-RANK`}
                    </span>
                    {owned && ownedData && (
                        <span className="text-[8px] font-black text-purple-400">
                            Lv.{ownedData.level}
                        </span>
                    )}
                </div>

                {/* Shadow silhouette or name */}
                <div className="flex-1 flex flex-col items-center justify-center py-1">
                    {owned ? (
                        <>
                            <Zap
                                className="w-6 h-6 mb-1"
                                style={{
                                    color:  rankColor,
                                    filter: `drop-shadow(0 0 8px ${rankColor})`,
                                }}
                            />
                            <p
                                className="text-[11px] font-black tracking-wider text-center uppercase"
                                style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}80` }}
                            >
                                {shadow.name}
                            </p>
                            <p className="text-[8px] text-zinc-600 mt-0.5 tracking-wider">
                                {shadow.type}
                            </p>
                        </>
                    ) : (
                        <>
                            <Lock className="w-5 h-5 text-zinc-800 mb-1" />
                            <p className="text-[9px] font-black tracking-wider text-zinc-700 uppercase blur-[1px] select-none text-center">
                                {shadow.name}
                            </p>
                        </>
                    )}
                </div>

                {/* EXP bar for owned shadows */}
                {owned && ownedData && (
                    <div>
                        <div className="h-1 rounded-full bg-zinc-900 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.round((ownedData.exp / ownedData.expMax) * 100)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, ${rankColor}60, ${rankColor})`,
                                    boxShadow:  `0 0 4px ${rankColor}80`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Origin footer */}
            <div
                className="px-3 py-1.5 border-t"
                style={{ borderColor: `${accent}20` }}
            >
                <p className="text-[7px] text-zinc-700 uppercase tracking-widest truncate">
                    {shadow.origin}
                </p>
            </div>
        </motion.div>
    );
}

// ── Active Roster row ──────────────────────────────────────────────────────────

function RosterRow({
    shadow,
    ownedData,
    isEquipped,
    onToggleEquip,
}: {
    shadow:        ShadowEntry;
    ownedData:     OwnedShadow;
    isEquipped:    boolean;
    onToggleEquip: (id: string) => void;
}) {
    const rankColor = RANK_COLOR[shadow.rank] ?? "#64748b";
    const expPct    = Math.round((ownedData.exp / ownedData.expMax) * 100);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border p-3 flex items-center gap-3"
            style={{
                background:  isEquipped ? `${rankColor}0e` : "rgba(10,8,20,0.6)",
                borderColor: isEquipped ? `${rankColor}45` : "rgba(255,255,255,0.07)",
                boxShadow:   isEquipped ? `0 0 16px ${rankColor}18` : "none",
            }}
        >
            {/* Icon */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                    background: `${rankColor}18`,
                    border:     `1.5px solid ${rankColor}40`,
                    boxShadow:  isEquipped ? `0 0 12px ${rankColor}40` : "none",
                }}
            >
                <Zap
                    className="w-5 h-5"
                    style={{ color: rankColor, filter: `drop-shadow(0 0 5px ${rankColor})` }}
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span
                        className="text-[11px] font-black uppercase tracking-wider"
                        style={{ color: rankColor }}
                    >
                        {shadow.name}
                    </span>
                    {shadow.isBoss && (
                        <span
                            className="text-[7px] font-black px-1.5 py-0.5 rounded border tracking-widest"
                            style={{
                                color:       "#b200ff",
                                borderColor: "#b200ff40",
                                background:  "#b200ff15",
                            }}
                        >
                            UNIQUE
                        </span>
                    )}
                </div>
                <p className="text-[9px] text-zinc-600 mb-1.5">
                    Lv.{ownedData.level} · {shadow.type} · {shadow.rank}-rank
                </p>
                {/* EXP bar */}
                <div className="h-1 rounded-full bg-zinc-900 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${expPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                            background: `linear-gradient(90deg, ${rankColor}60, ${rankColor})`,
                            boxShadow:  `0 0 4px ${rankColor}60`,
                        }}
                    />
                </div>
                <p className="text-[8px] text-zinc-700 mt-0.5 tabular-nums">
                    {ownedData.exp.toLocaleString()} / {ownedData.expMax.toLocaleString()} EXP
                </p>
            </div>

            {/* Equip button */}
            <button
                onClick={() => onToggleEquip(shadow.id)}
                className="flex-shrink-0 text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border transition-all duration-200"
                style={
                    isEquipped
                        ? {
                              color:       rankColor,
                              borderColor: `${rankColor}60`,
                              background:  `${rankColor}18`,
                          }
                        : {
                              color:       "#52525b",
                              borderColor: "rgba(255,255,255,0.08)",
                              background:  "transparent",
                          }
                }
            >
                {isEquipped ? "DEPLOYED" : "DEPLOY"}
            </button>
        </motion.div>
    );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

interface ShadowBarracksProps {
    isOpen:        boolean;
    onClose:       () => void;
    ownedShadows:  OwnedShadow[];
}

export function ShadowBarracks({ isOpen, onClose, ownedShadows }: ShadowBarracksProps) {
    const [tab,       setTab]       = useState<"collection" | "roster">("collection");
    const [equipped,  setEquipped]  = useState<Set<string>>(new Set(["igris", "beru", "bellion"]));

    const ownedIds = new Set(ownedShadows.map(s => s.id));

    const toggleEquip = (id: string) => {
        setEquipped(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const rosterShadows = SHADOW_INDEX.filter(s => ownedIds.has(s.id));

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9990] bg-black/75 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1,    y:  0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed inset-0 z-[9991] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col pointer-events-auto"
                            style={{
                                background:  "rgba(6,4,16,0.97)",
                                border:      "1px solid #b200ff35",
                                boxShadow:   "0 0 60px #b200ff20, 0 0 120px #b200ff0a, inset 0 0 40px rgba(178,0,255,0.04)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            {/* Top glow line */}
                            <div
                                className="absolute top-0 left-0 right-0 h-px"
                                style={{ background: "linear-gradient(90deg, transparent, #b200ff80, transparent)" }}
                            />

                            {/* Corner accent */}
                            <div
                                className="absolute top-0 left-0 w-24 h-24 pointer-events-none"
                                style={{
                                    background: "radial-gradient(circle at 0% 0%, #b200ff15 0%, transparent 70%)",
                                }}
                            />
                            <div
                                className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none"
                                style={{
                                    background: "radial-gradient(circle at 100% 100%, #b200ff10 0%, transparent 70%)",
                                }}
                            />

                            {/* ── Header ──────────────────────────────────────────── */}
                            <div
                                className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                                style={{ borderColor: "rgba(178,0,255,0.18)" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{
                                            background: "rgba(178,0,255,0.15)",
                                            border:     "1px solid rgba(178,0,255,0.4)",
                                            boxShadow:  "0 0 12px rgba(178,0,255,0.3)",
                                        }}
                                    >
                                        <Swords className="w-4 h-4" style={{ color: "#b200ff" }} />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-black tracking-[0.3em] uppercase"
                                            style={{ color: "#b200ff", textShadow: "0 0 14px rgba(178,0,255,0.5)" }}
                                        >
                                            Shadow Army
                                        </p>
                                        <p className="text-[9px] text-zinc-600 tracking-widest uppercase">
                                            Necromancer&apos;s Repository
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                        <span className="text-[9px] font-bold text-purple-500 tracking-widest">
                                            {ownedIds.size} / {SHADOW_INDEX.length} EXTRACTED
                                        </span>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all"
                                    >
                                        <X className="w-3.5 h-3.5 text-zinc-500" />
                                    </button>
                                </div>
                            </div>

                            {/* ── Tabs ────────────────────────────────────────────── */}
                            <div
                                className="flex border-b flex-shrink-0"
                                style={{ borderColor: "rgba(178,0,255,0.12)" }}
                            >
                                {(["collection", "roster"] as const).map(t => {
                                    const active = tab === t;
                                    return (
                                        <button
                                            key={t}
                                            onClick={() => setTab(t)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black tracking-[0.25em] uppercase transition-all relative"
                                            style={{
                                                color: active ? "#b200ff" : "#3f3f46",
                                            }}
                                        >
                                            {t === "collection"
                                                ? <BookOpen className="w-3.5 h-3.5" />
                                                : <Swords   className="w-3.5 h-3.5" />
                                            }
                                            {t === "collection" ? "Collection Book" : "Active Roster"}
                                            {active && (
                                                <motion.div
                                                    layoutId="tab-indicator"
                                                    className="absolute bottom-0 left-0 right-0 h-px"
                                                    style={{ background: "linear-gradient(90deg, transparent, #b200ff, transparent)" }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ── Body ────────────────────────────────────────────── */}
                            <div className="flex-1 overflow-y-auto p-5">
                                <AnimatePresence mode="wait">
                                    {tab === "collection" ? (
                                        <motion.div
                                            key="collection"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.2 }}
                                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                                        >
                                            {SHADOW_INDEX.map((shadow, i) => (
                                                <motion.div
                                                    key={shadow.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.04, duration: 0.2 }}
                                                >
                                                    <ShadowCard
                                                        shadow={shadow}
                                                        owned={ownedIds.has(shadow.id)}
                                                        ownedData={ownedShadows.find(o => o.id === shadow.id)}
                                                    />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="roster"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {rosterShadows.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                    <Lock className="w-8 h-8 text-zinc-800" />
                                                    <p className="text-[11px] font-black tracking-widest text-zinc-700 uppercase">
                                                        No Shadows Extracted
                                                    </p>
                                                    <p className="text-[9px] text-zinc-800">
                                                        Complete dungeons to extract shadows
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {/* Summary */}
                                                    <div
                                                        className="flex items-center justify-between px-4 py-2.5 rounded-xl border mb-4"
                                                        style={{
                                                            background:  "rgba(178,0,255,0.04)",
                                                            borderColor: "rgba(178,0,255,0.15)",
                                                        }}
                                                    >
                                                        <span className="text-[9px] font-black tracking-[0.3em] text-purple-500/60 uppercase">
                                                            Deployed Shadows
                                                        </span>
                                                        <span
                                                            className="text-sm font-black"
                                                            style={{ color: "#b200ff", textShadow: "0 0 10px rgba(178,0,255,0.5)" }}
                                                        >
                                                            {equipped.size} / {rosterShadows.length}
                                                        </span>
                                                    </div>

                                                    {rosterShadows.map(shadow => {
                                                        const od = ownedShadows.find(o => o.id === shadow.id);
                                                        if (!od) return null;
                                                        return (
                                                            <RosterRow
                                                                key={shadow.id}
                                                                shadow={shadow}
                                                                ownedData={od}
                                                                isEquipped={equipped.has(shadow.id)}
                                                                onToggleEquip={toggleEquip}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
