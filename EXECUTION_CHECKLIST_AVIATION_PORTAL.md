# Execution Checklist — Aviation Portal (2026-01-28)

Objective: Close the competitive gaps fast with minimal rework. Prioritized by liquidity, trust, and monetization.

## Week 1–2: Liquidity + Verification (Highest ROI)
1) [x] Approve pending HangarShare listings
   - Action: Admin review workflow
   - Files: /src/app/admin/hangarshare/listings/pending/page.tsx
   - Output: Listings visible in /hangarshare/search

2) [x] Seed classifieds + forum with real data
   - Action: Seed scripts for aircraft/parts/avionics + forum topics
   - Files: /scripts/seeds/*, /src/app/classifieds/*, /src/app/forum/*
   - Output: Non-empty marketplace + engagement starter

3) [x] Verification badge + “verified only” filter
   - Action: Add badge to listing cards + filter toggle in search
   - Files: /src/app/hangarshare/search/page.tsx, /src/app/hangarshare/listing/[id]/page.tsx
   - Output: Trust signal aligned with competitors gap

## Week 2–3: Media + Listing Controls
4) [x] Cloud storage for photos (S3/Blob)
   - Action: Replace local uploads with signed URLs
   - Files: /src/app/api/*/upload*, /src/utils/*, /src/app/hangarshare/listing/create/page.tsx
   - Output: Scalable storage

5) [x] Multi-photo reorder + edit/pause listing
   - Action: Add reorder UI, update listing status and history
   - Files: /src/app/hangarshare/listing/[id]/edit/page.tsx, /src/app/api/hangarshare/listing/*
   - Output: Pro-grade listing management

## Week 3–4: Monetization + Antifraud
6) [x] Classifieds payment + escrow
   - Action: Stripe payment intent + escrow flow for classifieds
   - Files: /src/app/api/classifieds/*, /src/app/classifieds/*
   - Output: Monetization differentiator

7) [x] Cancel/refund policy enforcement
   - Action: Booking status transitions + refund triggers
   - Files: /src/app/api/hangarshare/booking/*, /src/utils/email.ts
   - Output: Clear and auditable policy

## Week 4–5: Trust + Community
8) [x] Reviews/ratings + seller score
   - Action: Verified reviews, rating aggregation
   - Files: /src/app/api/hangarshare/reviews/route.ts, /src/app/hangarshare/listing/[id]/page.tsx
   - Output: Social proof

9) [x] Moderation + reporting SLA
   - Action: Report buttons + admin queue
   - Files: /src/app/*/page.tsx, /src/app/admin/moderation/page.tsx
   - Output: Safer community

## Week 5–6: SEO + Analytics + Docs
10) [x] SEO schema + indexable pages
   - Action: Add structured data + optimize metadata
   - Files: /src/app/**/page.tsx, /src/app/layout.tsx
   - Output: Competitive SEO positioning

11) [x] Owner analytics + PDF/CSV export
   - Action: Ensure metrics + export actions work
   - Files: /src/app/hangarshare/owner/analytics/page.tsx, /src/utils/*
   - Output: Business-grade reporting

12) [x] LGPD + support/SLA docs
   - Action: Create privacy/terms/support pages
   - Files: /documentation/*, /src/app/*
   - Output: Compliance + trust

---

## Canonical Route Map (do not duplicate)
- /hangarshare/* (user) and /hangarshare/owner/* (owner)
- /admin/hangarshare/* (admin)
- /classifieds/*
- /tools/*
- /profile/*
- /logbook

## Notes
- Keep redirects for one release, then delete deprecated pages.
- Prioritize trust + liquidity before feature expansion.
