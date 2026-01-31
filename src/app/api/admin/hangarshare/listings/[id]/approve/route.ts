import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await pool.query(
      `UPDATE hangar_listings
       SET status = 'active', approval_status = 'approved'
       WHERE id = $1
       RETURNING id, hangar_number`,
      [id]
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
