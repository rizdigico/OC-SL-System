import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, AlertCircle } from "lucide-react";
import { useSystemAudio } from "@/hooks/useSystemAudio";

interface ShopInterfaceProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    setUser: (user: any) => void;
}

export function ShopInterface({ isOpen, onClose, user, setUser }: ShopInterfaceProps) {
    const [shopItems, setShopItems] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
    const [isFlashing, setIsFlashing] = useState(false);
    const { playClick, playError } = useSystemAudio();

    useEffect(() => {
        if (!isOpen) return;
        const fetchItems = async () => {
            const token = localStorage.getItem("system_token");
            if (!token) return;
            try {
                const res = await fetch("http://localhost:5000/api/shop", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setShopItems(data);
                }
            } catch (err) {
                console.error("Failed to fetch shop items", err);
            }
        };
        fetchItems();
    }, [isOpen]);

    const handlePurchase = async (item: any) => {
        setErrorMsg(null);
        setPurchaseSuccess(null);
        setIsFlashing(false);

        if (user.stats.gold < item.cost) {
            playError();
            setErrorMsg("SYSTEM: INSUFFICIENT FUNDS");
            setIsFlashing(true);
            setTimeout(() => { setErrorMsg(null); setIsFlashing(false); }, 3000);
            return;
        }

        const token = localStorage.getItem("system_token");
        if (!token) return;

        try {
            const res = await fetch("http://localhost:5000/api/shop/buy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ itemId: item._id, quantity: 1 })
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user); // The API returns { message, user }
                setErrorMsg(null);
                setPurchaseSuccess(`Item Acquired: ${item.name}`);
                setTimeout(() => setPurchaseSuccess(null), 3000);
            } else {
                playError();
                const errData = await res.json();
                setErrorMsg(errData.error || "Purchase failed");
                setIsFlashing(true);
                setTimeout(() => { setErrorMsg(null); setIsFlashing(false); }, 3000);
            }
        } catch (error) {
            playError();
            console.error("Error purchasing item:", error);
            setErrorMsg("SYSTEM ERROR");
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };

    if (!user) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="shop-window"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-system-black/60 backdrop-blur-md"
                >
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-system-black/90 border border-[#011BDE]/50 rounded-2xl shadow-[0_0_50px_rgba(1,27,222,0.2)] flex flex-col backdrop-blur-xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[#011BDE]/30 bg-system-black/80 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <ShoppingCart className="w-8 h-8 text-system-neon" />
                                <h2 className="text-2xl font-caros font-black text-system-neon tracking-wider uppercase">
                                    System Shop
                                </h2>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors duration-300 ${isFlashing ? 'bg-red-500/20 border-red-500' : 'bg-[#FFD700]/10 border-[#FFD700]/30'}`}>
                                    <span className={`text-sm font-caros uppercase ${isFlashing ? 'text-red-400' : 'text-gray-400'}`}>Gold</span>
                                    <span className={`font-bold text-xl ${isFlashing ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]'}`}>
                                        {user.stats.gold}
                                    </span>
                                </div>
                                <button
                                    onClick={() => { playClick(); onClose(); }}
                                    className="p-2 text-system-blue/80 hover:text-system-neon hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* System Error Flash */}
                        <AnimatePresence>
                            {errorMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="absolute top-24 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3 px-6 py-3 bg-red-900/80 border border-red-500 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.6)] backdrop-blur-md"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <span className="text-red-100 font-bold tracking-widest uppercase">{errorMsg}</span>
                                </motion.div>
                            )}
                            {purchaseSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="absolute top-24 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3 px-6 py-3 bg-[#011BDE]/20 border border-[#011BDE]/50 rounded-lg shadow-[0_0_20px_rgba(1,27,222,0.4)] backdrop-blur-md"
                                >
                                    <span className="text-system-neon font-bold tracking-widest uppercase">{purchaseSuccess}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 relative">
                            {shopItems.map((item) => (
                                <div key={item._id} className="flex flex-col p-5 bg-white/5 border border-white/10 rounded-xl hover:border-[#011BDE]/50 hover:bg-[#011BDE]/10 transition-colors group relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#011BDE]/20 rounded-full blur-[40px] group-hover:bg-[#011BDE]/30 transition-colors" />

                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-14 h-14 rounded-lg bg-black/40 border border-[#011BDE]/40 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(1,27,222,0.2)]">
                                                {item.type === 'consumable' ? "🧪" : "🗡️"}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white tracking-wide">{item.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${item.type === 'consumable' ? 'text-blue-300 border-blue-500 bg-blue-500/20' : 'text-purple-300 border-purple-500 bg-purple-500/20'}`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Cost</span>
                                            <span className="text-[#FFD700] font-bold text-lg">{item.cost} G</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-300 mb-6 flex-1 relative z-10">{item.description}</p>

                                    <button
                                        onClick={() => { playClick(); handlePurchase(item); }}
                                        className="w-full py-3 bg-[#011BDE]/20 hover:bg-[#011BDE]/50 border border-[#011BDE]/60 rounded-lg text-system-neon font-bold tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(1,27,222,0.2)] hover:shadow-[0_0_20px_rgba(1,27,222,0.5)] relative z-10"
                                    >
                                        Purchase
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
