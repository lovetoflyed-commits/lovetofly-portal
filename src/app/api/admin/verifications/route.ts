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

    // Get pending verifications with user and owner data
    const result = await pool.query(
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
        hov.verification_status,
        hov.rejection_reason,
        hov.admin_notes,
        hov.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.cpf,
        ho.company_name,
        ho.cnpj
      FROM hangar_owner_verification hov
      JOIN hangar_owners ho ON hov.owner_id = ho.id
      JOIN users u ON ho.user_id = u.id
      WHERE hov.verification_status = $1
      ORDER BY hov.created_at ASC
      LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    console.log('[Verifications API] Found', result.rows.length, 'verifications');

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM hangar_owner_verification WHERE verification_status = $1',
      [status]
    );

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
