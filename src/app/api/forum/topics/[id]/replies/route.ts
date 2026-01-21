import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, token } = body;

    if (!content || !token) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    const userId = (decoded as any).user_id;

    if (!userId) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if topic exists
    const topicResult = await pool.query(
      `SELECT id FROM forum_topics WHERE id = $1 AND is_deleted = FALSE`,
      [id]
    );

    if (topicResult.rowCount === 0) {
      return NextResponse.json(
        { message: 'Topic not found' },
        { status: 404 }
      );
    }

    // Insert reply
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const replyResult = await client.query(
        `INSERT INTO forum_replies (topic_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, created_at`,
        [id, userId, content]
      );

      // Update reply count
      await client.query(
        `UPDATE forum_topics SET replies_count = replies_count + 1 WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        id: replyResult.rows[0].id,
        message: 'Reply created successfully',
        reply: replyResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating reply:', error);
    if ((error as any).name === 'JsonWebTokenError') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create reply' },
      { status: 500 }
    );
  }
}
