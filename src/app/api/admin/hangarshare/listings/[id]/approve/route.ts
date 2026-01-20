import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const result = await pool.query(
      'UPDATE hangar_listings SET status = $1 WHERE id = $2 RETURNING id, hangar_number',
      ['active', id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving listing:', error);
    return NextResponse.json(
      { message: 'Error approving listing' },
      { status: 500 }
    );
  }
}
