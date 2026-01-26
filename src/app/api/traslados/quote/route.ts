import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import pool from '@/config/db';
import { sendTransferQuoteRequest } from '@/utils/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      aircraftModel,
      aircraftPrefix,
      aircraftCategory,
      maintenanceStatus,
      originCity,
      originAirport,
      destinationCity,
      destinationAirport,
      dateWindowStart,
      dateWindowEnd,
      contactName,
      contactEmail,
      contactPhone,
      operatorName,
      notes,
      ownerAuthorization,
    } = body;

    if (
      !aircraftModel ||
      !aircraftPrefix ||
      !aircraftCategory ||
      !originCity ||
      !destinationCity ||
      !dateWindowStart ||
      !contactName ||
      !contactEmail ||
      !ownerAuthorization
    ) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    let userId: number | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, secret) as { userId?: string; id?: string };
        const resolvedUserId = decoded.userId ?? decoded.id;
        if (resolvedUserId) {
          userId = Number(resolvedUserId);
        }
      } catch (error) {
        console.warn('Invalid auth token for traslados quote:', error);
      }
    }

    const insertResult = await pool.query(
      `INSERT INTO traslados_requests (
        user_id,
        aircraft_model,
        aircraft_prefix,
        aircraft_category,
        maintenance_status,
        origin_city,
        origin_airport,
        destination_city,
        destination_airport,
        date_window_start,
        date_window_end,
        contact_name,
        contact_email,
        contact_phone,
        operator_name,
        notes,
        owner_authorization,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'new'
      ) RETURNING id`,
      [
        userId,
        aircraftModel,
        aircraftPrefix,
        aircraftCategory,
        maintenanceStatus || null,
        originCity,
        originAirport || null,
        destinationCity,
        destinationAirport || null,
        dateWindowStart,
        dateWindowEnd || null,
        contactName,
        contactEmail,
        contactPhone || null,
        operatorName || null,
        notes || null,
        ownerAuthorization,
      ]
    );

    const requestId = insertResult.rows[0]?.id as number | undefined;

    const emailSent = await sendTransferQuoteRequest({
      requestId,
      aircraftModel,
      aircraftPrefix,
      aircraftCategory,
      maintenanceStatus,
      originCity,
      originAirport,
      destinationCity,
      destinationAirport,
      dateWindowStart,
      dateWindowEnd,
      contactName,
      contactEmail,
      contactPhone,
      operatorName,
      notes,
    });

    if (!emailSent) {
      return NextResponse.json({ message: 'Email service unavailable' }, { status: 503 });
    }

    return NextResponse.json({ message: 'Quote request submitted', requestId }, { status: 200 });
  } catch (error) {
    console.error('Transfer quote error:', error);
    return NextResponse.json({ message: 'Error submitting quote request' }, { status: 500 });
  }
}
