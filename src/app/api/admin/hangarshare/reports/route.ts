import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';

    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM hangar_owners) as total_owners,
        (SELECT COUNT(*) FROM hangar_owners WHERE is_verified = true) as verified_owners,
        (SELECT COUNT(*) FROM hangar_listings) as total_listings,
        (SELECT COUNT(*) FROM hangar_listings WHERE status = 'active') as active_listings,
        (SELECT COUNT(*) FROM hangar_bookings WHERE created_at >= $1) as total_bookings,
        (SELECT COUNT(*) FROM hangar_bookings WHERE status = 'completed' AND created_at >= $1) as completed_bookings,
        (SELECT COALESCE(SUM(total_price), 0) FROM hangar_bookings WHERE status = 'completed' AND created_at >= $1) as revenue,
        ROUND(
          COALESCE(
            (SELECT AVG(available_spaces::float / NULLIF(total_spaces, 0) * 100)
             FROM hangar_listings
             WHERE total_spaces > 0),
            0
          )
        ) as average_occupancy,
        (SELECT COUNT(*) FROM hangar_owners WHERE is_verified = false) as pending_approvals,
        0 as booking_conflicts
    `, [startDate]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { message: 'Error generating report' },
      { status: 500 }
    );
  }
}
