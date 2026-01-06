import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
}

// GET - Fetch owner's bookings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JWTPayload;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Get owner's bookings with listing details
    const result = await pool.query(
      `SELECT 
        b.id,
        b.listing_id,
        b.user_id,
        b.checkin,
        b.checkout,
        b.subtotal,
        b.fees,
        b.total,
        b.payment_method,
        b.payment_status,
        b.booking_status,
        b.special_requests,
        b.created_at,
        b.updated_at,
        h.icao_code as "icaoCode",
        h.hangar_number as "hangarNumber",
        h.daily_rate as "dailyRate",
        u.first_name || ' ' || u.last_name as "clientName",
        u.email as "clientEmail"
      FROM bookings b
      JOIN hangar_listings h ON b.listing_id = h.id
      JOIN users u ON b.user_id = u.id
      WHERE h.owner_id = (SELECT id FROM hangar_owners WHERE user_id = $1)
      ORDER BY b.created_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({
      success: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar reservas' },
      { status: 500 }
    );
  }
}
