"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Shield, Wind, Eye, Heart, Brain } from "lucide-react";

interface Stats {
    strength: number;
    agility: number;
    sense: number;
    vitality: number;
    intelligence: number;
}

interface Props {
    stats: Stats;
}

function useCountUp(target: number, duration: number = 2000, delay: number = 0) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const startTime = Date.now();
            const tick = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease-out cubic for dramatic deceleration
                const eased = 1 - Math.pow(1 - progress, 3);
                setValue(Math.round(eased * target));
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, delay);
        return () => clearTimeout(timeout);
    }, [target, duration, delay]);

    return value;
}

const STAT_CONFIG = [
    { key: "strength" as const, label: "STR", fullLabel: "Strength", icon: Shield, delay: 400 },
    { key: "agility" as const, label: "AGI", fullLabel: "Agility", icon: Wind, delay: 600 },
    { key: "sense" as const, label: "SEN", fullLabel: "Sense", icon: Eye, delay: 800 },
    { key: "vitality" as const, label: "VIT", fullLabel: "Vitality", icon: Heart, delay: 1000 },
    { key: "intelligence" as const, label: "INT", fullLabel: "Intelligence", icon: Brain, delay: 1200 },
];

export default function StatReveal({ stats }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 w-full max-w-md mx-4"
        >
            {/* Title */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                className="text-center mb-8"
            >
                <p className="text-system-neon/50 text-xs tracking-[0.3em] uppercase font-caros mb-2">
                    Assessment Complete
                </p>
                <h1
                    className="text-3xl font-caros font-black uppercase tracking-wider"
                    style={{
                        color: "#11D2EF",
                        textShadow: "0 0 10px #11D2EF, 0 0 30px #11D2EF, 0 0 60px rgba(17,210,239,0.4)",
                    }}
                >
                    Player Status
                </h1>
            </motion.div>

            {/* Stats Container */}
            <div
                className="rounded-2xl border border-system-blue/40 bg-white/10 shadow-[0_0_60px_rgba(1,27,222,0.15)] overflow-hidden"
                style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
            >
                {/* Beam */}
                <motion.div
                    animate={{ y: ["-10%", "110%"] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-system-neon/50 to-transparent top-0 z-20 pointer-events-none"
                />

                <div className="p-6 space-y-1">
                    {STAT_CONFIG.map((cfg) => (
                        <StatRow
                            key={cfg.key}
                            icon={cfg.icon}
                            label={cfg.label}
                            fullLabel={cfg.fullLabel}
                            target={stats[cfg.key]}
                            delay={cfg.delay}
                        />
                    ))}
                </div>

                {/* Level indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.8, duration: 1 }}
                    className="border-t border-system-blue/20 px-6 py-4 flex items-center justify-between"
                >
                    <span className="text-xs text-system-neon/40 font-caros uppercase tracking-widest">
                        Player Level
                    </span>
                    <span
                        className="text-2xl font-caros font-black"
                        style={{
                            color: "#11D2EF",
                            textShadow: "0 0 8px #11D2EF, 0 0 20px rgba(17,210,239,0.5)",
                        }}
                    >
                        1
                    </span>
                </motion.div>
            </div>

            {/* Warning */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5, duration: 1 }}
                className="text-center text-xs text-system-purple/50 font-lato mt-6"
            >
                ⚠ SYSTEM LOCK ACTIVE — DELETION RESTRICTED UNTIL LEVEL 15
            </motion.p>
        </motion.div>
    );
}

function StatRow({
    icon: Icon,
    label,
    fullLabel,
    target,
    delay,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    fullLabel: string;
    target: number;
    delay: number;
}) {
    const currentValue = useCountUp(target, 1800, delay);

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay / 1000, duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-4 py-3 border-b border-system-blue/10 last:border-b-0"
        >
            <div className="flex-shrink-0 w-9 h-9 rounded-sm border border-system-blue/30 bg-system-blue/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-system-neon/70" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-system-neon/50 font-caros tracking-widest uppercase">
                        {label} <span className="text-system-neon/25 ml-1 normal-case tracking-normal font-lato">{fullLabel}</span>
                    </span>
                    <span
                        className="text-xl font-caros font-black tabular-nums"
                        style={{
                            color: "#11D2EF",
                            textShadow: "0 0 8px #11D2EF, 0 0 20px rgba(17,210,239,0.5)",
                        }}
                    >
                        {currentValue}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-system-black/60 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentValue / 99) * 100}%` }}
                        transition={{ delay: delay / 1000 + 0.3, duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                            background: "linear-gradient(90deg, #011BDE, #11D2EF)",
                            boxShadow: "0 0 8px rgba(17,210,239,0.6)",
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
