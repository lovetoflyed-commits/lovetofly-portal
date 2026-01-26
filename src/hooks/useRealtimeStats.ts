// WebSocket removed: no-op realtime hooks

import { useCallback, useState } from 'react';
import { RealTimeMetrics, BookingNotification, OccupancyChange } from '@/utils/websocket';

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
}: UseRealtimeStatsOptions): UseRealtimeStatsReturn {
  const [metrics] = useState<RealTimeMetrics | null>(null);
  const [bookingNotifications, setBookingNotifications] = useState<BookingNotification[]>([]);
  const [occupancyChanges, setOccupancyChanges] = useState<OccupancyChange[]>([]);
  const [isConnected] = useState(false);

  const connect = useCallback(async () => {
    return;
  }, []);

  const disconnect = useCallback(() => {
    return;
  }, []);

  const clearNotifications = useCallback(() => {
    setBookingNotifications([]);
    setOccupancyChanges([]);
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
