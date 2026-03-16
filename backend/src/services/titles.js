/**
 * titles.js — Title multiplier utilities
 *
 * Titles carry per-stat multipliers (e.g. { stat: 'intelligence', multiplier: 1.10 }).
 * When a title is equipped the caller must always work from the boosted stats rather
 * than the raw document values so that all downstream systems (combat, rewards, etc.)
 * reflect the title bonus automatically.
 */

/**
 * Returns a plain-object copy of user.stats with every multiplier from the
 * currently equipped title applied.  Non-numeric fields and fields not listed
 * in the title's statMultipliers are carried through unchanged.
 *
 * @param {import('mongoose').Document} user
 * @returns {Record<string, number>} boosted stats
 */
function getTitleBoostedStats(user) {
    // Work on a plain copy so we never mutate the Mongoose document
    const stats = user.stats.toObject
        ? user.stats.toObject()
        : { ...user.stats };

    if (!user.equippedTitle) return stats;

    const title = (user.titles || []).find(t => t.name === user.equippedTitle);
    if (!title) return stats;

    for (const { stat, multiplier } of title.statMultipliers) {
        if (typeof stats[stat] === 'number') {
            // Floor to keep values as integers consistent with the rest of the system
            stats[stat] = Math.floor(stats[stat] * multiplier);
        }
    }

    return stats;
}

/**
 * Returns a human-readable summary of the multipliers a title grants,
 * useful for response payloads that want to show the player what fired.
 *
 * e.g. { 'intelligence': 1.1 } → ["+10% intelligence"]
 *
 * @param {{ statMultipliers: Array<{ stat: string, multiplier: number }> } | null} title
 * @returns {string[]}
 */
function describeMultipliers(title) {
    if (!title) return [];
    return title.statMultipliers.map(({ stat, multiplier }) => {
        const pct = Math.round((multiplier - 1) * 100);
        const sign = pct >= 0 ? '+' : '';
        return `${sign}${pct}% ${stat}`;
    });
}

module.exports = { getTitleBoostedStats, describeMultipliers };
