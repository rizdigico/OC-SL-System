"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ShieldAlert, CheckCircle2, ScanLine } from "lucide-react";
import Image from "next/image";

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    questId?: string;
    questType?: "boss" | "training";
}

type ModalState = "idle" | "scanning" | "success" | "failed";

export default function VerificationModal({
    isOpen,
    onClose,
    questType = "training",
}: VerificationModalProps) {
    const [state, setState] = useState<ModalState>("idle");
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setState("idle");
            setPreview(null);
            setFile(null);
            setErrorMsg("");
            setIsDragOver(false);
        }
    }, [isOpen]);

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

    const handleSubmit = async () => {
        if (!file) return;
        setState("scanning");
        setErrorMsg("");

        try {
            const token = localStorage.getItem("system_token");
            const formData = new FormData();
            formData.append("photo", file);

            const res = await fetch("http://localhost:5000/api/uploads/quest-proof", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();

            // For now, treat any successful upload as verified
            // In production this would check data.verified from the vision microservice
            const verified = !!data.filename;

            if (verified) {
                setState("success");
                // Flash + close after brief delay
                setTimeout(() => {
                    onClose();
                }, 1800);
            } else {
                setState("failed");
                setErrorMsg(
                    data.message || "Proof does not match quest parameters."
                );
            }
        } catch (err: unknown) {
            setState("failed");
            const errorMessage = err instanceof Error ? err.message : "System error during verification.";
            setErrorMsg(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Screen Flash on Success */}
                    {state === "success" && (
                        <motion.div
                            key="flash"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.9, 0] }}
                            transition={{ duration: 0.8, times: [0, 0.15, 1] }}
                            className="fixed inset-0 z-[9999] bg-system-neon pointer-events-none"
                        />
                    )}

                    {/* Overlay */}
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => state === "idle" && onClose()}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.85, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 40 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-lg rounded-2xl bg-white/5 border border-system-blue/30 backdrop-blur-xl shadow-[0_8px_60px_rgba(1,27,222,0.25)] overflow-hidden"
                        >
                            {/* Ambient glow */}
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-system-purple/20 blur-[100px] rounded-full pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-system-blue/20 blur-[100px] rounded-full pointer-events-none" />

                            {/* Header */}
                            <div className="relative z-10 p-6 pb-0 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-caros font-bold text-system-neon tracking-wider uppercase">
                                        Quest Verification
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">
                                        {questType === "boss"
                                            ? "⚔ Boss Kill Proof"
                                            : "🏋 Training Proof"}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    disabled={state === "scanning"}
                                    className="text-gray-500 hover:text-white transition disabled:opacity-30"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="relative z-10 p-6 space-y-5">
                                {/* ── IDLE: Show dropzone ── */}
                                {(state === "idle" || state === "failed") && (
                                    <>
                                        <div
                                            onDrop={onDrop}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`
                                                relative cursor-pointer rounded-xl p-8 flex flex-col items-center justify-center text-center
                                                border-2 border-dashed transition-all duration-300
                                                ${isDragOver
                                                    ? "border-system-neon bg-system-neon/10 shadow-[0_0_30px_rgba(17,210,239,0.25)]"
                                                    : preview
                                                        ? "border-system-purple/60 bg-system-purple/5"
                                                        : "border-system-blue/40 bg-white/[0.02] hover:border-system-neon/60 hover:bg-system-neon/5"
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
                                                    <div className="relative w-full max-w-sm h-40 mx-auto rounded-lg overflow-hidden border border-white/10">
                                                        <Image
                                                            src={preview}
                                                            alt="Proof preview"
                                                            fill
                                                            className="object-contain"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <p className="text-sm text-system-neon/70">
                                                        Click or drop to replace
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 text-system-blue/60 mb-3" />
                                                    <p className="text-sm text-gray-300 font-medium">
                                                        Drop proof image here
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        or click to browse • PNG, JPG, WEBP
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {/* Error message */}
                                        {state === "failed" && (
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
                                                        {errorMsg || "Proof rejected by system."}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}

                                        {errorMsg && state !== "failed" && (
                                            <p className="text-red-400 text-xs">{errorMsg}</p>
                                        )}

                                        {/* Submit button */}
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!file}
                                            className={`
                                                w-full py-3 rounded-xl font-caros font-bold tracking-widest uppercase text-sm transition-all duration-300
                                                ${file
                                                    ? "bg-system-blue text-white hover:bg-system-blue/80 shadow-[0_0_20px_rgba(1,27,222,0.4)] hover:shadow-[0_0_30px_rgba(1,27,222,0.6)]"
                                                    : "bg-white/5 text-gray-600 cursor-not-allowed"
                                                }
                                            `}
                                        >
                                            Submit for Verification
                                        </button>
                                    </>
                                )}

                                {/* ── SCANNING: Loading Animation ── */}
                                {state === "scanning" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center py-10 space-y-6"
                                    >
                                        {/* Scan animation container */}
                                        <div className="relative w-40 h-40 rounded-xl border border-system-blue/30 bg-black/40 overflow-hidden">
                                            {preview && (
                                                <Image
                                                    src={preview}
                                                    alt="Scanning preview"
                                                    fill
                                                    className="object-cover opacity-60"
                                                    unoptimized
                                                />
                                            )}
                                            {/* Sweeping laser line */}
                                            <motion.div
                                                animate={{ y: ["-100%", "400%"] }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "linear",
                                                }}
                                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-system-neon to-transparent shadow-[0_0_20px_rgba(17,210,239,0.8)]"
                                            />
                                            {/* Corner brackets */}
                                            <div className="absolute inset-0 pointer-events-none">
                                                <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-system-neon/80" />
                                                <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-system-neon/80" />
                                                <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-system-neon/80" />
                                                <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-system-neon/80" />
                                            </div>
                                        </div>

                                        {/* Text */}
                                        <div className="text-center space-y-2">
                                            <motion.div
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="flex items-center gap-2 text-system-neon font-caros font-bold tracking-[0.25em] uppercase"
                                            >
                                                <ScanLine className="w-5 h-5" />
                                                System Scanning...
                                            </motion.div>
                                            <p className="text-xs text-gray-500 tracking-wider">
                                                Analyzing proof against quest parameters
                                            </p>
                                        </div>

                                        {/* Fake progress dots */}
                                        <div className="flex gap-2">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        delay: i * 0.25,
                                                    }}
                                                    className="w-2 h-2 rounded-full bg-system-neon"
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── SUCCESS: Brief confirmation ── */}
                                {state === "success" && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center py-12 space-y-4"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.15, 1] }}
                                            transition={{ duration: 0.6 }}
                                        >
                                            <CheckCircle2 className="w-16 h-16 text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]" />
                                        </motion.div>
                                        <p className="text-green-400 font-caros font-bold tracking-[0.2em] uppercase text-lg">
                                            Verified
                                        </p>
                                        <p className="text-xs text-gray-500 tracking-wider">
                                            Proof accepted. Rewards processing...
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
