import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    const sizeColumnCheck = await pool.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'hangar_listings'
         AND column_name = 'size_sqm'
       LIMIT 1`
    );
    const hasSizeSqm = sizeColumnCheck.rows.length > 0;

    const result = await pool.query(`
      SELECT 
        hl.id,
        hl.owner_id,
        hl.icao_code,
        hl.hangar_number,
        hl.aerodrome_name,
        hl.city,
        hl.state,
        COALESCE(hl.hangar_number, hl.aerodrome_name, '') as title,
        COALESCE(hl.city, '') as location_city,
        ${hasSizeSqm ? 'hl.size_sqm' : 'NULL::numeric'} as size_sqm,
        hl.daily_rate as price,
        hl.monthly_rate as monthly_price,
        hl.status,
        hl.approval_status,
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
