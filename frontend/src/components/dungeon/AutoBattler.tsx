"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap } from "lucide-react";
import type { StoryArc } from "@/lib/StorylineEngine";
import { SPRITES, MOB_NAME_MAP } from "@/lib/SpriteIndex";
import { ShadowExtraction } from "@/components/dungeon/ShadowExtraction";

// ── Props ─────────────────────────────────────────────────────────────────────

interface AutoBattlerProps {
    progress: number;
    arcData:  StoryArc;
}

type Phase = "normal" | "boss" | "cleared";

// ── Combat logs ───────────────────────────────────────────────────────────────

const NORMAL_LOGS = [
    "Shadow Army advancing...",
    "Agent on target...",
    "Deploying sub-routines...",
    "Sync established...",
    "Processing automation...",
    "Dealing damage...",
    "Gathering intel...",
];

const BOSS_LOGS = [
    "⚠ Boss resistance detected!",
    "Unleashing full power!",
    "All shadows deployed!",
    "Critical strike incoming!",
    "Boss HP critical...",
    "ARISE!",
];

// ── CSS Pixel Sprite ──────────────────────────────────────────────────────────
// Renders a stylised humanoid silhouette as fallback when no GIF is available.

type SpriteVariant =
    | "jinwoo-cmd"
    | "jinwoo-atk"
    | "igris"
    | "beru"
    | "knight"
    | "mob"
    | "boss-mob";

interface SpriteCss {
    headColor:   string;
    bodyColor:   string;
    legColor:    string;
    weaponColor: string;
    glow:        string;
    /** body width as fraction of total width */
    bodyRatio:   number;
    cape?:       boolean;
    /** forward-lean for attacking variants */
    lean?:       boolean;
}

const SPRITE_CSS: Record<SpriteVariant, SpriteCss> = {
    "jinwoo-cmd": { headColor: "#a5b4fc", bodyColor: "#1e1b4b", legColor: "#312e81", weaponColor: "#818cf8", glow: "#818cf8", bodyRatio: 0.65, cape: true },
    "jinwoo-atk": { headColor: "#e879f9", bodyColor: "#2e1065", legColor: "#4c1d95", weaponColor: "#f0abfc", glow: "#d946ef", bodyRatio: 0.65, cape: true, lean: true },
    "igris":      { headColor: "#93c5fd", bodyColor: "#0f172a", legColor: "#1e3a5f", weaponColor: "#60a5fa", glow: "#3b82f6", bodyRatio: 0.75 },
    "beru":       { headColor: "#86efac", bodyColor: "#052e16", legColor: "#14532d", weaponColor: "#4ade80", glow: "#22c55e", bodyRatio: 0.80 },
    "knight":     { headColor: "#94a3b8", bodyColor: "#1e293b", legColor: "#0f172a", weaponColor: "#cbd5e1", glow: "#64748b", bodyRatio: 0.60 },
    "mob":        { headColor: "#6b7280", bodyColor: "#1c1917", legColor: "#0c0a09", weaponColor: "#9ca3af", glow: "#4b5563", bodyRatio: 0.55 },
    "boss-mob":   { headColor: "#fca5a5", bodyColor: "#450a0a", legColor: "#7f1d1d", weaponColor: "#f87171", glow: "#ef4444", bodyRatio: 0.85 },
};

function PixelSprite({
    variant,
    w = 32,
    h = 48,
    flipX = false,
    src,
}: {
    variant: SpriteVariant;
    w?: number;
    h?: number;
    flipX?: boolean;
    src?: string;
}) {
    const [imgFailed, setImgFailed] = useState(false);

    if (src && !imgFailed) {
        return (
            <img
                src={src}
                width={w}
                height={h}
                alt={variant}
                style={{
                    imageRendering: "pixelated",
                    objectFit: "contain",
                    transform: flipX ? "scaleX(-1)" : undefined,
                }}
                onError={() => setImgFailed(true)}
            />
        );
    }

    const css      = SPRITE_CSS[variant];
    const headSize = w * 0.5;
    const bodyW    = w * css.bodyRatio;
    const bodyH    = h * 0.34;
    const legH     = h * 0.24;
    const weaponH  = h * 0.52;
    const flipStyle: React.CSSProperties = flipX ? { transform: "scaleX(-1)" } : {};

    return (
        <div style={{ width: w, height: h, position: "relative", ...flipStyle }}>
            {/* Cape behind body */}
            {css.cape && (
                <div style={{
                    position:     "absolute",
                    top:          headSize + 2,
                    left:         -4,
                    width:        8,
                    height:       bodyH + legH,
                    borderRadius: "0 0 4px 4px",
                    background:   css.bodyColor,
                    border:       `1px solid ${css.glow}20`,
                }} />
            )}
            {/* Head */}
            <div style={{
                position:     "absolute",
                top:          0,
                left:         (w - headSize) / 2,
                width:        headSize,
                height:       headSize,
                borderRadius: "50%",
                background:   css.headColor,
                boxShadow:    `0 0 6px ${css.glow}99`,
            }} />
            {/* Body */}
            <div style={{
                position:     "absolute",
                top:          headSize + 2,
                left:         (w - bodyW) / 2,
                width:        bodyW,
                height:       bodyH,
                borderRadius: 3,
                background:   css.bodyColor,
                border:       `1px solid ${css.glow}35`,
                boxShadow:    `0 0 5px ${css.glow}25`,
                transform:    css.lean ? "skewX(-8deg)" : undefined,
            }} />
            {/* Legs */}
            {[0, 1].map(i => (
                <div key={i} style={{
                    position:     "absolute",
                    top:          headSize + bodyH + 6,
                    left:         (w - bodyW * 0.9) / 2 + i * (bodyW * 0.48),
                    width:        bodyW * 0.42,
                    height:       legH,
                    borderRadius: "0 0 3px 3px",
                    background:   css.legColor,
                }} />
            ))}
            {/* Weapon */}
            <div style={{
                position:        "absolute",
                top:             headSize,
                right:           0,
                width:           3,
                height:          weaponH,
                borderRadius:    2,
                background:      `linear-gradient(180deg, ${css.weaponColor}, ${css.weaponColor}40)`,
                boxShadow:       `0 0 5px ${css.weaponColor}90`,
                transform:       css.lean ? "rotate(-35deg) translateY(-10px)" : "none",
                transformOrigin: "top center",
            }} />
        </div>
    );
}

// ── Idle bounce wrapper ───────────────────────────────────────────────────────

function Idle({
    children,
    speed   = 1.6,
    amount  = 3,
    delay   = 0,
    enabled = true,
}: {
    children: React.ReactNode;
    speed?:   number;
    amount?:  number;
    delay?:   number;
    enabled?: boolean;
}) {
    return (
        <motion.div
            animate={enabled ? { y: [0, -amount, 0] } : {}}
            transition={{ duration: speed, repeat: Infinity, ease: "easeInOut", delay }}
        >
            {children}
        </motion.div>
    );
}

// ── HP bar ────────────────────────────────────────────────────────────────────

function HPBar({ pct, color, width }: { pct: number; color: string; width: number }) {
    return (
        <div className="rounded-full bg-black/60 overflow-hidden mt-0.5" style={{ width, height: 3 }}>
            <motion.div
                className="h-full rounded-full"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ background: `linear-gradient(90deg, ${color}50, ${color})`, boxShadow: `0 0 4px ${color}` }}
            />
        </div>
    );
}

// ── Name tag ──────────────────────────────────────────────────────────────────

function Tag({ name, color, xs }: { name: string; color: string; xs?: boolean }) {
    return (
        <span
            className={`${xs ? "text-[6px]" : "text-[7px]"} font-black tracking-widest uppercase leading-none mt-0.5 text-center`}
            style={{ color, textShadow: `0 0 6px ${color}70` }}
        >
            {name}
        </span>
    );
}

// ── Battle flash (ambient clash glow) ────────────────────────────────────────

function ClashGlow({ color, active }: { color: string; active: boolean }) {
    if (!active) return null;
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.15, 0.55, 0.15] }}
            transition={{ duration: 0.45, repeat: Infinity, repeatDelay: 0.35, ease: "easeInOut" }}
            style={{ background: `radial-gradient(ellipse at center, ${color}60 0%, transparent 75%)` }}
        />
    );
}

// ── Impact sparks (deterministic positions) ───────────────────────────────────

const SPARK_OFFSETS = [
    { x1: -14, y1: -4,  x2: -28, y2: -18 },
    { x1:  10, y1: -8,  x2:  22, y2: -22 },
    { x1:  -4, y1:  4,  x2:  -6, y2: -16 },
    { x1:  16, y1:  2,  x2:  30, y2: -12 },
];

function Sparks({ color, active }: { color: string; active: boolean }) {
    if (!active) return null;
    return (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
            {SPARK_OFFSETS.map((s, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{ width: 4, height: 4, background: color, boxShadow: `0 0 5px ${color}`, left: "50%", top: "50%" }}
                    animate={{ x: [s.x1, s.x2], y: [s.y1, s.y2], opacity: [1, 0], scale: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: i * 0.18, ease: "easeOut" }}
                />
            ))}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AutoBattler({ progress, arcData }: AutoBattlerProps) {
    const phase: Phase     = progress >= 100 ? "cleared" : progress >= 80 ? "boss" : "normal";
    const isBoss           = phase === "boss";
    const isCleared        = phase === "cleared";

    const [showExtraction, setShowExtraction] = useState(false);
    const [logIdx,         setLogIdx]         = useState(0);

    // Pick which mob to show (second mob at 40+)
    const mobIdx       = arcData.mobs.length > 1 && progress >= 40 ? 1 : 0;
    const mobName      = arcData.mobs[mobIdx] ?? arcData.mobs[0];
    const mobKey       = MOB_NAME_MAP[mobName]      ?? "mob";
    const bossKey      = MOB_NAME_MAP[arcData.boss] ?? "boss-mob";

    // HP values
    const enemyHp = isBoss
        ? Math.max(0, Math.round((1 - (progress - 80) / 20) * 100))
        : Math.max(0, Math.round((1 - (progress % 40) / 40) * 100));

    // Combat log cycling
    const logs = isBoss ? BOSS_LOGS : NORMAL_LOGS;
    useEffect(() => {
        if (isCleared) return;
        const t = setInterval(() => setLogIdx(i => (i + 1) % logs.length), 1100);
        return () => clearInterval(t);
    }, [isCleared, logs.length]);
    useEffect(() => { setLogIdx(0); }, [isBoss]);
    useEffect(() => { if (!isCleared) setShowExtraction(false); }, [isCleared]);

    // Accent theming
    const accent     = isCleared ? "#ca8a04" : isBoss ? "#ef4444" : "#3b82f6";
    const progressBg = isCleared
        ? "linear-gradient(90deg, #92400e, #fde047)"
        : isBoss
        ? "linear-gradient(90deg, #7f1d1d, #ef4444)"
        : "linear-gradient(90deg, #1d4ed8, #60a5fa)";

    // Short boss name (last 1-2 words) for label under sprite
    const bossShortName = arcData.boss.split(" ").slice(-2).join(" ").toUpperCase();
    const mobShortName  = mobName.split(" ").slice(-1)[0].toUpperCase();

    return (
        <>
        <div
            className="relative rounded-xl overflow-hidden border transition-colors duration-500"
            style={{
                background:  "radial-gradient(ellipse at 25% 60%, rgba(30,27,81,0.45) 0%, rgba(7,9,15,0.97) 100%)",
                borderColor: `${accent}50`,
                boxShadow:   `0 0 28px ${accent}18, inset 0 0 60px rgba(0,0,0,0.5)`,
            }}
        >
            {/* ── Progress bar ─────────────────────────────────────────────── */}
            <div className="h-1 w-full bg-zinc-900/80">
                <motion.div
                    className="h-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ background: progressBg, boxShadow: `0 0 8px ${accent}` }}
                />
            </div>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div
                className="flex items-center justify-between px-4 py-1.5 border-b"
                style={{ borderColor: `${accent}20` }}
            >
                <div className="flex items-center gap-2">
                    {isBoss && (
                        <motion.span
                            animate={{ opacity: [1, 0.2, 1] }}
                            transition={{ duration: 0.7, repeat: Infinity }}
                            className="text-[9px] text-red-500"
                        >⚠</motion.span>
                    )}
                    <span
                        className="text-[9px] font-black tracking-[0.3em] uppercase"
                        style={{ color: accent }}
                    >
                        {isCleared
                            ? "DUNGEON CLEARED"
                            : isBoss
                            ? `BOSS: ${arcData.boss.toUpperCase()}`
                            : arcData.arc.toUpperCase()}
                    </span>
                </div>
                <span className="text-[9px] font-black tabular-nums" style={{ color: accent }}>
                    {progress}%
                </span>
            </div>

            {/* ── Battlefield ──────────────────────────────────────────────── */}
            <div className="relative overflow-hidden" style={{ height: 190 }}>

                {/* Ground line */}
                <div
                    className="absolute bottom-9 left-0 right-0 h-px opacity-30"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                />
                {/* Ground shadow */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-10"
                    style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)" }}
                />

                {/* ── BOSS WARNING banner ──────────────────────────────────── */}
                <AnimatePresence>
                    {isBoss && (
                        <motion.div
                            initial={{ y: -28, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -28, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute top-0 inset-x-0 flex items-center justify-center py-1 z-20"
                            style={{
                                background:   "rgba(239,68,68,0.13)",
                                borderBottom: "1px solid rgba(239,68,68,0.35)",
                            }}
                        >
                            <motion.span
                                animate={{ opacity: [1, 0.25, 1] }}
                                transition={{ duration: 0.65, repeat: Infinity }}
                                className="text-[8px] font-black tracking-[0.4em] uppercase text-red-500"
                            >
                                ⚠ WARNING — BOSS ENCOUNTER ⚠
                            </motion.span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ════════════════════════════════════════════════════════════
                    FRIENDLY SIDE
                ════════════════════════════════════════════════════════════ */}

                {/* ── BACK ROW: SOVEREIGN ──────────────────────────────────── */}
                <AnimatePresence>
                    {!isCleared && (
                        <motion.div
                            className="absolute flex flex-col items-center"
                            style={{ bottom: 36 }}
                            /* Moves from back (3%) → front-clash zone (42%) in Phase 2 */
                            animate={{ left: isBoss ? "42%" : "3%" }}
                            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Idle speed={1.9} amount={3} enabled={!isCleared}>
                                <motion.div
                                    animate={isBoss ? {
                                        filter: [
                                            "drop-shadow(0 0 4px #d946ef)",
                                            "drop-shadow(0 0 14px #d946ef)",
                                            "drop-shadow(0 0 4px #d946ef)",
                                        ],
                                    } : { filter: "drop-shadow(0 0 4px #818cf8)" }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    <PixelSprite
                                        variant={isBoss ? "jinwoo-atk" : "jinwoo-cmd"}
                                        w={38}
                                        h={58}
                                        src={isBoss
                                            ? SPRITES.PLAYER.jinwoo_attacking.src
                                            : SPRITES.PLAYER.jinwoo_commanding.src}
                                    />
                                </motion.div>
                            </Idle>
                            <Tag name="SOVEREIGN" color={isBoss ? "#d946ef" : "#818cf8"} />
                            <HPBar pct={100} color={isBoss ? "#d946ef" : "#818cf8"} width={38} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── MID ROW: IGRIS + BERU ────────────────────────────────── */}
                {[
                    { variant: "igris" as const, name: "IGRIS", color: "#60a5fa", src: SPRITES.HIGH_TIER.igris.src, left: "19%", bottom: 44 },
                    { variant: "beru"  as const, name: "BERU",  color: "#22c55e", src: SPRITES.HIGH_TIER.beru.src,  left: "27%", bottom: 26 },
                ].map((a, i) => (
                    <div key={a.name} className="absolute flex flex-col items-center" style={{ left: a.left, bottom: a.bottom }}>
                        <Idle speed={1.4 + i * 0.3} amount={2.5} delay={i * 0.4} enabled={!isCleared}>
                            <PixelSprite variant={a.variant} w={28} h={44} src={a.src} />
                        </Idle>
                        <Tag name={a.name} color={a.color} xs />
                        <HPBar pct={100} color={a.color} width={28} />
                    </div>
                ))}

                {/* ── FRONT ROW: 4 Sub-agent knights ───────────────────────── */}
                {[
                    { left: "36%", bottom: 24 },
                    { left: "41%", bottom: 34 },
                    { left: "46%", bottom: 22 },
                    { left: "51%", bottom: 32 },
                ].map((pos, i) => (
                    <div key={i} className="absolute flex flex-col items-center" style={{ left: pos.left, bottom: pos.bottom }}>
                        <Idle speed={1.2 + i * 0.2} amount={2} delay={i * 0.25} enabled={!isCleared}>
                            <PixelSprite variant="knight" w={20} h={32} src={SPRITES.SUB_AGENTS.knight.src} />
                        </Idle>
                        <HPBar pct={100} color="#64748b" width={20} />
                    </div>
                ))}

                {/* ════════════════════════════════════════════════════════════
                    CLASH ZONE — battle flash + sparks + VS label
                ════════════════════════════════════════════════════════════ */}
                <div
                    className="absolute"
                    style={{ left: "57%", width: "8%", top: 0, bottom: 0 }}
                >
                    <ClashGlow color={accent} active={!isCleared} />
                    <Sparks    color={accent} active={!isCleared} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                            animate={{ opacity: isCleared ? 0 : [0.25, 0.75, 0.25] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                            className="text-[7px] font-black tracking-widest"
                            style={{ color: accent, writingMode: "vertical-rl" }}
                        >VS</motion.span>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    ENEMY SIDE
                ════════════════════════════════════════════════════════════ */}
                <div className="absolute" style={{ right: "6%", bottom: 36 }}>
                    <AnimatePresence mode="wait">

                        {/* Phase 1 — two mobs */}
                        {!isBoss && !isCleared && (
                            <motion.div
                                key="mobs"
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 24 }}
                                transition={{ duration: 0.3 }}
                                className="flex gap-3 items-end"
                            >
                                {[0, 1].map(i => (
                                    <div key={i} className="flex flex-col items-center" style={{ marginBottom: i === 1 ? 10 : 0 }}>
                                        <Idle speed={1.6 + i * 0.4} amount={2.5} delay={i * 0.35}>
                                            <motion.div
                                                animate={{ filter: [`drop-shadow(0 0 3px ${SPRITES.ENEMIES[mobKey].color})`, `drop-shadow(0 0 8px ${SPRITES.ENEMIES[mobKey].color})`, `drop-shadow(0 0 3px ${SPRITES.ENEMIES[mobKey].color})`] }}
                                                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.5 }}
                                            >
                                                <PixelSprite
                                                    variant="mob"
                                                    w={26}
                                                    h={40}
                                                    flipX
                                                    src={SPRITES.ENEMIES[mobKey].src}
                                                />
                                            </motion.div>
                                        </Idle>
                                        <Tag name={mobShortName} color={SPRITES.ENEMIES[mobKey].color} xs />
                                        <HPBar
                                            pct={i === 0 ? enemyHp : Math.max(0, enemyHp - 12)}
                                            color={SPRITES.ENEMIES[mobKey].color}
                                            width={26}
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* Phase 2 — boss */}
                        {(isBoss || isCleared) && (
                            <motion.div
                                key="boss"
                                initial={{ opacity: 0, scale: 0.4, x: 30 }}
                                animate={{ opacity: isCleared ? 0.25 : 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5, x: 30 }}
                                transition={{ duration: 0.45, ease: "backOut" }}
                                className="flex flex-col items-center"
                            >
                                <Idle speed={2.2} amount={2} enabled={!isCleared}>
                                    <motion.div
                                        animate={!isCleared ? {
                                            filter: [
                                                `drop-shadow(0 0 6px ${SPRITES.ENEMIES[bossKey].color})`,
                                                `drop-shadow(0 0 18px ${SPRITES.ENEMIES[bossKey].color})`,
                                                `drop-shadow(0 0 6px ${SPRITES.ENEMIES[bossKey].color})`,
                                            ],
                                        } : {}}
                                        transition={{ duration: 1.1, repeat: Infinity }}
                                    >
                                        <PixelSprite
                                            variant="boss-mob"
                                            w={52}
                                            h={78}
                                            flipX
                                            src={SPRITES.ENEMIES[bossKey].src}
                                        />
                                    </motion.div>
                                </Idle>
                                <Tag name={bossShortName} color={SPRITES.ENEMIES[bossKey].color} />
                                <HPBar
                                    pct={isCleared ? 0 : enemyHp}
                                    color={SPRITES.ENEMIES[bossKey].color}
                                    width={52}
                                />
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* ── Combat log ticker ─────────────────────────────────────── */}
                <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={logIdx}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="text-[7px] font-bold tracking-widest uppercase"
                            style={{ color: `${accent}80` }}
                        >
                            {isCleared ? "" : logs[logIdx]}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* ── DUNGEON CLEARED overlay ───────────────────────────────── */}
                <AnimatePresence>
                    {isCleared && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-30"
                            style={{ background: "rgba(5,7,15,0.9)", backdropFilter: "blur(6px)" }}
                        >
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 220, damping: 14 }}
                                className="flex flex-col items-center gap-1.5"
                            >
                                <Trophy
                                    className="w-9 h-9 text-yellow-400"
                                    style={{ filter: "drop-shadow(0 0 14px rgba(234,179,8,0.9))" }}
                                />
                                <p
                                    className="text-base font-black tracking-[0.3em] uppercase"
                                    style={{ color: "#fde047", textShadow: "0 0 20px rgba(234,179,8,0.8)" }}
                                >
                                    Dungeon Cleared
                                </p>
                                <p className="text-[9px] font-bold tracking-widest text-yellow-500/50 uppercase">
                                    All Enemies Eliminated
                                </p>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowExtraction(true)}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl border font-black text-[9px] tracking-[0.3em] uppercase"
                                style={{
                                    color:       "#b200ff",
                                    borderColor: "rgba(178,0,255,0.5)",
                                    background:  "rgba(178,0,255,0.07)",
                                    boxShadow:   "0 0 20px rgba(178,0,255,0.2)",
                                    textShadow:  "0 0 10px rgba(178,0,255,0.6)",
                                }}
                            >
                                <Zap className="w-3 h-3" style={{ filter: "drop-shadow(0 0 4px rgba(178,0,255,0.9))" }} />
                                Shadow Extraction
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>{/* /battlefield */}
        </div>

        {/* Shadow Extraction modal */}
        <AnimatePresence>
            {showExtraction && (
                <ShadowExtraction
                    enemy={arcData.boss}
                    isBoss
                    onComplete={() => setShowExtraction(false)}
                />
            )}
        </AnimatePresence>
        </>
    );
}
