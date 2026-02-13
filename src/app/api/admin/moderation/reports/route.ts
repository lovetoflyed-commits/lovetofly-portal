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
      console.error('[reports] Role check failed:', { role: user.role, userId: user.id });
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = `
      SELECT r.*, 
             COALESCE(u.full_name, CONCAT(u.first_name, ' ', u.last_name)) as reporter_name,
             u.email as reporter_email
      FROM content_reports r
      JOIN users u ON u.id = r.reporter_user_id`;
    
    const params: any[] = [];
    
    if (status && status !== 'all') {
      query += ` WHERE r.status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json({ reports: result.rows });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ message: 'Error fetching reports' }, { status: 500 });
  }
}
