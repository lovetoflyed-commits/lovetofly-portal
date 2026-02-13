/**
 * Message Utilities - Sanitization and Rate Limiting
 * For Portal Messages System (FASE 1)
 * 
 * Implements:
 * - Content sanitization (block emails, phones, social links)
 * - Rate limiting (5 messages/hour per recipient)
 * - Input validation
 */

import pool from '@/config/db';

// ==================== CONTENT SANITIZATION ====================

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/g;
const HANDLE_REGEX = /(^|\s)@[A-Za-z0-9_.]{2,}/g;
const SOCIAL_URL_REGEX = /(instagram\.com\/\S+|facebook\.com\/\S+|t\.me\/\S+|twitter\.com\/\S+|x\.com\/\S+|linkedin\.com\/\S+|wa\.me\/\S+|whatsapp\.com\/\S+)/gi;
const EXTERNAL_LINK_REGEX = /(https?:\/\/(?!lovetofly\.com\.br)[^\s]+)/gi;
const WHATSAPP_KEYWORDS = /\b(whats?app|zap|wpp)\b/gi;

export interface SanitizationResult {
  sanitized: string;
  hasViolations: boolean;
  violations: string[];
}

/**
 * Sanitize message content - Remove emails, phones, social media links
 * Returns sanitized content and violation flags
 */
export function sanitizeMessageContent(content: string): SanitizationResult {
  let sanitized = content;
  const violations: string[] = [];

  // Block emails
  if (EMAIL_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(EMAIL_REGEX, '[email removido]');
    violations.push('email_blocked');
  }

  // Block phone numbers
  if (PHONE_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(PHONE_REGEX, '[telefone removido]');
    violations.push('phone_blocked');
  }

  // Block WhatsApp keywords with numbers nearby
  if (WHATSAPP_KEYWORDS.test(sanitized)) {
    sanitized = sanitized.replace(WHATSAPP_KEYWORDS, '[contato removido]');
    violations.push('whatsapp_keyword_blocked');
  }

  // Block social media URLs
  if (SOCIAL_URL_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(SOCIAL_URL_REGEX, '[link removido]');
    violations.push('social_link_blocked');
  }

  // Block social media handles
  if (HANDLE_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(HANDLE_REGEX, '$1[@ removido]');
    violations.push('social_handle_blocked');
  }

  // Block external links (allow only lovetofly.com.br)
  if (EXTERNAL_LINK_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(EXTERNAL_LINK_REGEX, '[link externo removido]');
    violations.push('external_link_blocked');
  }

  return {
    sanitized: sanitized.trim(),
    hasViolations: violations.length > 0,
    violations,
  };
}

// ==================== RATE LIMITING ====================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
  message?: string;
}

const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds
const RATE_LIMIT_MAX = 5; // Max 5 messages per recipient per hour

/**
 * Check if user can send message to recipient (rate limiting)
 * Prevents spam: max 5 messages/hour to same recipient
 */
export async function checkRateLimit(
  senderUserId: string,
  recipientUserId: string
): Promise<RateLimitResult> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Count messages sent in last hour to this recipient
    const result = await pool.query(
      `SELECT COUNT(*) as count,
              MAX(EXTRACT(EPOCH FROM sent_at))::int as last_sent
       FROM portal_messages
       WHERE sender_user_id = $1
         AND recipient_user_id = $2
         AND EXTRACT(EPOCH FROM sent_at) > $3`,
      [senderUserId, recipientUserId, windowStart]
    );

    const count = parseInt(result.rows[0]?.count || '0');
    const lastSent = result.rows[0]?.last_sent || windowStart;

    if (count >= RATE_LIMIT_MAX) {
      const resetIn = RATE_LIMIT_WINDOW - (now - lastSent);
      return {
        allowed: false,
        remaining: 0,
        resetIn,
        message: `Limite de ${RATE_LIMIT_MAX} mensagens/hora atingido. Tente novamente em ${Math.ceil(resetIn / 60)} minutos.`,
      };
    }

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - count,
      resetIn: 0,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow (fail open)
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX,
      resetIn: 0,
    };
  }
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate message data before sending
 */
export function validateMessageData(data: {
  recipientUserId: string | number;
  module: string;
  subject: string;
  message: string;
  priority?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Required fields
  const recipientId = typeof data.recipientUserId === 'number' 
    ? data.recipientUserId 
    : data.recipientUserId?.trim();
  
  if (!recipientId || (typeof recipientId === 'string' && recipientId === '') || 
      (typeof recipientId === 'number' && (isNaN(recipientId) || recipientId <= 0))) {
    errors.push('recipient_user_id_required');
  }

  if (!data.module || data.module.trim() === '') {
    errors.push('module_required');
  }

  if (!data.subject || data.subject.trim() === '') {
    errors.push('subject_required');
  }

  if (!data.message || data.message.trim() === '') {
    errors.push('message_required');
  }

  // Length limits
  if (data.subject && data.subject.length > 255) {
    errors.push('subject_too_long_max_255');
  }

  if (data.message && data.message.length > 10000) {
    errors.push('message_too_long_max_10000');
  }

  // Valid module
  const validModules = [
    'admin',
    'hangarshare',
    'career',
    'moderation',
    'portal',
    'support',
    'marketplace',
    'logbook',
    'mentorship',
    'simulator',
    'procedures',
    'classifieds',
  ];
  if (data.module && !validModules.includes(data.module.toLowerCase())) {
    errors.push('invalid_module');
  }

  // Valid priority
  if (data.priority) {
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(data.priority.toLowerCase())) {
      errors.push('invalid_priority');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ==================== LOGGING ====================

/**
 * Log message violation for admin review
 */
export async function logMessageViolation(
  messageId: number,
  userId: string,
  violations: string[]
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO user_activity_log
        (user_id, activity_type, activity_category, description, details, target_type, target_id, status)
       VALUES ($1, 'message_content_violation', 'messaging', $2, $3, 'portal_message', $4, 'warning')`,
      [
        userId,
        'Conteúdo bloqueado em mensagem',
        JSON.stringify({ violations }),
        messageId,
      ]
    );
  } catch (error) {
    console.error('Failed to log message violation:', error);
  }
}

/**
 * Log rate limit violation
 */
export async function logRateLimitViolation(
  userId: string,
  recipientId: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO user_activity_log
        (user_id, activity_type, activity_category, description, details, target_type, target_id, status)
       VALUES ($1, 'message_rate_limit_exceeded', 'messaging', $2, $3, 'user', $4, 'blocked')`,
      [
        userId,
        'Limite de mensagens excedido',
        JSON.stringify({ recipient_id: recipientId, limit: RATE_LIMIT_MAX }),
        recipientId,
      ]
    );
  } catch (error) {
    console.error('Failed to log rate limit violation:', error);
  }
}
