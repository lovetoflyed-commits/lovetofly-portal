import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await pool.query(
      'UPDATE hangar_owners SET is_verified = true WHERE id = $1 RETURNING id, company_name',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Hangar owner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error verifying hangar owner:', error);
    return NextResponse.json(
      { message: 'Error verifying owner' },
      { status: 500 }
    );
  }
}
