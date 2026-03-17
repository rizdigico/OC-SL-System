const cron = require('node-cron');
const User = require('../models/User');
const ActiveQuest = require('../models/ActiveQuest');

const initPenaltyCron = () => {
    // Run at 00:00 server time every day
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running Penalty Zone Check...');
        try {
            // Find all active daily quests
            const activeDailyQuests = await ActiveQuest.find({ type: 'daily', status: 'active' }).populate('userId');

            const usersToPenalize = activeDailyQuests
                .filter(q => q.userId && !q.userId.isTranscended)
                .map(q => q.userId._id.toString());

            const userIdsToPenalize = [...new Set(usersToPenalize)];

            if (userIdsToPenalize.length === 0) {
                console.log('[CRON] No users to penalize today.');
                return;
            }

            console.log(`[CRON] Penalizing ${userIdsToPenalize.length} users...`);

            // Mark those daily quests as failed
            await ActiveQuest.updateMany(
                { type: 'daily', status: 'active', userId: { $in: userIdsToPenalize } },
                { $set: { status: 'failed' } }
            );

            // Update users to isPenalized: true
            await User.updateMany(
                { _id: { $in: userIdsToPenalize } },
                { $set: { isPenalized: true } }
            );

            // Generate penalty quests for those users
            const penaltyQuests = userIdsToPenalize.map(userId => ({
                userId,
                title: 'Penalty Quest: Survive',
                description: 'You failed to complete your Daily Quest. Survive the Penalty Zone.',
                type: 'penalty',
                difficulty: 'E',
                objectives: [{
                    description: 'Survive',
                    target: 1,
                    progress: 0,
                    completed: false
                }],
                status: 'active',
                rewards: {
                    exp: 0,
                    statPoints: 0,
                    items: []
                }
            }));

            await ActiveQuest.insertMany(penaltyQuests);

            // Handle activeRaids for all users, not just those who failed
            const allUsersWithRaid = await User.find({ 'activeRaid.bossName': { $ne: null } });

            for (const user of allUsersWithRaid) {
                let raid = user.activeRaid;
                let userModified = false;

                // Did this user fail dailies today? (check if they are in userIdsToPenalize)
                if (userIdsToPenalize.includes(user._id.toString())) {
                    // Missed daily: heal boss penalty
                    raid.currentHp += raid.penaltyRegen;
                    if (raid.currentHp > raid.maxHp) raid.currentHp = raid.maxHp;
                    console.log(`[CRON] Healed ${raid.bossName} for ${raid.penaltyRegen} due to missed daily for user ${user._id}`);
                }

                // Decrement days remaining
                raid.daysRemaining -= 1;
                userModified = true;

                if (raid.currentHp <= 0) {
                    console.log(`[CRON] Boss ${raid.bossName} killed by user ${user._id}!`);
                    // Clear raid, grant EXP, add to shadow army
                    user.stats.exp += 10000; // Massive EXP
                    user.shadowArmy.push({
                        name: raid.bossName,
                        rank: 'Boss',
                        stats: { attack: 100, defense: 100 },
                        acquiredAt: new Date()
                    });
                    user.activeRaid = null;
                } else if (raid.daysRemaining <= 0) {
                    console.log(`[CRON] Raid failed: ${raid.bossName} escaped from user ${user._id}`);
                    // Boss escaped
                    user.activeRaid = null;
                }

                if (userModified) {
                    await user.save();
                }
            }

            console.log('[CRON] Penalty Zone Check completed successfully.');
        } catch (error) {
            console.error('[CRON] Error running Penalty Zone Check:', error);
        }
    });
};

module.exports = { initPenaltyCron };
