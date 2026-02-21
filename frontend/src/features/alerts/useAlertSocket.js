import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl } from './alerts.api';

export default function useAlertSocket({ onNewAlert }) {
  const socketRef = useRef(null);

  useEffect(() => {
    const url = getSocketUrl();
    const socket = io(url, { transports: ['websocket'], withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => console.log('alerts socket connected'));
    socket.on('disconnect', () => console.log('alerts socket disconnected'));

    socket.on('new_alert', (payload) => {
      // basic validation
      if (!payload || !payload.timestamp) return;
      onNewAlert && onNewAlert(payload);
    });

    return () => {
      try { socket.disconnect(); } catch (e) {}
    };
  }, [onNewAlert]);
}
