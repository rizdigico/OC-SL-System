const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        agentId: {
            type: String,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        rank: {
            type: String,
            enum: ['Scout', 'Knight', 'Commander', 'General', 'Marshal'],
            default: 'Scout',
        },
        status: {
            type: String,
            enum: ['Idle', 'Executing', 'Success', 'Failed', 'Offline'],
            default: 'Offline',
        },
        currentTask: {
            type: String,
            default: '',
            trim: true,
        },
        successRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        totalTasksCompleted: {
            type: Number,
            default: 0,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Compound unique: one agentId per user
agentSchema.index({ userId: 1, agentId: 1 }, { unique: true });

module.exports = mongoose.model('Agent', agentSchema);
