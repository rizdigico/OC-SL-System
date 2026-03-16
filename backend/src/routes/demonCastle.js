/**
 * Demon Castle — Endless grind tower
 *
 * Each floor cleared increments demonCastleFloor and grants EXP + Gold
 * that scales exponentially so mid-to-late floors feel rewarding.
 *
 * Reward formula (per floor N):
 *   EXP  = floor(200 * N * 1.18^N)   — aggressive EXP curve
 *   Gold = floor(75  * N * 1.12^N)   — softer gold curve
 *
 * Floor 1  →  ~236 EXP /  ~84 Gold
 * Floor 10 →  ~10 500 EXP /  ~2 300 Gold
 * Floor 25 →  ~1 000 000 EXP (prestige territory)
 */

const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const checkFrozenTabs = require('../middleware/checkFrozenTabs');
const User = require('../models/User');
const { processExpGain, applyProgressionGates } = require('../services/leveling');

router.use(authGuard);
router.use(checkFrozenTabs('demonCastle'));

// ── Reward scaling ─────────────────────────────────────────────────────────────

const EXP_BASE  = 200;
const EXP_RATE  = 1.18;
const GOLD_BASE = 75;
const GOLD_RATE = 1.12;

/**
 * @param {number} floor  1-indexed floor number being cleared
 * @returns {{ exp: number, gold: number }}
 */
function floorRewards(floor) {
    return {
        exp:  Math.floor(EXP_BASE  * floor * Math.pow(EXP_RATE,  floor)),
        gold: Math.floor(GOLD_BASE * floor * Math.pow(GOLD_RATE, floor)),
    };
}

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/demon-castle
 * Returns the player's current floor and a preview of the next clear reward.
 */
router.get('/', async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select(
            'demonCastleFloor stats rank equippedTitle titles'
        );

        const currentFloor = user.demonCastleFloor || 0;
        const nextFloor    = currentFloor + 1;

        res.json({
            currentFloor,
            nextFloor,
            nextFloorReward: floorRewards(nextFloor),
        });
    } catch (err) { next(err); }
});

/**
 * POST /api/demon-castle/clear
 * Marks the current floor as cleared.
 *
 * Body (optional):
 *   { verified: true }  — reserved for future server-side verification hooks
 *
 * Grants scaled EXP + Gold, increments demonCastleFloor, and runs the
 * progression gate check in case the reward pushes the player past Level 40.
 */
router.post('/clear', async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        const floorCleared = (user.demonCastleFloor || 0) + 1;
        const reward       = floorRewards(floorCleared);

        // Apply EXP gain
        const { stats, leveledUp, newRank } = processExpGain(user.stats, reward.exp);
        user.stats      = stats;
        user.rank       = newRank;
        user.stats.gold = (user.stats.gold || 0) + reward.gold;

        // Advance the floor counter
        user.demonCastleFloor = floorCleared;

        // Check progression gates (e.g. Level 40 Job Change lock)
        const { gates } = applyProgressionGates(user);

        user.markModified('stats');
        await user.save();

        res.json({
            success: true,
            floorCleared,
            reward,
            leveledUp,
            stats:  user.stats,
            rank:   user.rank,
            gates,
        });
    } catch (err) { next(err); }
});

module.exports = router;
