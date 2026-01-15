import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { checkStrictRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import * as Sentry from '@sentry/nextjs';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { message: 'Payment system not configured' },
      { status: 503 }
    );
  }
  try {
    // Rate limiting for payment intent creation
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkStrictRateLimit(`payment-intent:${identifier}`);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          message: 'Too many payment requests. Please try again later.',
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
    
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = auth.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET as string;
    let payload: any;
    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id, amount = 2500 } = body; // Default 2500 BRL for hangar listing activation

    if (!listing_id) {
      return NextResponse.json({ message: 'Missing listing_id' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Get listing and owner info
      const listingRes = await client.query(
        `SELECT hl.id, hl.title, hl.owner_id, ho.user_id, u.email, u.first_name, u.last_name
         FROM hangar_listings hl
         LEFT JOIN hangar_owners ho ON ho.id = hl.owner_id
         LEFT JOIN users u ON u.id = ho.user_id
         WHERE hl.id = $1`,
        [listing_id]
      );

      if ((listingRes.rowCount ?? 0) === 0) {
        return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
      }

      const listing = listingRes.rows[0];
      const ownerEmail = listing.email || '';
      const ownerName = `${listing.first_name} ${listing.last_name}`.trim() || 'HangarShare Owner';

      // Create Stripe Payment Intent for owner
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'brl',
        payment_method_types: ['card'],
        description: `HangarShare Listing Activation: ${listing.title}`,
        metadata: {
          listing_id: listing_id.toString(),
          owner_email: ownerEmail,
          listing_title: listing.title,
        },
        statement_descriptor: 'LoveToFly HangarShare',
      });

      // Store payment intent reference in database
      await client.query(
        `UPDATE hangar_listings 
         SET stripe_payment_intent_id = $1, payment_status = 'pending'
         WHERE id = $2`,
        [paymentIntent.id, listing_id]
      );

      return NextResponse.json(
        {
          payment_intent_id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount,
          currency: 'BRL',
          status: paymentIntent.status,
          listing_id,
        },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'payment-intent',
        method: 'POST',
        stripe: 'true'
      },
      extra: {
        errorType: error?.type,
        errorCode: error?.code,
        stripeCode: error?.raw?.code
      }
    });
    
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { message: error.message || 'Error creating payment intent' },
      { status: 500 }
    );
  }
}
