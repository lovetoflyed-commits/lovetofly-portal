// Dynamic import to avoid build-time initialization
async function getResendClient() {
  const { Resend } = await import('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation({
  customerEmail,
  customerName,
  hangarName,
  hangarLocation,
  checkIn,
  checkOut,
  nights,
  totalPrice,
  confirmationNumber,
  paymentId,
}: {
  customerEmail: string;
  customerName: string;
  hangarName: string;
  hangarLocation: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  confirmationNumber: string;
  paymentId: string;
}) {
  try {
    const resend = await getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'LoveToFly Portal <reservas@lovetofly.com.br>',
      to: [customerEmail],
      subject: `Confirmação de Reserva - ${confirmationNumber}`,
      html: getBookingConfirmationHTML({
        customerName,
        hangarName,
        hangarLocation,
        checkIn,
        checkOut,
        nights,
        totalPrice,
        confirmationNumber,
        paymentId,
      }),
    });

    if (error) {
      console.error('❌ Error sending confirmation email:', error);
      return { success: false, error };
    }

    console.log('✅ Confirmation email sent:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending confirmation email:', error);
    return { success: false, error };
  }
}

/**
 * Send booking notification to hangar owner
 */
export async function sendOwnerNotification({
  ownerEmail,
  ownerName,
  customerName,
  hangarName,
  checkIn,
  checkOut,
  nights,
  totalPrice,
  confirmationNumber,
}: {
  ownerEmail: string;
  ownerName: string;
  customerName: string;
  hangarName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  confirmationNumber: string;
}) {
  try {
    const resend = await getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'LoveToFly Portal <notificacoes@lovetofly.com.br>',
      to: [ownerEmail],
      subject: `Nova Reserva Recebida - ${hangarName}`,
      html: getOwnerNotificationHTML({
        ownerName,
        customerName,
        hangarName,
        checkIn,
        checkOut,
        nights,
        totalPrice,
        confirmationNumber,
      }),
    });

    if (error) {
      console.error('❌ Error sending owner notification:', error);
      return { success: false, error };
    }

    console.log('✅ Owner notification sent:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending owner notification:', error);
    return { success: false, error };
  }
}

/**
 * Send payment failure notification to customer
 */
export async function sendPaymentFailureNotification({
  customerEmail,
  customerName,
  hangarName,
  checkIn,
  checkOut,
  totalPrice,
  failureReason,
}: {
  customerEmail: string;
  customerName: string;
  hangarName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  failureReason?: string;
}) {
  try {
    const resend = await getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'LoveToFly Portal <suporte@lovetofly.com.br>',
      to: [customerEmail],
      subject: 'Problema no Pagamento - Ação Necessária',
      html: getPaymentFailureHTML({
        customerName,
        hangarName,
        checkIn,
        checkOut,
        totalPrice,
        failureReason,
      }),
    });

    if (error) {
      console.error('❌ Error sending failure notification:', error);
      return { success: false, error };
    }

    console.log('✅ Failure notification sent:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending failure notification:', error);
    return { success: false, error };
  }
}

// === EMAIL TEMPLATES ===

function getBookingConfirmationHTML({
  customerName,
  hangarName,
  hangarLocation,
  checkIn,
  checkOut,
  nights,
  totalPrice,
  confirmationNumber,
  paymentId,
}: {
  customerName: string;
  hangarName: string;
  hangarLocation: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  confirmationNumber: string;
  paymentId: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .confirmation-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin-bottom: 20px; }
    .info-box { background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #6b7280; }
    .info-value { color: #111827; }
    .price-total { font-size: 24px; font-weight: 700; color: #667eea; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✈️ Reserva Confirmada!</h1>
    </div>
    <div class="content">
      <div class="confirmation-badge">✓ Pagamento Aprovado</div>
      
      <p>Olá <strong>${customerName}</strong>,</p>
      
      <p>Sua reserva foi confirmada com sucesso! Estamos animados em recebê-lo.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📍 Detalhes da Reserva</h3>
        <div class="info-row">
          <span class="info-label">Hangar:</span>
          <span class="info-value">${hangarName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Localização:</span>
          <span class="info-value">${hangarLocation}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-in:</span>
          <span class="info-value">${new Date(checkIn).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-out:</span>
          <span class="info-value">${new Date(checkOut).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Noites:</span>
          <span class="info-value">${nights} ${nights === 1 ? 'noite' : 'noites'}</span>
        </div>
      </div>
      
      <div class="price-total">
        Total: R$ ${totalPrice.toFixed(2).replace('.', ',')}
      </div>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">🔖 Informações de Pagamento</h3>
        <div class="info-row">
          <span class="info-label">Nº Confirmação:</span>
          <span class="info-value"><strong>${confirmationNumber}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">ID Pagamento:</span>
          <span class="info-value">${paymentId}</span>
        </div>
      </div>
      
      <p style="margin-top: 30px;"><strong>Próximos Passos:</strong></p>
      <ul>
        <li>O proprietário do hangar receberá uma notificação</li>
        <li>Você pode gerenciar sua reserva na área de perfil</li>
        <li>Em caso de dúvidas, entre em contato conosco</li>
      </ul>
      
      <center>
        <a href="https://lovetofly.com.br/profile" class="button">Ver Minhas Reservas</a>
      </center>
    </div>
    <div class="footer">
      <p><strong>LoveToFly Portal</strong><br>
      Conectando pilotos e hangares<br>
      suporte@lovetofly.com.br</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getOwnerNotificationHTML({
  ownerName,
  customerName,
  hangarName,
  checkIn,
  checkOut,
  nights,
  totalPrice,
  confirmationNumber,
}: {
  ownerName: string;
  customerName: string;
  hangarName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  confirmationNumber: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin-bottom: 20px; }
    .info-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fde68a; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #92400e; }
    .info-value { color: #111827; }
    .earnings { font-size: 24px; font-weight: 700; color: #10b981; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Nova Reserva!</h1>
    </div>
    <div class="content">
      <div class="badge">💰 Pagamento Confirmado</div>
      
      <p>Olá <strong>${ownerName}</strong>,</p>
      
      <p>Você recebeu uma nova reserva para o seu hangar!</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">👤 Cliente</h3>
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span class="info-value">${customerName}</span>
        </div>
      </div>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">🏠 Hangar</h3>
        <div class="info-row">
          <span class="info-label">Hangar:</span>
          <span class="info-value">${hangarName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-in:</span>
          <span class="info-value">${new Date(checkIn).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-out:</span>
          <span class="info-value">${new Date(checkOut).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Noites:</span>
          <span class="info-value">${nights} ${nights === 1 ? 'noite' : 'noites'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Confirmação:</span>
          <span class="info-value"><strong>${confirmationNumber}</strong></span>
        </div>
      </div>
      
      <div class="earnings">
        Valor: R$ ${totalPrice.toFixed(2).replace('.', ',')}
      </div>
      
      <p><strong>Ações Necessárias:</strong></p>
      <ul>
        <li>Prepare o hangar para a data de check-in</li>
        <li>Verifique as condições e disponibilidade</li>
        <li>Entre em contato com o cliente se necessário</li>
      </ul>
      
      <center>
        <a href="https://lovetofly.com.br/hangarshare/owner" class="button">Ver Dashboard</a>
      </center>
    </div>
    <div class="footer">
      <p><strong>LoveToFly Portal</strong><br>
      Conectando pilotos e hangares<br>
      suporte@lovetofly.com.br</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getPaymentFailureHTML({
  customerName,
  hangarName,
  checkIn,
  checkOut,
  totalPrice,
  failureReason,
}: {
  customerName: string;
  hangarName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  failureReason?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-box { background: #f9fafb; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #6b7280; }
    .info-value { color: #111827; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Problema no Pagamento</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${customerName}</strong>,</p>
      
      <div class="alert">
        <p><strong>❌ Seu pagamento não foi processado</strong></p>
        <p>Infelizmente, não conseguimos processar o pagamento para sua reserva.</p>
        ${failureReason ? `<p><strong>Motivo:</strong> ${failureReason}</p>` : ''}
      </div>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📍 Detalhes da Reserva</h3>
        <div class="info-row">
          <span class="info-label">Hangar:</span>
          <span class="info-value">${hangarName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-in:</span>
          <span class="info-value">${new Date(checkIn).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Check-out:</span>
          <span class="info-value">${new Date(checkOut).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Valor:</span>
          <span class="info-value">R$ ${totalPrice.toFixed(2).replace('.', ',')}}</span>
        </div>
      </div>
      
      <p><strong>O que fazer agora:</strong></p>
      <ul>
        <li>Verifique os dados do seu cartão</li>
        <li>Confirme que há limite disponível</li>
        <li>Entre em contato com seu banco se necessário</li>
        <li>Tente fazer a reserva novamente</li>
      </ul>
      
      <center>
        <a href="https://lovetofly.com.br/hangarshare" class="button">Tentar Novamente</a>
      </center>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Se o problema persistir, entre em contato com nosso suporte em <strong>suporte@lovetofly.com.br</strong>
      </p>
    </div>
    <div class="footer">
      <p><strong>LoveToFly Portal</strong><br>
      Conectando pilotos e hangares<br>
      suporte@lovetofly.com.br</p>
    </div>
  </div>
</body>
</html>
  `;
}
/**
 * Send booking cancellation email to customer
 */
export async function sendCancellationEmail({
  customerEmail,
  customerName,
  bookingId,
  checkInDate,
  checkOutDate,
  totalAmount,
  refundAmount,
  cancellationReason,
  bookingType,
  serviceFee,
}: {
  customerEmail: string;
  customerName: string;
  bookingId: number;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  refundAmount: number;
  cancellationReason: string;
  bookingType: string;
  serviceFee: number;
}) {
  try {
    const resend = await getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'LoveToFly Portal <reservas@lovetofly.com.br>',
      to: [customerEmail],
      subject: `Reserva Cancelada - Reembolso Processado #${bookingId}`,
      html: getCancellationHTML({
        customerName,
        bookingId,
        checkInDate,
        checkOutDate,
        totalAmount,
        refundAmount,
        cancellationReason,
        bookingType,
        serviceFee,
      }),
    });

    if (error) {
      console.error('Resend error sending cancellation email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
}

function getCancellationHTML({
  customerName,
  bookingId,
  checkInDate,
  checkOutDate,
  totalAmount,
  refundAmount,
  cancellationReason,
  bookingType,
  serviceFee,
}: {
  customerName: string;
  bookingId: number;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  refundAmount: number;
  cancellationReason: string;
  bookingType: string;
  serviceFee: number;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .section { margin-bottom: 20px; }
    .section-title { color: #1e3a8a; font-weight: bold; font-size: 16px; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .label { color: #64748b; font-weight: bold; }
    .value { text-align: right; }
    .refund-amount { background-color: #dcfce7; padding: 12px; border-left: 4px solid #22c55e; border-radius: 4px; }
    .refund-text { color: #15803d; font-weight: bold; font-size: 14px; }
    .warning { background-color: #fef2f2; padding: 12px; border-left: 4px solid #ef4444; border-radius: 4px; margin-top: 10px; color: #991b1b; font-size: 13px; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #1e3a8a; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Reserva Cancelada</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Processamento de Reembolso</p>
    </div>
    
    <div class="content">
      <p>Olá <strong>${customerName}</strong>,</p>
      
      <p>Confirmamos que sua reserva foi cancelada com sucesso. Abaixo estão os detalhes do seu reembolso:</p>
      
      <div class="section">
        <div class="section-title">Informações da Reserva Cancelada</div>
        <div class="info-row">
          <span class="label">Nº da Reserva:</span>
          <span class="value">#${bookingId}</span>
        </div>
        <div class="info-row">
          <span class="label">Tipo de Reserva:</span>
          <span class="value">${bookingType === 'non_refundable' ? 'Não reembolsável' : 'Reembolsável'}</span>
        </div>
        <div class="info-row">
          <span class="label">Check-in Original:</span>
          <span class="value">${new Date(checkInDate).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="info-row">
          <span class="label">Check-out Original:</span>
          <span class="value">${new Date(checkOutDate).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Cálculo do Reembolso</div>
        <div class="info-row">
          <span class="label">Valor Original:</span>
          <span class="value">R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="info-row">
          <span class="label">Taxa de Serviço (não reembolsável):</span>
          <span class="value">R$ ${Number(serviceFee || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="refund-amount">
          <div class="refund-text">Valor do Reembolso: R$ ${refundAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          ${refundAmount === 0
            ? '<p style="margin:6px 0 0 0; color:#991b1b; font-size:13px;">Não elegível a reembolso (reserva não reembolsável ou dentro da janela sem reembolso).</p>'
            : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Motivo da Cancelamento</div>
        <p style="margin: 0; color: #64748b; font-size: 14px;">${cancellationReason}</p>
      </div>
      
      <div class="warning">
        <strong>⏱️ Prazo de Reembolso:</strong> O reembolso será processado em sua conta dentro de 3-5 dias úteis. Você receberá uma notificação de seu banco quando o valor for creditado.
      </div>
      
      <div class="section" style="margin-top: 25px;">
        <p style="color: #64748b; font-size: 14px;">Caso tenha dúvidas sobre este reembolso, por favor entre em contato conosco:</p>
        <a href="mailto:suporte@lovetofly.com.br" class="button">📧 Contatar Suporte</a>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0; color: #64748b;">LoveToFly - HangarShare™<br>
      Conectando pilotos e hangares<br>
      suporte@lovetofly.com.br</p>
    </div>
  </div>
</body>
</html>
  `;
}