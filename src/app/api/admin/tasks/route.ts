import { NextRequest, NextResponse } from 'next/server';

import pool from '@/config/db';
import { getAdminUser, logAdminAction, requireAdmin } from '@/utils/adminAuth';

const STAFF_ROLES = [
  'admin',
  'staff',
  'master',
  'super_admin',
  'moderator',
  'operations_lead',
  'support_lead',
  'content_manager',
  'business_manager',
  'finance_manager',
  'marketing',
  'compliance',
];

const STATUS_ORDER = ['open', 'in_progress', 'review', 'blocked', 'postponed', 'done'];

type TaskRow = {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string | null;
  progress_percent: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  checklist_total: number;
  checklist_done: number;
};

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const adminUser = await getAdminUser(request);
    const body = await request.json();
    const {
      title,
      description,
      priority = 'normal',
      status = 'open',
      dueDate,
      targetType = 'all',
      targetRole,
      targetEmail,
      checklistItems = [],
    } = body;

    if (!title || !description) {
      return NextResponse.json({ message: 'Missing title or description' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let recipients: Array<{ id: number }> = [];
      if (targetType === 'all') {
        const res = await client.query(
          `SELECT id FROM users WHERE lower(role) = ANY($1::text[])`,
          [STAFF_ROLES]
        );
        recipients = res.rows;
      } else if (targetType === 'role') {
        if (!targetRole) {
          return NextResponse.json({ message: 'Missing target role' }, { status: 400 });
        }
        const normalizedRole = String(targetRole).toLowerCase();
        const res = await client.query(
          `SELECT id FROM users WHERE lower(role) = $1`,
          [normalizedRole]
        );
        recipients = res.rows;
      } else if (targetType === 'email') {
        if (!targetEmail) {
          return NextResponse.json({ message: 'Missing target email' }, { status: 400 });
        }
        const normalizedEmail = String(targetEmail).toLowerCase();
        const res = await client.query(
          `SELECT id FROM users WHERE lower(email) = $1`,
          [normalizedEmail]
        );
        recipients = res.rows;
      } else {
        return NextResponse.json({ message: 'Invalid target type' }, { status: 400 });
      }

      if (recipients.length === 0) {
        return NextResponse.json({ message: 'No recipients found' }, { status: 404 });
      }

      const taskRes = await client.query(
        `INSERT INTO admin_tasks(
           title, description, priority, status, due_date, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [title, description, priority, status, dueDate || null, adminUser?.id || null]
      );
      const taskId = taskRes.rows[0]?.id as number;

      await client.query(
        `INSERT INTO admin_task_events(task_id, event_type, payload, created_by)
         VALUES ($1, $2, $3, $4)`,
        [
          taskId,
          'task_created',
          JSON.stringify({ status, dueDate: dueDate || null, recipients: recipients.length }),
          adminUser?.id || null,
        ]
      );

      for (const recipient of recipients) {
        await client.query(
          `INSERT INTO admin_task_assignments(task_id, user_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (task_id, user_id) DO NOTHING`,
          [taskId, recipient.id, adminUser?.id || null]
        );

        await client.query(
          `INSERT INTO user_notifications(
             user_id, type, title, message, priority, action_url, action_label, metadata, expires_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '30 days')`,
          [
            recipient.id,
            'staff_task',
            title,
            description,
            priority,
            '/admin',
            'Abrir painel',
            JSON.stringify({
              taskId,
              taskStatus: status,
              dueDate: dueDate || null,
              createdBy: adminUser?.id || null,
            }),
          ]
        );
      }

      const normalizedChecklist = Array.isArray(checklistItems)
        ? checklistItems.map((item: string) => String(item).trim()).filter(Boolean)
        : [];

      for (const item of normalizedChecklist) {
        await client.query(
          `INSERT INTO admin_task_checklist_items(task_id, label)
           VALUES ($1, $2)`,
          [taskId, item]
        );
      }

      if (normalizedChecklist.length > 0) {
        await client.query(
          `INSERT INTO admin_task_events(task_id, event_type, payload, created_by)
           VALUES ($1, $2, $3, $4)`,
          [
            taskId,
            'checklist_created',
            JSON.stringify({ count: normalizedChecklist.length }),
            adminUser?.id || null,
          ]
        );
      }

      if (adminUser) {
        await logAdminAction(
          adminUser.id,
          'staff_task_created',
          'staff_task',
          String(taskId),
          { recipients: recipients.length, targetType, targetRole, targetEmail, status, dueDate, checklistCount: normalizedChecklist.length },
          request
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Task created', taskId, recipients: recipients.length }, { status: 200 });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error creating task:', error);

      if (error?.code === '42P01') {
        return NextResponse.json(
          { message: 'Migração pendente: execute a 089_create_admin_tasks.sql antes de criar tarefas.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Failed to create task' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'assigned';

    const client = await pool.connect();
    try {
      let taskRows: TaskRow[] = [];
      if (scope === 'assigned') {
        const res = await client.query(
          `SELECT t.*, 
                  COALESCE(items.total, 0) AS checklist_total,
                  COALESCE(items.done, 0) AS checklist_done
           FROM admin_tasks t
           JOIN admin_task_assignments a ON a.task_id = t.id
           LEFT JOIN (
             SELECT task_id,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE is_done) AS done
             FROM admin_task_checklist_items
             GROUP BY task_id
           ) items ON items.task_id = t.id
           WHERE a.user_id = $1
           ORDER BY t.created_at DESC
           LIMIT 100`,
          [adminUser.id]
        );
        taskRows = res.rows;
      } else {
        const res = await client.query(
          `SELECT t.*, 
                  COALESCE(items.total, 0) AS checklist_total,
                  COALESCE(items.done, 0) AS checklist_done
           FROM admin_tasks t
           LEFT JOIN (
             SELECT task_id,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE is_done) AS done
             FROM admin_task_checklist_items
             GROUP BY task_id
           ) items ON items.task_id = t.id
           ORDER BY t.created_at DESC
           LIMIT 100`
        );
        taskRows = res.rows;
      }

      const taskIds = taskRows.map((row) => row.id);
      let checklistMap: Record<number, Array<{ id: number; label: string; is_done: boolean }>> = {};

      if (taskIds.length > 0) {
        const checklistRes = await client.query(
          `SELECT id, task_id, label, is_done
           FROM admin_task_checklist_items
           WHERE task_id = ANY($1::int[])
           ORDER BY id ASC`,
          [taskIds]
        );
        checklistMap = checklistRes.rows.reduce((acc: any, item: any) => {
          if (!acc[item.task_id]) acc[item.task_id] = [];
          acc[item.task_id].push(item);
          return acc;
        }, {});
      }

      const tasks = taskRows.map((row) => {
        const checklistTotal = Number(row.checklist_total || 0);
        const checklistDone = Number(row.checklist_done || 0);
        const progress = checklistTotal > 0
          ? Math.round((checklistDone / checklistTotal) * 100)
          : Number(row.progress_percent || 0);

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          priority: row.priority,
          status: row.status,
          due_date: row.due_date,
          created_at: row.created_at,
          updated_at: row.updated_at,
          checklist_total: checklistTotal,
          checklist_done: checklistDone,
          progress_percent: progress,
          checklist_items: checklistMap[row.id] || [],
        };
      });

      const now = new Date();
      const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const stats = {
        total: tasks.length,
        open: tasks.filter((t) => t.status === 'open').length,
        in_progress: tasks.filter((t) => t.status === 'in_progress').length,
        review: tasks.filter((t) => t.status === 'review').length,
        blocked: tasks.filter((t) => t.status === 'blocked').length,
        postponed: tasks.filter((t) => t.status === 'postponed').length,
        done: tasks.filter((t) => t.status === 'done').length,
        due_soon: tasks.filter((t) => t.due_date && new Date(t.due_date) <= soon && t.status !== 'done').length,
        overdue: tasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length,
      };

      return NextResponse.json({ tasks, stats, statusOrder: STATUS_ORDER }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const adminUser = await getAdminUser(request);
    const body = await request.json();
    const { taskId, notificationId, status, title, description, dueDate } = body;

    if (!taskId && !notificationId) {
      return NextResponse.json({ message: 'Missing taskId' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (taskId) {
        const updates: string[] = [];
        const values: Array<string | number> = [];
        let index = 1;
        const changeLog: Record<string, string | null> = {};

        if (title) {
          updates.push(`title = $${index++}`);
          values.push(title);
          changeLog.title = title;
        }
        if (description) {
          updates.push(`description = $${index++}`);
          values.push(description);
          changeLog.description = description;
        }
        if (status) {
          updates.push(`status = $${index++}`);
          values.push(status);
          changeLog.status = status;
        }
        if (dueDate !== undefined) {
          updates.push(`due_date = $${index++}`);
          values.push(dueDate);
          changeLog.dueDate = dueDate;
        }

        if (updates.length === 0) {
          return NextResponse.json({ message: 'No updates provided' }, { status: 400 });
        }

        updates.push('updated_at = NOW()');
        values.push(taskId);

        await client.query(`UPDATE admin_tasks SET ${updates.join(', ')} WHERE id = $${index}`, values);

        if (Object.keys(changeLog).length > 0) {
          await client.query(
            `INSERT INTO admin_task_events(task_id, event_type, payload, created_by)
             VALUES ($1, $2, $3, $4)`,
            [taskId, 'task_updated', JSON.stringify(changeLog), adminUser?.id || null]
          );
        }

        const metadataUpdate: Record<string, string | null> = {};
        if (status) metadataUpdate.taskStatus = status;
        if (dueDate !== undefined) metadataUpdate.dueDate = dueDate;

        if (Object.keys(metadataUpdate).length > 0) {
          await client.query(
            `UPDATE user_notifications
             SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
                 updated_at = NOW()
             WHERE type = 'staff_task' AND (metadata->>'taskId')::int = $2`,
            [JSON.stringify(metadataUpdate), taskId]
          );
        }
      }

      if (notificationId && !taskId) {
        await client.query(
          `UPDATE user_notifications
           SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
               updated_at = NOW()
           WHERE id = $2 AND type = 'staff_task'`,
          [JSON.stringify({ taskStatus: status || null, dueDate: dueDate || null }), notificationId]
        );
      }

      if (adminUser) {
        await logAdminAction(
          adminUser.id,
          'staff_task_updated',
          'staff_task',
          String(taskId || notificationId),
          { status, title, description, dueDate },
          request
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Task updated' }, { status: 200 });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating task:', error);
      return NextResponse.json({ message: 'Failed to update task' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
