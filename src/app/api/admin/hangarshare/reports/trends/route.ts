import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get('days') || 90);
    const query = searchParams.get('q')?.trim() || '';
    const city = searchParams.get('city')?.trim() || '';
    const state = searchParams.get('state')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const minBookings = Number(searchParams.get('minBookings') || 0);
    const minRevenue = Number(searchParams.get('minRevenue') || 0);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.max(days, 1));

    const filters: string[] = [];
    const values: any[] = [startDate];

    const addParam = (value: any) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (query) {
      const q = `%${query}%`;
      filters.push(
        `(
          COALESCE(hl.icao_code, '') ILIKE ${addParam(q)}
          OR COALESCE(hl.aerodrome_name, '') ILIKE ${addParam(q)}
          OR COALESCE(hl.city, '') ILIKE ${addParam(q)}
          OR COALESCE(hl.state, '') ILIKE ${addParam(q)}
        )`
      );
    }

    if (city) {
      filters.push(`COALESCE(hl.city, '') ILIKE ${addParam(`%${city}%`)}`);
    }

    if (state) {
      filters.push(`COALESCE(hl.state, '') ILIKE ${addParam(`%${state}%`)}`);
    }

    if (status && status !== 'all') {
      filters.push(`hl.status = ${addParam(status)}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const baseCTE = `WITH filtered_listings AS (
      SELECT hl.id, hl.icao_code, hl.aerodrome_name, hl.city, hl.state, hl.status, hl.daily_rate
      FROM hangar_listings hl
      ${whereClause}
    ), booking_agg AS (
      SELECT b.hangar_id,
             COUNT(*)::int as bookings_count,
             COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END), 0)::numeric as revenue,
             COALESCE(SUM(b.nights), 0)::int as booked_nights
      FROM hangar_bookings b
      WHERE b.created_at >= $1
      GROUP BY b.hangar_id
    ), eligible_listings AS (
      SELECT fl.*, ba.bookings_count, ba.revenue, ba.booked_nights
      FROM filtered_listings fl
      LEFT JOIN booking_agg ba ON ba.hangar_id = fl.id
      WHERE COALESCE(ba.bookings_count, 0) >= ${addParam(minBookings)}
        AND COALESCE(ba.revenue, 0) >= ${addParam(minRevenue)}
    )`;

    const summaryQuery = `
      ${baseCTE}
      SELECT
        COUNT(el.id) as listings,
        COUNT(CASE WHEN el.status = 'active' THEN 1 END) as active_listings,
        COALESCE(SUM(el.bookings_count), 0) as bookings,
        COALESCE(SUM(el.revenue), 0) as revenue,
        ROUND(COALESCE(AVG(el.daily_rate), 0)::numeric, 2) as avg_daily_rate
      FROM eligible_listings el
    `;

    const trendQuery = `
      ${baseCTE}
      SELECT
        DATE_TRUNC('day', b.created_at) as day,
        COUNT(*)::int as bookings,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END), 0)::numeric as revenue
      FROM hangar_bookings b
      JOIN eligible_listings el ON el.id = b.hangar_id
      WHERE b.created_at >= $1
      GROUP BY day
      ORDER BY day ASC
    `;

    const [summaryRes, trendRes] = await Promise.all([
      pool.query(summaryQuery, values),
      pool.query(trendQuery, values),
    ]);

    const summary = summaryRes.rows[0] || {
      listings: 0,
      active_listings: 0,
      bookings: 0,
      revenue: 0,
      avg_daily_rate: 0,
    };

    const trends = (trendRes.rows || []).map((item: any) => ({
      day: item.day,
      bookings: Number(item.bookings || 0),
      revenue: Number(item.revenue || 0),
    }));

    return NextResponse.json({
      summary,
      trends,
      range: { days, startDate, endDate },
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error generating trends report:', err);
    return NextResponse.json(
      { message: 'Error generating trends report', error: err },
      { status: 500 }
    );
  }
}
