import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendReuploadEmail(
  email: string,
  subject: string,
  htmlContent: string,
  userId: number
): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set; email skipped');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Love to Fly Portal <noreply@lovetofly.com.br>',
        to: email,
        subject,
        html: htmlContent,
      }),
    });

    const success = response.ok;

    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO email_logs(user_id, email, subject, type, status, sent_at, created_at, updated_at)
         VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [userId, email, subject, 'owner_document_reupload', success ? 'sent' : 'failed', success ? new Date() : null]
      );
    } finally {
      client.release();
    }

    return success;
  } catch (error) {
    console.error('Error sending reupload email:', error);
    return false;
  }
}

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
    const deadlineDays = Number(body?.deadlineDays ?? 7);
    const notifyEmail = body?.notifyEmail === undefined ? true : Boolean(body.notifyEmail);
    const notifyDashboard = body?.notifyDashboard === undefined ? true : Boolean(body.notifyDashboard);

    const missingMatch = /^missing-(\d+)-(.+)$/.exec(String(documentId));
    const missingOwnerId = missingMatch ? Number(missingMatch[1]) : null;
    const missingType = missingMatch ? missingMatch[2] : null;

    if (!reason) {
      return NextResponse.json({ message: 'Reupload reason is required' }, { status: 400 });
    }

    let updateResult;

    if (missingOwnerId && missingType) {
      updateResult = await pool.query(
        `INSERT INTO owner_documents (
          owner_id,
          document_type,
          document_name,
          file_path,
          upload_status,
          uploaded_at,
          reupload_reason,
          reupload_requested_at,
          reupload_deadline
        ) VALUES ($1, $2, $3, $4, 'reupload_requested', NOW(), $5, NOW(), NOW() + ($6 || ' days')::interval)
        RETURNING id, owner_id, document_type, document_name, upload_status, reupload_deadline`,
        [
          missingOwnerId,
          missingType,
          `PENDENTE-${missingType}`,
          '',
          reason,
          Math.max(deadlineDays, 1),
        ]
      );
    } else {
      updateResult = await pool.query(
        `UPDATE owner_documents
         SET upload_status = 'reupload_requested',
             reupload_reason = $1,
             reupload_requested_at = NOW(),
             reupload_deadline = NOW() + ($2 || ' days')::interval,
             verified_by = NULL,
             verified_at = NULL
         WHERE id = $3
         RETURNING id, owner_id, document_type, document_name, upload_status, reupload_deadline`,
        [reason, Math.max(deadlineDays, 1), Number(documentId)]
      );
    }

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    const doc = updateResult.rows[0];
    const ownerRes = await pool.query(
      `SELECT ho.user_id, ho.company_name, u.email, u.first_name
       FROM hangar_owners ho
       LEFT JOIN users u ON u.id = ho.user_id
       WHERE ho.id = $1`,
      [doc.owner_id]
    );

    const owner = ownerRes.rows[0];

    if (owner?.user_id && notifyDashboard) {
      await pool.query(
        `INSERT INTO user_notifications(
           user_id, type, title, message, priority, action_url, action_label, metadata, expires_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '30 days')`,
        [
          owner.user_id,
          'owner_document_reupload',
          'Reenvio de documento solicitado',
          `Precisamos de um novo documento (${doc.document_type}). Motivo: ${reason}. Prazo: ${new Date(doc.reupload_deadline).toLocaleDateString('pt-BR')}.`,
          'high',
          '/hangarshare/owner/documents',
          'Enviar documento',
          JSON.stringify({
            documentId: doc.id,
            documentType: doc.document_type,
            deadline: doc.reupload_deadline,
            reason,
          }),
        ]
      );
    }

    if (owner?.user_id && owner?.email && notifyEmail) {
      const ownerName = owner.first_name || owner.company_name || 'proprietário';
      const deadlineText = new Date(doc.reupload_deadline).toLocaleDateString('pt-BR');
      const subject = 'Reenvio de documento solicitado - HangarShare';
      const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #111;">
  <h2>Solicitação de reenvio de documento</h2>
  <p>Olá, ${ownerName}!</p>
  <p>Precisamos que você reenvie o documento <strong>${doc.document_type}</strong>.</p>
  <p><strong>Motivo:</strong> ${reason}</p>
  <p><strong>Prazo:</strong> ${deadlineText}</p>
  <p>Acesse seu painel para enviar o arquivo:</p>
  <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://lovetofly.com.br'}/hangarshare/owner/documents">Enviar documento</a></p>
  <p>Se precisar de ajuda, fale com nosso suporte.</p>
</body>
</html>
      `;
      await sendReuploadEmail(owner.email, subject, htmlContent, owner.user_id);
    }

    await logAdminAction(
      admin.id,
      'request_reupload',
      'owner_document',
      String(documentId),
      { reason, deadlineDays, notifyEmail, notifyDashboard },
      request
    );

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Error requesting reupload:', error);
    return NextResponse.json(
      { message: 'Error requesting reupload' },
      { status: 500 }
    );
  }
}
