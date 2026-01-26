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
    const { content, token, parentReplyId, parent_reply_id } = body;
    const resolvedParentReplyId = parentReplyId ?? parent_reply_id ?? null;
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const jwtSecret = process.env.JWT_SECRET || '';

    if (!content || (!token && !headerToken)) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!jwtSecret) {
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(headerToken || token, jwtSecret);
    const decodedAny = decoded as any;
    const userId = decodedAny.user_id ?? decodedAny.id;

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

    if (resolvedParentReplyId) {
      const parentResult = await pool.query(
        `SELECT id FROM forum_replies WHERE id = $1 AND topic_id = $2 AND is_deleted = FALSE`,
        [resolvedParentReplyId, id]
      );
      if (parentResult.rowCount === 0) {
        return NextResponse.json(
          { message: 'Parent reply not found' },
          { status: 400 }
        );
      }
    }

    // Insert reply
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const replyResult = await client.query(
        `INSERT INTO forum_replies (topic_id, user_id, content, parent_reply_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, created_at`,
        [id, userId, content, resolvedParentReplyId]
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
