"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Zap, Shield, Crown, Package } from "lucide-react";
import { useSovereign } from "@/context/SovereignContext";
import {
    ITEM_DATABASE,
    RARITY_COLOR,
    type Item,
    type ItemCategory,
} from "@/lib/ItemData";

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORIES: { label: string; value: ItemCategory | "All"; icon: React.ReactNode }[] = [
    { label: "All",        value: "All",        icon: <Package  className="w-3.5 h-3.5" /> },
    { label: "Consumable", value: "Consumable", icon: <Zap      className="w-3.5 h-3.5" /> },
    { label: "Gear",       value: "Gear",       icon: <Shield   className="w-3.5 h-3.5" /> },
    { label: "Artifact",   value: "Artifact",   icon: <Crown    className="w-3.5 h-3.5" /> },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function ItemCard({
    item,
    canAfford,
    purchased,
    onBuy,
}: {
    item:      Item;
    canAfford: boolean;
    purchased: boolean;
    onBuy:     () => void;
}) {
    const rarityColor = RARITY_COLOR[item.rarity];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-xl border flex flex-col overflow-hidden"
            style={{
                background:  `${rarityColor}08`,
                borderColor: `${rarityColor}35`,
                boxShadow:   `0 0 16px ${rarityColor}10`,
            }}
        >
            {/* Top glow line */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${rarityColor}60, transparent)` }}
            />

            <div className="p-4 flex flex-col gap-2.5 flex-1">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                        <span
                            className="text-[8px] font-black tracking-[0.25em] uppercase px-1.5 py-0.5 rounded border w-fit"
                            style={{
                                color:       rarityColor,
                                borderColor: `${rarityColor}45`,
                                background:  `${rarityColor}15`,
                            }}
                        >
                            {item.rarity}
                        </span>
                        <p
                            className="text-[12px] font-black uppercase tracking-wide leading-tight"
                            style={{ color: rarityColor, textShadow: `0 0 8px ${rarityColor}50` }}
                        >
                            {item.name}
                        </p>
                    </div>
                    {item.slot && (
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider flex-shrink-0">
                            {item.slot}
                        </span>
                    )}
                </div>

                {/* Description */}
                <p className="text-[10px] text-zinc-500 leading-relaxed flex-1">
                    {item.description}
                </p>

                {/* Effect / Buff */}
                {(item.effect || item.buff) && (
                    <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                        style={{
                            background:  `${rarityColor}0d`,
                            borderColor: `${rarityColor}30`,
                        }}
                    >
                        <Zap className="w-3 h-3 flex-shrink-0" style={{ color: rarityColor }} />
                        <span
                            className="text-[10px] font-black tracking-wider"
                            style={{ color: rarityColor }}
                        >
                            {item.effect ?? item.buff}
                        </span>
                    </div>
                )}
            </div>

            {/* Footer: Cost + Buy */}
            <div
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{ borderColor: `${rarityColor}18` }}
            >
                <span
                    className="text-sm font-black tabular-nums"
                    style={{
                        color:      "#eab308",
                        textShadow: "0 0 8px rgba(234,179,8,0.4)",
                    }}
                >
                    {item.cost.toLocaleString()} G
                </span>

                <motion.button
                    whileHover={canAfford && !purchased ? { scale: 1.05 } : {}}
                    whileTap={canAfford && !purchased ? { scale: 0.96 } : {}}
                    onClick={canAfford && !purchased ? onBuy : undefined}
                    className="text-[9px] font-black tracking-[0.25em] uppercase px-4 py-1.5 rounded-lg border transition-all"
                    style={
                        purchased
                            ? { color: "#22c55e", borderColor: "#22c55e40", background: "#22c55e10" }
                            : canAfford
                            ? {
                                  color:       rarityColor,
                                  borderColor: `${rarityColor}50`,
                                  background:  `${rarityColor}12`,
                                  boxShadow:   `0 0 10px ${rarityColor}20`,
                              }
                            : { color: "#3f3f46", borderColor: "rgba(255,255,255,0.06)", background: "transparent", cursor: "not-allowed" }
                    }
                >
                    {purchased ? "BOUGHT" : canAfford ? "BUY" : "NEED GOLD"}
                </motion.button>
            </div>
        </motion.div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface SystemShopProps {
    isOpen:  boolean;
    onClose: () => void;
    user:    any;
    setUser: (updater: (prev: any) => any) => void;
}

export function SystemShop({ isOpen, onClose }: SystemShopProps) {
    const [activeCategory, setActiveCategory] = useState<ItemCategory | "All">("All");
    const [justBought,     setJustBought]     = useState<Set<string>>(new Set());
    const { sovereign, updateSovereign }      = useSovereign();

    const gold     = sovereign?.gold ?? 0;
    const ownedIds = new Set((sovereign?.inventory ?? []).map(i => i.id));

    const visibleItems = activeCategory === "All"
        ? ITEM_DATABASE
        : ITEM_DATABASE.filter(i => i.category === activeCategory);

    const handleBuy = async (item: Item) => {
        if (gold < item.cost) return;

        // Convert statBuff (long stat names) → sovereign effect format
        const effect: Record<string, number> = {};
        if (item.statBuff) {
            for (const [k, v] of Object.entries(item.statBuff)) {
                if (v !== undefined) effect[k] = v;
            }
        }
        // Parse human-readable consumable effect into numeric values
        if (item.category === "Consumable" && item.effect) {
            const m = item.effect.match(/([+-]?\d+)\s*(HP|MP|Fatigue|EXP)/i);
            if (m) {
                const val  = parseInt(m[1]);
                const type = m[2].toLowerCase();
                if (type === "hp")      effect.hp      = val;
                else if (type === "mp") effect.mp      = val;
                else if (type === "fatigue") effect.fatigue = val;
                else if (type === "exp")    effect.exp = val;
            }
        }

        try {
            const res = await fetch("/api/sovereign", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    action:      "buyItem",
                    itemId:      item.id,
                    name:        item.name,
                    type:        item.category === "Consumable" ? "consumable" : "gear",
                    description: item.description,
                    effect,
                    cost:        item.cost,
                }),
            });
            if (res.ok) {
                updateSovereign(await res.json());
                setJustBought(prev => new Set([...prev, item.id]));
                setTimeout(() => {
                    setJustBought(prev => { const n = new Set(prev); n.delete(item.id); return n; });
                }, 2000);
            }
        } catch { /* network error — sovereign stays unchanged */ }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="shop-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9990] bg-black/75 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        key="shop-panel"
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1,    y:  0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed inset-0 z-[9991] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="relative w-full max-w-3xl max-h-[88vh] rounded-2xl overflow-hidden flex flex-col pointer-events-auto"
                            style={{
                                background:     "rgba(6,7,14,0.98)",
                                border:         "1px solid rgba(234,179,8,0.3)",
                                boxShadow:      "0 0 60px rgba(234,179,8,0.12), 0 0 120px rgba(59,130,246,0.06), inset 0 0 40px rgba(234,179,8,0.03)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            {/* Top glow */}
                            <div
                                className="absolute top-0 left-0 right-0 h-px"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(234,179,8,0.7), rgba(59,130,246,0.5), transparent)" }}
                            />

                            {/* ── Header ─────────────────────────────────────── */}
                            <div
                                className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                                style={{ borderColor: "rgba(234,179,8,0.15)" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{
                                            background: "rgba(234,179,8,0.12)",
                                            border:     "1px solid rgba(234,179,8,0.35)",
                                            boxShadow:  "0 0 12px rgba(234,179,8,0.2)",
                                        }}
                                    >
                                        <ShoppingCart className="w-4 h-4 text-yellow-400" />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-black tracking-[0.3em] uppercase"
                                            style={{ color: "#eab308", textShadow: "0 0 12px rgba(234,179,8,0.5)" }}
                                        >
                                            System Shop
                                        </p>
                                        <p className="text-[9px] text-zinc-600 tracking-widest uppercase">
                                            Gate Hunter Marketplace
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Gold balance */}
                                    <div
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                                        style={{
                                            background:  "rgba(234,179,8,0.07)",
                                            borderColor: "rgba(234,179,8,0.3)",
                                        }}
                                    >
                                        <span className="text-[9px] font-black tracking-widest text-yellow-500/60 uppercase">
                                            Balance
                                        </span>
                                        <span
                                            className="text-sm font-black text-yellow-400 tabular-nums"
                                            style={{ textShadow: "0 0 8px rgba(234,179,8,0.5)" }}
                                        >
                                            {gold.toLocaleString()} G
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

                            {/* ── Category tabs ──────────────────────────────── */}
                            <div
                                className="flex border-b flex-shrink-0"
                                style={{ borderColor: "rgba(234,179,8,0.1)" }}
                            >
                                {CATEGORIES.map(cat => {
                                    const active = activeCategory === cat.value;
                                    return (
                                        <button
                                            key={cat.value}
                                            onClick={() => setActiveCategory(cat.value)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all relative"
                                            style={{ color: active ? "#eab308" : "#3f3f46" }}
                                        >
                                            {cat.icon}
                                            {cat.label}
                                            {active && (
                                                <motion.div
                                                    layoutId="shop-tab"
                                                    className="absolute bottom-0 left-0 right-0 h-px"
                                                    style={{ background: "linear-gradient(90deg, transparent, rgba(234,179,8,0.8), transparent)" }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ── Item grid ──────────────────────────────────── */}
                            <div className="flex-1 overflow-y-auto p-5">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeCategory}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.18 }}
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                    >
                                        {visibleItems.map((item, i) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y:  0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <ItemCard
                                                    item={item}
                                                    canAfford={gold >= item.cost}
                                                    purchased={justBought.has(item.id) || (item.category !== "Consumable" && ownedIds.has(item.id))}
                                                    onBuy={() => handleBuy(item)}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
