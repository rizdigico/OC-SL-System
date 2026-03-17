const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const Skill = require('../models/Skill');
const User = require('../models/User');

router.use(authGuard);

// GET /api/skills - Return all available skills
router.get('/', async (req, res, next) => {
    try {
        const skills = await Skill.find({});
        res.json(skills);
    } catch (err) { next(err); }
});

// POST /api/skills/unlock - Unlock a skill
router.post('/unlock', async (req, res, next) => {
    try {
        const { skillId } = req.body;

        const skill = await Skill.findById(skillId);
        if (!skill) return res.status(404).json({ error: 'Skill not found' });

        const user = await User.findById(req.user._id);

        // Check if already unlocked
        if (user.skills.includes(skillId)) {
            return res.status(400).json({ error: 'Skill already unlocked' });
        }

        // Assuming cost is in gold or statPoints (we'll deduct gold for now as general cost, or stat points)
        // Let's say cost is deducted from Gold for Phase A.
        if (user.stats.gold < skill.cost) {
            return res.status(400).json({ error: 'Insufficient funds for skill' });
        }

        user.stats.gold -= skill.cost;
        user.skills.push({ skill: skillId });

        await user.save();
        res.json({ message: 'Skill unlocked successfully', user });

    } catch (err) { next(err); }
});

module.exports = router;
