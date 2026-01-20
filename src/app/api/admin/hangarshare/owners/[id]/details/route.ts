import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ownerId = params.id;

    // Fetch owner details with user info
    const ownerResult = await pool.query(`
      SELECT 
        ho.id,
        ho.user_id,
        ho.company_name,
        ho.cnpj,
        ho.phone,
        ho.address,
        ho.website,
        ho.description,
        ho.owner_type,
        ho.cpf,
        ho.pix_key,
        ho.pix_key_type,
        ho.is_verified,
        ho.verification_status,
        ho.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM hangar_owners ho
      LEFT JOIN users u ON u.id = ho.user_id
      WHERE ho.id = $1
    `, [ownerId]);

    if (ownerResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Owner not found' },
        { status: 404 }
      );
    }

    const owner = ownerResult.rows[0];

    // Fetch documents for this owner
    const docsResult = await pool.query(`
      SELECT 
        id,
        document_type,
        document_name,
        file_path,
        file_size,
        mime_type,
        upload_status,
        uploaded_at,
        verified_at,
        rejection_reason
      FROM owner_documents
      WHERE owner_id = $1
      ORDER BY uploaded_at DESC
    `, [ownerId]);

    return NextResponse.json({
      owner,
      documents: docsResult.rows,
      documentCount: docsResult.rows.length,
      pendingDocuments: docsResult.rows.filter((d: any) => d.upload_status === 'pending').length,
      verifiedDocuments: docsResult.rows.filter((d: any) => d.upload_status === 'verified').length,
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error fetching owner details:', err);
    return NextResponse.json(
      { message: 'Error fetching owner details', error: err },
      { status: 500 }
    );
  }
}
