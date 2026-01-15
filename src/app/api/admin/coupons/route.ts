import { NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

// List all coupons (admin)
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth) return auth;
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    return NextResponse.json({ coupons: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

// Create a new coupon (admin)
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth) return auth;
  try {
    const body = await request.json();
    const { code, description, discount_type, discount_value, max_uses, valid_from, valid_until } = body;
    const result = await pool.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, valid_from, valid_until, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [code, description, discount_type, discount_value, max_uses, valid_from, valid_until, body.admin_id]
    );
    return NextResponse.json({ coupon: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
