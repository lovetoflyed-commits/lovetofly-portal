import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

// GET: List marketing campaigns
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const result = await pool.query('SELECT * FROM marketing_campaigns ORDER BY created_at DESC LIMIT 100');
    return NextResponse.json({ campaigns: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching marketing campaigns:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

// POST: Add new marketing campaign
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const insert = await pool.query(
      'INSERT INTO marketing_campaigns (name, description, status, start_date, end_date, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [body.name, body.description, body.status || 'draft', body.start_date, body.end_date, body.created_by]
    );
    return NextResponse.json({ campaign: insert.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating marketing campaign:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
