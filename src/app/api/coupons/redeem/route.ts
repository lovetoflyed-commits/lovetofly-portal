import { NextResponse } from 'next/server';
import pool from '@/config/db';
import { getUserFromRequest } from '@/utils/auth';

// Redeem coupon (apply to payment)
export async function POST(request: Request) {
  try {
    const { code, user_id, order_id } = await request.json();
    const now = new Date();
    // Find coupon
    const couponRes = await pool.query(
      `SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE AND (valid_from IS NULL OR valid_from <= $2) AND (valid_until IS NULL OR valid_until >= $2)`,
      [code, now]
    );
    if (couponRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Cupom inválido.' }, { status: 404 });
    }
    const coupon = couponRes.rows[0];
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ success: false, message: 'Limite de uso atingido.' }, { status: 400 });
    }
    // Check if user already redeemed (optional: one use per user)
    const redemptionRes = await pool.query(
      `SELECT * FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2 AND order_id = $3`,
      [coupon.id, user_id, order_id]
    );
    if (redemptionRes.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'Cupom já utilizado neste pedido.' }, { status: 400 });
    }
    // Register redemption
    await pool.query(
      `INSERT INTO coupon_redemptions (coupon_id, user_id, order_id) VALUES ($1, $2, $3)`,
      [coupon.id, user_id, order_id]
    );
    await pool.query(
      `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
      [coupon.id]
    );
    return NextResponse.json({ success: true, coupon }, { status: 200 });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json({ success: false, message: 'Erro ao aplicar cupom.' }, { status: 500 });
  }
}
