import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        hb.id,
        hb.user_id,
        hb.hangar_id,
        hb.status,
        hb.total_price,
        hb.check_in,
        hb.check_out,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        hl.title as hangar_title
      FROM hangar_bookings hb
      JOIN users u ON hb.user_id = u.id
      JOIN hangar_listings hl ON hb.hangar_id = hl.id
      ORDER BY hb.created_at DESC
      LIMIT 500
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching HangarShare bookings:', error);
    return NextResponse.json(
      { message: 'Error fetching bookings' },
      { status: 500 }
    );
  }
}
