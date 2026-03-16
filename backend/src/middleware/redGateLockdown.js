const ActiveQuest = require('../models/ActiveQuest');

/**
 * Middleware to check if the user is trapped in a Red Gate.
 * If yes, they are locked out of normal system functions (Shop, Inventory, Stats).
 */
const checkRedGateLockdown = async (req, res, next) => {
    try {
        const activeRedGate = await ActiveQuest.findOne({
            userId: req.user._id,
            status: 'active',
            isRedGate: true,
        });

        if (activeRedGate) {
            return res.status(403).json({
                error: 'RED_GATE_LOCKDOWN',
                message: 'RED GATE DETECTED: Communication with the outside world is severed.',
            });
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = checkRedGateLockdown;
