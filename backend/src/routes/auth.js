const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authGuard = require('../middleware/authGuard');
const { decrypt } = require('../services/encryption');

function signToken(user) {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }), (req, res) => {
    const token = signToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/' }), (req, res) => {
    const token = signToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

// Current user
router.get('/me', authGuard, (req, res) => {
    const u = req.user.toObject();
    try { u.email = u.email ? decrypt(u.email) : ''; } catch { u.email = ''; }
    try { u.displayName = u.displayName ? decrypt(u.displayName) : ''; } catch { u.displayName = ''; }
    try { u.avatarUrl = u.avatarUrl ? decrypt(u.avatarUrl) : ''; } catch { u.avatarUrl = ''; }
    delete u.emailHash;
    res.json(u);
});

// Logout (client-side token discard; server-side is stateless JWT)
router.post('/logout', (_req, res) => {
    res.json({ message: 'Logged out' });
});

// ── Dev Login (bypasses OAuth — development only) ──
const User = require('../models/User');
const ShadowInventory = require('../models/ShadowInventory');
const { encrypt, hmacIndex } = require('../services/encryption');

router.post('/dev-login', async (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Dev login disabled in production' });
    }
    try {
        let user = await User.findOne({ oauthProvider: 'dev', oauthId: 'test-player-001' });
        if (!user) {
            user = await User.create({
                oauthProvider: 'dev', oauthId: 'test-player-001',
                email: encrypt('hunter@thesystem.dev'),
                emailHash: hmacIndex('hunter@thesystem.dev'),
                displayName: encrypt('Sung Jin-Woo'), avatarUrl: '',
                stats: {
                    level: 5, exp: 0, strength: 8, agility: 6, vitality: 5,
                    sense: 4, intelligence: 7, statPoints: 10, gold: 250, fatigue: 0
                },
                rank: 'E', title: 'Shadow Initiate',
            });
            await ShadowInventory.create({ userId: user._id, items: [], maxSlots: 30 });
        }
        const token = signToken(user);
        res.json({ message: '[SYSTEM] Dev login successful.', token, userId: user._id });
    } catch (err) { next(err); }
});

module.exports = router;
