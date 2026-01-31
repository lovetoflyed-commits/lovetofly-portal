import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { getAdminUser, logAdminAction, requireAdmin } from '@/utils/adminAuth';

const ALLOWED_ACTIONS = new Set(['pin', 'unpin', 'lock', 'unlock', 'delete', 'restore']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const action = String(body?.action || '').toLowerCase();

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ message: 'Invalid moderation action' }, { status: 400 });
    }

    let updateSql = '';
    switch (action) {
      case 'pin':
        updateSql = 'UPDATE forum_topics SET is_pinned = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *';
        break;
      case 'unpin':
        updateSql = 'UPDATE forum_topics SET is_pinned = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *';
        break;
      case 'lock':
        updateSql = 'UPDATE forum_topics SET is_locked = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *';
        break;
      case 'unlock':
        updateSql = 'UPDATE forum_topics SET is_locked = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *';
        break;
      case 'delete':
        updateSql = 'UPDATE forum_topics SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *';
        break;
      case 'restore':
        updateSql = 'UPDATE forum_topics SET is_deleted = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *';
        break;
      default:
        return NextResponse.json({ message: 'Invalid moderation action' }, { status: 400 });
    }

    const result = await pool.query(updateSql, [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Topic not found' }, { status: 404 });
    }

    const admin = await getAdminUser(request);
    if (admin) {
      await logAdminAction(admin.id, 'forum_topic_moderate', 'forum_topic', String(id), { action }, request);
    }

    return NextResponse.json({
      message: 'Moderation action applied',
      topic: result.rows[0],
    });
  } catch (error) {
    console.error('Forum moderation error:', error);
    return NextResponse.json({ message: 'Failed to moderate topic' }, { status: 500 });
  }
}
