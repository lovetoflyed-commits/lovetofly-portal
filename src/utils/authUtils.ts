import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from '@/utils/auth';

export interface AuthUser {
    id: number;
    email: string;
    name?: string;
    role?: string;
}

/**
 * Extract and verify user from JWT token in request
 * Returns user object if authenticated, null if not
 */
export async function verifyTokenAndGetUser(request: NextRequest): Promise<AuthUser | null> {
    try {
        const payload = verifyToken(request);
        if (!payload) {
            return null;
        }

        // Extract user ID - could be in 'id' or 'userId' field
        const userId = payload.id || parseInt(payload.userId || '0', 10);
        if (!userId) {
            return null;
        }

        return {
            id: userId,
            email: payload.email,
            name: payload.name,
            role: payload.role,
        };
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}
