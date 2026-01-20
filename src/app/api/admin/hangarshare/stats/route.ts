import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    const [
      totalUsers, totalOwners, totalListings, activeListings, pendingListings,
      totalBookings, confirmedBookings, completedBookings, totalPhotos, totalFavorites,
      totalReviews, revenue
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM hangar_owners'),
      pool.query('SELECT COUNT(*) FROM hangar_listings'),
      pool.query('SELECT COUNT(*) FROM hangar_listings WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) FROM hangar_listings WHERE status = $1', ['pending']),
      pool.query('SELECT COUNT(*) FROM hangar_bookings'),
      pool.query('SELECT COUNT(*) FROM hangar_bookings WHERE status = $1', ['confirmed']),
      pool.query('SELECT COUNT(*) FROM hangar_bookings WHERE status = $1', ['completed']),
      pool.query('SELECT COUNT(*) FROM hangar_photos'),
      pool.query('SELECT COUNT(*) FROM hangar_favorites'),
      pool.query('SELECT COUNT(*) FROM reviews'),
      pool.query('SELECT COALESCE(SUM(total_price), 0) as total FROM hangar_bookings WHERE status = $1', ['completed']),
    ]);

    // Calculate occupancy rate
    const occupancyRate = totalListings.rows[0]?.count > 0 
      ? ((confirmedBookings.rows[0]?.count || 0) / (totalListings.rows[0]?.count || 1) * 100).toFixed(1) + '%'
      : '0%';

    return NextResponse.json({
      totalUsers: Number(totalUsers.rows[0].count),
      totalOwners: Number(totalOwners.rows[0].count),
      totalListings: Number(totalListings.rows[0].count),
      activeListings: Number(activeListings.rows[0].count),
      pendingListings: Number(pendingListings.rows[0].count),
      totalBookings: Number(totalBookings.rows[0].count),
      confirmedBookings: Number(confirmedBookings.rows[0].count),
      completedBookings: Number(completedBookings.rows[0].count),
      totalPhotos: Number(totalPhotos.rows[0].count),
      totalFavorites: Number(totalFavorites.rows[0].count),
      totalReviews: Number(totalReviews.rows[0].count),
      revenueGenerated: Number(revenue.rows[0].total),
      occupancyRate,
    });
  } catch (error) {
    console.error('Error fetching HangarShare stats:', error);
    return NextResponse.json(
      { message: 'Error fetching stats' },
      { status: 500 }
    );
  }
}
