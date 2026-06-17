import { io } from 'socket.io-client';
import { getSocketUrl } from '../config/env';

let socket = null;

export const connectSocket = (token) => {
  const socketUrl = getSocketUrl();
  if (!socketUrl) return null;
  if (socket?.connected) return socket;

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };
