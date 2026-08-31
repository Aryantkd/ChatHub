// sockets/index.js
import { Server } from 'socket.io';
import { verifyAccessToken } from '../src/helper/token.js';
import User from '../src/models/user.js';

export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    },
  });

  // Authentication middleware for socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      if (!user || user.accountStatus !== 'active') throw new Error('Invalid user');
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user._id} connected`);

    socket.join(`user:${socket.user._id}`);

    socket.on('join-match-room', (matchRoomId) => {
      socket.join(matchRoomId);
    });

    socket.on('leave-match-room', (matchRoomId) => {
      socket.leave(matchRoomId);
    });

    socket.on('typing', ({ matchRoomId, isTyping }) => {
      socket.to(matchRoomId).emit('user-typing', { userId: socket.user._id, isTyping });
    });

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(socket.user._id, { isOnline: false, lastActive: new Date() });
      console.log(`User ${socket.user._id} disconnected`);
    });
  });

  return io;
};