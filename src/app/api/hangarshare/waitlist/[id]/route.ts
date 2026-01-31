import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
}

const VALID_STATUSES = ['pending', 'notified', 'accepted', 'cancelled'] as const;

type WaitlistStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const status = body.status as WaitlistStatus | undefined;
    const desiredStartDate = body.desiredStartDate ? new Date(body.desiredStartDate) : null;
    const desiredEndDate = body.desiredEndDate ? new Date(body.desiredEndDate) : null;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const entryResult = await pool.query(
      `SELECT wl.*, hl.owner_id, ho.user_id AS owner_user_id
       FROM hangar_waitlist wl
       JOIN hangar_listings hl ON hl.id = wl.listing_id
       JOIN hangar_owners ho ON ho.id = hl.owner_id
       WHERE wl.id = $1`,
      [Number(id)]
    );

    if (entryResult.rows.length === 0) {
      return NextResponse.json({ message: 'Waitlist entry not found' }, { status: 404 });
    }

    const entry = entryResult.rows[0];
    const isOwner = Number(entry.owner_user_id) === Number(userId);
    const isEntryUser = Number(entry.user_id) === Number(userId);

    if (!isOwner && !isEntryUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (status !== 'cancelled' && !isOwner) {
      return NextResponse.json({ message: 'Only owner can update status' }, { status: 403 });
    }

    const result = await pool.query(
      `UPDATE hangar_waitlist
       SET status = $1,
           desired_start_date = COALESCE($2, desired_start_date),
           desired_end_date = COALESCE($3, desired_end_date),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, desiredStartDate, desiredEndDate, Number(id)]
    );

    return NextResponse.json({ waitlist: result.rows[0] });
  } catch (error) {
    console.error('Error updating waitlist entry:', error);
    return NextResponse.json({ message: 'Error updating waitlist entry' }, { status: 500 });
  }
}
