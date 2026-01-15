import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

// POST /api/admin/moderation/action
// Issue warning, strike, suspend, or ban a user
export async function POST(request: NextRequest) {
  try {
    const { userId, actionType, reason, severity = 'normal', suspensionDays, adminId } = await request.json();

    if (!userId || !actionType || !reason) {
      return NextResponse.json(
        { message: 'Missing required fields: userId, actionType, reason' },
        { status: 400 }
      );
    }

    if (!['warning', 'strike', 'suspend', 'ban', 'restore'].includes(actionType)) {
      return NextResponse.json(
        { message: 'Invalid action type' },
        { status: 400 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Handle restore action
      if (actionType === 'restore') {
        // Mark previous moderation as inactive
        await client.query(
          `UPDATE user_moderation SET is_active = false WHERE user_id = $1 AND is_active = true`,
          [userId]
        );

        // Restore user to active status
        await client.query(
          `UPDATE user_access_status 
           SET access_level = 'active', restore_date = NULL, changed_at = NOW(), changed_by = $2
           WHERE user_id = $1`,
          [userId, adminId || null]
        );

        // Record restoration action
        const modResult = await client.query(
          `INSERT INTO user_moderation 
            (user_id, action_type, reason, severity, issued_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, user_id, action_type, issued_at`,
          [userId, 'restore', reason || 'User access restored', 'normal', adminId || null]
        );

        await client.query('COMMIT');

        return NextResponse.json(
          { 
            message: 'User access restored successfully',
            moderation: modResult.rows[0]
          },
          { status: 201 }
        );
      }

      // Record moderation action
      let suspensionEndDate = null;
      if (actionType === 'suspend' && suspensionDays) {
        suspensionEndDate = new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000).toISOString();
      }

      const modResult = await client.query(
        `INSERT INTO user_moderation 
          (user_id, action_type, reason, severity, suspension_end_date, issued_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, action_type, issued_at`,
        [userId, actionType, reason, severity, suspensionEndDate, adminId || null]
      );

      // Update user access status
      const accessLevel = actionType === 'ban' ? 'banned' : 
                         actionType === 'suspend' ? 'suspended' : 'warning';
      
      await client.query(
        `INSERT INTO user_access_status (user_id, access_level, access_reason, changed_by, restore_date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET 
           access_level = EXCLUDED.access_level,
           access_reason = EXCLUDED.access_reason,
           changed_at = NOW(),
           changed_by = EXCLUDED.changed_by,
           restore_date = EXCLUDED.restore_date`,
        [userId, accessLevel, reason, adminId || null, suspensionEndDate]
      );

      await client.query('COMMIT');

      return NextResponse.json(
        { 
          message: `User ${actionType} recorded successfully`,
          moderation: modResult.rows[0]
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json(
      { message: 'Error recording moderation action' },
      { status: 500 }
    );
  }
}

// GET /api/admin/moderation/actions?userId=123
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { message: 'userId parameter required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        id, user_id, action_type, reason, severity, is_active,
        suspension_end_date, issued_by, issued_at, resolved_at, resolution_notes
       FROM user_moderation
       WHERE user_id = $1
       ORDER BY issued_at DESC`,
      [userId]
    );

    return NextResponse.json({ actions: result.rows });
  } catch (error) {
    console.error('Get moderation actions error:', error);
    return NextResponse.json(
      { message: 'Error fetching moderation actions' },
      { status: 500 }
    );
  }
}
