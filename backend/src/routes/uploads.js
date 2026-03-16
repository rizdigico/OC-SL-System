const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const upload = require('../middleware/upload');
const { encrypt } = require('../services/encryption');

/**
 * POST /api/uploads/quest-proof
 * Multipart form-data: field name "photo"
 * Saves to backend/uploads/, encrypts the stored filename, returns the path.
 */
router.post('/quest-proof', authGuard, upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    const encryptedFilename = encrypt(req.file.filename);

    res.status(201).json({
        message: 'Quest proof uploaded',
        filename: req.file.filename,
        encryptedRef: encryptedFilename,
        path: `/uploads/${req.file.filename}`,
    });
});

module.exports = router;
