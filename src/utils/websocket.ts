// WebSocket Real-Time Updates System
// File: src/utils/websocket.ts
// Purpose: Handle real-time WebSocket connections for live notifications

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
  activeBookings: number;
  todayRevenue: number;
  occupancyRate: number;
  lastUpdate: number;
}

export interface BookingNotification {
  id: string;
  guestName: string;
  hangarNumber: string;
  checkIn: string;
  checkOut: string;
  amount: number;
}

export interface OccupancyChange {
  hangarId: string;
  hangarNumber: string;
  occupancyRate: number;
  totalSpots: number;
  occupiedSpots: number;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private ownerId: string;
  private token: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<WebSocketEventType, Set<(data: any) => void>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(ownerId: string, token: string) {
    this.ownerId = ownerId;
    this.token = token;
    // Determine WebSocket URL based on environment
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    this.url = `${protocol}//${host}/api/ws`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          
          // Send authentication message
          this.send({
            type: 'auth',
            ownerId: this.ownerId,
            token: this.token,
          });

          // Start ping to keep connection alive
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.stopPing();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    // Trigger all listeners for this event type
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(message.data);
        } catch (error) {
          console.error(`[WebSocket] Listener error for ${message.type}:`, error);
        }
      });
    }
  }

  private startPing(): void {
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[WebSocket] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} after ${delay}ms`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('[WebSocket] Reconnect failed:', error);
        });
      }, delay);
    }
  }

  subscribe(eventType: WebSocketEventType, listener: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  subscribeToBookingNotifications(callback: (booking: BookingNotification) => void): () => void {
    return this.subscribe('booking_created', callback);
  }

  subscribeToMetricsUpdates(callback: (metrics: RealTimeMetrics) => void): () => void {
    return this.subscribe('metrics_updated', callback);
  }

  subscribeToOccupancyChanges(callback: (change: OccupancyChange) => void): () => void {
    return this.subscribe('occupancy_changed', callback);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.ws) return 'disconnected';
    if (this.ws.readyState === WebSocket.OPEN) return 'connected';
    if (this.ws.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }
}

let wsManager: WebSocketManager | null = null;

export function initWebSocket(ownerId: string, token: string): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(ownerId, token);
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}

export function closeWebSocket(): void {
  if (wsManager) {
    wsManager.disconnect();
    wsManager = null;
  }
}
