// API Route: Create new hangar listing
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';
import { checkStrictRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import * as Sentry from '@sentry/nextjs';
import { createHangarListingSchema, validateRequest, formatValidationErrors } from '@/utils/validation';
import { z } from 'zod';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for listing creation (5 per minute)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkStrictRateLimit(`listing-create:${identifier}`);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          message: 'Too many listing creation attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }
    
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

    // 2. Get request body and validate
    const body = await request.json();
    
    // Prepare data for validation
    const validationData = {
      title: body.hangarNumber || `Hangar ${body.hangarNumber}`,
      description: body.description || body.specialNotes || '',
      city: body.aerodromeData?.city || '',
      icao_code: body.icaoCode || '',
      size_sqm: Number(body.hangarSizeSqm) || 0,
      max_length: Number(body.maxLengthMeters) || 0,
      max_wingspan: Number(body.maxWingspanMeters) || 0,
      max_height: Number(body.maxHeightMeters) || 0,
      daily_rate: Number(body.dailyRate) || 1,
      monthly_rate: Number(body.monthlyRate) || 1,
      available_spaces: Number(body.availableSpaces) || 1,
      amenities: body.amenities || [],
    };
    
    // Validate with Zod
    const validation = validateRequest(createHangarListingSchema, validationData);
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: 'Validation error',
          errors: formatValidationErrors(validation.errors)
        },
        { status: 400 }
      );
    }
    
    // Continue with original destructuring for backward compatibility
    const {
      icaoCode,
      aerodromeData, // { airport_name, city, state, country }
      hangarNumber,
      hangarSizeSqm,
      hangarLocationDescription,
      maxWingspanMeters,
      maxLengthMeters,
      maxHeightMeters,
      totalSpaces,
      availableSpaces,
      spaceDescription,
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
        total_spaces,
        available_spaces,
        space_description,
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
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, true, 'active', 'pending'
      ) RETURNING id, icao_code, hangar_number, total_spaces, available_spaces, created_at`,
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
        totalSpaces || 1,
        availableSpaces || 1,
        spaceDescription || null,
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
        listingId: newListing.id,
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
    Sentry.captureException(error, {
      tags: {
        endpoint: 'listing/create',
        method: 'POST'
      },
      extra: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
