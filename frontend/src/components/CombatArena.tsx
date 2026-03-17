import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Zap, Sword, Activity, Package, User } from "lucide-react";
import { useSystemAudio } from "@/hooks/useSystemAudio";

interface CombatArenaProps {
    isOpen: boolean;
    onClose: () => void;
    mobData: any;
    user: any;
    onWin: (data?: any) => void;
}

interface DamageNumber {
    id: number;
    value: number;
    type: 'damage' | 'heal' | 'player-damage';
    target: 'player' | 'mob';
}

export function CombatArena({ isOpen, onClose, mobData, user, onWin }: CombatArenaProps) {
    const { playClick, playError } = useSystemAudio();

    // Derived max stats
    const maxHp = (user?.stats?.vitality || 10) * 10;
    const maxMp = (user?.stats?.intelligence || 10) * 10;

    const [playerHp, setPlayerHp] = useState(maxHp);
    const [playerMp, setPlayerMp] = useState(maxMp);
    const [mobHp, setMobHp] = useState(mobData?.hp || 100);
    const maxMobHp = mobData?.hp || 100;
    const [combatLog, setCombatLog] = useState<string[]>([]);
    const [turn, setTurn] = useState<'player' | 'mob'>('player');

    const [showItems, setShowItems] = useState(false);
    const [inventory, setInventory] = useState<any[]>([]);

    // Animation states
    const [playerAnim, setPlayerAnim] = useState('idle');
    const [mobAnim, setMobAnim] = useState('idle');
    const [floatingNumbers, setFloatingNumbers] = useState<DamageNumber[]>([]);

    const logContainerRef = useRef<HTMLDivElement>(null);

    const addFloatingNumber = (value: number, type: DamageNumber['type'], target: DamageNumber['target']) => {
        const id = Date.now() + Math.random();
        setFloatingNumbers(prev => [...prev, { id, value, type, target }]);
        setTimeout(() => {
            setFloatingNumbers(prev => prev.filter(n => n.id !== id));
        }, 1000);
    };

    const fetchInventory = async () => {
        const token = localStorage.getItem("system_token");
        if (!token) return;
        try {
            const res = await fetch("http://localhost:5000/api/inventory", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInventory(data.items.filter((i: any) => i.type === 'consumable' && i.quantity > 0));
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (isOpen) {
            setPlayerHp((user?.stats?.vitality || 10) * 10);
            setPlayerMp((user?.stats?.intelligence || 10) * 10);
            setMobHp(mobData?.hp || 100);
            setCombatLog([`Encountered ${mobData?.name || 'an enemy'}!`]);
            setTurn('player');
            setShowItems(false);
            setPlayerAnim('idle');
            setMobAnim('idle');
            setFloatingNumbers([]);
            fetchInventory();
        }
    }, [isOpen, mobData, user]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [combatLog]);

    const handleAttack = () => {
        if (turn !== 'player') return;
        playClick();

        setPlayerAnim('attack');

        setTimeout(() => {
            const baseStr = user?.stats?.strength || 10;
            const weaponStr = user?.equippedWeapon?.effect?.strength || 0;
            const dmg = baseStr + weaponStr;
            const newMobHp = Math.max(0, mobHp - dmg);
            setMobHp(newMobHp);

            setMobAnim('hit');
            addFloatingNumber(dmg, 'damage', 'mob');
            setCombatLog(prev => [...prev, `You attacked for ${dmg} damage!`]);

            if (newMobHp <= 0) {
                setTimeout(handleWin, 1000);
            } else {
                setTurn('mob');
                setTimeout(mobTurn, 1000);
            }
            setTimeout(() => setPlayerAnim('idle'), 300);
            setTimeout(() => setMobAnim('idle'), 400);
        }, 150);
    };

    const handleSkill = async () => {
        if (turn !== 'player') return;

        if (playerMp < 10) {
            playError();
            setCombatLog(prev => [...prev, `Not enough MP!`]);
            return;
        }

        playClick();
        setPlayerMp(prev => prev - 10);
        setPlayerAnim('skill_charge');
        setCombatLog(prev => [...prev, `Charging skill...`]);

        setTimeout(() => {
            setPlayerAnim('attack');

            setTimeout(() => {
                const dmg = (user?.stats?.intelligence || 10) * 2 + Math.floor(Math.random() * 10);
                const newMobHp = Math.max(0, mobHp - dmg);
                setMobHp(newMobHp);

                setMobAnim('hit');
                addFloatingNumber(dmg, 'damage', 'mob');
                setCombatLog(prev => [...prev, `You used a skill for ${dmg} damage!`]);

                if (newMobHp <= 0) {
                    setTimeout(handleWin, 1000);
                } else {
                    setTurn('mob');
                    setTimeout(mobTurn, 1000);
                }
                setTimeout(() => setPlayerAnim('idle'), 300);
                setTimeout(() => setMobAnim('idle'), 400);
            }, 150);
        }, 2000);
    };

    const handleUseItem = async (itemId: string) => {
        if (turn !== 'player') return;
        const token = localStorage.getItem("system_token");
        if (!token) return;

        playClick();

        try {
            const res = await fetch("http://localhost:5000/api/inventory/use", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ itemId })
            });

            if (res.ok) {
                const data = await res.json();
                const effects = data.effects || {};

                let healAmount = 0;
                if (effects.vitality) healAmount = effects.vitality * 10;
                else if (effects.hp) healAmount = effects.hp;
                else healAmount = 50;

                setPlayerHp(prev => Math.min(maxHp, prev + healAmount));
                addFloatingNumber(healAmount, 'heal', 'player');
                setCombatLog(prev => [...prev, `Used an item! Restored ${healAmount} HP.`]);
                setShowItems(false);
                setTurn('mob');
                fetchInventory();
                setTimeout(mobTurn, 1000);
            } else {
                playError();
                setCombatLog(prev => [...prev, `Failed to use item.`]);
            }
        } catch (e) {
            console.error(e);
            playError();
        }
    };

    const mobTurn = () => {
        setMobAnim('attack');

        setTimeout(() => {
            const dmg = Math.floor(Math.random() * 15) + 5;

            setPlayerAnim('hit');
            addFloatingNumber(dmg, 'player-damage', 'player');

            setPlayerHp(prev => {
                const newHp = Math.max(0, prev - dmg);
                setCombatLog(log => [...log, `The enemy attacked for ${dmg} damage!`]);
                if (newHp <= 0) {
                    setTimeout(handleLose, 1000);
                } else {
                    setTurn('player');
                }
                return newHp;
            });

            setTimeout(() => setMobAnim('idle'), 300);
            setTimeout(() => setPlayerAnim('idle'), 400);
        }, 150);
    };

    const handleWin = async () => {
        setCombatLog(prev => [...prev, `You defeated the enemy!`]);

        const token = localStorage.getItem("system_token");
        if (token) {
            try {
                await fetch('http://localhost:5000/api/combat/reward', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ exp: mobData?.exp || 150, gold: mobData?.gold || 200 })
                });
            } catch (err) {
                console.error('Error claiming reward', err);
            }
        }

        setTimeout(() => {
            onWin();
            onClose();
        }, 1500);
    };

    const handleLose = () => {
        setCombatLog(prev => [...prev, `You were defeated...`]);
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const playerVariants: any = {
        idle: { x: 0, scale: 1, filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))" },
        attack: { x: [0, 150, 0], transition: { duration: 0.3, ease: "easeInOut" } },
        skill_charge: {
            filter: ["drop-shadow(0px 0px 0px #A480F2)", "drop-shadow(0px 0px 30px #A480F2)", "drop-shadow(0px 0px 0px #A480F2)"],
            transition: { duration: 1, repeat: Infinity }
        },
        hit: { x: [-10, 10, -10, 10, 0], filter: "drop-shadow(0px 0px 10px #ef4444)", transition: { duration: 0.3 } }
    };

    const bossVariants: any = {
        idle: { x: 0, scale: 1, filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))" },
        attack: { x: [0, -150, 0], transition: { duration: 0.3, ease: "easeInOut" } },
        hit: {
            x: [-15, 15, -20, 20, -15, 15, 0],
            filter: ["drop-shadow(0px 0px 10px #ef4444)", "drop-shadow(0px 0px 30px #ef4444)", "drop-shadow(0px 0px 0px #ef4444)"],
            transition: { duration: 0.4 }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-system-black/80 backdrop-blur-3xl"
                >
                    <div className="w-full max-w-3xl bg-[#02020B] border border-[#011BDE] shadow-[0_0_50px_rgba(1,27,222,0.3)] rounded-2xl p-6 flex flex-col gap-6">

                        {/* Status Bars */}
                        <div className="flex justify-between items-center w-full">
                            {/* Player Status */}
                            <div className="w-1/3">
                                <h3 className="text-system-blue font-caros font-bold mb-2 uppercase tracking-widest">{user?.displayName || "PLAYER"}</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-green-500" />
                                        <div className="h-3 w-full bg-black border border-green-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${Math.max(0, (playerHp / maxHp) * 100)}%` }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-blue-500" />
                                        <div className="h-3 w-full bg-black border border-blue-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.max(0, (playerMp / maxMp) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-system-neon font-black text-3xl font-caros px-4">VS</div>

                            {/* Mob Status */}
                            <div className="w-1/3">
                                <h3 className="text-red-500 font-caros font-bold mb-2 uppercase tracking-widest text-right">{mobData?.name || 'ENEMY'}</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-row-reverse">
                                        <Skull className="w-4 h-4 text-red-500" />
                                        <div className="h-3 w-full bg-black border border-red-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${Math.max(0, (mobHp / maxMobHp) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual 2D Battle Stage */}
                        <div className="relative w-full h-56 bg-[#010105] border border-[#011BDE]/30 rounded-lg overflow-hidden flex items-end justify-between px-16 pb-6 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(1,27,222,0.1)_0%,transparent_70%)] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-[#011BDE]/20 to-transparent pointer-events-none" />

                            {/* Floating Numbers */}
                            <AnimatePresence>
                                {floatingNumbers.map(n => (
                                    <motion.div
                                        key={n.id}
                                        initial={{ opacity: 1, y: 0, scale: 0.5 }}
                                        animate={{ opacity: 0, y: -60, scale: 1.2 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`absolute font-black text-3xl z-50 pointer-events-none drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] ${n.target === 'player' ? 'left-[20%]' : 'right-[20%]'
                                            } ${n.type === 'heal' ? 'text-green-400' :
                                                n.type === 'player-damage' ? 'text-blue-400' : 'text-red-500'
                                            }`}
                                        style={{ top: '30%' }}
                                    >
                                        {n.type === 'heal' ? '+' : '-'}{n.value}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Player Silhouette */}
                            <motion.div
                                variants={playerVariants}
                                animate={playerAnim}
                                className="relative z-10 flex flex-col items-center justify-end"
                            >
                                <div className="w-16 h-24 bg-[#011BDE] rounded-t-full rounded-b-md relative shadow-[0_0_15px_#011BDE]">
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-black rounded-full border-2 border-[#011BDE]"></div>
                                    <User className="absolute top-12 left-1/2 -translate-x-1/2 text-black w-6 h-6 opacity-50" />
                                </div>
                                <div className="absolute -bottom-2 w-20 h-4 bg-black/50 blur-sm rounded-[100%]" />
                            </motion.div>

                            {/* Boss Silhouette */}
                            <motion.div
                                variants={bossVariants}
                                animate={mobAnim}
                                className="relative z-10 flex flex-col items-center justify-end"
                            >
                                <div className="w-20 h-28 bg-red-600 rounded-t-full rounded-b-md relative shadow-[0_0_20px_#dc2626]">
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-black rounded-full border-2 border-red-600">
                                        <div className="absolute top-3 left-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_#ef4444]"></div>
                                        <div className="absolute top-3 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_#ef4444]"></div>
                                    </div>
                                    <div className="absolute -top-4 left-0 w-4 h-8 bg-red-600 rounded-tl-full rotate-12"></div>
                                    <div className="absolute -top-4 right-0 w-4 h-8 bg-red-600 rounded-tr-full -rotate-12"></div>
                                    <Skull className="absolute top-14 left-1/2 -translate-x-1/2 text-black w-8 h-8 opacity-50" />
                                </div>
                                <div className="absolute -bottom-2 w-24 h-4 bg-black/50 blur-sm rounded-[100%]" />
                            </motion.div>

                        </div>

                        {/* Combat Log */}
                        <div ref={logContainerRef} className="h-24 bg-black/50 border border-white/10 rounded-lg p-3 overflow-y-auto font-lato text-sm flex flex-col gap-1">
                            {combatLog.map((log, idx) => (
                                <div key={idx} className="text-gray-300">
                                    <span className="text-system-neon opacity-50 mr-2">&gt;</span>{log}
                                </div>
                            ))}
                        </div>

                        {/* Items View or Action Buttons */}
                        {showItems ? (
                            <div className="grid grid-cols-3 gap-4">
                                {inventory.length === 0 ? (
                                    <div className="col-span-3 text-center text-gray-500 py-4">No usable consumables.</div>
                                ) : (
                                    inventory.map((item: any) => (
                                        <button
                                            key={item._id}
                                            onClick={() => handleUseItem(item._id)}
                                            className="p-3 bg-[#A480F2]/10 hover:bg-[#A480F2]/30 border border-[#A480F2]/50 rounded-xl text-[#A480F2] text-sm font-bold flex flex-col items-center gap-2"
                                        >
                                            <Package className="w-5 h-5" />
                                            <span>{item.name} (x{item.quantity})</span>
                                        </button>
                                    ))
                                )}
                                <button
                                    onClick={() => setShowItems(false)}
                                    className="col-span-3 mt-2 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={handleAttack}
                                    disabled={turn !== 'player'}
                                    className="py-4 bg-[#011BDE]/20 hover:bg-[#011BDE]/40 border border-[#011BDE] rounded-xl text-system-neon font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(1,27,222,0.2)]"
                                >
                                    <Sword className="w-5 h-5" /> Attack
                                </button>
                                <button
                                    onClick={handleSkill}
                                    disabled={turn !== 'player'}
                                    className="py-4 bg-[#A480F2]/20 hover:bg-[#A480F2]/40 border border-[#A480F2] rounded-xl text-[#A480F2] font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(164,128,242,0.2)]"
                                >
                                    <Zap className="w-5 h-5" /> Skill
                                </button>
                                <button
                                    onClick={() => { playClick(); setShowItems(true); }}
                                    disabled={turn !== 'player'}
                                    className="py-4 bg-[#FFD700]/20 hover:bg-[#FFD700]/40 border border-[#FFD700] rounded-xl text-[#FFD700] font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                                >
                                    <Package className="w-5 h-5" /> Items
                                </button>
                            </div>
                        )}

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
