"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BossParticleEffect from "./BossParticleEffect";
import ShadowSoldierCard from "./ShadowSoldierCard";

interface AriseModalProps {
    isOpen: boolean;
    onClose: () => void;
    bossData: any;
}

export function AriseModal({ isOpen, onClose, bossData }: AriseModalProps) {
    const [phase, setPhase] = useState<"prompt" | "extracting" | "success" | "failure">("prompt");
    const [ariseClicks, setAriseClicks] = useState(0);
    const [shadowData, setShadowData] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            setPhase("prompt");
            setAriseClicks(0);
            setShadowData(null);
        }
    }, [isOpen]);

    const handleAriseClick = async () => {
        if (phase !== "prompt") return;

        const newClicks = ariseClicks + 1;
        setAriseClicks(newClicks);
        setPhase("extracting");

        try {
            const token = localStorage.getItem('system_token');
            const res = await fetch('http://localhost:5000/api/combat/extract', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ bossId: bossData?.quest?._id })
            });
            const data = await res.json();
            
            setTimeout(() => {
                if (data.success) {
                    setShadowData(data.shadow);
                    setPhase("success");
                } else {
                    if (newClicks >= 3) {
                        setPhase("failure");
                    } else {
                        setPhase("prompt");
                    }
                }
            }, 2500);

        } catch (err) {
            setTimeout(() => {
                if (newClicks >= 3) {
                    setPhase("failure");
                } else {
                    setPhase("prompt");
                }
            }, 2500);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0b001a]"
                >
                    {/* Dark Purple Mist Animation */}
                    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                        <motion.div
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.2, 1],
                                rotate: [0, 90, 180, 270, 360]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-system-purple/40 via-[#0b001a]/80 to-[#0b001a] blur-[100px] rounded-full mix-blend-screen"
                        />
                        <motion.div
                            animate={{
                                opacity: [0.2, 0.5, 0.2],
                                scale: [1.2, 1, 1.2],
                                rotate: [360, 270, 180, 90, 0]
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-transparent to-transparent blur-[80px] rounded-full mix-blend-screen"
                        />
                    </div>

                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                        {/* Phase: Prompt & Extracting */}
                        {(phase === "prompt" || phase === "extracting") && (
                            <motion.div
                                key="arise"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center z-10 w-full h-full"
                            >
                                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-10">
                                    <BossParticleEffect isExtracting={phase === "extracting"} />
                                </div>

                                <AnimatePresence>
                                    {phase === "prompt" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                                            className="absolute bottom-1/4 z-20 flex flex-col items-center"
                                        >
                                            <button
                                                onClick={handleAriseClick}
                                                className="relative group focus:outline-none"
                                            >
                                                <motion.div
                                                    animate={{
                                                        boxShadow: ["0 0 20px #A480F2", "0 0 60px #11D2EF", "0 0 20px #A480F2"]
                                                    }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="absolute inset-0 rounded-full opacity-50 blur-md transition-all duration-300 group-hover:opacity-100"
                                                />
                                                <div className="px-12 py-4 rounded-full border border-system-neon bg-black/40 backdrop-blur-md relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-system-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    <span
                                                        className="text-4xl font-caros font-black tracking-[0.3em] uppercase relative z-10"
                                                        style={{ color: "#11D2EF", textShadow: "0 0 10px #11D2EF" }}
                                                    >
                                                        Arise
                                                    </span>
                                                </div>
                                            </button>
                                            <div className="mt-4 text-center text-system-purple font-caros tracking-widest text-xs uppercase">
                                                Command the Shadow [{ariseClicks}/3]
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {phase === "extracting" && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute bottom-1/4 z-20 text-system-neon font-caros tracking-[0.4em] uppercase text-sm animate-pulse"
                                            style={{ textShadow: "0 0 10px #11D2EF" }}
                                        >
                                            Extracting Shadow...
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* Phase: Success */}
                        {phase === "success" && (
                            <motion.div
                                key="success"
                                className="flex flex-col items-center justify-center z-20 w-full h-full"
                            >
                                <ShadowSoldierCard name={shadowData?.name || "IGRIS"} rank={shadowData?.rank || "Knight"} />

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.5 }}
                                    className="mt-12 text-system-neon font-caros tracking-[0.2em] text-sm uppercase cursor-pointer hover:text-white transition-colors"
                                    onClick={onClose}
                                >
                                    Return to Status
                                </motion.p>
                            </motion.div>
                        )}

                        {/* Phase: Failure */}
                        {phase === "failure" && (
                            <motion.div
                                key="failure"
                                className="flex flex-col items-center justify-center z-20 w-full h-full text-center"
                            >
                                <h2 className="text-4xl font-caros font-black text-gray-500 tracking-[0.3em] uppercase mb-4 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                                    The shadow returns to the void
                                </h2>
                                <p className="text-system-purple/70 tracking-widest uppercase text-sm cursor-pointer hover:text-system-purple transition-colors mt-8" onClick={onClose}>
                                    Return
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}