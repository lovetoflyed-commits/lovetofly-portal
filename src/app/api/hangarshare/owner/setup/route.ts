import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/config/db';
import * as Sentry from '@sentry/nextjs';
import { checkStrictRateLimit, getClientIdentifier } from '@/lib/ratelimit';

interface JWTPayload {
  id: number;
  userId?: number;
  email?: string;
}

/**
 * POST /api/hangarshare/owner/setup
 * Create a hangar owner profile
 * Requires: Authorization header with valid JWT
 */
export async function POST(request: Request) {
  const identifier = getClientIdentifier(request);

  try {
    // Rate limiting
    const { success } = await checkStrictRateLimit(identifier);
    if (!success) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
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
      Sentry.captureMessage('Invalid token in owner setup', 'warning');
      return NextResponse.json(
        { message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      companyName,
      cnpj,
      businessPhone,
      businessEmail,
      businessAddress,
      businessCity,
      businessWebsite,
    } = body;

    // Validate required fields
    if (!companyName || !cnpj) {
      return NextResponse.json(
        { message: 'Missing required fields: companyName, cnpj' },
        { status: 400 }
      );
    }

    // Validate CNPJ format (basic check - just digits)
    const cnpjDigits = cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) {
      return NextResponse.json(
        { message: 'Invalid CNPJ format' },
        { status: 400 }
      );
    }

    // Check if user already has an owner profile
    const existingOwner = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [userId]
    );

    if (existingOwner.rows.length > 0) {
      return NextResponse.json(
        { message: 'User already has an owner profile' },
        { status: 400 }
      );
    }

    // Insert owner profile
    const result = await pool.query(
      `INSERT INTO hangar_owners 
       (user_id, company_name, cnpj, business_phone, business_email, business_address, business_city, business_website, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, company_name, cnpj`,
      [
        userId,
        companyName,
        cnpjDigits,
        businessPhone || null,
        businessEmail || null,
        businessAddress || null,
        businessCity || null,
        businessWebsite || null,
        'pending_approval',
      ]
    );

    const ownerId = result.rows[0].id;

    // Log to Sentry
    Sentry.captureMessage('Owner profile created', 'info');

    return NextResponse.json(
      {
        message: 'Owner profile created successfully',
        ownerId,
        owner: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in owner setup:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
