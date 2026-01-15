import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/config/db';
import * as Sentry from '@sentry/nextjs';

interface JWTPayload {
  id: number;
  userId?: number;
  email?: string;
}

/**
 * GET /api/hangarshare/owner/listings
 * Fetch all listings for the authenticated owner
 * Requires: Authorization header with valid JWT
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    let userId: number;
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      userId = decoded.id || decoded.userId || parseInt(String(decoded));
      if (!userId) throw new Error('No user ID in token');
    } catch {
      Sentry.captureMessage('Invalid token in owner listings', 'warning');
      return NextResponse.json(
        { message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get owner ID from user_id
    const ownerResult = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [userId]
    );

    if (ownerResult.rows.length === 0) {
      return NextResponse.json(
        { listings: [] },
        { status: 200 }
      );
    }

    const ownerId = ownerResult.rows[0].id;

    // Fetch all listings for this owner
    const result = await pool.query(
      `SELECT 
        id, 
        icao_code, 
        hangar_number, 
        hangar_size_sqm, 
        daily_rate, 
        status, 
        default_booking_type,
        created_at,
        updated_at
       FROM hangar_listings
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [ownerId]
    );

    // Map to expected format
    const listings = result.rows.map((row: any) => ({
      id: row.id,
      icao: row.icao_code,
      hangarNumber: row.hangar_number,
      sizeM2: row.hangar_size_sqm,
      dailyRate: row.daily_rate,
      status: row.status || 'pending_approval',
      bookingType: row.default_booking_type === 'non_refundable' ? 'Não reembolsável' : 'Reembolsável',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json(
      { listings, count: listings.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching owner listings:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
