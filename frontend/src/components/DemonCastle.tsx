"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Flame, Upload, X, ShieldAlert, CheckCircle2, ScanLine, Lock, Unlock, Trophy } from "lucide-react";
import Image from "next/image";

interface DemonCastleProps {
    isOpen: boolean;
    onClose: () => void;
    onFloorCleared?: () => void;
}

interface FloorData {
    currentFloor: number;
    nextFloor: number;
    nextFloorReward: {
        exp: number;
        gold: number;
    };
}

type ModalState = "idle" | "scanning" | "success" | "failed";

// Floor Guardian names based on floor ranges
function getFloorGuardian(floor: number): string {
    if (floor <= 20) return "Low-Tier Demon";
    if (floor <= 40) return "Mid-Tier Demon";
    if (floor <= 60) return "High-Tier Demon";
    if (floor <= 80) return "Demon Commander";
    if (floor <= 99) return "Demon Lord";
    return "Vulcan";
}

// Get guardian description
function getGuardianDescription(floor: number): string {
    if (floor <= 20) return "A weak demon servant patrolling the lower floors.";
    if (floor <= 40) return "A seasoned warrior of the demon realm.";
    if (floor <= 60) return "A powerful entity with devastating abilities.";
    if (floor <= 80) return "Commander of the demon legions, feared by all.";
    if (floor <= 99) return "One of the Seven Demon Lords, ruler of this floor.";
    return "The Supreme Demon Vulcan, Guardian of the 100th Floor.";
}

// Calculate difficulty tier based on floor
function getDifficultyTier(floor: number): { rank: string; color: string } {
    if (floor <= 20) return { rank: "E", color: "#6b7280" };
    if (floor <= 40) return { rank: "D", color: "#22c55e" };
    if (floor <= 60) return { rank: "C", color: "#3b82f6" };
    if (floor <= 80) return { rank: "B", color: "#a855f7" };
    if (floor <= 99) return { rank: "A", color: "#f97316" };
    return { rank: "S", color: "#ef4444" };
}

export function DemonCastle({ isOpen, onClose, onFloorCleared }: DemonCastleProps) {
    const [floorData, setFloorData] = useState<FloorData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalState, setModalState] = useState<ModalState>("idle");
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [submissionSuccess, setSubmissionSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch floor data on mount
    useEffect(() => {
        if (isOpen) {
            fetchFloorData();
        }
    }, [isOpen]);

    const fetchFloorData = async () => {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("system_token");
        if (!token) {
            setError("Authentication required");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/demon-castle", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setFloorData(data);
            } else {
                setError("Failed to load Demon Castle data");
            }
        } catch (err) {
            setError("Failed to connect to server");
        } finally {
            setIsLoading(false);
        }
    };

    // Reset modal state
    useEffect(() => {
        if (!isModalOpen) {
            setModalState("idle");
            setPreview(null);
            setFile(null);
            setErrorMsg("");
            setSubmissionSuccess(false);
        }
    }, [isModalOpen]);

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
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    }, [handleFile]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const onDragLeave = useCallback(() => setIsDragOver(false), []);

    const handleSubmit = async () => {
        if (!file) return;
        setModalState("scanning");
        setErrorMsg("");

        try {
            const token = localStorage.getItem("system_token");
            const formData = new FormData();
            formData.append("photo", file);

            // First upload the proof
            const uploadRes = await fetch("http://localhost:5000/api/uploads/quest-proof", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!uploadRes.ok) {
                throw new Error("Failed to upload proof");
            }

            // Then clear the floor
            const clearRes = await fetch("http://localhost:5000/api/demon-castle/clear", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ verified: true })
            });

            if (clearRes.ok) {
                const result = await clearRes.json();
                setModalState("success");
                setSubmissionSuccess(true);

                // Refresh floor data after successful clear
                setTimeout(() => {
                    fetchFloorData();
                    onFloorCleared?.();
                }, 1500);
            } else {
                throw new Error("Failed to clear floor");
            }
        } catch (err) {
            setModalState("failed");
            setErrorMsg("Verification failed. Please try again.");
        }
    };

    const currentFloor = floorData?.currentFloor || 0;
    const nextFloor = floorData?.nextFloor || 1;
    const guardian = getFloorGuardian(currentFloor);
    const guardianDesc = getGuardianDescription(currentFloor);
    const difficulty = getDifficultyTier(currentFloor);

    if (!isOpen) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Main Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#02020B]/95 border-2 border-[#8B0000]/60 backdrop-blur-xl shadow-[0_0_60px_rgba(139,0,0,0.4),inset_0_0_30px_rgba(139,0,0,0.1)]"
                >
                    {/* Fiery Header */}
                    <div className="relative p-6 border-b border-[#8B0000]/40 bg-gradient-to-b from-[#8B0000]/20 to-transparent">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#ff4500]/20 blur-[60px]" />
                            <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#8B0000]/30 blur-[60px]" />
                        </div>

                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Skull className="w-10 h-10 text-[#ff4500] drop-shadow-[0_0_10px_rgba(255,69,0,0.8)]" />
                                    <Flame className="absolute -top-1 -right-1 w-5 h-5 text-[#ff6600] animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-caros font-black text-[#ff4500] tracking-wider uppercase drop-shadow-[0_0_15px_rgba(255,69,0,0.6)]">
                                        Demon Castle
                                    </h2>
                                    <p className="text-[#A480F2]/80 text-sm tracking-widest uppercase">
                                        Endless Tower of Trials
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-[#8B0000]/20 hover:bg-[#8B0000]/40 border border-[#8B0000]/50 text-[#ff4500] transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-[#A480F2] font-caros tracking-[0.2em] animate-pulse">
                                    LOADING FLOOR DATA...
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <ShieldAlert className="w-12 h-12 text-[#ef4444]" />
                                <p className="text-[#ef4444] font-lato">{error}</p>
                                <button
                                    onClick={fetchFloorData}
                                    className="px-4 py-2 bg-[#8B0000]/30 hover:bg-[#8B0000]/50 border border-[#8B0000]/50 rounded-lg text-[#ff4500] font-bold tracking-wider uppercase text-sm"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Floor Tracker */}
                                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#8B0000]/20 to-[#02020B]/80 border border-[#8B0000]/50">
                                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#ff4500]/10 blur-[40px]" />
                                    </div>

                                    <div className="relative text-center space-y-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Trophy className="w-5 h-5 text-[#FFD700]" />
                                            <span className="text-[#FFD700]/80 text-sm tracking-widest uppercase font-bold">
                                                Current Progress
                                            </span>
                                        </div>

                                        <div className="text-5xl font-caros font-black text-white tracking-wider drop-shadow-[0_0_20px_rgba(255,69,0,0.5)]">
                                            Floor <span className="text-[#ff4500]">{currentFloor}</span>{" "}
                                            <span className="text-[#A480F2]/50">/ 100</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full max-w-md mx-auto">
                                            <div className="h-3 bg-[#02020B]/80 rounded-full overflow-hidden border border-[#8B0000]/40">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${currentFloor}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-[#8B0000] via-[#ff4500] to-[#ff6600] shadow-[0_0_15px_rgba(255,69,0,0.8)]"
                                                />
                                            </div>
                                        </div>

                                        {currentFloor === 100 && (
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD700]/20 border border-[#FFD700]/50 rounded-lg">
                                                <Trophy className="w-5 h-5 text-[#FFD700]" />
                                                <span className="text-[#FFD700] font-bold tracking-wider uppercase">
                                                    Tower Conquered!
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Floor Guardian */}
                                <div className="relative p-6 rounded-2xl bg-[#02020B]/60 border border-[#A480F2]/30 backdrop-blur-xl">
                                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#A480F2]/10 blur-[50px]" />
                                    </div>

                                    <div className="relative flex items-start gap-6">
                                        {/* Guardian Icon */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#A480F2] border border-[#A480F2]/50 flex items-center justify-center">
                                                <Skull className="w-10 h-10 text-white" />
                                            </div>
                                            <div
                                                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center font-caros font-bold text-sm border-2"
                                                style={{
                                                    backgroundColor: `${difficulty.color}20`,
                                                    borderColor: difficulty.color,
                                                    color: difficulty.color
                                                }}
                                            >
                                                {difficulty.rank}
                                            </div>
                                        </div>

                                        {/* Guardian Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[#A480F2] text-xs tracking-widest uppercase font-bold">
                                                    Floor Guardian
                                                </span>
                                                {currentFloor < 100 ? (
                                                    <Lock className="w-4 h-4 text-[#A480F2]/50" />
                                                ) : (
                                                    <Unlock className="w-4 h-4 text-[#FFD700]" />
                                                )}
                                            </div>
                                            <h3 className="text-xl font-caros font-bold text-white mb-2">
                                                {guardian}
                                            </h3>
                                            <p className="text-[#A480F2]/70 text-sm leading-relaxed">
                                                {guardianDesc}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Next Floor Rewards Preview */}
                                {currentFloor < 100 && (
                                    <div className="p-4 rounded-xl bg-[#02020B]/40 border border-[#8B0000]/30">
                                        <div className="text-center mb-3">
                                            <span className="text-[#ff4500]/80 text-xs tracking-widest uppercase font-bold">
                                                Next Floor Rewards
                                            </span>
                                        </div>
                                        <div className="flex justify-center gap-8">
                                            <div className="text-center">
                                                <div className="text-2xl font-caros font-bold text-[#11D2EF]">
                                                    +{floorData?.nextFloorReward.exp.toLocaleString() || 0}
                                                </div>
                                                <div className="text-[#11D2EF]/60 text-xs tracking-wider uppercase">
                                                    EXP
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-caros font-bold text-[#FFD700]">
                                                    +{floorData?.nextFloorReward.gold.toLocaleString() || 0}
                                                </div>
                                                <div className="text-[#FFD700]/60 text-xs tracking-wider uppercase">
                                                    Gold
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Enter Floor Button */}
                                {currentFloor < 100 && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="w-full py-4 bg-gradient-to-r from-[#8B0000] via-[#c71f16] to-[#8B0000] hover:from-[#a00000] hover:via-[#e02010] hover:to-[#a00000] border border-[#ff4500]/50 rounded-xl text-white font-bold tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(199,31,22,0.4)] hover:shadow-[0_0_50px_rgba(199,31,22,0.6)] flex items-center justify-center gap-3 group"
                                    >
                                        <Flame className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        Enter Floor {nextFloor}
                                    </button>
                                )}

                                {currentFloor >= 100 && (
                                    <div className="text-center py-4">
                                        <p className="text-[#FFD700]/80 tracking-wider uppercase">
                                            You have conquered the Demon Castle!
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Proof Submission Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    >
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => !modalState.includes("scan") && setIsModalOpen(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg rounded-2xl bg-[#02020B]/95 border-2 border-[#A480F2]/40 backdrop-blur-xl shadow-[0_0_40px_rgba(164,128,242,0.3)] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative p-4 border-b border-[#A480F2]/30 bg-gradient-to-b from-[#A480F2]/10 to-transparent">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ScanLine className="w-6 h-6 text-[#A480F2]" />
                                        <h3 className="text-lg font-caros font-bold text-[#A480F2] tracking-wider uppercase">
                                            Submit Proof
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={modalState === "scanning"}
                                        className="p-1 rounded hover:bg-[#A480F2]/20 text-[#A480F2] disabled:opacity-50"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {modalState === "idle" && (
                                    <>
                                        <p className="text-[#A480F2]/80 text-sm mb-4 text-center">
                                            Upload proof of completing a high-tier real-world task to enter Floor {nextFloor}
                                        </p>

                                        {/* Drop Zone */}
                                        <div
                                            onDrop={onDrop}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${isDragOver
                                                    ? "border-[#A480F2] bg-[#A480F2]/10"
                                                    : "border-[#A480F2]/30 hover:border-[#A480F2]/60 bg-[#A480F2]/5"
                                                }`}
                                        >
                                            {preview ? (
                                                <div className="relative aspect-video">
                                                    <img
                                                        src={preview}
                                                        alt="Proof preview"
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreview(null);
                                                            setFile(null);
                                                        }}
                                                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <Upload className="w-10 h-10 text-[#A480F2]/50" />
                                                    <p className="text-[#A480F2]/70 text-sm">
                                                        Drag & drop or click to upload
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                            />
                                        </div>

                                        {errorMsg && (
                                            <p className="text-[#ef4444] text-sm mt-2 text-center">{errorMsg}</p>
                                        )}

                                        <button
                                            onClick={handleSubmit}
                                            disabled={!file}
                                            className="w-full mt-4 py-3 bg-[#A480F2]/20 hover:bg-[#A480F2]/40 border border-[#A480F2]/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[#A480F2] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                                        >
                                            <ShieldAlert className="w-5 h-5" />
                                            Submit Proof
                                        </button>
                                    </>
                                )}

                                {modalState === "scanning" && (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <div className="relative w-16 h-16">
                                            <div className="absolute inset-0 border-4 border-[#A480F2]/20 rounded-full" />
                                            <div className="absolute inset-0 border-4 border-[#A480F2] rounded-full border-t-transparent animate-spin" />
                                        </div>
                                        <p className="text-[#A480F2] font-caros tracking-wider animate-pulse">
                                            Verifying Proof...
                                        </p>
                                    </div>
                                )}

                                {modalState === "success" && (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-[#22c55e]/20 border-2 border-[#22c55e] flex items-center justify-center">
                                            <CheckCircle2 className="w-10 h-10 text-[#22c55e]" />
                                        </div>
                                        <p className="text-[#22c55e] font-caros font-bold text-lg tracking-wider">
                                            Floor {nextFloor} Conquered!
                                        </p>
                                        <p className="text-[#A480F2]/60 text-sm text-center">
                                            Rewards have been granted to your profile.
                                        </p>
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="mt-4 px-6 py-2 bg-[#22c55e]/20 hover:bg-[#22c55e]/40 border border-[#22c55e]/50 rounded-xl text-[#22c55e] font-bold tracking-wider uppercase transition-all"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                )}

                                {modalState === "failed" && (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <ShieldAlert className="w-12 h-12 text-[#ef4444]" />
                                        <p className="text-[#ef4444] font-caros font-bold text-lg tracking-wider">
                                            Verification Failed
                                        </p>
                                        <p className="text-[#A480F2]/60 text-sm text-center">
                                            {errorMsg || "Please try again with clearer proof."}
                                        </p>
                                        <button
                                            onClick={() => setModalState("idle")}
                                            className="mt-4 px-6 py-2 bg-[#ef4444]/20 hover:bg-[#ef4444]/40 border border-[#ef4444]/50 rounded-xl text-[#ef4444] font-bold tracking-wider uppercase transition-all"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
