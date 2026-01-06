// Admin API - Get pending hangar listings for approval
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
        hl.*,
        ho.company_name,
        ho.cnpj,
        ho.verified as owner_verified,
        u.first_name,
        u.last_name,
        u.email
      FROM hangar_listings hl
      JOIN hangar_owners ho ON hl.owner_id = ho.id
      JOIN users u ON ho.user_id = u.id
      WHERE hl.approval_status = $1
      ORDER BY hl.created_at ASC
      LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM hangar_listings WHERE approval_status = $1',
      [status]
    );

    return NextResponse.json({
      listings: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { message: 'Error fetching listings' },
      { status: 500 }
    );
  }
}
