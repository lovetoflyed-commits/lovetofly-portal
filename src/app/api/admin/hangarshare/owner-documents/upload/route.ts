import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { uploadFile } from '@/utils/storage';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('document') as File | null;
    const ownerIdRaw = formData.get('ownerId');
    const documentType = formData.get('documentType') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'Arquivo não fornecido' }, { status: 400 });
    }

    if (!ownerIdRaw || !documentType) {
      return NextResponse.json({ message: 'Dados insuficientes' }, { status: 400 });
    }

    const ownerId = Number(ownerIdRaw);
    if (!ownerId || Number.isNaN(ownerId)) {
      return NextResponse.json({ message: 'Owner inválido' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json({ message: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
    }

    const uploadResult = await uploadFile(file, `owner-documents/${ownerId}`, {
      maxSize,
      allowedTypes,
    });

    const existingDoc = await pool.query(
      `SELECT id FROM owner_documents
       WHERE owner_id = $1
         AND document_type = $2
         AND listing_id IS NULL`,
      [ownerId, documentType]
    );

    let result;
    if (existingDoc.rows.length > 0) {
      result = await pool.query(
        `UPDATE owner_documents
         SET file_path = $1,
             document_name = $2,
             file_size = $3,
             mime_type = $4,
             uploaded_at = NOW(),
             upload_status = 'uploaded',
             verified_by = NULL,
             verified_at = NULL,
             rejection_reason = NULL,
             notes = COALESCE($5, notes)
         WHERE owner_id = $6 AND document_type = $7 AND listing_id IS NULL
         RETURNING id, owner_id, document_type, document_name, file_path, upload_status`,
        [
          uploadResult.url,
          file.name,
          uploadResult.size,
          file.type,
          notes,
          ownerId,
          documentType,
        ]
      );
    } else {
      result = await pool.query(
        `INSERT INTO owner_documents (
          owner_id,
          listing_id,
          document_type,
          document_name,
          file_path,
          file_size,
          mime_type,
          upload_status,
          uploaded_at,
          notes
        )
         VALUES ($1, NULL, $2, $3, $4, $5, $6, 'uploaded', NOW(), $7)
         RETURNING id, owner_id, document_type, document_name, file_path, upload_status`,
        [
          ownerId,
          documentType,
          file.name,
          uploadResult.url,
          uploadResult.size,
          file.type,
          notes,
        ]
      );
    }

    await logAdminAction(
      admin.id,
      'upload',
      'owner_document',
      String(result.rows[0].id),
      { ownerId, documentType },
      request
    );

    return NextResponse.json({ document: result.rows[0] });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error uploading owner document (admin):', err);
    return NextResponse.json({ message: 'Erro ao fazer upload do documento', error: err }, { status: 500 });
  }
}
