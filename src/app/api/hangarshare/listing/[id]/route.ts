import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
}

// GET - Fetch listing details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'ID de hangar inválido' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        h.id,
        h.hangar_number as "hangarNumber",
        h.icao_code as "icaoCode",
        h.aerodrome_name as "aerodromeName",
        h.city,
        h.state,
        h.hangar_size_sqm as "hangarSizeSqm",
        h.max_wingspan_meters as "maxWingspanMeters",
        h.max_length_meters as "maxLengthMeters",
        h.max_height_meters as "maxHeightMeters",
        h.accepted_aircraft_categories as "acceptedAircraftCategories",
        h.hourly_rate as "hourlyRate",
        h.daily_rate as "dailyRate",
        h.weekly_rate as "weeklyRate",
        h.monthly_rate as "monthlyRate",
        h.available_from as "availableFrom",
        h.available_until as "availableUntil",
        h.accepts_online_payment as "acceptsOnlinePayment",
        h.accepts_payment_on_arrival as "acceptsPaymentOnArrival",
        h.accepts_payment_on_departure as "acceptsPaymentOnDeparture",
        h.cancellation_policy as "cancellationPolicy",
        h.operating_hours as "operatingHours",
        h.hangar_location_description as "hangarLocationDescription",
        h.services,
        h.description,
        h.special_notes as "specialNotes",
        h.is_available as "isAvailable",
        h.approval_status as "approvalStatus",
        h.verification_status as "verificationStatus",
        h.status as "status",
        h.created_at as "createdAt",
        h.updated_at as "updatedAt",
        h.owner_id as "ownerId",
        u.first_name || ' ' || u.last_name as "ownerName",
        u.email as "ownerEmail",
        u.mobile_phone as "ownerPhone",
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'photoUrl', p.photo_url,
              'isPrimary', p.is_primary,
              'displayOrder', p.display_order
            ) ORDER BY p.display_order
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as photos
      FROM hangar_listings h
      LEFT JOIN users u ON h.owner_id = u.id
      LEFT JOIN hangar_photos p ON p.listing_id = h.id
      WHERE h.id = $1
      GROUP BY h.id, u.first_name, u.last_name, u.email, u.mobile_phone`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Hangar não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hangar: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching hangar:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar hangar' },
      { status: 500 }
    );
  }
}

// PATCH - Update listing (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'ID de hangar inválido' },
        { status: 400 }
      );
    }

    // JWT Authentication
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

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM hangar_listings WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Hangar não encontrado' }, { status: 404 });
    }

    const listingOwnerId = ownerCheck.rows[0].owner_id;
    const userOwnerCheck = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [decoded.userId]
    );

    if (userOwnerCheck.rows.length === 0 || userOwnerCheck.rows[0].id !== listingOwnerId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();

    // Update listing with all fields
    const updateResult = await pool.query(
      `UPDATE hangar_listings SET
        hangar_number = COALESCE($1, hangar_number),
        icao_code = COALESCE($2, icao_code),
        aerodrome_name = COALESCE($3, aerodrome_name),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        hangar_size_sqm = COALESCE($6, hangar_size_sqm),
        max_wingspan_meters = COALESCE($7, max_wingspan_meters),
        max_length_meters = COALESCE($8, max_length_meters),
        max_height_meters = COALESCE($9, max_height_meters),
        accepted_aircraft_categories = COALESCE($10, accepted_aircraft_categories),
        hourly_rate = COALESCE($11, hourly_rate),
        daily_rate = COALESCE($12, daily_rate),
        weekly_rate = COALESCE($13, weekly_rate),
        monthly_rate = COALESCE($14, monthly_rate),
        available_from = COALESCE($15, available_from),
        available_until = COALESCE($16, available_until),
        accepts_online_payment = COALESCE($17, accepts_online_payment),
        accepts_payment_on_arrival = COALESCE($18, accepts_payment_on_arrival),
        accepts_payment_on_departure = COALESCE($19, accepts_payment_on_departure),
        cancellation_policy = COALESCE($20, cancellation_policy),
        operating_hours = COALESCE($21, operating_hours),
        hangar_location_description = COALESCE($22, hangar_location_description),
        services = COALESCE($23, services),
        description = COALESCE($24, description),
        special_notes = COALESCE($25, special_notes),
        is_available = COALESCE($26, is_available),
        updated_at = NOW()
      WHERE id = $27
      RETURNING id`,
      [
        body.hangarNumber,
        body.icaoCode,
        body.aerodromeName,
        body.city,
        body.state,
        body.hangarSizeSqm,
        body.maxWingspanMeters,
        body.maxLengthMeters,
        body.maxHeightMeters,
        body.acceptedAircraftCategories,
        body.hourlyRate,
        body.dailyRate,
        body.weeklyRate,
        body.monthlyRate,
        body.availableFrom,
        body.availableUntil,
        body.acceptsOnlinePayment,
        body.acceptsPaymentOnArrival,
        body.acceptsPaymentOnDeparture,
        body.cancellationPolicy,
        body.operatingHours,
        body.hangarLocationDescription,
        body.services,
        body.description,
        body.specialNotes,
        body.isAvailable,
        id
      ]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Erro ao atualizar hangar' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Hangar atualizado com sucesso',
      listingId: updateResult.rows[0].id
    });

  } catch (error) {
    console.error('Error updating hangar:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar hangar' },
      { status: 500 }
    );
  }
}

// DELETE - Delete listing (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'ID de hangar inválido' },
        { status: 400 }
      );
    }

    // JWT Authentication
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

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM hangar_listings WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Hangar não encontrado' }, { status: 404 });
    }

    const listingOwnerId = ownerCheck.rows[0].owner_id;
    const userOwnerCheck = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [decoded.userId]
    );

    if (userOwnerCheck.rows.length === 0 || userOwnerCheck.rows[0].id !== listingOwnerId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Delete listing (CASCADE will delete photos)
    await pool.query('DELETE FROM hangar_listings WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Hangar removido com sucesso'
    });

  } catch (error) {
    console.error('Error deleting hangar:', error);
    return NextResponse.json(
      { error: 'Erro ao remover hangar' },
      { status: 500 }
    );
  }
}
