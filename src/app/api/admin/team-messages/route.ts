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

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const adminUser = await getAdminUser(request);
    const body = await request.json();
    const {
      subject,
      message,
      priority = 'normal',
      targetType = 'all',
      targetRole,
      targetEmail,
    } = body;

    if (!subject || !message) {
      return NextResponse.json({ message: 'Missing subject or message' }, { status: 400 });
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

      for (const recipient of recipients) {
        await client.query(
          `INSERT INTO user_notifications(
             user_id, type, title, message, priority, action_url, action_label, metadata, expires_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '30 days')`,
          [
            recipient.id,
            'staff_message',
            subject,
            message,
            priority,
            '/admin',
            'Abrir painel',
            JSON.stringify({
              fromAdminId: adminUser?.id || null,
              targetType,
              targetRole: targetRole || null,
              targetEmail: targetEmail || null,
            }),
          ]
        );
      }

      if (adminUser) {
        await logAdminAction(
          adminUser.id,
          'staff_message_created',
          'staff_message',
          subject,
          { recipients: recipients.length, targetType, targetRole, targetEmail },
          request
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({ message: 'Message sent', recipients: recipients.length }, { status: 200 });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error sending staff message:', error);
      return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
