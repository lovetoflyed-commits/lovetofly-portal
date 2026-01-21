// API Route: Overview Stats for HangarShare V2 Dashboard
// File: src/app/api/admin/hangarshare/v2/overview-stats/route.ts
// Purpose: Comprehensive dashboard statistics aggregation

import { NextResponse } from 'next/server';
import pool from '@/config/db';

type AlertSeverity = 'low' | 'medium' | 'high';

interface HeroMetric {
  title: string;
  value: number | string;
  icon: string;
  change?: number;
  status?: 'healthy' | 'warning' | 'critical';
}

interface OverviewStats {
  success: boolean;
  data: {
    heroMetrics: HeroMetric[];
    financialMetrics: {
      monthlyRevenue: number;
      totalRevenue: number;
      trend: number;
      status: string;
    };
    occupancyMetrics: {
      current: number;
      trend: number;
      status: string;
    };
    bookingMetrics: {
      active: number;
      pending: number;
      completed: number;
    };
    alerts: {
      count: number;
      items: Array<{
        id: string;
        type: string;
        message: string;
        severity: 'low' | 'medium' | 'high';
        createdAt: string;
      }>;
    };
    topListings: Array<{
      id: string;
      name: string;
      bookings: number;
      revenue: number;
    }>;
    recentBookings: Array<{
      id: string;
      listingName: string;
      ownerName: string;
      status: string;
      checkIn: string;
    }>;
  };
  meta: {
    responseTime: number;
    generatedAt: string;
  };
}

export async function GET(request: Request): Promise<NextResponse<OverviewStats>> {
  const startTime = Date.now();

  try {
    // Parallel queries for better performance
    const [
      usersResult,
      ownersResult,
      listingsResult,
      activeListingsResult,
      bookingsResult,
      pendingBookingsResult,
      completedBookingsResult,
      photosResult,
      revenueResult,
      alertsResult,
      topListingsResult,
      recentBookingsResult,
      occupancyResult,
    ] = await Promise.all([
      // Core counts
      pool.query('SELECT COUNT(*)::int as count FROM users'),
      pool.query('SELECT COUNT(*)::int as count FROM hangar_owners'),
      pool.query('SELECT COUNT(*)::int as count FROM hangar_listings'),
      pool.query("SELECT COUNT(*)::int as count FROM hangar_listings WHERE status = 'active'"),
      
      // Booking stats
      pool.query('SELECT COUNT(*)::int as count FROM bookings'),
      pool.query("SELECT COUNT(*)::int as count FROM bookings WHERE booking_status = 'pending'"),
      pool.query("SELECT COUNT(*)::int as count FROM bookings WHERE booking_status = 'completed'"),
      
      // Media stats
      pool.query('SELECT COUNT(*)::int as count FROM hangar_photos'),
      
      // Financial stats
      pool.query(`
        SELECT 
          COALESCE(SUM(total_price)::numeric, 0) as total_revenue,
          COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_price ELSE 0 END)::numeric, 0) as monthly_revenue
        FROM bookings
        WHERE booking_status IN ('completed', 'active')
      `),
      
      // Alerts (pending approvals, conflicts, etc)
      pool.query(`
        SELECT COUNT(*)::int as count FROM hangar_owners WHERE verification_status = 'pending'
      `),
      
      // Top performing listings
      pool.query(`
        SELECT 
          hl.id,
          hl.name,
          COUNT(b.id)::int as booking_count,
          COALESCE(SUM(b.total_price)::numeric, 0) as revenue
        FROM hangar_listings hl
        LEFT JOIN bookings b ON hl.id = b.listing_id
        GROUP BY hl.id, hl.name
        ORDER BY booking_count DESC
        LIMIT 5
      `),
      
      // Recent bookings
      pool.query(`
        SELECT 
          b.id,
          hl.name as listing_name,
          u.first_name || ' ' || u.last_name as owner_name,
          b.booking_status,
          b.check_in_date
        FROM bookings b
        JOIN hangar_listings hl ON b.listing_id = hl.id
        JOIN hangar_owners ho ON hl.owner_id = ho.id
        JOIN users u ON ho.user_id = u.id
        ORDER BY b.created_at DESC
        LIMIT 10
      `),
      
      // Occupancy calculation
      pool.query(`
        SELECT 
          COUNT(DISTINCT listing_id)::int as total_listings,
          COUNT(CASE WHEN booking_status IN ('active', 'completed') THEN 1 END)::int as occupied
        FROM bookings
        WHERE check_in_date <= CURRENT_DATE AND check_out_date >= CURRENT_DATE
      `),
    ]);

    // Extract values
    const totalUsers = usersResult.rows[0]?.count || 0;
    const totalOwners = ownersResult.rows[0]?.count || 0;
    const totalListings = listingsResult.rows[0]?.count || 0;
    const activeListings = activeListingsResult.rows[0]?.count || 0;
    const totalBookings = bookingsResult.rows[0]?.count || 0;
    const pendingBookings = pendingBookingsResult.rows[0]?.count || 0;
    const completedBookings = completedBookingsResult.rows[0]?.count || 0;
    const totalPhotos = photosResult.rows[0]?.count || 0;

    const revenueData = revenueResult.rows[0];
    const totalRevenue = Number(revenueData?.total_revenue || 0);
    const monthlyRevenue = Number(revenueData?.monthly_revenue || 0);
    const monthlyTrend = totalRevenue > 0 ? ((monthlyRevenue / totalRevenue) * 100).toFixed(1) : '0';

    const pendingApprovals = alertsResult.rows[0]?.count || 0;

    // Occupancy percentage
    const occupancyData = occupancyResult.rows[0];
    const occupancyRate = occupancyData?.total_listings > 0
      ? ((occupancyData.occupied / occupancyData.total_listings) * 100).toFixed(1)
      : '0';

    // Build response
    const heroMetrics: HeroMetric[] = [
      {
        title: 'Total Users',
        value: totalUsers,
        icon: 'users',
        status: totalUsers > 30 ? 'healthy' : 'warning',
      },
      {
        title: 'Active Owners',
        value: totalOwners,
        icon: 'briefcase',
        status: totalOwners > 5 ? 'healthy' : 'warning',
      },
      {
        title: 'Active Listings',
        value: activeListings,
        icon: 'home',
        status: activeListings > 10 ? 'healthy' : 'warning',
      },
      {
        title: 'Confirmed Bookings',
        value: completedBookings,
        icon: 'calendar',
        status: 'healthy',
      },
    ];

    const alertItems: Array<{
      id: string;
      type: string;
      message: string;
      severity: AlertSeverity;
      createdAt: string;
    }> = [];
    if (pendingApprovals > 0) {
      alertItems.push({
        id: 'pending-approvals',
        type: 'verification',
        message: `${pendingApprovals} owners waiting for approval`,
        severity: (pendingApprovals > 5 ? 'high' : 'medium') as AlertSeverity,
        createdAt: new Date().toISOString(),
      });
    }

    const topListings = topListingsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      bookings: row.booking_count,
      revenue: Number(row.revenue),
    }));

    const recentBookings = recentBookingsResult.rows.map((row: any) => ({
      id: row.id,
      listingName: row.listing_name,
      ownerName: row.owner_name,
      status: row.booking_status,
      checkIn: new Date(row.check_in_date).toLocaleDateString(),
    }));

    const responseTime = Date.now() - startTime;

    const response: OverviewStats = {
      success: true,
      data: {
        heroMetrics,
        financialMetrics: {
          monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          trend: Number(monthlyTrend),
          status: monthlyRevenue > 5000 ? 'healthy' : 'warning',
        },
        occupancyMetrics: {
          current: Number(occupancyRate),
          trend: 3.2, // Placeholder - would calculate from historical data
          status: Number(occupancyRate) > 60 ? 'healthy' : 'warning',
        },
        bookingMetrics: {
          active: totalBookings - completedBookings,
          pending: pendingBookings,
          completed: completedBookings,
        },
        alerts: {
          count: alertItems.length,
          items: alertItems,
        },
        topListings,
        recentBookings,
      },
      meta: {
        responseTime,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Overview Stats API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        data: {
          heroMetrics: [],
          financialMetrics: {
            monthlyRevenue: 0,
            totalRevenue: 0,
            trend: 0,
            status: 'error',
          },
          occupancyMetrics: {
            current: 0,
            trend: 0,
            status: 'error',
          },
          bookingMetrics: {
            active: 0,
            pending: 0,
            completed: 0,
          },
          alerts: {
            count: 1,
            items: [
              {
                id: 'error',
                type: 'system',
                message: 'Failed to load dashboard data. Please try again.',
                severity: 'high',
                createdAt: new Date().toISOString(),
              },
            ],
          },
          topListings: [],
          recentBookings: [],
        },
        meta: {
          responseTime: Date.now(),
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
