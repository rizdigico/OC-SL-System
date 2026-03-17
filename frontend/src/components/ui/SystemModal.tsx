"use client";

import { motion } from "framer-motion";

interface SystemModalProps {
    children: React.ReactNode;
    stepLabel: string;
    stepTitle: string;
}

export default function SystemModal({ children, stepLabel, stepTitle }: SystemModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 w-full max-w-lg mx-4"
        >
            <div
                className="rounded-2xl border border-system-blue/40 bg-white/10 shadow-[0_0_50px_rgba(1,27,222,0.12)] overflow-hidden"
                style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
            >
                {/* Scanning beam */}
                <motion.div
                    animate={{ y: ["-10%", "110%"] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-system-neon/40 to-transparent top-0 z-20 pointer-events-none"
                />

                {/* Header */}
                <div className="px-8 pt-8 pb-4 border-b border-system-blue/20">
                    <p className="text-system-neon/60 text-xs tracking-[0.25em] uppercase font-caros mb-1">{stepLabel}</p>
                    <h2 className="text-2xl font-caros font-bold text-system-blue tracking-wide uppercase drop-shadow-[0_0_8px_rgba(1,27,222,0.6)]">
                        {stepTitle}
                    </h2>
                </div>

                {/* Content */}
                <div className="px-8 py-6">
                    {children}
                </div>
            </div>
        </motion.div>
    );
}
