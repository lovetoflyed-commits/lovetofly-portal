import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'available';
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = `
      SELECT 
        id, 
        hangar_number, 
        aerodrome_name, 
        city, 
        description,
        image_url,
        hourly_rate,
        daily_rate,
        monthly_rate,
        availability_status,
        is_paid,
        paid_at,
        owner_id,
        created_at
      FROM hangar_listings
      WHERE availability_status = $1
    `;

    const params: any[] = [status];
    let paramIndex = 2;

    if (city) {
      query += ` AND city = $${paramIndex}`;
      params.push(city);
      paramIndex++;
    }

    query += ` ORDER BY id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Also get total count
    let countQuery = `SELECT COUNT(*) as total FROM hangar_listings WHERE availability_status = $1`;
    const countParams: any[] = [status];

    if (city) {
      countQuery += ` AND city = $2`;
      countParams.push(city);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    return NextResponse.json(
      {
        success: true,
        data: result.rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching listings with images:', error);
    return NextResponse.json(
      { message: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
