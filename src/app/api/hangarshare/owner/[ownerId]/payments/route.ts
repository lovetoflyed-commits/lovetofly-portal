import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

interface OwnerPaymentRecord {
  listing_id: number;
  hangar_number: string;
  aerodrome_name: string;
  is_paid: boolean;
  paid_amount: number;
  paid_currency: string;
  paid_at: string;
  payment_status: string;
  stripe_payment_intent_id: string;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    const ownerId = parseInt(params.ownerId, 10);

    // Fetch owner payment records
    const paymentsResult = await pool.query(
      `
      SELECT 
        hl.id as listing_id,
        hl.hangar_number,
        hl.aerodrome_name,
        hl.is_paid,
        hl.paid_amount,
        hl.paid_currency,
        hl.paid_at,
        hl.payment_status,
        hl.stripe_payment_intent_id,
        hl.created_at
      FROM hangar_listings hl
      WHERE hl.owner_id = $1
      ORDER BY hl.paid_at DESC NULLS LAST, hl.created_at DESC
      `,
      [ownerId]
    );

    // Calculate summary
    const paidCount = paymentsResult.rows.filter((r) => r.is_paid).length;
    const totalPaid = paymentsResult.rows
      .filter((r) => r.is_paid)
      .reduce((sum, r) => sum + (r.paid_amount || 0), 0);

    // Fetch owner details with membership
    const ownerResult = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.plan,
        um.status as membership_status,
        um.expires_at as membership_expires_at,
        up.price as plan_price
      FROM users u
      LEFT JOIN user_memberships um ON u.id = um.user_id
      LEFT JOIN membership_plans up ON um.plan_id = up.id
      WHERE u.id = $1
      `,
      [ownerId]
    );

    if (ownerResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Owner not found' },
        { status: 404 }
      );
    }

    const owner = ownerResult.rows[0];

    // Fetch financial transactions for this owner
    const transactionsResult = await pool.query(
      `
      SELECT 
        id,
        transaction_type,
        category,
        amount,
        currency,
        reference_type,
        reference_id,
        status,
        notes,
        created_at
      FROM financial_transactions
      WHERE user_id = $1 AND category = 'HANGARSHARE'
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [ownerId]
    );

    return NextResponse.json(
      {
        success: true,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          plan: owner.plan,
          membership_status: owner.membership_status,
          membership_expires_at: owner.membership_expires_at,
          plan_price: owner.plan_price,
        },
        summary: {
          total_listings: paymentsResult.rows.length,
          paid_listings: paidCount,
          pending_listings: paymentsResult.rows.length - paidCount,
          total_revenue: totalPaid,
          currency: 'BRL',
        },
        payments: paymentsResult.rows as OwnerPaymentRecord[],
        transactions: transactionsResult.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching owner payments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch payment records' },
      { status: 500 }
    );
  }
}
