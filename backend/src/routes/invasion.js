const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const { processExpGain } = require('../services/leveling');

router.use(authGuard);

// POST /api/invasion/trigger
router.post('/trigger', async (req, res, next) => {
    try {
        const { monarch } = req.body;
        let invasionData = null;

        if (monarch === 'Plague') {
            invasionData = {
                monarch: 'Plague (Querehsha)',
                hp: 3000,
                maxHp: 3000,
                expiresAt: null,
                frozenTabs: []
            };
        } else if (monarch === 'Frost') {
            // Randomly freeze 2 tabs
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
        } else if (monarch === 'Beast') {
            invasionData = {
                monarch: 'Beast (Rakan)',
                hp: 4000,
                maxHp: 4000,
                expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
                frozenTabs: []
            };
        } else {
            return res.status(400).json({ error: 'Invalid monarch' });
        }

        req.user.activeInvasion = invasionData;
        await req.user.save();
        res.json({ success: true, invasion: req.user.activeInvasion });
    } catch (err) { next(err); }
});

// POST /api/invasion/attack
router.post('/attack', async (req, res, next) => {
    try {
        const { damage } = req.body;
        const invasion = req.user.activeInvasion;

        if (!invasion || !invasion.monarch) {
            return res.status(400).json({ error: 'No active invasion' });
        }

        // Check if Beast timer expired
        if (invasion.monarch.includes('Beast') && invasion.expiresAt && new Date() > new Date(invasion.expiresAt)) {
            // Reset Beast HP and expiresAt
            invasion.hp = invasion.maxHp;
            invasion.expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
            await req.user.save();
            return res.json({ 
                success: true, 
                message: 'The Beast evaded your attacks and regenerated completely! Time extended by 3 hours.', 
                invasion 
            });
        }

        invasion.hp -= damage || 100;
        
        if (invasion.hp <= 0) {
            // Defeated!
            req.user.activeInvasion = { monarch: null, hp: 0, maxHp: 0, expiresAt: null, frozenTabs: [] };
            
            // Grant massive EXP
            const { stats, leveledUp, newRank } = processExpGain(req.user.stats, 50000);
            req.user.stats = stats;
            req.user.rank = newRank;
            req.user.markModified('stats');
            
            await req.user.save();
            return res.json({ 
                success: true, 
                defeated: true, 
                message: 'Monarch defeated! You gained massive EXP.', 
                stats: req.user.stats,
                rank: req.user.rank
            });
        }

        await req.user.save();
        res.json({ success: true, defeated: false, invasion });
    } catch (err) { next(err); }
});

module.exports = router;
