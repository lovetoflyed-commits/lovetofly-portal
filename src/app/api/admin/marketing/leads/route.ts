import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

// GET: List marketing leads
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const result = await pool.query(
      `SELECT ml.*, mc.name as campaign_name
       FROM marketing_leads ml
       LEFT JOIN marketing_campaigns mc ON ml.campaign_id = mc.id
       ORDER BY ml.created_at DESC
       LIMIT 200`
    );

    return NextResponse.json({ leads: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching marketing leads:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

// POST: Add new marketing lead
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const insert = await pool.query(
      `INSERT INTO marketing_leads
        (name, email, phone, source, status, campaign_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        body.name,
        body.email,
        body.phone || null,
        body.source || null,
        body.status || 'new',
        body.campaign_id || null,
        body.notes || null,
      ]
    );

    return NextResponse.json({ lead: insert.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating marketing lead:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
