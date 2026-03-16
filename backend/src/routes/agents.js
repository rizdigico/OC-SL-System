const express = require('express');
const router  = express.Router();
const Agent   = require('../models/Agent');
const authenticateToken = require('../middleware/auth');

// ── Helper: emit via socket if available ──────────────────────────────────────
function tryEmit(event, payload, room) {
    try {
        const { getIO } = require('../config/socket');
        getIO().to(room).emit(event, payload);
    } catch (_) { /* socket not initialised or getIO not exported — skip */ }
}

// ── Dashboard routes (JWT-authenticated) ─────────────────────────────────────

// GET /api/agents — all agents for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const agents = await Agent.find({ userId: req.user._id }).sort({ lastSeen: -1 });
        res.json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/agents — register / update an agent from the dashboard
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { agentId, name, rank } = req.body;
        if (!agentId || !name) return res.status(400).json({ error: 'agentId and name required' });

        const agent = await Agent.findOneAndUpdate(
            { userId: req.user._id, agentId },
            { $set: { name, rank: rank || 'Scout', lastSeen: new Date() } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(201).json(agent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/agents/:agentId — remove an agent
router.delete('/:agentId', authenticateToken, async (req, res) => {
    try {
        await Agent.deleteOne({ userId: req.user._id, agentId: req.params.agentId });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Webhook (external Python/Node agents POST here) ───────────────────────────
//
//  Authentication:  Authorization: Bearer <AGENT_WEBHOOK_SECRET>
//
//  Body schema:
//    agentId*            string   — the agent's self-reported identifier
//    userId*             string   — MongoDB ObjectId of the owning user
//    name                string   — display name
//    rank                string   — Scout | Knight | Commander | General | Marshal
//    status              string   — Idle | Executing | Success | Failed | Offline
//    currentTask         string   — human-readable task description
//    successRate         number   — 0–100
//    increment.tasksCompleted  number  — adds to totalTasksCompleted
//
router.post('/webhook', async (req, res) => {
    const provided = (req.headers.authorization || '').replace('Bearer ', '').trim();
    const expected = process.env.AGENT_WEBHOOK_SECRET;

    if (!expected) {
        // No secret configured — block all webhook calls in production, allow in dev
        if (process.env.NODE_ENV !== 'development') {
            return res.status(503).json({ error: 'Webhook not configured' });
        }
    } else if (provided !== expected) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    const { agentId, userId, name, rank, status, currentTask, successRate, increment } = req.body;
    if (!agentId || !userId) {
        return res.status(400).json({ error: 'agentId and userId are required' });
    }

    try {
        const setFields = {
            lastSeen: new Date(),
            ...(name        != null && { name }),
            ...(rank        != null && { rank }),
            ...(status      != null && { status }),
            ...(currentTask != null && { currentTask }),
            ...(successRate != null && { successRate }),
        };

        const mongoUpdate = { $set: setFields };
        if (increment?.tasksCompleted) {
            mongoUpdate.$inc = { totalTasksCompleted: Number(increment.tasksCompleted) };
        }

        const agent = await Agent.findOneAndUpdate(
            { userId, agentId },
            mongoUpdate,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Real-time push to the owning user's socket room
        tryEmit('agent:update', agent, `user:${userId}`);

        res.json({ ok: true, agent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
