import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = auth.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET as string;
    let payload: any;
    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.id;
    const client = await pool.connect();
    try {
      // Get unread notifications
      const notifRes = await client.query(
        `SELECT id, type, title, message, priority, action_url, action_label, is_read, created_at
         FROM user_notifications
         WHERE user_id = $1 AND is_dismissed = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      );

      return NextResponse.json(
        {
          notifications: notifRes.rows,
          unread_count: notifRes.rows.filter((n: any) => !n.is_read).length,
        },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = auth.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET as string;
    let payload: any;
    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id, action } = body; // action: 'read', 'dismiss'

    if (!notification_id || !action) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      if (action === 'read') {
        await client.query(
          'UPDATE user_notifications SET is_read = TRUE, read_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2',
          [notification_id, payload.id]
        );
      } else if (action === 'dismiss') {
        await client.query(
          'UPDATE user_notifications SET is_dismissed = TRUE, dismissed_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2',
          [notification_id, payload.id]
        );
      }

      return NextResponse.json({ message: `Notification ${action}ed` }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
