// WebSocket removed (manual refresh only)

'use client';

export type WebSocketEventType =
  | 'booking_created'
  | 'booking_updated'
  | 'booking_completed'
  | 'metrics_updated'
  | 'occupancy_changed'
  | 'revenue_received';

export interface WebSocketMessage {
  type: WebSocketEventType;
  timestamp: number;
  data: Record<string, any>;
  ownerId: string;
}

export interface RealTimeMetrics {
  revenueToday?: number;
  bookingsToday?: number;
  occupancyRate?: number;
  growthPercentage?: number;
  todayRevenue?: number;
  activeBookings?: number;
  lastUpdate?: number;
}

export interface BookingNotification {
  id: string;
  guestName: string;
  hangarNumber: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  duration?: number;
}

export interface OccupancyChange {
  hangarId: string;
  hangarNumber: string;
  occupancyRate: number;
  totalSpots: number;
  occupiedSpots: number;
  isNowOccupied?: boolean;
  timestamp?: number;
}

export function initWebSocket(): null {
  return null;
}

export function getWebSocketManager(): null {
  return null;
}

export function closeWebSocket(): void {
  // no-op
}
