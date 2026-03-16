import React from 'react';
import { motion } from 'framer-motion';

// ── MobCard ──────────────────────────────────────────────────────────────────
export const MobCard: React.FC<{
    quest: any;
    onComplete: (quest: any) => void;
    onEnterBoss?: (quest: any) => void;
    isLocked?: boolean;
}> = ({ quest, onComplete, onEnterBoss, isLocked }) => {
    const isBoss = quest.difficulty === 'S' || quest.type === 'boss'
        || quest.title.toLowerCase().includes('boss')
        || quest.title.toLowerCase().includes('igris');

    const borderColor = isLocked
        ? 'rgba(80,80,80,0.4)'
        : isBoss
            ? 'rgba(200,40,40,0.65)'
            : 'rgba(40,90,255,0.65)';

    const glowColor = isLocked
        ? 'none'
        : isBoss
            ? '0 0 12px rgba(200,40,40,0.3), inset 0 0 25px rgba(80,10,10,0.25)'
            : '0 0 12px rgba(30,68,255,0.25), inset 0 0 25px rgba(10,25,100,0.2)';

    const cornerColor = isLocked
        ? 'rgba(80,80,80,0.5)'
        : isBoss
            ? 'rgba(255,80,80,0.9)'
            : 'rgba(80,150,255,0.9)';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative mb-4 ${isLocked ? 'opacity-60' : ''}`}
            style={{
                background: 'rgba(0, 3, 22, 0.94)',
                backgroundImage: `
                    repeating-linear-gradient(62deg, transparent 0px, transparent 22px, rgba(30,68,200,0.03) 22px, rgba(30,68,200,0.03) 23px),
                    repeating-linear-gradient(-62deg, transparent 0px, transparent 35px, rgba(30,68,200,0.02) 35px, rgba(30,68,200,0.02) 36px)
                `,
                border: `1px solid ${borderColor}`,
                boxShadow: glowColor,
                borderRadius: '2px',
            }}
        >
            {/* Corner brackets */}
            <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-2 border-l-2 z-10"
                style={{borderColor: cornerColor, filter:`drop-shadow(0 0 3px ${cornerColor})`}} />
            <span className="absolute top-[-1px] right-[-1px] w-3 h-3 border-t-2 border-r-2 z-10"
                style={{borderColor: cornerColor, filter:`drop-shadow(0 0 3px ${cornerColor})`}} />
            <span className="absolute bottom-[-1px] left-[-1px] w-3 h-3 border-b-2 border-l-2 z-10"
                style={{borderColor: cornerColor, filter:`drop-shadow(0 0 3px ${cornerColor})`}} />
            <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-2 border-r-2 z-10"
                style={{borderColor: cornerColor, filter:`drop-shadow(0 0 3px ${cornerColor})`}} />

            {/* Header row */}
            <div className="flex items-center gap-2 px-4 py-2.5"
                style={{
                    background: 'rgba(0,5,35,0.9)',
                    borderBottom: `1px solid ${borderColor.replace('0.65','0.35')}`,
                }}
            >
                <div className="w-7 h-7 rounded-full border flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{
                        borderColor: isBoss ? 'rgba(255,80,80,0.8)' : 'rgba(80,150,255,0.8)',
                        color: isBoss ? 'rgba(255,160,160,0.95)' : 'rgba(180,210,255,0.95)',
                        boxShadow: isBoss ? '0 0 5px rgba(255,80,80,0.4)' : '0 0 5px rgba(80,150,255,0.4)',
                    }}
                >!</div>
                <span className="text-xs font-black tracking-[0.2em] uppercase"
                    style={{color: isBoss ? '#ff8888' : '#b0ccff'}}>
                    {isBoss ? 'BOSS ENCOUNTER' : 'QUEST INFO'}
                </span>
                <div className="ml-auto">
                    <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 border"
                        style={{
                            borderColor: isLocked ? 'rgba(100,100,100,0.4)' : isBoss ? 'rgba(200,40,40,0.6)' : 'rgba(164,128,242,0.6)',
                            background: isLocked ? 'rgba(50,50,50,0.3)' : isBoss ? 'rgba(80,10,10,0.4)' : 'rgba(60,20,120,0.3)',
                            color: isLocked ? '#666' : isBoss ? '#ff8888' : '#ccaaff',
                        }}
                    >
                        RANK {quest.difficulty}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                {/* Quest type tag */}
                <div className="mb-2">
                    <span className="text-[10px] tracking-widest uppercase"
                        style={{color: isBoss ? 'rgba(255,100,100,0.7)' : 'rgba(80,150,255,0.7)'}}>
                        [{isBoss ? 'Boss Quest' : `${quest.type || 'Daily'} Quest`}:{' '}
                        <span className="font-semibold">{quest.title}</span>]
                    </span>
                </div>

                {/* GOAL section */}
                <div className="sl-goal-heading mb-3 text-[11px]">GOAL</div>

                <p className="text-sm text-[#9db8d0] leading-relaxed mb-3">{quest.description}</p>

                {quest.objectives && quest.objectives.length > 0 && (
                    <div className="mb-3 p-2 border border-[rgba(40,90,255,0.2)] bg-[rgba(10,25,100,0.15)]">
                        <span className="text-[11px] text-[#11D2EF]/80">
                            Target: {quest.objectives[0].description}{' '}
                            <span className="font-bold text-white">({quest.objectives[0].target} reps)</span>
                        </span>
                    </div>
                )}

                {/* Rewards */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                    {quest.rewards?.exp > 0 && (
                        <span className="text-xs font-bold" style={{color:'#5599ff'}}>+{quest.rewards.exp} EXP</span>
                    )}
                    {quest.rewards?.statPoints > 0 && (
                        <span className="text-xs font-bold text-[#A480F2]">+{quest.rewards.statPoints} AP</span>
                    )}
                    {quest.rewards?.items?.length > 0 && (
                        <span className="text-xs font-bold" style={{color:'#00e676'}}>
                            +{quest.rewards.items.length} Items
                        </span>
                    )}
                </div>

                {/* WARNING line */}
                {!isLocked && (
                    <p className="text-[10px] text-[#7a9abf] mb-3 tracking-wide">
                        WARNING: Failure to complete will result in an appropriate{' '}
                        <span className="font-bold" style={{color:'#ff3333'}}>penalty</span>.
                    </p>
                )}

                {/* Action button */}
                {isBoss && onEnterBoss ? (
                    <button
                        onClick={() => !isLocked && onEnterBoss(quest)}
                        disabled={isLocked}
                        className="sl-btn sl-btn-red w-full py-3"
                    >
                        {isLocked ? 'LOCKED' : 'ENTER BOSS ROOM'}
                    </button>
                ) : (
                    <button
                        onClick={() => !isLocked && onComplete(quest)}
                        disabled={isLocked}
                        className="sl-btn w-full py-3"
                    >
                        {isLocked ? 'LOCKED' : 'ENGAGE MOB'}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// ── MobList ──────────────────────────────────────────────────────────────────
export const MobList: React.FC<{
    quests: any[];
    onComplete: (quest: any) => void;
    onEnterBoss?: (quest: any) => void;
}> = ({ quests, onComplete, onEnterBoss }) => {
    if (!quests || quests.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative py-10 text-center"
                style={{
                    background: 'rgba(0,3,22,0.8)',
                    border: '1px solid rgba(40,90,255,0.3)',
                    borderRadius: '2px',
                }}
            >
                <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-2 border-l-2 border-[rgba(80,150,255,0.7)]" />
                <span className="absolute top-[-1px] right-[-1px] w-3 h-3 border-t-2 border-r-2 border-[rgba(80,150,255,0.7)]" />
                <span className="absolute bottom-[-1px] left-[-1px] w-3 h-3 border-b-2 border-l-2 border-[rgba(80,150,255,0.7)]" />
                <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-2 border-r-2 border-[rgba(80,150,255,0.7)]" />
                <p className="text-[#7a9abf] font-caros text-sm uppercase tracking-[0.3em]">
                    No active threats detected.
                </p>
                <p className="text-[#4a6a8f] text-xs mt-2 tracking-wide">
                    The vicinity is safe... for now.
                </p>
            </motion.div>
        );
    }

    const hasGrunt  = quests.some(q => q.title === 'Goblin Grunt');
    const hasArcher = quests.some(q => q.title === 'Goblin Archer');
    const hasAnyMob = quests.some(q =>
        !q.title.toLowerCase().includes('boss') &&
        !q.title.toLowerCase().includes('igris') &&
        q.difficulty !== 'S' && q.type !== 'boss'
    );

    const checkLocked = (quest: any) => {
        if (quest.title === 'Goblin Archer' && hasGrunt) return true;
        if (quest.title === 'Goblin Shaman' && (hasGrunt || hasArcher)) return true;
        const isBoss = quest.difficulty === 'S' || quest.type === 'boss'
            || quest.title.toLowerCase().includes('boss')
            || quest.title.toLowerCase().includes('igris');
        if (isBoss && hasAnyMob) return true;
        return false;
    };

    return (
        <div className="space-y-4">
            {quests.map((quest) => (
                <MobCard
                    key={quest._id}
                    quest={quest}
                    onComplete={onComplete}
                    onEnterBoss={onEnterBoss}
                    isLocked={checkLocked(quest)}
                />
            ))}
        </div>
    );
};

export const MobStats: React.FC = () => null;
export const MobHealthBar: React.FC = () => null;
export const MobActionButton: React.FC = () => null;
export const MobTypeBadge: React.FC = () => null;
export const MobRewardPanel: React.FC = () => null;
export const MobDifficultyIndicator: React.FC = () => null;
export const MobLocationInfo: React.FC = () => null;
export const MobSummonButton: React.FC = () => null;

export default {
    MobCard, MobList, MobStats, MobHealthBar, MobActionButton,
    MobTypeBadge, MobRewardPanel, MobDifficultyIndicator, MobLocationInfo, MobSummonButton,
};
