import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin } from '@/utils/adminAuth';

// GET /api/admin/hangarshare/owner-documents?ownerId=123&status=uploaded
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const status = searchParams.get('status');

    const filters: string[] = [];
    const values: Array<string | number> = [];

    if (ownerId) {
      values.push(Number(ownerId));
      filters.push(`od.owner_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      filters.push(`od.upload_status = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT 
        od.id,
        od.owner_id,
        od.listing_id,
        od.document_type,
        od.document_name,
        od.file_path,
        od.file_size,
        od.mime_type,
        od.upload_status,
        od.uploaded_at,
        od.verified_by,
        od.verified_at,
        od.rejection_reason,
        od.expires_at,
        od.notes,
        ho.company_name,
        ho.user_id,
        u.email,
        u.first_name,
        u.last_name
      FROM owner_documents od
      JOIN hangar_owners ho ON ho.id = od.owner_id
      LEFT JOIN users u ON u.id = ho.user_id
      ${whereClause}
      ORDER BY od.uploaded_at DESC`,
      values
    );

    return NextResponse.json({ documents: result.rows });
  } catch (error) {
    console.error('Error fetching owner documents:', error);
    return NextResponse.json(
      { message: 'Error fetching owner documents' },
      { status: 500 }
    );
  }
}
