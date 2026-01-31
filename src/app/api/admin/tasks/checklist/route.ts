import { NextRequest, NextResponse } from 'next/server';

import pool from '@/config/db';
import { getAdminUser, logAdminAction, requireAdmin } from '@/utils/adminAuth';

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const adminUser = await getAdminUser(request);
    const body = await request.json();
    const { itemId, isDone } = body;

    if (!itemId || typeof isDone !== 'boolean') {
      return NextResponse.json({ message: 'Missing itemId or isDone' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE admin_task_checklist_items
         SET is_done = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING task_id`,
        [isDone, itemId]
      );

      const taskId = result.rows[0]?.task_id;

      if (taskId) {
        await client.query(
          `INSERT INTO admin_task_events(task_id, event_type, payload, created_by)
           VALUES ($1, $2, $3, $4)`,
          [
            taskId,
            'checklist_toggled',
            JSON.stringify({ itemId, isDone }),
            adminUser?.id || null,
          ]
        );
      }

      if (adminUser && taskId) {
        await logAdminAction(
          adminUser.id,
          'staff_task_checklist_updated',
          'staff_task',
          String(taskId),
          { itemId, isDone },
          request
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({ message: 'Checklist updated', taskId }, { status: 200 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
