const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] },
    });

    io.on('connection', (socket) => {
        // Join user-specific room for targeted events
        socket.on('join', (userId) => {
            if (userId) socket.join(`user:${userId}`);
        });

        socket.on('disconnect', () => { });
    });

    return io;
}

function getIO() {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
}

module.exports = { initSocket, getIO };
