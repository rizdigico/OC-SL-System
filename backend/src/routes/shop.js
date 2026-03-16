const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const checkRedGateLockdown = require('../middleware/redGateLockdown');
const checkFrozenTabs = require('../middleware/checkFrozenTabs');
const Item = require('../models/Item');
const User = require('../models/User');

router.use(authGuard);
router.use(checkRedGateLockdown);
router.use(checkFrozenTabs('shop'));

// GET /api/shop - Return all available shop items
router.get('/', async (req, res, next) => {
    try {
        const items = await Item.find({});
        res.json(items);
    } catch (err) { next(err); }
});

// POST /api/shop/buy - Buy an item
router.post('/buy', async (req, res, next) => {
    try {
        const { itemId, quantity = 1 } = req.body;

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const totalCost = item.cost * quantity;

        const user = await User.findById(req.user._id);

        if (user.stats.gold < totalCost) {
            return res.status(400).json({ error: 'Insufficient gold' });
        }

        // Deduct gold
        user.stats.gold -= totalCost;

        // Check if item already in inventory
        const existingItem = user.inventory.find(i => i.item.toString() === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.inventory.push({ item: itemId, quantity });
        }

        await user.save();
        res.json({ message: 'Purchase successful', user });

    } catch (err) { next(err); }
});

module.exports = router;
