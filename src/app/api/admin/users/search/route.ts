import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

// GET /api/admin/users/search?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;

    // Check admin permissions
    if (!['master', 'admin', 'staff'].includes(decoded.role) && decoded.email !== 'master@lovetofly.com') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email')?.trim() || '';
    const query = searchParams.get('q')?.trim() || '';
    const searchTerm = email || query;

    if (!searchTerm) {
      return NextResponse.json(
        { message: 'Email or search term required' },
        { status: 400 }
      );
    }

    // Search by email primarily, fallback to general search
    const sqlQuery = `
      SELECT 
        u.id,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as name,
        u.email,
        u.role,
        u.created_at
      FROM users u
      WHERE (
          LOWER(u.email) = LOWER($1)
          OR LOWER(u.email) ILIKE LOWER($2)
          OR LOWER(u.first_name || ' ' || u.last_name) ILIKE LOWER($2)
        )
      ORDER BY CASE WHEN LOWER(u.email) = LOWER($1) THEN 0 ELSE 1 END, u.created_at DESC
      LIMIT 1`;

    const result = await pool.query(sqlQuery, [searchTerm, `%${searchTerm}%`]);

    if (result.rows.length === 0) {
      console.log(`[Search Users] User not found for email/query: ${searchTerm}`);
      return NextResponse.json({
        data: { user: null },
        message: 'User not found'
      }, { status: 404 });
    }

    const user = result.rows[0];
    console.log(`[Search Users] Found user ${user.id} with email ${user.email}`);

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
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
