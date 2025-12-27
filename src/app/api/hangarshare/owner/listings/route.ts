import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

// Retorna todas as listagens do proprietário autenticado, incluindo default_booking_type
export async function GET(req: NextRequest) {
  try {
    // TODO: autenticação real (exemplo: pegar userId do token)
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id, icao_code, hangar_number, hangar_size_sqm, daily_rate, status, bookings, revenue, rating, default_booking_type
       FROM hangar_listings
       WHERE owner_id = $1`,
      [userId]
    );

    // Mapeia para formato esperado pelo dashboard
    const listings = result.rows.map((row: any) => ({
      id: row.id,
      icao: row.icao_code,
      hangarNumber: row.hangar_number,
      sizeM2: row.hangar_size_sqm,
      dailyRate: row.daily_rate,
      status: row.status,
      bookings: row.bookings || 0,
      revenue: row.revenue || 0,
      rating: row.rating || 0,
      bookingType: row.default_booking_type === 'non_refundable' ? 'Não reembolsável' : 'Reembolsável',
    }));

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Erro ao buscar listagens do proprietário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
