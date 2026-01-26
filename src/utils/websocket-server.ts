// WebSocket Server Manager
// File: src/utils/websocket-server.ts
// Purpose: Manages WebSocket connections and broadcasts real-time events to clients

import { WebSocket } from 'ws';
import { getMetrics } from './metrics-aggregator';

// WebSocket server disabled (manual refresh only)

export interface WebSocketMessage {
  type: string;
  data: Record<string, any>;
  timestamp: number;
}

class WebSocketServerManager {
  public shutdown(): void {
    return;
  }
}

let wsServer: WebSocketServerManager | null = null;

export function getWebSocketServer(): WebSocketServerManager {
  if (!wsServer) {
    wsServer = new WebSocketServerManager();
  }
  return wsServer;
}

export function createWebSocketServer(): WebSocketServerManager {
  return new WebSocketServerManager();
}

export default WebSocketServerManager;
