import { NextResponse } from 'next/server';
import pool from '@/config/db';

// GET /api/admin/bookings - list recent bookings for admin dashboard
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, user_id, hangar_id, status, start_date, end_date, total_price AS amount, payment_status, created_at
       FROM bookings
       ORDER BY created_at DESC
       LIMIT 200`
    );

    return NextResponse.json({ bookings: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar reservas (admin):', error);
    return NextResponse.json({ message: 'Erro ao buscar reservas' }, { status: 500 });
  }
}
