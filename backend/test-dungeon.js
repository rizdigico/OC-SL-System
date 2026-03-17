const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config({ path: './src/.env' });
const User = require('./src/models/User');

const HTTP_OPTIONS = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/dungeons/active',
    method: 'GET'
};

async function testApi() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:53224/'); // Trying to connect to the memory server port as seen in logs
        const user = await User.findOne({ oauthId: 'test-player-001' });
        if (!user) {
            console.log("User not found!");
            process.exit(1);
        }

        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET || 'super_secret_jwt_token_for_dev_mode_only',
            { expiresIn: '1y' }
        );

        const http = require('http');
        HTTP_OPTIONS.headers = { 'Authorization': `Bearer ${token}` };

        const req = http.request(HTTP_OPTIONS, res => {
            let data = '';
            res.on('data', d => { data += d; });
            res.on('end', () => {
                console.log(`[HTTP ${res.statusCode}] Response:`);
                console.log(JSON.stringify(JSON.parse(data), null, 2));
                process.exit(0);
            });
        });

        req.on('error', error => { console.error(error); process.exit(1); });
        req.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testApi();
