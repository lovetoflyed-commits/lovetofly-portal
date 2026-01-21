// WebSocket Server Manager
// File: src/utils/websocket-server.ts
// Purpose: Manages WebSocket connections and broadcasts real-time events to clients

import { WebSocket } from 'ws';
import { getMetrics } from './metrics-aggregator';

export interface WebSocketMessage {
  type: 'metrics_update' | 'booking_event' | 'occupancy_change' | 'error' | 'pong';
  data?: unknown;
  timestamp: number;
}

interface ClientConnection {
  socket: WebSocket;
  ownerId: string;
  isAlive: boolean;
}

class WebSocketServerManager {
  private connections: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly METRICS_POLL_INTERVAL = 5000; // 5 seconds
  private readonly MESSAGE_QUEUE_SIZE = 100;
  private messageQueue: Map<string, WebSocketMessage[]> = new Map();

  constructor() {
    this.startHeartbeat();
    this.startMetricsPoll();
  }

  /**
   * Register a new WebSocket connection
   */
  public registerConnection(socket: WebSocket, ownerId: string): void {
    // Remove existing connection for this owner (single connection per owner)
    const existingKey = Array.from(this.connections.entries()).find(
      ([, conn]) => conn.ownerId === ownerId
    )?.[0];
    
    if (existingKey) {
      const existingConn = this.connections.get(existingKey);
      if (existingConn) {
        existingConn.socket.close(1000, 'New connection established');
      }
      this.connections.delete(existingKey);
    }

    const connectionId = `${ownerId}-${Date.now()}`;
    this.connections.set(connectionId, {
      socket,
      ownerId,
      isAlive: true,
    });

    this.messageQueue.set(connectionId, []);

    // Set up socket event handlers
    socket.on('pong', () => {
      const conn = this.connections.get(connectionId);
      if (conn) {
        conn.isAlive = true;
      }
    });

    socket.on('close', () => {
      this.connections.delete(connectionId);
      this.messageQueue.delete(connectionId);
      console.log(`[WebSocket] Connection closed: ${connectionId}`);
    });

    socket.on('error', (error) => {
      console.error(`[WebSocket] Connection error (${connectionId}):`, error);
      this.sendMessage(connectionId, {
        type: 'error',
        data: { message: 'WebSocket error occurred' },
        timestamp: Date.now(),
      });
    });

    console.log(`[WebSocket] Client connected: ${connectionId} (owner: ${ownerId})`);
  }

  /**
   * Broadcast metrics to a specific owner's connection
   */
  public async broadcastMetrics(ownerId: string): Promise<void> {
    try {
      const metrics = await getMetrics(ownerId);
      this.broadcastToOwner(ownerId, {
        type: 'metrics_update',
        data: metrics,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`[WebSocket] Failed to fetch metrics for ${ownerId}:`, error);
    }
  }

  /**
   * Broadcast booking event
   */
  public broadcastBookingEvent(
    ownerId: string,
    eventData: Record<string, unknown>
  ): void {
    this.broadcastToOwner(ownerId, {
      type: 'booking_event',
      data: eventData,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast occupancy change
   */
  public broadcastOccupancyChange(
    ownerId: string,
    changeData: Record<string, unknown>
  ): void {
    this.broadcastToOwner(ownerId, {
      type: 'occupancy_change',
      data: changeData,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast revenue update
   */
  public broadcastRevenueUpdate(
    ownerId: string,
    revenueData: Record<string, unknown>
  ): void {
    this.broadcastToOwner(ownerId, {
      type: 'metrics_update',
      data: { revenueUpdate: revenueData },
      timestamp: Date.now(),
    });
  }

  /**
   * Send message to specific connection
   */
  private sendMessage(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    try {
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(JSON.stringify(message));
      } else {
        // Queue message if socket not ready
        const queue = this.messageQueue.get(connectionId) || [];
        if (queue.length < this.MESSAGE_QUEUE_SIZE) {
          queue.push(message);
          this.messageQueue.set(connectionId, queue);
        }
      }
    } catch (error) {
      console.error(`[WebSocket] Failed to send message to ${connectionId}:`, error);
    }
  }

  /**
   * Broadcast to all connections for a specific owner
   */
  private broadcastToOwner(ownerId: string, message: WebSocketMessage): void {
    const ownerConnections = Array.from(this.connections.entries()).filter(
      ([, conn]) => conn.ownerId === ownerId
    );

    for (const [connectionId] of ownerConnections) {
      this.sendMessage(connectionId, message);
    }
  }

  /**
   * Disconnect a client
   */
  public disconnectClient(ownerId: string): void {
    const connectionsToRemove = Array.from(this.connections.entries())
      .filter(([, conn]) => conn.ownerId === ownerId)
      .map(([key]) => key);

    for (const connectionId of connectionsToRemove) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1000, 'Disconnected by server');
      }
      this.connections.delete(connectionId);
      this.messageQueue.delete(connectionId);
    }
  }

  /**
   * Get count of connected clients
   */
  public getConnectedClientCount(): number {
    return this.connections.size;
  }

  /**
   * Get connected owners (unique owner IDs)
   */
  public getConnectedOwners(): string[] {
    const owners = new Set<string>();
    for (const conn of this.connections.values()) {
      owners.add(conn.ownerId);
    }
    return Array.from(owners);
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [connectionId, connection] of this.connections.entries()) {
        if (!connection.isAlive) {
          // Connection didn't respond to last ping, close it
          connection.socket.terminate();
          this.connections.delete(connectionId);
          this.messageQueue.delete(connectionId);
          continue;
        }

        // Send ping
        connection.isAlive = false;
        connection.socket.ping();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Start periodic metrics polling
   */
  private startMetricsPoll(): void {
    this.metricsInterval = setInterval(async () => {
      const owners = this.getConnectedOwners();
      for (const ownerId of owners) {
        await this.broadcastMetrics(ownerId);
      }
    }, this.METRICS_POLL_INTERVAL);
  }

  /**
   * Stop all intervals (cleanup)
   */
  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Close all connections
    for (const [connectionId, connection] of this.connections.entries()) {
      try {
        connection.socket.close(1001, 'Server shutting down');
      } catch (error) {
        console.error(`[WebSocket] Error closing ${connectionId}:`, error);
      }
    }

    this.connections.clear();
    this.messageQueue.clear();
  }

  /**
   * Get server statistics
   */
  public getStats(): Record<string, unknown> {
    return {
      totalConnections: this.connections.size,
      connectedOwners: this.getConnectedOwners().length,
      connectionList: Array.from(this.connections.entries()).map(([id, conn]) => ({
        id,
        ownerId: conn.ownerId,
        isAlive: conn.isAlive,
      })),
    };
  }
}

// Singleton instance
let wsServer: WebSocketServerManager | null = null;

/**
 * Get or create WebSocket server instance
 */
export function getWebSocketServer(): WebSocketServerManager {
  if (!wsServer) {
    wsServer = new WebSocketServerManager();
  }
  return wsServer;
}

/**
 * Create a fresh instance (for testing)
 */
export function createWebSocketServer(): WebSocketServerManager {
  return new WebSocketServerManager();
}

export default WebSocketServerManager;
