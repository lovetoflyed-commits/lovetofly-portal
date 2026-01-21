// WebSocket API Handler
// File: src/app/api/ws/route.ts
// Purpose: Handle WebSocket connections for real-time notifications

import { WebSocketHandler } from '@/lib/websocket-handler';

// Get or create the WebSocket handler singleton
const wsHandler = WebSocketHandler.getInstance();

export async function GET(request: Request) {
  // WebSocket upgrade happens via the handler
  return wsHandler.handleUpgrade(request);
}
