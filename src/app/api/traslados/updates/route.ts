import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import pool from '@/config/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = Number(searchParams.get('requestId') || 0);

    if (!requestId) {
      return NextResponse.json({ message: 'Missing requestId' }, { status: 400 });
    }

    const updatesResult = await pool.query(
      `SELECT * FROM traslados_operation_updates
       WHERE request_id = $1
       ORDER BY created_at DESC`,
      [requestId]
    );

    return NextResponse.json({ updates: updatesResult.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching traslados updates:', error);
    return NextResponse.json({ message: 'Error fetching updates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    let userId: number | null = null;

    try {
      const decoded = jwt.verify(token, secret) as { userId?: string; id?: string };
      const resolvedUserId = decoded.userId ?? decoded.id;
      if (resolvedUserId) {
        userId = Number(resolvedUserId);
      }
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      requestId,
      updateType,
      statusLabel,
      message,
      flightNumber,
      departureAirport,
      arrivalAirport,
      stopoverAirport,
      startedAt,
      arrivedAt,
      interruptionReason,
    } = body;

    if (!requestId || !updateType || !message) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO traslados_operation_updates (
        request_id,
        created_by,
        update_type,
        status_label,
        message,
        flight_number,
        departure_airport,
        arrival_airport,
        stopover_airport,
        started_at,
        arrived_at,
        interruption_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        requestId,
        userId,
        updateType,
        statusLabel || null,
        message,
        flightNumber || null,
        departureAirport || null,
        arrivalAirport || null,
        stopoverAirport || null,
        startedAt ? new Date(startedAt) : null,
        arrivedAt ? new Date(arrivedAt) : null,
        interruptionReason || null,
      ]
    );

    return NextResponse.json({ update: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Error creating traslados update:', error);
    return NextResponse.json({ message: 'Error creating update' }, { status: 500 });
  }
}
