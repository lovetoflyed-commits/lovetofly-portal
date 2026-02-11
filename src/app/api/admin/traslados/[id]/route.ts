import { NextRequest, NextResponse } from 'next/server';

import pool from '@/config/db';
import { getAdminUser, logAdminAction, requireAdmin } from '@/utils/adminAuth';

const VALID_STATUSES = ['new', 'in_review', 'scheduled', 'completed', 'cancelled'];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, adminNotes, assignedTo } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const updateFields = [] as string[];
    const values = [] as Array<string | number | null>;
    let paramIndex = 1;

    if (status) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (adminNotes !== undefined) {
      updateFields.push(`admin_notes = $${paramIndex++}`);
      values.push(adminNotes || null);
    }

    if (assignedTo !== undefined) {
      updateFields.push(`assigned_to = $${paramIndex++}`);
      values.push(assignedTo ? Number(assignedTo) : null);
    }

    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) {
      return NextResponse.json({ message: 'No updates provided' }, { status: 400 });
    }

    values.push(Number(id));

    const result = await pool.query(
      `UPDATE traslados_requests
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    const adminUser = await getAdminUser(request);
    if (adminUser) {
      await logAdminAction(
        adminUser.id,
        'update',
        'traslados_request',
        id,
        { status, adminNotes, assignedTo },
        request
      );
    }

    return NextResponse.json({ request: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating traslados request:', error);
    return NextResponse.json({ message: 'Error updating request' }, { status: 500 });
  }
}
