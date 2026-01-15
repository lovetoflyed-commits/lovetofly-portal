// Admin API - Approve or Reject verification
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authorization
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
  }

  try {
    const { id: verificationId } = await params;
    const body = await request.json();
    const { action, reason, notes } = body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get verification details (owner + user)
    const verification = await pool.query(
      `SELECT hov.id, hov.owner_id, ho.user_id
       FROM hangar_owner_verification hov
       JOIN hangar_owners ho ON ho.id = hov.owner_id
       WHERE hov.id = $1`,
      [verificationId]
    );

    if (verification.rows.length === 0) {
      return NextResponse.json(
        { message: 'Verification not found' },
        { status: 404 }
      );
    }

    const { owner_id: ownerId, user_id: userId } = verification.rows[0];

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (action === 'approve') {
        // Update verification status
        await client.query(
          `UPDATE hangar_owner_verification 
           SET verification_status = 'approved',
               reviewed_by = $1,
               reviewed_at = NOW(),
               admin_notes = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [admin.id, notes || '', verificationId]
        );

        // Update hangar_owners verification status
        await client.query(
          `UPDATE hangar_owners 
           SET verification_status = 'approved', 
               updated_at = NOW()
           WHERE user_id = $1`,
          [userId]
        );

        // Auto-approve any pending listings from this owner (if hangar_listings table exists)
        try {
          await client.query(
            `UPDATE hangar_listings 
             SET approval_status = 'approved',
                 approved_by = $1,
                 approved_at = NOW(),
                 status = 'active'
             WHERE owner_id IN (SELECT id FROM hangar_owners WHERE user_id = $2)
             AND approval_status = 'pending'`,
            [admin.id, userId]
          );
        } catch (err) {
          // hangar_listings table may not exist yet, skip silently
          console.warn('Skipping hangar_listings auto-approval (table may not exist):', (err as Error).message);
        }
      } else {
        // Reject verification
        await client.query(
          `UPDATE hangar_owner_verification 
           SET verification_status = 'rejected',
               reviewed_by = $1,
               reviewed_at = NOW(),
               rejection_reason = $2,
               admin_notes = $3,
               updated_at = NOW()
           WHERE id = $4`,
          [admin.id, reason || 'Verification failed', notes || '', verificationId]
        );

        // Update hangar_owners
        await client.query(
          `UPDATE hangar_owners 
           SET verification_status = 'rejected', 
               updated_at = NOW()
           WHERE user_id = $1`,
          [userId]
        );
      }

      await client.query('COMMIT');

      // Log admin action
      await logAdminAction(
        admin.id,
        action === 'approve' ? 'approve_verification' : 'reject_verification',
        'hangar_owner_verification',
        verificationId,
        { action, reason, notes },
        request
      );

      // Send notification email to owner on approval/rejection
      try {
        const ownerRes = await pool.query(
          'SELECT u.email, u.first_name, u.last_name FROM users u WHERE u.id = $1',
          [userId]
        );
        const owner = ownerRes.rows[0];
        if (owner) {
          const ownerName = `${owner.first_name} ${owner.last_name}`;
          const subject = action === 'approve'
            ? 'Sua verificação foi aprovada!'
            : 'Sua verificação foi rejeitada';
          const html = action === 'approve'
            ? `<p>Olá ${ownerName},<br>Sua verificação de documentos foi <b>aprovada</b> pela equipe LoveToFly.<br>Agora você pode publicar anúncios de hangar e receber reservas.<br><br>Obrigado por confiar na nossa plataforma!</p>`
            : `<p>Olá ${ownerName},<br>Sua verificação de documentos foi <b>rejeitada</b> pela equipe LoveToFly.<br>Motivo: ${reason || 'Não especificado'}<br><br>Você pode reenviar documentos ou entrar em contato para suporte.</p>`;
          const resend = await import('resend');
          const client = new resend.Resend(process.env.RESEND_API_KEY);
          await client.emails.send({
            from: 'LoveToFly Portal <suporte@lovetofly.com.br>',
            to: [owner.email],
            subject,
            html,
          });
        }
      } catch (err) {
        console.error('Erro ao enviar email de verificação:', err);
      }
      return NextResponse.json({
        message: `Verification ${action}d successfully`,
        status: action === 'approve' ? 'approved' : 'rejected'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { message: 'Error updating verification' },
      { status: 500 }
    );
  }
}
