const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const Item = require('./src/models/Item');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shadow_quests').then(async () => {
    const user = await User.findOne({ oauthId: 'test-player-001' }).populate('equippedWeapon');
    console.log("populated user.equippedWeapon:", user.equippedWeapon);
    process.exit(0);
});