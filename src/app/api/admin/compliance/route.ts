import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

// GET: List compliance records
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const result = await pool.query('SELECT * FROM compliance_records ORDER BY created_at DESC LIMIT 100');
    return NextResponse.json({ records: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

// POST: Add new compliance record
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const insert = await pool.query(
      'INSERT INTO compliance_records (type, description, status, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [body.type, body.description, body.status || 'pending', body.created_by]
    );
    return NextResponse.json({ record: insert.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating compliance record:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
