import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    console.log('[ADMIN STATS] Starting query...');
    // Query counts for dashboard stats (real data)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [verifications, listings, hangars, bookings, totalUsers, newUsersToday, revenue] = await Promise.all([
      // Pending verifications (unverified hangar owners)
      pool.query('SELECT COUNT(*) FROM hangar_owners WHERE is_verified = false OR verification_status = $1', ['pending']),
      // Pending hangar listings
      pool.query('SELECT COUNT(*) FROM hangar_listings WHERE status = $1', ['pending']),
      // Active/Published hangar listings  
      pool.query("SELECT COUNT(*) FROM hangar_listings WHERE status IN ('active', 'published')"),
      // Active bookings (pending + confirmed)
      pool.query("SELECT COUNT(*) FROM hangar_bookings WHERE status IN ('pending', 'confirmed')"),
      // Total users
      pool.query('SELECT COUNT(*) FROM users'),
      // New users today
      pool.query('SELECT COUNT(*) FROM users WHERE created_at >= $1', [today]),
      // Total revenue from completed bookings
      pool.query("SELECT COALESCE(SUM(total_price), 0) as total FROM hangar_bookings WHERE status = 'completed'")
    ]);

    console.log('[ADMIN STATS] Query results:', {
      verifications: verifications.rows[0],
      listings: listings.rows[0],
      hangars: hangars.rows[0],
      bookings: bookings.rows[0]
    });

    return NextResponse.json({
      pendingVerifications: Number(verifications.rows[0].count),
      pendingListings: Number(listings.rows[0].count),
      totalHangars: Number(hangars.rows[0].count),
      activeBookings: Number(bookings.rows[0].count),
      totalUsers: Number(totalUsers.rows[0].count),
      newUsersToday: Number(newUsersToday.rows[0].count),
      totalRevenue: Number(revenue.rows[0].total),
      totalVisits: 0, // TODO: Create portal_analytics table
      visitsToday: 0  // TODO: Create portal_analytics table
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar stats admin:', error);
    return NextResponse.json({ message: 'Erro ao buscar stats' }, { status: 500 });
  }
}
