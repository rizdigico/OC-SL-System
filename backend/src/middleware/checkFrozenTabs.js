const checkFrozenTabs = (tabName) => {
    return async (req, res, next) => {
        try {
            const invasion = req.user.activeInvasion;
            if (invasion && invasion.monarch && invasion.monarch.includes('Frost') && invasion.frozenTabs && invasion.frozenTabs.includes(tabName)) {
                return res.status(403).json({
                    error: 'FROST_INVASION_LOCKDOWN',
                    message: `The Frost Monarch has frozen your access to the ${tabName}. Defeat him to restore functionality.`,
                });
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = checkFrozenTabs;
