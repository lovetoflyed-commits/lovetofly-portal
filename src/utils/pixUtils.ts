/**
 * PIX Payment Utilities
 * Handles BRCode generation, QR code creation, and PIX-specific operations
 * Based on Banco Central do Brasil specifications for PIX BRCode
 */

import crypto from 'crypto';
import pool from '@/config/db';

/**
 * PIX Key Types
 */
export type PIXKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random_key';

/**
 * Interface for PIX payment creation
 */
export interface CreatePIXPaymentRequest {
    userId: string;
    orderId: string;
    orderType: string;
    amountCents: number;
    description?: string;
    pixKeyId?: number;
}

/**
 * Interface for PIX key configuration
 */
export interface PIXKeyConfig {
    pixKey: string;
    pixKeyType: PIXKeyType;
    bankName: string;
    accountHolderName: string;
    organizationId: string;
}

/**
 * BRCode structure for PIX payment
 * Follows EMV QRCode specification (ISO/IEC 18004)
 */
class BRCodeGenerator {
    /**
     * Generate a PIX BRCode string
     * Follows Banco Central do Brasil EMV QR Code specifications for PIX
     * Based on EMVCo specifications and BC Resolution 163/2020
     */
    static generateBRCode(
        pixKey: string,
        amountCents: number,
        description?: string,
        merchantName?: string,
        merchantCity?: string,
        merchantPostalCode?: string
    ): string {
        // Build the BRCode following EMV QR Code spec with proper TLV encoding
        let brcode = '';

        // 1. Format Indicator (Tag 00)
        // Value "01" indicates EMV QR Code format specification version 01
        brcode += '000201';

        // 2. Point of Initiation Method (Tag 01)
        // Value "12" = Dynamic QR Code (amount can be set by payer)
        // Value "11" = Static QR Code (predetermined amount)
        const pointOfInitiation = amountCents > 0 ? '11' : '12';
        brcode += '01' + '02' + pointOfInitiation;

        // 3. Merchant Account Information (Tag 26)
        // Contains nested TLV with PIX key information
        const merchantInfo = this.encodePixKeyInfo(pixKey);
        const merchantLength = merchantInfo.length.toString().padStart(2, '0');
        brcode += '26' + merchantLength + merchantInfo;

        // 4. Merchant Category Code (Tag 52)
        // "0000" is the default category when not specified
        brcode += '52040000';

        // 5. Transaction Currency (Tag 53) - MUST be "986" for BRL (ISO 4217)
        brcode += '5303986';

        // 6. Transaction Amount (Tag 54)
        if (amountCents > 0) {
            // Format: "550.50" (with decimal point)
            const amountBRL = (amountCents / 100).toFixed(2);
            const amountLength = amountBRL.length.toString().padStart(2, '0');
            brcode += '54' + amountLength + amountBRL;
        }

        // 7. Country Code (Tag 58) - MUST be "BR"
        brcode += '5802BR';

        // 8. Merchant Name (Tag 59)
        const normalizedMerchantName = this.normalizeEmvText(
            merchantName || 'LOVE TO FLY',
            25,
            true
        );
        brcode += this.buildTLV('59', normalizedMerchantName);

        // 9. Merchant City (Tag 60)
        const normalizedMerchantCity = this.normalizeEmvText(
            merchantCity || 'SAO PAULO',
            15,
            true
        );
        brcode += this.buildTLV('60', normalizedMerchantCity);

        // 10. Postal Code (Tag 61) - optional but commonly used
        if (merchantPostalCode) {
            const postalCode = merchantPostalCode.replace(/\D/g, '').substring(0, 8);
            if (postalCode.length > 0) {
                brcode += this.buildTLV('61', postalCode);
            }
        }

        // 11. Additional Data Field Template (Tag 62)
        // Contains reference label (TXID)
        if (description) {
            const refLabel = this.normalizeEmvText(description, 25, false);
            if (refLabel.length > 0) {
                const refData = this.buildTLV('05', refLabel);
                const refLength = refData.length.toString().padStart(2, '0');
                brcode += '62' + refLength + refData;
            }
        }

        // 8. CRC-16 Checksum (Tag 6304)
        // CRC must include tag 6304 but not its value
        const crc = this.calculateCRC16(brcode + '6304');
        brcode += '6304' + crc;

        return brcode;
    }

    /**
     * Encode PIX key information (merchant data) using proper TLV format
     * Uses DICT (Diretório de Identificadores de Contas - Transaction Account Identifiers Directory)
     * 
     * Structure:
     * - Tag 00: GUID "br.gov.bcb.pix" (14 bytes)
     * - Tag 01: PIX key value (variable length)
     */
    private static encodePixKeyInfo(pixKey: string): string {
        // Sanitize PIX key - remove formatting characters but keep valid chars
        const sanitizedKey = pixKey.trim().toLowerCase().replace(/[^0-9a-z@.\-]/g, '');

        if (!sanitizedKey) {
            throw new Error('Invalid or empty PIX key');
        }

        // Tag 00: PIX system identifier (BR.GOV.BCB.PIX)
        // This is the GUID for PIX transactions
        const guidValue = 'BR.GOV.BCB.PIX';
        const guidLength = guidValue.length.toString().padStart(2, '0');
        const guidTLV = '00' + guidLength + guidValue;

        // Tag 01: PIX key value
        // Can be: CPF, CNPJ, email, phone, or random key
        const keyLength = sanitizedKey.length.toString().padStart(2, '0');
        const keyTLV = '01' + keyLength + sanitizedKey;

        // Combine merchant data: GUID + Key
        // Return as string - caller will wrap with tag 26 and length
        return guidTLV + keyTLV;
    }

    /**
     * Calculate CRC16 checksum for BRCode validation
     * Uses CRC-16/CCITT-FALSE polynomial
     * Uses ASCII bytes per EMV specification
     */
    private static calculateCRC16(data: string): string {
        const bytes = Buffer.from(data, 'ascii');
        
        let crc = 0xffff;
        const polynomial = 0x1021;

        for (let i = 0; i < bytes.length; i++) {
            const byte = bytes[i];
            crc ^= (byte << 8) & 0xffff;

            for (let j = 0; j < 8; j++) {
                crc = crc << 1;
                if ((crc & 0x10000) !== 0) {
                    crc ^= polynomial;
                }
                crc &= 0xffff;
            }
        }

        return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    private static buildTLV(tag: string, value: string): string {
        const length = value.length.toString().padStart(2, '0');
        return tag + length + value;
    }

    private static normalizeEmvText(value: string, maxLength: number, allowSpace: boolean): string {
        const normalized = value
            .normalize('NFD')
            .replace(/[^\x20-\x7E]/g, '');

        const pattern = allowSpace ? /[^A-Za-z0-9 .-]/g : /[^A-Za-z0-9]/g;
        return normalized
            .replace(pattern, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, maxLength);
    }
}

/**
 * Get active PIX key for organization
 */
export async function getActivePIXKey(organizationId: string): Promise<any | null> {
    try {
        const result = await pool.query(
            `SELECT * FROM pix_keys 
             WHERE organization_id = $1 AND is_active = true
             ORDER BY created_at DESC
             LIMIT 1`,
            [organizationId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Error fetching PIX key:', error);
        throw error;
    }
}

/**
 * Create a PIX payment record and generate QR code
 */
export async function createPIXPayment(
    request: CreatePIXPaymentRequest,
    organizationId: string
): Promise<{ id: number; qrCode: string; brCode: string; expiresAt: Date }> {
    try {
        // Get active PIX key
        const pixKey = await getActivePIXKey(organizationId);
        if (!pixKey) {
            throw new Error('No active PIX key configured for this organization');
        }

        // Generate BRCode
        const txid = request.orderId || request.description || '';
        const brCode = BRCodeGenerator.generateBRCode(
            pixKey.pix_key,
            request.amountCents,
            txid,
            pixKey.account_holder_name,
            process.env.PIX_MERCHANT_CITY,
            process.env.PIX_MERCHANT_POSTAL_CODE
        );

        // Calculate expiration (typically 15-30 minutes for dynamic QR codes)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Create payment record in database
        const result = await pool.query(
            `INSERT INTO pix_payments (
                user_id, order_id, order_type, amount_cents, currency,
                pix_key_id, qr_code_content, status, description,
                expires_at, expiration_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, created_at, expires_at`,
            [
                request.userId,
                request.orderId,
                request.orderType,
                request.amountCents,
                'BRL',
                pixKey.id,
                brCode,
                'pending',
                request.description || null,
                expiresAt,
                expiresAt
            ]
        );

        const payment = result.rows[0];

        return {
            id: payment.id,
            qrCode: brCode, // The actual BRCode text
            brCode: brCode,
            expiresAt: new Date(payment.expires_at)
        };
    } catch (error) {
        console.error('Error creating PIX payment:', error);
        throw error;
    }
}

/**
 * Get PIX payment details
 */
export async function getPIXPayment(paymentId: number): Promise<any | null> {
    try {
        const result = await pool.query(
            `SELECT 
                p.*,
                pk.pix_key,
                pk.pix_key_type,
                pk.bank_name,
                pk.account_holder_name
            FROM pix_payments p
            LEFT JOIN pix_keys pk ON p.pix_key_id = pk.id
            WHERE p.id = $1`,
            [paymentId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Error fetching PIX payment:', error);
        throw error;
    }
}

/**
 * Update PIX payment status
 */
export async function updatePIXPaymentStatus(
    paymentId: number,
    status: 'completed' | 'expired' | 'cancelled' | 'refunded',
    transactionId?: string
): Promise<void> {
    try {
        await pool.query(
            `UPDATE pix_payments 
             SET status = $1, transaction_id = COALESCE($2, transaction_id),
                 payment_date = CASE WHEN $1 = 'completed' THEN NOW() ELSE payment_date END
             WHERE id = $3`,
            [status, transactionId || null, paymentId]
        );
    } catch (error) {
        console.error('Error updating PIX payment status:', error);
        throw error;
    }
}

/**
 * Get payment by order reference
 */
export async function getPIXPaymentByOrder(
    orderId: string,
    orderType: string
): Promise<any | null> {
    try {
        const result = await pool.query(
            `SELECT * FROM pix_payments 
             WHERE order_id = $1 AND order_type = $2
             ORDER BY created_at DESC
             LIMIT 1`,
            [orderId, orderType]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Error fetching PIX payment by order:', error);
        throw error;
    }
}

/**
 * Log PIX webhook for debugging and audit
 */
export async function logPIXWebhook(
    eventType: string,
    externalId: string,
    transactionId: string,
    payload: any,
    status: 'success' | 'failed' | 'processed'
): Promise<void> {
    try {
        await pool.query(
            `INSERT INTO pix_webhook_logs (event_type, external_id, transaction_id, payload, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [eventType, externalId, transactionId, JSON.stringify(payload), status]
        );
    } catch (error) {
        console.error('Error logging PIX webhook:', error);
        throw error;
    }
}

/**
 * Check if PIX payment is expired
 */
export function isPIXPaymentExpired(payment: any): boolean {
    if (!payment.expires_at) return true;
    return new Date() > new Date(payment.expires_at);
}

/**
 * Generate QR code image URL using external service
 * Uses qr-server.com (free and reliable) or can integrate with paid services
 */
export function generateQRCodeImageURL(brCode: string, size: number = 300): string {
    // Encode the BRCode for URL
    const encoded = encodeURIComponent(brCode);
    // Using qr-server.com public API
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}

/**
 * Validate PIX key format based on type
 */
export function validatePIXKey(key: string, keyType: PIXKeyType): boolean {
    switch (keyType) {
        case 'cpf':
            // CPF format: 000.000.000-00
            return /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/.test(key);
        case 'cnpj':
            // CNPJ format: 00.000.000/0000-00
            return /^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})$/.test(key);
        case 'email':
            // Email format
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
        case 'phone':
            // Phone format: +55 11 99999-9999 or variant
            return /^(\+55\s?\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}|[0-9\s()+-]{10,15})$/.test(key);
        case 'random_key':
            // Random key: 32-character alphanumeric
            return /^[a-zA-Z0-9]{32}$/.test(key);
        default:
            return false;
    }
}

/**
 * Format amount in cents to BRL string (e.g., 10000 -> "R$ 100,00")
 */
export function formatBRLAmount(amountCents: number): string {
    const amount = (amountCents / 100).toFixed(2);
    const [whole, decimal] = amount.split('.');
    const formattedWhole = parseInt(whole).toLocaleString('pt-BR');
    return `R$ ${formattedWhole},${decimal}`;
}
