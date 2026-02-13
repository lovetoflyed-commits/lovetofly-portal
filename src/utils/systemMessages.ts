/**
 * Portal System Messages Utility
 * 
 * Funções helper para enviar mensagens automáticas do sistema para usuários.
 * Uso: Onboarding, notificações, comunicados, alertas, etc.
 */

import pool from '@/config/db';
import { v4 as uuidv4 } from 'uuid';

interface SystemMessageOptions {
  recipientUserId: number;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  relatedEntityType?: string;
  relatedEntityId?: number;
  metadata?: Record<string, any>;
}

/**
 * Envia mensagem do sistema para um usuário
 */
export async function sendSystemMessage(options: SystemMessageOptions): Promise<boolean> {
  const {
    recipientUserId,
    subject,
    message,
    priority = 'normal',
    relatedEntityType,
    relatedEntityId,
    metadata = {},
  } = options;

  try {
    const threadId = uuidv4();
    const messageUuid = uuidv4();

    await pool.query(
      `INSERT INTO portal_messages (
        uuid,
        sender_user_id,
        recipient_user_id,
        sender_type,
        module,
        subject,
        message,
        priority,
        thread_id,
        related_entity_type,
        related_entity_id,
        metadata,
        sent_at
      ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        messageUuid,
        recipientUserId,
        'system',
        'portal',
        subject,
        message,
        priority,
        threadId,
        relatedEntityType,
        relatedEntityId,
        JSON.stringify({ ...metadata, system_generated: true }),
      ]
    );

    return true;
  } catch (error) {
    console.error('Error sending system message:', error);
    return false;
  }
}

/**
 * Envia mensagem de boas-vindas a novo usuário
 */
export async function sendWelcomeMessage(userId: number): Promise<boolean> {
  return sendSystemMessage({
    recipientUserId: userId,
    subject: '🎉 Bem-vindo ao Love to Fly!',
    message: `Olá! Seja muito bem-vindo(a) ao Love to Fly, o portal completo para aviadores!

Aqui você encontra:
✈️ HangarShare - Alugue ou divulgue seus hangares
💼 Carreiras - Oportunidades na aviação
📚 Cursos e Treinamentos
📊 Logbook Digital
🌦️ Informações Meteorológicas
🛠️ E muito mais!

Explore o portal e aproveite todos os recursos disponíveis.

Bons voos! 🚁`,
    priority: 'normal',
    metadata: {
      message_type: 'welcome',
      automated: true,
    },
  });
}

/**
 * Envia notificação de manutenção programada
 */
export async function sendMaintenanceNotification(userIds: number[], scheduledDate: Date): Promise<number> {
  let successCount = 0;

  for (const userId of userIds) {
    const success = await sendSystemMessage({
      recipientUserId: userId,
      subject: '⚠️ Manutenção Programada',
      message: `Informamos que o portal passará por uma manutenção programada.

📅 Data: ${scheduledDate.toLocaleDateString('pt-BR')}
🕐 Horário: ${scheduledDate.toLocaleTimeString('pt-BR')}
⏱️ Duração estimada: 2-4 horas

Durante este período, alguns serviços poderão ficar temporariamente indisponíveis.

Agradecemos sua compreensão.`,
      priority: 'high',
      metadata: {
        message_type: 'maintenance',
        scheduled_date: scheduledDate.toISOString(),
      },
    });

    if (success) successCount++;
  }

  return successCount;
}

/**
 * Envia alerta de segurança
 */
export async function sendSecurityAlert(userIds: number[], alertMessage: string): Promise<number> {
  let successCount = 0;

  for (const userId of userIds) {
    const success = await sendSystemMessage({
      recipientUserId: userId,
      subject: '🔐 Alerta de Segurança',
      message: `${alertMessage}

Se você não reconhece esta atividade, recomendamos:
1. Alterar sua senha imediatamente
2. Revisar suas configurações de segurança
3. Entrar em contato com o suporte se necessário

Sua segurança é nossa prioridade.`,
      priority: 'urgent',
      metadata: {
        message_type: 'security_alert',
        automated: true,
      },
    });

    if (success) successCount++;
  }

  return successCount;
}

/**
 * Envia comunicado geral
 */
export async function sendGeneralAnnouncement(
  userIds: number[],
  subject: string,
  message: string,
  priority: 'low' | 'normal' | 'high' = 'normal'
): Promise<number> {
  let successCount = 0;

  for (const userId of userIds) {
    const success = await sendSystemMessage({
      recipientUserId: userId,
      subject: `📢 ${subject}`,
      message,
      priority,
      metadata: {
        message_type: 'announcement',
        broadcast: true,
      },
    });

    if (success) successCount++;
  }

  return successCount;
}

/**
 * Envia lembrete de atividade pendente
 */
export async function sendActivityReminder(
  userId: number,
  activity: string,
  description: string,
  relatedEntityType?: string,
  relatedEntityId?: number
): Promise<boolean> {
  return sendSystemMessage({
    recipientUserId: userId,
    subject: `⏰ Lembrete: ${activity}`,
    message: `Olá!

Este é um lembrete sobre: ${activity}

${description}

Acesse o portal para mais detalhes.`,
    priority: 'normal',
    relatedEntityType,
    relatedEntityId,
    metadata: {
      message_type: 'reminder',
      automated: true,
    },
  });
}

/**
 * Envia notificação de atualização de sistema
 */
export async function sendSystemUpdateNotification(userIds: number[], features: string[]): Promise<number> {
  let successCount = 0;

  const featuresList = features.map((f, i) => `${i + 1}. ${f}`).join('\n');

  for (const userId of userIds) {
    const success = await sendSystemMessage({
      recipientUserId: userId,
      subject: '🚀 Novidades no Portal!',
      message: `Temos novidades para você!

O portal foi atualizado com novos recursos:

${featuresList}

Explore as novidades e aproveite!

Equipe Love to Fly`,
      priority: 'normal',
      metadata: {
        message_type: 'update',
        features,
      },
    });

    if (success) successCount++;
  }

  return successCount;
}
