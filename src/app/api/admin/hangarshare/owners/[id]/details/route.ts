import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ownerId = id;

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

    const tableCheck = await pool.query(
      "SELECT to_regclass('public.hangar_owner_verification') AS hov, to_regclass('public.owner_documents') AS od"
    );

    const hasHov = Boolean(tableCheck.rows[0]?.hov);
    const hasOwnerDocs = Boolean(tableCheck.rows[0]?.od);

    let verification: any = null;
    const documents: Array<{ id: string; label: string; url: string; status?: string; type?: string }> = [];

    if (hasHov) {
      const columnsResult = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'hangar_owner_verification'"
      );
      const columns = new Set(columnsResult.rows.map((row: any) => row.column_name));
      const hasKycFields = columns.has('id_document_front_url');

      if (hasKycFields) {
        const verificationResult = await pool.query(`
          SELECT 
            hov.id,
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
            hov.updated_at
          FROM hangar_owner_verification hov
          WHERE hov.owner_id = $1
          ORDER BY hov.created_at DESC
          LIMIT 1
        `, [ownerId]);

        verification = verificationResult.rows[0] || null;

        if (verification) {
          const docMap = [
            { key: 'id_document_front_url', label: 'RG/CNH Frente' },
            { key: 'id_document_back_url', label: 'RG/CNH Verso' },
            { key: 'selfie_url', label: 'Selfie com Documento' },
            { key: 'ownership_document_url', label: 'Comprovante de Propriedade' },
            { key: 'company_registration_url', label: 'Registro da Empresa' },
            { key: 'tax_document_url', label: 'Documento Fiscal' }
          ];

          for (const doc of docMap) {
            const url = verification[doc.key];
            if (url) {
              documents.push({
                id: `${verification.id}-${doc.key}`,
                label: doc.label,
                url,
                status: verification.verification_status
              });
            }
          }
        }
      } else {
        const legacyDocs = await pool.query(`
          SELECT 
            id,
            document_type,
            document_url,
            verification_status,
            created_at
          FROM hangar_owner_verification
          WHERE owner_id = $1
          ORDER BY created_at DESC
        `, [ownerId]);

        legacyDocs.rows.forEach((row: any) => {
          if (row.document_url) {
            documents.push({
              id: String(row.id),
              label: row.document_type || 'Documento',
              url: row.document_url,
              status: row.verification_status,
              type: row.document_type
            });
          }
        });
      }
    }

    if (hasOwnerDocs) {
      const ownerDocs = await pool.query(`
        SELECT id, document_type, file_path, upload_status
        FROM owner_documents
        WHERE owner_id = $1
        ORDER BY uploaded_at DESC
      `, [ownerId]);

      ownerDocs.rows.forEach((row: any) => {
        if (row.file_path) {
          documents.push({
            id: `owner-doc-${row.id}`,
            label: row.document_type || 'Documento',
            url: row.file_path,
            status: row.upload_status,
            type: row.document_type
          });
        }
      });
    }

    return NextResponse.json({
      owner,
      verification,
      documents
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
