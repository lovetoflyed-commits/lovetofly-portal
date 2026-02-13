import { NextResponse } from 'next/server';
import pool from '@/config/db';

// GET /api/admin/users/[userId]/profile - Get comprehensive user profile with all records
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Combined query to fetch all user data including business profile
    const userQuery = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.role, u.aviation_role,
        u.plan, u.cpf, u.birth_date, u.mobile_phone, 
        u.address_street, u.address_number, u.address_complement, u.address_neighborhood,
        u.address_city, u.address_state, u.address_zip, u.address_country,
        u.created_at, u.updated_at, u.user_type, u.user_type_verified, u.cnpj as user_cnpj,
        u.badges, u.licencas, u.habilitacoes, u.curso_atual, u.is_hangar_owner,
        uas.access_level, uas.access_reason, uas.changed_at, uas.restore_date,
        ho.id as hangar_owner_id, ho.company_name, ho.cnpj, ho.phone, ho.address, 
        ho.website, ho.description, ho.verification_status, ho.created_at as hangar_created_at,
        bu.id as business_user_id, bu.legal_name, bu.business_name, bu.business_type,
        bu.business_phone, bu.business_email, bu.website as business_website,
        bu.representative_name, bu.representative_title,
        bu.headquarters_street, bu.headquarters_number, bu.headquarters_complement,
        bu.headquarters_neighborhood, bu.headquarters_city, bu.headquarters_state,
        bu.headquarters_zip, bu.headquarters_country, bu.company_size, bu.industry,
        bu.description as business_description, bu.established_year, bu.annual_hiring_volume,
        bu.primary_operations, bu.hiring_status, bu.operation_status,
        bu.faa_certificate_number, bu.insurance_verified, bu.safety_record_public,
        bu.verification_status as business_verification_status, bu.verification_notes,
        bu.verification_date, bu.is_verified as business_is_verified,
        bu.created_at as business_created_at, bu.updated_at as business_updated_at
      FROM users u
      LEFT JOIN user_access_status uas ON u.id = uas.user_id
      LEFT JOIN hangar_owners ho ON u.id = ho.user_id
      LEFT JOIN business_users bu ON u.id = bu.user_id
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
        `SELECT id, activity_type, activity_category, description, 
          target_type, target_id, old_value, new_value,
          ip_address, user_agent, status, details, created_at
        FROM user_activity_log WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 200`,
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
        user_type: user.user_type,
        user_type_verified: user.user_type_verified,
        user_cnpj: user.user_cnpj,
        badges: user.badges,
        licencas: user.licencas,
        habilitacoes: user.habilitacoes,
        curso_atual: user.curso_atual,
        is_hangar_owner: user.is_hangar_owner,
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
      businessUser: user.business_user_id ? {
        id: user.business_user_id,
        legal_name: user.legal_name,
        business_name: user.business_name,
        business_type: user.business_type,
        cnpj: user.user_cnpj,
        business_phone: user.business_phone,
        business_email: user.business_email,
        website: user.business_website,
        representative_name: user.representative_name,
        representative_title: user.representative_title,
        headquarters_street: user.headquarters_street,
        headquarters_number: user.headquarters_number,
        headquarters_complement: user.headquarters_complement,
        headquarters_neighborhood: user.headquarters_neighborhood,
        headquarters_city: user.headquarters_city,
        headquarters_state: user.headquarters_state,
        headquarters_zip: user.headquarters_zip,
        headquarters_country: user.headquarters_country,
        company_size: user.company_size,
        industry: user.industry,
        description: user.business_description,
        established_year: user.established_year,
        annual_hiring_volume: user.annual_hiring_volume,
        primary_operations: user.primary_operations,
        hiring_status: user.hiring_status,
        operation_status: user.operation_status,
        faa_certificate_number: user.faa_certificate_number,
        insurance_verified: user.insurance_verified,
        safety_record_public: user.safety_record_public,
        verification_status: user.business_verification_status,
        verification_notes: user.verification_notes,
        verification_date: user.verification_date,
        is_verified: user.business_is_verified,
        created_at: user.business_created_at,
        updated_at: user.business_updated_at
      } : null,
      stats: statsResult.rows[0]
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ message: 'Error fetching user profile' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[userId]/profile - Update user profile and hangar owner info
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const userUpdates = body?.user ?? {};
    const hangarUpdates = body?.hangarOwner ?? null;
    const businessUpdates = body?.businessUser ?? null;

    const userFields = new Set([
      'first_name',
      'last_name',
      'email',
      'cpf',
      'mobile_phone',
      'birth_date',
      'aviation_role',
      'role',
      'plan',
      'user_type',
      'user_type_verified',
      'address_street',
      'address_number',
      'address_complement',
      'address_neighborhood',
      'address_city',
      'address_state',
      'address_zip',
      'address_country'
    ]);

    const hangarFields = new Set([
      'company_name',
      'cnpj',
      'phone',
      'address',
      'website',
      'description',
      'verification_status'
    ]);

    const businessFields = new Set([
      'legal_name',
      'business_name',
      'business_type',
      'cnpj',
      'business_phone',
      'business_email',
      'website',
      'representative_name',
      'representative_title',
      'headquarters_street',
      'headquarters_number',
      'headquarters_complement',
      'headquarters_neighborhood',
      'headquarters_city',
      'headquarters_state',
      'headquarters_zip',
      'headquarters_country',
      'company_size',
      'industry',
      'description',
      'established_year',
      'annual_hiring_volume',
      'primary_operations',
      'hiring_status',
      'operation_status',
      'faa_certificate_number',
      'insurance_verified',
      'safety_record_public',
      'verification_status',
      'verification_notes',
      'is_verified'
    ]);

    const userUpdatesSql: string[] = [];
    const userValues: any[] = [];
    let userParam = 1;

    Object.entries(userUpdates).forEach(([key, value]) => {
      if (!userFields.has(key)) return;
      userUpdatesSql.push(`${key} = $${userParam}`);
      userValues.push(value);
      userParam++;
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let updatedUser = null;
      const derivedUserUpdates: Record<string, any> = {};

      if (businessUpdates && (Object.prototype.hasOwnProperty.call(businessUpdates, 'verification_status') || Object.prototype.hasOwnProperty.call(businessUpdates, 'is_verified'))) {
        const approved = businessUpdates.verification_status === 'approved';
        const isVerified = businessUpdates.is_verified === true;
        derivedUserUpdates.user_type = 'business';
        derivedUserUpdates.user_type_verified = approved || isVerified;
      }

      Object.entries(derivedUserUpdates).forEach(([key, value]) => {
        if (!userFields.has(key)) return;
        if (userUpdatesSql.some((entry) => entry.startsWith(`${key} = `))) return;
        userUpdatesSql.push(`${key} = $${userParam}`);
        userValues.push(value);
        userParam++;
      });

      if (userUpdatesSql.length > 0) {
        userUpdatesSql.push('updated_at = NOW()');
        userValues.push(userId);
        const userQuery = `
          UPDATE users
          SET ${userUpdatesSql.join(', ')}
          WHERE id = $${userParam}
          RETURNING id, first_name, last_name, email, role, aviation_role,
            plan, cpf, birth_date, mobile_phone, address_street, address_number,
            address_complement, address_neighborhood, address_city, address_state,
            address_zip, address_country, user_type, user_type_verified, cnpj,
            is_hangar_owner, badges, licencas, habilitacoes, curso_atual,
            created_at, updated_at
        `;
        const result = await client.query(userQuery, userValues);
        updatedUser = result.rows[0] || null;
      }

      let updatedHangar = null;
      if (hangarUpdates) {
        const hangarSql: string[] = [];
        const hangarValues: any[] = [];
        let hangarParam = 1;

        Object.entries(hangarUpdates).forEach(([key, value]) => {
          if (!hangarFields.has(key)) return;
          hangarSql.push(`${key} = $${hangarParam}`);
          hangarValues.push(value);
          hangarParam++;
        });

        if (hangarSql.length > 0) {
          hangarSql.push('updated_at = NOW()');
          hangarValues.push(userId);
          const hangarQuery = `
            UPDATE hangar_owners
            SET ${hangarSql.join(', ')}
            WHERE user_id = $${hangarParam}
            RETURNING id, company_name, cnpj, phone, address, website, description, verification_status, created_at, updated_at
          `;
          const result = await client.query(hangarQuery, hangarValues);
          updatedHangar = result.rows[0] || null;
        }
      }

      let updatedBusiness = null;
      if (businessUpdates) {
        const businessSql: string[] = [];
        const businessValues: any[] = [];
        let businessParam = 1;

        Object.entries(businessUpdates).forEach(([key, value]) => {
          if (!businessFields.has(key)) return;
          businessSql.push(`${key} = $${businessParam}`);
          businessValues.push(value);
          businessParam++;
        });

        if (businessSql.length > 0) {
          businessSql.push('updated_at = NOW()');
          businessValues.push(userId);
          const businessQuery = `
            UPDATE business_users
            SET ${businessSql.join(', ')}
            WHERE user_id = $${businessParam}
            RETURNING id, legal_name, business_name, business_type, cnpj, business_phone, business_email,
              website, representative_name, representative_title, headquarters_street, headquarters_number,
              headquarters_complement, headquarters_neighborhood, headquarters_city, headquarters_state,
              headquarters_zip, headquarters_country, company_size, industry, description, established_year,
              annual_hiring_volume, primary_operations, hiring_status, operation_status,
              faa_certificate_number, insurance_verified, safety_record_public,
              verification_status, verification_notes, verification_date, is_verified,
              created_at, updated_at
          `;
          const result = await client.query(businessQuery, businessValues);
          updatedBusiness = result.rows[0] || null;
        }
      }

      if (!updatedUser && !updatedHangar && !updatedBusiness) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
      }

      if (updatedUser) {
        await client.query(
          `INSERT INTO user_activity_log
            (user_id, activity_type, activity_category, description, details, target_type, target_id, new_value, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'success')`,
          [
            userId,
            'admin_user_update',
            'admin',
            'Admin updated user profile fields',
            JSON.stringify({ userUpdates, derivedUserUpdates }),
            'user',
            userId,
            JSON.stringify(updatedUser)
          ]
        );
      }

      if (updatedHangar) {
        await client.query(
          `INSERT INTO user_activity_log
            (user_id, activity_type, activity_category, description, details, target_type, target_id, new_value, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'success')`,
          [
            userId,
            'admin_hangar_update',
            'admin',
            'Admin updated hangar owner profile',
            JSON.stringify({ hangarUpdates }),
            'hangar_owner',
            updatedHangar.id,
            JSON.stringify(updatedHangar)
          ]
        );
      }

      if (updatedBusiness) {
        await client.query(
          `INSERT INTO user_activity_log
            (user_id, activity_type, activity_category, description, details, target_type, target_id, new_value, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'success')`,
          [
            userId,
            'admin_business_update',
            'admin',
            'Admin updated business profile',
            JSON.stringify({ businessUpdates }),
            'business_user',
            updatedBusiness.id,
            JSON.stringify(updatedBusiness)
          ]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: updatedUser
          ? {
              ...updatedUser,
              name: [updatedUser.first_name, updatedUser.last_name].filter(Boolean).join(' ')
            }
          : null,
        hangarOwner: updatedHangar,
        businessUser: updatedBusiness
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ message: 'Error updating user profile' }, { status: 500 });
  }
}
