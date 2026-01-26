import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || '';
    let userId: string;

    try {
      const decoded = jwt.verify(token, secret) as any;
      userId = decoded.userId ?? decoded.id;
    } catch (err) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const limit = Number.isNaN(limitParam)
      ? 50
      : Math.min(Math.max(limitParam, 1), 100);

    // Fetch notifications and unread count in a single roundtrip
    // CTE fetches the page, scalar subquery returns unread_count for all notifications
    const baseQuery = `
      WITH stats AS (
        SELECT COUNT(*)::int AS unread_count
        FROM user_notifications
        WHERE user_id = $1 AND is_read = FALSE
      ),
      paged AS (
        SELECT id, title, message, type, is_read, action_url, action_label, created_at
        FROM user_notifications
        WHERE user_id = $1
        ${unreadOnly ? 'AND is_read = FALSE' : ''}
        ORDER BY created_at DESC
        LIMIT $2
      )
      SELECT p.*, s.unread_count
      FROM stats s
      LEFT JOIN paged p ON TRUE
      ORDER BY p.created_at DESC NULLS LAST`;

    const result = await pool.query(baseQuery, [userId, limit]);

    const unreadCount = result.rows.length > 0
      ? result.rows[0].unread_count
      : 0;

    return NextResponse.json({
      notifications: result.rows
        .filter(row => row.id)
        .map(row => ({
          id: row.id,
          title: row.title,
          message: row.message,
          type: row.type,
          is_read: row.is_read,
          action_url: row.action_url,
          action_label: row.action_label,
          created_at: row.created_at,
        })),
      unreadCount,
    });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || '';
    let userId: string;

    try {
      const decoded = jwt.verify(token, secret) as any;
      userId = decoded.userId ?? decoded.id;
    } catch (err) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      await pool.query(
        'UPDATE user_notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = FALSE',
        [userId]
      );

      return NextResponse.json({
        message: 'Todas as notificações marcadas como lidas',
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const result = await pool.query(
        'UPDATE user_notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Notificação não encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Notificação marcada como lida',
        notification: result.rows[0],
      });
    } else {
      return NextResponse.json(
        { error: 'notificationId ou markAllAsRead necessário' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar notificação' },
      { status: 500 }
    );
  }
}
