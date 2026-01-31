import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

const CONTENT_TABLES: Record<string, { table: string; ownerColumn: string }> = {
  hangar_listing: { table: 'hangar_listings', ownerColumn: 'owner_id' },
  classified_aircraft: { table: 'aircraft_listings', ownerColumn: 'user_id' },
  classified_parts: { table: 'parts_listings', ownerColumn: 'user_id' },
  classified_avionics: { table: 'avionics_listings', ownerColumn: 'user_id' },
};

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const contentType = String(body.contentType || '').toLowerCase();
    const contentId = Number(body.contentId);
    const reason = String(body.reason || '').trim();
    const details = body.details ? String(body.details).trim() : null;

    if (!CONTENT_TABLES[contentType] || !contentId || !reason) {
      return NextResponse.json({ message: 'Invalid report data' }, { status: 400 });
    }

    const { table, ownerColumn } = CONTENT_TABLES[contentType];
    const ownerRes = await pool.query(
      `SELECT ${ownerColumn} as owner_id FROM ${table} WHERE id = $1`,
      [contentId]
    );

    if (ownerRes.rows.length === 0) {
      return NextResponse.json({ message: 'Content not found' }, { status: 404 });
    }

    if (Number(ownerRes.rows[0].owner_id) === user.id) {
      return NextResponse.json({ message: 'Você não pode denunciar seu próprio conteúdo' }, { status: 400 });
    }

    const insertRes = await pool.query(
      `INSERT INTO content_reports (
        reporter_user_id,
        content_type,
        content_id,
        reason,
        details,
        status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, status, created_at`,
      [user.id, contentType, contentId, reason, details]
    );

    return NextResponse.json({ report: insertRes.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ message: 'Error creating report' }, { status: 500 });
  }
}
