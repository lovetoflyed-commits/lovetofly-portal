/**
 * GET /api/messages/sent
 * Fetch messages sent by authenticated user
 * 
 * Query Params:
 * - module: Filter by module (optional)
 * - priority: Filter by priority (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
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

    // Check user role to determine if they should see all messages
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

    // ============ Query Parameters ============
    const searchParams = request.nextUrl.searchParams;
    const module = searchParams.get('module');
    const priority = searchParams.get('priority');
    const archive = searchParams.get('archive') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // ============ Build Query ============
    // Admin/Master users see all messages, regular users only see their own
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (!isAdminMaster) {
      paramCount++;
      conditions.push(`sender_user_id = $${paramCount}`);
      params.push(userId);
    }

    if (module) {
      paramCount++;
      conditions.push(`module = $${paramCount}`);
      params.push(module.toLowerCase());
    }

    if (priority) {
      paramCount++;
      conditions.push(`priority = $${paramCount}`);
      params.push(priority.toLowerCase());
    }

    if (archive === 'archived') {
      conditions.push("(metadata->>'archived') = 'true'");
    } else if (archive === 'active') {
      conditions.push("COALESCE(metadata->>'archived', 'false') <> 'true'");
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : 'TRUE';

    // ============ Fetch Messages ============
    const messagesQuery = `
      SELECT 
        m.id,
        m.uuid,
        m.recipient_user_id,
        m.module,
        m.subject,
        m.message,
        m.priority,
        m.thread_id,
        m.related_entity_type,
        m.related_entity_id,
        m.metadata,
        m.sent_at,
        NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') as recipient_name,
        u.avatar_url as recipient_photo,
        m.is_read,
        m.read_at
      FROM portal_messages m
      LEFT JOIN users u ON m.recipient_user_id = u.id
      WHERE ${whereClause}
      ORDER BY m.sent_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);
    const messagesResult = await pool.query(messagesQuery, params);

    // ============ Count Total ============
    const countQuery = `
      SELECT COUNT(*) as total
      FROM portal_messages
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params.slice(0, paramCount));
    const total = parseInt(countResult.rows[0]?.total || '0');

    // ============ Response ============
    return NextResponse.json({
      data: {
        messages: messagesResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar mensagens enviadas' },
      { status: 500 }
    );
  }
}
