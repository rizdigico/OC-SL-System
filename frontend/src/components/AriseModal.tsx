import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSystemAudio } from "@/hooks/useSystemAudio";

interface AriseModalProps {
    isOpen: boolean;
    onClose: () => void;
    bossData: any;
    userLevel?: number;
}

export function AriseModal({ isOpen, onClose, bossData, userLevel }: AriseModalProps) {
    const [chances, setChances] = useState(3);
    const [statusText, setStatusText] = useState("");
    const [isShaking, setIsShaking] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);
    const [mistActive, setMistActive] = useState(false);
    const { playClick, playError } = useSystemAudio();

    const handleArise = async () => {
        if (chances <= 0) return;
        playClick();
        
        setIsShaking(true);
        setMistActive(true);
        setStatusText("Attempting Extraction...");

        try {
            const token = localStorage.getItem("system_token");
            const res = await fetch("http://localhost:5000/api/combat/extract", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    bossId: bossData?._id || bossData?.id || "temp-boss-id",
                    mobLevel: bossData?.level || 10,
                    mobData: bossData
                })
            });

            const data = await res.json();

            setTimeout(() => {
                setIsShaking(false);
                setMistActive(false);

                if (data.success) {
                    setIsFlashing(true);
                    setStatusText("Shadow Extracted!");
                    setTimeout(() => {
                        setIsFlashing(false);
                        onClose();
                    }, 2000);
                } else {
                    const remaining = chances - 1;
                    setChances(remaining);
                    playError();
                    
                    if (remaining <= 0) {
                        setStatusText("The shadow has faded into nothingness");
                        setTimeout(() => {
                            onClose();
                        }, 2500);
                    } else {
                        setStatusText("Extraction Failed...");
                    }
                }
            }, 1500); // 1.5s animation duration
        } catch (err) {
            console.error(err);
            setIsShaking(false);
            setMistActive(false);
            setStatusText("Error occurred...");
            playError();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes brutal-shake {
                            0% { transform: translate(10px, 10px) rotate(0deg); }
                            10% { transform: translate(-10px, -2px) rotate(-1deg); }
                            20% { transform: translate(-3px, 0px) rotate(1deg); }
                            30% { transform: translate(12px, 2px) rotate(0deg); }
                            40% { transform: translate(1px, -1px) rotate(1deg); }
                            50% { transform: translate(-1px, 2px) rotate(-1deg); }
                            60% { transform: translate(-15px, 1px) rotate(0deg); }
                            70% { transform: translate(3px, 1px) rotate(-1deg); }
                            80% { transform: translate(-1px, -1px) rotate(1deg); }
                            90% { transform: translate(10px, 2px) rotate(0deg); }
                            100% { transform: translate(1px, -2px) rotate(-1deg); }
                        }
                        .arise-shake {
                            animation: brutal-shake 0.3s infinite;
                        }
                        @keyframes mist-flow {
                            0% { transform: translateY(0) scale(1); opacity: 0; }
                            50% { opacity: 0.5; }
                            100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
                        }
                        .purple-mist {
                            position: absolute;
                            bottom: -50px;
                            left: 0;
                            right: 0;
                            height: 200px;
                            background: radial-gradient(circle, rgba(164,128,242,0.4) 0%, transparent 70%);
                            filter: blur(20px);
                            pointer-events: none;
                            animation: mist-flow 1.5s ease-out forwards;
                        }
                        `
                    }} />

                    {/* White Flash Overlay */}
                    {isFlashing && (
                        <motion.div 
                            initial={{ opacity: 1 }} 
                            animate={{ opacity: 0 }} 
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-white z-[110] pointer-events-none" 
                        />
                    )}

                    <div className={`relative w-full max-w-2xl bg-black border border-[#A480F2]/50 shadow-[0_0_80px_rgba(164,128,242,0.3)] rounded-3xl p-10 flex flex-col items-center justify-center overflow-hidden ${isShaking ? 'arise-shake' : ''}`}>
                        
                        {/* Background glowing accents */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(164,128,242,0.15)_0%,transparent_70%)] pointer-events-none" />
                        
                        {/* Purple Mist Element */}
                        {mistActive && <div className="purple-mist" />}
                        {mistActive && <div className="purple-mist" style={{ animationDelay: '0.2s', left: '-20%' }} />}
                        {mistActive && <div className="purple-mist" style={{ animationDelay: '0.4s', left: '20%' }} />}

                        <div className="relative z-10 flex flex-col items-center gap-8 w-full">
                            <h2 className="text-[#A480F2] font-caros font-bold tracking-[0.3em] uppercase text-xl">
                                Extract Shadow
                            </h2>

                            <div className="text-center space-y-2">
                                <h3 className="text-4xl text-white font-black drop-shadow-[0_0_10px_rgba(164,128,242,0.8)]">
                                    {bossData?.name || "BOSS SHADOW"}
                                </h3>
                                <p className="text-gray-400">Level {bossData?.level || 10}</p>
                            </div>

                            <button
                                onClick={handleArise}
                                disabled={chances <= 0 || isShaking || isFlashing}
                                className="w-full max-w-sm py-6 bg-black border-[3px] border-[#A480F2] hover:bg-[#A480F2]/10 rounded-xl text-[#A480F2] text-6xl font-black font-caros tracking-widest uppercase transition-all hover:shadow-[0_0_50px_rgba(164,128,242,0.6)] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                            >
                                ARISE
                            </button>

                            <div className="text-center space-y-3">
                                <p className="text-2xl font-bold text-gray-300">
                                    Extraction Chances: <span className="text-[#A480F2]">{chances}</span>
                                </p>
                                <p className={`text-lg font-bold min-h-[30px] ${statusText === 'Shadow Extracted!' ? 'text-white' : statusText.includes('Failed') ? 'text-red-500' : 'text-[#A480F2]'}`}>
                                    {statusText}
                                </p>
                            </div>
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
