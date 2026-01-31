import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

async function getStripe() {
  const Stripe = (await import('stripe')).default;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY ausente. Configure no .env.local e reinicie o servidor.');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' as any });
}

const LISTING_TABLES: Record<string, string> = {
  aircraft: 'aircraft_listings',
  parts: 'parts_listings',
  avionics: 'avionics_listings',
};

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const listingType = String(body.listingType || '').toLowerCase();
    const listingId = Number(body.listingId);

    if (!LISTING_TABLES[listingType] || !listingId) {
      return NextResponse.json({ error: 'Invalid listing' }, { status: 400 });
    }

    const table = LISTING_TABLES[listingType];
    const listingRes = await pool.query(
      `SELECT id, user_id, title, price FROM ${table} WHERE id = $1`,
      [listingId]
    );

    if (listingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const listing = listingRes.rows[0];
    if (Number(listing.user_id) === user.id) {
      return NextResponse.json({ error: 'Você não pode comprar seu próprio anúncio.' }, { status: 400 });
    }

    const existingTx = await pool.query(
      `SELECT id, status
       FROM classifieds_transactions
       WHERE listing_type = $1 AND listing_id = $2 AND status IN ('paid', 'released')
       LIMIT 1`,
      [listingType, listingId]
    );

    if (existingTx.rows.length > 0) {
      return NextResponse.json({ error: 'Este anúncio já foi vendido.' }, { status: 409 });
    }

    const amountCents = Math.round(Number(listing.price) * 100);
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
    }

    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'brl',
      metadata: {
        listing_type: listingType,
        listing_id: String(listingId),
        buyer_user_id: String(user.id),
        seller_user_id: String(listing.user_id),
      },
    });

    const insertRes = await pool.query(
      `INSERT INTO classifieds_transactions (
        listing_type,
        listing_id,
        buyer_user_id,
        seller_user_id,
        amount_cents,
        currency,
        status,
        escrow_status,
        stripe_payment_intent_id
      ) VALUES ($1, $2, $3, $4, $5, $6, 'requires_payment', 'holding', $7)
      RETURNING id`,
      [listingType, listingId, user.id, listing.user_id, amountCents, 'BRL', paymentIntent.id]
    );

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      transactionId: insertRes.rows[0].id,
      listing: {
        id: listing.id,
        title: listing.title,
        price: Number(listing.price),
        listingType,
      },
    });
  } catch (error: any) {
    console.error('Error creating classifieds payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent', details: error?.message },
      { status: 500 }
    );
  }
}
