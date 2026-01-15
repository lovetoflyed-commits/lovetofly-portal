import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Delete career profile
    const result = await pool.query(
      'DELETE FROM career_profiles WHERE user_id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Career profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Career profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting career profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
