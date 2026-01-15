import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

// GET /api/admin/monitoring/inactive?days=30&limit=20
// Get users inactive for X days
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await pool.query(
      `SELECT 
        ula.id,
        ula.email,
        ula.first_name,
        ula.last_name,
        ula.last_activity_at,
        ula.days_inactive,
        u.created_at,
        u.plan,
        uas.access_level
       FROM user_last_activity ula
       JOIN users u ON ula.id = u.id
       LEFT JOIN user_access_status uas ON u.id = uas.user_id
       WHERE ula.days_inactive >= $1 OR ula.last_activity_at IS NULL
       ORDER BY COALESCE(ula.days_inactive, 99999) DESC
       LIMIT $2`,
      [days, limit]
    );

    const inactiveCount = result.rows.length;
    const totalInactiveResult = await pool.query(
      `SELECT COUNT(*) as total FROM user_last_activity ula
       WHERE ula.days_inactive >= $1 OR ula.last_activity_at IS NULL`,
      [days]
    );

    return NextResponse.json({
      inactiveUsers: result.rows,
      summary: {
        daysThreshold: days,
        inactiveCount,
        totalInactive: parseInt(totalInactiveResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Get inactive users error:', error);
    return NextResponse.json(
      { message: 'Error fetching inactive users' },
      { status: 500 }
    );
  }
}
