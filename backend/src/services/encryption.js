const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const KEY = Buffer.from(process.env.AES_KEY, 'hex');
const HMAC_KEY = Buffer.from(process.env.HMAC_KEY, 'hex');

function encrypt(plaintext) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    let enc = cipher.update(plaintext, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${enc}`;
}

function decrypt(payload) {
    const [ivHex, tagHex, ciphertext] = payload.split(':');
    const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let dec = decipher.update(ciphertext, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

function hmacIndex(value) {
    return crypto.createHmac('sha256', HMAC_KEY).update(value).digest('hex');
}

module.exports = { encrypt, decrypt, hmacIndex };
