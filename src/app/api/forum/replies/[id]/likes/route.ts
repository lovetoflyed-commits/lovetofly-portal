import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const body = await request.json().catch(() => ({}));
    const token = body?.token as string | undefined;

    if (!headerToken && !token) {
      return NextResponse.json({ message: 'Missing token' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || '';
    if (!jwtSecret) {
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    const decoded = jwt.verify(headerToken || token, jwtSecret) as any;
    const userId = decoded?.user_id ?? decoded?.id;
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const existing = await pool.query(
      `SELECT id FROM forum_reply_likes WHERE reply_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existing.rowCount > 0) {
      await pool.query(
        `DELETE FROM forum_reply_likes WHERE reply_id = $1 AND user_id = $2`,
        [id, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO forum_reply_likes (reply_id, user_id) VALUES ($1, $2)`,
        [id, userId]
      );
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int as likes_count FROM forum_reply_likes WHERE reply_id = $1`,
      [id]
    );

    return NextResponse.json({
      liked: existing.rowCount === 0,
      likes_count: countResult.rows[0]?.likes_count ?? 0,
    });
  } catch (error) {
    if ((error as any)?.code === '42P01') {
      return NextResponse.json(
        { message: 'Likes indisponíveis. Execute a migration 072.' },
        { status: 409 }
      );
    }
    console.error('Error toggling reply like:', error);
    return NextResponse.json({ message: 'Failed to update like' }, { status: 500 });
  }
}