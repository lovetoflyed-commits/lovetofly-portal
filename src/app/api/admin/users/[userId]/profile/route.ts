import { NextResponse } from 'next/server';
import pool from '@/config/db';

// GET /api/admin/users/[userId]/profile - Get comprehensive user profile with all records
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Combined query to fetch all user data in one roundtrip
    // This eliminates 6 sequential queries down to 1
    const userQuery = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.role, u.aviation_role,
        u.plan, u.cpf, u.birth_date, u.mobile_phone, 
        u.address_street, u.address_number, u.address_complement, u.address_neighborhood,
        u.address_city, u.address_state, u.address_zip, u.address_country,
        u.created_at, u.updated_at,
        uas.access_level, uas.access_reason, uas.changed_at, uas.restore_date,
        ho.id as hangar_owner_id, ho.company_name, ho.cnpj, ho.phone, ho.address, 
        ho.website, ho.description, ho.verification_status, ho.created_at as hangar_created_at
      FROM users u
      LEFT JOIN user_access_status uas ON u.id = uas.user_id
      LEFT JOIN hangar_owners ho ON u.id = ho.user_id
      WHERE u.id = $1
      LIMIT 1`;

    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Fetch moderation records and activity logs in parallel (2 remaining queries)
    const [moderationResult, activityResult, statsResult] = await Promise.all([
      pool.query(
        `SELECT id, action_type, reason, severity, is_active, 
          suspension_end_date, issued_by, issued_at, resolved_at, resolution_notes
        FROM user_moderation WHERE user_id = $1
        ORDER BY issued_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT id, activity_type, description, ip_address, user_agent, metadata, created_at
        FROM user_activity_log WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 100`,
        [userId]
      ),
      pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM user_moderation WHERE user_id = $1 AND is_active = true)::int as active_infractions,
          (SELECT COUNT(*) FROM user_activity_log WHERE user_id = $1)::int as total_activities,
          (SELECT COUNT(*) FROM user_activity_log WHERE user_id = $1 AND activity_type = 'login')::int as login_count,
          (SELECT MAX(created_at) FROM user_activity_log WHERE user_id = $1) as last_activity`,
        [userId]
      )
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        aviation_role: user.aviation_role,
        plan: user.plan,
        cpf: user.cpf,
        birth_date: user.birth_date,
        mobile_phone: user.mobile_phone,
        address_street: user.address_street,
        address_number: user.address_number,
        address_complement: user.address_complement,
        address_neighborhood: user.address_neighborhood,
        address_city: user.address_city,
        address_state: user.address_state,
        address_zip: user.address_zip,
        address_country: user.address_country,
        created_at: user.created_at,
        updated_at: user.updated_at,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ')
      },
      access: user.access_level ? {
        access_level: user.access_level,
        access_reason: user.access_reason,
        changed_at: user.changed_at,
        restore_date: user.restore_date
      } : null,
      moderation: moderationResult.rows,
      activities: activityResult.rows,
      hangarOwner: user.hangar_owner_id ? {
        id: user.hangar_owner_id,
        company_name: user.company_name,
        cnpj: user.cnpj,
        phone: user.phone,
        address: user.address,
        website: user.website,
        description: user.description,
        verification_status: user.verification_status,
        created_at: user.hangar_created_at
      } : null,
      stats: statsResult.rows[0]
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ message: 'Error fetching user profile' }, { status: 500 });
  }
}
