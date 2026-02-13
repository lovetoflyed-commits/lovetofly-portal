/**
 * GET /api/messages/inbox
 * Fetch received messages for authenticated user
 * 
 * Query Params:
 * - module: Filter by module (optional)
 * - status: 'unread' | 'read' | 'all' (default: 'all')
 * - priority: 'low' | 'normal' | 'high' | 'urgent' (optional)
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
    const status = searchParams.get('status') || 'all';
    const archive = searchParams.get('archive') || 'active';
    const priority = searchParams.get('priority');
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
      conditions.push(`recipient_user_id = $${paramCount}`);
      params.push(userId);
    }

    // Filter by module
    if (module) {
      paramCount++;
      conditions.push(`module = $${paramCount}`);
      params.push(module.toLowerCase());
    }

    // Filter by read status
    if (status === 'unread') {
      conditions.push('is_read = false');
    } else if (status === 'read') {
      conditions.push('is_read = true');
    }

    // Filter by archive status (metadata->archived)
    if (archive === 'archived') {
      conditions.push("(metadata->>'archived') = 'true'");
    } else if (archive === 'active') {
      conditions.push("COALESCE(metadata->>'archived', 'false') <> 'true'");
    }

    // Filter by priority
    if (priority) {
      paramCount++;
      conditions.push(`priority = $${paramCount}`);
      params.push(priority.toLowerCase());
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : 'TRUE';

    // ============ Fetch Messages ============
    const messagesQuery = `
      SELECT 
        m.id,
        m.uuid,
        m.sender_user_id,
        m.sender_type,
        m.module,
        m.subject,
        m.message,
        m.priority,
        m.is_read,
        m.read_at,
        m.parent_message_id,
        m.thread_id,
        m.related_entity_type,
        m.related_entity_id,
        m.metadata,
        m.sent_at,
        m.created_at,
        NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') as sender_name,
        u.avatar_url as sender_photo
      FROM portal_messages m
      LEFT JOIN users u ON m.sender_user_id = u.id
      WHERE ${whereClause}
      ORDER BY 
        CASE m.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        m.sent_at DESC
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
    console.error('Error fetching inbox messages:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar mensagens' },
      { status: 500 }
    );
  }
}
