const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('../models/Item'); // Ensure Item model is registered for population

module.exports = async function authGuard(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).populate({ path: 'equippedWeapon', model: 'Item' });
        if (!user) return res.status(401).json({ error: 'User not found' });
        
        // Debug: check if populated
        if (user.equippedWeapon && typeof user.equippedWeapon === 'object') {
            console.log(`[AUTH] User ${user.displayName} loaded with weapon: ${user.equippedWeapon.name}`);
        } else {
            console.log(`[AUTH] User ${user.displayName} loaded. Weapon unpopulated: ${user.equippedWeapon}`);
        }

        req.user = user;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
