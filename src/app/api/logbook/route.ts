import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Normalize time/interval values to HH:MM strings
const formatTime = (value: any): string => {
  if (!value) return '00:00';
  if (typeof value === 'string') {
    const str = value.includes(':') ? value : `${value}:00`;
    return str.slice(0, 5);
  }
  if (typeof value === 'object') {
    const hours = Number(value.hours ?? 0);
    const minutes = Number(value.minutes ?? 0);
    const totalMinutes = hours * 60 + minutes;
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return '00:00';
};

// GET - Fetch user's flight logs
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
        created_at
      FROM flight_logs
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY flight_date DESC, created_at DESC`,
      [decoded.id]
    );
    const flights = result.rows.map((row) => ({
      ...row,
      time_diurno: formatTime(row.time_diurno),
      time_noturno: formatTime(row.time_noturno),
      time_ifr_real: formatTime(row.time_ifr_real),
      time_under_hood: formatTime(row.time_under_hood),
      time_simulator: formatTime(row.time_simulator),
      departure_time: formatTime(row.departure_time),
      arrival_time: formatTime(row.arrival_time),
    }));

    return NextResponse.json({ flights }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar voos:', error);
    return NextResponse.json({ message: 'Erro ao buscar registros de voo' }, { status: 500 });
  }
}

// POST - Create new flight log entry
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const body = await request.json();
    const {
      date,
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
      function: pilotFunction,
      rating,
      nav_miles,
      pilot_canac_number,
      remarks
    } = body;

    // Validate required fields
    if (!date || !aircraft_registration || !departure_aerodrome || !arrival_aerodrome) {
      return NextResponse.json({ message: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO flight_logs (
        user_id,
        flight_date,
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
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
      RETURNING 
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
        created_at`,
      [
        decoded.id,
        date,
        aircraft_registration,
        aircraft_model,
        aircraft_type || 'Avião',
        departure_aerodrome,
        arrival_aerodrome,
        departure_time || null,
        arrival_time || null,
        time_diurno || '00:00',
        time_noturno || '00:00',
        time_ifr_real || '00:00',
        time_under_hood || '00:00',
        time_simulator || '00:00',
        day_landings || 0,
        night_landings || 0,
        pilotFunction || 'PIC',
        rating || 'VFR',
        nav_miles || 0,
        pilot_canac_number || '',
        remarks || '',
        'CADASTRADO'
      ]
    );
    const row = result.rows[0];
    const flight = {
      ...row,
      time_diurno: formatTime(row.time_diurno),
      time_noturno: formatTime(row.time_noturno),
      time_ifr_real: formatTime(row.time_ifr_real),
      time_under_hood: formatTime(row.time_under_hood),
      time_simulator: formatTime(row.time_simulator),
      departure_time: formatTime(row.departure_time),
      arrival_time: formatTime(row.arrival_time),
    };

    return NextResponse.json(
      { message: 'Voo registrado com sucesso', flight },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao salvar voo:', error);
    return NextResponse.json({ message: 'Erro ao registrar voo' }, { status: 500 });
  }
}

// DELETE - Soft delete a flight log (marks as deleted, keeps in database for audit)
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('id');

    if (!logId) {
      return NextResponse.json({ message: 'ID do voo não fornecido' }, { status: 400 });
    }

    // Soft delete - set deleted_at timestamp
    const result = await pool.query(
      `UPDATE flight_logs 
       SET deleted_at = NOW() 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id, flight_date, aircraft_registration`,
      [logId, decoded.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Voo não encontrado ou já foi excluído' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Voo excluído com sucesso', flight: result.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir voo:', error);
    return NextResponse.json({ message: 'Erro ao excluir voo' }, { status: 500 });
  }
}
