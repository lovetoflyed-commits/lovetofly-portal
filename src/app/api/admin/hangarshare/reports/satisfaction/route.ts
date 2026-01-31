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
             COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END), 0)::numeric as revenue
      FROM hangar_bookings b
      WHERE b.created_at >= $1
      GROUP BY b.hangar_id
    ), eligible_listings AS (
      SELECT fl.*, ba.bookings_count, ba.revenue
      FROM filtered_listings fl
      LEFT JOIN booking_agg ba ON ba.hangar_id = fl.id
      WHERE COALESCE(ba.bookings_count, 0) >= ${addParam(minBookings)}
        AND COALESCE(ba.revenue, 0) >= ${addParam(minRevenue)}
    ), reviews_agg AS (
      SELECT
        hr.listing_id,
        COUNT(*)::int as total_reviews,
        ROUND(AVG(hr.rating)::numeric, 2) as avg_rating,
        COUNT(CASE WHEN hr.rating = 5 THEN 1 END)::int as rating_5_count,
        COUNT(CASE WHEN hr.rating = 4 THEN 1 END)::int as rating_4_count,
        COUNT(CASE WHEN hr.rating = 3 THEN 1 END)::int as rating_3_count,
        COUNT(CASE WHEN hr.rating = 2 THEN 1 END)::int as rating_2_count,
        COUNT(CASE WHEN hr.rating = 1 THEN 1 END)::int as rating_1_count,
        MAX(hr.created_at) as last_review_at
      FROM hangar_reviews hr
      WHERE hr.created_at >= $1
      GROUP BY hr.listing_id
    )`;

    const mainQuery = `
      ${baseCTE}
      SELECT
        COALESCE(el.icao_code, '—') as icao_code,
        COALESCE(el.aerodrome_name, '—') as aerodrome_name,
        COALESCE(el.city, '—') as city,
        COALESCE(el.state, '—') as state,
        COALESCE(ra.total_reviews, 0)::int as total_reviews,
        COALESCE(ra.avg_rating, 0)::numeric as avg_rating,
        COALESCE(ra.rating_5_count, 0)::int as rating_5_count,
        COALESCE(ra.rating_4_count, 0)::int as rating_4_count,
        COALESCE(ra.rating_3_count, 0)::int as rating_3_count,
        COALESCE(ra.rating_2_count, 0)::int as rating_2_count,
        COALESCE(ra.rating_1_count, 0)::int as rating_1_count,
        ra.last_review_at
      FROM eligible_listings el
      LEFT JOIN reviews_agg ra ON ra.listing_id = el.id
      ORDER BY avg_rating DESC, total_reviews DESC
      LIMIT 200
    `;

    const summaryQuery = `
      ${baseCTE}
      SELECT
        COUNT(el.id) as listings,
        COUNT(CASE WHEN COALESCE(ra.total_reviews, 0) > 0 THEN 1 END) as listings_with_reviews,
        COALESCE(SUM(ra.total_reviews), 0) as total_reviews,
        COALESCE(
          ROUND(SUM(ra.total_reviews * ra.avg_rating) / NULLIF(SUM(ra.total_reviews), 0), 2),
          0
        ) as avg_rating,
        COALESCE(SUM(ra.rating_5_count), 0) as rating_5_count,
        COALESCE(SUM(ra.rating_4_count), 0) as rating_4_count,
        COALESCE(SUM(ra.rating_3_count), 0) as rating_3_count,
        COALESCE(SUM(ra.rating_2_count), 0) as rating_2_count,
        COALESCE(SUM(ra.rating_1_count), 0) as rating_1_count
      FROM eligible_listings el
      LEFT JOIN reviews_agg ra ON ra.listing_id = el.id
    `;

    const trendQuery = `
      ${baseCTE}
      SELECT
        DATE_TRUNC('day', hr.created_at) as day,
        COUNT(*)::int as reviews,
        ROUND(AVG(hr.rating)::numeric, 2) as avg_rating
      FROM hangar_reviews hr
      JOIN eligible_listings el ON el.id = hr.listing_id
      WHERE hr.created_at >= $1
      GROUP BY day
      ORDER BY day ASC
    `;

    const [rowsRes, summaryRes, trendRes] = await Promise.all([
      pool.query(mainQuery, values),
      pool.query(summaryQuery, values),
      pool.query(trendQuery, values),
    ]);

    const rows = rowsRes.rows || [];
    const summary = summaryRes.rows[0] || {
      listings: 0,
      listings_with_reviews: 0,
      total_reviews: 0,
      avg_rating: 0,
      rating_5_count: 0,
      rating_4_count: 0,
      rating_3_count: 0,
      rating_2_count: 0,
      rating_1_count: 0,
    };
    const trends = (trendRes.rows || []).map((item: any) => ({
      day: item.day,
      reviews: Number(item.reviews || 0),
      avg_rating: Number(item.avg_rating || 0),
    }));

    return NextResponse.json({
      summary,
      rows,
      trends,
      range: { days, startDate, endDate },
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error generating satisfaction report:', err);
    return NextResponse.json(
      { message: 'Error generating satisfaction report', error: err },
      { status: 500 }
    );
  }
}
