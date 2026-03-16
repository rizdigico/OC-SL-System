"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ShieldAlert, ScanLine, Crown, Eye } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSystemAudio } from "@/hooks/useSystemAudio";

type Phase = "entrance" | "mission" | "scanning" | "failed" | "cinematic_dark" | "cinematic_text" | "cinematic_class" | "complete";

interface ArchitectsDemiseDungeonProps {
    user: any;
    onComplete: () => void;
}

export function ArchitectsDemiseDungeon({ user, onComplete }: ArchitectsDemiseDungeonProps) {
    const [phase, setPhase] = useState<Phase>("entrance");
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isExiting, setIsExiting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { playClick, playLevelUp, playError } = useSystemAudio();

    const handleComplete = useCallback(async () => {
        if (isExiting) return;
        setIsExiting(true);
        try {
            const token = localStorage.getItem("system_token");
            await fetch("http://localhost:5000/api/users/me/transcend", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // Proceed even on failure to try and complete local state
        }
        onComplete();
    }, [isExiting, onComplete]);

    useEffect(() => {
        if (phase === "entrance") {
            const timer = setTimeout(() => setPhase("mission"), 4500);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === "cinematic_dark") {
            const t = setTimeout(() => setPhase("cinematic_text"), 1500);
            return () => clearTimeout(t);
        }
        if (phase === "cinematic_text") {
            const t = setTimeout(() => {
                playLevelUp();
                setPhase("cinematic_class");
            }, 3500);
            return () => clearTimeout(t);
        }
        if (phase === "cinematic_class") {
            const t = setTimeout(() => setPhase("complete"), 5000);
            return () => clearTimeout(t);
        }
        if (phase === "complete") {
            handleComplete();
        }
    }, [phase, playLevelUp, handleComplete]);

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

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

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
            if (!uploadData.filename) {
                playError();
                setPhase("failed");
                setErrorMsg("The Architect rejects this proof.");
                return;
            }

            const questsRes = await fetch("http://localhost:5000/api/quests", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const quests = await questsRes.json();
            const quest = quests.find((q: any) => q.type === "architects_demise" && q.status === "active");

            if (quest) {
                for (let i = 0; i < (quest.objectives?.length || 0); i++) {
                    if (!quest.objectives[i].completed) {
                        await fetch(`http://localhost:5000/api/quests/${quest._id}/progress`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ objectiveIndex: i, increment: quest.objectives[i].target }),
                        });
                    }
                }
                await fetch(`http://localhost:5000/api/quests/${quest._id}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                });
            }

            setPhase("cinematic_dark");
        } catch (err: unknown) {
            playError();
            setPhase("failed");
            setErrorMsg(err instanceof Error ? err.message : "System error.");
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-black selection:bg-system-purple/30">
            <style>{`
                @keyframes ad-pulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
                @keyframes ad-flicker { 0% { opacity: 1; } 5% { opacity: 0.8; } 10% { opacity: 1; } 50% { opacity: 0.9; } 100% { opacity: 1; } }
            `}</style>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] rounded-full blur-[150px]"
                    style={{ background: "radial-gradient(circle, rgba(100,0,255,0.15), transparent 60%)", animation: "ad-pulse 5s infinite" }} />
            </div>

            <AnimatePresence mode="wait">
                {phase === "entrance" && (
                    <motion.div key="entrance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(20px)" }} transition={{ duration: 1 }} className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="text-center">
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }} className="flex flex-col items-center gap-6">
                                <Eye className="w-16 h-16 text-system-purple" style={{ filter: "drop-shadow(0 0 20px rgba(164,128,242,0.8))" }} />
                                <h1 className="text-6xl sm:text-8xl font-caros font-black text-white uppercase tracking-[0.1em]" style={{ textShadow: "0 0 40px rgba(164,128,242,0.6)" }}>
                                    THE ARCHITECT
                                </h1>
                                <p className="text-system-purple/80 tracking-[0.5em] uppercase font-bold mt-4">System Overload Imminent</p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {(phase === "mission" || phase === "failed") && (
                    <motion.div key="mission" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-black/90 border border-system-purple/40 rounded-2xl p-8 shadow-[0_0_50px_rgba(164,128,242,0.2)] backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-system-purple/20">
                                <Crown className="w-6 h-6 text-system-purple" />
                                <h2 className="text-xl font-caros font-black text-system-purple tracking-[0.2em] uppercase">Final Trial</h2>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">Defy the System</h3>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                You have reached the pinnacle of the System's design. The Architect demands one final proof of your existence before relinquishing control. Submit proof of your greatest achievement.
                            </p>

                            <div onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onClick={() => fileInputRef.current?.click()}
                                className={`cursor-pointer rounded-xl p-8 text-center border-2 border-dashed transition-all ${isDragOver ? "border-system-purple bg-system-purple/10" : preview ? "border-system-purple/60 bg-system-purple/5" : "border-system-purple/30 bg-white/[0.02] hover:border-system-purple/50"}`}>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                {preview ? (
                                    <div className="relative w-full max-w-xs h-40 mx-auto rounded-lg overflow-hidden border border-system-purple/40">
                                        <Image src={preview} alt="Proof" fill className="object-contain" unoptimized />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="w-10 h-10 text-system-purple/60 mb-3" />
                                        <p className="text-sm text-gray-300 font-bold tracking-wider">UPLOAD PROOF</p>
                                        <p className="text-xs text-gray-500 mt-2">Click or drag image here</p>
                                    </div>
                                )}
                            </div>

                            {phase === "failed" && (
                                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                                    <ShieldAlert className="text-red-500 w-5 h-5" />
                                    <span className="text-red-400 text-sm">{errorMsg}</span>
                                </div>
                            )}

                            <button onClick={handleSubmit} disabled={!file} className={`w-full mt-6 py-4 rounded-xl font-bold tracking-[0.2em] uppercase transition-all ${file ? "bg-system-purple/20 text-system-purple border border-system-purple hover:bg-system-purple/40 shadow-[0_0_20px_rgba(164,128,242,0.3)]" : "bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed"}`}>
                                CONFRONT THE ARCHITECT
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === "scanning" && (
                    <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                        <ScanLine className="w-16 h-16 text-system-purple animate-pulse mb-6" />
                        <h2 className="text-system-purple font-caros font-bold tracking-[0.4em] uppercase text-xl mb-2">Analyzing Data</h2>
                        <p className="text-gray-500 text-sm tracking-widest">The System is judging your worth...</p>
                    </motion.div>
                )}

                {phase === "cinematic_dark" && (
                    <motion.div key="cdark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 bg-black" />
                )}

                {phase === "cinematic_text" && (
                    <motion.div key="ctext" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-black flex flex-col justify-center items-center">
                        <motion.h1 initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="text-5xl md:text-7xl font-black text-white uppercase tracking-[0.1em] text-center" style={{ textShadow: "0 0 30px rgba(255,255,255,0.5)" }}>
                            THE SYSTEM <br /> IS YOURS
                        </motion.h1>
                    </motion.div>
                )}

                {phase === "cinematic_class" && (
                    <motion.div key="cclass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-black flex flex-col justify-center items-center">
                        <Crown className="w-20 h-20 text-system-purple mb-8 drop-shadow-[0_0_30px_rgba(164,128,242,0.8)]" />
                        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} className="text-6xl md:text-8xl font-black text-system-purple uppercase tracking-[0.15em] text-center" style={{ textShadow: "0 0 40px rgba(164,128,242,0.6)" }}>
                            TRANSCENDENCE
                        </motion.h1>
                        <p className="text-system-purple/70 tracking-[0.5em] mt-6">Monarch Domain Unlocked</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
