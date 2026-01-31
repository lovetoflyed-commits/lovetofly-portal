import { NextRequest, NextResponse } from 'next/server';

import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const query = searchParams.get('q')?.trim();
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const includeDocs = searchParams.get('includeDocs') === '1';

    const whereClauses = ['status = $1'];
    const values: Array<string | number> = [status];
    let paramIndex = 2;

    if (query) {
      values.push(`%${query}%`);
      whereClauses.push(
        `(full_name ILIKE $${paramIndex}
          OR contact_email ILIKE $${paramIndex}
          OR license_number ILIKE $${paramIndex}
          OR base_city ILIKE $${paramIndex}
          OR CAST(id as text) ILIKE $${paramIndex})`
      );
      paramIndex += 1;
    }

    const whereSql = whereClauses.join(' AND ');

    const result = await pool.query(
      `SELECT * FROM traslados_pilots
       WHERE ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM traslados_pilots WHERE ${whereSql}`,
      values
    );

    let documents: Array<{ pilot_id: number; document_type: string; file_path: string; file_name: string | null }> = [];
    if (includeDocs && result.rows.length > 0) {
      const pilotIds = result.rows.map((pilot) => pilot.id);
      const docsResult = await pool.query(
        `SELECT pilot_id, document_type, file_path, file_name
         FROM traslados_pilot_documents
         WHERE pilot_id = ANY($1::int[])`,
        [pilotIds]
      );
      documents = docsResult.rows;
    }

    return NextResponse.json({
      pilots: result.rows,
      documents,
      pagination: {
        page,
        limit,
        total: Number(countResult.rows[0].count),
        totalPages: Math.ceil(Number(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching traslados pilots:', error);
    return NextResponse.json({ message: 'Error fetching pilots' }, { status: 500 });
  }
}
