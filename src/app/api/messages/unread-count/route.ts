/**
 * GET /api/messages/unread-count
 * Get count of unread messages for badge display
 * 
 * Query Params:
 * - module: Filter by specific module (optional)
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

    // ============ Query Parameters ============
    const searchParams = request.nextUrl.searchParams;
    const module = searchParams.get('module');

    // ============ Build Query ============
    // Admin/Master users see all unread messages, regular users only see their own
    // IMPORTANT: Exclude archived messages from unread count
    let query = `
      SELECT COUNT(*) as unread_count
      FROM portal_messages
      WHERE is_read = false
        AND (metadata IS NULL OR (metadata->>'archived') IS NULL OR (metadata->>'archived') = 'false')
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (!isAdminMaster) {
      paramCount++;
      query += ` AND recipient_user_id = $${paramCount}`;
      params.push(userId);
    }

    if (module) {
      paramCount++;
      query += ` AND module = $${paramCount}`;
      params.push(module.toLowerCase());
    }

    // ============ Execute Query ============
    const result = await pool.query(query, params);
    const unreadCount = parseInt(result.rows[0]?.unread_count || '0');

    // ============ Get Count by Priority (optional detail) ============
    let priorityQuery = `
      SELECT 
        priority,
        COUNT(*) as count
      FROM portal_messages
      WHERE is_read = false
        AND (metadata IS NULL OR (metadata->>'archived') IS NULL OR (metadata->>'archived') = 'false')
    `;
    
    const priorityParams: any[] = [];
    let priorityParamCount = 0;

    if (!isAdminMaster) {
      priorityParamCount++;
      priorityQuery += ` AND recipient_user_id = $${priorityParamCount}`;
      priorityParams.push(userId);
    }

    if (module) {
      priorityParamCount++;
      priorityQuery += ` AND module = $${priorityParamCount}`;
      priorityParams.push(module.toLowerCase());
    }

    priorityQuery += ' GROUP BY priority';

    const priorityResult = await pool.query(priorityQuery, priorityParams);
    const byPriority = priorityResult.rows.reduce((acc: any, row: any) => {
      acc[row.priority] = parseInt(row.count);
      return acc;
    }, {});

    // ============ Response ============
    return NextResponse.json({
      data: {
        unreadCount,
        byPriority,
        hasUrgent: (byPriority.urgent || 0) > 0,
      },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar contador de mensagens' },
      { status: 500 }
    );
  }
}
