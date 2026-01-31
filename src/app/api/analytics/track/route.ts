// Portal traffic tracking API
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(request: NextRequest) {
  try {
    const { page, referrer, userAgent } = await request.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create analytics table if not exists (safe for production)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portal_analytics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        page VARCHAR(500),
        visit_count INTEGER DEFAULT 1,
        referrer TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_portal_analytics_date 
      ON portal_analytics(date)
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_analytics_date_page
      ON portal_analytics(date, page)
    `);

    // Insert or update visit count for today
    await pool.query(`
      INSERT INTO portal_analytics (date, page, visit_count, referrer, user_agent)
      VALUES ($1, $2, 1, $3, $4)
      ON CONFLICT (date, page) 
      DO UPDATE SET 
        visit_count = portal_analytics.visit_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `, [today, page || '/', referrer || null, userAgent || null]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao rastrear visita:', error);
    // Fail silently for analytics
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

// Get analytics summary
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalVisits, todayVisits, topPages] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(visit_count), 0) as total FROM portal_analytics'),
      pool.query('SELECT COALESCE(SUM(visit_count), 0) as total FROM portal_analytics WHERE date = $1', [today]),
      pool.query(`
        SELECT page, SUM(visit_count) as visits 
        FROM portal_analytics 
        WHERE date >= $1 
        GROUP BY page 
        ORDER BY visits DESC 
        LIMIT 10
      `, [today])
    ]);

    return NextResponse.json({
      totalVisits: Number(totalVisits.rows[0].total),
      todayVisits: Number(todayVisits.rows[0].total),
      topPages: topPages.rows
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    return NextResponse.json({ 
      totalVisits: 0, 
      todayVisits: 0, 
      topPages: [] 
    }, { status: 200 });
  }
}
