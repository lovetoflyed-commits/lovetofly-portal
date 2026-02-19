import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyTokenAndGetUser } from '@/utils/authUtils';
import { generateQRCodeImageURL } from '@/utils/pixUtils';

interface PIXPaymentInput {
  orderType: 'hangar_booking' | 'membership';
  orderId: string;
  amountCents: number;
  description?: string;
}

interface AsaasConfig {
  apiKey: string;
  baseUrl: string;
}

function getAsaasWalletId(): string | undefined {
  const value = process.env.ASAAS_WALLET_ID;
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function getAsaasConfig(): AsaasConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const apiKey = isProduction
    ? process.env.ASAAS_PRODUCTION_API_KEY
    : process.env.ASAAS_SANDBOX_API_KEY;
  const baseUrl = isProduction
    ? process.env.ASAAS_PRODUCTION_API_BASE_URL
    : process.env.ASAAS_SANDBOX_API_BASE_URL;

  if (!apiKey) {
    throw new Error('Missing Asaas API key');
  }

  return {
    apiKey,
    baseUrl: baseUrl || (isProduction ? 'https://api.asaas.com' : 'https://api-sandbox.asaas.com'),
  };
}

async function asaasRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { apiKey, baseUrl } = getAsaasConfig();
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      access_token: apiKey,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data?.errors?.[0]?.description || data?.message || response.statusText;
    throw new Error(`Asaas API error (${response.status}): ${message}`);
  }

  return data as T;
}

function formatAsaasDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function sanitizeDigits(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? digits : undefined;
}

function compactObject<T extends Record<string, any>>(value: T): Partial<T> {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return Object.fromEntries(entries) as Partial<T>;
}

async function getOrCreateAsaasCustomer(userId: number): Promise<string> {
  const userResult = await pool.query(
    `SELECT id, first_name, last_name, email, cpf, mobile_phone,
            address_zip, address_street, address_number, address_complement,
            address_neighborhood, address_city, address_state, asaas_customer_id
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  const user = userResult.rows[0];
  if (!user) {
    throw new Error('User not found');
  }

  if (user.asaas_customer_id) {
    return String(user.asaas_customer_id);
  }

  if (!user.cpf) {
    throw new Error('CPF is required to create PIX payments');
  }

  const nameParts = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  const customerPayload = compactObject({
    name: nameParts || user.email,
    email: user.email,
    cpfCnpj: sanitizeDigits(user.cpf),
    mobilePhone: sanitizeDigits(user.mobile_phone),
    postalCode: sanitizeDigits(user.address_zip),
    address: user.address_street,
    addressNumber: user.address_number,
    complement: user.address_complement,
    province: user.address_neighborhood,
    city: user.address_city,
    state: user.address_state,
    externalReference: `user-${user.id}`,
  });

  const customer = await asaasRequest<{ id: string }>('/v3/customers', {
    method: 'POST',
    body: JSON.stringify(customerPayload),
  });

  await pool.query(
    `UPDATE users SET asaas_customer_id = $1 WHERE id = $2`,
    [customer.id, user.id]
  );

  return customer.id;
}

async function getPixQrCode(paymentId: string): Promise<{ brCode?: string; qrCode?: string; expiresAt?: Date }> {
  const qrResponse = await asaasRequest<any>(`/v3/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
  });

  const encodedImage = qrResponse?.encodedImage || qrResponse?.encodedImageBase64 || qrResponse?.qrCodeImage;
  const payload = qrResponse?.payload || qrResponse?.brCode || qrResponse?.qrCode;
  const expiresAtRaw = qrResponse?.expirationDate || qrResponse?.expirationDateTime || qrResponse?.expiresAt;

  return {
    brCode: payload,
    qrCode: encodedImage ? `data:image/png;base64,${encodedImage}` : payload ? generateQRCodeImageURL(payload) : undefined,
    expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyTokenAndGetUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PIXPaymentInput = await request.json();

    if (!body.orderType || !body.orderId || !body.amountCents) {
      return NextResponse.json(
        { error: 'Missing required fields: orderType, orderId, amountCents' },
        { status: 400 }
      );
    }

    if (body.amountCents <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (!['hangar_booking', 'membership'].includes(body.orderType)) {
      return NextResponse.json({ error: 'Invalid orderType' }, { status: 400 });
    }

    const existingPayment = await pool.query(
      `SELECT id, status, transaction_id FROM pix_payments
       WHERE order_type = $1 AND order_id = $2 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [body.orderType, body.orderId]
    );

    const defaultExpirationMinutes = Number(process.env.PIX_QR_EXPIRATION_MINUTES || 30);
    let paymentId: number;
    let expiresAt: Date;
    let asaasPaymentId: string | null = null;

    if (existingPayment.rows.length > 0) {
      paymentId = existingPayment.rows[0].id;
      asaasPaymentId = existingPayment.rows[0].transaction_id ? String(existingPayment.rows[0].transaction_id) : null;
      expiresAt = new Date(Date.now() + defaultExpirationMinutes * 60 * 1000);

      await pool.query(
        `UPDATE pix_payments
         SET expires_at = $1, updated_at = NOW()
         WHERE id = $2`,
        [expiresAt, paymentId]
      );
    } else {
      expiresAt = new Date(Date.now() + defaultExpirationMinutes * 60 * 1000);

      const result = await pool.query(
        `INSERT INTO pix_payments
         (user_id, order_type, order_id, amount_cents, status, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, NOW(), NOW())
         RETURNING id`,
        [user.id, body.orderType, body.orderId, body.amountCents, expiresAt]
      );

      paymentId = result.rows[0].id;
    }

    const customerId = await getOrCreateAsaasCustomer(user.id);

    if (!asaasPaymentId) {
      const amountBRL = Number((body.amountCents / 100).toFixed(2));
      const description = body.description || `${body.orderType.replace('_', ' ')} - ${body.orderId}`;

      const paymentPayload = {
        customer: customerId,
        billingType: 'PIX',
        value: amountBRL,
        dueDate: formatAsaasDate(new Date()),
        description,
        externalReference: body.orderId,
        walletId: getAsaasWalletId(),
      };

      console.log('[PIX Create] Asaas payment payload:', {
        ...paymentPayload,
        description: paymentPayload.description ? '[redacted]' : undefined,
      });

      const paymentResponse = await asaasRequest<{ id: string }>('/v3/payments', {
        method: 'POST',
        body: JSON.stringify(paymentPayload),
      });

      asaasPaymentId = paymentResponse.id;

      await pool.query(
        `UPDATE pix_payments
         SET transaction_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [asaasPaymentId, paymentId]
      );
    }

    const qrData = await getPixQrCode(asaasPaymentId);
    const resolvedExpiresAt = qrData.expiresAt || expiresAt;

    if (!qrData.brCode || !qrData.qrCode) {
      return NextResponse.json(
        { error: 'Failed to generate payment QR code' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: paymentId,
        order_id: body.orderId,
        amount: {
          cents: body.amountCents,
          formatted: `R$ ${(body.amountCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
        brCode: {
          qrCode: qrData.qrCode,
          brCode: qrData.brCode,
          txId: body.orderId,
          expiresAt: resolvedExpiresAt,
        },
        expires_at: resolvedExpiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create PIX payment';
    console.error('[PIX Create] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
