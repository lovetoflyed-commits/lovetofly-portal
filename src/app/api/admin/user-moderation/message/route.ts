import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

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
    if (!['master', 'admin', 'staff', 'moderator', 'super_admin'].includes(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { userId, message, adminId } = await request.json();

    if (!userId || !message) {
      return NextResponse.json(
        { message: 'Missing required fields: userId, message' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert message into moderation_messages table
      const messageResult = await client.query(
        `INSERT INTO moderation_messages 
          (sender_user_id, recipient_user_id, message, sent_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, sent_at`,
        [adminId || user.id, userId, message]
      );

      // Log activity
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || null;
      const userAgent = request.headers.get('user-agent') || null;

      await client.query(
        `INSERT INTO user_activity_log
          (user_id, activity_type, activity_category, description, details, target_type, target_id, status, ip_address, user_agent)
         VALUES ($1, 'admin_message_sent', 'admin', $2, $3, 'user', $4, 'success', $5, $6)`,
        [
          adminId || user.id,
          'Admin enviou mensagem para usuário',
          JSON.stringify({ message: message.substring(0, 100) }),
          userId,
          ipAddress,
          userAgent
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json(
        { 
          message: 'Mensagem enviada com sucesso',
          messageId: messageResult.rows[0].id,
          sentAt: messageResult.rows[0].sent_at
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ message: 'Error sending message' }, { status: 500 });
  }
}
