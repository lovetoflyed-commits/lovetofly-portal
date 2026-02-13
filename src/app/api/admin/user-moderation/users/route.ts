import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const role = String(user.role || '').toLowerCase();
    if (!['master', 'admin', 'staff'].includes(role)) {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch users with moderation status
    const result = await pool.query(
      `SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at,
        la.last_activity_at,
        COALESCE(ms.active_warnings, 0) as active_warnings,
        COALESCE(ms.active_strikes, 0) as active_strikes,
        ms.suspended_until,
        COALESCE(ms.is_banned, false) as is_banned,
        COALESCE(uas.access_level, 'active') as access_level
       FROM users u
       LEFT JOIN user_last_activity la ON u.id = la.id
       LEFT JOIN user_moderation_status ms ON u.id = ms.id
       LEFT JOIN user_access_status uas ON u.id = uas.user_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users for moderation:', error);
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}
