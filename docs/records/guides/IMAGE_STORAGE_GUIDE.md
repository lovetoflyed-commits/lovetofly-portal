# 📸 Hangar Image Storage Configuration Guide

## Overview
Owner-uploaded hangar images are stored using a configurable storage provider system. Supports **3 storage options**:

1. **Local Storage** (Development) - `public/hangars/`
2. **AWS S3** (Production) - Recommended
3. **Cloudinary** (Alternative)

---

## 🎯 Image Upload Flow

### When Owner Registers a Hangar:
```
1. Owner submits listing form with hangar details
2. Owner MUST upload a high-quality hangar image
3. Image uploaded to configured storage provider
4. Listing created with status = 'pending' (awaiting admin approval)
5. Admin notified of new submission
6. Admin approves → listing becomes 'available'
```

**Key Point**: Image upload is **MANDATORY** - listing cannot be created without it.

---

## 💾 Storage Options

### Option 1: Local Storage (Development)
**Default option. No configuration needed.**

```env
# In .env.local
IMAGE_STORAGE_PROVIDER=local
```

**Storage Location**: `public/hangars/`

**Pros**:
- ✅ No external dependencies
- ✅ Instant development
- ✅ Images auto-served by Next.js

**Cons**:
- ❌ Not scalable for production
- ❌ Images lost on server restart
- ❌ Not suitable for multiple server instances

---

### Option 2: AWS S3 (Recommended for Production)

#### Setup Steps:

1. **Create AWS S3 Bucket**:
```bash
# AWS Console:
1. Go to S3 → Create Bucket
2. Bucket name: lovetofly-hangars (or custom)
3. Region: Same as your app (us-east-1 recommended)
4. Block public access: UNCHECK "Block all public access"
5. Enable versioning (optional, for backup)
```

2. **Create IAM User for App**:
```bash
# AWS Console:
1. Go to IAM → Users → Create user
2. Name: lovetofly-app
3. Attach policy: AmazonS3FullAccess (or custom limited policy)
4. Generate access key
5. Copy: Access Key ID & Secret Access Key
```

3. **Update .env.local**:
```env
IMAGE_STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET=lovetofly-hangars
```

4. **Enable Public Access (Optional - for CloudFront)**:
```json
// Bucket Policy (S3 Console → Bucket Policy):
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::lovetofly-hangars/*"
    }
  ]
}
```

**Installation**:
```bash
npm install @aws-sdk/client-s3
```

**Pros**:
- ✅ Highly scalable
- ✅ Built-in redundancy
- ✅ CDN integration (CloudFront)
- ✅ Cost-effective for large volumes
- ✅ Easy backup/versioning

**Cons**:
- ❌ Requires AWS account
- ❌ Monthly costs (storage + bandwidth)
- ❌ Setup complexity

**Pricing Example** (rough estimates):
- Storage: $0.023 per GB/month
- Data transfer: $0.09 per GB/month
- 100 hangars × 3 images × 3MB = ~900 MB: ~$20-30/month

---

### Option 3: Cloudinary (Alternative)

#### Setup Steps:

1. **Create Cloudinary Account**:
```bash
1. Go to https://cloudinary.com
2. Sign up (free tier: 25GB storage)
3. Get credentials from Dashboard
```

2. **Update .env.local**:
```env
IMAGE_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. **Installation**:
```bash
npm install cloudinary
```

**Pros**:
- ✅ Free tier: 25GB (generous)
- ✅ Built-in image optimization
- ✅ Automatic CDN
- ✅ No configuration needed
- ✅ Easy admin dashboard

**Cons**:
- ❌ Less control than S3
- ❌ Depends on third-party uptime

---

## 📋 Database Schema

### `hangar_listings` (New Columns):
```sql
image_url VARCHAR(500)           -- Current image URL
image_key VARCHAR(500)           -- Storage provider key (S3/Cloudinary)
image_uploaded_at TIMESTAMP      -- When image was uploaded
images_count INTEGER             -- Total images uploaded
```

### `hangar_image_uploads` (New Table):
```sql
CREATE TABLE hangar_image_uploads (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER,            -- Hangar listing reference
  image_url VARCHAR(500),        -- Public URL
  image_key VARCHAR(500),        -- Storage provider key
  file_size INTEGER,             -- Bytes
  file_type VARCHAR(50),         -- image/jpeg, etc.
  uploaded_by INTEGER,           -- User ID who uploaded
  is_primary BOOLEAN,            -- Main image (first one is primary)
  storage_provider VARCHAR(50),  -- 'local', 's3', 'cloudinary'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔌 API Endpoints

### 1. Create Listing with Image (Mandatory Image)
```
POST /api/hangarshare/listings/create-with-image

Form Data:
- owner_id: integer
- hangar_number: string (required)
- aerodrome_name: string (required)
- city: string (required)
- description: string
- hourly_rate: number
- daily_rate: number
- monthly_rate: number
- image: File (required, max 5MB)

Response:
{
  "success": true,
  "message": "Listing created with image. Pending admin approval.",
  "data": {
    "listingId": 26,
    "hangarNumber": "H-NEW",
    "imageUrl": "https://...",
    "status": "pending",
    "createdAt": "2026-01-13T..."
  }
}
```

### 2. Upload Additional Images
```
POST /api/hangarshare/listings/[id]/upload-image

Form Data:
- image: File (required, max 5MB)

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

### 3. Get All Listing Images
```
GET /api/hangarshare/listings/[id]/images

Response:
{
  "success": true,
  "data": {
    "primary": { "url": "...", "uploadedAt": "..." },
    "secondary": [
      { "url": "...", "uploadedAt": "..." },
      ...
    ]
  }
}
```

---

## 🛡️ Image Validation Rules

### Current Rules:
- **File Size**: Max 5 MB
- **File Types**: JPG, PNG, WebP
- **Minimum Dimensions**: 800x600px (soft requirement)
- **Required**: YES (listing cannot be created without image)

### Configurable in Database:
```sql
SELECT * FROM image_validation_rules WHERE rule_name = 'hangar_primary_image';
```

Update rules:
```sql
UPDATE image_validation_rules 
SET max_file_size = 10485760  -- 10MB
WHERE rule_name = 'hangar_primary_image';
```

---

## 🚀 Migration to Production

### Step 1: Run Migration 051
```bash
npm run migrate:up
```

Creates:
- `hangar_image_uploads` table
- Image tracking columns
- Validation rules table
- Triggers for auto-update

### Step 2: Set Storage Provider
```env
# For AWS S3:
IMAGE_STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=lovetofly-hangars

# OR for Cloudinary:
IMAGE_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### Step 3: Migrate Existing Images
```bash
node scripts/migrate-images-to-s3.js
```

This will:
1. Copy all local images to S3
2. Update image_url pointers
3. Delete local copies

---

## 📊 Monitoring & Maintenance

### Check Upload Statistics:
```sql
SELECT 
  COUNT(*) as total_uploads,
  SUM(file_size)/1024/1024 as total_size_mb,
  storage_provider,
  created_at::date as date
FROM hangar_image_uploads
GROUP BY storage_provider, created_at::date
ORDER BY created_at DESC;
```

### Find Missing Images:
```sql
SELECT id, hangar_number, city
FROM hangar_listings
WHERE image_url IS NULL OR image_url = '';
```

### Get Per-Hangar Image Count:
```sql
SELECT 
  hl.id,
  hl.hangar_number,
  COUNT(hiu.id) as image_count
FROM hangar_listings hl
LEFT JOIN hangar_image_uploads hiu ON hl.id = hiu.listing_id
GROUP BY hl.id, hl.hangar_number
ORDER BY image_count DESC;
```

---

## 🔒 Security Best Practices

1. **Access Control**:
   - Only listing owner can upload additional images
   - Admin must approve listing before public visibility

2. **File Scanning**:
   - Consider virus scanning before storage
   - Use AWS's integrated malware scanning

3. **Rate Limiting**:
   - Limit uploads per user per day
   - Prevent abuse

4. **CDN + Cache**:
   - Use CloudFront (S3) or Cloudinary CDN
   - Set cache headers to 30 days

5. **Backup**:
   - S3: Enable versioning
   - Cloudinary: Automatic backups

---

## 📱 Client-Side Upload Component

Already implemented in:
- `src/components/HangarImageUpload.tsx` - Reusable upload component
- `src/app/hangarshare/owner/upload/page.tsx` - Dedicated upload page

### Usage:
```tsx
import { HangarImageUpload } from '@/components/HangarImageUpload';

export function MyForm() {
  return (
    <HangarImageUpload
      listingId={123}
      onUploadSuccess={(url) => console.log('Image uploaded:', url)}
    />
  );
}
```

---

## 🎓 Quick Start Checklist

### For Local Development:
```bash
✅ Set IMAGE_STORAGE_PROVIDER=local (default)
✅ No additional configuration
✅ Images stored in public/hangars/
✅ Run: npm run dev
```

### For Production (AWS S3):
```bash
✅ Create S3 bucket: lovetofly-hangars
✅ Create IAM user with S3 access
✅ Set 5 env vars (REGION, ACCESS_KEY, SECRET_KEY, BUCKET)
✅ Run: npm run migrate:up
✅ Deploy: git push origin main
```

### For Production (Cloudinary):
```bash
✅ Create Cloudinary account
✅ Set 3 env vars (CLOUD_NAME, API_KEY, API_SECRET)
✅ Run: npm run migrate:up
✅ Deploy: git push origin main
```

---

## 📞 Support

For issues:
1. Check logs: `tail -f logs/image-uploads.log`
2. Verify env vars: `echo $IMAGE_STORAGE_PROVIDER`
3. Test endpoint: `curl -X GET /api/hangarshare/listings/1/images`
