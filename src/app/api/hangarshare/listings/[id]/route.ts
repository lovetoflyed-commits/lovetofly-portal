import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await pool.query(
      `SELECT id, owner_id, status, icao_code,
              hangar_number, hangar_location_description, hangar_size_sqm,
              max_wingspan_meters, max_length_meters, max_height_meters,
              hourly_rate, daily_rate, weekly_rate, monthly_rate,
              available_from, available_until, special_notes,
              accepts_online_payment, accepts_payment_on_arrival, accepts_payment_on_departure,
              cancellation_policy, is_available, description,
              created_at, updated_at
       FROM hangar_listings WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch listing to check owner/admin
    const listingRes = await pool.query('SELECT owner_id FROM hangar_listings WHERE id = $1', [id]);
    if (listingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    const isOwner = listingRes.rows[0].owner_id === user.id;
    const isAdmin = user.role === 'MASTER' || user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      status,
      icaoCode, hangarNumber, hangarLocationDescription, hangarSizeSqm,
      maxWingspanMeters, maxLengthMeters, maxHeightMeters,
      hourlyRate, dailyRate, weeklyRate, monthlyRate,
      availableFrom, availableUntil, specialNotes,
      acceptsOnlinePayment, acceptsPaymentOnArrival, acceptsPaymentOnDeparture,
      cancellationPolicy, isAvailable, description
    } = body;

    const normalizedStatus = typeof status === 'string' ? status : null;
    const normalizedIsAvailable = typeof isAvailable === 'boolean' ? isAvailable : null;

    // Update listing with all fields
    const updateRes = await pool.query(
      `UPDATE hangar_listings SET 
        status = COALESCE($1, status),
        icao_code = COALESCE($2, icao_code),
        hangar_number = COALESCE($3, hangar_number),
        hangar_location_description = COALESCE($4, hangar_location_description),
        hangar_size_sqm = COALESCE($5, hangar_size_sqm),
        max_wingspan_meters = COALESCE($6, max_wingspan_meters),
        max_length_meters = COALESCE($7, max_length_meters),
        max_height_meters = COALESCE($8, max_height_meters),
        hourly_rate = COALESCE($9, hourly_rate),
        daily_rate = COALESCE($10, daily_rate),
        weekly_rate = COALESCE($11, weekly_rate),
        monthly_rate = COALESCE($12, monthly_rate),
        available_from = COALESCE($13, available_from),
        available_until = COALESCE($14, available_until),
        special_notes = COALESCE($15, special_notes),
        accepts_online_payment = COALESCE($16, accepts_online_payment),
        accepts_payment_on_arrival = COALESCE($17, accepts_payment_on_arrival),
        accepts_payment_on_departure = COALESCE($18, accepts_payment_on_departure),
        cancellation_policy = COALESCE($19, cancellation_policy),
        is_available = COALESCE($20, is_available),
        description = COALESCE($21, description),
        updated_at = NOW()
       WHERE id = $22 
       RETURNING id, owner_id, status, icao_code, 
                 hangar_number, hangar_location_description, hangar_size_sqm,
                 max_wingspan_meters, max_length_meters, max_height_meters,
                 hourly_rate, daily_rate, weekly_rate, monthly_rate,
                 available_from, available_until, special_notes,
                 accepts_online_payment, accepts_payment_on_arrival, accepts_payment_on_departure,
                 cancellation_policy, is_available, description, created_at, updated_at`,
      [
        normalizedStatus,
        icaoCode ?? null,
        hangarNumber ?? null,
        hangarLocationDescription ?? null,
        hangarSizeSqm ?? null,
        maxWingspanMeters ?? null,
        maxLengthMeters ?? null,
        maxHeightMeters ?? null,
        hourlyRate ?? null,
        dailyRate ?? null,
        weeklyRate ?? null,
        monthlyRate ?? null,
        availableFrom ?? null,
        availableUntil ?? null,
        specialNotes ?? null,
        acceptsOnlinePayment ?? null,
        acceptsPaymentOnArrival ?? null,
        acceptsPaymentOnDeparture ?? null,
        cancellationPolicy ?? null,
        normalizedIsAvailable,
        description ?? null,
        id
      ]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Listing updated successfully',
      listing: updateRes.rows[0] 
    });
  } catch (error: any) {
    console.error('Error updating listing:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  }
}
