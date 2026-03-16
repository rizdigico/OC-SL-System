const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './src/.env' });

const token = jwt.sign(
    { _id: '64e8e8f8f8f8f8f8f8f8f8f8' }, // Mock object ID or real object ID
    process.env.JWT_SECRET || 'solo-leveling-secret-super-key-2026',
    { expiresIn: '1y' }
);
console.log(token);
