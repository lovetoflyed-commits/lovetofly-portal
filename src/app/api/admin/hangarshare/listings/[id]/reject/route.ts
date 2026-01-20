import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Delete the listing
    const result = await pool.query(
      'DELETE FROM hangar_listings WHERE id = $1 RETURNING id, hangar_number',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Listing rejected and removed' });
  } catch (error) {
    console.error('Error rejecting listing:', error);
    return NextResponse.json(
      { message: 'Error rejecting listing' },
      { status: 500 }
    );
  }
}
