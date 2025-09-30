import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

interface NotificationData {
  id?: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
  metadata?: any;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const connect = () => {
    if (!isAuthenticated || !user || socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    const serverUrl = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

    socketRef.current = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('WebSocket desconectado');
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Erro de conexão WebSocket:', error);
      setIsConnected(false);
      onError?.(error);
    });

    // Eventos de notificação
    socket.on('new-notification', (data: NotificationData) => {
      console.log('Nova notificação recebida:', data);
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Mostrar notificação do navegador se permitido
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/logo192.png',
        });
      }
    });

    // Eventos específicos de licitação
    socket.on('new-bidding', (data: any) => {
      console.log('Nova licitação:', data);
      setNotifications(prev => [{
        title: 'Nova Licitação',
        message: data.message,
        type: 'bidding',
        createdAt: new Date(),
        metadata: data,
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Eventos para administradores
    socket.on('admin-notification', (data: any) => {
      console.log('Notificação admin:', data);
      setNotifications(prev => [{
        title: data.title,
        message: data.message,
        type: data.type,
        createdAt: new Date(),
        metadata: data.metadata,
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const joinBiddingRoom = (biddingId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-bidding', biddingId);
    }
  };

  const leaveBiddingRoom = (biddingId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-bidding', biddingId);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const markNotificationAsRead = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Solicitar permissão para notificações do navegador
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  useEffect(() => {
    if (autoConnect && isAuthenticated && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    notifications,
    unreadCount,
    connect,
    disconnect,
    joinBiddingRoom,
    leaveBiddingRoom,
    clearNotifications,
    markNotificationAsRead,
    requestNotificationPermission,
  };
};
