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
    let userId: number;

    try {
      const decoded = jwt.verify(token, secret) as any;
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch notifications
    let query = `
      SELECT id, title, message, type, read, link, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    
    if (unreadOnly) {
      query += ' AND read = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2';

    const result = await pool.query(query, [userId, limit]);

    // Get unread count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE',
      [userId]
    );

    return NextResponse.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count),
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
    let userId: number;

    try {
      const decoded = jwt.verify(token, secret) as any;
      userId = decoded.userId;
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
        'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
        [userId]
      );

      return NextResponse.json({
        message: 'Todas as notificações marcadas como lidas',
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const result = await pool.query(
        'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
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
