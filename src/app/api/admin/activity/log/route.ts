import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

// POST /api/admin/activity/log
// Log user activity (login, logout, etc.)
export async function POST(request: NextRequest) {
  try {
    const { userId, activityType, description, ipAddress, userAgent, metadata } = await request.json();

    if (!userId || !activityType) {
      return NextResponse.json(
        { message: 'Missing required fields: userId, activityType' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO user_activity_log (user_id, activity_type, description, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [userId, activityType, description || null, ipAddress || null, userAgent || null, metadata || {}]
    );

    return NextResponse.json(
      { message: 'Activity logged', activity: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json(
      { message: 'Error logging activity' },
      { status: 500 }
    );
  }
}

// GET /api/admin/activity/log?userId=123&limit=50
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const activityType = searchParams.get('activityType');

    let query = `SELECT * FROM user_activity_log WHERE 1=1`;
    const params: any[] = [];

    if (userId) {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (activityType) {
      query += ` AND activity_type = $${params.length + 1}`;
      params.push(activityType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return NextResponse.json({ activities: result.rows });
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json(
      { message: 'Error fetching activities' },
      { status: 500 }
    );
  }
}
