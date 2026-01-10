import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET - Fetch user's deleted flight logs (for audit purposes)
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const result = await pool.query(
      `SELECT 
        id,
        flight_date as date,
        aircraft_registration,
        aircraft_model,
        aircraft_type,
        departure_aerodrome,
        arrival_aerodrome,
        departure_time,
        arrival_time,
        time_diurno,
        time_noturno,
        time_ifr_real,
        time_under_hood,
        time_simulator,
        day_landings,
        night_landings,
        function,
        rating,
        nav_miles,
        pilot_canac_number,
        remarks,
        status,
        created_at,
        deleted_at
      FROM flight_logs
      WHERE user_id = $1 AND deleted_at IS NOT NULL
      ORDER BY deleted_at DESC`,
      [decoded.id]
    );

    return NextResponse.json({ deletedFlights: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar voos excluídos:', error);
    return NextResponse.json({ message: 'Erro ao buscar registros excluídos' }, { status: 500 });
  }
}
