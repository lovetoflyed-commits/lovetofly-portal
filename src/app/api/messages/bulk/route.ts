/**
 * POST /api/messages/bulk
 * Bulk actions for inbox/sent messages
 *
 * Body:
 * - messageIds: number[]
 * - action: 'mark_read' | 'mark_unread' | 'archive' | 'unarchive'
 * - scope: 'inbox' | 'sent'
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

const allowedActions = ['mark_read', 'mark_unread', 'archive', 'unarchive'] as const;
const allowedScopes = ['inbox', 'sent'] as const;

type BulkAction = typeof allowedActions[number];
type BulkScope = typeof allowedScopes[number];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token nao fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded?.id && !decoded?.userId) {
      return NextResponse.json(
        { message: 'Token invalido ou expirado' },
        { status: 401 }
      );
    }

    const rawUserId = decoded.id ?? decoded.userId;
    const userId = String(rawUserId || '');
    if (!userId) {
      return NextResponse.json(
        { message: 'Token invalido: ID do usuario nao encontrado' },
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

    const body = await request.json();
    const messageIds = Array.isArray(body.messageIds)
      ? body.messageIds.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
      : [];
    const action = body.action as BulkAction;
    const scope = body.scope as BulkScope;

    if (messageIds.length === 0) {
      return NextResponse.json(
        { message: 'Nenhuma mensagem selecionada' },
        { status: 400 }
      );
    }

    if (!allowedActions.includes(action) || !allowedScopes.includes(scope)) {
      return NextResponse.json(
        { message: 'Acao invalida' },
        { status: 400 }
      );
    }

    if ((action === 'mark_read' || action === 'mark_unread') && scope !== 'inbox') {
      return NextResponse.json(
        { message: 'Acao permitida apenas na caixa de entrada' },
        { status: 400 }
      );
    }

    // Admin/Master can perform bulk actions on any message
    // Regular users can only perform actions on their own messages
    const ownershipField = scope === 'inbox' ? 'recipient_user_id' : 'sender_user_id';
    const ownershipCondition = isAdminMaster ? '' : ` AND ${ownershipField} = $2`;

    let updateQuery = '';
    const params: any[] = [messageIds];
    if (!isAdminMaster) {
      params.push(userId);
    }

    if (action === 'mark_read') {
      updateQuery = `
        UPDATE portal_messages
        SET is_read = true, read_at = NOW()
        WHERE id = ANY($1)${ownershipCondition}
      `;
    } else if (action === 'mark_unread') {
      updateQuery = `
        UPDATE portal_messages
        SET is_read = false, read_at = NULL
        WHERE id = ANY($1)${ownershipCondition}
      `;
    } else if (action === 'archive') {
      updateQuery = `
        UPDATE portal_messages
        SET metadata = jsonb_set(
              jsonb_set(COALESCE(metadata, '{}'::jsonb), '{archived}', 'true', true),
              '{archived_at}', to_jsonb(NOW()), true
            ),
            updated_at = NOW()
        WHERE id = ANY($1)${ownershipCondition}
      `;
    } else if (action === 'unarchive') {
      updateQuery = `
        UPDATE portal_messages
        SET metadata = (COALESCE(metadata, '{}'::jsonb) - 'archived' - 'archived_at'),
            updated_at = NOW()
        WHERE id = ANY($1)${ownershipCondition}
      `;
    }

    const result = await pool.query(updateQuery, params);

    return NextResponse.json({
      data: {
        updatedCount: result.rowCount || 0,
      },
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar mensagens' },
      { status: 500 }
    );
  }
}
