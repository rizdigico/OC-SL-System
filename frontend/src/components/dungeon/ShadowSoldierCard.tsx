"use client";

import { motion } from "framer-motion";
import { User, Shield } from "lucide-react";

interface Props {
    name: string;
    rank: string;
}

export default function ShadowSoldierCard({ name, rank }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
                mass: 1,
            }}
            className="relative z-30 w-full max-w-sm"
        >
            <div
                className="rounded-xl border-2 border-system-purple bg-system-black/80 shadow-[0_0_80px_rgba(164,128,242,0.4)] overflow-hidden"
                style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            >
                {/* Inner glow and scanlines */}
                <div className="absolute inset-0 bg-gradient-to-b from-system-purple/20 to-transparent opacity-50" />

                {/* Card Header */}
                <div className="border-b border-system-purple/30 p-6 flex flex-col items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full border border-system-purple flex items-center justify-center bg-system-purple/10 mb-4 shadow-[0_0_20px_rgba(164,128,242,0.8)]">
                        <User className="w-8 h-8 text-system-purple" />
                    </div>
                    <h2
                        className="text-2xl font-caros font-black uppercase tracking-[0.2em]"
                        style={{ color: "#A480F2", textShadow: "0 0 10px #A480F2, 0 0 20px rgba(164,128,242,0.5)" }}
                    >
                        {name}
                    </h2>
                    <div className="absolute top-2 right-3 text-xs tracking-widest text-system-purple/50 font-caros">
                        EXTRACTED
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-6 bg-gradient-to-b from-transparent to-system-purple/5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-system-neon/60 tracking-widest font-caros uppercase">Rank</span>
                        <span className="text-sm text-system-neon font-bold tracking-widest uppercase">{rank}</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-system-neon/60 tracking-widest font-caros uppercase">Status</span>
                        <span className="text-sm text-system-neon font-bold tracking-widest uppercase">Loyal</span>
                    </div>

                    <div className="w-full pt-4 mt-2 border-t border-system-purple/20 flex gap-2">
                        <div className="flex-1 py-2 bg-system-purple/10 rounded flex items-center justify-center border border-system-purple/20">
                            <Shield className="w-4 h-4 text-system-purple" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
