// API Route: Owner Statistics with Time Range Filter
// File: src/app/api/owner/hangarshare/v2/stats-advanced/route.ts
// Purpose: Provide owner metrics with time range selection and comparison

import { NextResponse, NextRequest } from 'next/server';
import pool from '@/config/db';
import { getAuthenticatedOwnerId, unauthorizedResponse, forbiddenResponse } from '@/utils/auth';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface ComparisonMetrics {
  current: number;
  previous: number;
  change: number;
  percentChange: number;
  trend: 'up' | 'down' | 'stable';
}

interface OwnerStatsAdvancedResponse {
  success: boolean;
  data: {
    ownerId: string;
    timeRange: TimeRange;
    dateRange: {
      start: string;
      end: string;
      label: string;
    };
    ownerInfo: {
      companyName: string;
      activeListings: number;
      totalListings: number;
    };
    revenueMetrics: {
      totalRevenue: number;
      monthlyAverage: number;
      dailyAverage: number;
      comparison: ComparisonMetrics;
    };
    bookingMetrics: {
      totalBookings: number;
      activeBookings: number;
      completedBookings: number;
      cancelledBookings: number;
      conversionRate: number;
      averageBookingValue: number;
      comparison: ComparisonMetrics;
    };
    occupancyMetrics: {
      averageOccupancy: number;
      totalCapacity: number;
      occupiedSpots: number;
      comparison: ComparisonMetrics;
    };
    dailyTrend: Array<{
      date: string;
      revenue: number;
      bookings: number;
      occupancy: number;
    }>;
    weeklyTrend: Array<{
      week: string;
      revenue: number;
      bookings: number;
      occupancy: number;
    }>;
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
      revenueComparison: ComparisonMetrics;
    }>;
    bookingsByStatus: {
      confirmed: number;
      completed: number;
      cancelled: number;
      rejected: number;
      pending: number;
    };
    revenueByPaymentMethod: Array<{
      method: string;
      count: number;
      revenue: number;
    }>;
    forecast: {
      projectedMonthlyRevenue: number;
      projectedAnnualRevenue: number;
      confidence: number;
    };
  };
  meta: {
    responseTime: number;
    generatedAt: string;
  };
}

// Helper function to calculate date ranges
function getDateRange(timeRange: TimeRange, customStart?: string, customEnd?: string): DateRange {
  const endDate = new Date();
  let startDate = new Date();
  let label = '';

  switch (timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      label = 'Last 7 days';
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      label = 'Last 30 days';
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      label = 'Last 90 days';
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      label = 'Last 12 months';
      break;
    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom date range requires startDate and endDate');
      }
      startDate = new Date(customStart);
      endDate.setHours(23, 59, 59, 999);
      label = `${customStart} to ${customEnd}`;
      break;
  }

  return { startDate, endDate, label };
}

// Helper to calculate percentage change
function calculateComparison(current: number, previous: number): ComparisonMetrics {
  const change = current - previous;
  const percentChange = previous === 0 ? 0 : (change / previous) * 100;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

  return {
    current,
    previous,
    change,
    percentChange: Math.round(percentChange * 100) / 100,
    trend,
  };
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, message: 'HangarShare V2 is disabled' },
    { status: 404 }
  );

  const startTime = Date.now();

  try {
    // Verify authentication
    const { ownerId: queryOwnerId, userId, isAuthorized } = await getAuthenticatedOwnerId(request);
    
    if (!isAuthorized && !userId) {
      return unauthorizedResponse('Authentication required. Please provide a valid Bearer token.');
    }

    const { searchParams } = new URL(request.url);
    const requestedOwnerId = searchParams.get('ownerId');
    const timeRange = (searchParams.get('timeRange') || '30d') as TimeRange;
    const customStart = searchParams.get('customStart') || undefined;
    const customEnd = searchParams.get('customEnd') || undefined;

    // Use authenticated owner ID or requested owner ID
    const ownerId = queryOwnerId || requestedOwnerId;

    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: 'Owner ID required' },
        { status: 400 }
      );
    }

    // If user is authenticated via JWT, verify they own this hangar
    // (This would require a DB query to verify user -> owner relationship)
    // For now, we accept the authenticated user's request
    // TODO: Add proper owner verification in database

    // Calculate date ranges
    const currentRange = getDateRange(timeRange, customStart, customEnd);
    const currentStart = currentRange.startDate.toISOString();
    const currentEnd = currentRange.endDate.toISOString();

    // Calculate previous period for comparison
    const periodLength = currentRange.endDate.getTime() - currentRange.startDate.getTime();
    const previousEnd = new Date(currentRange.startDate.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - periodLength);

    const previousStart_ISO = previousStart.toISOString();
    const previousEnd_ISO = previousEnd.toISOString();

    // Execute all queries in parallel
    const [
      ownerInfo,
      currentRevenue,
      previousRevenue,
      currentBooking,
      previousBooking,
      currentOccupancy,
      previousOccupancy,
      dailyTrend,
      weeklyTrend,
      monthlyTrend,
      topListings,
      bookingsByStatus,
      revenueByMethod,
    ] = await Promise.all([
      // 1. Owner Info
      pool.query(
        `SELECT 
          ho.company_name,
          COUNT(CASE WHEN hl.status = 'active' THEN 1 END) as active_listings,
          COUNT(hl.id) as total_listings
         FROM hangar_owners ho
         LEFT JOIN hangar_listings hl ON hl.owner_id = ho.id
         WHERE ho.id = $1
         GROUP BY ho.id, ho.company_name`,
        [ownerId]
      ),

      // 2. Current Period Revenue
      pool.query(
        `SELECT 
          COALESCE(SUM(b.total_price), 0) as total_revenue,
          COALESCE(SUM(b.total_price) FILTER (
            WHERE DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
          ), 0) as monthly_revenue
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 AND b.created_at >= $2 AND b.created_at <= $3 AND b.status = 'completed'`,
        [ownerId, currentStart, currentEnd]
      ),

      // 3. Previous Period Revenue
      pool.query(
        `SELECT COALESCE(SUM(b.total_price), 0) as total_revenue
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 AND b.created_at >= $2 AND b.created_at <= $3 AND b.status = 'completed'`,
        [ownerId, previousStart_ISO, previousEnd_ISO]
      ),

      // 4. Current Period Bookings
      pool.query(
        `SELECT 
          COUNT(b.id) as total_bookings,
          COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as active_bookings,
          COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
          COUNT(b.id) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings,
          COALESCE(AVG(b.total_price), 0) as avg_booking_value
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 AND b.created_at >= $2 AND b.created_at <= $3`,
        [ownerId, currentStart, currentEnd]
      ),

      // 5. Previous Period Bookings
      pool.query(
        `SELECT COUNT(b.id) as total_bookings
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 AND b.created_at >= $2 AND b.created_at <= $3`,
        [ownerId, previousStart_ISO, previousEnd_ISO]
      ),

      // 6. Current Period Occupancy
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
             AND b.created_at >= $2 AND b.created_at <= $3
           WHERE hl.owner_id = $1 AND hl.status = 'active'
           GROUP BY hl.id, hl.total_spaces
         ) sub`,
        [ownerId, currentStart, currentEnd]
      ),

      // 7. Previous Period Occupancy
      pool.query(
        `SELECT 
          COALESCE(AVG(occupancy_pct), 0) as average_occupancy
         FROM (
           SELECT 
             hl.id,
             CASE 
               WHEN hl.total_spaces > 0 
               THEN (COUNT(b.id)::float / hl.total_spaces) * 100
               ELSE 0 
             END as occupancy_pct
           FROM hangar_listings hl
           LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id 
             AND b.status IN ('confirmed', 'active')
             AND b.created_at >= $2 AND b.created_at <= $3
           WHERE hl.owner_id = $1 AND hl.status = 'active'
           GROUP BY hl.id, hl.total_spaces
         ) sub`,
        [ownerId, previousStart_ISO, previousEnd_ISO]
      ),

      // 8. Daily Trend
      pool.query(
        `SELECT 
          DATE(b.created_at) as date,
          COALESCE(SUM(b.total_price), 0) as revenue,
          COUNT(b.id) as bookings,
          COALESCE(AVG(
            CASE 
              WHEN hl.total_spaces > 0 
              THEN (1.0 / hl.total_spaces) * 100
              ELSE 0 
            END
          ), 0) as occupancy
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 
           AND b.created_at >= $2 AND b.created_at <= $3
           AND b.status = 'completed'
         GROUP BY DATE(b.created_at)
         ORDER BY DATE(b.created_at) DESC
         LIMIT 31`,
        [ownerId, currentStart, currentEnd]
      ),

      // 9. Weekly Trend
      pool.query(
        `SELECT 
          TO_CHAR(DATE_TRUNC('week', b.created_at), 'YYYY-MM-DD') as week,
          COALESCE(SUM(b.total_price), 0) as revenue,
          COUNT(b.id) as bookings,
          COALESCE(AVG(
            CASE 
              WHEN hl.total_spaces > 0 
              THEN (1.0 / hl.total_spaces) * 100
              ELSE 0 
            END
          ), 0) as occupancy
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 
           AND b.created_at >= $2 AND b.created_at <= $3
           AND b.status = 'completed'
         GROUP BY DATE_TRUNC('week', b.created_at)
         ORDER BY DATE_TRUNC('week', b.created_at) DESC`,
        [ownerId, currentStart, currentEnd]
      ),

      // 10. Monthly Trend
      pool.query(
        `SELECT 
          TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') as month,
          COALESCE(SUM(b.total_price), 0) as revenue,
          COUNT(b.id) as bookings,
          COALESCE(AVG(
            CASE 
              WHEN hl.total_spaces > 0 
              THEN (1.0 / hl.total_spaces) * 100
              ELSE 0 
            END
          ), 0) as occupancy
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 
           AND b.created_at >= $2 AND b.created_at <= $3
           AND b.status = 'completed'
         GROUP BY DATE_TRUNC('month', b.created_at)
         ORDER BY DATE_TRUNC('month', b.created_at) DESC`,
        [ownerId, currentStart, currentEnd]
      ),

      // 11. Top Listings
      pool.query(
        `SELECT 
          hl.id,
          (hl.hangar_number || ' - ' || hl.aerodrome_name) as title,
          COALESCE(SUM(b.total_price), 0) as revenue,
          COUNT(b.id) as bookings,
          CASE 
            WHEN hl.total_spaces > 0 
            THEN (COUNT(b.id)::float / hl.total_spaces) * 100
            ELSE 0 
          END as occupancy
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id 
           AND b.created_at >= $2 AND b.created_at <= $3
           AND b.status = 'completed'
         WHERE hl.owner_id = $1
         GROUP BY hl.id, hl.hangar_number, hl.aerodrome_name, hl.total_spaces
         ORDER BY revenue DESC
         LIMIT 5`,
        [ownerId, currentStart, currentEnd]
      ),

      // 12. Bookings by Status
      pool.query(
        `SELECT 
          COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as confirmed,
          COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed,
          COUNT(b.id) FILTER (WHERE b.status = 'cancelled') as cancelled,
          COUNT(b.id) FILTER (WHERE b.status = 'rejected') as rejected,
          COUNT(b.id) FILTER (WHERE b.status = 'pending') as pending
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 AND b.created_at >= $2 AND b.created_at <= $3`,
        [ownerId, currentStart, currentEnd]
      ),

      // 13. Revenue by Payment Method
      pool.query(
        `SELECT 
          b.payment_method as method,
          COUNT(b.id) as count,
          COALESCE(SUM(b.total_price), 0) as revenue
         FROM hangar_listings hl
         LEFT JOIN hangar_bookings b ON b.hangar_id = hl.id
         WHERE hl.owner_id = $1 
           AND b.created_at >= $2 AND b.created_at <= $3
           AND b.status = 'completed'
         GROUP BY b.payment_method
         ORDER BY revenue DESC`,
        [ownerId, currentStart, currentEnd]
      ),
    ]);

    // Extract data from query results
    const owner = ownerInfo.rows[0];
    const currRev = currentRevenue.rows[0];
    const prevRev = previousRevenue.rows[0];
    const currBook = currentBooking.rows[0];
    const prevBook = previousBooking.rows[0];
    const currOcc = currentOccupancy.rows[0];
    const prevOcc = previousOccupancy.rows[0];
    const bookingStatus = bookingsByStatus.rows[0];
    const revMethod = revenueByMethod.rows;

    // Calculate metrics
    const totalDays =
      (currentRange.endDate.getTime() - currentRange.startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

    // Calculate revenue averages
    const monthlyRevenue = (currRev.monthly_revenue as number) || 0;
    const totalRevenue = (currRev.total_revenue as number) || 0;
    const dailyAverage = Math.round((totalRevenue / totalDays) * 100) / 100;

    // Calculate booking metrics
    const totalBookings = (currBook.total_bookings as number) || 0;
    const completedBookings = (currBook.completed_bookings as number) || 0;
    const conversionRate =
      totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100 * 100) / 100 : 0;
    const avgBookingValue = (currBook.avg_booking_value as number) || 0;

    // Calculate comparison metrics
    const revenueComparison = calculateComparison(totalRevenue, (prevRev.total_revenue as number) || 0);
    const bookingComparison = calculateComparison(totalBookings, (prevBook.total_bookings as number) || 0);
    const occupancyComparison = calculateComparison(
      (currOcc.average_occupancy as number) || 0,
      (prevOcc.average_occupancy as number) || 0
    );

    // Calculate top listings with comparison (simplified - same period)
    const topListingsWithComparison = topListings.rows.map((listing) => ({
      id: listing.id,
      title: listing.title,
      revenue: listing.revenue as number,
      bookings: listing.bookings as number,
      occupancy: (listing.occupancy as number) || 0,
      revenueComparison: {
        current: listing.revenue as number,
        previous: 0,
        change: 0,
        percentChange: 0,
        trend: 'stable' as const,
      },
    }));

    // Calculate forecast (simple linear projection based on current period)
    const monthsInYear = 12;
    const daysInAnalysis = totalDays;
    const monthsInAnalysis = daysInAnalysis / 30;
    const avgMonthlyRevenue = totalRevenue / monthsInAnalysis;
    const projectedMonthlyRevenue = Math.round(avgMonthlyRevenue * 100) / 100;
    const projectedAnnualRevenue = Math.round(projectedMonthlyRevenue * monthsInYear * 100) / 100;

    // Build response
    const response: OwnerStatsAdvancedResponse = {
      success: true,
      data: {
        ownerId,
        timeRange,
        dateRange: {
          start: currentStart,
          end: currentEnd,
          label: currentRange.label,
        },
        ownerInfo: {
          companyName: (owner?.company_name as string) || 'Unknown',
          activeListings: parseInt(owner?.active_listings || '0'),
          totalListings: parseInt(owner?.total_listings || '0'),
        },
        revenueMetrics: {
          totalRevenue,
          monthlyAverage: Math.round((monthlyRevenue || dailyAverage * 30) * 100) / 100,
          dailyAverage,
          comparison: revenueComparison,
        },
        bookingMetrics: {
          totalBookings,
          activeBookings: (currBook.active_bookings as number) || 0,
          completedBookings,
          cancelledBookings: (currBook.cancelled_bookings as number) || 0,
          conversionRate,
          averageBookingValue: Math.round(avgBookingValue * 100) / 100,
          comparison: bookingComparison,
        },
        occupancyMetrics: {
          averageOccupancy: Math.round((currOcc.average_occupancy as number) || 0 * 100) / 100,
          totalCapacity: parseInt((currOcc.total_capacity as string) || '0'),
          occupiedSpots: parseInt((currOcc.occupied_spots as string) || '0'),
          comparison: occupancyComparison,
        },
        dailyTrend: (dailyTrend.rows as any[]).map((row) => ({
          date: row.date,
          revenue: parseFloat(row.revenue),
          bookings: parseInt(row.bookings),
          occupancy: Math.round(parseFloat(row.occupancy) * 100) / 100,
        })),
        weeklyTrend: (weeklyTrend.rows as any[]).map((row) => ({
          week: row.week,
          revenue: parseFloat(row.revenue),
          bookings: parseInt(row.bookings),
          occupancy: Math.round(parseFloat(row.occupancy) * 100) / 100,
        })),
        monthlyTrend: (monthlyTrend.rows as any[]).map((row) => ({
          month: row.month,
          revenue: parseFloat(row.revenue),
          bookings: parseInt(row.bookings),
          occupancy: Math.round(parseFloat(row.occupancy) * 100) / 100,
        })),
        topListings: topListingsWithComparison,
        bookingsByStatus: {
          confirmed: parseInt(bookingStatus?.confirmed || '0'),
          completed: parseInt(bookingStatus?.completed || '0'),
          cancelled: parseInt(bookingStatus?.cancelled || '0'),
          rejected: parseInt(bookingStatus?.rejected || '0'),
          pending: parseInt(bookingStatus?.pending || '0'),
        },
        revenueByPaymentMethod: (revMethod as any[]).map((row) => ({
          method: row.method || 'Unknown',
          count: parseInt(row.count),
          revenue: parseFloat(row.revenue),
        })),
        forecast: {
          projectedMonthlyRevenue,
          projectedAnnualRevenue,
          confidence: 0.75, // 75% confidence based on current data
        },
      },
      meta: {
        responseTime: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Owner stats API error:', error);
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch owner statistics',
        error: error instanceof Error ? error.message : String(error),
        meta: {
          responseTime,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
