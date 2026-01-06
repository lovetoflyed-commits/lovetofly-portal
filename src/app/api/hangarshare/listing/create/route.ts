// API Route: Create new hangar listing
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    let userId: string;
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 2. Get request body
    const body = await request.json();
    const {
      icaoCode,
      aerodromeData, // { airport_name, city, state, country }
      hangarNumber,
      hangarSizeSqm,
      hangarLocationDescription,
      maxWingspanMeters,
      maxLengthMeters,
      maxHeightMeters,
      hourlyRate,
      dailyRate,
      weeklyRate,
      monthlyRate,
      availableFrom,
      availableUntil,
      acceptsOnlinePayment,
      acceptsPaymentOnArrival,
      acceptsPaymentOnDeparture,
      cancellationPolicy,
      description,
      specialNotes,
    } = body;

    // 3. Validate required fields
    if (!icaoCode || !hangarNumber || !hangarSizeSqm) {
      return NextResponse.json(
        { message: 'Missing required fields: icaoCode, hangarNumber, hangarSizeSqm' },
        { status: 400 }
      );
    }

    // 4. Check if user has hangar_owner profile
    const ownerCheck = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [userId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'User must complete owner setup first. Go to /hangarshare/owner/setup' },
        { status: 403 }
      );
    }

    const ownerId = ownerCheck.rows[0].id;

    // 5. Insert listing into database
    const result = await pool.query(
      `INSERT INTO hangar_listings (
        owner_id,
        icao_code,
        aerodrome_name,
        city,
        state,
        country,
        hangar_number,
        size_sqm,
        hangar_location_description,
        max_wingspan,
        max_length,
        max_height,
        hourly_rate,
        daily_rate,
        weekly_rate,
        monthly_rate,
        available_from,
        available_until,
        accepts_online_payment,
        accepts_payment_on_arrival,
        accepts_payment_on_departure,
        cancellation_policy,
        description,
        special_notes,
        is_available,
        status,
        approval_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, true, 'active', 'pending'
      ) RETURNING id, icao_code, hangar_number, created_at`,
      [
        ownerId,
        icaoCode,
        aerodromeData?.airport_name || '',
        aerodromeData?.city || '',
        aerodromeData?.state || '',
        aerodromeData?.country || 'Brasil',
        hangarNumber,
        hangarSizeSqm,
        hangarLocationDescription || null,
        maxWingspanMeters || null,
        maxLengthMeters || null,
        maxHeightMeters || null,
        hourlyRate || null,
        dailyRate || null,
        weeklyRate || null,
        monthlyRate || null,
        availableFrom || null,
        availableUntil || null,
        acceptsOnlinePayment !== undefined ? acceptsOnlinePayment : true,
        acceptsPaymentOnArrival !== undefined ? acceptsPaymentOnArrival : true,
        acceptsPaymentOnDeparture !== undefined ? acceptsPaymentOnDeparture : false,
        cancellationPolicy || 'flexible',
        description || null,
        specialNotes || null,
      ]
    );

    const newListing = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Listing created successfully! Pending admin approval.',
        listing: {
          id: newListing.id,
          icaoCode: newListing.icao_code,
          hangarNumber: newListing.hangar_number,
          createdAt: newListing.created_at,
          status: 'pending_approval',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
