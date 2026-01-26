// WebSocket Server Handler
// File: src/lib/websocket-handler.ts
// Purpose: Server-side WebSocket connection management
// WebSocket disabled (manual refresh only)

export class WebSocketHandler {
  static getInstance(): WebSocketHandler {
    return new WebSocketHandler();
  }

  public handleUpgrade(): Response {
    return new Response(
      JSON.stringify({ message: 'WebSocket disabled.' }),
      { status: 410 }
    );
  }
}

export function verifyWebSocketToken(): null {
  return null;
}
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
