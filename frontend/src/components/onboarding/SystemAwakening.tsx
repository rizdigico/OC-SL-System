"use client";

import { motion } from "framer-motion";
import { User, Lock, ChevronRight, Terminal } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SystemAwakening() {
    const [isHovered, setIsHovered] = useState(false);
    const [isDevLoading, setIsDevLoading] = useState(false);
    const [devError, setDevError] = useState<string | null>(null);
    const router = useRouter();

    const handleEnterSystem = () => {
        router.push("/assessment");
    };

    const handleDevAccess = async () => {
        setIsDevLoading(true);
        setDevError(null);
        try {
            const res = await fetch("/api/auth/dev-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                if (res.status === 429) {
                    setDevError("Rate limited. Please wait.");
                } else {
                    setDevError(`System error (${res.status}). Try again.`);
                }
                return;
            }

            const data = await res.json();
            if (data.token) {
                localStorage.setItem("system_token", data.token);
            }
            router.push("/dashboard");
        } catch (error) {
            console.error("Dev Access failed:", error);
            setDevError("Cannot reach server. Is the backend running?");
        } finally {
            setIsDevLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-system-black relative">
            {/* Background Ambience effect */}
            <div className="absolute inset-0 bg-system-black z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-system-purple/20 blur-[150px] opacity-30 rounded-full animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8 rounded-2xl border border-system-blue/40 bg-white/10 backdrop-blur-xl shadow-[0_0_40px_rgba(1,27,222,0.15)] overflow-hidden flex flex-col items-center"
            >
                {/* Animated Scanning Line */}
                <motion.div
                    animate={{
                        y: ["-10%", "110%"],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "linear",
                    }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-system-neon/50 to-transparent top-0 opacity-50 z-20 pointer-events-none"
                />

                <div className="flex flex-col items-center mb-10 mt-4 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-system-neon mb-2 text-sm tracking-[0.2em] uppercase font-caros font-bold"
                    >
                        System Initialization
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="text-4xl font-caros font-black text-system-blue tracking-wider uppercase drop-shadow-[0_0_10px_rgba(1,27,222,0.8)] text-center"
                    >
                        Awakening
                    </motion.h1>
                </div>

                <form className="space-y-6 flex flex-col w-full" onSubmit={(e) => { e.preventDefault(); handleEnterSystem(); }}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="relative"
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-system-neon/60" />
                        </div>
                        <input
                            type="text"
                            placeholder="PLAYER ID"
                            className="w-full bg-system-black/40 border-b-2 border-system-blue/30 px-10 py-4 text-system-neon placeholder:text-system-neon/30 focus:outline-none focus:border-system-neon transition-colors duration-300 font-caros"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="relative"
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-system-neon/60" />
                        </div>
                        <input
                            type="password"
                            placeholder="PASSCODE"
                            className="w-full bg-system-black/40 border-b-2 border-system-blue/30 px-10 py-4 text-system-neon placeholder:text-system-neon/30 focus:outline-none focus:border-system-neon transition-colors duration-300 font-caros tracking-widest"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6, duration: 0.8 }}
                        className="pt-6"
                    >
                        <button
                            type="submit"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className="group relative w-full flex justify-center items-center py-4 px-4 border border-system-neon/50 text-sm font-bold font-caros rounded-sm text-system-neon bg-transparent overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(17,210,239,0.4)] cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-system-neon/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                            <span className="relative z-10 flex items-center gap-2 uppercase tracking-[0.1em]">
                                Enter The System
                                <motion.div
                                    animate={{ x: isHovered ? 5 : 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </motion.div>
                            </span>
                        </button>
                    </motion.div>
                </form>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 1 }}
                    className="mt-8 text-center flex flex-col items-center gap-4 w-full"
                >
                    <p className="text-xs text-system-purple/70 font-lato">
                        UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED
                    </p>

                    {/* Dev Access Bypass Button */}
                    <button
                        onClick={handleDevAccess}
                        disabled={isDevLoading}
                        className="mt-2 group relative flex items-center justify-center gap-2 py-2 px-6 rounded-md border border-system-purple/30 bg-system-black/50 hover:bg-system-purple/10 text-system-purple hover:text-white hover:border-system-purple hover:shadow-[0_0_15px_rgba(164,128,242,0.4)] transition-all duration-300 cursor-pointer text-xs font-caros tracking-wider uppercase font-semibold"
                    >
                        <Terminal className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                        {isDevLoading ? "Pinging System..." : "Dev Access"}
                    </button>

                    {devError && (
                        <p className="text-red-400 text-xs font-caros tracking-wide text-center animate-pulse">
                            ⚠ {devError}
                        </p>
                    )}
                </motion.div>
            </motion.div>
        </main>
    );
}
