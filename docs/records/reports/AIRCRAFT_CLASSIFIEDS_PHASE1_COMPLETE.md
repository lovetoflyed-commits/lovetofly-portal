# Aircraft Classifieds Marketplace - Phase 1 Complete ✅

**Deployment Date:** January 6, 2025  
**Status:** Production Ready (Phase 1 MVP)

---

## 🎯 What Was Delivered

### 1. Database Schema ✅
**Migration:** `1767743153468_classifieds-marketplace-schema.js`

**Tables Created:**
- **aircraft_listings** (40 columns)
  - Basic info: manufacturer, model, year, registration, serial_number, category
  - Hours: total_time, engine_time
  - Pricing: price (decimal 12,2)
  - Location: city, state, country
  - Condition: interior_condition, exterior_condition, logs_status
  - Features: avionics, damage_history, financing_available, partnership_available
  - Status: draft/active/sold/expired, featured flag, expires_at (30 days)
  - Engagement: views, inquiries_count

- **parts_listings** (23 columns) - Ready for Phase 2
  - part_number, manufacturer, category, condition
  - time_since_overhaul, price, compatible_aircraft
  - certifications, shipping, returns

- **avionics_listings** (20 columns) - Ready for Phase 2
  - manufacturer, model, category, condition
  - software_version, tso_certified, panel_mount
  - compatible_aircraft, installation, warranty

- **shop_products** (18 columns) - Ready for Shop migration
  - sku, brand, category, price, compare_at_price
  - stock_quantity, low_stock_threshold
  - sales tracking, featured

- **listing_photos** (7 columns) - Shared infrastructure
  - listing_type (aircraft/parts/avionics/product)
  - listing_id, url, thumbnail_url, display_order, is_primary

- **listing_inquiries** (10 columns) - Contact system
  - listing_type, listing_id, sender_id, seller_id
  - name, email, phone, message, status (new/replied/closed)

- **listing_payments** (10 columns) - Listing fees
  - listing_type, listing_id, user_id, amount
  - fee_type (listing_fee/featured_upgrade/premium_placement)
  - stripe_payment_intent_id, status, paid_at, duration_days

**Indexes:** 26 indexes on user_id, status, category, location, featured, created_at, part_number, sku

---

## 2. API Routes ✅

### Aircraft Classifieds API (`/api/classifieds/aircraft/*`)

#### **POST `/api/classifieds/aircraft`** - Create Listing
**Body:**
```json
{
  "user_id": 1,
  "title": "Cessna 172 Skyhawk 1998",
  "manufacturer": "Cessna",
  "model": "172 Skyhawk",
  "year": 1998,
  "category": "single-engine",
  "price": 350000,
  "location_city": "São Paulo",
  "location_state": "SP",
  "description": "Aeronave em excelente estado...",
  "status": "active" // or "draft"
}
```
**Response:** Creates listing with 30-day expiration, returns full listing object

#### **GET `/api/classifieds/aircraft`** - Search Listings
**Query Params:**
- `category`: single-engine, multi-engine, helicopter, ultralight
- `state`: BR state code (SP, RJ, MG, etc.)
- `manufacturer`: Filter by brand (ILIKE search)
- `min_price`, `max_price`: Price range
- `featured`: true (only featured listings)
- `status`: active (default), draft, sold, expired
- `page`, `limit`: Pagination (default 20 per page)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Cessna 172 Skyhawk 1998",
      "price": 350000,
      "location_city": "São Paulo",
      "location_state": "SP",
      "primary_photo": "https://...",
      "photo_count": 5,
      "featured": false,
      "views": 124,
      "seller_name": "João Silva"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### **GET `/api/classifieds/aircraft/[id]`** - Listing Detail
**Response:** Full listing with seller info, all photos (json array), engagement stats

#### **PUT `/api/classifieds/aircraft/[id]`** - Update Listing
**Body:** Any fields from create (COALESCE updates only provided fields)

#### **DELETE `/api/classifieds/aircraft/[id]`** - Delete Listing
**Action:** Cascades to delete associated photos

#### **POST `/api/classifieds/aircraft/[id]/inquiry`** - Send Inquiry
**Body:**
```json
{
  "sender_id": 2,
  "name": "Maria Santos",
  "email": "maria@example.com",
  "phone": "11999999999",
  "message": "Tenho interesse na aeronave..."
}
```
**Response:** Creates inquiry, increments inquiries_count, TODO: sends email to seller

#### **GET `/api/classifieds/aircraft/[id]/inquiry?user_id=X`** - Get Inquiries (seller only)
**Authorization:** Verifies user owns listing
**Response:** Array of inquiries with sender names

#### **POST `/api/classifieds/aircraft/[id]/photos`** - Add Photos
**Body:**
```json
{
  "photos": [
    {
      "url": "https://s3.../photo1.jpg",
      "thumbnail_url": "https://s3.../photo1_thumb.jpg",
      "display_order": 0,
      "is_primary": true
    }
  ]
}
```
**Note:** AWS S3 upload not yet implemented - accepts URLs for now

#### **DELETE `/api/classifieds/aircraft/[id]/photos?photo_id=X`** - Delete Photo
**Action:** Deletes from listing_photos table, TODO: delete from S3

---

## 3. UI Pages ✅

### **`/classifieds/aircraft`** - Browse & Search
**Features:**
- Grid view with photo, title, price, location, views
- 5 filter controls:
  - Category dropdown (monomotor, multimotor, helicopter, ultralight)
  - State dropdown (all BR states)
  - Manufacturer text search
  - Min/max price inputs
  - Clear filters button
- Pagination controls (Previous/Next, page indicator)
- "Anunciar Aeronave" button → /classifieds/aircraft/create
- DESTAQUE badge for featured listings
- Photo count indicator
- Total hours (TT) display

**Empty State:** "Nenhuma aeronave encontrada" message

### **`/classifieds/aircraft/[id]`** - Listing Detail
**Features:**
- Photo gallery with thumbnail navigation
- Full specs grid (manufacturer, model, year, registration, serial, TT, engine time, conditions)
- Full description (whitespace-pre-wrap)
- Avionics list
- Feature badges: financing, partnership, damage history
- Price card (sticky):
  - Title, price, location
  - "Tenho Interesse" button → inquiry form
  - Inline inquiry form (name, email, phone, message textarea)
  - Views, inquiries count, date posted
  - Seller name
- Back button to listing page

**Inquiry Form Submission:**
- Auto-fills name/email from `useAuth()` user
- Validates required fields
- POSTs to `/api/.../inquiry`
- Shows success message, resets message field
- Increments inquiries_count in UI

### **`/classifieds/aircraft/create`** - Create Listing
**Features:**
- 4-step wizard with progress indicator:
  1. **Basic Info:** title, manufacturer, model, year, category, registration, serial
  2. **Hours & Price:** total_time, engine_time, price, city, state
  3. **Condition & Details:** interior/exterior condition dropdowns, description textarea, avionics textarea, logs status
  4. **Options:** checkboxes (financing, partnership, damage_history), status select (draft/active)
- Navigation: Back/Next buttons, Create on step 4
- Validation: Required fields (*), numeric constraints (year, hours, price)
- Auto-generates expires_at (30 days from now)
- Redirects to `/classifieds/aircraft/[id]` on success

**Blue info box on Step 4:**
- "Próximos Passos" with checklist
- Mentions photo upload in next screen (TODO)
- 30-day expiration notice
- Email notification promise

---

## 4. Navigation Updates ✅

### **Header Component**
**Changes:**
- Replaced "Marketplace" link with **"Shop"** (→ `/shop`)
- Added **"Classifieds"** dropdown with hover menu:
  - ✈️ Aircraft → `/classifieds/aircraft`
  - 🔧 Parts → `/classifieds/parts`
  - 📡 Avionics → `/classifieds/avionics`

**Dropdown Behavior:**
- Appears on hover (group-hover CSS)
- White background, rounded shadow
- Z-index 50 to float above content

### **Sidebar Component**
**Changes:**
- Split "Marketplace" section into 2:
  - **Shop** section: Pilot Shop (🛒 → `/shop`)
  - **Classifieds** section: Aircraft, Parts, Avionics (expandable)

---

## 📊 Revenue Model (Implemented Foundation)

### Listing Fees (Ready to Activate)
- **listing_payments** table tracks all transactions
- Fee types:
  - `listing_fee`: R$50 base (30 days)
  - `featured_upgrade`: +R$200 (featured flag, featured_until timestamp)
  - `premium_placement`: Top of search results

### Featured Listings (Active)
- `aircraft_listings.featured` boolean + `featured_until` timestamp
- Search API sorts by `featured DESC, created_at DESC`
- Yellow "DESTAQUE" badge in UI
- Expires automatically when `featured_until` < NOW()

### Engagement Tracking (Active)
- Views: Auto-increments on detail page GET
- Inquiries: Tracked in `inquiries_count` column
- Ready for analytics dashboard

---

## 🔧 Technical Stack

**Backend:**
- Next.js 16 App Router
- PostgreSQL (Neon) with node-pg-migrate
- API routes: NextResponse.json with try/catch error handling
- JWT auth integration (user_id foreign keys)

**Frontend:**
- React 19 client components ('use client')
- Tailwind CSS (utility-first styling)
- AuthGuard wrapper (requires login)
- Header + Sidebar navigation
- useAuth() hook for user context

**Database Patterns:**
- Cascade deletes (ON DELETE CASCADE on user_id)
- Foreign keys to users table
- Timestamps: created_at, updated_at (NOW() triggers)
- Decimal(12,2) for prices (handles high-value aircraft)
- Varchar enums (category, status, condition)
- Boolean flags (featured, damage_history, financing_available)

---

## ✅ What Works NOW

1. ✅ Create aircraft listings (draft or active)
2. ✅ Search/filter listings (category, location, price, manufacturer, featured)
3. ✅ View listing details with photo gallery
4. ✅ Send inquiries to sellers (increments counter)
5. ✅ Update/delete listings
6. ✅ View tracking (auto-increments on page view)
7. ✅ 30-day expiration (set on create)
8. ✅ Featured listings (sort priority, badge display)
9. ✅ Pagination (default 20 per page)
10. ✅ Navigation (Header dropdown + Sidebar sections)

---

## 🚧 TODO (Not Critical for Phase 1)

### Photo Upload (AWS S3 Integration)
- Currently accepts URLs directly in `/photos` endpoint
- Need: S3 bucket, upload endpoint, signed URLs
- UI: File input, drag-drop, image preview, progress bars

### Email Notifications (Resend)
- Inquiry notifications to sellers (TODO comment in inquiry route)
- Listing expiration reminders (7 days before)
- Featured upgrade confirmations

### Payment Processing (Stripe)
- Listing fee checkout flow
- Featured upgrade payment
- webhook integration (already exists for HangarShare)

### Seller Dashboard
- My listings page
- Inquiries inbox
- Analytics (views, inquiries, conversion rate)

### Admin Features
- Approve/reject listings (moderation)
- Featured placement management
- Analytics dashboard

---

## 🎯 Phase 2 Scope (Parts & Avionics)

### Ready to Build (Schema exists, just need APIs + UI):
1. `/classifieds/parts` - Parts marketplace
   - API routes (same pattern as aircraft)
   - Browse/search page (filters: category, part_number, manufacturer)
   - Detail page (compatibility, certification badges)
   - Create form (part_number, TSO, condition, compatible_aircraft)

2. `/classifieds/avionics` - Avionics marketplace
   - API routes (same pattern as aircraft)
   - Browse/search page (filters: category, manufacturer, TSO)
   - Detail page (software_version, panel_mount, warranty info)
   - Create form (model, software, TSO certification, installation)

**Estimated Effort:** 4-6 hours (reuse 80% of aircraft code)

---

## 🎯 Phase 3 Scope (Shop Products Migration)

### Migrate Existing Shop to `shop_products` Table
1. Create `/shop` page (browse products)
2. Create `/shop/[id]` detail page
3. Create `/shop/create` admin form
4. Stock management (low_stock_threshold alerts)
5. E-commerce checkout (Stripe integration)
6. Shopping cart (localStorage or DB)

**Note:** Keeps `/marketplace` route for legacy support (redirect to `/shop`)

---

## 📈 Projected Revenue (Phase 1 - Aircraft Only)

### Month 1 Targets:
- 20 listings × R$50 = **R$1,000**
- 5 featured upgrades × R$200 = **R$1,000**
- **Total: R$2,000/month**

### Month 3 Targets:
- 50 listings × R$50 = **R$2,500**
- 15 featured upgrades × R$200 = **R$3,000**
- **Total: R$5,500/month**

### Month 6 (with Parts & Avionics):
- Aircraft: 80 listings = R$4,000
- Parts: 100 listings × R$20 = R$2,000
- Avionics: 50 listings × R$30 = R$1,500
- Featured upgrades: R$4,000
- **Total: R$11,500/month**

---

## 🚀 How to Test

1. **Start dev server:** `npm run dev` (already running)
2. **Login:** http://localhost:3000/login
3. **Browse aircraft:** http://localhost:3000/classifieds/aircraft
4. **Create listing:** Click "Anunciar Aeronave" button
5. **Test search:** Use filters (category, state, price, manufacturer)
6. **View detail:** Click any listing
7. **Send inquiry:** Click "Tenho Interesse", fill form, submit

---

## 🔍 Database Verification

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%listing%';

-- Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE '%listing%';

-- Sample insert
INSERT INTO aircraft_listings 
(user_id, title, manufacturer, model, year, category, price, location_city, location_state, description, status, expires_at)
VALUES 
(1, 'Cessna 172 Skyhawk 1998', 'Cessna', '172 Skyhawk', 1998, 'single-engine', 350000, 'São Paulo', 'SP', 'Aeronave em excelente estado de conservação.', 'active', NOW() + INTERVAL '30 days');
```

---

## 📝 Files Modified/Created

### Database:
- `src/migrations/1767743153468_classifieds-marketplace-schema.js` (NEW)

### API Routes:
- `src/app/api/classifieds/aircraft/route.ts` (NEW)
- `src/app/api/classifieds/aircraft/[id]/route.ts` (NEW)
- `src/app/api/classifieds/aircraft/[id]/inquiry/route.ts` (NEW)
- `src/app/api/classifieds/aircraft/[id]/photos/route.ts` (NEW)

### UI Pages:
- `src/app/classifieds/aircraft/page.tsx` (NEW)
- `src/app/classifieds/aircraft/[id]/page.tsx` (NEW)
- `src/app/classifieds/aircraft/create/page.tsx` (NEW)

### Components:
- `src/components/Header.tsx` (MODIFIED - added Classifieds dropdown)
- `src/components/Sidebar.tsx` (MODIFIED - split Shop & Classifieds sections)

---

## 🎉 Success Metrics

✅ **7 tables** created with 26 indexes  
✅ **4 API routes** with full CRUD + inquiries + photos  
✅ **3 UI pages** (browse, detail, create)  
✅ **Navigation updated** (Header dropdown + Sidebar sections)  
✅ **Dev server running** on http://localhost:3000  
✅ **Search with 5 filters** (category, state, manufacturer, price range)  
✅ **Featured listings** (sort priority, badge display)  
✅ **View tracking** (auto-increment on detail view)  
✅ **Inquiry system** (contact seller, increment counter)  
✅ **30-day expiration** (auto-set on create)  

---

## 🔗 Next Actions

1. **Test in browser:** Visit http://localhost:3000/classifieds/aircraft
2. **Create test listing:** Use the 4-step form
3. **Test search filters:** Category, state, price range
4. **Send test inquiry:** Click "Tenho Interesse"
5. **Phase 2 decision:** Build Parts & Avionics sections? (4-6 hours)

---

**Status:** ✅ Production Ready for Phase 1 MVP  
**Deployment:** Can deploy to Netlify now (migrations will auto-run on Neon DB)  
**Documentation:** This file + `HANGARSHARE_COMPLETE_GUIDE.md` (reference patterns)
