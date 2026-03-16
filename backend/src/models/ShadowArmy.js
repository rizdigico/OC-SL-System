const mongoose = require('mongoose');

const shadowArmySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
        shadows: [
            {
                name: String,
                rank: { type: String, enum: ['Normal', 'Elite', 'Knight', 'General', 'Commander', 'Marshal'] },
                acquiredAt: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('ShadowArmy', shadowArmySchema);
