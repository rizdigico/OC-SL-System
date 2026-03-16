const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: String,
    type: { type: String, enum: ['weapon', 'armor', 'potion', 'artifact', 'key', 'shadow'] },
    rarity: { type: String, enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'] },
    rank: { type: String, enum: ['Normal', 'Elite', 'Knight', 'General', 'Commander', 'Marshal'] },
    authorityBuff: String,
    stats: {
        attack: { type: Number, default: 0 },
        defense: { type: Number, default: 0 },
        speed: { type: Number, default: 0 },
        magic: { type: Number, default: 0 },
    },
    quantity: { type: Number, default: 1 },
    equipped: { type: Boolean, default: false },
    acquiredAt: { type: Date, default: Date.now },
}, { _id: true });

const shadowInventorySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
        items: [itemSchema],
        maxSlots: { type: Number, default: 30 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ShadowInventory', shadowInventorySchema);
