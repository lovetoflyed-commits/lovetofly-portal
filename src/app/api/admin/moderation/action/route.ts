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

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const logActivitySafe = async (
        subjectUserId: number,
        activityType: string,
        description: string,
        details: object,
        targetId: number
      ) => {
        await client.query('SAVEPOINT activity_log');
        try {
          await client.query(
            `INSERT INTO user_activity_log
              (user_id, activity_type, activity_category, description, details, target_type, target_id, status, ip_address, user_agent)
             VALUES ($1, $2, 'admin', $3, $4, 'user', $5, 'success', $6, $7)`,
            [
              subjectUserId,
              activityType,
              description,
              JSON.stringify(details),
              targetId,
              ipAddress,
              userAgent
            ]
          );
        } catch (activityError) {
          await client.query('ROLLBACK TO SAVEPOINT activity_log');
          console.error('Failed to log moderation activity:', activityError);
        } finally {
          await client.query('RELEASE SAVEPOINT activity_log');
        }
      };

      // Handle restore action
      if (actionType === 'restore') {
        // Mark previous moderation as inactive
        await client.query(
          `UPDATE user_moderation SET is_active = false WHERE user_id = $1 AND is_active = true`,
          [userId]
        );

        // Create restore record in user_moderation table
        const modResult = await client.query(
          `INSERT INTO user_moderation 
            (user_id, action_type, reason, severity, suspension_end_date, issued_by, is_active)
           VALUES ($1, $2, $3, $4, NULL, $5, true)
           RETURNING id, user_id, action_type, issued_at`,
          [userId, 'restore', reason, severity, adminId || null]
        );

        // Restore user to active status
        await client.query(
          `INSERT INTO user_access_status (user_id, access_level, access_reason, changed_by, restore_date)
           VALUES ($1, 'active', $2, $3, NULL)
           ON CONFLICT (user_id) DO UPDATE SET 
             access_level = 'active',
             access_reason = EXCLUDED.access_reason,
             restore_date = NULL,
             changed_at = NOW(),
             changed_by = EXCLUDED.changed_by`,
          [userId, reason, adminId || null]
        );

        // user_moderation_status is a view and will automatically reflect the state

        const restoreDetails = {
          actionType,
          reason,
          severity,
          suspensionDays: null,
          suspensionEndDate: null,
          adminId: adminId || null
        };

        await logActivitySafe(
          Number(userId),
          'admin_moderation_restore',
          'Admin restaurou o acesso do usuario',
          restoreDetails,
          Number(userId)
        );

        if (adminId && Number(adminId) !== Number(userId)) {
          await logActivitySafe(
            Number(adminId),
            'admin_moderation_restore',
            'Admin restaurou o acesso de um usuario',
            { ...restoreDetails, targetUserId: userId },
            Number(userId)
          );
        }

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

      // user_moderation_status is a view and will automatically reflect the counts

      const moderationDetails = {
        actionType,
        reason,
        severity,
        suspensionDays: suspensionDays || null,
        suspensionEndDate,
        adminId: adminId || null
      };

      await logActivitySafe(
        Number(userId),
        `admin_moderation_${actionType}`,
        `Admin aplicou moderacao: ${actionType}`,
        moderationDetails,
        Number(userId)
      );

      if (adminId && Number(adminId) !== Number(userId)) {
        await logActivitySafe(
          Number(adminId),
          `admin_moderation_${actionType}`,
          `Admin aplicou moderacao: ${actionType}`,
          { ...moderationDetails, targetUserId: userId },
          Number(userId)
        );
      }

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
