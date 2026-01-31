import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/config/db';

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT 
        b.id,
        b.hangar_id,
        b.check_in,
        b.check_out,
        b.nights,
        b.subtotal,
        b.fees,
        b.total_price,
        b.status,
        b.payment_method,
        b.stripe_payment_intent_id,
        NULL as stripe_charge_id,
        NULL as payment_date,
        b.created_at,
        b.updated_at,
        h.hangar_number,
        h.airport_icao
      FROM hangar_bookings b
      JOIN hangar_listings h ON b.hangar_id = h.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC`,
      [userId]
    );

    const bookings = result.rows.map((r: any) => ({
      id: r.id,
      hangarId: r.hangar_id,
      hangarNumber: r.hangar_number,
      airportIcao: r.airport_icao,
      checkIn: r.check_in,
      checkOut: r.check_out,
      nights: r.nights,
      subtotal: r.subtotal,
      fees: r.fees,
      totalPrice: r.total_price,
      status: r.status === 'pending' && r.payment_method === 'stripe' && r.stripe_payment_intent_id
        ? 'confirmed'
        : r.status,
      paymentMethod: r.payment_method,
      stripePaymentIntentId: r.stripe_payment_intent_id,
      stripeChargeId: r.stripe_charge_id,
      paymentDate: r.payment_date,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ count: bookings.length, bookings });
  } catch (err) {
    console.error('Error fetching user bookings', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
