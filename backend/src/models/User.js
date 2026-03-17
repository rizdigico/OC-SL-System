const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        // Identity (AES-256-GCM encrypted at rest)
        email: String,
        emailHash: { type: String, index: true },
        displayName: String,
        avatarUrl: String,

        // OAuth
        oauthProvider: { type: String, enum: ['google', 'github', 'dev'] },
        oauthId: String,

        // RPG Stats
        stats: {
            level: { type: Number, default: 1 },
            exp: { type: Number, default: 0 },
            strength: { type: Number, default: 1 },
            agility: { type: Number, default: 1 },
            vitality: { type: Number, default: 1 },
            sense: { type: Number, default: 1 },
            intelligence: { type: Number, default: 1 },
            statPoints: { type: Number, default: 0 },
            gold: { type: Number, default: 0 },
            mana: { type: Number, default: 10 },
            fatigue: { type: Number, default: 0 },
        },

        isPenalized: { type: Boolean, default: false },
        rank: { type: String, enum: ['E', 'D', 'C', 'B', 'A', 'S', 'National', 'Monarch'], default: 'E' },

        // Titles system — earned titles with per-stat multipliers
        titles: [
            {
                name: { type: String, required: true },
                statMultipliers: [
                    {
                        stat: {
                            type: String,
                            enum: ['strength', 'agility', 'vitality', 'sense', 'intelligence'],
                            required: true,
                        },
                        multiplier: { type: Number, default: 1.0 },
                    }
                ],
            }
        ],
        equippedTitle: { type: String, default: null },   // name of the active title

        // Legacy single title field preserved for display
        title: { type: String, default: 'Shadow Initiate' },

        // Narrative progression
        currentStoryArc: { type: String, default: null },

        // Demon Castle raid floor tracker
        demonCastleFloor: { type: Number, default: 0 },

        // Progression gates
        jobChangeLocked: { type: Boolean, default: false }, // true → locked out of daily quests
        jobChangeUnlocked: { type: Boolean, default: false }, // true → gate permanently cleared
        architectsDemiseLocked: { type: Boolean, default: false },
        isTranscended: { type: Boolean, default: false }, // true → Level 100 Transcendence
        
        // Prestige System
        prestigeMultiplier: { type: Number, default: 1 },
        unlockedCup: { type: Boolean, default: false },

        // Equipment
        equippedWeapon: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        equippedArmor: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },

        // Economy & Arsenal
        activeRaid: {
            bossName: { type: String, default: null },
            maxHp: { type: Number, default: 0 },
            currentHp: { type: Number, default: 0 },
            daysRemaining: { type: Number, default: 0 },
            penaltyRegen: { type: Number, default: 0 }
        },
        activeInvasion: {
            monarch: { type: String, default: null },
            hp: { type: Number, default: 0 },
            maxHp: { type: Number, default: 0 },
            expiresAt: { type: Date, default: null },
            frozenTabs: [{ type: String }]
        },
        inventory: [
            {
                item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
                quantity: { type: Number, default: 1 },
            }
        ],
        skills: [
            {
                skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
                usageCount: { type: Number, default: 0 },
                level: { type: Number, default: 1 }
            }
        ],
        shadowArmy: [
            {
                name: String,
                rank: String,
                stats: mongoose.Schema.Types.Mixed,
                acquiredAt: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

userSchema.index({ oauthProvider: 1, oauthId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
