import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    // Query counts for dashboard stats (real data)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [verifications, listings, hangars, bookings, totalUsers, newUsersToday, revenue, totalVisits, visitsToday] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM hangar_owner_verification WHERE verification_status = $1', ['pending']).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) FROM hangar_listings WHERE status = $1', ['pending']).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) FROM hangar_listings WHERE status = $1', ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) FROM hangar_bookings WHERE status = $1', ['confirmed']).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) FROM users').catch(() => ({ rows: [{ count: 0 }] })),
      pool.query('SELECT COUNT(*) FROM users WHERE created_at >= $1', [today]).catch(() => ({ rows: [{ count: 0 }] })),
      // Total revenue from completed bookings
      pool.query('SELECT COALESCE(SUM(total_price), 0) as total FROM hangar_bookings WHERE status = $1', ['completed']).catch(() => ({ rows: [{ total: 0 }] })),
      // Portal traffic (will create table if not exists)
      pool.query(`
        SELECT COALESCE(SUM(visit_count), 0) as total
        FROM portal_analytics
      `).catch(() => ({ rows: [{ total: 0 }] })),
      pool.query(`
        SELECT COALESCE(SUM(visit_count), 0) as total
        FROM portal_analytics
        WHERE date >= $1
      `, [today]).catch(() => ({ rows: [{ total: 0 }] }))
    ]);

    return NextResponse.json({
      pendingVerifications: Number(verifications.rows[0].count),
      pendingListings: Number(listings.rows[0].count),
      totalHangars: Number(hangars.rows[0].count),
      activeBookings: Number(bookings.rows[0].count),
      totalUsers: Number(totalUsers.rows[0].count),
      newUsersToday: Number(newUsersToday.rows[0].count),
      totalRevenue: Number(revenue.rows[0].total),
      totalVisits: Number(totalVisits.rows[0]?.total || 0),
      visitsToday: Number(visitsToday.rows[0]?.total || 0)
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar stats admin:', error);
    return NextResponse.json({ message: 'Erro ao buscar stats' }, { status: 500 });
  }
}
