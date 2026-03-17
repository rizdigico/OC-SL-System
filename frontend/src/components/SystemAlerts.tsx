"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSovereign } from "@/context/SovereignContext";
import type { SovereignAlert } from "@/app/api/sovereign/route";

// ── Color map ────────────────────────────────────────────────────────────────

const COLORS: Record<SovereignAlert['type'], { border: string; glow: string; label: string }> = {
    info:    { border: '#1e44ff', glow: 'rgba(30,68,255,0.6)',  label: 'SYSTEM MESSAGE' },
    warning: { border: '#cc2222', glow: 'rgba(200,34,34,0.6)',  label: 'WARNING'        },
    success: { border: '#22bb66', glow: 'rgba(34,187,102,0.6)', label: 'QUEST COMPLETE' },
};

// ── AlertCard ────────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: SovereignAlert }) {
    const c = COLORS[alert.type];
    const ts = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -16,  scale: 0.94 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{
                position:   'relative',
                width:      '100%',
                background: 'rgba(0,3,22,0.96)',
                backgroundImage: `repeating-linear-gradient(
                    135deg,
                    transparent,
                    transparent 8px,
                    rgba(255,255,255,0.012) 8px,
                    rgba(255,255,255,0.012) 9px
                )`,
                border:    `1px solid ${c.border}`,
                boxShadow: `0 0 18px ${c.glow}, inset 0 0 24px rgba(0,0,0,0.6)`,
                overflow:  'hidden',
                pointerEvents: 'none',
            }}
        >
            {/* Corner brackets */}
            <span style={{ position:'absolute', top:3,    left:3,    width:8, height:8, borderTop:`2px solid ${c.border}`, borderLeft:`2px solid ${c.border}` }} />
            <span style={{ position:'absolute', top:3,    right:3,   width:8, height:8, borderTop:`2px solid ${c.border}`, borderRight:`2px solid ${c.border}` }} />
            <span style={{ position:'absolute', bottom:3, left:3,    width:8, height:8, borderBottom:`2px solid ${c.border}`, borderLeft:`2px solid ${c.border}` }} />
            <span style={{ position:'absolute', bottom:3, right:3,   width:8, height:8, borderBottom:`2px solid ${c.border}`, borderRight:`2px solid ${c.border}` }} />

            {/* Scanning beam */}
            <motion.div
                animate={{ y: ["-10%", "110%"] }}
                transition={{ duration: 1.8, ease: "linear", repeat: Infinity, repeatDelay: 2 }}
                style={{
                    position:  'absolute',
                    left:      0,
                    right:     0,
                    height:    '30%',
                    background: `linear-gradient(180deg, transparent 0%, ${c.glow} 50%, transparent 100%)`,
                    opacity:   0.15,
                    pointerEvents: 'none',
                }}
            />

            {/* Header */}
            <div style={{
                display:       'flex',
                justifyContent:'space-between',
                alignItems:    'center',
                padding:       '6px 14px',
                borderBottom:  `1px solid ${c.border}40`,
                background:    `${c.glow.replace('0.6','0.12')}`,
            }}>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', color: c.border, textTransform: 'uppercase' }}>
                    {c.label}
                </span>
                <span style={{ fontSize: 9, color: '#5577aa', letterSpacing: '0.1em' }}>{ts}</span>
            </div>

            {/* Body */}
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#c8deff', lineHeight: 1.5, letterSpacing: '0.04em' }}>
                {alert.message}
            </div>
        </motion.div>
    );
}

// ── SystemAlerts ─────────────────────────────────────────────────────────────

export function SystemAlerts() {
    const { sovereign } = useSovereign();
    // seenRef: IDs we've already scheduled a dismiss timer for (prevents duplicates across polls)
    // dismissedRef: IDs whose 5s timer has fired (hides them from render)
    const seenRef      = useRef<Set<string>>(new Set());
    const dismissedRef = useRef<Set<string>>(new Set());
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    useEffect(() => {
        if (!sovereign) return;
        sovereign.alerts.forEach(alert => {
            if (seenRef.current.has(alert.id)) return;
            seenRef.current.add(alert.id);
            setTimeout(() => {
                dismissedRef.current.add(alert.id);
                forceUpdate();
            }, 5000);
        });
    }, [sovereign?.alerts]);

    const visible = (sovereign?.alerts ?? []).filter(a => !dismissedRef.current.has(a.id));
    if (visible.length === 0) return null;

    return (
        <div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center pointer-events-none"
            style={{ width: "min(480px, 90vw)" }}
        >
            <AnimatePresence mode="popLayout">
                {visible.map(alert => <AlertCard key={alert.id} alert={alert} />)}
            </AnimatePresence>
        </div>
    );
}
