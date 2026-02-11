# 📸 Hangar Owner Image Upload Implementation

## ✅ Complete Solution Implemented

Hangar owners **MUST upload a high-quality hangar image** when registering a listing. Image storage is fully configurable for different environments.

---

## 🎯 Key Features

### 1. **Mandatory Image Upload During Registration**
- Owners cannot create a listing without providing an image
- Image validated (type, size, format)
- Automatic notification sent to admin
- Listing status: `pending` (awaiting approval)

### 2. **Flexible Storage Options**
| Provider | Best For | Setup | Cost |
|----------|----------|-------|------|
| **Local** (`public/hangars/`) | Development | None | Free |
| **AWS S3** | Production | 10 min | ~$20-30/100 hangars |
| **Cloudinary** | Easy Production | 5 min | Free tier: 25GB |

### 3. **Complete Image Management**
- Primary image (required at registration)
- Secondary images (owners can add up to 5 total)
- Image metadata tracking (size, type, upload date)
- Storage provider tracking
- Audit trail (who uploaded, when)

### 4. **Database Schema**
- `hangar_image_uploads` - Full upload history
- Image tracking columns on `hangar_listings`
- Validation rules configurable in DB

---

## 📁 Where Images Are Stored

### Development:
```
public/hangars/
├── hangar-6-a1b2c3d4.jpg
├── hangar-7-e5f6g7h8.jpg
└── ...
```
- Automatically served by Next.js
- No configuration needed

### Production (AWS S3):
```
s3://lovetofly-hangars/
└── hangars/
    ├── 6/
    │   ├── hangar-6-primary.jpg
    │   └── hangar-6-secondary.jpg
    └── 7/
        └── hangar-7-primary.jpg
```
- Globally distributed
- Automatic CDN via CloudFront
- Versioning + backup available

### Production (Cloudinary):
```
https://res.cloudinary.com/{cloud-name}/
└── lovetofly/
    └── hangars/
        ├── 6-primary
        └── 7-primary
```
- Automatic image optimization
- Built-in CDN
- No additional infrastructure

---

## 🔧 Implementation Details

### New Database Tables:
```sql
hangar_image_uploads (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER,        -- FK to hangar_listings
  image_url VARCHAR(500),    -- Public URL
  image_key VARCHAR(500),    -- Storage provider key
  file_size INTEGER,         -- Bytes
  file_type VARCHAR(50),     -- image/jpeg, etc.
  is_primary BOOLEAN,        -- First image = primary
  storage_provider VARCHAR,  -- 'local', 's3', 'cloudinary'
  uploaded_by INTEGER,       -- User ID (FK)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

image_validation_rules (
  rule_name VARCHAR UNIQUE,
  max_file_size INTEGER,     -- Bytes (5MB default)
  allowed_types TEXT[],      -- MIME types
  min_width INTEGER,         -- Pixels (800 default)
  min_height INTEGER,        -- Pixels (600 default)
  required_for_listing BOOLEAN
);
```

### New Columns on `hangar_listings`:
```sql
image_url VARCHAR(500)       -- Current primary image
image_key VARCHAR(500)       -- Storage provider key
image_uploaded_at TIMESTAMP  -- Upload timestamp
images_count INTEGER         -- Total images
```

---

## 🔌 API Endpoints

### 1️⃣ **Create Listing WITH Image** (Mandatory)
```
POST /api/hangarshare/listings/create-with-image

Form Data (multipart):
- owner_id: integer
- hangar_number: string (required)
- aerodrome_name: string (required)  
- city: string (required)
- description: string
- hourly_rate: number
- daily_rate: number
- monthly_rate: number
- image: File (required, max 5MB, JPG/PNG/WebP)

Success Response (201):
{
  "success": true,
  "message": "Listing created with image. Pending admin approval.",
  "data": {
    "listingId": 26,
    "hangarNumber": "H-NEW",
    "imageUrl": "https://...",
    "status": "pending"
  }
}

Error Response (400 - No Image):
{
  "message": "Hangar image is required to register a listing",
  "code": "IMAGE_REQUIRED"
}
```

### 2️⃣ **Upload Additional Images** (After listing created)
```
POST /api/hangarshare/listings/[id]/upload-image

Form Data:
- image: File (max 5MB, JPG/PNG/WebP)

Response:
{
  "success": true,
  "data": {
    "listingId": 26,
    "imageUrl": "https://...",
    "uploadedAt": "2026-01-13T..."
  }
}
```

### 3️⃣ **Get All Listing Images**
```
GET /api/hangarshare/listings/[id]/images

Response:
{
  "success": true,
  "data": {
    "listing": {
      "id": 26,
      "hangar_number": "H-NEW",
      "image_url": "https://..."
    },
    "images": {
      "primary": {
        "id": 1,
        "image_url": "https://...",
        "is_primary": true,
        "created_at": "2026-01-13T..."
      },
      "secondary": [
        { "id": 2, "image_url": "https://..." },
        { "id": 3, "image_url": "https://..." }
      ],
      "total": 3
    }
  }
}
```

---

## 📋 Migration Required

Run the image tracking migration:

```bash
npm run migrate:up
```

Creates:
- ✅ `hangar_image_uploads` table
- ✅ `image_validation_rules` table
- ✅ Image columns on `hangar_listings`
- ✅ Triggers for auto-update
- ✅ Indexes for performance

---

## 🚀 Environment Configuration

### Development (Default - No setup needed):
```env
# .env.local
IMAGE_STORAGE_PROVIDER=local  # Default
```

Images stored in: `public/hangars/`

### Production - AWS S3:
```env
IMAGE_STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=lovetofly-hangars
```

Setup time: ~10 minutes  
Monthly cost: ~$20-30 for 100 hangars

### Production - Cloudinary:
```env
IMAGE_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

Setup time: ~5 minutes  
Free tier: 25 GB (covers ~200 hangars)

---

## 📦 Required Dependencies

For S3:
```bash
npm install @aws-sdk/client-s3
```

For Cloudinary:
```bash
npm install cloudinary
```

Local storage: Already included ✅

---

## 🔒 Validation Rules

### Current Defaults:
- **Max file size**: 5 MB
- **Allowed types**: JPG, PNG, WebP
- **Min dimensions**: 800x600 (soft)
- **Required**: YES (blocking)

### Update Rules (if needed):
```sql
UPDATE image_validation_rules
SET max_file_size = 10485760  -- 10 MB
WHERE rule_name = 'hangar_primary_image';
```

---

## 💡 How It Works

### Registration Flow:
```
1. Owner visits /hangarshare/listing/create
2. Fills in hangar details (name, location, rates)
3. Uploads hangar image (MANDATORY)
   ├─ Client validates: type, size
   ├─ Sends to API with form data
   └─ Server validates again (double-check)
4. API creates listing with image
   ├─ Transaction: create + upload + log
   └─ Listing status = 'pending'
5. Admin notified
   ├─ In-app notification
   └─ Email alert (if configured)
6. Admin approves listing
   └─ Status changes to 'available'
   └─ Owners can now accept bookings
```

### Image Upload Component:
- `HangarImageUpload.tsx` - Reusable component
- Preview before submit
- Real-time error messages
- Progress tracking
- Drag-and-drop support

---

## 📊 Database Queries

### Get all hangars by upload status:
```sql
SELECT 
  hl.id, hl.hangar_number, 
  COUNT(hiu.id) as images_count,
  hiu.storage_provider
FROM hangar_listings hl
LEFT JOIN hangar_image_uploads hiu ON hl.id = hiu.listing_id
GROUP BY hl.id
ORDER BY images_count DESC;
```

### Find listings missing images:
```sql
SELECT id, hangar_number, city
FROM hangar_listings
WHERE image_url IS NULL;
```

### Get upload statistics:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as uploads,
  SUM(file_size)/1024/1024 as size_mb,
  storage_provider
FROM hangar_image_uploads
GROUP BY DATE(created_at), storage_provider
ORDER BY date DESC;
```

---

## 🎯 Files Created/Modified

### New Files:
1. `src/config/image-storage.ts` - Storage provider abstraction
2. `src/app/api/hangarshare/listings/create-with-image/route.ts` - Mandatory upload
3. `src/app/api/hangarshare/listings/[id]/images/route.ts` - Get all images
4. `src/migrations/051_add_image_tracking.sql` - Database schema
5. `scripts/migrate-images-to-s3.js` - Local-to-S3 migration
6. `IMAGE_STORAGE_GUIDE.md` - Complete setup guide

### Modified Files:
1. `src/app/api/hangarshare/listings/[id]/upload-image/route.ts` - Now uses storage config

---

## 🧪 Testing

### Test Local Upload:
```bash
curl -X POST http://localhost:3000/api/hangarshare/listings/create-with-image \
  -F "owner_id=1" \
  -F "hangar_number=H-TEST" \
  -F "aerodrome_name=Test Aerodrome" \
  -F "city=Test City" \
  -F "image=@/path/to/image.jpg"
```

### Test S3 Upload (after config):
```bash
# Set S3 env vars
export IMAGE_STORAGE_PROVIDER=s3
export AWS_REGION=us-east-1
# etc...

# Run test
npm test -- image-upload.test.ts
```

---

## 🔄 Migration Path

### For Existing Installations:

**Step 1**: Update code
```bash
git pull origin main
```

**Step 2**: Run migration
```bash
npm run migrate:up
```

**Step 3**: Choose storage (or keep local):
```bash
# For S3 migration:
node scripts/migrate-images-to-s3.js
```

**Step 4**: Update .env.local
```env
IMAGE_STORAGE_PROVIDER=s3  # or cloudinary, or local
AWS_REGION=us-east-1
# ... other vars
```

**Step 5**: Deploy
```bash
npm run build
npm run start
```

---

## 📞 Troubleshooting

### Image upload fails:
1. Check file size: `ls -lh image.jpg`
2. Check mime type: `file image.jpg`
3. Verify permissions: `ls -la public/hangars/`
4. Check env vars: `echo $IMAGE_STORAGE_PROVIDER`

### S3 upload not working:
1. Verify AWS credentials: `aws sts get-caller-identity`
2. Check bucket permissions: `aws s3 ls s3://bucket-name`
3. Verify public access enabled: S3 Console → Permissions

### Images not loading:
1. Check URL in DB: `SELECT image_url FROM hangar_listings`
2. Test URL directly in browser
3. Check CORS headers (S3)
4. Verify storage provider matches env var

---

## 🎓 Summary

✅ **Image upload is now MANDATORY** during hangar registration
✅ **Storage is flexible**: Local dev, S3 or Cloudinary for production
✅ **Fully audited**: Track every upload with metadata
✅ **Production-ready**: Migration scripts, monitoring, error handling
✅ **Scalable**: Supports CDN, caching, versioning

**Owners must provide high-quality hangar photos to list their spaces.**

---

Generated: January 13, 2026
