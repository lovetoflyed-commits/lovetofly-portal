// Admin authorization middleware
// Usage: import { requireAdmin } from '@/utils/adminAuth';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/config/db';

interface JWTPayload {
  userId?: string;
  id?: string;
  email: string;
  role?: string;
}

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    // Verify JWT
    const decoded = jwt.verify(token, secret) as JWTPayload;
    const resolvedUserId = decoded.userId ?? decoded.id;
    
    console.log('[AdminAuth] Decoded token payload:', decoded);
    console.log('[AdminAuth] Resolved userId:', resolvedUserId);

    // Check user role in database
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [resolvedUserId]
    );
    
    console.log('[AdminAuth] Database query result:', result.rows.length, 'rows');

    if (result.rows.length === 0) {
      console.error('[AdminAuth] User not found in database for userId:', resolvedUserId);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Check if user is admin, staff, or master (master should always pass)
    if (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'master') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Authorization successful - return null to proceed
    return null;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { message: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }
}

export async function getAdminUser(request: NextRequest): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    const resolvedUserId = decoded.userId ?? decoded.id;

    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [resolvedUserId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    return null;
  }
}

export async function logAdminAction(
  adminId: string,
  actionType: string,
  targetType: string,
  targetId: string,
  details: any,
  request: NextRequest,
  oldValue?: any,
  newValue?: any
): Promise<void> {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Convert target_id to integer if it's a string representation of a number, otherwise use null
    let targetIdValue: number | string | null = targetId;
    if (typeof targetId === 'string') {
      const parsed = parseInt(targetId, 10);
      targetIdValue = isNaN(parsed) ? null : parsed;
    }
    
    // Use the actual columns that exist in admin_activity_log table
    await pool.query(
      `INSERT INTO admin_activity_log 
       (admin_id, action_type, target_type, target_id, old_value, new_value, notes, ip_address, user_agent, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        adminId, 
        actionType, 
        targetType, 
        targetIdValue, 
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        typeof details === 'string' ? details : JSON.stringify(details),
        ipAddress, 
        userAgent
      ]
    );
    console.log(`[AdminActivityLog] ${actionType} on ${targetType}:${targetId} by admin:${adminId}`);
  } catch (error: any) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}
