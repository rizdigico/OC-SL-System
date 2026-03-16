const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['active', 'passive'], required: true },
        cost: { type: Number, required: true, default: 0 }, // Skill points or gold cost
        mpCost: { type: Number, default: 0 }, // Mana cost when used
        effect: { type: mongoose.Schema.Types.Mixed }, // Arbitrary effect data
        description: { type: String, default: '' },
        usageCount: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);
