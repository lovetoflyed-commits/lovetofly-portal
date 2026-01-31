import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST() {
  try {
    const result = await pool.query(
      `UPDATE hangar_listings
       SET status = 'active', approval_status = 'approved'
       WHERE status = 'pending'
          OR approval_status IN ('pending', 'pending_approval')
       RETURNING id`
    );

    return NextResponse.json({ approved: result.rowCount || 0 });
  } catch (error) {
    console.error('Error approving all listings:', error);
    return NextResponse.json(
      { message: 'Error approving listings' },
      { status: 500 }
    );
  }
}
