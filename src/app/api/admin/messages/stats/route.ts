/**
 * GET /api/admin/messages/stats
 * Get messaging statistics for admin dashboard
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
      console.log('[Stats] No valid user ID found in token');
      return NextResponse.json(
        { message: 'Token inválido: ID do usuário não encontrado' },
        { status: 401 }
      );
    }
    console.log('[Stats] User ID:', userId, 'Type:', typeof userId);

    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    console.log('[Stats] Admin check result:', adminCheck.rows);

      if (adminCheck.rows.length === 0 || !['admin', 'superadmin', 'master', 'staff'].includes(adminCheck.rows[0].role)) {
      console.log('[Stats] Access denied - user role:', adminCheck.rows[0]?.role || 'not found');
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      );
    }

    // ============ Fetch Stats ============
    
    // Total messages
    const totalMessagesResult = await pool.query(
      'SELECT COUNT(*) as count FROM portal_messages'
    );
    const totalMessages = parseInt(totalMessagesResult.rows[0]?.count || '0');

    // Total reports (with fallback if table doesn't exist)
    let totalReports = 0;
    let pendingReports = 0;
    try {
      const totalReportsResult = await pool.query(
        'SELECT COUNT(*) as count FROM portal_message_reports'
      );
      totalReports = parseInt(totalReportsResult.rows[0]?.count || '0');

      // Pending reports
      const pendingReportsResult = await pool.query(
        "SELECT COUNT(*) as count FROM portal_message_reports WHERE status = 'pending'"
      );
      pendingReports = parseInt(pendingReportsResult.rows[0]?.count || '0');
    } catch (error: any) {
      // Table doesn't exist yet - return 0
      if (!error.message?.includes('does not exist')) {
        throw error;
      }
    }

    // Today's messages
    const todayMessagesResult = await pool.query(
      "SELECT COUNT(*) as count FROM portal_messages WHERE DATE(sent_at) = CURRENT_DATE"
    );
    const todayMessages = parseInt(todayMessagesResult.rows[0]?.count || '0');

    // Messages by module
    const byModuleResult = await pool.query(
      `SELECT module, COUNT(*) as count 
       FROM portal_messages 
       GROUP BY module 
       ORDER BY count DESC`
    );

    // Messages by priority
    const byPriorityResult = await pool.query(
      `SELECT priority, COUNT(*) as count 
       FROM portal_messages 
       GROUP BY priority 
       ORDER BY 
         CASE priority
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'normal' THEN 3
           WHEN 'low' THEN 4
         END`
    );

    // Response rate (messages with replies)
    const responseRateResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT parent_message_id) as replied,
        (SELECT COUNT(*) FROM portal_messages WHERE parent_message_id IS NULL) as total
       FROM portal_messages 
       WHERE parent_message_id IS NOT NULL`
    );
    const replied = parseInt(responseRateResult.rows[0]?.replied || '0');
    const totalParents = parseInt(responseRateResult.rows[0]?.total || '1');
    const responseRate = Math.round((replied / totalParents) * 100);

    // ============ Response ============
    return NextResponse.json({
      data: {
        totalMessages,
        totalReports,
        pendingReports,
        todayMessages,
        responseRate,
        byModule: byModuleResult.rows.reduce((acc: any, row: any) => {
          acc[row.module] = parseInt(row.count);
          return acc;
        }, {}),
        byPriority: byPriorityResult.rows.reduce((acc: any, row: any) => {
          acc[row.priority] = parseInt(row.count);
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
