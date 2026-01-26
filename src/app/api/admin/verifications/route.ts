// Admin API - Get pending verifications
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

export async function GET(request: NextRequest) {
  // Check admin authorization
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('[Verifications API] Fetching verifications with status:', status);

    const tableCheck = await pool.query(
      "SELECT to_regclass('public.hangar_owner_verification') AS hov"
    );

    const hasHov = Boolean(tableCheck.rows[0]?.hov);
    let result;
    let countResult;

    if (!hasHov) {
      result = await pool.query(
        `SELECT 
          NULL::integer AS id,
          ho.user_id,
          NULL::varchar AS id_document_type,
          NULL::varchar AS id_document_number,
          NULL::text AS id_document_front_url,
          NULL::text AS id_document_back_url,
          NULL::text AS selfie_url,
          NULL::varchar AS ownership_proof_type,
          NULL::text AS ownership_document_url,
          NULL::text AS company_registration_url,
          NULL::text AS tax_document_url,
          ho.verification_status,
          NULL::text AS rejection_reason,
          NULL::text AS admin_notes,
          ho.created_at,
          u.first_name,
          u.last_name,
          u.email,
          u.cpf,
          ho.company_name,
          ho.cnpj
        FROM hangar_owners ho
        JOIN users u ON ho.user_id = u.id
        WHERE ho.verification_status = $1
        ORDER BY ho.created_at ASC
        LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      );

      countResult = await pool.query(
        'SELECT COUNT(*) FROM hangar_owners WHERE verification_status = $1',
        [status]
      );
    } else {
      const columnsResult = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'hangar_owner_verification'"
      );
      const columns = new Set(columnsResult.rows.map((row: any) => row.column_name));
      const hasKycFields = columns.has('id_document_front_url');

      if (hasKycFields) {
        result = await pool.query(
          `SELECT 
            hov.id,
            ho.user_id,
            hov.id_document_type,
            hov.id_document_number,
            hov.id_document_front_url,
            hov.id_document_back_url,
            hov.selfie_url,
            hov.ownership_proof_type,
            hov.ownership_document_url,
            hov.company_registration_url,
            hov.tax_document_url,
            COALESCE(NULLIF(ho.verification_status, 'pending'), hov.verification_status, ho.verification_status) AS verification_status,
            hov.rejection_reason,
            hov.admin_notes,
            COALESCE(hov.created_at, ho.created_at) AS created_at,
            u.first_name,
            u.last_name,
            u.email,
            u.cpf,
            ho.company_name,
            ho.cnpj
          FROM hangar_owners ho
          JOIN users u ON ho.user_id = u.id
          LEFT JOIN LATERAL (
            SELECT * FROM hangar_owner_verification
            WHERE owner_id = ho.id
            ORDER BY created_at DESC
            LIMIT 1
          ) hov ON true
          WHERE COALESCE(NULLIF(ho.verification_status, 'pending'), hov.verification_status, ho.verification_status) = $1
          AND ($1 <> 'pending' OR hov.id IS NOT NULL)
          ORDER BY COALESCE(hov.created_at, ho.created_at) ASC
          LIMIT $2 OFFSET $3`,
          [status, limit, offset]
        );

        countResult = await pool.query(
          `SELECT COUNT(*)
          FROM hangar_owners ho
          LEFT JOIN LATERAL (
            SELECT id, owner_id, verification_status, created_at
            FROM hangar_owner_verification
            WHERE owner_id = ho.id
            ORDER BY created_at DESC
            LIMIT 1
          ) hov ON true
          WHERE COALESCE(NULLIF(ho.verification_status, 'pending'), hov.verification_status, ho.verification_status) = $1
          AND ($1 <> 'pending' OR hov.id IS NOT NULL)`,
          [status]
        );
      } else {
        result = await pool.query(
          `SELECT 
            hov.id,
            ho.user_id,
            hov.document_type AS id_document_type,
            NULL::varchar AS id_document_number,
            hov.document_url AS id_document_front_url,
            NULL::text AS id_document_back_url,
            NULL::text AS selfie_url,
            hov.document_type AS ownership_proof_type,
            hov.document_url AS ownership_document_url,
            NULL::text AS company_registration_url,
            NULL::text AS tax_document_url,
            COALESCE(NULLIF(ho.verification_status, 'pending'), hov.verification_status, ho.verification_status) AS verification_status,
            NULL::text AS rejection_reason,
            hov.admin_notes,
            COALESCE(hov.created_at, ho.created_at) AS created_at,
            u.first_name,
            u.last_name,
            u.email,
            u.cpf,
            ho.company_name,
            ho.cnpj
          FROM hangar_owners ho
          JOIN users u ON ho.user_id = u.id
          LEFT JOIN LATERAL (
            SELECT id, owner_id, document_type, document_url, verification_status, admin_notes, created_at
            FROM hangar_owner_verification
            WHERE owner_id = ho.id
            ORDER BY created_at DESC
            LIMIT 1
          ) hov ON true
          WHERE COALESCE(NULLIF(ho.verification_status, 'pending'), hov.verification_status, ho.verification_status) = $1
          AND ($1 <> 'pending' OR hov.id IS NOT NULL)
          ORDER BY COALESCE(hov.created_at, ho.created_at) ASC
          LIMIT $2 OFFSET $3`,
          [status, limit, offset]
        );

        countResult = await pool.query(
          `SELECT COUNT(*)
          FROM hangar_owners ho
          LEFT JOIN LATERAL (
            SELECT id, owner_id, verification_status, created_at
            FROM hangar_owner_verification
            WHERE owner_id = ho.id
            ORDER BY created_at DESC
            LIMIT 1
          ) hov ON true
          WHERE COALESCE(NULLIF(ho.verification_status, 'pending'), hov.verification_status, ho.verification_status) = $1
          AND ($1 <> 'pending' OR hov.id IS NOT NULL)`,
          [status]
        );
      }
    }

    console.log('[Verifications API] Found', result.rows.length, 'verifications');

    console.log('[Verifications API] Total count:', countResult.rows[0].count);

    return NextResponse.json({
      verifications: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { message: 'Error fetching verifications' },
      { status: 500 }
    );
  }
}
