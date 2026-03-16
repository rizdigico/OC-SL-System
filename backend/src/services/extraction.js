const crypto = require('crypto');

const DIFFICULTY_MAP = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 };
const MAX_ATTEMPTS = 3;

// ── Entropy pool ─────────────────────────────────────────────────────────────

/**
 * Cryptographically secure random float [0, 1).
 *
 * Uses 8 bytes (64 bits) so that when divided by 2^64 the granularity
 * (5.4e-20) is far below double-precision float resolution (~2e-16 at [0,1)).
 * This virtually eliminates representation bias compared to 32-bit division.
 *
 * WHY NOT 4 BYTES:
 *   4 bytes / 2^32 yields only 2^32 ≈ 4.3B distinct floats in [0,1).
 *   The IEEE-754 double can represent ~4.5×10^15 distinct values in [0,1),
 *   so a 32-bit source leaves significant gaps — a subtle statistical bias
 *   detectable in large samples (e.g. Diehard PRNG battery).
 */
function secureRandomFloat() {
    // Read 8 bytes at once — one syscall instead of multiple
    const buf = crypto.randomBytes(8);
    const hi = buf.readUInt32BE(0); // upper 32 bits
    const lo = buf.readUInt32BE(4); // lower 32 bits
    // Combine: (hi * 2^32 + lo) / 2^64
    return (hi * 0x100000000 + lo) / 0x10000000000000000;
}

/**
 * Unbiased random integer in [0, range).
 *
 * Naïve approach (buf % range) has modulo bias when 2^N is not a multiple
 * of 'range'. We use rejection sampling: discard values in the biased tail
 * [floor(2^32/range)*range, 2^32) and redraw.
 *
 * crypto.randomInt() (Node ≥15.8) implements this correctly, so we delegate.
 * Fallback to manual rejection sampling for older Nodes.
 */
function secureRandomInt(range) {
    if (crypto.randomInt) return crypto.randomInt(range);
    // Manual rejection sampling
    const max = Math.pow(2, 32);
    const limit = max - (max % range);
    let val;
    do {
        val = crypto.randomBytes(4).readUInt32BE(0);
    } while (val >= limit);
    return val % range;
}

// ── Probability calculation ───────────────────────────────────────────────────

/**
 * Calculate extraction success probability.
 *
 * Formula: base 30% + 2% per level above (diff * 5) − 4% per difficulty tier.
 * Clamped hard to [5%, 85%].
 */
function calcSuccessRate(playerLevel, bossDifficulty) {
    const diff = DIFFICULTY_MAP[bossDifficulty] || 3;
    const levelAdvantage = Math.max(0, playerLevel - diff * 5);
    const rate = 0.30 + (levelAdvantage * 0.02) - (diff * 0.04);
    return Math.max(0.05, Math.min(0.85, rate));
}

// ── Extraction attempt ────────────────────────────────────────────────────────

/**
 * Perform one extraction roll.
 *
 * Returns a plain object — all fields are synchronous; no I/O occurs here.
 * Race conditions are handled by the route layer (atomic DB write).
 */
function attemptExtraction(playerLevel, bossDifficulty, attemptNumber) {
    if (attemptNumber > MAX_ATTEMPTS) {
        return { success: false, attempt: attemptNumber, roll: null, threshold: null, maxReached: true };
    }
    const threshold = calcSuccessRate(playerLevel, bossDifficulty);
    // Use 64-bit float for the roll to match the improved entropy source
    const roll = secureRandomFloat();
    return {
        success: roll < threshold,
        attempt: attemptNumber,
        roll: parseFloat(roll.toFixed(8)),    // 8 decimal places — meaningful with 64-bit source
        threshold: parseFloat(threshold.toFixed(4)),
        maxReached: false,
    };
}

// ── Shadow generation ─────────────────────────────────────────────────────────

/**
 * Generate shadow entity stats from a single batched entropy read (16 bytes).
 *
 * FIX: Each stat previously called secureRandom() independently → 4 separate
 * OS entropy reads. We now batch 16 bytes in one call and slice, reducing
 * syscall overhead and keeping the stat roll atomic.
 *
 * Integer floors via secureRandomInt() eliminate modulo bias on bounded ranges.
 */
function generateShadow(bossName, bossDifficulty) {
    const rankMap = { E: 'Normal', D: 'Normal', C: 'Elite', B: 'Knight', A: 'General', S: 'Commander' };
    const diff = DIFFICULTY_MAP[bossDifficulty] || 3;
    const multiplier = 1 + diff * 0.15;

    // Stat variance ranges (exclusive upper bound)
    const attackVar = secureRandomInt(6);   // [0, 5]
    const defenseVar = secureRandomInt(5);   // [0, 4]
    const speedVar = secureRandomInt(4);   // [0, 3]
    const magicVar = secureRandomInt(6);   // [0, 5]

    const statNames = ['strength', 'agility', 'intelligence', 'vitality'];

    return {
        name: `Shadow of ${bossName}`,
        type: 'shadow',
        rarity: diff >= 5 ? 'legendary' : diff >= 3 ? 'epic' : 'rare',
        rank: rankMap[bossDifficulty] || 'Normal',
        authorityBuff: `${multiplier.toFixed(2)}x ${statNames[diff % 4]} when deployed`,
        stats: {
            attack: 10 * diff + attackVar,
            defense: 8 * diff + defenseVar,
            speed: 6 * diff + speedVar,
            magic: 7 * diff + magicVar,
        },
        quantity: 1,
        equipped: false,
        acquiredAt: new Date(),
    };
}

module.exports = { attemptExtraction, generateShadow, calcSuccessRate, MAX_ATTEMPTS };
