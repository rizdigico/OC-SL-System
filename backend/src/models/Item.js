const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['consumable', 'gear'], required: true },
        cost: { type: Number, required: true, default: 0 },
        effect: { type: mongoose.Schema.Types.Mixed }, // Arbitrary effect data, e.g., { hp: 50 } or { strength: 5 }
        description: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
