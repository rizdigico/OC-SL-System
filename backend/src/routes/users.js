const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const checkRedGateLockdown = require('../middleware/redGateLockdown');
const checkFrozenTabs = require('../middleware/checkFrozenTabs');
const { decrypt } = require('../services/encryption');

// GET /api/users/me — full decrypted profile
router.get('/me', authGuard, (req, res) => {
    const u = req.user.toObject();
    try { u.email = u.email ? decrypt(u.email) : ''; } catch { u.email = ''; }
    try { u.displayName = u.displayName ? decrypt(u.displayName) : ''; } catch { u.displayName = ''; }
    try { u.avatarUrl = u.avatarUrl ? decrypt(u.avatarUrl) : ''; } catch { u.avatarUrl = ''; }
    delete u.emailHash;
    res.json(u);
});

// GET /api/users/me/penalty-status
router.get('/me/penalty-status', authGuard, (req, res) => {
    res.json({ isPenalized: !!req.user.isPenalized });
});

// GET /api/users/me/stats
router.get('/me/stats', authGuard, (req, res) => {
    res.json({ stats: req.user.stats, rank: req.user.rank, title: req.user.title });
});

// PATCH /api/users/me/stats — allocate stat points
router.patch('/me/stats', authGuard, checkRedGateLockdown, checkFrozenTabs('stats'), async (req, res, next) => {
    try {
        const { strength, agility, vitality, sense, intelligence } = req.body;
        const alloc = { strength: strength || 0, agility: agility || 0, vitality: vitality || 0, sense: sense || 0, intelligence: intelligence || 0 };
        const total = Object.values(alloc).reduce((a, b) => a + b, 0);

        if (total <= 0) return res.status(400).json({ error: 'No points allocated' });
        if (total > req.user.stats.statPoints) return res.status(400).json({ error: 'Not enough stat points' });

        for (const [key, val] of Object.entries(alloc)) {
            req.user.stats[key] += val;
        }
        req.user.stats.statPoints -= total;
        await req.user.save();

        res.json({ stats: req.user.stats, rank: req.user.rank });
    } catch (err) { next(err); }
});

// POST /api/users/me/monarch-grant — custom EXP from Monarch Domain
router.post('/me/monarch-grant', authGuard, async (req, res, next) => {
    try {
        if (!req.user.isTranscended) {
            return res.status(403).json({ error: 'SYSTEM_ERROR', message: 'You have not yet transcended the System.' });
        }

        const { processExpGain } = require('../services/leveling');
        const { exp } = req.body;
        if (!exp || exp <= 0) return res.status(400).json({ error: 'Invalid EXP amount' });

        const { stats, leveledUp, newRank } = processExpGain(req.user.stats, exp, req.user.prestigeMultiplier);
        req.user.stats = stats;
        req.user.rank = newRank;
        req.user.markModified('stats');

        await req.user.save();
        res.json({ stats: req.user.stats, rank: req.user.rank, leveledUp });
    } catch (err) { next(err); }
});


// POST /api/users/me/transcend — Complete Architects Demise
router.post('/me/transcend', authGuard, async (req, res, next) => {
    try {
        if (req.user.architectsDemiseLocked) {
            req.user.architectsDemiseLocked = false;
            req.user.isTranscended = true;
            req.user.title = "Shadow Monarch";
            req.user.stats.level = Math.max(100, req.user.stats.level || 100);
            req.user.markModified('stats');
            await req.user.save();
        }
        res.json({ success: true, isTranscended: true });
    } catch (err) { next(err); }
});

// DELETE /api/users/me — Erase Player Data (Level >= 15 check)
router.delete('/me', authGuard, async (req, res, next) => {
    try {
        if (req.user.stats.level < 15) {
            return res.status(403).json({ error: 'UNAUTHORIZED: PLAYER LEVEL TOO LOW. SURVIVE UNTIL LEVEL 15 TO UNLOCK ABANDONMENT.' });
        }

        await req.user.deleteOne();
        res.json({ message: 'Player data erased.' });
    } catch (err) { next(err); }
});

module.exports = router;
