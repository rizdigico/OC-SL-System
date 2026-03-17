const mongoose = require('mongoose');

const objectiveSchema = new mongoose.Schema({
    description: String,
    target: Number,
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
}, { _id: false });

const activeQuestSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, enum: ['daily', 'penalty', 'urgent', 'mob', 'boss', 'job_change', 'architects_demise'], required: true },
        difficulty: { type: String, enum: ['E', 'D', 'C', 'B', 'A', 'S'], required: true },
        isRedGate: { type: Boolean, default: false },

        objectives: [objectiveSchema],

        rewards: {
            exp: Number,
            statPoints: Number,
            items: [String],
        },

        status: {
            type: String,
            enum: ['active', 'completed', 'failed', 'expired'],
            default: 'active',
        },

        expiresAt: Date,
    },
    { timestamps: true }
);

activeQuestSchema.index({ userId: 1, status: 1 });
activeQuestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ActiveQuest', activeQuestSchema);
