const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const { processExpGain, applyProgressionGates } = require('../services/leveling');

router.use(authGuard);

// ── Constants ──────────────────────────────────────────────────────────────────

// Shadow rank granted on extraction, keyed by exact boss name.
const BOSS_SHADOW_RANK = {
    'Ant King':        'Marshal',
    'Baran':           'Commander',
    'Legia':           'Commander',
    'Antares':         'Marshal',
    'Iron':            'Knight',
    'Fangs of Kaisel': 'Knight',
};

// Reward multipliers relative to the boss's maxHp
const EXP_PER_HP  = 0.25;   // 5 000 maxHp → 1 250 EXP
const GOLD_PER_HP = 0.10;   // 5 000 maxHp →   500 gold

// ── Server-side damage formula ─────────────────────────────────────────────────
// Never trusts client-submitted damage values.
// STR × 8  +  level × 4  +  INT × 2
function calcDamage(stats) {
    return Math.floor(
        (stats.strength     || 1) * 8 +
        (stats.level        || 1) * 4 +
        (stats.intelligence || 1) * 2
    );
}

// ── POST /api/raid/attack ──────────────────────────────────────────────────────
router.post('/attack', async (req, res, next) => {
    try {
        const user = req.user;

        if (!user.activeRaid?.bossName || user.activeRaid.currentHp <= 0) {
            return res.status(400).json({ error: 'No active raid to attack.' });
        }

        const damage = calcDamage(user.stats);
        user.activeRaid.currentHp = Math.max(0, user.activeRaid.currentHp - damage);

        // ── Boss defeated ──────────────────────────────────────────────────────
        if (user.activeRaid.currentHp <= 0) {
            const { bossName, maxHp } = user.activeRaid;

            const expReward  = Math.floor(maxHp * EXP_PER_HP);
            const goldReward = Math.floor(maxHp * GOLD_PER_HP);

            const { stats, leveledUp, newRank } = processExpGain(user.stats, expReward, user.prestigeMultiplier);
            user.stats      = stats;
            user.rank       = newRank;
            user.stats.gold = (user.stats.gold || 0) + goldReward;

            const { gates } = applyProgressionGates(user);

            // Extract boss as shadow soldier (valid enum values: Normal/Elite/Knight/General/Commander/Marshal)
            const shadowRank = BOSS_SHADOW_RANK[bossName] ?? 'General';
            user.shadowArmy.push({
                name:       bossName,
                rank:       shadowRank,
                stats:      { attack: Math.floor(maxHp / 100), defense: Math.floor(maxHp / 200) },
                acquiredAt: new Date(),
            });
            
            // Check for Antares (The Dragon Emperor) defeat to unlock Cup
            if (bossName === 'Antares, The Dragon Emperor') {
                user.unlockedCup = true;
            }

            // Clear the raid using $set-compatible field nulling
            user.activeRaid.bossName      = null;
            user.activeRaid.maxHp         = 0;
            user.activeRaid.currentHp     = 0;
            user.activeRaid.daysRemaining = 0;
            user.activeRaid.penaltyRegen  = 0;

            user.markModified('stats');
            user.markModified('shadowArmy');
            user.markModified('activeRaid');
            await user.save();

            return res.json({
                hit:          true,
                damage,
                bossDefeated: true,
                bossName,
                shadowRank,
                rewards:      { exp: expReward, gold: goldReward },
                leveledUp,
                stats:        user.stats,
                rank:         user.rank,
                gates,
            });
        }

        // ── Boss still alive ───────────────────────────────────────────────────
        user.markModified('activeRaid');
        await user.save();

        res.json({
            hit:         true,
            damage,
            remainingHp: user.activeRaid.currentHp,
            maxHp:       user.activeRaid.maxHp,
            raid:        user.activeRaid,
        });
    } catch (err) { next(err); }
});

module.exports = router;
