import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
  }

  try {
    const { documentId } = await params;
    const body = await request.json().catch(() => ({}));
    const notes = typeof body?.notes === 'string' ? body.notes : null;

    const result = await pool.query(
      `UPDATE owner_documents
       SET upload_status = 'verified',
           verified_by = $1,
           verified_at = NOW(),
           rejection_reason = NULL,
           notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING id, owner_id, document_type, upload_status`,
      [admin.id, notes, Number(documentId)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    const doc = result.rows[0];
    const ownerRes = await pool.query(
      `SELECT ho.user_id, ho.company_name
       FROM hangar_owners ho
       WHERE ho.id = $1`,
      [doc.owner_id]
    );

    const owner = ownerRes.rows[0];
    if (owner?.user_id) {
      await pool.query(
        `INSERT INTO user_notifications(
           user_id, type, title, message, priority, action_url, action_label, metadata, expires_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '30 days')`,
        [
          owner.user_id,
          'owner_document_status',
          'Documento aprovado',
          `Seu documento (${doc.document_type}) foi aprovado.`,
          'normal',
          '/hangarshare/owner/documents',
          'Ver detalhes',
          JSON.stringify({ documentId: doc.id, status: doc.upload_status }),
        ]
      );
    }

    await logAdminAction(
      admin.id,
      'approve',
      'owner_document',
      String(documentId),
      { notes },
      request
    );

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Error approving owner document:', error);
    return NextResponse.json(
      { message: 'Error approving owner document' },
      { status: 500 }
    );
  }
}
