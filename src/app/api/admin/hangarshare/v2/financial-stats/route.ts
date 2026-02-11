// API Route: Financial Stats for HangarShare V2 Dashboard
// File: src/app/api/admin/hangarshare/v2/financial-stats/route.ts
// Purpose: Comprehensive financial metrics and revenue analysis

import { NextResponse } from 'next/server';
import pool from '@/config/db';

interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    target: number;
    growth: number;
  }>;
  commissionMetrics: {
    collected: number;
    pending: number;
    rate: number;
  };
  payoutMetrics: {
    pending: number;
    processed: number;
    failed: number;
    totalProcessed: number;
  };
  revenueByAirport: Array<{
    airport: string;
    revenue: number;
    bookings: number;
    occupancy: number;
  }>;
  topOwners: Array<{
    id: string;
    name: string;
    revenue: number;
    bookings: number;
    commission: number;
  }>;
  payoutHistory: Array<{
    id: string;
    ownerName: string;
    amount: number;
    date: string;
    status: 'processed' | 'pending' | 'failed';
  }>;
  revenueMetrics: {
    trend: number;
    forecast: number;
    status: string;
  };
}

interface FinancialResponse {
  success: boolean;
  data: FinancialMetrics;
  meta: {
    responseTime: number;
    generatedAt: string;
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, message: 'HangarShare V2 is disabled' },
    { status: 404 }
  );

  const startTime = Date.now();

  try {
    // 1. Calculate total revenue (all-time)
    const totalRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = $1`,
      ['revenue']
    );
    const totalRevenue = Number(totalRevenueResult.rows[0]?.total || 0);

    // 2. Get monthly revenue for last 12 months with targets
    const monthlyRevenueResult = await pool.query(
      `
      WITH monthly_data AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM(amount) as revenue
        FROM transactions
        WHERE type = $1 AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
      )
      SELECT 
        TO_CHAR(month, 'MMM YY') as month,
        COALESCE(revenue, 0) as revenue,
        COALESCE(revenue, 0) * 1.1 as target,
        CASE 
          WHEN LAG(revenue) OVER (ORDER BY month) IS NOT NULL 
          THEN ROUND(((revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month) * 100)::numeric, 2)
          ELSE 0 
        END as growth
      FROM monthly_data
      ORDER BY month DESC
      `,
      ['revenue']
    );

    // 3. Get commission metrics
    const commissionResult = await pool.query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN status = $1 THEN amount ELSE 0 END), 0) as collected,
        COALESCE(SUM(CASE WHEN status = $2 THEN amount ELSE 0 END), 0) as pending,
        3.5 as rate
      FROM transactions
      WHERE type = $3
      `,
      ['completed', 'pending', 'commission']
    );

    const commissionMetrics = {
      collected: Number(commissionResult.rows[0]?.collected || 0),
      pending: Number(commissionResult.rows[0]?.pending || 0),
      rate: Number(commissionResult.rows[0]?.rate || 0),
    };

    // 4. Get payout metrics
    const payoutMetricsResult = await pool.query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN status = $1 THEN amount ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = $2 THEN amount ELSE 0 END), 0) as processed,
        COALESCE(SUM(CASE WHEN status = $3 THEN amount ELSE 0 END), 0) as failed,
        COALESCE(COUNT(CASE WHEN status = $2 THEN 1 END), 0) as payout_count
      FROM payouts
      `,
      ['pending', 'processed', 'failed']
    );

    const payoutMetrics = {
      pending: Number(payoutMetricsResult.rows[0]?.pending || 0),
      processed: Number(payoutMetricsResult.rows[0]?.processed || 0),
      failed: Number(payoutMetricsResult.rows[0]?.failed || 0),
      totalProcessed: Number(payoutMetricsResult.rows[0]?.payout_count || 0),
    };

    // 5. Get revenue by airport (top 10)
    const revenueByAirportResult = await pool.query(
      `
      SELECT 
        a.icao as airport,
        COALESCE(SUM(t.amount), 0) as revenue,
        COUNT(b.id) as bookings,
        ROUND(COALESCE(AVG(hl.occupancy_percentage), 0)::numeric, 1) as occupancy
      FROM airport_icao a
      LEFT JOIN hangar_listings hl ON a.id = hl.airport_id
      LEFT JOIN transactions t ON hl.id = t.listing_id AND t.type = $1
      LEFT JOIN bookings b ON hl.id = b.listing_id
      GROUP BY a.id, a.icao
      HAVING COALESCE(SUM(t.amount), 0) > 0
      ORDER BY revenue DESC
      LIMIT 10
      `,
      ['revenue']
    );

    // 6. Get top owners by revenue
    const topOwnersResult = await pool.query(
      `
      SELECT 
        ho.id,
        ho.company_name as name,
        COALESCE(SUM(t.amount), 0) as revenue,
        COUNT(b.id) as bookings,
        COALESCE(SUM(t.amount * 0.035), 0) as commission
      FROM hangar_owners ho
      LEFT JOIN hangar_listings hl ON ho.id = hl.owner_id
      LEFT JOIN transactions t ON hl.id = t.listing_id AND t.type = $1
      LEFT JOIN bookings b ON hl.id = b.listing_id
      GROUP BY ho.id, ho.company_name
      HAVING COALESCE(SUM(t.amount), 0) > 0
      ORDER BY revenue DESC
      LIMIT 10
      `,
      ['revenue']
    );

    // 7. Get payout history (last 20)
    const payoutHistoryResult = await pool.query(
      `
      SELECT 
        p.id,
        ho.company_name as owner_name,
        p.amount,
        TO_CHAR(p.processed_at, 'YYYY-MM-DD') as date,
        p.status
      FROM payouts p
      JOIN hangar_owners ho ON p.owner_id = ho.id
      ORDER BY p.processed_at DESC
      LIMIT 20
      `
    );

    // 8. Calculate revenue trend and forecast
    const trendResult = await pool.query(
      `
      SELECT 
        ROUND(
          ((SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) THEN amount ELSE 0 END) -
            SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') THEN amount ELSE 0 END)) /
           NULLIF(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') THEN amount ELSE 0 END), 0) * 100)::numeric,
          2
        ) as trend
      FROM transactions
      WHERE type = $1 AND created_at >= NOW() - INTERVAL '2 months'
      `,
      ['revenue']
    );

    const trend = Number(trendResult.rows[0]?.trend || 0);
    const forecast = totalRevenue * 1.15; // 15% growth forecast

    const responseTime = Date.now() - startTime;

    const response: FinancialResponse = {
      success: true,
      data: {
        totalRevenue,
        monthlyRevenue: monthlyRevenueResult.rows.map((row: any) => ({
          month: row.month,
          revenue: Number(row.revenue),
          target: Number(row.target),
          growth: Number(row.growth) || 0,
        })),
        commissionMetrics,
        payoutMetrics,
        revenueByAirport: revenueByAirportResult.rows.map((row: any) => ({
          airport: row.airport,
          revenue: Number(row.revenue),
          bookings: Number(row.bookings),
          occupancy: Number(row.occupancy),
        })),
        topOwners: topOwnersResult.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          revenue: Number(row.revenue),
          bookings: Number(row.bookings),
          commission: Number(row.commission),
        })),
        payoutHistory: payoutHistoryResult.rows.map((row: any) => ({
          id: row.id,
          ownerName: row.owner_name,
          amount: Number(row.amount),
          date: row.date,
          status: row.status as 'processed' | 'pending' | 'failed',
        })),
        revenueMetrics: {
          trend,
          forecast: Number(forecast),
          status: trend > 0 ? 'healthy' : trend === 0 ? 'stable' : 'declining',
        },
      },
      meta: {
        responseTime,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Financial Stats API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        data: {
          totalRevenue: 0,
          monthlyRevenue: [],
          commissionMetrics: { collected: 0, pending: 0, rate: 0 },
          payoutMetrics: { pending: 0, processed: 0, failed: 0, totalProcessed: 0 },
          revenueByAirport: [],
          topOwners: [],
          payoutHistory: [],
          revenueMetrics: { trend: 0, forecast: 0, status: 'error' },
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
