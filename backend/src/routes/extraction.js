const router = require('express').Router();
const mongoose = require('mongoose');
const authGuard = require('../middleware/authGuard');
const ShadowInventory = require('../models/ShadowInventory');
const User = require('../models/User');
const { attemptExtraction, generateShadow, MAX_ATTEMPTS } = require('../services/extraction');
const { getIO } = require('../config/socket');

router.use(authGuard);

const VALID_DIFFICULTIES = new Set(['E', 'D', 'C', 'B', 'A', 'S']);

/**
 * POST /api/extraction/arise
 * Body: { bossName: string, bossDifficulty: 'E'|'D'|'C'|'B'|'A'|'S', attemptNumber: 1|2|3 }
 *
 * GUARANTEES:
 *  - Unbiased PRNG via services/extraction.js (64-bit entropy, rejection-sampling)
 *  - Inventory push + stat buff update are wrapped in a MongoDB multi-document
 *    session/transaction — either BOTH commit or NEITHER does.
 *  - WebSocket 'shadow:arise' event fires ONLY after the transaction commits.
 *  - Slot cap is enforced atomically inside the transaction (no TOCTOU).
 *  - Enum and type validation before any DB work.
 */
router.post('/arise', async (req, res, next) => {
    // ── 1. Input validation (fail fast, before any DB or PRNG work) ──
    const { bossName, bossDifficulty, attemptNumber } = req.body;

    if (typeof bossName !== 'string' || !bossName.trim()) {
        return res.status(400).json({ error: 'bossName must be a non-empty string' });
    }
    if (!VALID_DIFFICULTIES.has(bossDifficulty)) {
        return res.status(400).json({ error: `bossDifficulty must be one of: ${[...VALID_DIFFICULTIES].join(' | ')}` });
    }
    const attempt = Number.isInteger(attemptNumber) ? attemptNumber : parseInt(attemptNumber, 10);
    if (isNaN(attempt) || attempt < 1 || attempt > MAX_ATTEMPTS) {
        return res.status(400).json({ error: `attemptNumber must be an integer 1–${MAX_ATTEMPTS}` });
    }

    // ── 2. PRNG roll (pure CPU, no I/O — do before opening a session) ──
    const result = attemptExtraction(req.user.stats.level, bossDifficulty, attempt);

    // Failed roll: no DB work needed
    if (!result.success) {
        return res.json({
            message: `[SYSTEM] Extraction attempt ${result.attempt} failed.`,
            ...result,
            attemptsRemaining: MAX_ATTEMPTS - result.attempt,
        });
    }

    // ── 3. Generate the shadow entity (also pure CPU) ──
    const shadow = generateShadow(bossName.trim(), bossDifficulty);

    // ── 4. Determine stat buff before opening session ──
    const buffStat = shadow.authorityBuff.match(/(\w+) when deployed/)?.[1];
    const multiplierMatch = shadow.authorityBuff.match(/([\d.]+)x/);
    const buffBonus = multiplierMatch ? Math.floor((parseFloat(multiplierMatch[1]) - 1) * 10) : 0;
    const hasValidBuff = buffStat && buffBonus > 0 && req.user.stats[buffStat] !== undefined;

    // ── 5. MongoDB multi-document transaction ──
    const session = await mongoose.startSession();
    let updatedStats;

    try {
        await session.withTransaction(async () => {
            // 5a. Atomic slot-guarded inventory push inside transaction
            const inv = await ShadowInventory.findOneAndUpdate(
                {
                    userId: req.user._id,
                    $expr: { $lt: [{ $size: '$items' }, '$maxSlots'] },
                },
                { $push: { items: shadow } },
                { new: true, session }
            );

            if (!inv) {
                // Distinguish "full" from "not found" without a second query
                // (the transaction will abort on the thrown error)
                const exists = await ShadowInventory.exists({ userId: req.user._id }).session(session);
                const err = new Error(exists ? 'Inventory full — cannot store shadow' : 'Inventory not found');
                err.status = exists ? 400 : 404;
                throw err;
            }

            // 5b. Atomic stat buff via $inc inside the same transaction
            if (hasValidBuff) {
                const updated = await User.findByIdAndUpdate(
                    req.user._id,
                    { $inc: { [`stats.${buffStat}`]: buffBonus } },
                    { new: true, session }
                );
                updatedStats = updated?.stats;
            } else {
                updatedStats = req.user.stats;
            }
        });
    } catch (err) {
        await session.endSession();
        // Propagate HTTP-status errors set above, others become 500
        return next(err);
    }

    await session.endSession();

    // ── 6. WebSocket emit — ONLY after transaction committed successfully ──
    try {
        getIO()
            .to(`user:${req.user._id}`)
            .emit('shadow:arise', {
                message: `[SYSTEM] "Arise." — Shadow of ${bossName.trim()} has been extracted.`,
                shadow,
                updatedStats,
            });
    } catch { /* non-fatal: socket may not be connected */ }

    return res.json({
        message: '[SYSTEM] "Arise." — Shadow extraction successful.',
        ...result,
        shadow,
        updatedStats,
    });
});

module.exports = router;
