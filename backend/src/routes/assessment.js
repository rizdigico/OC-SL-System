const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const { encrypt } = require('../services/encryption');
const { expForLevel, RANK_TIERS } = require('../services/leveling');

/*
 * POST /api/assessment
 * Initial Life Assessment — calculates starting Level, Rank, and stat distribution
 * from demographic, physical, and financial survey data.
 *
 * All raw survey payload is AES-256 encrypted before storage.
 */

// ── Scoring helpers ──

function scorePhysical(p) {
    let s = 0;
    // Workout frequency (0-7 days/week → 0-21)
    s += Math.min((p.workoutDaysPerWeek || 0) * 3, 21);
    // Can run 5k? +8, 10k? +12, marathon? +18
    const runMap = { none: 0, '5k': 8, '10k': 12, half: 15, marathon: 18 };
    s += runMap[p.runCapacity] || 0;
    // Sleep quality (1-10 → 0-10)
    s += Math.min(p.sleepQuality || 0, 10);
    // Diet discipline (1-10 → 0-10)
    s += Math.min(p.dietDiscipline || 0, 10);
    // Sport/martial art background +5
    if (p.sportBackground) s += 5;
    return s; // max ~64
}

function scoreMental(m) {
    let s = 0;
    // Education tier
    const eduMap = { none: 0, highschool: 3, diploma: 6, bachelors: 10, masters: 14, phd: 18 };
    s += eduMap[m.education] || 0;
    // Reading habit (books/month 0-10 → 0-15)
    s += Math.min((m.booksPerMonth || 0) * 1.5, 15);
    // Problem-solving confidence (1-10)
    s += Math.min(m.problemSolving || 0, 10);
    // Learning new skills regularly? +5
    if (m.activeLearner) s += 5;
    // Meditation / mindfulness practice +4
    if (m.meditates) s += 4;
    return s; // max ~52
}

function scoreFinancial(f) {
    let s = 0;
    // Income tier
    const incMap = { low: 2, medium: 6, high: 12, very_high: 18 };
    s += incMap[f.incomeTier] || 0;
    // Savings habit (1-10)
    s += Math.min(f.savingsHabit || 0, 10);
    // Investment experience +6
    if (f.invests) s += 6;
    // Debt-free +5
    if (f.debtFree) s += 5;
    // Side income +4
    if (f.sideIncome) s += 4;
    return s; // max ~43
}

function scoreSocial(d) {
    let s = 0;
    // Leadership experience +6
    if (d.leadershipExp) s += 6;
    // Close relationships (1-10)
    s += Math.min(d.relationshipQuality || 0, 10);
    // Community involvement +4
    if (d.communityInvolved) s += 4;
    // Age factor (maturity bonus, capped)
    const age = d.age || 18;
    s += Math.min(Math.floor((age - 14) / 3), 8);
    return s; // max ~28
}

function calculateAssessment(payload) {
    const { physical = {}, mental = {}, financial = {}, demographic = {} } = payload;

    const phys = scorePhysical(physical);
    const ment = scoreMental(mental);
    const fin = scoreFinancial(financial);
    const soc = scoreSocial(demographic);

    const totalScore = phys + ment + fin + soc; // max ~187

    // ── Starting Level (1-15 based on total score) ──
    const startingLevel = Math.max(1, Math.min(15, Math.floor(totalScore / 12.5)));

    // ── Rank from level ──
    const rankIndex = Math.min(Math.floor((startingLevel - 1) / 10), RANK_TIERS.length - 1);
    const rank = RANK_TIERS[rankIndex];

    // ── Stat distribution (proportional to domain scores) ──
    const basePoints = (startingLevel - 1) * 5; // 5 per level above 1
    const domainTotal = phys + ment + fin + soc || 1;

    const strength = 1 + Math.round(basePoints * (phys * 0.5) / domainTotal);
    const agility = 1 + Math.round(basePoints * (phys * 0.3) / domainTotal);
    const vitality = 1 + Math.round(basePoints * (phys * 0.2) / domainTotal);
    const intelligence = 1 + Math.round(basePoints * (ment * 0.7) / domainTotal);
    const sense = 1 + Math.round(basePoints * ((ment * 0.3 + soc * 0.5) / 2) / domainTotal);

    // Leftover goes to statPoints pool
    const allocated = (strength - 1) + (agility - 1) + (vitality - 1) + (intelligence - 1) + (sense - 1);
    const statPoints = Math.max(0, basePoints - allocated);

    // Starting gold from financial score
    const gold = fin * 10;

    return {
        level: startingLevel,
        rank,
        title: startingLevel >= 10 ? 'Awakened One' : 'Shadow Initiate',
        stats: {
            level: startingLevel,
            exp: 0,
            strength,
            agility,
            vitality,
            sense,
            intelligence,
            statPoints,
            gold,
            fatigue: 0,
        },
        expToNextLevel: expForLevel(startingLevel),
        breakdown: { physical: phys, mental: ment, financial: fin, social: soc, totalScore },
    };
}

// ── Route ──

router.post('/', authGuard, async (req, res, next) => {
    try {
        const result = calculateAssessment(req.body);

        // Encrypt raw survey payload before storing reference
        const encryptedPayload = encrypt(JSON.stringify(req.body));

        // Apply calculated stats to user
        const user = req.user;
        user.stats = result.stats;
        user.rank = result.rank;
        user.title = result.title;
        await user.save();

        res.json({
            message: '[SYSTEM] Initial Assessment Complete. Player stats calibrated.',
            assessment: result,
            encryptedSurveyRef: encryptedPayload,
        });
    } catch (err) { next(err); }
});

module.exports = router;
