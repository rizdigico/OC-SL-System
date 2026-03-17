const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const User = require('../models/User');
const Skill = require('../models/Skill');
const ActiveQuest = require('../models/ActiveQuest');
const ShadowArmy = require('../models/ShadowArmy');
const { processExpGain } = require('../services/leveling');
const { getTitleBoostedStats, describeMultipliers } = require('../services/titles');

router.use(authGuard);

/* Rollback: Shadow extraction disabled for stability
const extractionAttempts = new Map();

// POST /api/combat/extract
router.post('/extract', async (req, res, next) => {
    try {
        const { bossId, mobLevel = 1, mobData } = req.body;
        const user = await User.findById(req.user._id);

        const attemptKey = `${user._id.toString()}-${bossId}`;
        const attempts = extractionAttempts.get(attemptKey) || 0;

        if (attempts >= 3) {
            return res.status(400).json({ success: false, message: 'The shadow has faded into nothingness. No more extraction attempts allowed.' });
        }

        extractionAttempts.set(attemptKey, attempts + 1);

        const delta = (user.stats?.level || 1) - mobLevel;
        let successRate = 0.50;

        if (delta > 0) {
            successRate = Math.min(0.90, successRate + (delta * 0.10));
        } else if (delta < 0) {
            successRate = Math.max(0.10, successRate + (delta * 0.15));
        }

        const roll = Math.random();
        const success = roll <= successRate;

        let shadowName = mobData?.name || 'Unknown Shadow';
        let shadowRank = mobData?.rank || 'Knight';

        if (success) {
            user.shadowArmy = user.shadowArmy || [];
            user.shadowArmy.push({
                name: shadowName,
                rank: shadowRank,
                stats: mobData || {},
                acquiredAt: new Date()
            });
            await user.save();
            return res.json({ success: true, message: 'Shadow Extracted!', shadow: { name: shadowName, rank: shadowRank } });
        }

        res.json({ success: false, message: 'Extraction Failed...', attemptsLeft: 3 - (attempts + 1) });
    } catch (err) { next(err); }
});
*/

// POST /api/combat/reward
router.post('/reward', async (req, res, next) => {
    try {
        const { exp, gold } = req.body;
        const user = await User.findById(req.user._id);

        let leveledUp = false;
        if (exp) {
            const result = processExpGain(user.stats, exp);
            user.stats = result.stats;
            user.rank = result.newRank;
            leveledUp = result.leveledUp;
        }

        if (gold) {
            user.stats.gold = (user.stats.gold || 0) + gold;
        }

        await user.save();
        res.json({ message: 'Rewards granted', stats: user.stats, rank: user.rank, leveledUp });
    } catch (err) { next(err); }
});

/**
 * POST /api/combat/calculate-damage
 *
 * Server-authoritative damage roll that folds in the player's equipped title
 * multipliers before computing the final output.
 *
 * Body:
 *   attackType  — "physical" | "magic"   (required)
 *   mobDefense  — number                 (optional, default 0)
 *   skillId     — ObjectId string        (optional — boosts damage if supplied)
 *
 * Damage formulas:
 *   physical  = (STR * 3 + AGI) − mobDefense
 *   magic     = (INT * 3 + SEN) − mobDefense
 *   +10 % per skill level above 1 if skillId is provided
 *
 * The response includes `titleBonuses` so the client can show the player
 * exactly what the title contributed to the roll.
 */
router.post('/calculate-damage', async (req, res, next) => {
    try {
        const { attackType, mobDefense = 0, skillId } = req.body;

        if (!['physical', 'magic'].includes(attackType)) {
            return res.status(400).json({ error: 'attackType must be "physical" or "magic"' });
        }

        const user   = await User.findById(req.user._id);
        const boosted = getTitleBoostedStats(user);

        // Base damage by attack type
        let base =
            attackType === 'physical'
                ? boosted.strength * 3 + boosted.agility
                : boosted.intelligence * 3 + boosted.sense;

        // Optional skill multiplier
        let skillLevelBonus = 0;
        if (skillId) {
            const userSkill = user.skills.find(s => s.skill.toString() === skillId);
            if (userSkill && userSkill.level > 1) {
                skillLevelBonus = (userSkill.level - 1) * 0.10; // +10% per level above 1
                base = Math.floor(base * (1 + skillLevelBonus));
            }
        }

        const damage = Math.max(0, base - mobDefense);

        // Describe what the title contributed
        const equippedTitleDoc = (user.titles || []).find(t => t.name === user.equippedTitle) || null;
        const titleBonuses     = describeMultipliers(equippedTitleDoc);

        res.json({
            damage,
            attackType,
            equippedTitle: user.equippedTitle || null,
            titleBonuses,                          // e.g. ["+10% intelligence"]
            skillLevelBonus: skillLevelBonus > 0
                ? `+${Math.round(skillLevelBonus * 100)}%`
                : null,
            boostedStats: {
                strength:      boosted.strength,
                agility:       boosted.agility,
                intelligence:  boosted.intelligence,
                sense:         boosted.sense,
            },
        });
    } catch (err) { next(err); }
});

// POST /api/combat/use-skill
router.post('/use-skill', async (req, res, next) => {
    try {
        const { skillId } = req.body;
        const user = await User.findById(req.user._id);

        const userSkill = user.skills.find(s => s.skill.toString() === skillId);
        if (!userSkill) {
            return res.status(400).json({ error: 'Skill not unlocked' });
        }

        const skillDef = await Skill.findById(skillId);
        if (!skillDef) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        // Deduct MP if necessary
        if (user.stats.mana < skillDef.mpCost) {
            return res.status(400).json({ error: 'Not enough mana' });
        }
        user.stats.mana -= skillDef.mpCost;

        // Level up logic
        userSkill.usageCount += 1;
        // Level up every 10 uses per current level
        if (userSkill.usageCount >= userSkill.level * 10) {
            userSkill.level += 1;
            userSkill.usageCount = 0;
        }

        await user.save();
        res.json({ message: `Used ${skillDef.name}`, userSkill, mana: user.stats.mana });

    } catch (err) { next(err); }
});

module.exports = router;
