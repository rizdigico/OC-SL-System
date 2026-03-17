import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, AlertTriangle, ShieldAlert } from "lucide-react";

interface BossRoomProps {
    isOpen: boolean;
    onClose: () => void;
    bossData?: any;
    onEngage?: () => void;
}

export function BossRoom({ isOpen, onClose, bossData, onEngage }: BossRoomProps) {
    const boss = bossData || {
        name: "IGRIS THE BLOOD-RED",
        rank: "S",
        hp: 100,
        description: "The Commander of the Blood-Red Knights."
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="boss-room"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 overflow-hidden"
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes screenshake {
                            0% { transform: translate(0, 0) rotate(0deg); }
                            25% { transform: translate(2px, 2px) rotate(0.5deg); }
                            50% { transform: translate(0, 0) rotate(0deg); }
                            75% { transform: translate(-2px, 2px) rotate(-0.5deg); }
                            100% { transform: translate(0, 0) rotate(0deg); }
                        }
                        @keyframes pulse-red {
                            0% { opacity: 0.1; }
                            50% { opacity: 0.3; }
                            100% { opacity: 0.1; }
                        }
                        .boss-shake {
                            animation: screenshake 3s infinite ease-in-out;
                        }
                        .pulse-bg {
                            animation: pulse-red 4s infinite ease-in-out;
                        }
                    `}} />

                    {/* Hostile Atmosphere */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-black to-black" />
                        <div className="pulse-bg absolute inset-0 bg-red-950/20" />

                        {/* Vignette */}
                        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(220,38,38,0.4)]" />
                    </div>

                    <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center space-y-10 boss-shake">
                        {/* Warning Header */}
                        <div className="flex items-center gap-4 text-red-500 font-black tracking-[0.5em] text-xl md:text-2xl border-y border-red-500/50 py-4 w-full justify-center bg-red-500/10 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                            <AlertTriangle className="w-8 h-8 animate-pulse text-red-500" />
                            WARNING: BOSS ENCOUNTER
                            <AlertTriangle className="w-8 h-8 animate-pulse text-red-500" />
                        </div>

                        {/* Boss Info */}
                        <div className="text-center space-y-5">
                            <span className="inline-block px-5 py-1.5 border border-red-600 bg-red-900/30 text-red-400 font-bold uppercase tracking-widest text-sm shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                                RANK {boss.rank} THREAT
                            </span>
                            <h1 className="text-5xl md:text-7xl font-caros font-black text-white uppercase tracking-wider drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
                                {boss.name}
                            </h1>
                            <p className="text-gray-400 max-w-md mx-auto text-lg pt-2">{boss.description}</p>
                        </div>

                        {/* Boss HP Bar */}
                        <div className="w-full max-w-xl space-y-3">
                            <div className="flex justify-between items-center text-red-500 font-bold tracking-widest text-sm uppercase">
                                <span className="flex items-center gap-2"><Skull className="w-4 h-4" /> Vitality</span>
                                <span className="text-red-400 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">{boss.hp}%</span>
                            </div>
                            <div className="h-5 w-full bg-black/80 border-[3px] border-red-900 overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.5)] relative">
                                {/* HP Fill */}
                                <motion.div
                                    className="h-full bg-gradient-to-r from-red-800 to-red-500 shadow-[0_0_15px_rgba(220,38,38,1)]"
                                    initial={{ width: "100%" }}
                                />
                                {/* Overlay scanlines */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none" />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-6 mt-12 w-full max-w-md">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 bg-transparent border border-gray-600 hover:border-gray-400 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white font-bold tracking-widest uppercase transition-all"
                            >
                                Retreat
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    onEngage && onEngage();
                                }}
                                className="flex-1 py-4 bg-red-900/40 hover:bg-red-800/60 border border-red-600 rounded-xl text-red-400 hover:text-red-300 font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] flex items-center justify-center gap-3 group"
                            >
                                <ShieldAlert className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Engage
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
