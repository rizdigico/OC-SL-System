"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Skull, Zap, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = "PROMPT" | "EXTRACTING" | "RESULT";

interface ShadowExtractionProps {
    enemy:      string;   // Boss / mob name
    isBoss:     boolean;  // Controls success rate
    onComplete: () => void;
}

// ── Void transmission messages ─────────────────────────────────────────────────

const VOID_MESSAGES = [
    "COMMUNICATING WITH THE VOID...",
    "PROBING DIMENSIONAL RIFT...",
    "SHADOW MONARCH'S WILL DETECTED...",
    "ANALYZING SOUL RESONANCE...",
    "EXTRACTING SHADOW ESSENCE...",
    "DISSOLVING PHYSICAL FORM...",
];

// ── Main Component ─────────────────────────────────────────────────────────────

export function ShadowExtraction({ enemy, isBoss, onComplete }: ShadowExtractionProps) {
    const [phase,      setPhase]      = useState<Phase>("PROMPT");
    const [rollResult, setRollResult] = useState(false);
    const [msgIdx,     setMsgIdx]     = useState(0);
    const [showFlash,  setShowFlash]  = useState(false);

    const shakeControls = useAnimation();
    const glowControls  = useAnimation();

    // Boss entities are harder to bind
    const successRate = isBoss ? 0.3 : 0.7;

    const handleArise = () => {
        const success = Math.random() < successRate;
        setRollResult(success);
        setPhase("EXTRACTING");

        // Shake the entire panel
        shakeControls.start({
            x:          [0, -10, 10, -7, 7, -4, 4, -2, 2, 0],
            transition: { duration: 0.8, ease: "easeInOut", repeat: 2 },
        });

        // Pulse the screen glow
        glowControls.start({
            opacity:    [0, 1, 0.4, 1, 0],
            transition: { duration: 3, ease: "easeInOut" },
        });

        setTimeout(() => {
            shakeControls.stop();
            if (success) {
                // White flash → reveal result
                setShowFlash(true);
                setTimeout(() => {
                    setShowFlash(false);
                    setPhase("RESULT");
                }, 450);
            } else {
                setPhase("RESULT");
            }
        }, 3200);
    };

    // Cycle void messages during EXTRACTING
    useEffect(() => {
        if (phase !== "EXTRACTING") return;
        const t = setInterval(() => setMsgIdx(i => (i + 1) % VOID_MESSAGES.length), 650);
        return () => clearInterval(t);
    }, [phase]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9985] flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden"
        >
            {/* ── White flash overlay ──────────────────────────────────────── */}
            <AnimatePresence>
                {showFlash && (
                    <motion.div
                        key="flash"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-white z-10 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* ── Ambient purple glow pulse ─────────────────────────────────── */}
            <motion.div
                animate={glowControls}
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, rgba(178,0,255,0.18) 0%, transparent 65%)",
                }}
            />

            {/* ── Static radial orb ────────────────────────────────────────── */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, rgba(178,0,255,0.06) 0%, transparent 70%)",
                    filter:     "blur(40px)",
                }}
            />

            {/* ── Scanline overlay ─────────────────────────────────────────── */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(178,0,255,1) 2px, rgba(178,0,255,1) 3px)",
                    backgroundSize:  "100% 4px",
                }}
            />

            {/* ── Shaking content wrapper ──────────────────────────────────── */}
            <motion.div
                animate={shakeControls}
                className="relative flex flex-col items-center gap-10 max-w-xs w-full px-6"
            >
                {/* ── PROMPT ──────────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    {phase === "PROMPT" && (
                        <motion.div
                            key="prompt"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y:  0 }}
                            exit={{ opacity: 0, y: -24 }}
                            transition={{ duration: 0.35 }}
                            className="flex flex-col items-center gap-8 w-full"
                        >
                            {/* Enemy silhouette */}
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-[8px] font-black tracking-[0.55em] text-purple-500/35 uppercase">
                                    Entity Detected
                                </span>

                                <div
                                    className="relative w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden"
                                    style={{
                                        background:  "radial-gradient(circle, rgba(178,0,255,0.05) 0%, transparent 70%)",
                                        border:      "1px solid rgba(178,0,255,0.12)",
                                        boxShadow:   "0 0 24px rgba(178,0,255,0.06)",
                                    }}
                                >
                                    <Skull
                                        className="w-16 h-16"
                                        style={{ color: "rgba(178,0,255,0.14)", filter: "blur(1.5px)" }}
                                    />
                                    {/* Scanning beam */}
                                    <motion.div
                                        animate={{ y: ["-100%", "200%"] }}
                                        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-10 pointer-events-none"
                                        style={{
                                            background: "linear-gradient(180deg, transparent, rgba(178,0,255,0.1), transparent)",
                                        }}
                                    />
                                </div>

                                <p
                                    className="text-2xl font-black tracking-[0.3em] uppercase text-center"
                                    style={{
                                        color:      "rgba(178,0,255,0.22)",
                                        filter:     "blur(2px)",
                                        textShadow: "0 0 30px rgba(178,0,255,0.3)",
                                    }}
                                >
                                    {enemy}
                                </p>
                            </div>

                            {/* ARISE button */}
                            <motion.button
                                onClick={handleArise}
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(178,0,255,0.3), inset 0 0 20px rgba(178,0,255,0.04)",
                                        "0 0 55px rgba(178,0,255,0.75), inset 0 0 40px rgba(178,0,255,0.12)",
                                        "0 0 20px rgba(178,0,255,0.3), inset 0 0 20px rgba(178,0,255,0.04)",
                                    ],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full py-5 rounded-2xl border font-black text-3xl tracking-[0.55em] uppercase"
                                style={{
                                    color:       "#b200ff",
                                    borderColor: "rgba(178,0,255,0.45)",
                                    background:  "rgba(178,0,255,0.06)",
                                    textShadow:  "0 0 22px rgba(178,0,255,0.8)",
                                }}
                            >
                                ARISE
                            </motion.button>

                            <p className="text-[9px] text-zinc-700 tracking-widest uppercase text-center">
                                Extraction rate: {Math.round(successRate * 100)}%
                                {isBoss ? " · Boss-class entity" : " · Standard entity"}
                            </p>
                        </motion.div>
                    )}

                    {/* ── EXTRACTING ─────────────────────────────────────────── */}
                    {phase === "EXTRACTING" && (
                        <motion.div
                            key="extracting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center gap-8 w-full"
                        >
                            {/* Skull with pulsing purple glow */}
                            <motion.div
                                animate={{
                                    filter: [
                                        "drop-shadow(0 0 8px  rgba(178,0,255,0.4))",
                                        "drop-shadow(0 0 45px rgba(178,0,255,0.95))",
                                        "drop-shadow(0 0 8px  rgba(178,0,255,0.4))",
                                    ],
                                    scale: [1, 1.06, 1],
                                }}
                                transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Skull className="w-24 h-24" style={{ color: "#b200ff" }} />
                            </motion.div>

                            {/* Flickering void message */}
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={msgIdx}
                                    initial={{ opacity: 0, y:  6 }}
                                    animate={{ opacity: 1, y:  0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.14 }}
                                    className="text-[11px] font-black tracking-[0.28em] text-center uppercase"
                                    style={{
                                        color:      "#b200ff",
                                        textShadow: "0 0 14px rgba(178,0,255,0.7)",
                                    }}
                                >
                                    {VOID_MESSAGES[msgIdx]}
                                </motion.p>
                            </AnimatePresence>

                            {/* Animated progress bar */}
                            <div className="w-48 h-px bg-zinc-900 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3.2, ease: "easeInOut" }}
                                    className="h-full rounded-full"
                                    style={{
                                        background: "linear-gradient(90deg, rgba(178,0,255,0.3), #b200ff)",
                                        boxShadow:  "0 0 8px rgba(178,0,255,0.8)",
                                    }}
                                />
                            </div>

                            {/* Pulsing border ring */}
                            <motion.div
                                animate={{
                                    borderColor: [
                                        "rgba(178,0,255,0.08)",
                                        "rgba(178,0,255,0.9)",
                                        "rgba(178,0,255,0.08)",
                                    ],
                                    boxShadow: [
                                        "0 0 0px  rgba(178,0,255,0)",
                                        "0 0 28px rgba(178,0,255,0.6)",
                                        "0 0 0px  rgba(178,0,255,0)",
                                    ],
                                }}
                                transition={{ duration: 0.7, repeat: Infinity }}
                                className="w-56 rounded-full border-t"
                            />
                        </motion.div>
                    )}

                    {/* ── RESULT ─────────────────────────────────────────────── */}
                    {phase === "RESULT" && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.88 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.45, type: "spring", stiffness: 180, damping: 18 }}
                            className="flex flex-col items-center gap-6 w-full"
                        >
                            {rollResult ? (
                                /* ── SUCCESS ── */
                                <>
                                    <motion.div
                                        animate={{
                                            boxShadow: [
                                                "0 0 20px rgba(178,0,255,0.35)",
                                                "0 0 65px rgba(178,0,255,0.85)",
                                                "0 0 20px rgba(178,0,255,0.35)",
                                            ],
                                        }}
                                        transition={{ duration: 1.6, repeat: Infinity }}
                                        className="w-40 h-40 rounded-2xl flex flex-col items-center justify-center gap-3 border"
                                        style={{
                                            background:  "rgba(178,0,255,0.08)",
                                            borderColor: "rgba(178,0,255,0.55)",
                                        }}
                                    >
                                        <Zap
                                            className="w-14 h-14"
                                            style={{
                                                color:  "#b200ff",
                                                filter: "drop-shadow(0 0 14px rgba(178,0,255,0.9))",
                                            }}
                                        />
                                        <span
                                            className="text-[10px] font-black tracking-wider uppercase text-center px-2 leading-tight"
                                            style={{
                                                color:      "#b200ff",
                                                textShadow: "0 0 10px rgba(178,0,255,0.7)",
                                            }}
                                        >
                                            {enemy}
                                        </span>
                                    </motion.div>

                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <motion.p
                                            animate={{ opacity: [0.65, 1, 0.65] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="text-sm font-black tracking-[0.3em] uppercase"
                                            style={{
                                                color:      "#b200ff",
                                                textShadow: "0 0 16px rgba(178,0,255,0.7)",
                                            }}
                                        >
                                            Extraction Successful
                                        </motion.p>
                                        <p className="text-[11px] font-bold text-zinc-400 leading-relaxed">
                                            <span style={{ color: "#d4b4ff" }}>{enemy}</span>
                                            {" "}has joined<br />the Shadow Army.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                /* ── FAILURE ── */
                                <>
                                    <motion.div
                                        initial={{ opacity: 0.35 }}
                                        animate={{ opacity: 0 }}
                                        transition={{ duration: 1.8, ease: "easeOut" }}
                                    >
                                        <Skull className="w-20 h-20 text-zinc-800" />
                                    </motion.div>

                                    <div className="flex flex-col items-center gap-2.5 text-center">
                                        <p
                                            className="text-sm font-black tracking-[0.18em] uppercase leading-relaxed"
                                            style={{ color: "#3f3f46" }}
                                        >
                                            The Shadow Has Returned<br />to the Void.
                                        </p>
                                        <p className="text-[9px] text-zinc-700 tracking-widest">
                                            The soul was too weak to be bound.
                                        </p>
                                    </div>
                                </>
                            )}

                            <button
                                onClick={onComplete}
                                className="text-[10px] font-black tracking-[0.3em] uppercase px-8 py-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95"
                                style={
                                    rollResult
                                        ? {
                                              color:       "#b200ff",
                                              borderColor: "rgba(178,0,255,0.4)",
                                              background:  "rgba(178,0,255,0.07)",
                                              boxShadow:   "0 0 16px rgba(178,0,255,0.2)",
                                          }
                                        : {
                                              color:       "#52525b",
                                              borderColor: "rgba(255,255,255,0.07)",
                                              background:  "transparent",
                                          }
                                }
                            >
                                {rollResult ? "CLAIM SHADOW" : "RETURN"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Close button — only during PROMPT */}
                {phase === "PROMPT" && (
                    <button
                        onClick={onComplete}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all"
                    >
                        <X className="w-4 h-4 text-zinc-600" />
                    </button>
                )}
            </motion.div>
        </motion.div>
    );
}
