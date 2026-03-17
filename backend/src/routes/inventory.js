const router = require('express').Router();
const authGuard = require('../middleware/authGuard');
const checkRedGateLockdown = require('../middleware/redGateLockdown');
const checkFrozenTabs = require('../middleware/checkFrozenTabs');
const ShadowInventory = require('../models/ShadowInventory');
const User = require('../models/User');
const Item = require('../models/Item');

router.use(authGuard);
router.use(checkRedGateLockdown);
router.use(checkFrozenTabs('inventory'));

// GET /api/inventory
router.get('/', async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('inventory.item');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const mappedItems = user.inventory.map(invItem => {
            return {
                ...invItem.item.toObject(),
                quantity: invItem.quantity,
                equipped: user.equippedWeapon?.toString() === invItem.item._id.toString() || user.equippedArmor?.toString() === invItem.item._id.toString()
            };
        });

        res.json({ maxSlots: 20, items: mappedItems });
    } catch (err) { next(err); }
});

// POST /api/inventory/add
router.post('/add', async (req, res, next) => {
    try {
        const inv = await ShadowInventory.findOne({ userId: req.user._id });
        if (!inv) return res.status(404).json({ error: 'Inventory not found' });
        if (inv.items.length >= inv.maxSlots) return res.status(400).json({ error: 'Inventory full' });

        inv.items.push(req.body);
        await inv.save();
        res.status(201).json(inv);
    } catch (err) { next(err); }
});

// POST /api/inventory/use
router.post('/use', async (req, res, next) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user._id);

        const inventoryItem = user.inventory.find(i => i.item.toString() === itemId);
        if (!inventoryItem || inventoryItem.quantity <= 0) {
            return res.status(400).json({ error: 'Item not found in inventory' });
        }

        const itemDef = await Item.findById(itemId);
        if (!itemDef || itemDef.type !== 'consumable') {
            return res.status(400).json({ error: 'Item cannot be consumed' });
        }

        // Consumables no longer permanently modify base stats
        // but we still want to return their effects to the client (e.g., for mid-battle healing).
        const effects = itemDef.effect || {};

        // Decrement quantity
        inventoryItem.quantity -= 1;

        // Let's filter out items with 0 quantity
        user.inventory = user.inventory.filter(i => i.quantity > 0);

        await user.save();
        res.json({ message: `Used ${itemDef.name}`, user, effects });

    } catch (err) { next(err); }
});

// POST /api/inventory/equip
router.post('/equip', async (req, res, next) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user._id);

        const inventoryItem = user.inventory.find(i => i.item.toString() === itemId);
        if (!inventoryItem || inventoryItem.quantity <= 0) {
            return res.status(400).json({ error: 'Item not found in inventory' });
        }

        const itemDef = await Item.findById(itemId);
        if (!itemDef || itemDef.type !== 'gear') {
            return res.status(400).json({ error: 'Item cannot be equipped' });
        }

        // Determine if it's armor or weapon based on effect or default to weapon
        if (itemDef.effect && itemDef.effect.slot === 'armor') {
            user.equippedArmor = itemId;
        } else {
            user.equippedWeapon = itemId;
        }

        await user.save();
        res.json({ message: `Equipped ${itemDef.name}`, user });
    } catch (err) { next(err); }
});

// DELETE /api/inventory/remove
router.delete('/remove', async (req, res, next) => {
    try {
        const inv = await ShadowInventory.findOne({ userId: req.user._id });
        if (!inv) return res.status(404).json({ error: 'Inventory not found' });

        inv.items.pull({ _id: req.body.itemId });
        await inv.save();
        res.json(inv);
    } catch (err) { next(err); }
});

module.exports = router;
