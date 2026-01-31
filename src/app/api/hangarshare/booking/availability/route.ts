import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hangarIdParam = searchParams.get('hangarId');
    const hangarId = hangarIdParam ? Number(hangarIdParam) : NaN;

    if (!hangarId || Number.isNaN(hangarId)) {
      return NextResponse.json({ error: 'hangarId inválido' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT check_in, check_out, status
       FROM hangar_bookings
       WHERE hangar_id = $1
         AND status IN ('confirmed', 'pending')
         AND (status <> 'pending' OR created_at >= NOW() - INTERVAL '30 minutes')
       ORDER BY check_in ASC`,
      [hangarId]
    );

    const ranges = result.rows.map((row: any) => ({
      checkIn: row.check_in,
      checkOut: row.check_out,
      status: row.status,
    }));

    return NextResponse.json({ ranges });
  } catch (error) {
    console.error('Error fetching booking availability:', error);
    return NextResponse.json({ error: 'Erro ao carregar disponibilidade' }, { status: 500 });
  }
}