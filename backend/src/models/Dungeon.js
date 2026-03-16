const mongoose = require('mongoose');

const dungeonSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true },
        storyBlock: { type: String, required: true }, // Identifier for narrative content (e.g. 'goblins-1')
        requiredLevel: { type: Number, default: 1 },
        mobQuests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ActiveQuest' }],
        bossQuest: { type: mongoose.Schema.Types.ObjectId, ref: 'ActiveQuest' },
        isCleared: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Dungeon', dungeonSchema);
