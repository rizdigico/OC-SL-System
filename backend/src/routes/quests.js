const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const ActiveQuest = require('../models/ActiveQuest');
const { processExpGain, applyProgressionGates } = require('../services/leveling');

router.use(authGuard);

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Returns true when the user is locked into their Job Change Quest and the
 * requested quest type is a regular daily quest.
 */
function isDailyBlocked(user, questType) {
    if (questType === 'daily' && user.isTranscended) return true;
    return user.jobChangeLocked && questType === 'daily';
}

// GET /api/quests — list active quests
// Daily quests are hidden while the Job Change gate is active.
router.get('/', async (req, res, next) => {
    try {
        const filter = { userId: req.user._id, status: 'active' };
        if (req.user.jobChangeLocked) {
            // Surface only the Job Change Quest during the gate window
            filter.type = 'job_change';
        } else if (req.user.architectsDemiseLocked) {
            filter.type = 'architects_demise';
        }
        const quests = await ActiveQuest.find(filter);
        res.json(quests);
    } catch (err) { next(err); }
});

// POST /api/quests — create / accept a quest
router.post('/', async (req, res, next) => {
    try {
        if (isDailyBlocked(req.user, req.body.type)) {
            if (req.user.isTranscended) {
                return res.status(403).json({
                    error: 'SYSTEM_BYPASSED',
                    message: 'The System no longer controls you. Daily Quests are obsolete.',
                });
            }
            return res.status(403).json({
                error: 'JOB_CHANGE_QUEST_LOCKED',
                message: 'You must complete your Job Change Quest before accepting daily quests.',
            });
        }
        let questData = { userId: req.user._id, ...req.body };

        // The Mutation Engine: 5% chance a daily quest mutates into a Red Gate
        if (questData.type === 'daily') {
            const isMutation = Math.random() < 0.05;
            if (isMutation) {
                questData.isRedGate = true;

                // Double difficulty
                if (questData.objectives && questData.objectives.length > 0) {
                    questData.objectives = questData.objectives.map(obj => ({
                        ...obj,
                        target: Math.ceil(obj.target * 2)
                    }));
                }

                // Double the rewards
                if (questData.rewards) {
                    if (questData.rewards.exp) questData.rewards.exp = Math.ceil(questData.rewards.exp * 2);
                    if (questData.rewards.gold) questData.rewards.gold = Math.ceil(questData.rewards.gold * 2);
                }
            }
        }

        const quest = await ActiveQuest.create(questData);
        res.status(201).json(quest);
    } catch (err) { next(err); }
});

// PATCH /api/quests/:id/progress — update objective progress
router.patch('/:id/progress', async (req, res, next) => {
    try {
        const quest = await ActiveQuest.findOne({ _id: req.params.id, userId: req.user._id });
        if (!quest) return res.status(404).json({ error: 'Quest not found' });

        const { objectiveIndex, increment } = req.body;
        const obj = quest.objectives[objectiveIndex];
        if (!obj) return res.status(400).json({ error: 'Invalid objective index' });

        obj.progress = Math.min(obj.progress + (increment || 1), obj.target);
        if (obj.progress >= obj.target) obj.completed = true;

        await quest.save();
        res.json(quest);
    } catch (err) { next(err); }
});

// POST /api/quests/:id/complete — submit quest for completion
router.post('/:id/complete', async (req, res, next) => {
    try {
        const quest = await ActiveQuest.findOne({ _id: req.params.id, userId: req.user._id });
        if (!quest) return res.status(404).json({ error: 'Quest not found' });
        if (quest.status !== 'active') return res.status(400).json({ error: 'Quest not active' });

        const allDone = quest.objectives.every((o) => o.completed);
        if (!allDone) return res.status(400).json({ error: 'Objectives incomplete' });

        quest.status = 'completed';
        await quest.save();

        // Grant rewards
        const user = req.user;
        let earnedExp = quest.rewards.exp || 0;

        // Apply Plague Invasion Rot Effect (10% EXP deduction)
        if (user.activeInvasion && user.activeInvasion.monarch && user.activeInvasion.monarch.includes('Plague')) {
            earnedExp = Math.floor(earnedExp * 0.9);
        }

        const { stats, leveledUp, newRank } = processExpGain(user.stats, earnedExp);
        user.stats = stats;
        user.stats.statPoints = (user.stats.statPoints || 0) + (quest.rewards.statPoints || 0);
        user.stats.gold = (user.stats.gold || 0) + (quest.rewards.gold || 0);
        user.rank = newRank;

        // Unlock the Job Change gate when the player completes their Job Change Quest
        if (quest.type === 'job_change' && user.jobChangeLocked) {
            user.jobChangeLocked = false;
            user.jobChangeUnlocked = true;
        }

        // Transcendence
        if (quest.type === 'architects_demise' && user.architectsDemiseLocked) {
            user.architectsDemiseLocked = false;
            user.isTranscended = true;
        }

        // Check for new progression gates triggered by the EXP gain
        const { gates } = applyProgressionGates(user);

        user.markModified('stats');
        await user.save();

        res.json({
            success: true,
            quest,
            leveledUp,
            stats: user.stats,
            rank: user.rank,
            gates,  // e.g. ['JOB_CHANGE_QUEST'] — client uses this to show gate UI
        });
    } catch (err) { next(err); }
});

module.exports = router;
