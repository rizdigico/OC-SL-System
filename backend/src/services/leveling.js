const BASE_EXP = 100;

const RANK_TIERS = ['E', 'D', 'C', 'B', 'A', 'S', 'National', 'Monarch'];

function expForLevel(level) {
    return Math.floor(BASE_EXP * Math.pow(level, 1.5));
}

function processExpGain(stats, expGained, prestigeMultiplier = 1) {
    stats.exp += Math.floor(expGained * prestigeMultiplier);
    let leveledUp = false;

    while (stats.exp >= expForLevel(stats.level)) {
        stats.exp -= expForLevel(stats.level);
        stats.level += 1;
        stats.statPoints += 5;
        leveledUp = true;
    }

    // Rank promotion every 10 levels
    const rankIndex = Math.min(Math.floor((stats.level - 1) / 10), RANK_TIERS.length - 1);
    const newRank = RANK_TIERS[rankIndex];

    return { stats, leveledUp, newRank };
}

/**
 * applyProgressionGates — run after EXP is granted and user.stats has been updated.
 *
 * Checks milestone thresholds on the *full user document* and mutates it in-place
 * where a gate should trigger. The caller is responsible for calling user.save().
 *
 * Returns a `gates` array describing every gate that fired this call so the
 * response layer can surface relevant UI events to the client.
 *
 * @param {import('mongoose').Document} user  — the Mongoose User document
 * @returns {{ gates: string[] }}
 */
function applyProgressionGates(user) {
    const gates = [];

    // ── Level 40 Job Change Gate ───────────────────────────────────────────────
    // Fires exactly once: only when the user first reaches level 40 and the gate
    // has never been cleared (jobChangeUnlocked). Once the Job Change Quest is
    // completed the caller sets jobChangeUnlocked = true, which prevents a
    // re-trigger on subsequent saves.
    if (
        user.stats.level >= 40 &&
        !user.jobChangeLocked &&
        !user.jobChangeUnlocked
    ) {
        user.jobChangeLocked = true;
        gates.push('JOB_CHANGE_QUEST');
    }

    // ── Level 100 Transcendence Gate ───────────────────────────────────────────
    if (
        user.stats.level >= 100 &&
        !user.isTranscended &&
        !user.architectsDemiseLocked
    ) {
        user.architectsDemiseLocked = true;
        gates.push('ARCHITECTS_DEMISE_QUEST');
    }

    return { gates };
}

module.exports = { expForLevel, processExpGain, applyProgressionGates, RANK_TIERS };
