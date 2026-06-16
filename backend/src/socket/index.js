const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const logger = require('../utils/logger');

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id);
      if (!user?.isActive) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.user.email} (${socket.user.role})`);

    socket.join(`user:${socket.user._id}`);
    socket.join(`role:${socket.user.role}`);
    if (socket.user.institution) {
      socket.join(`institution:${socket.user.institution}`);
    }

    socket.on('join:monitoring', () => {
      if (['monitoring_officer', 'super_admin'].includes(socket.user.role)) {
        socket.join('monitoring:center');
      }
    });

    socket.on('join:stream', (streamId) => {
      socket.join(`stream:${streamId}`);
    });

    socket.on('stream:status', async (data) => {
      const { CameraStream } = require('../models');
      await CameraStream.findByIdAndUpdate(data.streamId, {
        isLive: data.isLive,
        lastActiveAt: new Date(),
      });
      io.to(`stream:${data.streamId}`).emit('stream:updated', data);
    });

    socket.on('attendance:realtime', (data) => {
      io.to(`institution:${data.institutionId}`).emit('attendance:update', data);
    });

    socket.on('alert:broadcast', (data) => {
      if (['super_admin', 'monitoring_officer'].includes(socket.user.role)) {
        io.to('monitoring:center').emit('alert:new', data);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.user.email}`);
    });
  });

  return io;
};

const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

const emitAttendanceAlert = (io, institutionId, data) => {
  io.to(`institution:${institutionId}`).emit('attendance:alert', data);
};

module.exports = { initializeSocket, emitNotification, emitAttendanceAlert };
