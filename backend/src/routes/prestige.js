const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const User = require('../models/User');

// POST /api/prestige/reincarnate
router.post('/reincarnate', authGuard, async (req, res, next) => {
    try {
        const user = req.user;

        // Ensure they have actually unlocked the cup
        if (!user.unlockedCup) {
            return res.status(403).json({ error: 'You have not unlocked the Cup of Reincarnation.' });
        }

        // Apply Prestige Mutators
        user.stats.level = 1;
        user.stats.exp = 0;
        user.stats.statPoints = 0; // Or carry over bonus points if we wanted
        // Reset base stats but keep the user alive
        user.stats.strength = 1;
        user.stats.agility = 1;
        user.stats.vitality = 1;
        user.stats.sense = 1;
        user.stats.intelligence = 1;
        user.stats.mana = 10;
        user.stats.fatigue = 0;
        // Keep gold or wipe it? Let's leave gold for now, prompt says level, exp, floor, inventory.
        
        user.demonCastleFloor = 0;
        user.inventory = [];
        
        user.isTranscended = false;
        
        // Increase global multiplier
        user.prestigeMultiplier = (user.prestigeMultiplier || 1) + 1.5;

        // Grant 'Dragon Monarch' Title
        const dragonMonarchTitle = {
            name: 'Dragon Monarch',
            statMultipliers: [
                { stat: 'strength', multiplier: 2.0 },
                { stat: 'agility', multiplier: 2.0 },
                { stat: 'vitality', multiplier: 2.0 },
                { stat: 'sense', multiplier: 2.0 },
                { stat: 'intelligence', multiplier: 2.0 }
            ]
        };

        const titleExists = user.titles.some(t => t.name === 'Dragon Monarch');
        if (!titleExists) {
            user.titles.push(dragonMonarchTitle);
        }
        user.equippedTitle = 'Dragon Monarch';
        user.title = 'Dragon Monarch';

        // Lock the cup again
        user.unlockedCup = false;

        user.markModified('stats');
        user.markModified('titles');
        await user.save();

        res.json({ success: true, message: 'Reincarnation successful. Welcome back to the System.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
