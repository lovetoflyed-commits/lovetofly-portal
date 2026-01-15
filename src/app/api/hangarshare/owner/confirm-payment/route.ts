import { NextResponse } from 'next/server';
import pool from '@/config/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_intent_id } = body;

    if (!payment_intent_id) {
      return NextResponse.json({ message: 'Missing payment_intent_id' }, { status: 400 });
    }

    // Verify payment status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get listing associated with this payment
      const listingRes = await client.query(
        `SELECT id, owner_id FROM hangar_listings WHERE stripe_payment_intent_id = $1`,
        [payment_intent_id]
      );

      if ((listingRes.rowCount ?? 0) === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
      }

      const listingId = listingRes.rows[0].id;

      if (paymentIntent.status === 'succeeded') {
        // Mark listing as paid and available
        await client.query(
          `UPDATE hangar_listings 
           SET is_paid = TRUE,
               paid_at = NOW(),
               paid_amount = $1,
               paid_currency = 'BRL',
               approval_status = 'approved',
               availability_status = 'available',
               payment_status = 'completed',
               updated_at = NOW()
           WHERE id = $2`,
          [Math.round(paymentIntent.amount / 100), listingId]
        );

        // Record financial transaction
        const companyRes = await client.query('SELECT id FROM companies ORDER BY id ASC LIMIT 1');
        let companyId = null as number | null;
        if ((companyRes.rowCount ?? 0) > 0) {
          companyId = companyRes.rows[0].id;
        } else {
          const created = await client.query(
            `INSERT INTO companies (name, created_at, updated_at)
             VALUES ('Love to Fly Portal', NOW(), NOW())
             RETURNING id`
          );
          companyId = created.rows[0].id;
        }

        await client.query(
          `INSERT INTO financial_transactions (
             company_id, transaction_type, category, amount, currency, status,
             description, payment_method, transaction_date, created_at, updated_at
           ) VALUES ($1, 'INCOME', 'HANGARSHARE', $2, 'BRL', 'confirmed',
             'HangarShare listing activation payment', 'stripe', CURRENT_DATE, NOW(), NOW())`,
          [companyId, Math.round(paymentIntent.amount / 100)]
        );

        await client.query('COMMIT');
        return NextResponse.json(
          { message: 'Payment confirmed and listing activated', listing_id: listingId },
          { status: 200 }
        );
      } else if (paymentIntent.status === 'processing' || paymentIntent.status === 'requires_action') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: 'Payment processing', status: paymentIntent.status },
          { status: 202 }
        );
      } else {
        // Payment failed or cancelled
        await client.query(
          `UPDATE hangar_listings 
           SET payment_status = $1, updated_at = NOW()
           WHERE id = $2`,
          [paymentIntent.status, listingId]
        );
        await client.query('COMMIT');
        return NextResponse.json(
          { message: 'Payment failed or cancelled', status: paymentIntent.status },
          { status: 402 }
        );
      }
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error confirming payment:', err);
      return NextResponse.json({ message: 'Error confirming payment' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 });
  }
}
