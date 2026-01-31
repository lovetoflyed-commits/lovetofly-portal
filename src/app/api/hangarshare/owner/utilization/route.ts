import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/config/db';

interface JWTPayload {
  id?: number;
  userId?: number;
  email?: string;
}

function getUserIdFromRequest(request: NextRequest): number | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET || 'your-secret-key';

  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    const rawId = decoded.userId ?? decoded.id;
    const userId = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : rawId;
    return Number.isFinite(userId) ? (userId as number) : null;
  } catch {
    return null;
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDateRange(searchParams: URLSearchParams) {
  const period = searchParams.get('period') || 'month';
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  const endDate = endParam ? new Date(endParam) : new Date();
  const startDate = startParam ? new Date(startParam) : new Date(endDate);

  if (!startParam) {
    if (period === 'quarter') {
      startDate.setDate(endDate.getDate() - 90);
    } else if (period === 'year') {
      startDate.setDate(endDate.getDate() - 365);
    } else {
      startDate.setDate(endDate.getDate() - 30);
    }
  }

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ownerResult = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [userId]
    );

    if (ownerResult.rows.length === 0) {
      return NextResponse.json(
        { summary: { averageOccupancy: 0, totalRevenue: 0, totalDays: 0, listingsCount: 0 }, daily: [], byListing: [] },
        { status: 200 }
      );
    }

    const ownerId = ownerResult.rows[0].id as number;
    const { searchParams } = new URL(request.url);
    const { startDate, endDate } = resolveDateRange(searchParams);

    const [dailyResult, listingResult] = await Promise.all([
      pool.query(
        `SELECT 
          hud.date,
          COALESCE(AVG(hud.occupancy_rate), 0) as occupancy_rate,
          COALESCE(SUM(hud.revenue), 0) as revenue
        FROM hangar_utilization_daily hud
        JOIN hangar_listings hl ON hl.id = hud.listing_id
        WHERE hl.owner_id = $1 AND hud.date >= $2 AND hud.date <= $3
        GROUP BY hud.date
        ORDER BY hud.date ASC`,
        [ownerId, startDate, endDate]
      ),
      pool.query(
        `SELECT 
          hl.id as listing_id,
          hl.icao_code,
          hl.hangar_number,
          COALESCE(AVG(hud.occupancy_rate), 0) as average_occupancy,
          COALESCE(SUM(hud.revenue), 0) as total_revenue
        FROM hangar_listings hl
        LEFT JOIN hangar_utilization_daily hud
          ON hud.listing_id = hl.id
          AND hud.date >= $2 AND hud.date <= $3
        WHERE hl.owner_id = $1
        GROUP BY hl.id, hl.icao_code, hl.hangar_number
        ORDER BY total_revenue DESC NULLS LAST`,
        [ownerId, startDate, endDate]
      ),
    ]);

    const daily = dailyResult.rows.map((row) => ({
      date: row.date,
      occupancyRate: Number(row.occupancy_rate) || 0,
      revenue: Number(row.revenue) || 0,
    }));

    const byListing = listingResult.rows.map((row) => ({
      listingId: row.listing_id,
      icaoCode: row.icao_code,
      hangarNumber: row.hangar_number,
      averageOccupancy: Number(row.average_occupancy) || 0,
      totalRevenue: Number(row.total_revenue) || 0,
    }));

    const totalRevenue = daily.reduce((sum, item) => sum + item.revenue, 0);
    const averageOccupancy = daily.length
      ? daily.reduce((sum, item) => sum + item.occupancyRate, 0) / daily.length
      : 0;

    return NextResponse.json(
      {
        summary: {
          averageOccupancy: Number(averageOccupancy.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalDays: daily.length,
          listingsCount: byListing.length,
        },
        daily,
        byListing,
        range: { startDate, endDate },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching utilization analytics:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar utilização' },
      { status: 500 }
    );
  }
}
