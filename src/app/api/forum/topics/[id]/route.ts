import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get topic details
    const topicResult = await pool.query(
      `SELECT 
        t.id,
        t.user_id,
        t.title,
        t.category,
        t.content,
        t.views,
        t.replies_count,
        t.is_pinned,
        t.is_locked,
        t.created_at,
        t.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.avatar_url as author_avatar
      FROM forum_topics t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1 AND t.is_deleted = FALSE`,
      [id]
    );

    if (topicResult.rowCount === 0) {
      return NextResponse.json(
        { message: 'Topic not found' },
        { status: 404 }
      );
    }

    // Increment views
    await pool.query(
      `UPDATE forum_topics SET views = views + 1 WHERE id = $1`,
      [id]
    );

    // Get replies
    const repliesResult = await pool.query(
      `SELECT 
        r.id,
        r.topic_id,
        r.user_id,
        r.content,
        r.created_at,
        r.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.avatar_url as author_avatar
      FROM forum_replies r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.topic_id = $1 AND r.is_deleted = FALSE
      ORDER BY r.created_at ASC`,
      [id]
    );

    return NextResponse.json({
      topic: topicResult.rows[0],
      replies: repliesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { message: 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}
