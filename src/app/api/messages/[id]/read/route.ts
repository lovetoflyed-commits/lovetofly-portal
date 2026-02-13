/**
 * PATCH /api/messages/[id]/read
 * Mark a message as read
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: messageId } = await Promise.resolve(params);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(messageId);
    const numericMessageId = Number(messageId);
    if (!isUuid && !Number.isFinite(numericMessageId)) {
      return NextResponse.json(
        { message: 'ID de mensagem inválido' },
        { status: 400 }
      );
    }

    // ============ Authentication ============
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!(decoded?.id || decoded?.userId)) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const rawUserId = decoded.id ?? decoded.userId;
    const userId = String(rawUserId || '');
    if (!userId) {
      return NextResponse.json(
        { message: 'Token inválido: ID do usuário não encontrado' },
        { status: 401 }
      );
    }

    // Check user role to determine permissions
    const userRoleQuery = await pool.query<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userRoleQuery.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userRole = userRoleQuery.rows[0].role;
    const isAdminMaster = ['admin', 'master'].includes(userRole);

    console.log('[READ DEBUG]', {
      messageId,
      userId,
      userRole,
      isAdminMaster,
      isUuid
    });

    // ============ Mark as Read ============
    // Admin/Master can mark any message as read, regular users only their own
    let updateQuery: string;
    let updateParams: Array<string | number>;

    if (isAdminMaster) {
      // Admin/Master: no ownership check
      updateQuery = isUuid
        ? 'UPDATE portal_messages SET is_read = true, read_at = NOW() WHERE uuid = $1 RETURNING is_read'
        : 'UPDATE portal_messages SET is_read = true, read_at = NOW() WHERE id = $1 RETURNING is_read';
      updateParams = isUuid ? [messageId] : [numericMessageId];
      console.log('[READ DEBUG] Admin query:', updateQuery, updateParams);
    } else {
      // Regular user: enforce ownership
      updateQuery = isUuid
        ? 'UPDATE portal_messages SET is_read = true, read_at = NOW() WHERE uuid = $1 AND recipient_user_id = $2 RETURNING is_read'
        : 'UPDATE portal_messages SET is_read = true, read_at = NOW() WHERE id = $1 AND recipient_user_id = $2 RETURNING is_read';
      updateParams = isUuid ? [messageId, userId] : [numericMessageId, userId];
      console.log('[READ DEBUG] User query:', updateQuery, updateParams);
    }

    const updateResult = await pool.query(updateQuery, updateParams);

    console.log('[READ DEBUG] Update result rows:', updateResult.rows.length);

    if (updateResult.rows.length === 0) {
      // Check if message exists
      const existsQuery = isUuid
        ? 'SELECT recipient_user_id, is_read FROM portal_messages WHERE uuid = $1'
        : 'SELECT recipient_user_id, is_read FROM portal_messages WHERE id = $1';
      const existsParams: Array<string | number> = isUuid ? [messageId] : [numericMessageId];
      const existsResult = await pool.query(existsQuery, existsParams);

      if (existsResult.rows.length === 0) {
        return NextResponse.json(
          { message: 'Mensagem não encontrada' },
          { status: 404 }
        );
      }

      // If admin/master reached here, message exists but update failed (shouldn't happen)
      // If regular user reached here, they don't own the message
      if (!isAdminMaster) {
        return NextResponse.json(
          { message: 'Você não tem permissão para marcar esta mensagem' },
          { status: 403 }
        );
      }

      // For admin/master, this shouldn't happen, but return error just in case
      return NextResponse.json(
        { message: 'Erro ao marcar mensagem como lida' },
        { status: 500 }
      );
    }

    // ============ Log Activity ============
    await pool.query(
      `INSERT INTO user_activity_log
        (user_id, activity_type, activity_category, description, target_type, target_id, status)
       VALUES ($1, 'message_read', 'messaging', 'Mensagem marcada como lida', 'portal_message', $2, 'success')`,
      [userId, messageId]
    );

    return NextResponse.json({
      message: 'Mensagem marcada como lida',
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { message: 'Erro ao marcar mensagem como lida' },
      { status: 500 }
    );
  }
}
