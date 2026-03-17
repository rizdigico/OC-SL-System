"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Shield, Sparkles } from "lucide-react";

export interface Skill {
    _id: string;
    name: string;
    description: string;
    type: "passive" | "active";
    mpCost?: number;
    level: number;
}

interface SkillMatrixProps {
    isOpen: boolean;
    onClose: () => void;
    skills?: Skill[];
}

export const SkillMatrix: React.FC<SkillMatrixProps> = ({ isOpen, onClose, skills = [] }) => {
    const [isActivating, setIsActivating] = useState<string | null>(null);

    // If no skills passed, provide some dummy data for visual testing according to the system theme
    const displaySkills = skills.length > 0 ? skills : [
        {
            _id: "1",
            name: "Shadow Extraction",
            description: "Extract the shadow of a fallen enemy to join your army.",
            type: "active",
            mpCost: 50,
            level: 1
        },
        {
            _id: "2",
            name: "Sprint",
            description: "Increase movement speed by 30% for 1 minute.",
            type: "active",
            mpCost: 20,
            level: 2
        },
        {
            _id: "3",
            name: "Toughness",
            description: "Passively reduces all incoming physical damage by 10%.",
            type: "passive",
            level: 3
        },
        {
            _id: "4",
            name: "Shadow Authority",
            description: "Increases the stats of all shadow soldiers by 15%.",
            type: "passive",
            level: 1
        }
    ] as Skill[];

    const passiveSkills = displaySkills.filter(s => s.type === "passive");
    const activeSkills = displaySkills.filter(s => s.type === "active");

    const handleUseSkill = async (skillId: string) => {
        setIsActivating(skillId);
        const token = localStorage.getItem("system_token");

        try {
            const res = await fetch(`http://localhost:5000/api/skills/${skillId}/use`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (res.ok) {
                console.log(`[SYSTEM] Skill ${skillId} activated successfully.`);
            } else {
                console.warn(`[SYSTEM] Failed to activate skill ${skillId}.`);
            }
        } catch (error) {
            console.error("Error pinging backend for skill activation:", error);
        } finally {
            setIsActivating(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <React.Fragment>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Sliding Panel */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 w-full max-w-4xl h-[85vh] bg-[#02020B] border-t border-[#A480F2]/50 shadow-[0_-10px_40px_rgba(164,128,242,0.15)] rounded-t-3xl z-50 flex flex-col font-lato overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#A480F2]/30 flex justify-between items-center bg-white/5 relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#A480F2] to-transparent opacity-50" />
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-[#A480F2]" />
                                <h2 className="text-2xl font-caros font-black text-white tracking-widest uppercase">
                                    Skill <span className="text-[#A480F2]">Matrix</span>
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content - Separating Passives & Actives */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">

                                {/* Passive Skills Panel */}
                                <div className="space-y-6 flex flex-col">
                                    <h3 className="text-lg font-caros font-bold text-[#A480F2]/80 uppercase tracking-widest flex items-center gap-2 border-b border-[#A480F2]/20 pb-2">
                                        <Shield className="w-5 h-5" /> Passive Skills
                                    </h3>

                                    <div className="space-y-4 flex-1">
                                        {passiveSkills.length === 0 ? (
                                            <p className="text-gray-500 text-sm italic">No passive skills acquired.</p>
                                        ) : (
                                            passiveSkills.map(skill => (
                                                <div key={skill._id} className="p-4 rounded-xl bg-[#A480F2]/5 border border-[#A480F2]/20 backdrop-blur-sm group hover:border-[#A480F2]/40 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-white font-bold text-lg">{skill.name}</h4>
                                                        <span className="text-xs font-bold px-2 py-1 rounded bg-[#A480F2]/20 text-[#A480F2]">Lv. {skill.level}</span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm leading-relaxed">{skill.description}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Active Skills Panel */}
                                <div className="space-y-6 flex flex-col">
                                    <h3 className="text-lg font-caros font-bold text-[#11D2EF]/80 uppercase tracking-widest flex items-center gap-2 border-b border-[#11D2EF]/20 pb-2">
                                        <Zap className="w-5 h-5" /> Active Skills
                                    </h3>

                                    <div className="space-y-4 flex-1">
                                        {activeSkills.length === 0 ? (
                                            <p className="text-gray-500 text-sm italic">No active skills acquired.</p>
                                        ) : (
                                            activeSkills.map(skill => (
                                                <div key={skill._id} className="p-4 rounded-xl bg-[#02020B] border border-[#A480F2]/30 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(164,128,242,0.15)] transition-all">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[#A480F2]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                    <div className="relative z-10 flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="text-white font-bold text-lg shadow-sm">{skill.name}</h4>
                                                            {skill.mpCost !== undefined && (
                                                                <span className="text-xs font-bold text-blue-400">Cost: {skill.mpCost} MP</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold px-2 py-1 rounded bg-[#11D2EF]/10 text-[#11D2EF] border border-[#11D2EF]/30">Lv. {skill.level}</span>
                                                    </div>

                                                    <p className="text-gray-400 text-sm leading-relaxed relative z-10 mb-4 min-h-[3rem]">{skill.description}</p>

                                                    <button
                                                        onClick={() => handleUseSkill(skill._id)}
                                                        disabled={isActivating === skill._id}
                                                        className="w-full relative z-10 py-2.5 rounded-lg font-caros font-bold tracking-[0.2em] text-sm text-[#A480F2] border border-[#A480F2]/50 bg-[#A480F2]/10 hover:bg-[#A480F2] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase hover:shadow-[0_0_15px_rgba(164,128,242,0.5)] flex justify-center items-center gap-2"
                                                    >
                                                        {isActivating === skill._id ? (
                                                            <React.Fragment>
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                <span>ACTIVATING...</span>
                                                            </React.Fragment>
                                                        ) : (
                                                            "USE SKILL"
                                                        )}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                </React.Fragment>
            )}
        </AnimatePresence>
    );
};
