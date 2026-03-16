"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BossParticleEffect from "@/components/dungeon/BossParticleEffect";
import ShadowSoldierCard from "@/components/dungeon/ShadowSoldierCard";

type Phase = "combat" | "certifying" | "arise_prompt" | "extracting" | "success" | "failure";

export default function BossDefeatedPage() {
    const [phase, setPhase] = useState<Phase>("combat");
    const [ariseClicks, setAriseClicks] = useState(0);

    // Simulate the boss fight ending and the WebSocket certification scan
    useEffect(() => {
        // 1. Initial delay before boss is "defeated"
        const combatTimer = setTimeout(() => {
            setPhase("certifying");

            // 2. Simulate WebSocket confirming irrefutable certificate scan
            const wsTimer = setTimeout(() => {
                setPhase("arise_prompt");
            }, 3000); // 3 seconds of scanning

            return () => clearTimeout(wsTimer);
        }, 1500);

        return () => clearTimeout(combatTimer);
    }, []);

    const handleAriseClick = () => {
        if (phase !== "arise_prompt") return;

        const newClicks = ariseClicks + 1;
        setAriseClicks(newClicks);

        if (newClicks >= 3) {
            setPhase("extracting");

            // Simulate extraction process
            setTimeout(() => {
                // Success!
                setPhase("success");
            }, 2500);
        }
    };

    // Determine global background based on phase
    const isForgottenState = phase === "arise_prompt" || phase === "extracting" || phase === "success";

    return (
        <main
            className={`min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative transition-colors duration-1000 ${isForgottenState ? "bg-[#0b001a]" : "bg-system-black"
                } ${phase === "success" ? "animate-screen-shake" : ""}`}
        >
            {/* Dynamic Background Gradients */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <motion.div
                    animate={{
                        opacity: isForgottenState ? 0.4 : 0.1,
                        scale: isForgottenState ? 1.2 : 1,
                        backgroundColor: isForgottenState ? "#A480F2" : "#011BDE"
                    }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] blur-[150px] rounded-full"
                />
            </div>

            <AnimatePresence mode="wait">
                {/* PHASE: Combat / Initial UI */}
                {phase === "combat" && (
                    <motion.div
                        key="combat"
                        exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                        transition={{ duration: 1 }}
                        className="flex flex-col items-center justify-center z-10"
                    >
                        <div className="text-system-neon font-caros text-2xl tracking-widest animate-pulse">
                            BOSS ENGAGED
                        </div>
                        {/* Standard UI elements would go here */}
                    </motion.div>
                )}

                {/* PHASE: Certifying */}
                {phase === "certifying" && (
                    <motion.div
                        key="certifying"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, filter: "blur(20px)" }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center justify-center z-10"
                    >
                        <div className="px-8 py-6 rounded-2xl border border-system-blue/40 bg-white/5 backdrop-blur-xl shadow-[0_0_50px_rgba(1,27,222,0.2)] flex flex-col items-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="w-12 h-12 border-2 border-system-blue border-t-system-neon rounded-full mb-4"
                            />
                            <p className="text-system-neon font-caros tracking-[0.2em] text-sm uppercase">
                                Verifying Irrefutable Certificate...
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* PHASE: Arise Prompt & Extraction */}
                {(phase === "arise_prompt" || phase === "extracting") && (
                    <motion.div
                        key="arise"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="flex flex-col items-center justify-center z-10 w-full h-full"
                    >
                        {/* The Boss Icon / Particle Effect */}
                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-10">
                            <BossParticleEffect isExtracting={phase === "extracting"} />
                        </div>

                        {/* Arise Button */}
                        <AnimatePresence>
                            {phase === "arise_prompt" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                                    className="absolute bottom-1/4 z-20"
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
                                    <div className="mt-4 text-center text-system-purple font-caros tracking-widest text-xs">
                                        Command the Shadow [{ariseClicks}/3]
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Extraction loading text */}
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

                {/* PHASE: Success */}
                {phase === "success" && (
                    <motion.div
                        key="success"
                        className="flex flex-col items-center justify-center z-20 w-full h-full absolute inset-0 bg-black/60 backdrop-blur-sm"
                    >
                        <ShadowSoldierCard name="IGRIS" rank="Knight" />

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5 }}
                            className="mt-12 text-system-neon font-caros tracking-[0.2em] text-sm uppercase cursor-pointer hover:text-white transition-colors"
                            onClick={() => window.location.href = "/"}
                        >
                            Return to Status
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
