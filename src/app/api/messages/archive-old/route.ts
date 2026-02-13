/**
 * POST /api/messages/archive-old
 * Archive messages older than N days for inbox or sent scope
 *
 * Body:
 * - scope: 'inbox' | 'sent'
 * - days: number (default: 30)
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

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

    // Check user role to determine scope
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
    const scope = body.scope === 'sent' ? 'sent' : 'inbox';
    const days = Number.isFinite(body.days) ? Number(body.days) : 30;

    const ownershipField = scope === 'inbox' ? 'recipient_user_id' : 'sender_user_id';
    const ownershipCondition = isAdminMaster ? '' : ` AND ${ownershipField} = $1`;

    let updateQuery = `
      UPDATE portal_messages
      SET metadata = jsonb_set(
            jsonb_set(COALESCE(metadata, '{}'::jsonb), '{archived}', 'true', true),
            '{archived_at}', to_jsonb(NOW()), true
          ),
          updated_at = NOW()
      WHERE sent_at < NOW() - ($${isAdminMaster ? '1' : '2'} || ' days')::interval
    `;
    
    if (!isAdminMaster) {
      updateQuery = `
        UPDATE portal_messages
        SET metadata = jsonb_set(
              jsonb_set(COALESCE(metadata, '{}'::jsonb), '{archived}', 'true', true),
              '{archived_at}', to_jsonb(NOW()), true
            ),
            updated_at = NOW()
        WHERE ${ownershipField} = $1
          AND sent_at < NOW() - ($2 || ' days')::interval
      `;
    }

    const params = isAdminMaster ? [String(days)] : [userId, String(days)];
    const result = await pool.query(updateQuery, params);

    return NextResponse.json({
      data: {
        archivedCount: result.rowCount || 0,
      },
    });
  } catch (error) {
    console.error('Error archiving old messages:', error);
    return NextResponse.json(
      { message: 'Erro ao arquivar mensagens antigas' },
      { status: 500 }
    );
  }
}
