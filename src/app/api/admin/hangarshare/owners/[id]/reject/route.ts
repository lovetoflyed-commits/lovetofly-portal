import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Delete the owner (cascade will handle related listings)
    const result = await pool.query(
      'DELETE FROM hangar_owners WHERE id = $1 RETURNING id, company_name',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Hangar owner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Owner rejected and removed' });
  } catch (error) {
    console.error('Error rejecting hangar owner:', error);
    return NextResponse.json(
      { message: 'Error rejecting owner' },
      { status: 500 }
    );
  }
}
