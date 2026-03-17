import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package } from "lucide-react";
import { useSystemAudio } from "@/hooks/useSystemAudio";

interface InventoryGridProps {
    isOpen: boolean;
    onClose: () => void;
    user?: any;
    setUser?: (user: any) => void;
}

export function InventoryGrid({ isOpen, onClose, user, setUser }: InventoryGridProps) {
    const [inventory, setInventory] = useState<any>({ maxSlots: 20, items: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const { playClick, playError } = useSystemAudio();

    const fetchInventory = async () => {
        const token = localStorage.getItem("system_token");
        if (!token) return;

        try {
            setIsLoading(true);
            const res = await fetch("http://localhost:5000/api/inventory", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInventory(data);
            } else {
                console.error("Failed to fetch inventory");
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchInventory();
            setActiveIndex(null);
        }
    }, [isOpen]);

    const handleAction = async (item: any) => {
        const token = localStorage.getItem("system_token");
        if (!token) return;

        // The directive mentions /consume or /equip. Our backend has /use for consumables.
        const endpoint = item.type === 'consumable' ? '/api/inventory/use' : '/api/inventory/equip';

        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ itemId: item._id })
            });

            if (res.ok) {
                playClick();
                setActiveIndex(null);
                fetchInventory(); // Refresh after action
                if (setUser) {
                    const meRes = await fetch("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
                    if (meRes.ok) setUser(await meRes.json());
                }
            } else {
                playError();
                console.error("Action failed");
            }
        } catch (error) {
            playError();
            console.error("Action error", error);
        }
    };

    const maxSlots = inventory?.maxSlots || 30;
    const items = inventory?.items || [];

    // Create an array representing all slots (empty or filled)
    const slots = Array.from({ length: maxSlots }).map((_, i) => items[i] || null);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="inventory-window"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-system-black/60 backdrop-blur-md"
                    onClick={() => setActiveIndex(null)}
                >
                    <div 
                        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-system-black/80 border-[2px] border-[#011BDE] rounded-2xl shadow-[0_0_50px_rgba(1,27,222,0.3)] flex flex-col backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[#011BDE]/40 bg-system-black/90">
                            <div className="flex items-center gap-4">
                                <Package className="w-8 h-8 text-system-neon" />
                                <h2 className="text-2xl font-caros font-black text-system-neon tracking-wider uppercase drop-shadow-[0_0_8px_rgba(17,210,239,0.5)]">
                                    Inventory
                                </h2>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-sm font-caros text-system-blue uppercase tracking-widest font-bold">
                                    {items.length} / {maxSlots} Slots
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-system-blue/80 hover:text-system-neon hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-20 text-system-neon font-caros animate-pulse tracking-widest">
                                    LOADING INVENTORY...
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-4">
                                    {slots.map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => item && setActiveIndex(activeIndex === index ? null : index)}
                                            className={`aspect-square rounded-xl border-2 flex items-center justify-center relative transition-all duration-300 ${item
                                                    ? "bg-black/50 border-[#011BDE]/60 shadow-[inset_0_0_15px_rgba(1,27,222,0.2)] hover:border-system-neon hover:shadow-[0_0_20px_rgba(17,210,239,0.4)] cursor-pointer"
                                                    : "bg-white/5 border-white/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                                                } ${activeIndex === index ? "border-system-neon shadow-[0_0_20px_rgba(17,210,239,0.6)]" : ""}`}
                                        >
                                            {item ? (
                                                <>
                                                    <span className="text-4xl drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] hover:scale-110 transition-transform">
                                                        {item.type === 'consumable' ? "🧪" : "🗡️"}
                                                    </span>
                                                    <span className="absolute bottom-1 right-1 text-xs text-white font-bold bg-black/50 px-1 rounded">x{item.quantity}</span>

                                                    {/* Context Menu / Tooltip */}
                                                    <AnimatePresence>
                                                        {activeIndex === index && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 10 }}
                                                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-system-black/95 border border-[#011BDE]/80 rounded-lg p-3 shadow-[0_0_30px_rgba(1,27,222,0.8)] z-30 flex flex-col gap-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div>
                                                                    <h4 className="text-white font-bold text-sm mb-1">{item.name}</h4>
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold inline-block mb-2 ${item.type === 'consumable' ? 'text-blue-300 border-blue-500 bg-blue-500/20' : 'text-purple-300 border-purple-500 bg-purple-500/20'}`}>
                                                                        {item.type}
                                                                    </span>
                                                                    <p className="text-gray-400 text-xs mb-2 leading-relaxed">{item.description}</p>
                                                                    {item.type !== 'consumable' && (
                                                                        <div className="text-[10px] text-system-neon font-bold uppercase tracking-widest border-t border-system-neon/30 pt-1 mt-1 mb-2">
                                                                            {item.equipped ? "Equipped" : "Unequipped"}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    onClick={() => handleAction(item)}
                                                                    className="w-full py-2 bg-[#011BDE]/20 hover:bg-[#011BDE]/50 border border-[#011BDE]/60 rounded-md text-system-neon text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(1,27,222,0.2)]"
                                                                >
                                                                    {item.type === 'consumable' ? 'Consume' : (item.equipped ? 'Unequip' : 'Equip')}
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-transparent to-black/40 rounded-lg flex items-center justify-center">
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
