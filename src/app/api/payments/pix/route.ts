/**
 * API Endpoint: POST /api/payments/pix
 * Purpose: Generate PIX QR code with BRCode for payment
 * 
 * Request body:
 * {
 *   "orderId": "string", // Reference to booking/membership/etc
 *   "orderType": "string", // membership, hangar_booking, classifieds
 *   "amountCents": number, // Amount in cents
 *   "description": "string" // Optional payment description
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "paymentId": number,
 *     "brCode": "string", // The actual BRCode content for desktop scanning
 *     "qrCodeUrl": "string", // URL to QR code image
 *     "amount": "R$ X,XX",
 *     "expiresAt": "2024-01-20T10:15:30Z",
 *     "pixKey": {...}, // PIX account details
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyTokenAndGetUser } from '@/utils/authUtils';
import {
    createPIXPayment,
    generateQRCodeImageURL,
    formatBRLAmount,
    getActivePIXKey,
    CreatePIXPaymentRequest
} from '@/utils/pixUtils';

export async function POST(request: NextRequest) {
    try {
        // Verify user authentication
        const user = await verifyTokenAndGetUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { orderId, orderType, amountCents, description } = body;

        // Validate required fields
        if (!orderId || !orderType || !amountCents) {
            return NextResponse.json(
                {
                    error: 'Missing required fields',
                    required: ['orderId', 'orderType', 'amountCents']
                },
                { status: 400 }
            );
        }

        // Validate amount is positive
        if (amountCents <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than 0' },
                { status: 400 }
            );
        }

        // Get organization ID from user (default to user's own org or system org)
        // Using system organization UUID that matches the configured PIX key
        const organizationId = process.env.DEFAULT_ORG_ID || '00000000-0000-0000-0000-000000000001';

        // Create PIX payment and generate QR code
        const paymentData = await createPIXPayment(
            {
                userId: String(user.id),
                orderId,
                orderType,
                amountCents,
                description
            } as CreatePIXPaymentRequest,
            organizationId
        );

        // Get PIX key details for display
        const pixKey = await getActivePIXKey(organizationId);

        // Generate QR code image URL
        const qrCodeUrl = generateQRCodeImageURL(paymentData.brCode);

        // Format amount for display
        const formattedAmount = formatBRLAmount(amountCents);

        // Log the action
        console.log(`[PIX Payment] Created payment ${paymentData.id} for user ${user.id}`, {
            orderId,
            orderType,
            amount: formattedAmount,
            expiresAt: paymentData.expiresAt
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    paymentId: paymentData.id,
                    brCode: paymentData.brCode, // Raw BRCode for terminal/desktop scanning
                    qrCodeUrl, // QR code image for web/mobile display
                    amount: formattedAmount,
                    expiresAt: paymentData.expiresAt,
                    pixKey: pixKey ? {
                        key: pixKey.pix_key,
                        type: pixKey.pix_key_type,
                        bankName: pixKey.bank_name,
                        accountHolder: pixKey.account_holder_name
                    } : null
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[PIX Payment] Error:', error);

        const statusCode = error.message?.includes('No active PIX key') ? 400 : 500;
        const errorMessage = error.message || 'Failed to generate PIX payment';

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}

/**
 * GET /api/payments/pix?paymentId=123
 * Retrieve payment status and details
 */
export async function GET(request: NextRequest) {
    try {
        const user = await verifyTokenAndGetUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get payment ID from query params
        const { searchParams } = new URL(request.url);
        const paymentId = searchParams.get('paymentId');

        if (!paymentId) {
            return NextResponse.json(
                { error: 'paymentId query parameter is required' },
                { status: 400 }
            );
        }

        // Import getPIXPayment here to avoid circular dependency
        const { getPIXPayment } = await import('@/utils/pixUtils');

        const payment = await getPIXPayment(parseInt(paymentId));

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        // Verify user owns this payment
        if (payment.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        if (payment.status === 'completed' && payment.order_type === 'hangar_booking' && payment.order_id) {
            const bookingMatch = String(payment.order_id).match(/^booking-(\d+)$/) || String(payment.order_id).match(/^(\d+)$/);
            const bookingId = bookingMatch ? parseInt(bookingMatch[1], 10) : null;

            if (bookingId) {
                await pool.query(
                    `UPDATE hangar_bookings
                     SET status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
                         payment_method = 'pix',
                         pix_payment_id = COALESCE(pix_payment_id, $2),
                         updated_at = NOW()
                     WHERE id = $1`,
                    [bookingId, payment.id]
                );
            }
        }

        // Generate QR code URL if needed
        const qrCodeUrl = generateQRCodeImageURL(payment.qr_code_content);

        return NextResponse.json(
            {
                success: true,
                data: {
                    paymentId: payment.id,
                    status: payment.status,
                    amount: formatBRLAmount(payment.amount_cents),
                    brCode: payment.qr_code_content,
                    qrCodeUrl,
                    createdAt: payment.created_at,
                    expiresAt: payment.expires_at,
                    transactionId: payment.transaction_id,
                    pixKey: {
                        key: payment.pix_key,
                        type: payment.pix_key_type,
                        bankName: payment.bank_name,
                        accountHolder: payment.account_holder_name
                    }
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[PIX Payment GET] Error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve payment' },
            { status: 500 }
        );
    }
}
