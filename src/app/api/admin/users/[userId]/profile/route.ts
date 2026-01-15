import { NextResponse } from 'next/server';
import pool from '@/config/db';

// GET /api/admin/users/[userId]/profile - Get comprehensive user profile with all records
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get user basic info
    const userResult = await pool.query(
      `SELECT 
        id, first_name, last_name, email, role, aviation_role, is_hangar_owner,
        plan, cpf, birth_date, mobile_phone, 
        address_street, address_number, address_complement, address_neighborhood,
        address_city, address_state, address_zip, address_country,
        created_at, updated_at
      FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get access status
    const accessResult = await pool.query(
      `SELECT access_level, access_reason, changed_at, restore_date
      FROM user_access_status WHERE user_id = $1`,
      [userId]
    );

    // Get moderation records (warnings, strikes, suspensions, bans)
    const moderationResult = await pool.query(
      `SELECT id, action_type, reason, severity, is_active, 
        suspension_end_date, issued_by, issued_at, resolved_at, resolution_notes
      FROM user_moderation WHERE user_id = $1
      ORDER BY issued_at DESC`,
      [userId]
    );

    // Get activity logs
    const activityResult = await pool.query(
      `SELECT id, activity_type, description, ip_address, user_agent, metadata, created_at
      FROM user_activity_log WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100`,
      [userId]
    );

    // Get hangar owner info if applicable
    let hangarOwnerResult = null;
    if (user.is_hangar_owner) {
      hangarOwnerResult = await pool.query(
        `SELECT id, company_name, cnpj, phone, address, website, description, verification_status, created_at
        FROM hangar_owners WHERE user_id = $1`,
        [userId]
      );
    }

    // Get summary stats
    const statsResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM user_moderation WHERE user_id = $1 AND is_active = true) as active_infractions,
        (SELECT COUNT(*) FROM user_activity_log WHERE user_id = $1) as total_activities,
        (SELECT COUNT(*) FROM user_activity_log WHERE user_id = $1 AND activity_type = 'login') as login_count,
        (SELECT MAX(created_at) FROM user_activity_log WHERE user_id = $1) as last_activity
      `,
      [userId]
    );

    return NextResponse.json({
      user: {
        ...user,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ')
      },
      access: accessResult.rows[0] || null,
      moderation: moderationResult.rows,
      activities: activityResult.rows,
      hangarOwner: hangarOwnerResult?.rows[0] || null,
      stats: statsResult.rows[0]
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ message: 'Error fetching user profile' }, { status: 500 });
  }
}
