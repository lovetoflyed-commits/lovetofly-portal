import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

// GET /api/admin/users/search?q=email_or_name&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let sqlQuery = `
      SELECT 
        u.id, 
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email, 
        u.role, 
        u.aviation_role, 
        u.is_hangar_owner,
        u.plan, 
        u.created_at,
        uas.access_level,
        uas.access_reason,
        ums.active_warnings,
        ums.active_strikes,
        ums.is_banned,
        ula.last_activity_at,
        ula.days_inactive
      FROM users u
      LEFT JOIN user_access_status uas ON u.id = uas.user_id
      LEFT JOIN user_moderation_status ums ON u.id = ums.id
      LEFT JOIN user_last_activity ula ON u.id = ula.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (query.trim()) {
      sqlQuery += ` AND (
        LOWER(u.email) ILIKE $${params.length + 1} 
        OR LOWER(u.first_name) ILIKE $${params.length + 1}
        OR LOWER(u.last_name) ILIKE $${params.length + 1}
      )`;
      params.push(`%${query}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM users u
      WHERE 1=1
      ${query.trim() ? `AND (
        LOWER(u.email) ILIKE $1 
        OR LOWER(u.first_name) ILIKE $1
        OR LOWER(u.last_name) ILIKE $1
      )` : ''}
    `;
    const countResult = await pool.query(
      countQuery, 
      query.trim() ? [`%${query}%`] : []
    );
    const total = parseInt(countResult.rows[0].total);

    sqlQuery += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(sqlQuery, params);

    return NextResponse.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { message: 'Error searching users' },
      { status: 500 }
    );
  }
}
