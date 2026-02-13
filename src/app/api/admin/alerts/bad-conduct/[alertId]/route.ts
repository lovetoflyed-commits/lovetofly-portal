import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { alertId: string } }
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
    if (!['master', 'admin', 'staff', 'moderator', 'super_admin'].includes(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const alertId = params.alertId;
    const { status, resolution_notes, reviewed_by } = await request.json();

    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    if (!['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE bad_conduct_alerts
       SET status = $1, 
           resolution_notes = $2, 
           reviewed_by = $3, 
           reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, resolution_notes || null, reviewed_by || user.id, alertId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({ alert: result.rows[0] });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ message: 'Error updating alert' }, { status: 500 });
  }
}
