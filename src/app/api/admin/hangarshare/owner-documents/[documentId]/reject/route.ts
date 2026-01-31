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
    const reason = typeof body?.reason === 'string' ? body.reason : null;
    const notes = typeof body?.notes === 'string' ? body.notes : null;

    if (!reason) {
      return NextResponse.json(
        { message: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE owner_documents
       SET upload_status = 'rejected',
           verified_by = $1,
           verified_at = NOW(),
           rejection_reason = $2,
           notes = COALESCE($3, notes)
       WHERE id = $4
       RETURNING id, owner_id, document_type, upload_status`,
      [admin.id, reason, notes, Number(documentId)]
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
          'Documento rejeitado',
          `Seu documento (${doc.document_type}) foi rejeitado. Motivo: ${reason}.`,
          'high',
          '/hangarshare/owner/documents',
          'Enviar novo documento',
          JSON.stringify({ documentId: doc.id, status: doc.upload_status, reason }),
        ]
      );
    }

    await logAdminAction(
      admin.id,
      'reject',
      'owner_document',
      String(documentId),
      { reason, notes },
      request
    );

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Error rejecting owner document:', error);
    return NextResponse.json(
      { message: 'Error rejecting owner document' },
      { status: 500 }
    );
  }
}
