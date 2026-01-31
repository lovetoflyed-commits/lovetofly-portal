import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const reportId = Number(id);
    if (!reportId) {
      return NextResponse.json({ message: 'Invalid report id' }, { status: 400 });
    }

    const body = await request.json();
    const status = String(body.status || '').toLowerCase();
    const adminNotes = body.admin_notes ? String(body.admin_notes) : null;

    if (!['pending', 'reviewed', 'actioned', 'dismissed'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const updateRes = await pool.query(
      `UPDATE content_reports
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, adminNotes, user.id, reportId]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ report: updateRes.rows[0] });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ message: 'Error updating report' }, { status: 500 });
  }
}
