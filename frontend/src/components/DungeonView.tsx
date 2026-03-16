import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Skull, CheckCircle2 } from 'lucide-react';
import { MobCard } from './dungeon/MobComponents';
import { useSystemAudio } from "@/hooks/useSystemAudio";

interface DungeonViewProps {
    quests: any[];
    onComplete: (quest: any) => void;
    onEnterBoss?: (quest: any) => void;
}

export const DungeonView: React.FC<DungeonViewProps> = ({ quests, onComplete, onEnterBoss }) => {
    const { playClick } = useSystemAudio();

    // Determine overall progress
    const totalMobs = quests.length;
    const completedMobs = quests.filter(q => q.status === 'completed' || (q.objectives && q.objectives[0]?.completed)).length;
    const allMobsDefeated = totalMobs > 0 && completedMobs === totalMobs;

    return (
        <div className="relative py-8 px-4 font-lato">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#011BDE]/20 via-[#011BDE] to-[#c71f16] shadow-[0_0_15px_rgba(1,27,222,0.4)] opacity-50 -translate-x-1/2 z-0" />

            <div className="space-y-16 relative z-10">
                <AnimatePresence>
                    {quests.map((quest, i) => {
                        const isEven = i % 2 === 0;
                        const isCompleted = quest.status === 'completed' || (quest.objectives && quest.objectives[0]?.completed);

                        return (
                            <motion.div
                                key={quest._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.1 }}
                                className={`flex flex-col md:flex-row items-center w-full ${isEven ? 'md:justify-start' : 'md:justify-end'}`}
                            >
                                <div className={`w-full md:w-5/12 ${isEven ? 'md:pr-10' : 'md:pl-10 order-last md:order-none'}`}>
                                    <div className="relative">
                                        {/* Connecting Line to timeline */}
                                        <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-10 h-0.5 bg-[#011BDE]/50 ${isEven ? '-right-10' : '-left-10'}`} />

                                        <MobCard quest={quest} onComplete={onComplete} onEnterBoss={onEnterBoss} />

                                        {isCompleted && (
                                            <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-sm z-20">
                                                <div className="bg-[#02020B] border border-[#011BDE] p-3 rounded-full shadow-[0_0_20px_rgba(1,27,222,0.5)]">
                                                    <CheckCircle2 className="w-8 h-8 text-[#011BDE]" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline Node */}
                                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#02020B] border-2 border-[#011BDE] shadow-[0_0_10px_rgba(1,27,222,0.8)] z-10 flex items-center justify-center">
                                    {isCompleted && <div className="w-3 h-3 bg-[#011BDE] rounded-full shadow-[0_0_5px_currentColor]" />}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Boss Gate */}
                <motion.div
                    className="flex flex-col items-center w-full mt-24 relative"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="w-8 h-8 rounded-full bg-[#02020B] border-2 border-[#c71f16] shadow-[0_0_15px_rgba(199,31,22,0.8)] z-10 flex items-center justify-center mb-8">
                        <Skull className="w-4 h-4 text-[#c71f16]" />
                    </div>

                    <div className={`w-full md:w-2/3 p-1 rounded-2xl ${allMobsDefeated ? 'bg-gradient-to-r from-[#c71f16] via-red-500 to-[#c71f16] animate-pulse' : 'bg-[#c71f16]/20'} shadow-[0_0_30px_rgba(199,31,22,0.2)]`}>
                        <div className="bg-[#02020B] rounded-xl p-8 border border-[#c71f16]/30 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden group">

                            {/* Ethereal red wisps */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#c71f16]/5 to-transparent opacity-50" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c71f16]/10 via-[#02020B]/80 to-[#02020B] pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                {allMobsDefeated ? (
                                    <React.Fragment>
                                        <Skull className="w-16 h-16 text-[#c71f16] mb-4 drop-shadow-[0_0_10px_rgba(199,31,22,0.8)] animate-bounce" />
                                        <h2 className="text-3xl font-caros font-black text-white tracking-[0.2em] mb-2 uppercase drop-shadow-[0_2px_4px_rgba(199,31,22,0.5)]">
                                            The Boss Awaits
                                        </h2>
                                        <p className="text-gray-400 font-lato mb-6">The path is clear. Do you dare to enter?</p>
                                        <button
                                            onClick={() => { playClick(); onEnterBoss && onEnterBoss({ title: "DUNGEON BOSS", difficulty: "S", description: "The final ruler of this dungeon tier." }); }}
                                            className="px-8 py-3 bg-[#c71f16]/10 hover:bg-[#c71f16] border border-[#c71f16] text-[#c71f16] hover:text-white font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(199,31,22,0.4)] hover:shadow-[0_0_30px_rgba(199,31,22,0.8)] rounded-lg flex items-center gap-2"
                                        >
                                            <Skull className="w-5 h-5" /> Challenge Boss
                                        </button>
                                    </React.Fragment>
                                ) : (
                                    <React.Fragment>
                                        <Lock className="w-16 h-16 text-[#c71f16]/50 mb-4" />
                                        <h2 className="text-2xl font-caros font-bold text-gray-400 tracking-[0.2em] mb-2 uppercase">
                                            Boss Room Locked
                                        </h2>
                                        <p className="text-gray-500 font-lato text-sm">
                                            Defeat all {totalMobs} mobs leading up to this point to unlock the Boss Chamber.
                                        </p>
                                        <div className="mt-6 w-full max-w-xs bg-black/40 rounded-full h-2 border border-[#c71f16]/20 overflow-hidden">
                                            <div
                                                className="h-full bg-[#c71f16] shadow-[0_0_10px_rgba(199,31,22,0.8)] transition-all duration-500"
                                                style={{ width: `${totalMobs === 0 ? 0 : (completedMobs / totalMobs) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-[#c71f16] font-bold mt-2 tracking-widest">{completedMobs} / {totalMobs}</span>
                                    </React.Fragment>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
