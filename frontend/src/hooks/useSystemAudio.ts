"use client";

import { useCallback, useRef } from "react";

export const useSystemAudio = () => {
    // Keep a persistent reference to the audio context
    const audioCtxRef = useRef<AudioContext | null>(null);

    const getAudioContext = () => {
        if (typeof window === "undefined") return null;
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioCtxRef.current = new AudioContextClass();
            }
        }
        if (audioCtxRef.current?.state === "suspended") {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    };

    const playClick = useCallback(() => {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // High-tech short UI beep
            osc.type = "sine";
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error("System Audio Error: playClick", e);
        }
    }, []);

    const playLevelUp = useCallback(() => {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            // Triumphant rising arpeggio (A Major)
            const frequencies = [440, 554.37, 659.25, 880];

            frequencies.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const startTime = ctx.currentTime + i * 0.1;

                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.6);
            });
        } catch (e) {
            console.error("System Audio Error: playLevelUp", e);
        }
    }, []);

    const playError = useCallback(() => {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Discordant buzz
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

            // Add simple distortion
            const distortion = ctx.createWaveShaper();
            distortion.curve = makeDistortionCurve(400);

            function makeDistortionCurve(amount: number) {
                const k = typeof amount === 'number' ? amount : 50;
                const n_samples = 44100;
                const curve = new Float32Array(n_samples);
                const deg = Math.PI / 180;
                for (let i = 0; i < n_samples; ++i) {
                    const x = i * 2 / n_samples - 1;
                    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
                }
                return curve;
            }

            osc.connect(distortion);
            distortion.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.error("System Audio Error: playError", e);
        }
    }, []);

    return { playClick, playLevelUp, playError };
};
