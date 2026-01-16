# Phase 7.2: Monitoring & Logging Setup Guide

**Status:** Configuration Complete  
**Created:** January 15, 2026

---

## Overview

This guide sets up comprehensive monitoring and logging for the Love to Fly Portal using Sentry for error tracking and custom metrics for performance monitoring.

---

## Part 1: Sentry Error Tracking Setup

### 1.1 Sentry Project Configuration

Sentry is already installed (`@sentry/nextjs`) and configured with three config files:
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.client.config.ts` - Client-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking

### 1.2 Environment Variables Required

Add to `.env.local`:
```bash
# Get DSN from https://sentry.io/projects/
NEXT_PUBLIC_SENTRY_DSN=https://your-key@o-id.ingest.sentry.io/project-id

# Optional: Custom environment
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=1.0.0
```

### 1.3 Production Deployment

For Netlify deployment:
1. Go to **Build & deploy → Environment** in Netlify dashboard
2. Add the following variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN = https://your-key@o-id.ingest.sentry.io/project-id
   SENTRY_ENVIRONMENT = production
   ```

---

## Part 2: Custom Monitoring Service

### 2.1 Using MonitoringService

The `src/services/monitoring.ts` module provides:

#### API Performance Tracking
```typescript
import { MonitoringService } from '@/services/monitoring';

// In API routes
const startTime = performance.now();
try {
  // API logic
  const duration = performance.now() - startTime;
  MonitoringService.trackApiPerformance('/api/hangarshare/search', duration, 200);
} catch (error) {
  MonitoringService.captureException(error);
}
```

#### Database Query Tracking
```typescript
const startTime = performance.now();
const result = await pool.query(sql, params);
const duration = performance.now() - startTime;

MonitoringService.trackDatabaseQuery(sql, duration, result.rows.length);
```

#### Payment Events
```typescript
try {
  // Process payment
  MonitoringService.trackPaymentEvent('success', 1500.00, 'BRL', { paymentId });
} catch (error) {
  MonitoringService.trackPaymentEvent('failed', 1500.00, 'BRL', { error });
}
```

#### Email Sending
```typescript
try {
  await sendEmail(recipient, template);
  MonitoringService.trackEmailEvent(recipient, 'booking-confirmation', true);
} catch (error) {
  MonitoringService.trackEmailEvent(recipient, 'booking-confirmation', false, error.message);
}
```

#### User Actions
```typescript
MonitoringService.trackUserAction('listing_created', userId, {
  listingId,
  hangarSize: size_sqm,
  location: icao_code
});
```

---

## Part 3: Integration Examples

### 3.1 Integrating into API Routes

Example: `src/app/api/hangarshare/search/route.ts`

```typescript
import MonitoringService from '@/services/monitoring';

export async function GET(request: NextRequest) {
  const transaction = MonitoringService.startTransaction('search-listing');
  const startTime = performance.now();

  try {
    const { searchParams } = new URL(request.url);
    // ... search logic
    
    const duration = performance.now() - startTime;
    MonitoringService.trackApiPerformance(
      '/api/hangarshare/search',
      duration,
      200
    );
    
    transaction?.finish();
    return NextResponse.json({ results });
  } catch (error) {
    MonitoringService.captureException(error);
    transaction?.finish();
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
```

### 3.2 Integrating into Payment Processing

Example: `src/app/api/hangarshare/bookings/route.ts`

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.totalPrice * 100,
      currency: 'brl',
    });
    
    MonitoringService.trackPaymentEvent('initiated', body.totalPrice, 'BRL', {
      paymentIntentId: paymentIntent.id,
      listingId: body.listingId,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    MonitoringService.trackPaymentEvent('failed', body.totalPrice, 'BRL');
    MonitoringService.captureException(error);
    return NextResponse.json({ message: 'Payment failed' }, { status: 500 });
  }
}
```

### 3.3 Integrating into Email Service

Example: `src/utils/email.ts`

```typescript
import MonitoringService from '@/services/monitoring';

export async function sendBookingConfirmation(email: string, bookingData: any) {
  try {
    // Send email
    const result = await resend.emails.send({
      from: 'noreply@lovetofly.com',
      to: email,
      subject: 'Booking Confirmation',
      // ... email template
    });

    MonitoringService.trackEmailEvent(email, 'booking-confirmation', true);
    return result;
  } catch (error) {
    MonitoringService.trackEmailEvent(
      email,
      'booking-confirmation',
      false,
      error.message
    );
    throw error;
  }
}
```

---

## Part 4: Performance Thresholds & Alerts

### Recommended Alert Configuration in Sentry:

1. **API Response Time Alerts**
   - Threshold: >100ms for API endpoints
   - Action: Email notification to team

2. **Database Query Alerts**
   - Threshold: >50ms for slow queries
   - Action: Log to console + Email to dev team

3. **Error Rate Alerts**
   - Threshold: >5% error rate
   - Action: Critical alert to team

4. **Payment Failures**
   - Threshold: Any payment failure
   - Action: Immediate email + Sentry alert

### Setting Up Alerts in Sentry:

1. Go to your Sentry project
2. Click **Alerts → Create Alert Rule**
3. Configure:
   - **Condition:** Issues with tag `statusCode=500`
   - **Action:** Send email notification
   - **Threshold:** New issue

---

## Part 5: Monitoring Dashboard KPIs

### Key Performance Indicators to Track:

1. **API Response Times**
   - Search endpoint: Target <2ms
   - Favorites: Target <5ms
   - Reviews: Target <15ms
   - Bookings: Target <50ms

2. **Database Metrics**
   - Query count per request: 1-3 queries max
   - Slow query threshold: >50ms
   - Connection pool utilization

3. **Payment Metrics**
   - Success rate: >99%
   - Average processing time: <2s
   - Failed payment count: <1%

4. **Email Metrics**
   - Delivery rate: >98%
   - Average delivery time: <5s
   - Bounce rate: <0.1%

5. **User Engagement**
   - Active users per day
   - Listing creation rate
   - Booking conversion rate

---

## Part 6: Local Development Testing

### Test Sentry in Development:

```typescript
// Create test error
import { MonitoringService } from '@/services/monitoring';

// In a test endpoint
export async function GET() {
  try {
    throw new Error('Test error for Sentry');
  } catch (error) {
    MonitoringService.captureException(error as Error);
    return NextResponse.json({ message: 'Error captured' });
  }
}
```

Check **Sentry dashboard** → **Issues** to verify error was captured.

### Test Performance Tracking:

```typescript
MonitoringService.trackApiPerformance('/api/test', 150, 200);
MonitoringService.trackDatabaseQuery('SELECT * FROM listings', 75, 20);
MonitoringService.trackPaymentEvent('success', 1500, 'BRL');
```

---

## Part 7: Privacy & Security

### Sensitive Data Filtering (Already Configured):

The `sentry.server.config.ts` includes:
- ✅ Authorization headers removed
- ✅ Cookie headers removed
- ✅ Database URLs masked
- ✅ Customer email addresses filtered

### Additional Recommendations:

1. **For PII (Personally Identifiable Information):**
   ```typescript
   beforeSend(event) {
     // Remove user emails from error messages
     if (event.exception?.values) {
       event.exception.values = event.exception.values.map(e => ({
         ...e,
         value: e.value?.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '[email]')
       }));
     }
     return event;
   }
   ```

2. **For Payment Data:**
   - Never log full credit card numbers
   - Never log full payment tokens
   - Log only last 4 digits + merchant ID

3. **For API Keys:**
   - Rotate keys quarterly
   - Never log API keys in error messages
   - Use environment variables only

---

## Part 8: Implementation Checklist

### Sentry Setup:
- [ ] Create Sentry project at https://sentry.io
- [ ] Copy DSN to `.env.local`
- [ ] Test error capture in dev environment
- [ ] Configure alerts in Sentry dashboard
- [ ] Add DSN to production environment (Netlify)

### Custom Monitoring:
- [ ] Import `MonitoringService` in critical API routes
- [ ] Add performance tracking to search endpoint
- [ ] Add performance tracking to booking endpoint
- [ ] Add email tracking to email service
- [ ] Add payment tracking to payment routes

### Testing:
- [ ] Verify errors appear in Sentry console
- [ ] Verify metrics are recorded
- [ ] Test alert notifications
- [ ] Verify no sensitive data in Sentry

### Documentation:
- [ ] Document monitoring procedures for team
- [ ] Create runbook for handling alerts
- [ ] Set up on-call rotation
- [ ] Schedule quarterly alert rule review

---

## Part 9: Troubleshooting

### Issue: Events not appearing in Sentry

**Solution:**
```bash
# Verify DSN is set
echo $NEXT_PUBLIC_SENTRY_DSN

# Check if Sentry is initialized
# Restart dev server
npm run dev
```

### Issue: Slow performance dashboard loads

**Solution:**
- Reduce sample rate in production:
  ```typescript
  // In sentry.*.config.ts
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  ```

### Issue: Too many alert notifications

**Solution:**
- Adjust alert thresholds in Sentry dashboard
- Use alert routing to filter by severity
- Disable non-critical alerts during high-traffic events

---

## Part 10: Next Steps

### Phase 7.2 Remaining:
- [ ] Integrate MonitoringService into top 5 critical API routes
- [ ] Test performance tracking in production
- [ ] Create monitoring dashboard in Sentry

### Phase 7.3:
- [ ] Mobile responsive testing
- [ ] Accessibility (ARIA) audit
- [ ] Keyboard navigation validation

---

## Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Performance Monitoring:** https://docs.sentry.io/product/performance/
- **Alerts:** https://docs.sentry.io/product/alerts/
- **Session Replay:** https://docs.sentry.io/product/session-replay/

---

**Status:** ✅ Setup Complete  
**Ready for:** Integration into API routes
