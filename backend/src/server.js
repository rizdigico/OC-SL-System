require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

// Passport strategies
require('./config/passport');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const questRoutes = require('./routes/quests');
const inventoryRoutes = require('./routes/inventory');
const assessmentRoutes = require('./routes/assessment');
const extractionRoutes = require('./routes/extraction');
const uploadRoutes = require('./routes/uploads');
const shopRoutes = require('./routes/shop');
const skillRoutes = require('./routes/skills');
const dungeonRoutes = require('./routes/dungeons');
const raidRoutes = require('./routes/raid');
const combatRoutes = require('./routes/combat');
const demonCastleRoutes = require('./routes/demonCastle');
const jobChangeRoutes = require('./routes/jobChange');
const invasionRoutes = require('./routes/invasion');
const prestigeRoutes = require('./routes/prestige');
const devRoutes    = require('./routes/dev');
const agentRoutes  = require('./routes/agents');
const { initSocket } = require('./config/socket');
const { initPenaltyCron } = require('./services/penaltyCron');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Global Middleware ──
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    // In development allow effectively unlimited requests so hot-reload,
    // dev-panel buttons and rapid manual testing never hit the ceiling.
    max: process.env.NODE_ENV === 'development' ? 10_000 : 100,
    // Always respond with JSON — never the default plain-text body that
    // causes res.json() to throw a SyntaxError on the frontend.
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
    },
}));
app.use(passport.initialize());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ──
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/extraction', extractionRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/dungeons', dungeonRoutes);
app.use('/api/raid', raidRoutes);
app.use('/api/combat', combatRoutes);
app.use('/api/invasion', invasionRoutes);
app.use('/api/demon-castle', demonCastleRoutes);
app.use('/api/prestige', prestigeRoutes);
app.use('/api/job-change', jobChangeRoutes);
app.use('/api/agents', agentRoutes);
if (process.env.NODE_ENV === 'development') {
    app.use('/api/dev', devRoutes);
    console.log('[DEV] God-mode routes mounted at /api/dev');
}

// ── Error Handler (must be last) ──
app.use(errorHandler);

// ── Database & Start ──
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
initSocket(httpServer);

async function boot() {
    let dbUri = process.env.MONGODB_URI;

    // If no external URI, spin up in-memory MongoDB
    if (!dbUri) {
        console.log('[DB] No MONGODB_URI found — starting in-memory MongoDB…');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = new MongoMemoryServer();
        await mongod.start();
        dbUri = mongod.getUri();
        console.log(`[DB] In-memory MongoDB running at ${dbUri}`);
    }

    await mongoose.connect(dbUri);
    console.log('[DB] MongoDB connected');

    // Auto-seed in development
    if (!process.env.MONGODB_URI || process.env.NODE_ENV === 'development') {
        const seed = require('./config/seed');
        await seed();
    }

    // Initialize CRON jobs
    initPenaltyCron();

    httpServer.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));
}

boot().catch((err) => {
    console.error('[BOOT] Fatal:', err.message);
    process.exit(1);
});
