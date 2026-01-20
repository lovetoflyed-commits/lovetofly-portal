import { NextResponse } from 'next/server';
import pool from '@/config/db';

// GET /api/admin/bookings - list recent bookings for admin dashboard
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT 
         id,
         user_id,
         (SELECT id FROM hangar_listings WHERE id = hb.hangar_id LIMIT 1) AS hangar_id,
         hb.status,
         hb.check_in AS start_date,
         hb.check_out AS end_date,
         hb.total_price AS amount,
         hb.status AS payment_status,
         hb.created_at
       FROM hangar_bookings hb
       ORDER BY hb.created_at DESC
       LIMIT 200`
    );

    return NextResponse.json({ bookings: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar reservas (admin):', error);
    return NextResponse.json({ message: 'Erro ao buscar reservas' }, { status: 500 });
  }
}
