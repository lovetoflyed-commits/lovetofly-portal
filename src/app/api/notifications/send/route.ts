import { NextResponse } from 'next/server';
import pool from '@/config/db';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DAYS_UNTIL_DOWNGRADE = 3; // Days before expiry to warn user

async function sendEmailNotification(
  email: string,
  subject: string,
  htmlContent: string,
  userId: number,
  type: string
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

    // Log email attempt
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO email_logs(user_id, email, subject, type, status, sent_at, created_at, updated_at)
         VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [userId, email, subject, type, success ? 'sent' : 'failed', success ? new Date() : null]
      );
    } finally {
      client.release();
    }

    return success;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, email, membership_status, plan_name, days_remaining } = body;

    if (!user_id || !email || !membership_status) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let notificationCreated = false;
      let emailSent = false;

      if (membership_status === 'past_due' && days_remaining !== undefined) {
        // Create in-app notification
        const notification = await client.query(
          `INSERT INTO user_notifications(
             user_id, type, title, message, priority, action_url, action_label, metadata, expires_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '7 days')
           RETURNING id`,
          [
            user_id,
            'membership_past_due',
            'Pagamento de assinatura vencido',
            `Sua assinatura ${plan_name} vence em ${days_remaining} dia(s). Renove agora para manter acesso.`,
            'urgent',
            '/profile?tab=membership',
            'Renovar agora',
            JSON.stringify({
              plan_name,
              days_remaining,
              days_until_downgrade: DAYS_UNTIL_DOWNGRADE,
            }),
          ]
        );
        notificationCreated = (notification.rowCount ?? 0) > 0;

        // Send email notification
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .button { display: inline-block; background: #1e40af; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 15px 0; }
    .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Notificação de Assinatura</h2>
    </div>
    <div class="content">
      <p>Olá,</p>
      
      <div class="alert">
        <strong>⚠️ Sua assinatura ${plan_name} vence em ${days_remaining} dia(s)!</strong>
      </div>

      <p>Para manter acesso contínuo à sua conta e aos recursos premium, por favor renove sua assinatura antes da data de expiração.</p>

      <p><strong>Importante:</strong> Se você não renovar sua assinatura nos próximos ${DAYS_UNTIL_DOWNGRADE} dia(s), sua conta será automaticamente rebaixada para o plano Gratuito, e você perderá acesso aos recursos avançados do HangarShare e outras funcionalidades premium.</p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://lovetofly.com.br'}/profile?tab=membership" class="button">Renovar Assinatura Agora</a>

      <p>Se você tiver dúvidas ou precisar de ajuda, entre em contato com nosso suporte: <strong>support@lovetofly.com.br</strong></p>

      <p>Obrigado por ser parte da comunidade Love to Fly!</p>
    </div>
    <div class="footer">
      <p>© 2026 Love to Fly Portal. Todos os direitos reservados.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://lovetofly.com.br'}/help">Precisa de ajuda?</a> | <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://lovetofly.com.br'}/contact">Contate-nos</a></p>
    </div>
  </div>
</body>
</html>
        `;

        emailSent = await sendEmailNotification(
          email,
          `Ação Urgente: Renove sua Assinatura ${plan_name} - ${days_remaining} dia(s) restantes`,
          htmlContent,
          user_id,
          'membership_past_due'
        );
      } else if (membership_status === 'expired') {
        // Create expired notification
        const notification = await client.query(
          `INSERT INTO user_notifications(
             user_id, type, title, message, priority, action_url, action_label, metadata, expires_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '7 days')
           RETURNING id`,
          [
            user_id,
            'membership_expired',
            'Assinatura expirada - Conta rebaixada',
            `Sua assinatura ${plan_name} expirou. Sua conta foi rebaixada para Gratuito.`,
            'high',
            '/profile?tab=membership',
            'Reativar assinatura',
            JSON.stringify({ plan_name }),
          ]
        );
        notificationCreated = (notification.rowCount ?? 0) > 0;

        // Send expired email
        const expiredHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Sua Assinatura Expirou</h2>
    </div>
    <div class="content">
      <p>Olá,</p>
      
      <div class="alert">
        <strong>❌ Sua assinatura ${plan_name} expirou e sua conta foi rebaixada.</strong>
      </div>

      <p>Sua conta agora está no plano Gratuito. Para reativar os recursos premium, renove sua assinatura.</p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://lovetofly.com.br'}/profile?tab=membership" class="button">Reativar Assinatura</a>

      <p>Contato: support@lovetofly.com.br</p>
    </div>
  </div>
</body>
</html>
        `;

        emailSent = await sendEmailNotification(
          email,
          'Sua Assinatura Expirou - Conta Rebaixada para Gratuito',
          expiredHtml,
          user_id,
          'membership_expired'
        );
      }

      await client.query('COMMIT');
      return NextResponse.json(
        {
          message: 'Notifications created',
          notification_created: notificationCreated,
          email_sent: emailSent,
        },
        { status: 200 }
      );
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error creating notification:', err);
      return NextResponse.json({ message: 'Error creating notifications' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
