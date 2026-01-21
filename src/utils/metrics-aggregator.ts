// Metrics Aggregator
// File: src/utils/metrics-aggregator.ts
// Purpose: Collects and aggregates real-time metrics from database

import pool from '@/config/db';

export interface RealTimeMetrics {
  revenue: {
    current: number;
    monthly: number;
    growth: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
  };
  listings: {
    total: number;
    active: number;
    pending: number;
    inactive: number;
  };
  occupancy: {
    percentage: number;
    occupied: number;
    available: number;
  };
  growth: {
    month: number;
    percent: number;
  };
  timestamp: number;
}

/**
 * Get aggregated real-time metrics for an owner
 */
export async function getMetrics(ownerId: string): Promise<RealTimeMetrics> {
  try {
    // Get revenue data
    const revenueResult = await pool.query(
      `
      SELECT 
        COALESCE(SUM(CASE 
          WHEN created_at >= NOW() - INTERVAL '30 days' THEN payment_amount 
          ELSE 0 
        END), 0) as monthly_revenue,
        COALESCE(SUM(CASE 
          WHEN created_at >= NOW() - INTERVAL '1 day' THEN payment_amount 
          ELSE 0 
        END), 0) as daily_revenue
      FROM bookings
      WHERE owner_id = $1 AND booking_status = 'completed'
      `,
      [ownerId]
    );

    const { monthly_revenue, daily_revenue } = revenueResult.rows[0] || {
      monthly_revenue: 0,
      daily_revenue: 0,
    };

    // Get booking statistics
    const bookingResult = await pool.query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN booking_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed
      FROM bookings
      WHERE owner_id = $1
      `,
      [ownerId]
    );

    const bookingStats = bookingResult.rows[0] || {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
    };

    // Get listing statistics
    const listingResult = await pool.query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive
      FROM hangar_listings
      WHERE owner_id = $1
      `,
      [ownerId]
    );

    const listingStats = listingResult.rows[0] || {
      total: 0,
      active: 0,
      pending: 0,
      inactive: 0,
    };

    // Get occupancy data
    const occupancyResult = await pool.query(
      `
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as occupied,
        COUNT(CASE WHEN status IN ('active', 'available') THEN 1 END) as total_listings
      FROM hangar_listings
      WHERE owner_id = $1
      `,
      [ownerId]
    );

    const occupancyStats = occupancyResult.rows[0] || {
      occupied: 0,
      total_listings: 0,
    };

    const occupancyPercentage =
      occupancyStats.total_listings > 0
        ? Math.round((occupancyStats.occupied / occupancyStats.total_listings) * 100)
        : 0;

    // Get monthly growth
    const growthResult = await pool.query(
      `
      SELECT 
        DATE_TRUNC('month', created_at)::DATE as month,
        COUNT(*) as count
      FROM bookings
      WHERE owner_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 2
      `,
      [ownerId]
    );

    const growthData = growthResult.rows;
    let monthGrowth = 0;
    let growthPercent = 0;

    if (growthData.length === 2) {
      const currentMonth = parseInt(growthData[0].count);
      const previousMonth = parseInt(growthData[1].count);
      monthGrowth = currentMonth - previousMonth;
      growthPercent =
        previousMonth > 0
          ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
          : 0;
    } else if (growthData.length === 1) {
      monthGrowth = parseInt(growthData[0].count);
      growthPercent = 100;
    }

    return {
      revenue: {
        current: Math.round(daily_revenue),
        monthly: Math.round(monthly_revenue),
        growth: monthGrowth,
      },
      bookings: {
        total: parseInt(bookingStats.total),
        pending: parseInt(bookingStats.pending),
        confirmed: parseInt(bookingStats.confirmed),
        completed: parseInt(bookingStats.completed),
      },
      listings: {
        total: parseInt(listingStats.total),
        active: parseInt(listingStats.active),
        pending: parseInt(listingStats.pending),
        inactive: parseInt(listingStats.inactive),
      },
      occupancy: {
        percentage: occupancyPercentage,
        occupied: parseInt(occupancyStats.occupied),
        available: Math.max(
          0,
          parseInt(occupancyStats.total_listings) - parseInt(occupancyStats.occupied)
        ),
      },
      growth: {
        month: monthGrowth,
        percent: growthPercent,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[MetricsAggregator] Error fetching metrics:', error);

    // Return empty metrics on error
    return {
      revenue: { current: 0, monthly: 0, growth: 0 },
      bookings: { total: 0, pending: 0, confirmed: 0, completed: 0 },
      listings: { total: 0, active: 0, pending: 0, inactive: 0 },
      occupancy: { percentage: 0, occupied: 0, available: 0 },
      growth: { month: 0, percent: 0 },
      timestamp: Date.now(),
    };
  }
}

/**
 * Get metrics for multiple owners (batch)
 */
export async function getMetricsBatch(ownerIds: string[]): Promise<Record<string, RealTimeMetrics>> {
  const results: Record<string, RealTimeMetrics> = {};

  for (const ownerId of ownerIds) {
    try {
      results[ownerId] = await getMetrics(ownerId);
    } catch (error) {
      console.error(`[MetricsAggregator] Error for owner ${ownerId}:`, error);
      results[ownerId] = {
        revenue: { current: 0, monthly: 0, growth: 0 },
        bookings: { total: 0, pending: 0, confirmed: 0, completed: 0 },
        listings: { total: 0, active: 0, pending: 0, inactive: 0 },
        occupancy: { percentage: 0, occupied: 0, available: 0 },
        growth: { month: 0, percent: 0 },
        timestamp: Date.now(),
      };
    }
  }

  return results;
}

/**
 * Get revenue metrics for an owner
 */
export async function getRevenueMetrics(ownerId: string): Promise<{ daily: number; monthly: number }> {
  try {
    const result = await pool.query(
      `
      SELECT 
        COALESCE(SUM(CASE 
          WHEN created_at >= NOW() - INTERVAL '1 day' THEN payment_amount 
          ELSE 0 
        END), 0) as daily,
        COALESCE(SUM(CASE 
          WHEN created_at >= NOW() - INTERVAL '30 days' THEN payment_amount 
          ELSE 0 
        END), 0) as monthly
      FROM bookings
      WHERE owner_id = $1 AND booking_status = 'completed'
      `,
      [ownerId]
    );

    const { daily, monthly } = result.rows[0] || { daily: 0, monthly: 0 };
    return {
      daily: Math.round(daily),
      monthly: Math.round(monthly),
    };
  } catch (error) {
    console.error('[MetricsAggregator] Error fetching revenue:', error);
    return { daily: 0, monthly: 0 };
  }
}

/**
 * Get booking count by status
 */
export async function getBookingStats(ownerId: string): Promise<Record<string, number>> {
  try {
    const result = await pool.query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN booking_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled
      FROM bookings
      WHERE owner_id = $1
      `,
      [ownerId]
    );

    return result.rows[0] || { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  } catch (error) {
    console.error('[MetricsAggregator] Error fetching booking stats:', error);
    return { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  }
}

/**
 * Get occupancy statistics
 */
export async function getOccupancyStats(ownerId: string): Promise<{ occupied: number; available: number; percentage: number }> {
  try {
    const result = await pool.query(
      `
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as occupied,
        COUNT(*) as total
      FROM hangar_listings
      WHERE owner_id = $1
      `,
      [ownerId]
    );

    const { occupied = 0, total = 0 } = result.rows[0] || {};
    const available = total - occupied;
    const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { occupied, available, percentage };
  } catch (error) {
    console.error('[MetricsAggregator] Error fetching occupancy:', error);
    return { occupied: 0, available: 0, percentage: 0 };
  }
}
