// Admin API - Approve or Reject hangar listing
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
  }

  try {
    const { id: listingId } = await params;
    const body = await request.json();
    const { action, reason, notes } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      await pool.query(
        `UPDATE hangar_listings 
         SET approval_status = 'approved',
             approved_by = $1,
             approved_at = NOW(),
             admin_notes = $2,
             status = 'active',
             is_available = true,
             updated_at = NOW()
         WHERE id = $3`,
        [admin.id, notes || '', listingId]
      );
    } else {
      await pool.query(
        `UPDATE hangar_listings 
         SET approval_status = 'rejected',
             approved_by = $1,
             approved_at = NOW(),
             rejection_reason = $2,
             admin_notes = $3,
             status = 'inactive',
             is_available = false,
             updated_at = NOW()
         WHERE id = $4`,
        [admin.id, reason || 'Listing does not meet requirements', notes || '', listingId]
      );
    }

    await logAdminAction(
      admin.id,
      action === 'approve' ? 'approve_listing' : 'reject_listing',
      'hangar_listing',
      listingId,
      { action, reason, notes },
      request
    );

    // Send notification email to owner on approval/rejection
    try {
      const ownerRes = await pool.query(
        `SELECT u.email, u.first_name, u.last_name FROM hangar_listings hl JOIN hangar_owners ho ON hl.owner_id = ho.id JOIN users u ON ho.user_id = u.id WHERE hl.id = $1`,
        [listingId]
      );
      const owner = ownerRes.rows[0];
      if (owner) {
        const ownerName = `${owner.first_name} ${owner.last_name}`;
        const subject = action === 'approve'
          ? 'Seu anúncio de hangar foi aprovado!'
          : 'Seu anúncio de hangar foi rejeitado';
        const html = action === 'approve'
          ? `<p>Olá ${ownerName},<br>Seu anúncio de hangar foi <b>aprovado</b> pela equipe LoveToFly.<br>Agora ele está disponível para reservas.<br><br>Obrigado por confiar na nossa plataforma!</p>`
          : `<p>Olá ${ownerName},<br>Seu anúncio de hangar foi <b>rejeitado</b> pela equipe LoveToFly.<br>Motivo: ${reason || 'Não especificado'}<br><br>Você pode editar e reenviar o anúncio ou entrar em contato para suporte.</p>`;
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
      console.error('Erro ao enviar email de anúncio:', err);
    }

    return NextResponse.json({
      message: `Listing ${action}d successfully`
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { message: 'Error updating listing' },
      { status: 500 }
    );
  }
}
