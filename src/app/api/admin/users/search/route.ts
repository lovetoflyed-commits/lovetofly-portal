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

    // Build WHERE clause once - exclude soft-deleted users
    let whereClause = 'u.deleted_at IS NULL';
    const params: any[] = [];

    if (query.trim()) {
      whereClause += ` AND (
        LOWER(u.email) ILIKE $${params.length + 1} 
        OR LOWER(u.first_name) ILIKE $${params.length + 1}
        OR LOWER(u.last_name) ILIKE $${params.length + 1}
        OR LOWER(bu.business_name) ILIKE $${params.length + 1}
      )`;
      params.push(`%${query}%`);
    }

    // Combined query with window function for total count - eliminates separate count query
    const sqlQuery = `
      SELECT 
        u.id,
        CASE
          WHEN u.user_type = 'business' AND bu.business_name IS NOT NULL AND bu.business_name <> ''
            THEN bu.business_name
          ELSE CONCAT(u.first_name, ' ', u.last_name)
        END as name,
        u.email,
        u.role,
        u.aviation_role,
        u.plan,
        u.created_at,
        u.user_type,
        CASE
          WHEN u.user_type = 'business'
            THEN (u.user_type_verified OR bu.is_verified OR bu.verification_status = 'approved')
          ELSE u.user_type_verified
        END as user_type_verified,
        bu.business_name,
        bu.verification_status as business_verification_status,
        uas.access_level,
        uas.access_reason,
        ums.active_warnings,
        ums.active_strikes,
        ums.is_banned,
        ula.last_activity_at,
        ula.days_inactive,
        COUNT(*) OVER () as total_count
      FROM users u
      LEFT JOIN business_users bu ON u.id = bu.user_id
      LEFT JOIN user_access_status uas ON u.id = uas.user_id
      LEFT JOIN user_moderation_status ums ON u.id = ums.id
      LEFT JOIN user_last_activity ula ON u.id = ula.id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    params.push(limit, offset);
    const result = await pool.query(sqlQuery, params);
    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

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
