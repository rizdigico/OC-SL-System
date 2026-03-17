const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const ActiveQuest = require('./src/models/ActiveQuest');

const runSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shadow_quests');

        console.log('Connected to MongoDB. Clearing existing data...');
        // We clear existing data to ensure idempotent stress-testing
        await User.deleteMany({});
        await ActiveQuest.deleteMany({});
        console.log('Existing users and quests cleared.');

        console.log('Generating 500 dummy users...');
        const users = [];
        const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'National', 'Monarch'];

        for (let i = 0; i < 500; i++) {
            const level = Math.floor(Math.random() * 100) + 1; // Level 1 to 100

            // Power curve calculation: EXP = 100 * (Level^1.5)
            const exp = Math.floor(100 * Math.pow(level, 1.5));
            const rank = ranks[Math.floor(Math.random() * ranks.length)];

            const user = {
                email: `user${i}@example.com`,
                emailHash: `hash${i}`,
                displayName: `Player${i}`,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Player${i}`,
                oauthProvider: Math.random() > 0.5 ? 'google' : 'github',
                oauthId: `oauth_${i}_${Date.now()}`,
                stats: {
                    level,
                    exp,
                    strength: Math.floor(Math.random() * 50) + level,
                    agility: Math.floor(Math.random() * 50) + level,
                    vitality: Math.floor(Math.random() * 50) + level,
                    sense: Math.floor(Math.random() * 50) + level,
                    intelligence: Math.floor(Math.random() * 50) + level,
                    statPoints: Math.floor(Math.random() * 20),
                    gold: Math.floor(Math.random() * 10000),
                    fatigue: Math.floor(Math.random() * 100),
                },
                rank,
                title: level > 50 ? 'Shadow Monarch' : 'Shadow Initiate',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            users.push(user);
        }

        const insertedUsers = await User.insertMany(users);
        console.log(`Inserted ${insertedUsers.length} users successfully.`);

        console.log('Generating 1,000 completed dummy daily quests...');
        const quests = [];
        const difficultyRanks = ['E', 'D', 'C', 'B', 'A', 'S'];

        for (let i = 0; i < 1000; i++) {
            // Randomly select a user to assign the quest to
            const randomUser = insertedUsers[Math.floor(Math.random() * insertedUsers.length)];

            const quest = {
                userId: randomUser._id,
                title: `Daily Quest: Push-ups ${i}`,
                description: `Complete 100 push-ups for quest ${i}`,
                type: 'daily',
                difficulty: difficultyRanks[Math.floor(Math.random() * difficultyRanks.length)],
                objectives: [
                    {
                        description: 'Push-ups',
                        target: 100,
                        progress: 100,
                        completed: true,
                    }
                ],
                rewards: {
                    exp: Math.floor(Math.random() * 500) + 100,
                    statPoints: Math.floor(Math.random() * 5),
                    items: ['Small HP Potion'],
                },
                status: 'completed',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hrs
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            quests.push(quest);
        }

        const insertedQuests = await ActiveQuest.insertMany(quests);
        console.log(`Inserted ${insertedQuests.length} quests successfully.`);

        console.log('Seeding complete! Power curve progression validated.');
        process.exit(0);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

runSeed();
