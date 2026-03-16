/**
 * dev.js — God-Mode cheat API
 *
 * HARD GUARD: every handler rejects with 403 when NODE_ENV !== 'development'.
 * These routes MUST NEVER be reachable in production.
 */

const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const ActiveQuest = require('../models/ActiveQuest');
const Dungeon = require('../models/Dungeon');
const { processExpGain, applyProgressionGates, RANK_TIERS } = require('../services/leveling');

// ── Dev-env guard — rejects every request outside development ─────────────────
function devOnly(req, res, next) {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'DEV_ONLY — endpoint disabled in production.' });
    }
    next();
}

router.use(devOnly, authGuard);

// ── Helper: derive rank from level ────────────────────────────────────────────
function rankForLevel(level) {
    const idx = Math.min(Math.floor((level - 1) / 10), RANK_TIERS.length - 1);
    return RANK_TIERS[idx];
}

// ── Helper: build a fresh Goblin Boss quest ───────────────────────────────────
function goblinBossData(userId) {
    return {
        userId,
        title: 'Goblin Boss',
        description: 'Defeat the Hobgoblin Chieftain.',
        type: 'boss',
        difficulty: 'C',
        objectives: [{ description: 'Kill 1 Hobgoblin Chieftain', target: 1, progress: 0, completed: false }],
        rewards: { exp: 300, statPoints: 5, items: [] },
        status: 'active',
        expiresAt: new Date(Date.now() + 86400000), // 24h
    };
}

/**
 * POST /api/dev/override
 *
 * Body (all fields optional):
 *   targetLevel   {number}   — hard-sets user level (ignores EXP thresholds)
 *   addExp        {number}   — grants EXP through normal leveling pipeline
 *   addGold       {number}   — adds gold directly
 *   resetQuests   {boolean}  — wipes all user quests, spawns fresh Goblin Boss
 *   resetJobChange {boolean} — clears jobChangeLocked + jobChangeUnlocked flags
 *
 * After all mutations the route runs applyProgressionGates so a targetLevel of
 * 40+ or an addExp that crosses 40 correctly triggers the Job Change lockdown.
 */
router.post('/override', async (req, res, next) => {
    try {
        const { targetLevel, addExp, addGold, addStatPoints, resetQuests, resetJobChange, simulateDemonFloorClear, spawnAntKingRaid, forceRedGate, forceInvasion, spawnAntares, killAll } = req.body;

        const user = req.user; // already loaded by authGuard
        const log = [];       // human-readable audit trail returned in response

        // ── 10. Kill All Active Bosses/Monarchs ──────────────────────────────
        if (killAll) {
            // Clear Invasion
            if (user.activeInvasion && user.activeInvasion.monarch) {
                user.activeInvasion = { monarch: null, hp: 0, maxHp: 0, expiresAt: null, frozenTabs: [] };
                log.push('Invasion cleared.');
            }
            // Clear Raid
            if (user.activeRaid && user.activeRaid.bossName) {
                user.activeRaid.bossName      = null;
                user.activeRaid.maxHp         = 0;
                user.activeRaid.currentHp     = 0;
                user.activeRaid.daysRemaining = 0;
                user.activeRaid.penaltyRegen  = 0;
                log.push('Raid cleared.');
            }
        }

        // ── 9. Force Invasion ───────────────────────────────────────────────
        if (forceInvasion) {
            let invasionData = null;

            if (forceInvasion === 'Plague') {
                invasionData = {
                    monarch: 'Plague (Querehsha)',
                    hp: 3000,
                    maxHp: 3000,
                    expiresAt: null,
                    frozenTabs: []
                };
            } else if (forceInvasion === 'Frost') {
                const tabs = ['shop', 'inventory', 'demonCastle', 'stats'];
                const shuffled = tabs.sort(() => 0.5 - Math.random());
                const frozenTabs = shuffled.slice(0, 2);
                invasionData = {
                    monarch: 'Frost (Hokum)',
                    hp: 2500,
                    maxHp: 2500,
                    expiresAt: null,
                    frozenTabs
                };
            } else if (forceInvasion === 'Beast') {
                invasionData = {
                    monarch: 'Beast (Rakan)',
                    hp: 4000,
                    maxHp: 4000,
                    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
                    frozenTabs: []
                };
            }

            if (invasionData) {
                user.activeInvasion = invasionData;
                log.push(`Forced ${forceInvasion} Invasion.`);
            }
        }

        // ── 6. Simulate Demon Castle floor clear ───────────────────────────────
        if (simulateDemonFloorClear) {
            const floorCleared = (user.demonCastleFloor || 0) + 1;
            const rewardExp = floorCleared * 100;
            const rewardGold = floorCleared * 100;

            // Apply EXP gain
            const { stats, leveledUp, newRank } = processExpGain(user.stats, rewardExp);
            user.stats = stats;
            user.rank = newRank;
            user.stats.gold = (user.stats.gold || 0) + rewardGold;

            // Advance the floor counter
            user.demonCastleFloor = floorCleared;

            // Check for Floor 100 title reward
            if (floorCleared === 100) {
                const demonHunterTitle = {
                    name: 'Demon Hunter',
                    statMultipliers: [
                        { stat: 'strength', multiplier: 1.10 },
                        { stat: 'agility', multiplier: 1.10 },
                        { stat: 'vitality', multiplier: 1.10 },
                        { stat: 'sense', multiplier: 1.10 },
                        { stat: 'intelligence', multiplier: 1.10 }
                    ]
                };

                // Add title if not already present
                const titleExists = user.titles.some(t => t.name === 'Demon Hunter');
                if (!titleExists) {
                    user.titles.push(demonHunterTitle);
                    log.push('Title unlocked: Demon Hunter (+10% to all stats)');
                }

                // Equip the title
                user.equippedTitle = 'Demon Hunter';
                log.push('Title equipped: Demon Hunter');
            }

            log.push(`Demon Castle floor ${floorCleared} cleared (+${rewardExp} EXP, +${rewardGold} Gold)`);
        }

        // ── 1. Hard-set level ─────────────────────────────────────────────────
        if (targetLevel !== undefined) {
            const lvl = Math.max(1, Math.floor(Number(targetLevel)));
            user.stats.level = lvl;
            user.stats.exp = 0;
            user.rank = rankForLevel(lvl);
            log.push(`level set to ${lvl} (rank ${user.rank})`);
        }

        // ── 2. Add EXP through the normal pipeline ────────────────────────────
        if (addExp) {
            const before = user.stats.level;
            const { stats, leveledUp, newRank } = processExpGain(user.stats, Number(addExp));
            user.stats = stats;
            user.rank = newRank;
            log.push(`+${addExp} EXP granted${leveledUp ? ` (leveled up: ${before}→${user.stats.level})` : ''}`);
        }

        // ── 2.5. Add Stat Points ──────────────────────────────────────────────
        if (addStatPoints) {
            user.stats.statPoints = (user.stats.statPoints || 0) + Number(addStatPoints);
            log.push(`+${addStatPoints} Stat Points`);
        }

        // ── 3. Add gold ───────────────────────────────────────────────────────
        if (addGold) {
            user.stats.gold = (user.stats.gold || 0) + Number(addGold);
            log.push(`+${addGold} gold`);
        }

        // ── 4. Reset quests + spawn Goblin Boss ───────────────────────────────
        if (resetQuests) {
            await ActiveQuest.deleteMany({ userId: user._id });
            await Dungeon.deleteMany({ userId: user._id });

            const boss = await ActiveQuest.create(goblinBossData(user._id));

            await Dungeon.create({
                userId: user._id,
                title: 'E-Rank Dungeon: Goblin Hideout',
                storyBlock: 'goblins-1',
                requiredLevel: 1,
                mobQuests: [],
                bossQuest: boss._id,
                isCleared: false,
            });

            log.push('quests wiped — fresh Goblin Boss spawned');
        }

        // ── 5. Reset Job Change gate ──────────────────────────────────────────
        if (resetJobChange) {
            user.jobChangeLocked = false;
            user.jobChangeUnlocked = false;
            log.push('Job Change gate reset (locked=false, unlocked=false)');
        }

        // ── 6. Run progression gates after ALL mutations ──────────────────────
        // This is the authoritative check — if targetLevel/addExp pushed the
        // user to level 40+ and the gate hasn't been cleared, it fires here.
        const { gates } = applyProgressionGates(user);
        if (gates.length) log.push(`progression gate(s) triggered: ${gates.join(', ')}`);

        // ── 7. Spawn Ant King Raid ────────────────────────────────────────────
        if (spawnAntKingRaid) {
            user.activeRaid = {
                bossName: 'Ant King',
                maxHp: 5000,
                currentHp: 5000,
                daysRemaining: 7,
                penaltyRegen: 500
            };
            log.push('Spawned Ant King Raid');
        }

        // ── 7.5. Spawn Antares (Final Boss) ───────────────────────────────────
        if (spawnAntares) {
            user.activeRaid = {
                bossName: 'Antares, The Dragon Emperor',
                maxHp: 50000,
                currentHp: 50000,
                daysRemaining: 7,
                penaltyRegen: 2000
            };
            log.push('Spawned Antares Raid (Final Boss)');
        }

        // ── 8. Force Red Gate ────────────────────────────────────────────
        if (forceRedGate) {
            await ActiveQuest.create({
                userId: user._id,
                title: 'Red Gate Anomaly: Ice Elves',
                description: 'Survive the extreme cold and defeat the Ice Elf Chieftain.',
                type: 'daily',
                difficulty: 'A',
                isRedGate: true,
                objectives: [
                    { description: 'Kill 50 Ice Elves', target: 50, progress: 0, completed: false },
                    { description: 'Defeat Ice Elf Chieftain (Baruka)', target: 1, progress: 0, completed: false }
                ],
                rewards: { exp: 5000, gold: 5000, statPoints: 10, items: [] },
                status: 'active',
                expiresAt: new Date(Date.now() + 86400000), // 24h
            });
            log.push('Forced a Red Gate anomaly quest.');
        }

        user.markModified('stats');
        await user.save();

        res.json({
            success: true,
            log,
            gates,
            stats: user.stats,
            rank: user.rank,
            jobChangeLocked: user.jobChangeLocked,
            jobChangeUnlocked: user.jobChangeUnlocked,
        });
    } catch (err) { next(err); }
});

module.exports = router;
