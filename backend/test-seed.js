const mongoose = require('mongoose');
require('dotenv').config({ path: './src/.env' });
const User = require('./src/models/User');
const Item = require('./src/models/Item');
const Skill = require('./src/models/Skill');

// Connect to local MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/test-system-db').then(async () => {
    console.log("Connected to DB.");

    try {
        await Item.deleteMany({});
        await Skill.deleteMany({});

        const testItem = await Item.create({
            name: "Lesser Healing Potion",
            type: "consumable",
            cost: 50,
            effect: { vitality: 10 },
            description: "Heals 10 Vitality"
        });

        const testSkill = await Skill.create({
            name: "Dash",
            type: "active",
            cost: 100,
            mpCost: 5,
            effect: { agility: 5 },
            description: "A quick dash to increase evasion."
        });

        console.log("Test Item:");
        console.log(testItem);

        console.log("\nTest Skill:");
        console.log(testSkill);

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
