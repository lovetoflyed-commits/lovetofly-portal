# 📧 Email System - Quick Reference Card

## ✅ Status: COMPLETE & READY

---

## 🚀 **2-Minute Setup**

### 1. Get Resend API Key
```
https://resend.com/api-keys
→ Sign up (FREE: 3,000 emails/month)
→ Create API Key
→ Copy key (starts with re_)
```

### 2. Add to .env.local
```bash
RESEND_API_KEY=re_your_actual_key_here
```

### 3. Test It!
```bash
# Start server
npm run dev

# Test email endpoint (replace with your email)
curl 'http://localhost:3000/api/test/email?type=booking&email=you@example.com'

# Expected: ✅ Email sent successfully
```

---

## 📧 **Email Types**

| Type | Trigger | Sent To | Template |
|------|---------|---------|----------|
| **Booking Confirmation** | Payment success | Customer | Professional with confirmation # |
| **Owner Notification** | Payment success | Owner | New booking alert with details |
| **Payment Failure** | Payment failed | Customer | Error + retry instructions |

---

## 🔧 **Integration Points**

| File | Purpose |
|------|---------|
| `/src/utils/email.ts` | Email service & templates (498 lines) |
| `/src/app/api/hangarshare/webhook/stripe/route.ts` | Stripe webhook → emails |
| `/src/app/api/test/email/route.ts` | Test endpoint |
| `/src/migrations/013_create_notifications_table.sql` | In-app notifications |

---

## 🧪 **Testing Commands**

```bash
# Booking confirmation email
curl 'http://localhost:3000/api/test/email?type=booking&email=YOUR@EMAIL.com'

# Owner notification email
curl 'http://localhost:3000/api/test/email?type=owner&email=YOUR@EMAIL.com'

# Payment failure email
curl 'http://localhost:3000/api/test/email?type=failure&email=YOUR@EMAIL.com'
```

---

## 🔍 **Debugging**

**Email not sending?**
```bash
# Check if key is set
grep RESEND .env.local

# Check server logs for errors
# Look for: ✅ Email sent or ❌ Error sending email
```

**Test Resend API directly:**
```bash
curl https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your@email.com",
    "subject": "Test",
    "html": "<p>It works!</p>"
  }'
```

---

## 📊 **What Happens When User Books**

```
1. User pays → Stripe webhook fires
2. Booking status updated to "confirmed"
3. System queries user & hangar details
4. Sends confirmation email to customer ✉️
5. Sends notification to owner ✉️
6. Creates in-app notifications for both
```

---

## 💰 **Cost**

- **Resend FREE tier:** 3,000 emails/month
- **Resend PRO:** $20/month for 50,000 emails
- **Current usage:** ~3 emails per booking (confirmation + owner + maybe failure)

**Estimate:** Can handle ~1,000 bookings/month on free tier

---

## 📚 **Docs**

- Full guide: [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)
- Resend docs: https://resend.com/docs
- Test emails: https://resend.com/emails

---

## ✅ **What's Done**

- [x] Email service with 3 professional templates
- [x] Stripe webhook integration
- [x] In-app notifications system
- [x] Database migration executed
- [x] Test endpoint created
- [x] Error handling & logging
- [x] Responsive HTML emails
- [ ] **YOU NEED:** Add Resend API key to `.env.local`

---

## 🎯 **Next Step**

**Get your Resend API key NOW → Takes 2 minutes!**

1. Go to https://resend.com
2. Sign up with GitHub/Google
3. Create API key
4. Add to `.env.local`
5. Test with: `curl 'http://localhost:3000/api/test/email?type=booking&email=YOU@EMAIL.com'`

**That's it!** 🎉
