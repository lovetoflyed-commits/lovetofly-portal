# PIX Integration Examples

## Quick Start

### 1. Add PIX Payment to Membership Upgrade

In your membership upgrade page component, import and use the payment method selector:

```tsx
'use client';

import { useState } from 'react';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import PIXPaymentComponent from '@/components/PIXPaymentComponent';
import { loadStripe } from '@stripe/js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

export default function MembershipUpgradePage() {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'pix' | null>(null);
    const [membershipId, setMembershipId] = useState<string | null>(null);
    const [amount, setAmount] = useState(10000); // R$ 100.00

    const handlePaymentMethodSelect = async (method: 'stripe' | 'pix') => {
        setSelectedPaymentMethod(method);
        
        if (method === 'pix') {
            // For PIX, create membership first in pending state
            const response = await fetch('/api/user/membership/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planCode: 'premium',
                    paymentMethod: 'pix',
                    status: 'pending' // Pending until PIX payment received
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMembershipId(data.membershipId);
            }
        }
    };

    const handlePixPaymentComplete = async (paymentId: number, transactionId: string) => {
        // Payment received - activate membership
        try {
            const response = await fetch('/api/user/membership/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    membershipId,
                    pixPaymentId: paymentId,
                    transactionId
                })
            });

            if (response.ok) {
                // Redirect to success page
                window.location.href = '/membership/success';
            }
        } catch (error) {
            console.error('Error activating membership:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">Upgrade Your Membership</h1>

                    {/* Payment Method Selection */}
                    {!selectedPaymentMethod && (
                        <PaymentMethodSelector
                            selectedMethod={null}
                            onSelect={handlePaymentMethodSelect}
                            amount="R$ 100,00"
                        />
                    )}

                    {/* Stripe Payment */}
                    {selectedPaymentMethod === 'stripe' && (
                        <Elements stripe={stripePromise}>
                            {/* Your existing Stripe checkout component */}
                        </Elements>
                    )}

                    {/* PIX Payment */}
                    {selectedPaymentMethod === 'pix' && membershipId && (
                        <PIXPaymentComponent
                            orderId={membershipId}
                            orderType="membership"
                            amountCents={10000}
                            description="Premium Membership Upgrade"
                            onPaymentComplete={handlePixPaymentComplete}
                            autoRefresh={true}
                            refreshInterval={8000}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
```

### 2. Backend Integration

Update your membership upgrade API route:

```typescript
// src/app/api/user/membership/upgrade/route.ts

export async function POST(request: NextRequest) {
    try {
        const user = await verifyTokenAndGetUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { planCode, paymentMethod = 'stripe' } = body;

        // Get membership plan
        const plan = await getMembershipPlanByCode(planCode);
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Create membership record
        const membership = await pool.query(
            `INSERT INTO memberships (
                user_id, plan_id, payment_method, status, created_at
            ) VALUES ($1, $2, $3, $4, NOW())
            RETURNING id`,
            [user.id, plan.id, paymentMethod, paymentMethod === 'pix' ? 'pending' : 'active']
        );

        const membershipId = membership.rows[0].id;

        if (paymentMethod === 'pix') {
            // Import PIX utilities
            const { createPIXPayment } = await import('@/utils/pixUtils');

            // Create PIX payment
            const pixPayment = await createPIXPayment(
                {
                    userId: user.id,
                    orderId: `membership-${membershipId}`,
                    orderType: 'membership',
                    amountCents: Math.floor(plan.price * 100),
                    description: `${plan.name} - ${user.email}`
                },
                user.organization_id || 'default'
            );

            // Link PIX payment to membership
            await pool.query(
                `UPDATE memberships SET pix_payment_id = $1 WHERE id = $2`,
                [pixPayment.id, membershipId]
            );

            return NextResponse.json({
                success: true,
                membershipId,
                paymentId: pixPayment.id,
                paymentMethod: 'pix',
                brCode: pixPayment.brCode,
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixPayment.brCode)}`
            });
        } else {
            // Stripe flow (existing code)
            const checkout = await createCheckoutSession(/* ... */);
            return NextResponse.json({
                success: true,
                membershipId,
                paymentMethod: 'stripe',
                url: checkout.url
            });
        }
    } catch (error: any) {
        console.error('Error in membership upgrade:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process upgrade' },
            { status: 500 }
        );
    }
}
```

### 3. Payment Activation Endpoint

Create new endpoint to activate membership after PIX payment:

```typescript
// src/app/api/user/membership/activate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenAndGetUser } from '@/utils/authUtils';
import { updatePIXPaymentStatus } from '@/utils/pixUtils';
import pool from '@/config/db';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyTokenAndGetUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { membershipId, pixPaymentId, transactionId } = await request.json();

        // Verify membership belongs to user
        const membership = await pool.query(
            `SELECT * FROM memberships WHERE id = $1 AND user_id = $2`,
            [membershipId, user.id]
        );

        if (membership.rows.length === 0) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
        }

        // Activate membership
        await pool.query(
            `UPDATE memberships SET status = 'active' WHERE id = $1`,
            [membershipId]
        );

        // Update PIX payment status
        await updatePIXPaymentStatus(pixPaymentId, 'completed', transactionId);

        // Send confirmation email
        // await sendMembershipActivationEmail(user.email, membership.rows[0]);

        return NextResponse.json({
            success: true,
            message: 'Membership activated successfully'
        });
    } catch (error: any) {
        console.error('Error activating membership:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to activate membership' },
            { status: 500 }
        );
    }
}
```

## Advanced: PIX Payment Status Webhook (Optional)

For production environments, integrate with the Asaas webhook API:

```typescript
// src/app/api/payments/pix/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { updatePIXPaymentStatus, logPIXWebhook } from '@/utils/pixUtils';
import pool from '@/config/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Verify webhook token from Asaas
        const token = request.headers.get('asaas-access-token');
        if (process.env.PIX_WEBHOOK_SECRET && token !== process.env.PIX_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Log webhook
        await logPIXWebhook(
            body.type,
            body.id,
            body.transactionId,
            body,
            'received'
        );

        // Handle payment.received event
        if (body.type === 'payment.received') {
            // Find PIX payment record
            const payment = await pool.query(
                `SELECT id, user_id FROM pix_payments 
                 WHERE transaction_id = $1`,
                [body.transactionId]
            );

            if (payment.rows.length > 0) {
                // Update payment status
                await updatePIXPaymentStatus(
                    payment.rows[0].id,
                    'completed',
                    body.transactionId
                );

                // Find and activate membership
                const membership = await pool.query(
                    `SELECT id, user_id FROM memberships 
                     WHERE pix_payment_id = $1`,
                    [payment.rows[0].id]
                );

                if (membership.rows.length > 0) {
                    await pool.query(
                        `UPDATE memberships SET status = 'active' WHERE id = $1`,
                        [membership.rows[0].id]
                    );
                }

                // Log successful webhook handling
                await logPIXWebhook(
                    body.type,
                    body.id,
                    body.transactionId,
                    body,
                    'processed'
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        await logPIXWebhook(
            body?.type || 'unknown',
            body?.id || 'unknown',
            body?.transactionId || 'unknown',
            { error: error.message },
            'failed'
        );

        return NextResponse.json({
            error: 'Webhook processing failed'
        }, { status: 500 });
    }
}
```

## Testing the Integration

### 1. Manual Test Flow

```bash
# 1. Get auth token (adjust with your auth endpoint)
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Create membership with PIX payment
curl -X POST http://localhost:3000/api/user/membership/upgrade \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planCode": "premium",
    "paymentMethod": "pix"
  }'

# 3. Check payment status
curl "http://localhost:3000/api/payments/pix?paymentId=1" \
  -H "Authorization: Bearer $TOKEN"

# 4. Manually update payment to completed (dev only)
# In database: UPDATE pix_payments SET status = 'completed' WHERE id = 1;

# 5. Activate membership
curl -X POST http://localhost:3000/api/user/membership/activate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "membershipId": "membership-123",
    "pixPaymentId": 1,
    "transactionId": "ABC123"
  }'
```

### 2. UI Testing Checklist

- [ ] Payment method selector displays both options
- [ ] PIX option shown only if key is configured
- [ ] QR code displays correctly
- [ ] BRCode copy-to-clipboard works
- [ ] Timer counts down correctly
- [ ] Payment completion detected (check every 8 seconds)
- [ ] Success message appears after payment
- [ ] Membership activated in database

## Troubleshooting Integration

### Payment not completing

1. Check payment status:
```sql
SELECT id, status, expires_at FROM pix_payments 
WHERE id = 1;
```

2. Check membership status:
```sql
SELECT id, status, pix_payment_id FROM memberships 
WHERE id = 'membership-123';
```

3. Review error logs:
```
tail -f logs/app.log | grep PIX
```

### QR code not displaying

- Verify PIX key is active: `SELECT * FROM pix_keys WHERE is_active = true;`
- Check BRCode generation: Review API response for `brCode` field
- Verify image service: Test `generateQRCodeImageURL()` separately

### Components not found

Ensure files are in correct locations:
- `src/components/PIXPaymentComponent.tsx`
- `src/components/PaymentMethodSelector.tsx`
- `src/components/admin/PIXConfigAdmin.tsx`
