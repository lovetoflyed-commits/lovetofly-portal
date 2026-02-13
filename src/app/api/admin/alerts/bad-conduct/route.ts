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

    // Fetch all bad conduct alerts with user information
    const result = await pool.query(
      `SELECT 
        bca.*,
        u.email as user_email,
        COALESCE(u.full_name, CONCAT(u.first_name, ' ', u.last_name)) as user_name
       FROM bad_conduct_alerts bca
       JOIN users u ON bca.user_id = u.id
       WHERE u.deleted_at IS NULL
       ORDER BY 
         CASE bca.severity
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
           ELSE 5
         END,
         bca.created_at DESC`
    );

    return NextResponse.json({ alerts: result.rows });
  } catch (error) {
    console.error('Error fetching bad conduct alerts:', error);
    return NextResponse.json({ message: 'Error fetching alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { userId, alertType, severity, description, metadata } = await request.json();

    if (!userId || !alertType || !severity || !description) {
      return NextResponse.json(
        { message: 'Missing required fields: userId, alertType, severity, description' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { message: 'Invalid severity level' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO bad_conduct_alerts 
        (user_id, alert_type, severity, description, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, alertType, severity, description, JSON.stringify(metadata || {})]
    );

    return NextResponse.json({ alert: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating bad conduct alert:', error);
    return NextResponse.json({ message: 'Error creating alert' }, { status: 500 });
  }
}
