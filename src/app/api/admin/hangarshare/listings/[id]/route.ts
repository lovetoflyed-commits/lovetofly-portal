import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = id;

    const result = await pool.query(
      `
      SELECT
        hl.*,
        ho.company_name,
        ho.cnpj,
        ho.phone,
        ho.address,
        ho.website,
        ho.is_verified AS owner_verified,
        ho.verification_status AS owner_verification_status,
        u.first_name,
        u.last_name,
        u.email
      FROM hangar_listings hl
      LEFT JOIN hangar_owners ho ON ho.id = hl.owner_id
      LEFT JOIN users u ON u.id = ho.user_id
      WHERE hl.id = $1
      LIMIT 1
      `,
      [listingId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error fetching listing details:', err);
    return NextResponse.json(
      { message: 'Error fetching listing details', error: err },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = id;
    const body = await request.json();

    const allowedFields = new Set([
      'icao_code',
      'aerodrome_name',
      'city',
      'state',
      'country',
      'hangar_number',
      'hangar_location_description',
      'hangar_size_sqm',
      'max_wingspan_meters',
      'max_length_meters',
      'max_height_meters',
      'accepted_aircraft_categories',
      'hourly_rate',
      'daily_rate',
      'weekly_rate',
      'monthly_rate',
      'available_from',
      'available_until',
      'is_available',
      'operating_hours',
      'services',
      'description',
      'special_notes',
      'accepts_online_payment',
      'accepts_payment_on_arrival',
      'accepts_payment_on_departure',
      'cancellation_policy',
      'verification_status',
      'status',
      'photos'
    ]);

    const jsonFields = new Set([
      'accepted_aircraft_categories',
      'operating_hours',
      'services',
      'photos'
    ]);

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(body || {}).forEach(([key, value]) => {
      if (!allowedFields.has(key)) return;

      updates.push(`${key} = $${paramCount}`);
      if (jsonFields.has(key)) {
        values.push(value === null ? null : JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramCount++;
    });

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(listingId);

    const query = `
      UPDATE hangar_listings
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Listing updated successfully',
      listing: result.rows[0]
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error updating listing:', err);
    return NextResponse.json(
      { message: 'Error updating listing', error: err },
      { status: 500 }
    );
  }
}