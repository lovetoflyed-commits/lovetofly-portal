import { NextResponse } from 'next/server';
import pool from '@/config/db';

// Validate coupon code (public)
export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const now = new Date();
    const result = await pool.query(
      `SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE AND (valid_from IS NULL OR valid_from <= $2) AND (valid_until IS NULL OR valid_until >= $2)`,
      [code, now]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ valid: false, message: 'Cupom inválido ou expirado.' }, { status: 404 });
    }
    const coupon = result.rows[0];
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ valid: false, message: 'Limite de uso atingido.' }, { status: 400 });
    }
    return NextResponse.json({ valid: true, coupon }, { status: 200 });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ valid: false, message: 'Erro ao validar cupom.' }, { status: 500 });
  }
}
