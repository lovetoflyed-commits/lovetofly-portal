/**
 * GET /api/admin/messages/reports
 * Get message reports for admin review
 * 
 * Query Params:
 * - status: 'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed'
 * - page: number
 * - limit: number
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    // ============ Authentication & Authorization ============
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded?.id && !decoded?.userId) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Extract user ID (supports both id and userId fields)
    const userId = String(decoded.id || decoded.userId || '');
    if (!userId) {
      console.log('[Reports] No valid user ID found in token');
      return NextResponse.json(
        { message: 'Token inválido: ID do usuário não encontrado' },
        { status: 401 }
      );
    }
    console.log('[Reports] User ID:', userId, 'Type:', typeof userId);

    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    console.log('[Reports] Admin check result:', adminCheck.rows);

      if (adminCheck.rows.length === 0 || !['admin', 'superadmin', 'master', 'staff'].includes(adminCheck.rows[0].role)) {
      console.log('[Reports] Access denied - user role:', adminCheck.rows[0]?.role || 'not found');
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      );
    }

    // ============ Query Parameters ============
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // ============ Build Query ============
    let whereClause = '1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (status !== 'all') {
      paramCount++;
      whereClause += ` AND r.status = $${paramCount}`;
      params.push(status);
    }

    // ============ Fetch Reports ============
    const reportsQuery = `
      SELECT 
        r.id,
        r.message_id,
        r.reporter_user_id,
        r.reason,
        r.details,
        r.status,
        r.reviewed_by,
        r.review_notes,
        r.action_taken,
        r.created_at,
        r.reviewed_at,
        m.subject as message_subject,
        m.message as message_content,
        sender.first_name || ' ' || COALESCE(sender.last_name, '') as message_sender,
        reporter.first_name || ' ' || COALESCE(reporter.last_name, '') as reporter_name
      FROM portal_message_reports r
      INNER JOIN portal_messages m ON r.message_id = m.id
      LEFT JOIN users sender ON m.sender_user_id::uuid = sender.id
      LEFT JOIN users reporter ON r.reporter_user_id::uuid = reporter.id
      WHERE ${whereClause}
      ORDER BY 
        CASE r.status
          WHEN 'pending' THEN 1
          WHEN 'reviewing' THEN 2
          WHEN 'resolved' THEN 3
          WHEN 'dismissed' THEN 4
        END,
        r.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);
    
    // Try to fetch reports (with fallback if table doesn't exist)
    let reportsResult;
    let total = 0;
    try {
      reportsResult = await pool.query(reportsQuery, params);

      // ============ Count Total ============
      const countQuery = `
        SELECT COUNT(*) as total
        FROM portal_message_reports r
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params.slice(0, paramCount));
      total = parseInt(countResult.rows[0]?.total || '0');
    } catch (error: any) {
      // Table doesn't exist yet - return empty results
      if (error.message?.includes('does not exist')) {
        reportsResult = { rows: [] };
        total = 0;
      } else {
        throw error;
      }
    }

    // ============ Response ============
    return NextResponse.json({
      data: {
        reports: reportsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar denúncias' },
      { status: 500 }
    );
  }
}
