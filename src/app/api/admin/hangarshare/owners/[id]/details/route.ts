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
        ho.address_country,
        ho.address_zip,
        ho.address_street,
        ho.address_number,
        ho.address_complement,
        ho.address_neighborhood,
        ho.address_city,
        ho.address_state,
        ho.phone_country_code,
        ho.phone_mobile,
        ho.phone_landline,
        ho.website,
        ho.social_instagram,
        ho.social_facebook,
        ho.social_linkedin,
        ho.social_youtube,
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

    const OWNER_DOC_TYPES = [
      { id: 'cnpj_certificate', label: 'Certificado de CNPJ' },
      { id: 'business_license', label: 'Alvará de Funcionamento' },
      { id: 'insurance', label: 'Seguro da Propriedade' },
      { id: 'property_deed', label: 'Documento de Propriedade' },
      { id: 'id_owner', label: 'Identidade do Proprietário' },
      { id: 'bank_account', label: 'Comprovante Bancário' },
    ];

    if (hasHov && !hasOwnerDocs) {
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
        SELECT id, document_type, document_name, file_path, upload_status,
               ai_check_status, ai_check_notes, reupload_deadline, reupload_reason
        FROM owner_documents
        WHERE owner_id = $1
        ORDER BY uploaded_at DESC
      `, [ownerId]);

      const existingTypes = new Set<string>();
      ownerDocs.rows.forEach((row: any) => {
        if (row.document_type) {
          existingTypes.add(String(row.document_type));
        }
        documents.push({
          id: `owner-doc-${row.id}`,
          label: row.document_type || 'Documento',
          url: row.file_path || '',
          status: row.upload_status || 'pending',
          type: row.document_type,
          name: row.document_name,
          aiStatus: row.ai_check_status,
          aiNotes: row.ai_check_notes,
          reuploadDeadline: row.reupload_deadline,
          reuploadReason: row.reupload_reason
        });
      });

      OWNER_DOC_TYPES.forEach((docType) => {
        if (!existingTypes.has(docType.id)) {
          documents.push({
            id: `owner-doc-missing-${ownerId}-${docType.id}`,
            label: docType.label,
            url: '',
            status: 'missing',
            type: docType.id,
            name: ''
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
