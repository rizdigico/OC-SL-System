"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function PenaltyZone() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#c71f16]/95 flex flex-col items-center justify-center overflow-hidden pointer-events-auto">
            <style>{`
                @keyframes crt-flicker {
                    0% { opacity: 0.95; transform: translateY(0); }
                    5% { opacity: 0.85; transform: translateY(-1px); }
                    10% { opacity: 0.95; transform: translateY(1px); }
                    15% { opacity: 1; transform: translateY(0); }
                    50% { opacity: 0.95; transform: translateY(0); }
                    55% { opacity: 0.8; transform: translateY(1px); }
                    60% { opacity: 0.95; transform: translateY(-1px); }
                    100% { opacity: 0.95; transform: translateY(0); }
                }
                .crt-flicker-effect {
                    animation: crt-flicker 0.15s infinite normal none;
                }
                @keyframes crt-scanline {
                    0% { transform: translateY(-100vh); }
                    100% { transform: translateY(100vh); }
                }
                .scanline {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3));
                    background-size: 100% 4px;
                    z-index: 10;
                    pointer-events: none;
                }
                @keyframes screen-shake {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(2px, 2px) rotate(0.5deg); }
                    50% { transform: translate(0, 0) rotate(0eg); }
                    75% { transform: translate(-2px, 2px) rotate(-0.5deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
                .screen-shake-effect {
                    animation: screen-shake 0.2s infinite;
                }
            `}</style>

            <div className="scanline" />

            <div className="absolute inset-0 bg-black mix-blend-overlay opacity-30 pointer-events-none" />

            <div className="screen-shake-effect relative z-20 flex flex-col items-center crt-flicker-effect w-full px-4">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="p-8 md:p-14 border-[6px] border-[#8a150f] bg-black/80 backdrop-blur-xl shadow-[0_0_100px_#c71f16] w-full max-w-4xl"
                >
                    <motion.h1
                        className="text-4xl sm:text-5xl md:text-7xl font-caros font-black text-white uppercase tracking-[0.1em] drop-shadow-[0_0_20px_#ff0000] text-center"
                    >
                        URGENT QUEST:<br />
                        <span className="text-[#ff3a3a] block mt-6 border-y-4 border-[#ff3a3a] py-6 bg-[#ff0000]/10">PENALTY ZONE.</span>
                        <span className="block mt-6">SURVIVE.</span>
                    </motion.h1>
                    <div className="mt-10 pt-8 border-t border-red-500/30 text-center">
                        <p className="text-xl md:text-2xl font-bold text-red-500 tracking-widest uppercase animate-pulse">
                            Warning: System Overridden
                        </p>
                        <p className="text-gray-400 mt-4 font-lato text-sm md:text-base max-w-lg mx-auto">
                            Access to the dashboard, shop, and inventory has been completely restricted until penalty conditions are cleared.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
