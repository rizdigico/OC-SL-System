const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const ShadowInventory = require('../models/ShadowInventory');
const { encrypt, hmacIndex } = require('../services/encryption');

async function findOrCreate(provider, profile) {
    let user = await User.findOne({ oauthProvider: provider, oauthId: profile.id });
    if (user) return user;

    const email = profile.emails?.[0]?.value || '';
    user = await User.create({
        oauthProvider: provider,
        oauthId: profile.id,
        email: email ? encrypt(email) : '',
        emailHash: email ? hmacIndex(email) : '',
        displayName: encrypt(profile.displayName || ''),
        avatarUrl: profile.photos?.[0]?.value ? encrypt(profile.photos[0].value) : '',
    });

    await ShadowInventory.create({ userId: user._id, items: [] });
    return user;
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try { done(null, await User.findById(id)); }
    catch (err) { done(err); }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (_at, _rt, profile, done) => {
    try { done(null, await findOrCreate('google', profile)); }
    catch (err) { done(err); }
}));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
}, async (_at, _rt, profile, done) => {
    try { done(null, await findOrCreate('github', profile)); }
    catch (err) { done(err); }
}));
