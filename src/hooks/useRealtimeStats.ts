// React Hook: useRealtimeStats
// File: src/hooks/useRealtimeStats.ts
// Purpose: React hook for real-time metrics updates via WebSocket

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  initWebSocket, 
  getWebSocketManager, 
  closeWebSocket,
  RealTimeMetrics,
  BookingNotification,
  OccupancyChange
} from '@/utils/websocket';

export interface UseRealtimeStatsOptions {
  ownerId: string;
  token: string;
  autoConnect?: boolean;
}

export interface UseRealtimeStatsReturn {
  metrics: RealTimeMetrics | null;
  bookingNotifications: BookingNotification[];
  occupancyChanges: OccupancyChange[];
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearNotifications: () => void;
}

export function useRealtimeStats({
  ownerId,
  token,
  autoConnect = true,
}: UseRealtimeStatsOptions): UseRealtimeStatsReturn {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [bookingNotifications, setBookingNotifications] = useState<BookingNotification[]>([]);
  const [occupancyChanges, setOccupancyChanges] = useState<OccupancyChange[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsManagerRef = useRef<ReturnType<typeof getWebSocketManager>>(null);
  const unsubscribesRef = useRef<Array<() => void>>([]);

  const connect = useCallback(async () => {
    try {
      const wsManager = initWebSocket(ownerId, token);
      wsManagerRef.current = wsManager;
      
      await wsManager.connect();
      setIsConnected(true);

      // Subscribe to metrics updates
      const unsubscribeMetrics = wsManager.subscribeToMetricsUpdates((data) => {
        setMetrics(data);
      });
      unsubscribesRef.current.push(unsubscribeMetrics);

      // Subscribe to booking notifications
      const unsubscribeBookings = wsManager.subscribeToBookingNotifications((booking) => {
        setBookingNotifications((prev) => [booking, ...prev].slice(0, 10)); // Keep last 10
      });
      unsubscribesRef.current.push(unsubscribeBookings);

      // Subscribe to occupancy changes
      const unsubscribeOccupancy = wsManager.subscribeToOccupancyChanges((change) => {
        setOccupancyChanges((prev) => [change, ...prev].slice(0, 10)); // Keep last 10
      });
      unsubscribesRef.current.push(unsubscribeOccupancy);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  }, [ownerId, token]);

  const disconnect = useCallback(() => {
    unsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
    unsubscribesRef.current = [];
    
    const wsManager = getWebSocketManager();
    if (wsManager) {
      wsManager.disconnect();
    }
    
    closeWebSocket();
    setIsConnected(false);
  }, []);

  const clearNotifications = useCallback(() => {
    setBookingNotifications([]);
    setOccupancyChanges([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (!autoConnect || !ownerId || !token) {
      return;
    }
    
    const performConnect = async () => {
      await connect();
    };
    
    performConnect().catch((error) => {
      console.error('Auto-connect failed:', error);
    });

    return () => {
      disconnect();
    };
  }, [autoConnect, ownerId, token, connect, disconnect]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const wsManager = getWebSocketManager();
      if (wsManager) {
        const status = wsManager.getConnectionStatus();
        setIsConnected(status === 'connected');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    bookingNotifications,
    occupancyChanges,
    isConnected,
    connect,
    disconnect,
    clearNotifications,
  };
}

// Simple hook for just metrics
export function useRealtimeMetrics(
  ownerId: string,
  token: string
): { metrics: RealTimeMetrics | null; isConnected: boolean } {
  const { metrics, isConnected } = useRealtimeStats({
    ownerId,
    token,
  });

  return { metrics, isConnected };
}

// Simple hook for just notifications
export function useRealtimeNotifications(
  ownerId: string,
  token: string
): { 
  bookingNotifications: BookingNotification[];
  occupancyChanges: OccupancyChange[];
  isConnected: boolean;
  clearNotifications: () => void;
} {
  const { bookingNotifications, occupancyChanges, isConnected, clearNotifications } = useRealtimeStats({
    ownerId,
    token,
  });

  return {
    bookingNotifications,
    occupancyChanges,
    isConnected,
    clearNotifications,
  };
}
