import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        hl.id,
        hl.owner_id,
        CONCAT(hl.hangar_number, ' - ', hl.aerodrome_name) as title,
        CONCAT(hl.city, ', ', hl.state) as location,
        hl.city as location_city,
        hl.status,
        hl.daily_rate as price,
        hl.monthly_rate,
        hl.created_at,
        ho.company_name
      FROM hangar_listings hl
      JOIN hangar_owners ho ON hl.owner_id = ho.id
      ORDER BY hl.created_at DESC
      LIMIT 500
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching HangarShare listings:', error);
    return NextResponse.json(
      { message: 'Error fetching listings' },
      { status: 500 }
    );
  }
}
