"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Zap } from "lucide-react";
import { useSovereign } from "@/context/SovereignContext";
import {
    ITEM_DATABASE,
    RARITY_COLOR,
    SLOT_ICON,
    type Item,
    type EquipSlot,
    type ItemCategory,
    type ItemRarity,
} from "@/lib/ItemData";

// ── Paper-doll slot layout ─────────────────────────────────────────────────────

const SLOT_LAYOUT: { slot: EquipSlot; label: string }[] = [
    { slot: "Weapon",  label: "Weapon"  },
    { slot: "Helmet",  label: "Helmet"  },
    { slot: "Chest",   label: "Chest"   },
    { slot: "Gloves",  label: "Gloves"  },
    { slot: "Boots",   label: "Boots"   },
    { slot: "Ring",    label: "Ring"    },
];

// ── Mini item cell (used in the unequipped grid) ───────────────────────────────

function InventoryCell({ item, onClick }: { item: Item; onClick: () => void }) {
    const color = RARITY_COLOR[item.rarity];
    return (
        <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className="relative rounded-xl border p-3 flex flex-col gap-2 text-left w-full"
            style={{
                background:  `${color}08`,
                borderColor: `${color}35`,
                boxShadow:   `0 0 12px ${color}10`,
            }}
            title={`Equip ${item.name}`}
        >
            {/* Rarity stripe */}
            <div
                className="absolute top-0 left-0 w-0.5 h-full rounded-l-xl"
                style={{ background: color }}
            />

            <div className="pl-1">
                <span
                    className="text-[8px] font-black tracking-[0.2em] uppercase"
                    style={{ color }}
                >
                    {item.slot ?? item.category}
                </span>
                <p
                    className="text-[11px] font-black uppercase tracking-wide leading-tight mt-0.5"
                    style={{ color, textShadow: `0 0 6px ${color}40` }}
                >
                    {item.name}
                </p>
                {(item.effect ?? item.buff) && (
                    <p className="text-[9px] text-zinc-600 mt-1 font-bold">
                        {item.effect ?? item.buff}
                    </p>
                )}
            </div>

            {item.slot && (
                <span className="text-[18px] self-center mt-auto opacity-50">
                    {SLOT_ICON[item.slot]}
                </span>
            )}

            <p className="text-[8px] text-zinc-700 pl-1 tracking-widest uppercase">
                Tap to equip →
            </p>
        </motion.button>
    );
}

// ── Equipped slot card ────────────────────────────────────────────────────────

function EquipSlotCard({
    slot,
    item,
    onUnequip,
}: {
    slot:      EquipSlot;
    item:      Item | undefined;
    onUnequip: () => void;
}) {
    const color = item ? RARITY_COLOR[item.rarity] : "#27272a";

    return (
        <div
            className="relative rounded-xl border flex flex-col gap-2 p-3 min-h-[100px] overflow-hidden"
            style={{
                background:  item ? `${color}0a` : "rgba(9,8,18,0.5)",
                borderColor: item ? `${color}40` : "rgba(255,255,255,0.06)",
                boxShadow:   item ? `0 0 14px ${color}15` : "none",
            }}
        >
            {/* Slot label */}
            <div className="flex items-center justify-between">
                <span
                    className="text-[8px] font-black tracking-[0.25em] uppercase"
                    style={{ color: item ? color : "#3f3f46" }}
                >
                    {SLOT_ICON[slot]} {slot}
                </span>
                {item && (
                    <button
                        onClick={onUnequip}
                        className="text-[8px] font-black tracking-widest text-zinc-700 hover:text-zinc-400 transition-colors uppercase"
                    >
                        Remove
                    </button>
                )}
            </div>

            {item ? (
                <>
                    <p
                        className="text-[11px] font-black uppercase tracking-wide leading-tight"
                        style={{ color, textShadow: `0 0 8px ${color}50` }}
                    >
                        {item.name}
                    </p>
                    {(item.effect ?? item.buff) && (
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded border"
                            style={{ background: `${color}0d`, borderColor: `${color}28` }}
                        >
                            <Zap className="w-2.5 h-2.5 flex-shrink-0" style={{ color }} />
                            <span className="text-[8px] font-black" style={{ color }}>
                                {item.effect ?? item.buff}
                            </span>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-[9px] text-zinc-800 uppercase tracking-widest">Empty</span>
                </div>
            )}
        </div>
    );
}

// ── Sovereign → Item lookup helper ──────────────────────────────────────────────

function lookupItem(sovId: string, sovName: string, sovType: string, sovDesc: string): Item {
    const catalog = ITEM_DATABASE.find(c => c.id === sovId);
    if (catalog) return catalog;
    // Fallback for items not in the static catalog (e.g. bought from Express shop)
    return {
        id:          sovId,
        name:        sovName,
        category:    (sovType === "consumable" ? "Consumable" : "Gear") as ItemCategory,
        cost:        0,
        rarity:      "Common" as ItemRarity,
        description: sovDesc,
    };
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface PlayerInventoryProps {
    isOpen:  boolean;
    onClose: () => void;
    user:    any;
    setUser: (updater: (prev: any) => any) => void;
}

export function PlayerInventory({ isOpen, onClose }: PlayerInventoryProps) {
    const { sovereign, updateSovereign } = useSovereign();

    // Build Item list + equipped map from sovereign state
    const sovereignInv = sovereign?.inventory ?? [];
    const inventory: Item[] = sovereignInv.map(sov =>
        lookupItem(sov.id, sov.name, sov.type, sov.description),
    );

    const equipped: Partial<Record<EquipSlot, Item>> = {};
    sovereignInv.filter(sov => sov.equipped).forEach(sov => {
        const item = lookupItem(sov.id, sov.name, sov.type, sov.description);
        if (item.slot) equipped[item.slot] = item;
    });

    // Items not currently equipped (consumables always show; gear only if not equipped)
    const unequipped = inventory.filter((item: Item) => {
        if (!item.slot) return true; // consumables
        return !equipped[item.slot] || equipped[item.slot]?.id !== item.id;
    });

    const handleEquip = async (item: Item) => {
        if (!item.slot) return;

        // If slot is already occupied, unequip the old item first
        const oldItem = equipped[item.slot];
        if (oldItem) {
            const unequipRes = await fetch("/api/sovereign", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ action: "unequipItem", itemId: oldItem.id }),
            });
            if (!unequipRes.ok) return;
            updateSovereign(await unequipRes.json());
        }

        // Now equip the new item
        try {
            const res = await fetch("/api/sovereign", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ action: "equipItem", itemId: item.id }),
            });
            if (res.ok) updateSovereign(await res.json());
        } catch { /* sovereign stays unchanged */ }
    };

    const handleUnequip = async (slot: EquipSlot) => {
        const item = equipped[slot];
        if (!item) return;
        try {
            const res = await fetch("/api/sovereign", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ action: "unequipItem", itemId: item.id }),
            });
            if (res.ok) updateSovereign(await res.json());
        } catch { /* sovereign stays unchanged */ }
    };

    const totalEquipped = Object.values(equipped).filter(Boolean).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="inv-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9990] bg-black/75 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        key="inv-panel"
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
                                border:         "1px solid rgba(59,130,246,0.25)",
                                boxShadow:      "0 0 60px rgba(59,130,246,0.1), inset 0 0 40px rgba(59,130,246,0.02)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            {/* Top glow */}
                            <div
                                className="absolute top-0 left-0 right-0 h-px"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)" }}
                            />

                            {/* ── Header ─────────────────────────────────────── */}
                            <div
                                className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                                style={{ borderColor: "rgba(59,130,246,0.15)" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{
                                            background: "rgba(59,130,246,0.12)",
                                            border:     "1px solid rgba(59,130,246,0.35)",
                                            boxShadow:  "0 0 12px rgba(59,130,246,0.2)",
                                        }}
                                    >
                                        <Package className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-black tracking-[0.3em] uppercase"
                                            style={{ color: "#60a5fa", textShadow: "0 0 12px rgba(96,165,250,0.4)" }}
                                        >
                                            Inventory
                                        </p>
                                        <p className="text-[9px] text-zinc-600 tracking-widest uppercase">
                                            {totalEquipped} / {SLOT_LAYOUT.length} slots equipped
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

                            {/* ── Body ───────────────────────────────────────── */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">

                                    {/* LEFT — Paper Doll ─────────────────────── */}
                                    <div
                                        className="p-5 border-b md:border-b-0 md:border-r"
                                        style={{ borderColor: "rgba(59,130,246,0.12)" }}
                                    >
                                        <p className="text-[9px] font-black tracking-[0.35em] text-blue-500/50 uppercase mb-4">
                                            Equipment
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {SLOT_LAYOUT.map(({ slot }) => (
                                                <EquipSlotCard
                                                    key={slot}
                                                    slot={slot}
                                                    item={equipped[slot]}
                                                    onUnequip={() => handleUnequip(slot)}
                                                />
                                            ))}
                                        </div>

                                        {/* Active stat bonuses summary */}
                                        {Object.keys(equipped).length > 0 && (
                                            <div
                                                className="mt-4 rounded-xl border p-3"
                                                style={{
                                                    background:  "rgba(59,130,246,0.04)",
                                                    borderColor: "rgba(59,130,246,0.15)",
                                                }}
                                            >
                                                <p className="text-[8px] font-black tracking-[0.3em] text-blue-500/50 uppercase mb-2">
                                                    Active Bonuses
                                                </p>
                                                {Object.values(equipped)
                                                    .filter(Boolean)
                                                    .map(item => item && (item.effect ?? item.buff) && (
                                                        <div key={item.id} className="flex items-center justify-between text-[9px] py-0.5">
                                                            <span className="text-zinc-600 truncate">{item.name}</span>
                                                            <span
                                                                className="font-black ml-2 flex-shrink-0"
                                                                style={{ color: RARITY_COLOR[item.rarity] }}
                                                            >
                                                                {item.effect ?? item.buff}
                                                            </span>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT — Bag items ─────────────────────── */}
                                    <div className="p-5">
                                        <p className="text-[9px] font-black tracking-[0.35em] text-zinc-600 uppercase mb-4">
                                            Bag ({unequipped.length})
                                        </p>

                                        {unequipped.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                <Package className="w-8 h-8 text-zinc-800" />
                                                <p className="text-[11px] font-black tracking-widest text-zinc-700 uppercase">
                                                    Bag is Empty
                                                </p>
                                                <p className="text-[9px] text-zinc-800">
                                                    Visit the System Shop to acquire items
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <AnimatePresence>
                                                    {unequipped.map((item: Item, i: number) => (
                                                        <motion.div
                                                            key={item.id + i}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            transition={{ delay: i * 0.04 }}
                                                        >
                                                            <InventoryCell
                                                                item={item}
                                                                onClick={() => handleEquip(item)}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
