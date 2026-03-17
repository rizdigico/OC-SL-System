const User = require('../models/User');
const ShadowInventory = require('../models/ShadowInventory');
const ActiveQuest = require('../models/ActiveQuest');
const Dungeon = require('../models/Dungeon');
const Item = require('../models/Item');
const { encrypt, hmacIndex } = require('../services/encryption');

async function seed() {
    const existing = await User.findOne({ oauthProvider: 'dev', oauthId: 'test-player-001' });
    if (existing) { console.log('[SEED] Test data already exists — skipping'); return; }

    console.log('[SEED] Populating test data…');

    // Create Shop Items
    const items = await Item.insertMany([
        { name: "Kasaka's Venom Fang", type: 'gear', cost: 1500, effect: { slot: 'weapon', strength: 10, paralysis: true }, description: 'A dagger made from the fang of Kasaka.' },
        { name: 'Knight Killer', type: 'gear', cost: 3000, effect: { slot: 'weapon', strength: 25 }, description: 'A dagger specialized in piercing armor.' },
        { name: "High Orc's Health Potion", type: 'consumable', cost: 500, effect: { vitality: 50 }, description: 'Restores a large amount of health.' },
        { name: 'Essence of the Magic Beast', type: 'consumable', cost: 1000, effect: { intelligence: 10 }, description: 'Permanently increases intelligence.' }
    ]);

    // Test Player
    const user = await User.create({
        oauthProvider: 'dev',
        oauthId: 'test-player-001',
        email: encrypt('hunter@thesystem.dev'),
        emailHash: hmacIndex('hunter@thesystem.dev'),
        displayName: encrypt('Sung Jin-Woo'),
        avatarUrl: '',
        stats: {
            level: 5, exp: 0, strength: 8, agility: 6, vitality: 5,
            sense: 4, intelligence: 7, statPoints: 10, gold: 5000, fatigue: 0,
        },
        rank: 'E',
        title: 'Shadow Initiate',
        inventory: [{ item: items[2]._id, quantity: 5 }]
    });

    // Inventory with starter items
    await ShadowInventory.create({
        userId: user._id,
        items: [
            {
                name: 'Rusty Dagger', type: 'weapon', rarity: 'common', rank: 'Normal',
                authorityBuff: '', stats: { attack: 5, defense: 0, speed: 2, magic: 0 },
                quantity: 1, equipped: true,
            },
            {
                name: 'Shadow of Iron', type: 'shadow', rarity: 'rare', rank: 'Normal',
                authorityBuff: '1.15x strength when deployed',
                stats: { attack: 12, defense: 10, speed: 6, magic: 3 },
                quantity: 1, equipped: false,
            },
        ],
        maxSlots: 30,
    });

    // Sample quests configured for a Dungeon
    const tomorrow = new Date(Date.now() + 86400000);
    const generatedQuests = await ActiveQuest.insertMany([
        {
            userId: user._id, title: 'Goblin Grunt', description: 'Defeat a Goblin Grunt.',
            type: 'mob', difficulty: 'E',
            objectives: [{ description: 'Kill 1 Goblin Grunt', target: 1, progress: 0, completed: false }],
            rewards: { exp: 20, statPoints: 0, items: [] },
            status: 'active', expiresAt: tomorrow,
        },
        {
            userId: user._id, title: 'Goblin Archer', description: 'Defeat a Goblin Archer.',
            type: 'mob', difficulty: 'E',
            objectives: [{ description: 'Kill 1 Goblin Archer', target: 1, progress: 0, completed: false }],
            rewards: { exp: 25, statPoints: 0, items: [] },
            status: 'active', expiresAt: tomorrow,
        },
        {
            userId: user._id, title: 'Goblin Shaman', description: 'Defeat a Goblin Shaman.',
            type: 'mob', difficulty: 'E',
            objectives: [{ description: 'Kill 1 Goblin Shaman', target: 1, progress: 0, completed: false }],
            rewards: { exp: 30, statPoints: 0, items: [] },
            status: 'active', expiresAt: tomorrow,
        },
        {
            userId: user._id, title: 'Goblin Boss', description: 'Defeat the Hobgoblin Chieftain.',
            type: 'boss', difficulty: 'C',
            objectives: [{ description: 'Kill 1 Hobgoblin Chieftain', target: 1, progress: 0, completed: false }],
            rewards: { exp: 300, statPoints: 5, items: [] },
            status: 'active', expiresAt: tomorrow,
        },
    ]);

    // Dungeon
    await Dungeon.create({
        userId: user._id,
        title: 'E-Rank Dungeon: Goblin Hideout',
        storyBlock: 'goblins-1',
        requiredLevel: 5,
        mobQuests: [generatedQuests[0]._id, generatedQuests[1]._id, generatedQuests[2]._id],
        bossQuest: generatedQuests[3]._id,
        isCleared: false
    });

    console.log('[SEED] Done — Test Player created with inventory + E-Rank Dungeon');
}

module.exports = seed;
