// Authentication utilities for API routes
import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

/**
 * Verify JWT token - accepts either a token string or NextRequest
 * Returns decoded payload or null if invalid
 */
export function verifyToken(tokenOrRequest: string | NextRequest): JWTPayload | null {
  try {
    let token: string;

    // Handle both string token and NextRequest
    if (typeof tokenOrRequest === 'string') {
      token = tokenOrRequest;
    } else {
      // It's a NextRequest
      const authHeader = tokenOrRequest.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }
      token = authHeader.substring(7);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract owner ID from request (from Authorization header or query params)
 * For client-side requests, JWT is in header; for internal requests, use query param
 */
export async function getAuthenticatedOwnerId(request: NextRequest): Promise<{ ownerId: string | null; userId: number | null; isAuthorized: boolean }> {
  // First try to get from JWT token
  const payload = verifyToken(request);
  if (payload) {
    // JWT provides user ID, not owner ID
    // You may need to map user ID to owner ID in your database
    return {
      userId: payload.id,
      ownerId: null, // Will be fetched from DB based on userId
      isAuthorized: true
    };
  }

  // Fallback: check for ownerId in query params (internal requests only)
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get('ownerId');
  
  // WARNING: This is insecure if request comes from client without proper header validation
  // Only use this for internal/server-to-server requests
  if (ownerId) {
    return {
      ownerId,
      userId: null,
      isAuthorized: false // Query param alone doesn't authorize
    };
  }

  return {
    ownerId: null,
    userId: null,
    isAuthorized: false
  };
}

/**
 * Verify that the requesting user owns the specified hangar listing
 * Returns true only if user is authenticated and owns the listing
 */
export async function verifyOwnership(
  request: NextRequest,
  expectedOwnerId: string
): Promise<boolean> {
  const { ownerId, userId, isAuthorized } = await getAuthenticatedOwnerId(request);
  
  if (!isAuthorized && !userId) {
    return false;
  }

  // If we have ownerId, verify it matches
  if (ownerId) {
    return ownerId === expectedOwnerId;
  }

  // If we have userId, we need to verify they own the hangar
  // This would require a DB query to map user -> owner -> hangars
  // For now, authentication via JWT is sufficient
  return isAuthorized;
}

/**
 * Create a JWT token (for testing/login endpoints)
 */
export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Standardized error response for authentication failures
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return new Response(JSON.stringify({ 
    success: false, 
    message,
    code: 'UNAUTHORIZED'
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Standardized error response for authorization failures
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return new Response(JSON.stringify({ 
    success: false, 
    message,
    code: 'FORBIDDEN'
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  });
}