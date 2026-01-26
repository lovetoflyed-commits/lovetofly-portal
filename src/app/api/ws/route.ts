// WebSocket Endpoint
// File: src/app/api/ws/route.ts
// Purpose: HTTP endpoint for WebSocket connections (handled at Node.js level)

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { getWebSocketServer } from '@/utils/websocket-server';

/**
 * Handle WebSocket upgrade request
 * Note: Actual WebSocket upgrade is handled by custom middleware
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract Bearer token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized: Missing or invalid bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // Verify JWT token
    let payload;
    try {
      payload = await verifyToken(token);
    } catch (error) {
      console.error('[WebSocket] Token verification failed:', error);
      return NextResponse.json(
        { message: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      );
    }

    // Extract owner ID from JWT payload
    const ownerId = (payload as any).ownerId || (payload as any).id;
    if (!ownerId) {
      return NextResponse.json(
        { message: 'Unauthorized: No owner ID in token' },
        { status: 401 }
      );
    }

    // This endpoint validates the connection
    // Actual WebSocket upgrade is handled via next-ws middleware (see server.js)
    return NextResponse.json(
      {
        message: 'WebSocket endpoint ready',
        ownerId,
        timestamp: Date.now(),
      },
      {
        status: 200,
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
        },
      }
    );
  } catch (error) {
    console.error('[WebSocket] Endpoint error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS for CORS and WebSocket upgrade negotiation
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { message: 'OK' },
    {
      status: 200,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        import { NextResponse } from 'next/server';

        export async function GET() {
          return NextResponse.json(
            { message: 'WebSocket disabled. Use manual refresh.' },
            { status: 410 }
          );
        }

        export async function OPTIONS() {
          return NextResponse.json(
            { message: 'WebSocket disabled.' },
            { status: 410 }
          );
        }


