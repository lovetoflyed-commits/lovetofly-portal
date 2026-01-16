# Security & Monitoring - Quick Setup Guide

**5-Minute Setup for Sentry + Upstash**

---

## Step 1: Sentry Setup (2 minutes)

### Create Sentry Account
1. Go to [sentry.io/signup](https://sentry.io/signup/)
2. Sign up with GitHub or email
3. Click "Create Project"
4. Select "Next.js" as platform
5. Name it "love-to-fly-portal"

### Get Your DSN
1. After project creation, copy the **DSN** shown
2. Format: `https://abc123@o456789.ingest.sentry.io/789012`

### Add to Environment
```bash
# .env.local (for local development)
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project
```

### Netlify Deployment
1. Go to Netlify dashboard → Your site → Site settings
2. Navigate to "Environment variables"
3. Click "Add a variable"
4. Add:
   - **Key:** `NEXT_PUBLIC_SENTRY_DSN`
   - **Value:** (paste your DSN)
   - **Scopes:** All (Production, Deploy previews, Branch deploys)
5. Click "Create variable"

### Verify It Works
```bash
# Restart dev server
npm run dev

# Check browser console - should see Sentry initialized
# Or trigger a test error:
# Add this to any page: throw new Error("Test Sentry");
```

---

## Step 2: Upstash Redis Setup (3 minutes)

### Create Upstash Account
1. Go to [upstash.com](https://upstash.com/)
2. Sign up with GitHub or email (free tier available)
3. Click "Create Database"

### Configure Database
1. **Name:** love-to-fly-ratelimit
2. **Type:** Regional (select closest to your users)
3. **Region:** Choose one (e.g., US East, São Paulo, Frankfurt)
4. **Eviction:** No eviction
5. Click "Create"

### Get Your Credentials
1. After creation, click "REST API" tab
2. Copy two values:
   - `UPSTASH_REDIS_REST_URL` (e.g., `https://abc-xyz.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (long token string)

### Add to Environment
```bash
# .env.local (for local development)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-long-token-here
```

### Netlify Deployment
1. Go to Netlify → Site settings → Environment variables
2. Add variable:
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** (paste URL)
   - **Scopes:** All
3. Add variable:
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** (paste token)
   - **Scopes:** All
4. Click "Create variable" for each

### Verify It Works
```bash
# Restart dev server
npm run dev

# Check terminal - should NOT see warnings like:
# "Rate limiting not configured"

# Test rate limiting:
# Make 10 rapid login attempts - 6th should return 429
```

---

## Step 3: Test Everything

### Local Testing
```bash
# 1. Check environment variables loaded
echo $NEXT_PUBLIC_SENTRY_DSN
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# 2. Restart dev server
npm run dev

# 3. Run verification tests
bash test-security-monitoring.sh
```

**Expected output:**
```
==========================================
Test Results: 10/10 tests passed
==========================================
✓ ALL TESTS PASSED - Security & Monitoring Verified
```

### Browser Testing

**Test Sentry:**
1. Open browser console
2. Look for: `[Sentry] Successfully initialized`
3. Trigger test error: Open console and run:
   ```javascript
   throw new Error("Test Sentry integration");
   ```
4. Check Sentry dashboard - should see error within 1 minute

**Test Rate Limiting:**
1. Open login page
2. Enter wrong password
3. Submit 6 times rapidly
4. 6th attempt should show: "Too many login attempts. Please try again later."
5. Wait 1 minute, try again - should work

---

## Step 4: Configure Alerts (Optional but Recommended)

### Sentry Alerts
1. Go to Sentry project → Settings → Alerts
2. Click "Create Alert"
3. Select "Issues"
4. Configure:
   - **When:** More than 10 events in 1 minute
   - **Then:** Send notification to email
5. Save alert

### Upstash Monitoring
1. Go to Upstash dashboard
2. Click your database
3. Click "Analytics" tab
4. View real-time rate limit stats

---

## Troubleshooting

### Issue: Sentry Not Capturing Errors

**Check:**
```bash
# 1. Environment variable is set
echo $NEXT_PUBLIC_SENTRY_DSN

# 2. Variable starts with NEXT_PUBLIC_
# This is required for client-side access!

# 3. Restart dev server after adding variable
pkill -f "next dev" && npm run dev
```

### Issue: Rate Limiting Not Working

**Check:**
```bash
# 1. Both variables are set
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# 2. Check for warnings in terminal:
npm run dev
# Should NOT see: "Rate limiting not configured"

# 3. Verify Upstash database is active
# Go to upstash.com → Databases → Your database
# Status should be "Active"
```

### Issue: Rate Limit Always Passes

**Cause:** Using localhost/127.0.0.1 all requests have same IP

**Solution:** 
- This is expected in local development
- Rate limiting works per IP address
- In production (Netlify), each user has different IP

---

## What Each Variable Does

### NEXT_PUBLIC_SENTRY_DSN
- **Purpose:** Sends errors to Sentry dashboard
- **If missing:** Errors only logged to console (no tracking)
- **Cost:** Free up to 5,000 errors/month
- **Security:** Safe to expose (it's a public DSN)

### UPSTASH_REDIS_REST_URL
- **Purpose:** Connection URL for Redis rate limiting
- **If missing:** All requests allowed (no rate limiting)
- **Cost:** Free up to 10,000 commands/day
- **Security:** Keep private (internal URL)

### UPSTASH_REDIS_REST_TOKEN
- **Purpose:** Authentication token for Redis
- **If missing:** All requests allowed (no rate limiting)
- **Cost:** Included in free tier
- **Security:** Keep private (like a password)

---

## Quick Reference

### Free Tier Limits
| Service | Free Tier | Sufficient For |
|---------|-----------|----------------|
| Sentry | 5,000 errors/month | MVP + first 3-6 months |
| Upstash | 10,000 commands/day | ~1,000 active users/day |

### Upgrade Triggers
- **Sentry:** When exceeding 5,000 errors/month (need Team plan: $26/mo)
- **Upstash:** When exceeding 10,000 commands/day (pay-as-you-go: $0.20/100k)

### Environment Variable Checklist

**Local Development (.env.local):**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Netlify (Environment Variables):**
- ✅ NEXT_PUBLIC_SENTRY_DSN (Production, Deploys, Branches)
- ✅ UPSTASH_REDIS_REST_URL (Production, Deploys, Branches)
- ✅ UPSTASH_REDIS_REST_TOKEN (Production, Deploys, Branches)

---

## Post-Setup Verification

### ✅ Checklist
- [ ] Sentry account created
- [ ] Sentry DSN added to `.env.local`
- [ ] Sentry DSN added to Netlify
- [ ] Upstash database created
- [ ] Upstash credentials added to `.env.local`
- [ ] Upstash credentials added to Netlify
- [ ] Dev server restarted
- [ ] Test script passes (10/10)
- [ ] Sentry captures test error
- [ ] Rate limiting blocks 6th login attempt

### Verify Commands
```bash
# 1. Check env variables
cat .env.local | grep SENTRY
cat .env.local | grep UPSTASH

# 2. Run tests
bash test-security-monitoring.sh

# 3. Check for warnings
npm run dev
# Should NOT see: "Rate limiting not configured"
```

---

## Need Help?

### Documentation
- **Sentry:** [docs.sentry.io/platforms/javascript/guides/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- **Upstash:** [docs.upstash.com/redis](https://docs.upstash.com/redis)
- **Full guide:** See `SECURITY_MONITORING_COMPLETE.md`

### Common Questions

**Q: Do I need both Sentry and Upstash?**  
A: Both recommended, but system works without them. They provide:
- Sentry: See production errors before users report them
- Upstash: Prevent abuse and DDoS attacks

**Q: Can I use free tiers forever?**  
A: Yes, until you exceed limits. For 1,000 users:
- Sentry: ~1,000 errors/month (well under 5,000 limit)
- Upstash: ~10,000 commands/day (at limit, may need upgrade)

**Q: What happens if I don't set these up?**  
A: System runs normally but:
- No error tracking (you won't know about production bugs)
- No rate limiting (vulnerable to abuse/DDoS)
- Console warnings in development

---

**Setup time:** 5 minutes  
**Cost:** $0/month (free tiers)  
**Production ready:** Yes, with these variables set  

Next: Run `npm run dev` and verify no warnings appear!
