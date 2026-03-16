"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ShieldAlert, ScanLine, Skull, Crown, Flame } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSystemAudio } from "@/hooks/useSystemAudio";

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase =
    | "entrance"       // Blood-red alert slam
    | "mission"        // Task briefing + photo upload
    | "scanning"       // Proof verification
    | "failed"         // Verification rejected
    | "cinematic_dark" // Screen goes black
    | "cinematic_text" // "JOB CHANGE" impact text
    | "cinematic_class"// "SHADOW MONARCH" reveal
    | "cinematic_arise"// Shadow Extraction unlocked
    | "complete";      // Return to dashboard

interface JobChangeDungeonProps {
    user: any;
    onComplete: () => void; // called after cinematic to refresh user & return to dashboard
}

// ── Component ──────────────────────────────────────────────────────────────────

export function JobChangeDungeon({ user, onComplete }: JobChangeDungeonProps) {
    const [phase, setPhase] = useState<Phase>("entrance");
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isExiting, setIsExiting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { playClick, playLevelUp, playError } = useSystemAudio();

    // ── Final exit — calls the dedicated endpoint then navigates ──────────────
    const handleJobChangeComplete = useCallback(async () => {
        if (isExiting) return;
        setIsExiting(true);
        try {
            const token = localStorage.getItem("system_token");
            await fetch("http://localhost:5000/api/job-change/complete", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // Non-fatal — the gate was already cleared by the quest completion
            // earlier in the flow. We still navigate regardless.
        }
        // Notify parent to refresh its user/quest state
        onComplete();
    }, [isExiting, onComplete]);

    // ── Entrance auto-advance ──────────────────────────────────────────────────
    useEffect(() => {
        if (phase === "entrance") {
            const timer = setTimeout(() => setPhase("mission"), 3500);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // ── Cinematic sequence auto-advance ────────────────────────────────────────
    useEffect(() => {
        if (phase === "cinematic_dark") {
            const t = setTimeout(() => setPhase("cinematic_text"), 1500);
            return () => clearTimeout(t);
        }
        if (phase === "cinematic_text") {
            const t = setTimeout(() => {
                playLevelUp();
                setPhase("cinematic_class");
            }, 3000);
            return () => clearTimeout(t);
        }
        if (phase === "cinematic_class") {
            const t = setTimeout(() => setPhase("cinematic_arise"), 4000);
            return () => clearTimeout(t);
        }
        if (phase === "cinematic_arise") {
            const t = setTimeout(() => setPhase("complete"), 4000);
            return () => clearTimeout(t);
        }
    }, [phase, playLevelUp]);

    // ── File handling (mirrors VerificationModal) ──────────────────────────────
    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith("image/")) {
            setErrorMsg("Only image files are accepted.");
            return;
        }
        setFile(f);
        setErrorMsg("");
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(f);
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) handleFile(dropped);
        },
        [handleFile]
    );

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const onDragLeave = useCallback(() => setIsDragOver(false), []);

    // ── Submit proof → API ─────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!file) return;
        playClick();
        setPhase("scanning");
        setErrorMsg("");

        try {
            const token = localStorage.getItem("system_token");
            const formData = new FormData();
            formData.append("photo", file);

            const uploadRes = await fetch("http://localhost:5000/api/uploads/quest-proof", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const uploadData = await uploadRes.json();
            const verified = !!uploadData.filename;

            if (!verified) {
                playError();
                setPhase("failed");
                setErrorMsg("Proof does not match quest parameters. Try again.");
                return;
            }

            // Find and complete the job_change quest
            const questsRes = await fetch("http://localhost:5000/api/quests", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const quests = await questsRes.json();
            const jobQuest = quests.find((q: any) => q.type === "job_change" && q.status === "active");

            if (jobQuest) {
                // Mark all objectives complete
                for (let i = 0; i < (jobQuest.objectives?.length || 0); i++) {
                    if (!jobQuest.objectives[i].completed) {
                        await fetch(`http://localhost:5000/api/quests/${jobQuest._id}/progress`, {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                objectiveIndex: i,
                                increment: jobQuest.objectives[i].target,
                            }),
                        });
                    }
                }

                // Complete the quest (this also unlocks jobChangeLocked on the backend)
                await fetch(`http://localhost:5000/api/quests/${jobQuest._id}/complete`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            // Begin cinematic
            setPhase("cinematic_dark");
        } catch (err: unknown) {
            playError();
            setPhase("failed");
            const msg = err instanceof Error ? err.message : "System error during verification.";
            setErrorMsg(msg);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Scoped keyframe animations */}
            <style>{`
                @keyframes jc-bloodPulse {
                    0%, 100% { opacity: 0.15; }
                    50% { opacity: 0.35; }
                }
                @keyframes jc-vignette {
                    0%, 100% { box-shadow: inset 0 0 120px 60px rgba(80,0,0,0.9); }
                    50% { box-shadow: inset 0 0 150px 80px rgba(120,0,0,0.95); }
                }
                @keyframes jc-scanline {
                    0% { transform: translateY(-100vh); }
                    100% { transform: translateY(100vh); }
                }
                @keyframes jc-glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-3px, 3px); }
                    40% { transform: translate(3px, -3px); }
                    60% { transform: translate(-2px, -2px); }
                    80% { transform: translate(2px, 2px); }
                    100% { transform: translate(0); }
                }
                @keyframes jc-flicker {
                    0% { opacity: 1; }
                    5% { opacity: 0.7; }
                    10% { opacity: 1; }
                    15% { opacity: 0.85; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    85% { opacity: 0.6; }
                    90% { opacity: 1; }
                    100% { opacity: 1; }
                }
                @keyframes jc-crackSpread {
                    0% { clip-path: inset(50% 50% 50% 50%); opacity: 0; }
                    100% { clip-path: inset(0 0 0 0); opacity: 0.15; }
                }
                @keyframes jc-monarchGlow {
                    0%, 100% { text-shadow: 0 0 20px #DC143C, 0 0 40px #8B0000, 0 0 80px #4A0000; filter: brightness(1); }
                    50% { text-shadow: 0 0 40px #FF0000, 0 0 80px #DC143C, 0 0 120px #8B0000; filter: brightness(1.2); }
                }
                @keyframes jc-riseFromShadow {
                    0% { transform: translateY(100px) scale(0.8); opacity: 0; filter: blur(10px); }
                    60% { transform: translateY(-10px) scale(1.05); opacity: 1; filter: blur(0); }
                    100% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
                }
                @keyframes jc-shadowDrip {
                    0% { height: 0; opacity: 0.8; }
                    100% { height: 100vh; opacity: 0; }
                }
                .jc-scanline {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, rgba(255,0,0,0) 0%, rgba(255,0,0,0) 50%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.4) 100%);
                    background-size: 100% 4px;
                    pointer-events: none;
                    z-index: 5;
                    animation: jc-flicker 3s infinite;
                }
            `}</style>

            {/* ═══════════════════════════════════════════════════════════════════
                BASE LAYER — always present behind everything
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="absolute inset-0 bg-black" />

            {/* Blood-red ambient mist */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] h-[140vw] rounded-full blur-[200px]"
                    style={{
                        background: "radial-gradient(ellipse at center, rgba(139,0,0,0.4), rgba(60,0,0,0.15), transparent 70%)",
                        animation: "jc-bloodPulse 4s ease-in-out infinite",
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-[80vw] h-[80vw] rounded-full blur-[150px]"
                    style={{
                        background: "radial-gradient(ellipse at center, rgba(220,20,60,0.2), transparent 70%)",
                        animation: "jc-bloodPulse 6s ease-in-out infinite 2s",
                    }}
                />
            </div>

            {/* Vignette overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-[2]"
                style={{ animation: "jc-vignette 5s ease-in-out infinite" }}
            />

            {/* Scanlines */}
            <div className="jc-scanline" />

            {/* ═══════════════════════════════════════════════════════════════════
                PHASE: ENTRANCE
            ═══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
                {phase === "entrance" && (
                    <motion.div
                        key="entrance"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center"
                    >
                        {/* Red flash on entrance */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.8, 0] }}
                            transition={{ duration: 1.2, times: [0, 0.1, 1] }}
                            className="absolute inset-0 bg-red-600 pointer-events-none"
                        />

                        <motion.div
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                            style={{ animation: "jc-glitch 0.15s infinite" }}
                        >
                            <div className="text-center px-8">
                                <motion.div
                                    initial={{ y: -30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 1.0 }}
                                    className="flex items-center justify-center gap-3 mb-6"
                                >
                                    <Skull className="w-8 h-8 text-red-500" />
                                    <span
                                        className="text-red-500 font-caros text-sm tracking-[0.5em] uppercase font-bold"
                                        style={{ textShadow: "0 0 10px rgba(220,20,60,0.8)" }}
                                    >
                                        System Override
                                    </span>
                                    <Skull className="w-8 h-8 text-red-500" />
                                </motion.div>

                                <h1
                                    className="text-5xl sm:text-6xl md:text-8xl font-caros font-black text-white uppercase tracking-[0.05em] leading-none"
                                    style={{
                                        textShadow: "0 0 30px rgba(255,0,0,0.6), 0 0 60px rgba(139,0,0,0.4)",
                                    }}
                                >
                                    JOB CHANGE
                                    <br />
                                    <span className="text-red-600 block mt-4" style={{ textShadow: "0 0 40px rgba(220,20,60,0.8)" }}>
                                        QUEST
                                    </span>
                                </h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0.6, 1] }}
                                    transition={{ delay: 2.0, duration: 1.5 }}
                                    className="mt-8 text-red-400/80 tracking-[0.3em] uppercase text-sm font-bold animate-pulse"
                                >
                                    All systems locked. Prove yourself.
                                </motion.p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    PHASE: MISSION — Task briefing + photo upload
                ═══════════════════════════════════════════════════════════════ */}
                {(phase === "mission" || phase === "failed") && (
                    <motion.div
                        key="mission"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ type: "spring", damping: 22, stiffness: 200 }}
                            className="relative w-full max-w-2xl"
                        >
                            {/* Card glow */}
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-red-900/50 via-red-800/20 to-transparent blur-xl pointer-events-none" />

                            <div className="relative rounded-2xl bg-black/80 border-2 border-red-900/60 backdrop-blur-xl shadow-[0_0_80px_rgba(139,0,0,0.3)] overflow-hidden">
                                {/* Crack texture overlay */}
                                <div
                                    className="absolute inset-0 pointer-events-none z-[1]"
                                    style={{
                                        backgroundImage: `repeating-linear-gradient(
                                            45deg,
                                            transparent,
                                            transparent 48%,
                                            rgba(139,0,0,0.08) 48%,
                                            rgba(139,0,0,0.08) 52%,
                                            transparent 52%
                                        )`,
                                        backgroundSize: "30px 30px",
                                    }}
                                />

                                {/* Header bar */}
                                <div className="relative z-10 px-6 py-4 border-b-2 border-red-900/40 bg-red-950/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,20,60,0.8)] animate-pulse" />
                                        <h2
                                            className="text-lg font-caros font-black text-red-500 tracking-[0.3em] uppercase"
                                            style={{ textShadow: "0 0 10px rgba(220,20,60,0.5)" }}
                                        >
                                            Emergency Quest
                                        </h2>
                                    </div>
                                    <p className="text-red-400/60 text-xs tracking-[0.2em] uppercase mt-1 ml-6">
                                        Rank S // Mandatory // No Expiration
                                    </p>
                                </div>

                                {/* Mission body */}
                                <div className="relative z-10 p-6 space-y-6">
                                    {/* Task description */}
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <Flame className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="text-white font-caros font-bold text-xl tracking-wide">
                                                    Prove Your Resolve
                                                </h3>
                                                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                                                    The System has determined you are ready for advancement. Complete a
                                                    significant real-world challenge and submit photographic proof of
                                                    completion. This is not a drill. Your daily quests, shop access,
                                                    and all progression are <span className="text-red-400 font-bold">locked</span> until
                                                    this quest is cleared.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Objective box */}
                                        <div className="mt-4 p-4 rounded-xl bg-red-950/30 border border-red-900/40">
                                            <p className="text-red-400 font-caros text-xs tracking-[0.25em] uppercase font-bold mb-3">
                                                Objective
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded border-2 border-red-700/60 flex items-center justify-center shrink-0">
                                                    <div className="w-2 h-2 rounded-sm bg-red-900/40" />
                                                </div>
                                                <p className="text-gray-300 text-sm">
                                                    Complete a major physical, creative, or professional milestone and
                                                    upload photo evidence.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Reward preview */}
                                        <div className="flex gap-4 mt-2">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/30">
                                                <Crown className="w-4 h-4 text-yellow-500" />
                                                <span className="text-yellow-500/90 text-xs font-bold tracking-wider uppercase">
                                                    Class: Shadow Monarch
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/30">
                                                <Skull className="w-4 h-4 text-purple-400" />
                                                <span className="text-purple-400/90 text-xs font-bold tracking-wider uppercase">
                                                    Unlock: Shadow Extraction
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-gradient-to-r from-transparent via-red-900/60 to-transparent" />

                                    {/* Photo upload zone */}
                                    <div>
                                        <p className="text-red-400/70 font-caros text-xs tracking-[0.2em] uppercase font-bold mb-3">
                                            Submit Proof
                                        </p>
                                        <div
                                            onDrop={onDrop}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`
                                                relative cursor-pointer rounded-xl p-6 flex flex-col items-center justify-center text-center
                                                border-2 border-dashed transition-all duration-300
                                                ${isDragOver
                                                    ? "border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(220,20,60,0.25)]"
                                                    : preview
                                                        ? "border-red-700/60 bg-red-950/20"
                                                        : "border-red-900/40 bg-white/[0.02] hover:border-red-600/60 hover:bg-red-950/10"
                                                }
                                            `}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleFile(f);
                                                }}
                                            />

                                            {preview ? (
                                                <div className="space-y-3">
                                                    <div className="relative w-full max-w-xs h-36 mx-auto rounded-lg overflow-hidden border border-red-900/40">
                                                        <Image
                                                            src={preview}
                                                            alt="Proof preview"
                                                            fill
                                                            className="object-contain"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <p className="text-sm text-red-400/60">Click or drop to replace</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-red-700/60 mb-2" />
                                                    <p className="text-sm text-gray-400 font-medium">
                                                        Drop proof image here
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        or click to browse
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Error message */}
                                    {phase === "failed" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/40"
                                        >
                                            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
                                            <div>
                                                <p className="text-red-400 text-sm font-bold font-caros tracking-wider uppercase">
                                                    Verification Failed
                                                </p>
                                                <p className="text-red-300/70 text-xs mt-0.5">
                                                    {errorMsg || "Proof rejected by the System."}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Submit button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!file}
                                        className={`
                                            w-full py-4 rounded-xl font-caros font-black tracking-[0.2em] uppercase text-sm transition-all duration-300
                                            ${file
                                                ? "bg-red-900/60 text-white hover:bg-red-800/70 border-2 border-red-600/60 shadow-[0_0_30px_rgba(139,0,0,0.4)] hover:shadow-[0_0_50px_rgba(220,20,60,0.5)]"
                                                : "bg-white/5 text-gray-700 cursor-not-allowed border border-white/10"
                                            }
                                        `}
                                    >
                                        Submit for Verification
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    PHASE: SCANNING
                ═══════════════════════════════════════════════════════════════ */}
                {phase === "scanning" && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center"
                    >
                        {/* Scan container */}
                        <div className="relative w-48 h-48 rounded-xl border-2 border-red-800/50 bg-black/60 overflow-hidden">
                            {preview && (
                                <Image
                                    src={preview}
                                    alt="Scanning"
                                    fill
                                    className="object-cover opacity-50"
                                    unoptimized
                                />
                            )}
                            {/* Red laser sweep */}
                            <motion.div
                                animate={{ y: ["-100%", "500%"] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_30px_rgba(220,20,60,0.9)]"
                            />
                            {/* Corner brackets */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-red-500/80" />
                                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-red-500/80" />
                                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-red-500/80" />
                                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-red-500/80" />
                            </div>
                        </div>

                        <div className="mt-8 text-center space-y-3">
                            <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                                className="flex items-center gap-2 text-red-500 font-caros font-bold tracking-[0.3em] uppercase"
                            >
                                <ScanLine className="w-5 h-5" />
                                System Analyzing...
                            </motion.div>
                            <p className="text-xs text-gray-600 tracking-wider">
                                Verifying proof against quest parameters
                            </p>
                            <div className="flex gap-2 justify-center mt-4">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                        className="w-2 h-2 rounded-full bg-red-500"
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    PHASE: CINEMATIC — Dark
                ═══════════════════════════════════════════════════════════════ */}
                {phase === "cinematic_dark" && (
                    <motion.div
                        key="cin_dark"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-20 bg-black flex items-center justify-center"
                    >
                        {/* Silent darkness — anticipation */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-red-600"
                        />
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    PHASE: CINEMATIC — "JOB CHANGE" Impact Text
                ═══════════════════════════════════════════════════════════════ */}
                {phase === "cinematic_text" && (
                    <motion.div
                        key="cin_text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-black flex items-center justify-center overflow-hidden"
                    >
                        {/* Screen shake container */}
                        <motion.div
                            animate={{
                                x: [0, -8, 8, -6, 6, -3, 3, 0],
                                y: [0, 6, -6, 4, -4, 2, -2, 0],
                            }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="text-center"
                        >
                            {/* Background crack flash */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.6, 0] }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                                className="absolute inset-0 bg-red-700 pointer-events-none"
                            />

                            <motion.h1
                                initial={{ scale: 3, opacity: 0, filter: "blur(20px)" }}
                                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="text-6xl sm:text-7xl md:text-9xl font-caros font-black text-white uppercase tracking-[0.05em]"
                                style={{
                                    textShadow: "0 0 40px rgba(255,0,0,0.8), 0 0 80px rgba(139,0,0,0.6), 0 0 120px rgba(74,0,0,0.4)",
                                }}
                            >
                                JOB
                                <br />
                                CHANGE
                            </motion.h1>

                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                                className="h-[3px] bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto mt-6"
                            />

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                                className="mt-6 text-red-500/80 font-caros tracking-[0.4em] uppercase text-sm"
                            >
                                Class advancement initiated...
                            </motion.p>
                        </motion.div>

                        {/* Radial cracks emanating from center */}
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: [0, 0.4, 0.1] }}
                                transition={{ duration: 1.2, delay: 0.3 + i * 0.05 }}
                                className="absolute top-1/2 left-1/2 h-[2px] bg-red-800/60"
                                style={{
                                    width: "60vw",
                                    transformOrigin: "left center",
                                    transform: `rotate(${i * 45}deg)`,
                                    marginLeft: "-30vw",
                                }}
                            />
                        ))}
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    PHASE: CINEMATIC — "SHADOW MONARCH" Class Reveal
                ═══════════════════════════════════════════════════════════════ */}
                {phase === "cinematic_class" && (
                    <motion.div
                        key="cin_class"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center overflow-hidden"
                    >
                        {/* Deep purple-red mist rising */}
                        <motion.div
                            initial={{ opacity: 0, y: 200 }}
                            animate={{ opacity: 0.5, y: -100 }}
                            transition={{ duration: 4, ease: "easeOut" }}
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120vw] h-[80vh] rounded-full blur-[120px]"
                            style={{ background: "radial-gradient(ellipse, rgba(100,0,30,0.6), transparent 70%)" }}
                        />

                        {/* Shadow drips from top */}
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute top-0 w-[2px] bg-gradient-to-b from-purple-900/80 to-transparent"
                                style={{
                                    left: `${15 + i * 18}%`,
                                    animation: `jc-shadowDrip ${2 + i * 0.5}s ease-in ${i * 0.3}s infinite`,
                                }}
                            />
                        ))}

                        <motion.div
                            style={{ animation: "jc-riseFromShadow 1.5s ease-out forwards" }}
                            className="relative z-10 text-center"
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mb-4"
                            >
                                <Crown
                                    className="w-16 h-16 mx-auto text-yellow-500"
                                    style={{ filter: "drop-shadow(0 0 20px rgba(234,179,8,0.6))" }}
                                />
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="text-red-500/80 font-caros text-sm tracking-[0.5em] uppercase mb-4"
                            >
                                New Class Obtained
                            </motion.p>

                            <motion.h1
                                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                                animate={{ opacity: 1, letterSpacing: "0.15em" }}
                                transition={{ delay: 1.2, duration: 1 }}
                                className="text-5xl sm:text-6xl md:text-8xl font-caros font-black text-white uppercase"
                                style={{ animation: "jc-monarchGlow 3s ease-in-out infinite" }}
                            >
                                SHADOW
                                <br />
                                MONARCH
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0, scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ delay: 2.0, duration: 0.8 }}
                                className="mt-6 h-[2px] bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent mx-auto w-64"
                            />

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.5 }}
                                className="mt-4 text-gray-500 font-caros text-xs tracking-[0.3em] uppercase"
                            >
                                {user?.displayName || "Hunter"} has ascended.
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    PHASE: CINEMATIC — Shadow Extraction Unlock
                ═══════════════════════════════════════════════════════════════ */}
                {phase === "cinematic_arise" && (
                    <motion.div
                        key="cin_arise"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden"
                        style={{ background: "linear-gradient(to bottom, #000, #0b001a)" }}
                    >
                        {/* Purple energy vortex */}
                        <motion.div
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.15, 1],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[100vw] h-[100vw] rounded-full blur-[100px]"
                            style={{ background: "radial-gradient(ellipse, rgba(100,50,180,0.4), transparent 60%)" }}
                        />

                        <motion.div
                            initial={{ y: 80, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-10 text-center"
                        >
                            {/* Arise icon */}
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="mb-6"
                            >
                                <div
                                    className="w-24 h-24 mx-auto rounded-full border-2 border-purple-500/60 bg-purple-900/20 flex items-center justify-center"
                                    style={{ boxShadow: "0 0 40px rgba(139,92,246,0.4), inset 0 0 20px rgba(139,92,246,0.2)" }}
                                >
                                    <Skull
                                        className="w-12 h-12 text-purple-400"
                                        style={{ filter: "drop-shadow(0 0 10px rgba(139,92,246,0.8))" }}
                                    />
                                </div>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-purple-400/80 font-caros text-xs tracking-[0.5em] uppercase mb-3"
                            >
                                Ability Unlocked
                            </motion.p>

                            <motion.h2
                                initial={{ opacity: 0, letterSpacing: "0.4em" }}
                                animate={{ opacity: 1, letterSpacing: "0.2em" }}
                                transition={{ delay: 0.8, duration: 0.8 }}
                                className="text-4xl sm:text-5xl md:text-6xl font-caros font-black text-white uppercase"
                                style={{
                                    textShadow: "0 0 30px rgba(139,92,246,0.6), 0 0 60px rgba(100,50,180,0.3)",
                                }}
                            >
                                SHADOW
                                <br />
                                EXTRACTION
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.8 }}
                                className="mt-6 text-gray-500 text-sm max-w-md mx-auto leading-relaxed"
                            >
                                Defeated enemies can now be extracted as shadow soldiers.
                                <br />
                                <span className="text-purple-400/70">Command the dead. Build your army.</span>
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    PHASE: COMPLETE — Return to dashboard
                ═══════════════════════════════════════════════════════════════ */}
                {phase === "complete" && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                        style={{ background: "linear-gradient(to bottom, #000, #05000a)" }}
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-center"
                        >
                            <Crown
                                className="w-12 h-12 mx-auto text-yellow-500 mb-6"
                                style={{ filter: "drop-shadow(0 0 15px rgba(234,179,8,0.5))" }}
                            />

                            <h2
                                className="text-3xl md:text-5xl font-caros font-black text-white uppercase tracking-wider"
                                style={{ textShadow: "0 0 20px rgba(220,20,60,0.4)" }}
                            >
                                Quest Complete
                            </h2>

                            <div className="mt-6 space-y-2 text-sm text-gray-400">
                                <p>
                                    Class: <span className="text-red-400 font-bold">Shadow Monarch</span>
                                </p>
                                <p>
                                    Ability: <span className="text-purple-400 font-bold">Shadow Extraction</span> unlocked
                                </p>
                            </div>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                onClick={handleJobChangeComplete}
                                disabled={isExiting}
                                className="mt-10 px-10 py-4 rounded-xl font-caros font-bold tracking-[0.2em] uppercase text-sm
                                    bg-white/5 text-white border border-white/20 hover:bg-white/10 hover:border-white/40
                                    transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]
                                    hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]
                                    disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isExiting ? "Returning..." : "Return to Dashboard"}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
