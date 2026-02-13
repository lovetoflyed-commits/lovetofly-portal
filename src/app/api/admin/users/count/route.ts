/**
 * GET /api/admin/users/count
 * Count users by module/filter for broadcast estimation
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

    // Use id (primary) or userId (fallback) from token payload
    const userIdFromToken = decoded.id || decoded.userId;

    // Check if user has admin/staff privileges (same as main admin dashboard)
    const adminCheck = await pool.query(
      'SELECT role, email FROM users WHERE id = $1',
      [userIdFromToken]
    );

    if (adminCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userRole = adminCheck.rows[0].role;
    const userEmail = adminCheck.rows[0].email;
    
    const hasAdminAccess = 
      userRole === 'master' || 
      userRole === 'admin' || 
      userRole === 'staff' || 
      userEmail === 'lovetofly.ed@gmail.com';

    if (!hasAdminAccess) {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      );
    }

    // ============ Get Query Parameters ============
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module') || 'all';

    // ============ Count Users ============
    let query: string;
    const params: any[] = [];

    // Filter by module
    if (module === 'all' || !module) {
      // All active users in the system
      query = 'SELECT COUNT(*) as count FROM users';
    } else if (module === 'hangarshare') {
      // Users who own or have interacted with HangarShare
      query = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        LEFT JOIN hangar_owners ho ON u.id = ho.user_id
        LEFT JOIN hangar_bookings hb ON u.id = hb.user_id
        WHERE ho.id IS NOT NULL OR hb.id IS NOT NULL
      `;
    } else if (module === 'career') {
      // Users who have applied to jobs or own companies
      query = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        LEFT JOIN job_applications ja ON u.id = ja.user_id
        LEFT JOIN companies c ON u.id = c.user_id
        WHERE ja.id IS NOT NULL OR c.id IS NOT NULL
      `;
    } else if (module === 'traslados') {
      // Users who have traslado requests or are pilots
      query = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        LEFT JOIN traslados_requests tr ON u.id = tr.user_id
        LEFT JOIN traslados_pilots tp ON u.id = tp.user_id
        WHERE tr.id IS NOT NULL OR tp.id IS NOT NULL
      `;
    } else {
      // Default: all users
      query = 'SELECT COUNT(*) as count FROM users';
    }

    const result = await pool.query(query, params);
    const count = parseInt(result.rows[0]?.count || '0');

    return NextResponse.json({
      data: {
        count,
        module,
      },
    });
  } catch (error) {
    console.error('Error counting users:', error);
    return NextResponse.json(
      { message: 'Erro ao contar usuários' },
      { status: 500 }
    );
  }
}
