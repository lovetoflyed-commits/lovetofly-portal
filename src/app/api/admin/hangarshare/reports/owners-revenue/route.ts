import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get('days') || 30);
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
          COALESCE(ho.company_name, '') ILIKE ${addParam(q)}
          OR COALESCE(hl.icao_code, '') ILIKE ${addParam(q)}
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
      SELECT
        hl.id,
        hl.owner_id,
        hl.icao_code,
        hl.aerodrome_name,
        hl.city,
        hl.state,
        hl.status,
        hl.daily_rate,
        ho.company_name,
        ho.is_verified
      FROM hangar_listings hl
      JOIN hangar_owners ho ON ho.id = hl.owner_id
      ${whereClause}
    ), booking_agg AS (
      SELECT b.hangar_id,
             COUNT(*)::int as bookings_count,
             COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END), 0)::numeric as revenue,
             COALESCE(SUM(b.nights), 0)::int as booked_nights
      FROM hangar_bookings b
      WHERE b.created_at >= $1
      GROUP BY b.hangar_id
    )`;

    const mainQuery = `
      ${baseCTE}
      SELECT
        fl.owner_id,
        COALESCE(fl.company_name, '—') as company_name,
        COALESCE(fl.is_verified, false) as is_verified,
        COUNT(fl.id)::int as listings_count,
        COALESCE(SUM(ba.bookings_count), 0)::int as bookings_count,
        COALESCE(SUM(ba.revenue), 0)::numeric as revenue,
        ROUND(COALESCE(AVG(fl.daily_rate), 0)::numeric, 2) as avg_daily_rate,
        COALESCE(SUM(ba.booked_nights), 0)::int as booked_nights,
        COUNT(CASE WHEN fl.status = 'active' THEN 1 END)::int as active_listings
      FROM filtered_listings fl
      LEFT JOIN booking_agg ba ON ba.hangar_id = fl.id
      GROUP BY fl.owner_id, fl.company_name, fl.is_verified
      HAVING COALESCE(SUM(ba.bookings_count), 0) >= ${addParam(minBookings)}
        AND COALESCE(SUM(ba.revenue), 0) >= ${addParam(minRevenue)}
      ORDER BY revenue DESC, bookings_count DESC
      LIMIT 200
    `;

    const summaryQuery = `
      ${baseCTE}
      SELECT
        COUNT(DISTINCT fl.owner_id) as owners,
        COUNT(fl.id) as listings,
        COALESCE(SUM(ba.bookings_count), 0) as bookings,
        COALESCE(SUM(ba.revenue), 0) as revenue
      FROM filtered_listings fl
      LEFT JOIN booking_agg ba ON ba.hangar_id = fl.id
    `;

    const trendQuery = `
      ${baseCTE}
      SELECT
        DATE_TRUNC('day', b.created_at) as day,
        COUNT(*)::int as bookings,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END), 0)::numeric as revenue
      FROM hangar_bookings b
      JOIN filtered_listings fl ON fl.id = b.hangar_id
      WHERE b.created_at >= $1
      GROUP BY day
      ORDER BY day ASC
    `;

    const [rowsRes, summaryRes, trendRes] = await Promise.all([
      pool.query(mainQuery, values),
      pool.query(summaryQuery, values.slice(0, -2)),
      pool.query(trendQuery, values.slice(0, -2)),
    ]);

    const rows = rowsRes.rows || [];
    const summary = summaryRes.rows[0] || {
      owners: 0,
      listings: 0,
      bookings: 0,
      revenue: 0,
    };
    const trends = (trendRes.rows || []).map((item: any) => ({
      day: item.day,
      bookings: Number(item.bookings || 0),
      revenue: Number(item.revenue || 0),
    }));

    return NextResponse.json({
      summary,
      rows,
      trends,
      range: { days, startDate, endDate },
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error generating owners revenue report:', err);
    return NextResponse.json(
      { message: 'Error generating owners revenue report', error: err },
      { status: 500 }
    );
  }
}
