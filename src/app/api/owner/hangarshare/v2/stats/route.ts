// API Route: Owner Statistics
// File: src/app/api/owner/hangarshare/v2/stats/route.ts
// Purpose: Provide owner-specific metrics and analytics

import { NextResponse, NextRequest } from 'next/server';
import pool from '@/config/db';
import { getAuthenticatedOwnerId, unauthorizedResponse } from '@/utils/auth';

interface OwnerStatsResponse {
  success: boolean;
  data: {
    ownerId: string;
    ownerInfo: {
      companyName: string;
      activeListings: number;
      totalListings: number;
    };
    revenueMetrics: {
      totalRevenue: number;
      monthlyRevenue: number;
      pendingPayouts: number;
      lastPayoutDate: string | null;
    };
    bookingMetrics: {
      totalBookings: number;
      activeBookings: number;
      completedBookings: number;
      cancelledBookings: number;
    };
    occupancyMetrics: {
      averageOccupancy: number;
      totalCapacity: number;
      occupiedSpots: number;
    };
    monthlyTrend: Array<{
      month: string;
      revenue: number;
      bookings: number;
      occupancy: number;
    }>;
    topListings: Array<{
      id: string;
      title: string;
      revenue: number;
      bookings: number;
      occupancy: number;
    }>;
    recentBookings: Array<{
      id: string;
      hangarTitle: string;
      guestName: string;
      startDate: string;
      endDate: string;
      amount: number;
      status: string;
    }>;
  };
  meta: {
    responseTime: number;
    generatedAt: string;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const { ownerId: queryOwnerId, userId, isAuthorized } = await getAuthenticatedOwnerId(request);
    
    if (!isAuthorized && !userId) {
      return unauthorizedResponse('Authentication required. Please provide a valid Bearer token.');
    }

    // Get owner ID from query params or authenticated user
    const { searchParams } = new URL(request.url);
    const requestedOwnerId = searchParams.get('ownerId');
    
    const ownerId = queryOwnerId || requestedOwnerId;

    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: 'Owner ID required' },
        { status: 400 }
      );
    }

    // Execute all queries in parallel for optimal performance
    const [
      ownerInfo,
      revenueMetrics,
      bookingMetrics,
      occupancyMetrics,
      monthlyTrend,
      topListings,
      recentBookings,
    ] = await Promise.all([
      // 1. Owner Info
      pool.query(
        `SELECT 
          company_name,
          COUNT(hl.id) FILTER (WHERE hl.status = 'active') as active_listings,
          COUNT(hl.id) as total_listings
         FROM hangar_owners ho
         LEFT JOIN hangar_listings hl ON hl.owner_id = ho.id
         WHERE ho.id = $1
         GROUP BY ho.id, ho.company_name`,
        [ownerId]
      ),

      // 2. Revenue Metrics
      pool.query(
        `SELECT 
          COALESCE(SUM(b.total_price), 0) as total_revenue,
          COALESCE(SUM(b.total_price) FILTER (
            WHERE DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
          ), 0) as monthly_revenue,
          COALESCE(SUM(b.total_price * 0.965) FILTER (
            WHERE b.status = 'completed' AND b.status = 'completed'
          ), 0) as pending_payouts,
          MAX(b.created_at) FILTER (
            WHERE b.status = 'completed' AND b.status = 'completed'
          ) as last_payout_date
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 AND b.status = 'completed'`,
        [ownerId]
      ),

      // 3. Booking Metrics
      pool.query(
        `SELECT 
          COUNT(b.id) as total_bookings,
          COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as active_bookings,
          COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
          COUNT(b.id) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1`,
        [ownerId]
      ),

      // 4. Occupancy Metrics
      pool.query(
        `SELECT 
          COALESCE(AVG(occupancy_pct), 0) as average_occupancy,
          SUM(total_capacity) as total_capacity,
          SUM(occupied_count) as occupied_spots
         FROM (
           SELECT 
             hl.id,
             hl.total_spaces as total_capacity,
             COUNT(b.id) as occupied_count,
             CASE 
               WHEN hl.total_spaces > 0 
               THEN (COUNT(b.id)::float / hl.total_spaces) * 100
               ELSE 0 
             END as occupancy_pct
           FROM hangar_listings hl
           LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id 
             AND b.status IN ('confirmed', 'active')
           WHERE hl.owner_id = $1 AND hl.status = 'active'
           GROUP BY hl.id, hl.total_spaces
         ) sub`,
        [ownerId]
      ),

      // 5. Monthly Trend (last 6 months)
      pool.query(
        `SELECT 
          TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') as month,
          COALESCE(SUM(b.total_price), 0) as revenue,
          COUNT(b.id) as bookings,
          AVG(
            CASE 
              WHEN hl.total_spaces > 0 
              THEN (1.0 / hl.total_spaces) * 100
              ELSE 0 
            END
          ) as occupancy
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 
           AND b.created_at >= CURRENT_DATE - INTERVAL '6 months'
           AND b.status = 'completed'
         GROUP BY DATE_TRUNC('month', b.created_at)
         ORDER BY DATE_TRUNC('month', b.created_at) DESC
         LIMIT 6`,
        [ownerId]
      ),

      // 6. Top Listings by Revenue
      pool.query(
        `SELECT 
          hl.id,
          (hl.hangar_number || ' - ' || hl.aerodrome_name),
          COALESCE(SUM(b.total_price), 0) as revenue,
          COUNT(b.id) as bookings,
          CASE 
            WHEN hl.total_spaces > 0 
            THEN (COUNT(b.id)::float / hl.total_spaces) * 100
            ELSE 0 
          END as occupancy
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id 
           AND b.status = 'completed'
         WHERE hl.owner_id = $1
         GROUP BY hl.id, (hl.hangar_number || ' - ' || hl.aerodrome_name), hl.total_spaces
         ORDER BY revenue DESC
         LIMIT 5`,
        [ownerId]
      ),

      // 7. Recent Bookings
      pool.query(
        `SELECT 
          b.id,
          (hl.hangar_number || ' - ' || hl.aerodrome_name) as hangar_title,
          u.first_name || ' ' || u.last_name as guest_name,
          b.check_in as start_date,
          b.check_out as end_date,
          b.total_price as amount,
          b.status
         FROM hangar_bookings b
         JOIN hangar_listings hl ON hl.id = b.hangar_id
         JOIN users u ON u.id = b.user_id
         WHERE hl.owner_id = $1
         ORDER BY b.created_at DESC
         LIMIT 10`,
        [ownerId]
      ),
    ]);

    // Format response
    const response: OwnerStatsResponse = {
      success: true,
      data: {
        ownerId,
        ownerInfo: ownerInfo.rows[0] || {
          companyName: 'Unknown',
          activeListings: 0,
          totalListings: 0,
        },
        revenueMetrics: {
          totalRevenue: parseFloat(revenueMetrics.rows[0]?.total_revenue || '0'),
          monthlyRevenue: parseFloat(revenueMetrics.rows[0]?.monthly_revenue || '0'),
          pendingPayouts: parseFloat(revenueMetrics.rows[0]?.pending_payouts || '0'),
          lastPayoutDate: revenueMetrics.rows[0]?.last_payout_date || null,
        },
        bookingMetrics: {
          totalBookings: parseInt(bookingMetrics.rows[0]?.total_bookings || '0'),
          activeBookings: parseInt(bookingMetrics.rows[0]?.active_bookings || '0'),
          completedBookings: parseInt(bookingMetrics.rows[0]?.completed_bookings || '0'),
          cancelledBookings: parseInt(bookingMetrics.rows[0]?.cancelled_bookings || '0'),
        },
        occupancyMetrics: {
          averageOccupancy: parseFloat(occupancyMetrics.rows[0]?.average_occupancy || '0'),
          totalCapacity: parseInt(occupancyMetrics.rows[0]?.total_capacity || '0'),
          occupiedSpots: parseInt(occupancyMetrics.rows[0]?.occupied_spots || '0'),
        },
        monthlyTrend: monthlyTrend.rows.map(row => ({
          month: row.month,
          revenue: parseFloat(row.revenue),
          bookings: parseInt(row.bookings),
          occupancy: parseFloat(row.occupancy || '0'),
        })),
        topListings: topListings.rows.map(row => ({
          id: row.id,
          title: row.title,
          revenue: parseFloat(row.revenue),
          bookings: parseInt(row.bookings),
          occupancy: parseFloat(row.occupancy || '0'),
        })),
        recentBookings: recentBookings.rows.map(row => ({
          id: row.id,
          hangarTitle: row.hangar_title,
          guestName: row.guest_name,
          startDate: row.start_date,
          endDate: row.end_date,
          amount: parseFloat(row.amount),
          status: row.status,
        })),
      },
      meta: {
        responseTime: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Owner stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch owner statistics',
        error: String(error),
        meta: {
          responseTime: Date.now() - startTime,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
