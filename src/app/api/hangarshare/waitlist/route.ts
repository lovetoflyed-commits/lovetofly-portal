import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
}

const VALID_STATUSES = ['pending', 'notified', 'accepted', 'cancelled'] as const;

type WaitlistStatus = (typeof VALID_STATUSES)[number];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    let userId: string;
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ message: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const status = searchParams.get('status') as WaitlistStatus | null;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ message: 'Invalid status filter' }, { status: 400 });
    }

    let isOwner = false;
    let ownerId: number | null = null;

    if (listingId) {
      const ownerResult = await pool.query(
        `SELECT ho.id as owner_id
         FROM hangar_listings hl
         JOIN hangar_owners ho ON ho.id = hl.owner_id
         WHERE hl.id = $1 AND ho.user_id = $2`,
        [Number(listingId), Number(userId)]
      );
      if (ownerResult.rows.length > 0) {
        isOwner = true;
        ownerId = ownerResult.rows[0].owner_id;
      }
    }

    const filters: string[] = [];
    const values: Array<string | number> = [];

    if (listingId) {
      values.push(Number(listingId));
      filters.push(`wl.listing_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      filters.push(`wl.status = $${values.length}`);
    }

    if (!isOwner) {
      values.push(Number(userId));
      filters.push(`wl.user_id = $${values.length}`);
    } else if (ownerId) {
      values.push(ownerId);
      filters.push(`hl.owner_id = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT 
        wl.id,
        wl.listing_id,
        wl.user_id,
        wl.status,
        wl.desired_start_date,
        wl.desired_end_date,
        wl.created_at,
        wl.updated_at,
        hl.hangar_number,
        hl.airport_icao,
        ho.company_name,
        u.first_name,
        u.last_name,
        u.email
      FROM hangar_waitlist wl
      JOIN hangar_listings hl ON hl.id = wl.listing_id
      JOIN hangar_owners ho ON ho.id = hl.owner_id
      LEFT JOIN users u ON u.id = wl.user_id
      ${whereClause}
      ORDER BY wl.created_at DESC`,
      values
    );

    return NextResponse.json({ waitlist: result.rows });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json({ message: 'Error fetching waitlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    let userId: string;
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ message: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const listingId = Number(body.listingId);
    const desiredStartDate = body.desiredStartDate ? new Date(body.desiredStartDate) : null;
    const desiredEndDate = body.desiredEndDate ? new Date(body.desiredEndDate) : null;

    if (!listingId) {
      return NextResponse.json({ message: 'listingId is required' }, { status: 400 });
    }

    const existing = await pool.query(
      `SELECT id, status
       FROM hangar_waitlist
       WHERE listing_id = $1 AND user_id = $2 AND status <> 'cancelled'
       LIMIT 1`,
      [listingId, Number(userId)]
    );

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE hangar_waitlist
         SET desired_start_date = COALESCE($1, desired_start_date),
             desired_end_date = COALESCE($2, desired_end_date),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [desiredStartDate, desiredEndDate, existing.rows[0].id]
      );

      return NextResponse.json({ waitlist: updated.rows[0] });
    }

    const result = await pool.query(
      `INSERT INTO hangar_waitlist (
        listing_id,
        user_id,
        status,
        desired_start_date,
        desired_end_date
      ) VALUES ($1, $2, 'pending', $3, $4)
      RETURNING *`,
      [listingId, Number(userId), desiredStartDate, desiredEndDate]
    );

    return NextResponse.json({ waitlist: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating waitlist entry:', error);
    return NextResponse.json({ message: 'Error creating waitlist entry' }, { status: 500 });
  }
}
