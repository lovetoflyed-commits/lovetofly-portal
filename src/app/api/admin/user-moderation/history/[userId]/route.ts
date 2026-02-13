import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const userId = params.userId;

    // Fetch moderation history for user
    const result = await pool.query(
      `SELECT 
        um.id,
        um.user_id,
        um.action_type,
        um.reason,
        um.severity,
        um.issued_at,
        um.suspension_end_date,
        COALESCE(issuer.full_name, CONCAT(issuer.first_name, ' ', issuer.last_name), 'Sistema') as issued_by_name
       FROM user_moderation um
       LEFT JOIN users issuer ON um.issued_by = issuer.id
       WHERE um.user_id = $1
       ORDER BY um.issued_at DESC`,
      [userId]
    );

    return NextResponse.json({ history: result.rows });
  } catch (error) {
    console.error('Error fetching moderation history:', error);
    return NextResponse.json({ message: 'Error fetching history' }, { status: 500 });
  }
}
