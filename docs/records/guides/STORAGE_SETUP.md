# Storage Configuration Guide

## Overview

The portal uses an abstraction layer for file storage that supports multiple backends:
- **Vercel Blob** (recommended for production)
- **Local Storage** (for development)

## Setup Instructions

### 1. Development (Local Storage)

No additional setup needed. Files are stored as base64 data URLs locally.

Add to `.env.local`:
```
NEXT_PUBLIC_STORAGE_TYPE=local
```

### 2. Production (Vercel Blob)

#### Step 1: Get Vercel Blob Token

1. Go to https://vercel.com/account/tokens
2. Create a new token with "Blob" scope
3. Copy the token

#### Step 2: Configure Environment Variables

Add to `.env.local` (development):
```
NEXT_PUBLIC_STORAGE_TYPE=vercel-blob
BLOB_READ_WRITE_TOKEN=<your-token-here>
```

Add to Vercel dashboard (production):
1. Go to Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_STORAGE_TYPE=vercel-blob`
   - `BLOB_READ_WRITE_TOKEN=<your-token>`

#### Step 3: Redeploy

```bash
npm run build
npm start
```

## Usage

### Upload a Photo

```typescript
import { uploadFile } from '@/utils/storage';

const file = /* File from input */;
const result = await uploadFile(file, 'hangar-photos/123');
// Returns: { url: 'https://...', fileName: 'hangar-photos/123/...', size: 12345 }
```

### Delete a Photo

```typescript
import { deleteFile } from '@/utils/storage';

await deleteFile('https://...');
```

### Validate Image Dimensions

```typescript
import { validateImageDimensions } from '@/utils/storage';

const result = await validateImageDimensions(file, 400, 300);
// Returns: { valid: true, width: 800, height: 600 }
```

## API Endpoints

### Upload Photo
```
POST /api/hangarshare/listings/{id}/upload-photo
Content-Type: multipart/form-data

Body:
- file: File (required)

Response:
{
  "success": true,
  "photo": {
    "id": 1,
    "hangar_listing_id": 123,
    "photo_url": "https://...",
    "display_order": 1,
    "created_at": "2026-01-13..."
  }
}
```

### Get Photos
```
GET /api/hangarshare/listings/{id}/photos

Response:
{
  "success": true,
  "photos": [...],
  "count": 5
}
```

### Delete Photo
```
DELETE /api/hangarshare/listings/{id}/delete-photo
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "photoId": 1
}

Response:
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

## Image Specifications

- **Supported formats:** JPEG, PNG, WebP
- **Maximum file size:** 5MB
- **Minimum dimensions:** 400x300px
- **Recommended dimensions:** 1200x800px (for better quality)

## Storage Limits

### Vercel Blob (Production)
- **Free tier:** 1GB storage, 100GB transfer/month
- **Pro tier:** 100GB storage, 1TB transfer/month
- See https://vercel.com/docs/storage/vercel-blob/pricing for details

### Local Storage (Development)
- Limited by available disk space
- Files are stored as base64 data URLs (not recommended for production)

## Troubleshooting

### "File too large"
- Compress image before uploading
- Maximum size is 5MB

### "Invalid file type"
- Only JPEG, PNG, and WebP are supported
- Convert image format if needed

### "Image dimensions too small"
- Minimum dimensions are 400x300px
- Use higher resolution images

### "BLOB_READ_WRITE_TOKEN not found"
- Ensure environment variable is set in `.env.local` or Vercel dashboard
- Token must have "Blob" scope

### Files not persisting
- Check `NEXT_PUBLIC_STORAGE_TYPE` is set to `vercel-blob`
- Verify token is valid and has correct scope
- Check Vercel project has Blob storage enabled

## Best Practices

1. **Always compress images** before uploading to save bandwidth
2. **Use WebP format** for better compression (if browser supports it)
3. **Validate on client-side** before uploading to improve UX
4. **Set reasonable file size limits** in API (currently 5MB)
5. **Delete old files** when updating/removing listings
6. **Monitor storage usage** in Vercel dashboard for production

## Migration Notes

If migrating from local to Vercel Blob storage:

1. Update `NEXT_PUBLIC_STORAGE_TYPE` to `vercel-blob`
2. Add `BLOB_READ_WRITE_TOKEN` environment variable
3. Existing local files will need to be re-uploaded or migrated manually
4. Database URLs will point to old data URLs until files are re-uploaded

## Future Enhancements

Planned features:
- [ ] AWS S3 support
- [ ] Image optimization/resizing
- [ ] Bulk upload support
- [ ] CDN integration for faster delivery
- [ ] Automatic format conversion
- [ ] Storage analytics dashboard
