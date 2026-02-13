import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

const MAX_LIMIT = 5000;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('q') || '').trim();
    const role = searchParams.get('role') || '';
    const plan = searchParams.get('plan') || '';
    const userType = searchParams.get('userType') || '';
    const verified = searchParams.get('verified');
    const accessLevel = searchParams.get('accessLevel') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const customFilters = searchParams.get('customFilters') || '';

    const limitParam = parseInt(searchParams.get('limit') || '1000');
    const limit = Math.min(Math.max(limitParam, 1), MAX_LIMIT);

    console.log('[REPORT] Query params:', { query, role, plan, userType, verified, accessLevel, status, dateFrom, dateTo, customFilters });

    const params: any[] = [];
    const whereParts: string[] = ['u.deleted_at IS NULL'];

    if (query) {
      whereParts.push(`(
        LOWER(u.email) ILIKE $${params.length + 1}
        OR LOWER(u.first_name) ILIKE $${params.length + 1}
        OR LOWER(u.last_name) ILIKE $${params.length + 1}
        OR LOWER(u.address_city) ILIKE $${params.length + 1}
        OR LOWER(u.address_state) ILIKE $${params.length + 1}
        OR LOWER(u.address_country) ILIKE $${params.length + 1}
        OR LOWER(bu.business_name) ILIKE $${params.length + 1}
        OR LOWER(bu.headquarters_city) ILIKE $${params.length + 1}
        OR LOWER(bu.headquarters_state) ILIKE $${params.length + 1}
        OR LOWER(bu.headquarters_country) ILIKE $${params.length + 1}
      )`);
      params.push(`%${query.toLowerCase()}%`);
    }

    if (role) {
      whereParts.push(`LOWER(u.role) = LOWER($${params.length + 1})`);
      params.push(role);
    }

    if (plan) {
      whereParts.push(`u.plan = $${params.length + 1}`);
      params.push(plan);
    }

    if (userType) {
      whereParts.push(`u.user_type = $${params.length + 1}`);
      params.push(userType);
    }

    if (verified === 'true' || verified === 'false') {
      whereParts.push(`(
        CASE
          WHEN u.user_type = 'business'
            THEN (u.user_type_verified OR bu.is_verified OR bu.verification_status = 'approved')
          ELSE u.user_type_verified
        END
      ) = $${params.length + 1}`);
      params.push(verified === 'true');
    }

    if (accessLevel) {
      whereParts.push(`uas.access_level = $${params.length + 1}`);
      params.push(accessLevel);
    }

    if (status === 'active') {
      // Active: not banned, not suspended, has activity within 30 days
      whereParts.push(`
        ums.is_banned IS NOT TRUE
        AND uas.access_level <> 'suspended'
        AND COALESCE(ula.days_inactive, 0) <= 30
        AND ula.last_activity_at IS NOT NULL
      `);
    } else if (status === 'banned') {
      whereParts.push('ums.is_banned = true');
    } else if (status === 'suspended') {
      whereParts.push("uas.access_level = 'suspended'");
    } else if (status === 'warned') {
      whereParts.push('(COALESCE(ums.active_warnings, 0) > 0 OR COALESCE(ums.active_strikes, 0) > 0)');
    } else if (status === 'inactive') {
      whereParts.push('COALESCE(ula.days_inactive, 0) > 30');
    } else if (status === 'never') {
      whereParts.push('ula.last_activity_at IS NULL');
    }

    if (dateFrom) {
      whereParts.push(`u.created_at >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      whereParts.push(`u.created_at <= $${params.length + 1}`);
      params.push(dateTo);
    }

    // Parse custom filters: fieldname:value;fieldname2:value2
    if (customFilters.trim()) {
      const filters = customFilters.split(';').filter(f => f.trim());
      filters.forEach(filterStr => {
        const [fieldName, value] = filterStr.split(':').map(s => s.trim());
        if (fieldName && value) {
          // Allow flexible field names from all joined tables
          // Support both exact matches and partial ILIKE matches
          const fieldPath = fieldName.includes('.') ? fieldName : `u.${fieldName}`;
          whereParts.push(`${fieldPath} ILIKE $${params.length + 1}`);
          params.push(`%${value}%`);
        }
      });
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT
        u.id,
        CASE
          WHEN u.user_type = 'business' AND bu.business_name IS NOT NULL AND bu.business_name <> ''
            THEN bu.business_name
          ELSE CONCAT(u.first_name, ' ', u.last_name)
        END as name,
        u.email,
        u.role,
        u.aviation_role,
        u.plan,
        u.created_at,
        u.user_type,
        u.first_name,
        u.last_name,
        CASE
          WHEN u.user_type = 'business'
            THEN (u.user_type_verified OR bu.is_verified OR bu.verification_status = 'approved')
          ELSE u.user_type_verified
        END as user_type_verified,
        bu.id as business_id,
        bu.business_name,
        bu.cnpj,
        bu.business_email,
        bu.is_verified as business_is_verified,
        bu.verification_status as business_verification_status,
        uas.access_level,
        uas.access_reason,
        ums.active_warnings,
        ums.active_strikes,
        ums.is_banned,
        ula.last_activity_at,
        ula.days_inactive
      FROM users u
      LEFT JOIN business_users bu ON u.id = bu.user_id
      LEFT JOIN user_access_status uas ON u.id = uas.user_id
      LEFT JOIN user_moderation_status ums ON u.id = ums.id
      LEFT JOIN user_last_activity ula ON u.id = ula.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1}`;

    params.push(limit);

    console.log('[REPORT] Final SQL params:', params);
    console.log('[REPORT] WHERE clause:', whereClause);
    console.log('[REPORT] WHERE parts:', whereParts);

    const result = await pool.query(sqlQuery, params);

    return NextResponse.json({
      users: result.rows,
      generatedAt: new Date().toISOString(),
      limit
    });
  } catch (error) {
    console.error('User report error:', error);
    return NextResponse.json(
      { message: 'Error generating user report' },
      { status: 500 }
    );
  }
}
