// WebSocket Server Handler
// File: src/lib/websocket-handler.ts
// Purpose: Server-side WebSocket connection management

import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedClient {
  ownerId: string;
  userId: number;
  ws: WebSocket;
}

interface RealTimeUpdate {
  type: string;
  ownerId: string;
  timestamp: number;
  data: Record<string, any>;
}

export class WebSocketHandler {
  private static instance: WebSocketHandler;
  private clients: Map<string, Set<AuthenticatedClient>> = new Map(); // ownerId -> Set of clients

  private constructor() {}

  static getInstance(): WebSocketHandler {
    if (!WebSocketHandler.instance) {
      WebSocketHandler.instance = new WebSocketHandler();
    }
    return WebSocketHandler.instance;
  }

  handleUpgrade(request: Request): Response {
    // Note: Next.js doesn't natively support WebSocket upgrades in API routes
    // This is a placeholder implementation
    // In production, you would need to use a separate WebSocket server
    // or use a library like next-ws
    
    return new Response(
      JSON.stringify({
        error: 'WebSocket upgrade not available in Next.js API routes',
        note: 'Consider using Socket.io or a separate WebSocket server',
        suggestion: 'Run a separate Node.js server with ws or Socket.io library'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  /**
   * Register a new client connection
   * In production, this would be called by your WebSocket server
   */
  registerClient(ownerId: string, userId: number, ws: WebSocket): void {
    if (!this.clients.has(ownerId)) {
      this.clients.set(ownerId, new Set());
    }

    const client: AuthenticatedClient = { ownerId, userId, ws };
    this.clients.get(ownerId)!.add(client);

    console.log(`[WebSocket] Client registered for owner ${ownerId}`);

    // Setup disconnect handler
    ws.onclose = () => {
      this.unregisterClient(ownerId, client);
    };
  }

  /**
   * Unregister a client connection
   */
  private unregisterClient(ownerId: string, client: AuthenticatedClient): void {
    const clients = this.clients.get(ownerId);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        this.clients.delete(ownerId);
      }
    }
    console.log(`[WebSocket] Client unregistered for owner ${ownerId}`);
  }

  /**
   * Broadcast update to all clients of an owner
   */
  broadcastToOwner(update: RealTimeUpdate): void {
    const clients = this.clients.get(update.ownerId);
    if (!clients) return;

    const message = JSON.stringify(update);
    clients.forEach((client) => {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
      }
    });
  }

  /**
   * Get connected client count for an owner
   */
  getClientCount(ownerId: string): number {
    return this.clients.get(ownerId)?.size || 0;
  }

  /**
   * Get all connected owners
   */
  getConnectedOwners(): string[] {
    return Array.from(this.clients.keys());
  }
}

/**
 * Helper function to verify token
 */
export function verifyWebSocketToken(token: string): { ownerId: string; userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      ownerId: decoded.ownerId || String(decoded.id),
      userId: decoded.id,
    };
  } catch (error) {
    return null;
  }
}
