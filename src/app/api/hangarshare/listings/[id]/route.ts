import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    const result = await pool.query(
      `SELECT id, owner_id, title, price, description, status, icao_code, 
              hangar_number, hangar_location_description, hangar_size_sqm,
              max_wingspan_meters, max_length_meters, max_height_meters,
              hourly_rate, daily_rate, weekly_rate, monthly_rate,
              available_from, available_until, special_notes,
              accepts_online_payment, accepts_payment_on_arrival, accepts_payment_on_departure,
              cancellation_policy, created_at, updated_at
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
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

    // Validate required fields
    const { 
      title, price, description, status,
      icaoCode, hangarNumber, hangarLocationDescription, hangarSizeSqm,
      maxWingspanMeters, maxLengthMeters, maxHeightMeters,
      hourlyRate, dailyRate, weeklyRate, monthlyRate,
      availableFrom, availableUntil, specialNotes,
      acceptsOnlinePayment, acceptsPaymentOnArrival, acceptsPaymentOnDeparture,
      cancellationPolicy
    } = body;

    if (!title || !price || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update listing with all fields
    const updateRes = await pool.query(
      `UPDATE hangar_listings SET 
        title = $1, price = $2, description = $3, status = $4,
        icao_code = $5, hangar_number = $6, hangar_location_description = $7, hangar_size_sqm = $8,
        max_wingspan_meters = $9, max_length_meters = $10, max_height_meters = $11,
        hourly_rate = $12, daily_rate = $13, weekly_rate = $14, monthly_rate = $15,
        available_from = $16, available_until = $17, special_notes = $18,
        accepts_online_payment = $19, accepts_payment_on_arrival = $20, accepts_payment_on_departure = $21,
        cancellation_policy = $22, updated_at = NOW()
       WHERE id = $23 
       RETURNING id, owner_id, title, price, description, status, icao_code, 
                 hangar_number, hangar_location_description, hangar_size_sqm,
                 max_wingspan_meters, max_length_meters, max_height_meters,
                 hourly_rate, daily_rate, weekly_rate, monthly_rate,
                 available_from, available_until, special_notes,
                 accepts_online_payment, accepts_payment_on_arrival, accepts_payment_on_departure,
                 cancellation_policy, created_at, updated_at`,
      [
        title, price, description, status || 'active',
        icaoCode, hangarNumber || null, hangarLocationDescription || null, hangarSizeSqm || null,
        maxWingspanMeters || null, maxLengthMeters || null, maxHeightMeters || null,
        hourlyRate || null, dailyRate || null, weeklyRate || null, monthlyRate || null,
        availableFrom || null, availableUntil || null, specialNotes || null,
        acceptsOnlinePayment ?? true, acceptsPaymentOnArrival ?? true, acceptsPaymentOnDeparture ?? false,
        cancellationPolicy || 'flexible', id
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
