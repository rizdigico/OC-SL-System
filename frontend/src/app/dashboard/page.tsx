"use client";

import React, { useState } from "react";
import { SovereignProvider, useSovereign } from "@/context/SovereignContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Eye, Activity, Shield, Sparkles, ShoppingCart, Package, Sword, Settings, Zap, Skull, Terminal, BookOpen } from "lucide-react";
import { getCurrentArc } from "@/lib/StorylineEngine";
import { MobList } from "@/components/dungeon/MobComponents";
import { StatusWindow } from "@/components/StatusWindow";
import { SystemShop } from "@/components/economy/SystemShop";
import { PlayerInventory } from "@/components/economy/PlayerInventory";
import VerificationModal from "@/components/dungeon/VerificationModal";
import { SkillMatrix } from "@/components/SkillMatrix";
import { BossRoom } from "@/components/BossRoom";
import { DungeonSystem } from "@/components/dungeon/DungeonSystem";
import { CombatArena } from "@/components/CombatArena";
import { JobChangeDungeon } from "@/components/JobChangeDungeon";
import { DemonCastle } from "@/components/DemonCastle";
import { DevPanel } from "@/components/DevPanel";
import { MonarchDomain } from "@/components/MonarchDomain";
import { ArchitectsDemiseDungeon } from "@/components/ArchitectsDemiseDungeon";
import { ThroneRoom } from "@/components/ThroneRoom";

// ── Error Boundary ─────────────────────────────────────────────────────────────

interface EBState { hasError: boolean; message: string }

class DashboardErrorBoundary extends React.Component<
    { children: React.ReactNode },
    EBState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, message: "" };
    }
    static getDerivedStateFromError(err: Error): EBState {
        return { hasError: true, message: err.message };
    }
    render() {
        if (!this.state.hasError) return this.props.children;
        return (
            <div className="min-h-screen bg-[#00030e] flex flex-col items-center justify-center gap-4 p-8">
                <div className="sl-panel p-8 max-w-lg w-full">
                    <span className="sl-corner-tl"/><span className="sl-corner-tr"/>
                    <span className="sl-corner-bl"/><span className="sl-corner-br"/>
                    <div className="sl-panel-header mb-6">
                        <span className="sl-notif-icon">!</span>
                        <span>SYSTEM ERROR</span>
                    </div>
                    <p className="sl-text-danger font-bold tracking-widest uppercase text-sm mb-2">{this.state.message}</p>
                    <button onClick={() => window.location.reload()} className="sl-btn sl-btn-red w-full mt-4">
                        RELOAD SYSTEM
                    </button>
                </div>
            </div>
        );
    }
}


// ── Mock data (UI-building phase — no backend required) ───────────────────────
const MOCK_USER = {
    _id:                    "mock-user-001",
    displayName:            "SOVEREIGN",
    rank:                   "C",
    title:                  "Wolf Slayer",
    job:                    "None",
    jobChangeLocked:        false,
    jobChangeUnlocked:      false,
    architectsDemiseLocked: false,
    isTranscended:          false,
    equippedTitle:          null,
    prestigeMultiplier:     1,
    demonCastleFloor:       0,
    activeRaid:             null,
    unlockedShadows:        [] as string[],
    equippedShadows:        null as { agentId: string; shadowName: string } | null,
    inventory:              [] as any[],
    equipped:               {} as Record<string, any>,
    stats: {
        level:        17,
        exp:          4200,
        strength:     40,
        agility:      35,
        vitality:     40,
        sense:        30,
        intelligence: 60,
        statPoints:   5,
        gold:         14500,
        mana:         320,
        fatigue:      12,
    },
};

function buildUserFromAssessment(r: any) {
    return {
        ...MOCK_USER,
        inventory: [],
        equipped:  {},
        rank:  r.rank,
        title: r.jobClass,
        job:   r.jobClass,
        stats: {
            level:        r.level,
            exp:          0,
            strength:     r.stats.strength,
            agility:      r.stats.agility,
            vitality:     r.stats.vitality,
            sense:        r.stats.sense,
            intelligence: r.stats.intelligence,
            statPoints:   r.statPoints,
            gold:         1000,
            mana:         50 + r.stats.intelligence * 5,
            fatigue:      0,
        },
    };
}

function DashboardContent() {
    const { sovereign, refreshSovereign } = useSovereign();
    const [user, setUser] = useState<any>(() => {
        if (typeof window === "undefined") return MOCK_USER;
        try {
            const raw = localStorage.getItem("assessment_result");
            if (raw) return buildUserFromAssessment(JSON.parse(raw));
        } catch (_) {}
        return MOCK_USER;
    });
    const [quests, setQuests] = useState<any[]>([]);
    const [isLoading] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [isSkillMatrixOpen, setIsSkillMatrixOpen] = useState(false);
    const [isBossRoomOpen, setIsBossRoomOpen] = useState(false);
    const [isCombatArenaOpen, setIsCombatArenaOpen] = useState(false);
    const [isDemonCastleOpen, setIsDemonCastleOpen] = useState(false);
    const [selectedBoss, setSelectedBoss] = useState<any>(null);
    const [activeView, setActiveView] = useState<'quests' | 'dungeon' | 'command'>('command');
    const [isPenaltyZone, setIsPenaltyZone] = useState(false);
    const router = useRouter();

    // TODO: restore these effects once backend is running.
    // fetchUserData  — GET /api/auth/me
    // checkPenaltyStatus — GET /api/users/me/penalty-status (30 s interval)

    const handleCompleteQuest = async (quest: any) => {
        const token = localStorage.getItem("system_token");
        if (!token) return;
        try {
            for (let i = 0; i < (quest.objectives?.length || 0); i++) {
                if (!quest.objectives[i].completed) {
                    await fetch(`http://localhost:5000/api/quests/${quest._id}/progress`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ objectiveIndex: i, increment: quest.objectives[i].target })
                    });
                }
            }
            const res = await fetch(`http://localhost:5000/api/quests/${quest._id}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
            });
            let data = await res.json();
            if (res.ok) {
                if (user?.activeRaid) {
                    await fetch("http://localhost:5000/api/raid/attack", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({})
                    });
                    const refreshRes = await fetch("http://localhost:5000/api/auth/me", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (refreshRes.ok) { data = await refreshRes.json(); setUser(data); }
                } else {
                    setUser((prev: any) => ({ ...prev, stats: data.stats, rank: data.rank }));
                }
                setQuests((prev) => prev.filter(q => q._id !== quest._id));
            } else {
                console.error("Failed to complete quest:", data);
            }
        } catch (error) {
            console.error("Error completing quest:", error);
        }
    };

    const handleEngageMob = (quest: any) => {
        setSelectedBoss({
            name:        quest.title,
            rank:        quest.difficulty || 'E',
            hp:          30,
            exp:         quest.rewards?.exp  || 50,
            gold:        quest.rewards?.gold || 20,
            description: quest.description,
            quest:       quest,
        });
        setIsCombatArenaOpen(true);
    };

    const handleEnterBoss = (quest: any) => {
        setSelectedBoss({
            name: quest.title,
            rank: quest.difficulty || 'S',
            hp: 100,
            description: quest.description,
            quest: quest
        });
        setIsBossRoomOpen(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#00030e]">
                <div className="text-[#11D2EF] font-caros tracking-[0.3em] animate-pulse text-sm uppercase">
                    LOADING SYSTEM DATA...
                </div>
            </div>
        );
    }

    if (!user) return null;

    if (user.jobChangeLocked) {
        return (
            <JobChangeDungeon
                user={user}
                onComplete={async () => {
                    const token = localStorage.getItem("system_token");
                    if (!token) return;
                    const res = await fetch("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) {
                        const refreshed = await res.json();
                        setUser(refreshed);
                        const qRes = await fetch("http://localhost:5000/api/quests", { headers: { Authorization: `Bearer ${token}` } });
                        if (qRes.ok) setQuests(await qRes.json());
                    }
                }}
            />
        );
    }

    const redGateQuest = quests.find((q) => q.isRedGate);

    if (redGateQuest) {
        return (
            <React.Fragment>
                <div className="min-h-screen w-full bg-[#00030e] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden font-lato">
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes redgate-pulse {
                            0% { background-color: rgba(220, 38, 38, 0.05); }
                            50% { background-color: rgba(220, 38, 38, 0.2); }
                            100% { background-color: rgba(220, 38, 38, 0.05); }
                        }
                    `}} />
                    <div className="absolute inset-0 z-0 pointer-events-none animate-[redgate-pulse_4s_infinite]" />
                    <div className="absolute inset-0 z-0 shadow-[inset_0_0_150px_rgba(220,38,38,0.5)] pointer-events-none" />
                    <div className="relative z-10 text-center space-y-8 max-w-2xl w-full">
                        <Shield className="w-24 h-24 text-red-600 mx-auto animate-pulse drop-shadow-[0_0_20px_rgba(220,38,38,1)]" />
                        <h1 className="text-5xl md:text-7xl font-caros font-black text-white uppercase tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
                            RED GATE <span className="text-red-500">DETECTED</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-red-400 font-bold uppercase tracking-widest bg-red-950/80 p-4 border border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                            Communication with the outside world is severed.
                        </p>
                        <div className="sl-panel p-8 text-left">
                            <span className="sl-corner-tl"/><span className="sl-corner-tr"/>
                            <span className="sl-corner-bl"/><span className="sl-corner-br"/>
                            <div className="sl-panel-header mb-6" style={{borderColor:'rgba(200,40,40,0.5)'}}>
                                <span className="sl-notif-icon" style={{borderColor:'rgba(255,80,80,0.8)'}}>!</span>
                                <span className="text-red-400">QUEST INFO</span>
                            </div>
                            <h2 className="text-2xl font-black text-white capitalize mb-2 font-caros tracking-wide">{redGateQuest.title}</h2>
                            <p className="sl-text-dim mb-6 text-sm leading-relaxed">{redGateQuest.description}</p>
                            <div className="space-y-3 mb-6">
                                {redGateQuest.objectives?.map((obj: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm uppercase tracking-wider font-bold bg-red-950/30 p-3 border border-red-900/50">
                                        <span className="text-gray-400">{obj.description}</span>
                                        <span className="sl-text-danger">{obj.progress} / {obj.target}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => handleCompleteQuest(redGateQuest)} className="sl-btn sl-btn-red w-full py-4 text-base">
                                SUBMIT PROOF TO ESCAPE
                            </button>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    if (user.architectsDemiseLocked) {
        return (
            <ArchitectsDemiseDungeon
                user={user}
                onComplete={async () => {
                    const token = localStorage.getItem("system_token");
                    if (!token) return;
                    const res = await fetch("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) setUser(await res.json());
                }}
            />
        );
    }

    const stats = user.stats || {
        level: 100, exp: 0, strength: 1, agility: 1, vitality: 1,
        sense: 1, intelligence: 1, statPoints: 0, gold: 0, mana: 0, fatigue: 0
    };
    user.stats = stats;

    const nextLevelExp  = sovereign?.maxExp ?? Math.floor(100 * Math.pow(user.stats.level ?? 1, 1.5));
    const expPercentage = sovereign
        ? Math.min(100, Math.max(0, (sovereign.exp / sovereign.maxExp) * 100))
        : Math.min(100, Math.max(0, ((user.stats.exp ?? 0) / nextLevelExp) * 100));
    const hpMax = sovereign?.maxHp ?? (100 + (user.stats.vitality ?? 1) * 20);
    const mpMax = 50 + (user.stats.intelligence ?? 1) * 10;

    return (
        <DashboardErrorBoundary>
        <React.Fragment>
            <StatusWindow isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} user={user} setUser={setUser} />
            <SystemShop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} user={user} setUser={setUser} />
            <PlayerInventory isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} user={user} setUser={setUser} />
            <VerificationModal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} />
            <SkillMatrix isOpen={isSkillMatrixOpen} onClose={() => setIsSkillMatrixOpen(false)} />
            <DemonCastle
                isOpen={isDemonCastleOpen}
                onClose={() => setIsDemonCastleOpen(false)}
                onFloorCleared={async () => {
                    const token = localStorage.getItem("system_token");
                    if (!token) return;
                    const res = await fetch("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) setUser(await res.json());
                }}
            />
            <BossRoom isOpen={isBossRoomOpen} onClose={() => setIsBossRoomOpen(false)} bossData={selectedBoss} onEngage={() => setIsCombatArenaOpen(true)} />
            <CombatArena isOpen={isCombatArenaOpen} onClose={() => setIsCombatArenaOpen(false)} mobData={selectedBoss} user={user} onWin={async () => {
                const token = localStorage.getItem("system_token");
                if (token) {
                    if (selectedBoss?.quest) await handleCompleteQuest(selectedBoss.quest);
                    const res = await fetch("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) setUser(await res.json());
                }
                setIsCombatArenaOpen(false);
            }} />

            <main className={`min-h-screen w-full bg-[#00030e] text-white p-4 md:p-6 overflow-x-hidden font-lato relative ${user.prestigeMultiplier > 1 ? 'border-4 border-red-600 shadow-[inset_0_0_50px_rgba(220,38,38,0.3)]' : ''}`}>

                {/* Background ambient light */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className={`absolute top-0 right-0 w-[55vw] h-[55vw] ${user.isTranscended ? 'bg-[#A480F2]/15' : 'bg-[#1e44ff]/08'} blur-[180px] opacity-35 rounded-full`} />
                    <div className="absolute bottom-1/4 left-0 w-[40vw] h-[40vw] bg-[#1e44ff]/06 blur-[140px] opacity-25 rounded-full" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10 space-y-5">

                    {/* ── RAID HP BAR ────────────────────────────────────────── */}
                    {user.activeRaid && user.activeRaid.bossName && (
                        <motion.div
                            initial={{ opacity: 0, y: -40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="sl-panel relative"
                            style={{borderColor:'rgba(200,40,40,0.7)', animationName:'none', boxShadow:'0 0 18px rgba(200,40,40,0.4), inset 0 0 30px rgba(80,10,10,0.3)'}}
                        >
                            <span className="sl-corner-tl" style={{borderColor:'rgba(255,80,80,0.9)'}}/>
                            <span className="sl-corner-tr" style={{borderColor:'rgba(255,80,80,0.9)'}}/>
                            <span className="sl-corner-bl" style={{borderColor:'rgba(255,80,80,0.9)'}}/>
                            <span className="sl-corner-br" style={{borderColor:'rgba(255,80,80,0.9)'}}/>
                            <div className="p-6 flex flex-col items-center max-w-4xl mx-auto text-center space-y-3">
                                <h1 className="text-3xl md:text-4xl font-caros font-black text-red-500 uppercase tracking-[0.3em] drop-shadow-[0_0_12px_rgba(220,38,38,0.8)]">
                                    {user.activeRaid.bossName} RAID
                                </h1>
                                <p className="text-red-400 font-bold uppercase tracking-widest text-xs flex gap-4">
                                    <span>{user.activeRaid.daysRemaining} DAYS REMAINING</span>
                                    <span>•</span>
                                    <span>PENALTY REGEN: {user.activeRaid.penaltyRegen} HP/DAY</span>
                                </p>
                                <div className="w-full h-7 bg-black/90 border border-red-900 relative overflow-hidden shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(0, (user.activeRaid.currentHp / user.activeRaid.maxHp) * 100)}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-900 to-red-500 shadow-[0_0_10px_rgba(220,38,38,0.9)]"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs tracking-widest">
                                        {user.activeRaid.currentHp.toLocaleString()} / {user.activeRaid.maxHp.toLocaleString()} HP
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── PLAYER HEADER ──────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="sl-panel"
                    >
                        <span className="sl-corner-tl"/><span className="sl-corner-tr"/>
                        <span className="sl-corner-bl"/><span className="sl-corner-br"/>

                        {/* Header bar */}
                        <div className="sl-panel-header">
                            <span className="sl-notif-icon">!</span>
                            <span>PLAYER STATUS</span>
                            <div className="ml-auto flex items-center gap-3">
                                <div className="text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/10 px-2 py-0.5 text-xs font-bold tracking-wider">
                                    {user.stats.gold} G
                                </div>
                                <button onClick={() => router.push('/settings')} className="text-[#7a9abf] hover:text-[#11D2EF] transition-colors">
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
                            {/* Avatar */}
                            <div className="w-16 h-16 border-2 border-[#1e44ff] shadow-[0_0_12px_rgba(30,68,255,0.6)] bg-[#00030e] flex items-center justify-center flex-shrink-0">
                                <span className="font-caros font-black text-2xl text-[#11D2EF] uppercase">
                                    {user.displayName ? user.displayName[0] : "P"}
                                </span>
                            </div>

                            {/* Name / rank / title */}
                            <div className="flex-shrink-0">
                                <div className="flex items-baseline gap-3 mb-1">
                                    <h1 className="text-2xl font-caros font-black text-white tracking-wide">
                                        {user.displayName || "SUNG JIN-WOO"}
                                    </h1>
                                    <span className="sl-rank-badge">RANK {user.rank}</span>
                                </div>
                                <p className="text-xs tracking-[0.2em] font-semibold uppercase" style={{color: user.isTranscended ? '#A480F2' : '#11D2EF'}}>
                                    [{user.title || "Awakened"}]
                                </p>
                            </div>

                            {/* EXP bar */}
                            <div className="flex-1 w-full md:max-w-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`font-bold font-caros text-xs tracking-widest ${user.isTranscended ? 'text-[#A480F2]' : 'text-[#1e44ff]'}`}>
                                        LEVEL {sovereign?.level ?? user.stats.level}
                                    </span>
                                    <span className="text-[#7a9abf] font-caros text-xs">
                                        {sovereign?.exp ?? user.stats.exp} / {nextLevelExp} EXP
                                    </span>
                                </div>
                                <div className="sl-bar-track">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${expPercentage}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="sl-bar-fill-exp"
                                        style={user.isTranscended ? {background:'linear-gradient(90deg,#6a20c8,#A480F2)',boxShadow:'0 0 10px rgba(164,128,242,0.7)'} : {}}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── MAIN GRID ──────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                        {/* Left Column: STATUS */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="col-span-1 sl-panel"
                            style={user.isTranscended ? {borderColor:'rgba(164,128,242,0.65)'} : {}}
                        >
                            <span className="sl-corner-tl"/><span className="sl-corner-tr"/>
                            <span className="sl-corner-bl"/><span className="sl-corner-br"/>

                            {/* STATUS header */}
                            <div className="sl-panel-header" style={user.isTranscended ? {borderColor:'rgba(164,128,242,0.4)'} : {}}>
                                <span className="text-xs font-black tracking-[0.3em]">STATUS</span>
                            </div>

                            {/* Level / Job / Title row */}
                            <div className="flex items-center gap-4 p-4 border-b border-[rgba(30,68,200,0.2)]">
                                <div className="text-center flex-shrink-0">
                                    <div className="text-5xl font-black text-white font-caros leading-none">{sovereign?.level ?? user.stats.level}</div>
                                    <div className="text-[10px] text-[#7a9abf] tracking-[0.2em] uppercase mt-1">LEVEL</div>
                                </div>
                                <div className="flex-1 text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="sl-text-dim uppercase tracking-wider">JOB</span>
                                        <span className="text-white font-semibold">{user.job || "None"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="sl-text-dim uppercase tracking-wider">TITLE</span>
                                        <span className="text-white font-semibold">{sovereign?.title ?? user.title ?? "None"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="sl-text-dim uppercase tracking-wider">RANK</span>
                                        <span className="text-[#A480F2] font-bold">{user.rank}</span>
                                    </div>
                                </div>
                            </div>

                            {/* HP / MP / Fatigue bars */}
                            <div className="p-4 space-y-3 border-b border-[rgba(30,68,200,0.2)]">
                                <div className="flex items-center gap-2">
                                    <HeartIcon className="w-4 h-4 text-[#5599ff] flex-shrink-0" />
                                    <div className="sl-bar-track">
                                        <div className="sl-bar-fill-hp" style={{
                                            width: sovereign ? `${Math.min(100, (sovereign.hp / sovereign.maxHp) * 100)}%` : "100%"
                                        }} />
                                    </div>
                                    <span className="text-[10px] text-[#7a9abf] font-bold w-20 text-right tabular-nums">
                                        {sovereign?.hp ?? hpMax}/{hpMax}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-[#33bbff] flex-shrink-0" />
                                    <div className="sl-bar-track">
                                        <div className="sl-bar-fill-mp" style={{width: `${Math.min(100, ((user.stats.mana ?? 0) / mpMax) * 100)}%`}} />
                                    </div>
                                    <span className="text-[10px] text-[#7a9abf] font-bold w-20 text-right tabular-nums">
                                        {user.stats.mana ?? 0}/{mpMax}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="sl-text-dim uppercase tracking-wider">FATIGUE</span>
                                    <span className="text-white font-bold">{sovereign?.fatigue ?? user.stats.fatigue ?? 0}</span>
                                </div>
                            </div>

                            {/* Stat rows */}
                            <div className="divide-y divide-[rgba(30,68,200,0.12)]">
                                <SLStatRow icon={<Shield className="w-3.5 h-3.5"/>} label="STR" value={sovereign?.str ?? user.stats.strength} />
                                <SLStatRow icon={<Activity className="w-3.5 h-3.5"/>} label="AGI" value={sovereign?.agi ?? user.stats.agility} />
                                <SLStatRow icon={<HeartIcon className="w-3.5 h-3.5"/>} label="VIT" value={sovereign?.vit ?? user.stats.vitality} />
                                <SLStatRow icon={<Brain className="w-3.5 h-3.5"/>} label="INT" value={sovereign?.int ?? user.stats.intelligence} />
                                <SLStatRow icon={<Eye className="w-3.5 h-3.5"/>} label="PER" value={sovereign?.per ?? user.stats.sense} />
                            </div>

                            {/* Available points + actions */}
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center text-xs border-t border-[rgba(30,68,200,0.2)] pt-3">
                                    <span className="sl-text-dim uppercase tracking-wider">Available Ability Points</span>
                                    <span className={`font-black text-lg ${user.isTranscended ? 'text-[#A480F2]' : 'text-[#11D2EF]'}`}
                                          style={{textShadow: user.isTranscended ? '0 0 8px rgba(164,128,242,0.7)' : '0 0 8px rgba(17,210,239,0.7)'}}>
                                        {sovereign?.availablePoints ?? user.stats.statPoints}
                                    </span>
                                </div>
                                <button onClick={() => setIsStatusOpen(true)} className="sl-btn w-full flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    ALLOCATE STATS
                                </button>
                                <button onClick={() => setIsSkillMatrixOpen(true)} className="sl-btn sl-btn-purple w-full flex items-center justify-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    SKILL MATRIX
                                </button>

                                {/* Storyline Arc */}
                                {(() => {
                                    const arc = getCurrentArc(user.stats.level ?? 1);
                                    return (
                                        <div
                                            className="rounded-lg px-3 py-2.5 border space-y-1.5 mt-1"
                                            style={{
                                                background:  "rgba(30,68,200,0.04)",
                                                borderColor: "rgba(30,68,200,0.2)",
                                            }}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <BookOpen className="w-3 h-3 text-[#5588cc]/50" />
                                                <span className="text-[9px] font-black tracking-[0.3em] text-[#5588cc]/50 uppercase">
                                                    Storyline
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-[9px] sl-text-dim font-bold uppercase tracking-wider">Arc</span>
                                                <span className="text-[10px] font-black text-right leading-tight text-[#60a5fa]">
                                                    {arc.arc}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-[9px] sl-text-dim font-bold uppercase tracking-wider">Boss</span>
                                                <span className="text-[10px] font-black text-red-500/80 text-right leading-tight">
                                                    {arc.boss}
                                                </span>
                                            </div>
                                            {arc.unlocks && (
                                                <div className="flex justify-between items-center gap-2 pt-1 border-t border-[rgba(30,68,200,0.15)]">
                                                    <span className="text-[9px] sl-text-dim font-bold uppercase tracking-wider">Unlocks</span>
                                                    <span className="text-[9px] font-black text-[#A480F2]/70 tracking-wider">
                                                        {arc.unlocks}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>

                        {/* Right Column: Quest / Dungeon Area */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="col-span-1 md:col-span-2 space-y-4"
                        >
                            {/* Navigation tabs */}
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                                <NavTab
                                    active={activeView === 'quests'}
                                    onClick={() => setActiveView('quests')}
                                    icon={<Sword className="w-4 h-4" />}
                                    label="QUESTS"
                                    col="md:col-span-1"
                                />
                                <NavTab
                                    active={activeView === 'dungeon'}
                                    onClick={() => setActiveView('dungeon')}
                                    icon={<Skull className="w-4 h-4" />}
                                    label="DUNGEON"
                                    col="md:col-span-1"
                                    danger
                                />
                                <NavTab
                                    active={activeView === 'command'}
                                    onClick={() => setActiveView('command')}
                                    icon={<Terminal className="w-4 h-4" />}
                                    label="COMMAND"
                                    col="md:col-span-1"
                                />
                                <div className="relative group hidden md:block">
                                    <button
                                        onClick={() => !isPenaltyZone && setIsShopOpen(true)}
                                        className="sl-btn w-full flex items-center justify-center gap-2"
                                        style={isPenaltyZone ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                                    >
                                        <ShoppingCart className="w-4 h-4" />SHOP
                                    </button>
                                    {isPenaltyZone && (
                                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap px-2 py-1 rounded bg-zinc-900 border border-red-500/30 text-[9px] font-bold text-red-400 tracking-wider pointer-events-none z-50">
                                            🔒 Locked in Penalty Zone
                                        </div>
                                    )}
                                </div>
                                <div className="relative group hidden md:block">
                                    <button
                                        onClick={() => !isPenaltyZone && setIsInventoryOpen(true)}
                                        className="sl-btn w-full flex items-center justify-center gap-2"
                                        style={isPenaltyZone ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                                    >
                                        <Package className="w-4 h-4" />ITEMS
                                    </button>
                                    {isPenaltyZone && (
                                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap px-2 py-1 rounded bg-zinc-900 border border-red-500/30 text-[9px] font-bold text-red-400 tracking-wider pointer-events-none z-50">
                                            🔒 Locked in Penalty Zone
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsDemonCastleOpen(true)}
                                    className="sl-btn sl-btn-red col-span-2 md:col-span-1 flex items-center justify-center gap-2"
                                >
                                    <Skull className="w-4 h-4" />RAID
                                </button>
                            </div>

                            {/* Views that break out of the right-column sl-panel wrapper */}
                            {activeView === 'command' ? (
                                <ThroneRoom user={user} isPenaltyZone={isPenaltyZone} onClearPenalty={() => setIsPenaltyZone(false)} />
                            ) : activeView === 'dungeon' ? (
                                <DungeonSystem userLevel={user?.stats?.level ?? 1} />
                            ) : (
                                <div className="sl-panel">
                                    <span className="sl-corner-tl"/><span className="sl-corner-tr"/>
                                    <span className="sl-corner-bl"/><span className="sl-corner-br"/>

                                    <div className="sl-panel-header">
                                        <span className="sl-notif-icon">!</span>
                                        <span>QUEST BOARD</span>
                                        <span className="ml-2 text-xs sl-text-dim normal-case tracking-normal font-normal">
                                            [{quests.length} active]
                                        </span>
                                    </div>

                                    <div className="p-4">
                                        {user.isTranscended ? (
                                            <MonarchDomain
                                                user={user}
                                                onExpGranted={async () => {
                                                    const token = localStorage.getItem("system_token");
                                                    if (!token) return;
                                                    const res = await fetch("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
                                                    if (res.ok) setUser(await res.json());
                                                }}
                                            />
                                        ) : (
                                            <MobList quests={quests} onComplete={handleEngageMob} onEnterBoss={handleEnterBoss} />
                                        )}
                                    </div>

                                    {!user.isTranscended && (
                                        <div className="px-4 pb-4 pt-0">
                                            <hr className="sl-divider mb-3" />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setIsVerificationModalOpen(true)}
                                                    className="sl-btn sl-btn-purple text-xs"
                                                >
                                                    SUBMIT PROOF
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </main>

            <DevPanel isPenaltyZone={isPenaltyZone} onForcePenalty={() => setIsPenaltyZone(true)} onClearPenalty={() => setIsPenaltyZone(false)} />
        </React.Fragment>
        </DashboardErrorBoundary>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────

const HeartIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

function SLStatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
    return (
        <div className="sl-stat-row">
            <div className="sl-stat-label">
                <span className="text-[#5588cc]">{icon}</span>
                {label}
            </div>
            <span className="sl-stat-value">{String(value)}</span>
        </div>
    );
}

function NavTab({ active, onClick, icon, label, col = "", danger = false }: {
    active: boolean; onClick: () => void; icon: React.ReactNode; label: string; col?: string; danger?: boolean;
}) {
    const color = danger ? 'rgba(200,40,40' : 'rgba(30,68,200';
    const textColor = danger ? (active ? '#ff8888' : '#ff6666') : (active ? '#b0ccff' : '#7a9abf');
    return (
        <button
            onClick={onClick}
            className={`sl-btn ${col} flex items-center justify-center gap-2`}
            style={{
                borderColor: `${color},${active ? '0.85' : '0.5'})`,
                background: `${color},${active ? '0.25' : '0.12'})`,
                color: textColor,
                boxShadow: active ? `0 0 14px ${color},0.35)` : 'none',
            }}
        >
            {icon}{label}
        </button>
    );
}

export default function DashboardPage() {
    return (
        <SovereignProvider>
            <DashboardContent />
        </SovereignProvider>
    );
}
