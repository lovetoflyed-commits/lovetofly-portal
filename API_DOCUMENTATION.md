# HangarShare Payment API Documentation

## Base URL
```
http://localhost:3000 (Development)
https://yourdomain.com (Production)
```

---

## Authentication

All endpoints except login/register require JWT token in `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token stored in `localStorage` and sent automatically by frontend.

---

## Booking Endpoints

### 1. POST `/api/hangarshare/booking/confirm`

**Purpose:** Create Stripe PaymentIntent and initialize booking record

**Required:** User must be authenticated

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "hangarId": 1,
  "userId": 5,
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-20",
  "totalPrice": 4500.00,
  "subtotal": 4200.00,
  "fees": 300.00
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "booking": {
    "hangarId": 1,
    "userId": 5,
    "checkIn": "2025-01-15",
    "checkOut": "2025-01-20",
    "nights": 5,
    "subtotal": 4200.00,
    "fees": 300.00,
    "totalPrice": 4500.00
  },
  "payment": {
    "clientSecret": "pi_1Abc123def456_secret_xyz789",
    "paymentIntentId": "pi_1Abc123def456",
    "publishableKey": "pk_test_abcdef123456"
  }
}
```

**Error Responses:**

```json
// 401 Unauthorized - No auth token
{
  "error": "Missing or invalid authorization token"
}

// 400 Bad Request - Invalid input
{
  "error": "All fields required: hangarId, userId, checkIn, checkOut, totalPrice"
}

// 400 Bad Request - Invalid dates
{
  "error": "Check-out date must be after check-in date"
}

// 404 Not Found - User doesn't exist
{
  "error": "User not found"
}

// 404 Not Found - Hangar doesn't exist
{
  "error": "Hangar not found"
}

// 500 Server Error - Stripe API error
{
  "error": "Failed to create payment intent"
}
```

**Usage Example:**

```javascript
// Frontend code
const response = await fetch('/api/hangarshare/booking/confirm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    hangarId: 1,
    userId: 5,
    checkIn: '2025-01-15',
    checkOut: '2025-01-20',
    totalPrice: 4500,
    subtotal: 4200,
    fees: 300
  })
});

const data = await response.json();

if (response.ok) {
  // Use data.payment.clientSecret for Stripe Elements
  const { clientSecret } = data.payment;
  // Pass to Elements: <Elements options={{ clientSecret }}>
} else {
  console.error(data.error);
}
```

---

### 2. GET `/api/hangarshare/booking/[bookingId]`

**Purpose:** Retrieve booking details and status

**Required:** User authenticated OR user must be booking owner

**Request Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200 OK):**
```json
{
  "id": "uuid-123",
  "hangarId": 1,
  "userId": 5,
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-20",
  "nights": 5,
  "subtotal": 4200.00,
  "fees": 300.00,
  "totalPrice": 4500.00,
  "status": "confirmed",
  "paymentMethod": "stripe",
  "stripePaymentIntentId": "pi_1Abc123...",
  "stripeChargeId": "ch_1Abc123...",
  "paymentDate": "2025-01-15T10:30:00Z",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Note:** Endpoint not yet implemented. TODO for Phase 2.

---

## Webhook Endpoints

### POST `/api/hangarshare/webhook/stripe`

**Purpose:** Listen for Stripe payment events

**Triggered by:** Stripe payment_intent events

**Required Headers:**
```
stripe-signature: t=timestamp,v1=signature
```

**Signature Verification:**
```
secret = STRIPE_WEBHOOK_SECRET (from .env)
signed_content = timestamp.payload
computed_signature = HMAC-SHA256(secret, signed_content)
verify(computed_signature == provided_signature)
```

**Events Handled:**

#### payment_intent.succeeded
Triggered when payment is successfully charged.

**Event Payload:**
```json
{
  "id": "evt_1Abc123...",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1Abc123...",
      "object": "payment_intent",
      "amount": 450000,
      "currency": "brl",
      "charges": {
        "object": "list",
        "data": [
          {
            "id": "ch_1Abc123...",
            "object": "charge"
          }
        ]
      }
    }
  }
}
```

**Webhook Action:**
1. Extract `payment_intent_id` from event
2. Query database for matching booking
3. Extract `charge_id` from charges.data[0].id
4. Update booking:
   - status: 'pending' → 'confirmed'
   - stripe_charge_id: ch_...
   - payment_date: NOW()
5. Send email notification (TODO)
6. Return 200 OK

**Database Update:**
```sql
UPDATE bookings 
SET 
  status = 'confirmed',
  stripe_charge_id = 'ch_1Abc123...',
  payment_date = NOW(),
  updated_at = NOW()
WHERE stripe_payment_intent_id = 'pi_1Abc123...'
```

---

#### payment_intent.payment_failed
Triggered when payment fails or is declined.

**Event Payload:**
```json
{
  "id": "evt_1Xyz789...",
  "object": "event",
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_1Abc123...",
      "last_payment_error": {
        "message": "Your card was declined",
        "code": "card_declined"
      }
    }
  }
}
```

**Webhook Action:**
1. Extract `payment_intent_id` from event
2. Query database for matching booking
3. Update booking:
   - status: 'pending' → 'cancelled'
   - updated_at: NOW()
4. Send email notification (TODO)
5. Return 200 OK

**Database Update:**
```sql
UPDATE bookings 
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE stripe_payment_intent_id = 'pi_1Abc123...'
```

---

## Search Endpoints (Existing)

### GET `/api/hangarshare/search`

**Purpose:** Search hangars with filters

**Query Parameters:**
```
?city=São Paulo&priceMax=15000&priceMin=0&sortBy=price
```

**Response:** Array of hangar listings

---

### GET `/api/hangarshare/listing/[id]`

**Purpose:** Get single hangar details

**Response:** Hangar object with full details

---

## Data Models

### Booking Object

```typescript
interface Booking {
  id: string;                    // UUID
  hangarId: number;
  userId: number;
  checkIn: string;               // YYYY-MM-DD
  checkOut: string;              // YYYY-MM-DD
  nights: number;
  subtotal: number;              // Price before fees (BRL)
  fees: number;                  // Service fees (BRL)
  totalPrice: number;            // Final price (BRL)
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  paymentMethod: 'stripe' | 'pix' | 'boleto' | 'manual';
  stripePaymentIntentId?: string;  // pi_...
  stripeChargeId?: string;         // ch_...
  paymentDate?: string;            // ISO timestamp
  notes?: string;
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

### Payment Intent Response

```typescript
interface PaymentIntentResponse {
  clientSecret: string;       // For Stripe Elements
  paymentIntentId: string;    // pi_... (for reference)
  publishableKey: string;     // pk_test_... or pk_live_...
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: string;              // Error message
  code?: string;              // Error code (optional)
  details?: object;           // Additional details (optional)
}
```

---

## Integration Examples

### Example 1: Complete Payment Flow (Frontend)

```javascript
// 1. User fills booking form and clicks "Confirmar Reserva"
async function initiateCheckout(bookingData) {
  // Call confirm endpoint
  const response = await fetch('/api/hangarshare/booking/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(bookingData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const { payment } = await response.json();
  
  // 2. Load Stripe
  const stripe = await loadStripe(payment.publishableKey);
  
  // 3. Create Elements with clientSecret
  const elements = stripe.elements({ 
    clientSecret: payment.clientSecret 
  });
  
  const cardElement = elements.create('card');
  cardElement.mount('#card-element');
  
  // 4. Handle form submission
  document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const result = await stripe.confirmCardPayment(payment.clientSecret, {
      payment_method: {
        card: cardElement
      }
    });
    
    if (result.error) {
      // 5. Show error
      document.getElementById('error').textContent = result.error.message;
    } else if (result.paymentIntent.status === 'succeeded') {
      // 6. Success - redirect
      window.location.href = `/hangarshare/booking/success?paymentId=${result.paymentIntent.id}`;
    }
  });
}
```

### Example 2: Server-Side Webhook Processing

```typescript
// /api/hangarshare/webhook/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  // 1. Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  // 2. Handle event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // 3. Update booking
    await db.query(
      `UPDATE bookings 
       SET status = 'confirmed', 
           stripe_charge_id = $1,
           payment_date = NOW()
       WHERE stripe_payment_intent_id = $2`,
      [paymentIntent.charges.data[0].id, paymentIntent.id]
    );
    
    // 4. Send email (TODO)
    // await sendConfirmationEmail(booking);
  }

  return Response.json({ received: true });
}
```

---

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| MISSING_AUTH | 401 | No Authorization header |
| INVALID_TOKEN | 401 | JWT token invalid/expired |
| MISSING_FIELD | 400 | Required field missing |
| INVALID_DATES | 400 | Check-out before check-in |
| USER_NOT_FOUND | 404 | User doesn't exist |
| HANGAR_NOT_FOUND | 404 | Hangar doesn't exist |
| STRIPE_ERROR | 500 | Stripe API error |
| DATABASE_ERROR | 500 | Database error |

---

## Rate Limiting

Current configuration (recommended for production):
- 100 requests per minute per IP
- 1000 requests per hour per API key
- Webhook endpoint: No rate limit (Stripe verified)

---

## Testing Checklist

- [ ] Create booking with test user
- [ ] Verify clientSecret returned
- [ ] Load Stripe Elements with secret
- [ ] Submit test card: 4242 4242 4242 4242
- [ ] Verify success page loads
- [ ] Check database: booking status = 'confirmed'
- [ ] Check Stripe Dashboard: payment shown
- [ ] Trigger payment_failed scenario
- [ ] Verify booking status = 'cancelled'

---

## Monitoring & Debugging

### Check Payment Status
```bash
# In Stripe Dashboard:
1. Go to Payments
2. Search for payment_intent_id
3. View transaction details
4. Check charges and refunds
```

### Check Webhook Delivery
```bash
# In Stripe Dashboard:
1. Go to Webhooks
2. Click "lovetofly-portal" endpoint
3. View recent event deliveries
4. Check request/response logs
5. Verify signature and timestamp
```

### Database Queries
```sql
-- Check all bookings
SELECT * FROM bookings ORDER BY created_at DESC;

-- Check pending bookings (unpaid)
SELECT * FROM bookings WHERE status = 'pending';

-- Check confirmed bookings
SELECT * FROM bookings WHERE status = 'confirmed';

-- Find booking by payment intent
SELECT * FROM bookings WHERE stripe_payment_intent_id = 'pi_123...';
```

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | Jan 2025 | Initial release with Stripe integration |

---

## Support

- **Stripe Docs:** https://stripe.com/docs
- **Status Page:** https://status.stripe.com
- **Support:** https://support.stripe.com

For questions about this API, contact the development team.
