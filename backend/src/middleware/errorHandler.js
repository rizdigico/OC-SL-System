module.exports = function errorHandler(err, _req, res, _next) {
    console.error('[ERROR]', err.stack || err.message);
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
