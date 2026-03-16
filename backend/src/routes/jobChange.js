const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const User = require('../models/User');

router.use(authGuard);

/**
 * POST /api/job-change/complete
 *
 * Idempotent endpoint that clears the Job Change gate on the user document.
 * Uses findOneAndUpdate so the write is atomic — safe to call more than once
 * (subsequent calls are no-ops that still return 200).
 *
 * This is the authoritative exit point for the JobChangeDungeon UI: the
 * frontend calls it on "Return to Dashboard", then navigates to /dashboard.
 */
router.post('/complete', async (req, res, next) => {
    try {
        const updated = await User.findOneAndUpdate(
            { _id: req.user._id },
            {
                $set: {
                    jobChangeLocked:   false,
                    jobChangeUnlocked: true,
                },
            },
            { new: true }          // return the updated document
        );

        if (!updated) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({
            success: true,
            jobChangeLocked:   updated.jobChangeLocked,
            jobChangeUnlocked: updated.jobChangeUnlocked,
        });
    } catch (err) { next(err); }
});

module.exports = router;
