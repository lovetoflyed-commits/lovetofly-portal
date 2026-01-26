import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    console.log('[ADMIN STATS] Starting query...');
    const getCount = async (query: string, params: Array<string | number | Date> = []) => {
      const result = await pool.query(query, params);
      const row = result.rows[0] ?? {};
      return Number(row.count ?? row.total ?? 0);
    };

    const safeCount = async (
      primary: { query: string; params?: Array<string | number | Date> },
      fallback?: { query: string; params?: Array<string | number | Date> },
      label?: string
    ) => {
      try {
        return await getCount(primary.query, primary.params);
      } catch (error) {
        console.error(`[ADMIN STATS] Failed ${label ?? 'primary'} query`, error);
        if (!fallback) {
          return 0;
        }
        try {
          return await getCount(fallback.query, fallback.params);
        } catch (fallbackError) {
          console.error(`[ADMIN STATS] Failed ${label ?? 'fallback'} fallback query`, fallbackError);
          return 0;
        }
      }
    };
    // Query counts for dashboard stats (real data)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingVerifications, pendingListings, totalHangars, activeBookings, totalUsers, newUsersToday, totalRevenue] = await Promise.all([
      // Pending verifications (unverified hangar owners)
      safeCount(
        {
          query: 'SELECT COUNT(*) FROM hangar_owners WHERE is_verified = false OR verification_status = $1',
          params: ['pending']
        },
        {
          query: 'SELECT COUNT(*) FROM hangar_owners WHERE verified = false OR verification_status = $1',
          params: ['pending']
        },
        'pending verifications'
      ),
      // Pending hangar listings
      safeCount(
        {
          query: 'SELECT COUNT(*) FROM hangar_listings WHERE status = $1',
          params: ['pending']
        },
        {
          query: 'SELECT COUNT(*) FROM hangar_listings WHERE approval_status = $1',
          params: ['pending_approval']
        },
        'pending listings'
      ),
      // Active/Published hangar listings
      safeCount(
        {
          query: "SELECT COUNT(*) FROM hangar_listings WHERE status IN ('active', 'published')"
        },
        {
          query: "SELECT COUNT(*) FROM hangar_listings WHERE approval_status = 'approved'"
        },
        'active listings'
      ),
      // Active bookings (pending + confirmed)
      safeCount(
        {
          query: "SELECT COUNT(*) FROM hangar_bookings WHERE status IN ('pending', 'confirmed')"
        },
        {
          query: "SELECT COUNT(*) FROM hangar_bookings WHERE booking_status IN ('pending', 'confirmed')"
        },
        'active bookings'
      ),
      // Total users
      safeCount({ query: 'SELECT COUNT(*) FROM users' }, undefined, 'total users'),
      // New users today
      safeCount({ query: 'SELECT COUNT(*) FROM users WHERE created_at >= $1', params: [today] }, undefined, 'new users today'),
      // Total revenue from completed bookings
      safeCount(
        { query: "SELECT COALESCE(SUM(total_price), 0) as total FROM hangar_bookings WHERE status = 'completed'" },
        { query: "SELECT COALESCE(SUM(total), 0) as total FROM bookings WHERE booking_status = 'completed'" },
        'total revenue'
      )
    ]);

    console.log('[ADMIN STATS] Query results:', {
      pendingVerifications,
      pendingListings,
      totalHangars,
      activeBookings
    });

    return NextResponse.json({
      pendingVerifications,
      pendingListings,
      totalHangars,
      activeBookings,
      totalUsers,
      newUsersToday,
      totalRevenue,
      totalVisits: 0, // TODO: Create portal_analytics table
      visitsToday: 0  // TODO: Create portal_analytics table
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar stats admin:', error);
    return NextResponse.json({ message: 'Erro ao buscar stats' }, { status: 500 });
  }
}
