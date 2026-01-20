import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.plan,
        u.aviation_role,
        u.created_at
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 500
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching HangarShare users:', error);
    return NextResponse.json(
      { message: 'Error fetching users' },
      { status: 500 }
    );
  }
}
