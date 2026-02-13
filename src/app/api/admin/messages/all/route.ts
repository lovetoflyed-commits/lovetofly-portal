/**
 * GET /api/admin/messages/all
 * Fetch all portal messages for admin overview
 *
 * Query Params:
 * - module: module filter (optional, default: all)
 * - status: 'unread' | 'read' | 'all' (default: all)
 * - priority: 'low' | 'normal' | 'high' | 'urgent' | 'all' (default: all)
 * - search: search subject/message/sender/recipient (optional)
 * - page: page number (default: 1)
 * - limit: items per page (default: 50, max: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function GET(request: NextRequest) {
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
    const userId = typeof rawUserId === 'number'
      ? rawUserId
      : parseInt(String(rawUserId || '0'), 10);
    if (!userId) {
      return NextResponse.json(
        { message: 'Token invalido: ID do usuario nao encontrado' },
        { status: 401 }
      );
    }

    const adminCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (adminCheck.rows.length === 0 || !['admin', 'superadmin', 'master', 'staff'].includes(adminCheck.rows[0].role)) {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const module = searchParams.get('module') || 'all';
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const archive = searchParams.get('archive') || 'active';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramCount = 0;

    if (module !== 'all') {
      paramCount++;
      conditions.push(`m.module = $${paramCount}`);
      params.push(module.toLowerCase());
    }

    if (status === 'read') {
      conditions.push('m.is_read = true');
    } else if (status === 'unread') {
      conditions.push('m.is_read = false');
    }

    if (priority !== 'all') {
      paramCount++;
      conditions.push(`m.priority = $${paramCount}`);
      params.push(priority.toLowerCase());
    }

    if (archive === 'archived') {
      conditions.push("(m.metadata->>'archived') = 'true'");
    } else if (archive === 'active') {
      conditions.push("COALESCE(m.metadata->>'archived', 'false') <> 'true'");
    }

    if (search.trim()) {
      paramCount++;
      const searchValue = `%${search.trim()}%`;
      conditions.push(`(
        m.subject ILIKE $${paramCount}
        OR m.message ILIKE $${paramCount}
        OR s.email ILIKE $${paramCount}
        OR r.email ILIKE $${paramCount}
        OR (COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) ILIKE $${paramCount}
        OR (COALESCE(r.first_name, '') || ' ' || COALESCE(r.last_name, '')) ILIKE $${paramCount}
      )`);
      params.push(searchValue);
    }

    const whereClause = conditions.join(' AND ');

    const messagesQuery = `
      SELECT
        m.id,
        m.uuid,
        m.sender_user_id,
        m.recipient_user_id,
        m.sender_type,
        m.module,
        m.subject,
        m.message,
        m.priority,
        m.is_read,
        m.read_at,
        m.sent_at,
        NULLIF(TRIM(COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')), '') as sender_name,
        s.email as sender_email,
        s.avatar_url as sender_photo,
        NULLIF(TRIM(COALESCE(r.first_name, '') || ' ' || COALESCE(r.last_name, '')), '') as recipient_name,
        r.email as recipient_email,
        r.avatar_url as recipient_photo
      FROM portal_messages m
      LEFT JOIN users s ON m.sender_user_id = s.id
      LEFT JOIN users r ON m.recipient_user_id = r.id
      WHERE ${whereClause}
      ORDER BY m.sent_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);
    const messagesResult = await pool.query(messagesQuery, params);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM portal_messages m
      LEFT JOIN users s ON m.sender_user_id = s.id
      LEFT JOIN users r ON m.recipient_user_id = r.id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params.slice(0, paramCount));
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

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
    console.error('Error fetching all messages:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar mensagens' },
      { status: 500 }
    );
  }
}
