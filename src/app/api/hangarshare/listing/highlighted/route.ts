import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(req: NextRequest) {
  try {
    const limit = req.nextUrl.searchParams.get('limit') || '10';
    const offset = req.nextUrl.searchParams.get('offset') || '0';

    // Fetch approved listings with photos, sorted by booking popularity
    const listings = await pool.query(
      `SELECT 
        h.id,
        h.hangar_number,
        h.icao_code,
        h.aerodrome_name,
        h.city,
        h.state,
        h.hangar_size_sqm,
        h.daily_rate,
        h.monthly_rate,
        h.approval_status,
        h.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'url', p.photo_url,
              'isPrimary', p.is_primary
            ) ORDER BY p.display_order
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as photos,
        u.first_name || ' ' || u.last_name as "ownerName",
        COALESCE(COUNT(b.id), 0)::int as "bookingCount"
      FROM hangar_listings h
      LEFT JOIN hangar_photos p ON p.listing_id = h.id
      LEFT JOIN users u ON h.owner_id = u.id
      LEFT JOIN hangar_bookings b ON b.hangar_id = h.id AND b.status IN ('confirmed', 'completed')
      WHERE h.approval_status = 'approved' AND h.is_available = true
      GROUP BY h.id, u.first_name, u.last_name
      ORDER BY h.created_at DESC, COUNT(b.id) DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return NextResponse.json({ 
      success: true,
      listings: listings.rows,
      total: listings.rowCount 
    });
  } catch (error: any) {
    console.error('Erro ao buscar hangares em destaque:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar hangares em destaque',
      details: error?.message || error,
      listings: [] 
    }, { status: 400 });
  }
}
