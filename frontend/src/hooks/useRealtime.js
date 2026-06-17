import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';

export function useRealtime(event, handler, deps = []) {
  const stableHandler = useCallback(handler, deps);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !event) return undefined;

    socket.on(event, stableHandler);
    return () => socket.off(event, stableHandler);
  }, [event, stableHandler]);
}

export function useMonitoringRoom() {
  useEffect(() => {
    const socket = getSocket();
    if (socket) socket.emit('join:monitoring');
  }, []);
}

export function useInstitutionRoom(institutionId) {
  useEffect(() => {
    const socket = getSocket();
    if (socket && institutionId) {
      socket.emit('join:institution', institutionId);
    }
  }, [institutionId]);
}

export function useStreamRoom(streamId) {
  useEffect(() => {
    const socket = getSocket();
    if (socket && streamId) {
      socket.emit('join:stream', streamId);
    }
    return () => {
      if (socket && streamId) socket.emit('leave:stream', streamId);
    };
  }, [streamId]);
}

export function useAttendanceFeed(onUpdate) {
  const [events, setEvents] = useState([]);

  useRealtime('attendance:update', (data) => {
    setEvents((prev) => [data, ...prev].slice(0, 50));
    onUpdate?.(data);
  }, [onUpdate]);

  return events;
}

export default useRealtime;
