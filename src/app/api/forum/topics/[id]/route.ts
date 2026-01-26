import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let userId: string | null = null;

    if (headerToken && process.env.JWT_SECRET) {
      try {
        const decoded = (await import('jsonwebtoken')).default.verify(
          headerToken,
          process.env.JWT_SECRET
        ) as any;
        userId = decoded?.user_id ?? decoded?.id ?? null;
      } catch {
        userId = null;
      }
    }

    // Get topic details
    const topicParams = userId ? [id, userId] : [id];
    const likedSelect = userId
      ? 'EXISTS (SELECT 1 FROM forum_topic_likes WHERE topic_id = t.id AND user_id = $2) as liked_by_user'
      : 'FALSE as liked_by_user';

    let topicResult;
    try {
      topicResult = await pool.query(
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
          u.avatar_url as author_avatar,
          COALESCE(tl.likes_count, 0) as likes_count,
          ${likedSelect}
        FROM forum_topics t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN (
          SELECT topic_id, COUNT(*)::int as likes_count
          FROM forum_topic_likes
          GROUP BY topic_id
        ) tl ON tl.topic_id = t.id
        WHERE t.id = $1 AND t.is_deleted = FALSE`,
        topicParams
      );
    } catch (error: any) {
      if (error?.code !== '42P01') throw error;
      topicResult = await pool.query(
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
          u.avatar_url as author_avatar,
          0 as likes_count,
          FALSE as liked_by_user
        FROM forum_topics t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.is_deleted = FALSE`,
        [id]
      );
    }

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
    const replyParams = userId ? [id, userId] : [id];
    const replyLikedSelect = userId
      ? 'EXISTS (SELECT 1 FROM forum_reply_likes WHERE reply_id = r.id AND user_id = $2) as liked_by_user'
      : 'FALSE as liked_by_user';

    let repliesResult;
    try {
      repliesResult = await pool.query(
        `SELECT 
          r.id,
          r.topic_id,
          r.parent_reply_id,
          r.user_id,
          r.content,
          r.created_at,
          r.updated_at,
          CONCAT(u.first_name, ' ', u.last_name) as author_name,
          u.avatar_url as author_avatar,
          COALESCE(rl.likes_count, 0) as likes_count,
          ${replyLikedSelect}
        FROM forum_replies r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN (
          SELECT reply_id, COUNT(*)::int as likes_count
          FROM forum_reply_likes
          GROUP BY reply_id
        ) rl ON rl.reply_id = r.id
        WHERE r.topic_id = $1 AND r.is_deleted = FALSE
        ORDER BY r.created_at ASC`,
        replyParams
      );
    } catch (error: any) {
      if (error?.code !== '42P01') throw error;
      repliesResult = await pool.query(
        `SELECT 
          r.id,
          r.topic_id,
          r.parent_reply_id,
          r.user_id,
          r.content,
          r.created_at,
          r.updated_at,
          CONCAT(u.first_name, ' ', u.last_name) as author_name,
          u.avatar_url as author_avatar,
          0 as likes_count,
          FALSE as liked_by_user
        FROM forum_replies r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.topic_id = $1 AND r.is_deleted = FALSE
        ORDER BY r.created_at ASC`,
        [id]
      );
    }

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
