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

    // Fetch all moderation actions with user info
    const result = await pool.query(
      `SELECT 
        um.id,
        um.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        um.action_type,
        um.reason,
        um.severity,
        um.is_active,
        um.suspension_end_date,
        um.issued_at,
        CONCAT(issuer.first_name, ' ', issuer.last_name) as issued_by_name
       FROM user_moderation um
       JOIN users u ON um.user_id = u.id
       LEFT JOIN users issuer ON um.issued_by = issuer.id
       WHERE u.deleted_at IS NULL
       ORDER BY um.issued_at DESC
       LIMIT 200`
    );

    return NextResponse.json({ actions: result.rows });
  } catch (error) {
    console.error('Error fetching all moderation actions:', error);
    return NextResponse.json({ message: 'Error fetching actions' }, { status: 500 });
  }
}
