const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const Dungeon = require('../models/Dungeon');
const ActiveQuest = require('../models/ActiveQuest');

router.use(authGuard);

// GET /api/dungeons/active - Fetch the user's active dungeon and sub-mobs
router.get('/active', async (req, res, next) => {
    try {
        const dungeon = await Dungeon.findOne({ userId: req.user._id, isCleared: false })
            .populate('mobQuests')
            .populate('bossQuest');

        if (!dungeon) {
            return res.json({ active: false, dungeon: null });
        }

        res.json({ active: true, dungeon });
    } catch (err) { next(err); }
});

// POST /api/dungeons/:id/boss-unlock - Unlock Boss by verifying Mob completion
router.post('/:id/boss-unlock', async (req, res, next) => {
    try {
        const dungeon = await Dungeon.findOne({ _id: req.params.id, userId: req.user._id })
            .populate('mobQuests');

        if (!dungeon) {
            return res.status(404).json({ error: 'Dungeon not found' });
        }

        // Verify all mobQuests are completed
        const allCleared = dungeon.mobQuests.every(mob => mob.status === 'completed');

        if (allCleared) {
            // Unlocking logic might mean returning success in this microservice, since quest tracking 
            // relies on the frontend seeing the boss is now 'unlocked'. The backend boolean validates it.
            return res.json({ success: true });
        } else {
            return res.status(400).json({ success: false, message: 'All initial mobs must be completed to unlock the Boss.' });
        }
    } catch (err) { next(err); }
});

module.exports = router;
