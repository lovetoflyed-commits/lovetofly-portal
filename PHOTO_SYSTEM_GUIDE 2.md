# Photo System Implementation Guide

## Overview

The Love to Fly Portal now features a complete photo management system for HangarShare listings, including upload, storage, display, and deletion functionality with a professional photo gallery component.

## Components

### 1. **PhotoGallery Component** (`src/components/PhotoGallery.tsx`)

A reusable React component that displays hangar photos with:

- **Grid View**: Responsive grid (2-6 columns) with hover effects
- **Lightbox Modal**: Full-screen image viewer with navigation
- **Pagination**: Navigate through photos if more than 6 per page
- **Keyboard Navigation**: Arrow keys (← →) to navigate, ESC to close
- **Photo Counter**: Shows current photo number and display order
- **Responsive Design**: Works on mobile, tablet, and desktop

**Props:**
```typescript
interface PhotoGalleryProps {
  photos: Array<{
    id: number;
    photoUrl: string;
    displayOrder: number;
  }>;
  title?: string; // Default: "Fotos"
}
```

**Usage:**
```tsx
import PhotoGallery from '@/components/PhotoGallery';

<PhotoGallery 
  photos={hangar.photos} 
  title={`Fotos do Hangar ${hangar.hangarNumber}`}
/>
```

### 2. **Storage Layer** (`src/utils/storage.ts`)

Abstraction layer supporting multiple storage backends:

- **Vercel Blob** (Production): Cloud storage with CDN
- **Local Base64** (Development): Embedded in database for offline development

**Key Functions:**

```typescript
// Upload a file
uploadFile(file: File, context?: string): Promise<string>

// Delete a file
deleteFile(url: string): Promise<void>

// Validate image dimensions
validateImageDimensions(file: File): Promise<void>
```

**Validation Rules:**
- Min size: 400x300 pixels
- Max size: 5MB
- Formats: JPEG, PNG, WebP

### 3. **Photo Upload Endpoints**

#### **POST** `/api/hangarshare/listings/[id]/upload-photo`

Upload a single photo to a listing.

**Request:**
```
Headers: 
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body:
  file: <Image file>
```

**Response:**
```json
{
  "success": true,
  "photo": {
    "id": 123,
    "listingId": 1,
    "photoUrl": "https://...",
    "displayOrder": 1,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `200`: Photo uploaded successfully
- `400`: Invalid file (size, dimensions, format)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (not listing owner)
- `500`: Server error

#### **DELETE** `/api/hangarshare/listings/[id]/delete-photo`

Delete a photo from a listing.

**Request:**
```
Headers: 
  Authorization: Bearer <token>

Query: 
  photoId=<id>
```

**Response:**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

#### **GET** `/api/hangarshare/listings/[id]/photos`

Fetch all photos for a listing (public).

**Response:**
```json
{
  "success": true,
  "photos": [
    {
      "id": 123,
      "photoUrl": "https://...",
      "displayOrder": 1
    }
  ],
  "count": 1
}
```

### 4. **Listing Detail Page** (`src/app/hangarshare/listing/[id]/page.tsx`)

Displays listing information with integrated photo gallery:

- Fetches listing data via GET `/api/hangarshare/listing/[id]`
- Includes `photos` array in response
- Passes photos to `<PhotoGallery />` component
- Gallery is automatically shown if photos exist

### 5. **Listing Create Flow** (`src/app/hangarshare/listing/create/page.tsx`)

Upload photos during listing creation:

1. Fill listing form (8 sections)
2. Submit form → creates listing → returns `listingId`
3. Upload photos sequentially using `listingId`
4. Each photo saves independently
5. Form shows upload progress (X/Y photos)
6. Photos are optional (errors don't fail listing creation)

**Code Example:**
```typescript
// Upload listing
const createRes = await fetch('/api/hangarshare/listing/create', {
  method: 'POST',
  body: JSON.stringify(listingData),
});
const { listingId } = await createRes.json();

// Upload photos one by one
for (const file of photos) {
  const photoForm = new FormData();
  photoForm.append('file', file);
  
  await fetch(`/api/hangarshare/listings/${listingId}/upload-photo`, {
    method: 'POST',
    body: photoForm,
  });
}
```

### 6. **Listing Edit Flow** (`src/app/hangarshare/listing/[id]/edit/page.tsx`)

Manage photos while editing listing details:

- **View Existing Photos**: Grid of current photos with delete buttons
- **Add New Photos**: Drag-and-drop upload section
- **Delete Photos**: Click 🗑️ button on hover
- **Upload Progress**: Shows uploading status and progress bar
- **Save Flow**: Update listing details AND upload new photos

**Features:**
- Shows existing photos with display order badges
- Delete button appears on hover
- File input with drag-and-drop support
- Progress bar shows upload status
- Shows file list while uploading
- Sequential uploads for reliability

## Database Schema

### `hangar_photos` Table

```sql
CREATE TABLE hangar_photos (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hangar_photos_listing ON hangar_photos(listing_id);
CREATE INDEX idx_hangar_photos_display_order ON hangar_photos(listing_id, display_order);
```

## Configuration

### Environment Variables

**.env.local**
```
# Vercel Blob (Production)
BLOB_READ_WRITE_TOKEN=<your_vercel_blob_token>

# Storage Mode
NEXT_PUBLIC_STORAGE_MODE=vercel_blob # or local_base64
```

### Storage Selection

The system automatically selects storage based on environment:

- **Production/Vercel**: Uses Vercel Blob API
- **Local Development**: Uses base64 encoding (no token needed)

## Workflow Examples

### Creating a Listing with Photos

```typescript
// Step 1: Fill form
const listingData = {
  hangarNumber: '101',
  hangarSizeSqm: 500,
  monthlyRate: 5000,
  // ... other fields
};

// Step 2: Create listing
const createRes = await fetch('/api/hangarshare/listing/create', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(listingData),
});
const { listingId } = await createRes.json();

// Step 3: Upload photos
for (const file of selectedFiles) {
  const form = new FormData();
  form.append('file', file);
  
  await fetch(`/api/hangarshare/listings/${listingId}/upload-photo`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });
  
  setUploadProgress(prev => prev + 1);
}
```

### Viewing a Listing with Photos

```typescript
// Fetch listing (includes photos)
const res = await fetch(`/api/hangarshare/listing/123`);
const { hangar } = await res.json();

// hangar.photos = [{id: 1, photoUrl: '...', displayOrder: 1}, ...]

// Display with component
<PhotoGallery photos={hangar.photos} />
```

### Editing Listing and Adding Photos

```typescript
// Step 1: Update listing details
await fetch(`/api/hangarshare/listings/123`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(updatedData),
});

// Step 2: Upload new photos
for (const file of newPhotos) {
  const form = new FormData();
  form.append('file', file);
  
  await fetch(`/api/hangarshare/listings/123/upload-photo`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });
}

// Step 3: Delete photos
for (const photoId of photosToDelete) {
  await fetch(`/api/hangarshare/listings/123/delete-photo?photoId=${photoId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}
```

## Error Handling

### Upload Errors

```typescript
try {
  const res = await fetch(`/api/hangarshare/listings/123/upload-photo`, {
    method: 'POST',
    body: photoForm,
  });

  if (!res.ok) {
    const { message, details } = await res.json();
    console.error('Upload failed:', message, details);
    // Handle error (show toast, retry, etc.)
  }
} catch (err) {
  console.error('Network error:', err);
}
```

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| `400 Bad Request` | Image too small/large, wrong format | Check validation rules |
| `401 Unauthorized` | Missing/invalid token | Verify JWT in localStorage |
| `403 Forbidden` | Not listing owner | Verify ownership/admin status |
| `413 Payload Too Large` | File exceeds 5MB | Compress before upload |
| `422 Unprocessable Entity` | Invalid dimensions (< 400x300) | Use larger image |

## Performance Considerations

### Image Optimization

**Recommended Image Sizes:**
- **Display**: 800x600px (aspect ratio 4:3)
- **Storage**: Compress to < 1MB before upload
- **Formats**: JPEG preferred for photos, PNG for graphics

**Optimization Tips:**
```bash
# Using ImageMagick
convert large-photo.jpg -resize 800x600 -quality 80 optimized.jpg

# Using ffmpeg
ffmpeg -i photo.jpg -vf scale=800:600 output.jpg
```

### Bandwidth Optimization

- **CDN**: Vercel Blob provides automatic CDN distribution
- **Caching**: Photos cached aggressively (use versioning if updating)
- **Lazy Loading**: Gallery component lazy-loads images on scroll

### Database Performance

- **Indexes**: Added on `listing_id` and `display_order`
- **Query Optimization**: Photos fetched with listing data using JSON aggregation
- **Pagination**: Gallery limits displayed photos (6 per page by default)

## Security

### Authorization

- **Upload**: Only listing owner or admin can upload
- **Delete**: Only listing owner or admin can delete
- **View**: All users can view photos (public)

### File Validation

- **Type Check**: Only JPEG, PNG, WebP allowed
- **Size Check**: Max 5MB
- **Dimension Check**: Min 400x300 pixels
- **Content Check**: Verify file is actually an image

### Storage Security

- **Vercel Blob**: Automatically encrypted, CDN-served
- **Base64**: Stored in database with user's ownership record
- **Deletion**: Soft deletes in database, cleanup from Blob on demand

## Future Enhancements

### Phase 2 (Next Sprint)

- [ ] **Photo Reordering**: Drag-and-drop to set display order
- [ ] **Photo Cropping**: Built-in crop tool before upload
- [ ] **Batch Upload**: Upload multiple files at once
- [ ] **Progress Indicators**: Per-file upload progress
- [ ] **Image Optimization**: Automatic compression before storage
- [ ] **Alt Text**: User-supplied descriptions for accessibility

### Phase 3 (Later)

- [ ] **Photo Approval**: Admin approval workflow
- [ ] **Admin Dashboard**: View/moderate all photos
- [ ] **Watermarking**: Add branding to photos
- [ ] **Archive**: Keep photo history with versions
- [ ] **Analytics**: Track photo views/engagement
- [ ] **AI Moderation**: Automated content review

## Testing

### Unit Tests

```typescript
// PhotoGallery component
test('renders photo grid', () => {
  const photos = [{ id: 1, photoUrl: 'http://...', displayOrder: 1 }];
  render(<PhotoGallery photos={photos} />);
  expect(screen.getByAltText(/Foto 1/i)).toBeInTheDocument();
});

test('opens lightbox on click', () => {
  render(<PhotoGallery photos={photos} />);
  fireEvent.click(screen.getByAltText(/Foto 1/i));
  expect(screen.getByRole('button', { name: /✕/i })).toBeVisible();
});
```

### Integration Tests

```typescript
// Upload flow
test('uploads photo after listing creation', async () => {
  // Create listing
  const listingRes = await POST('/api/hangarshare/listing/create', {...});
  const { listingId } = listingRes.data;
  
  // Upload photo
  const formData = new FormData();
  formData.append('file', photoFile);
  const uploadRes = await POST(`/api/hangarshare/listings/${listingId}/upload-photo`, formData);
  
  // Verify
  expect(uploadRes.status).toBe(200);
  expect(uploadRes.data.photo.photoUrl).toBeDefined();
});
```

## Support & Troubleshooting

### Common Questions

**Q: How many photos can I upload?**
A: Unlimited. Storage scales automatically with Vercel Blob.

**Q: Can I edit photos after upload?**
A: Not yet. Delete and re-upload for now. Phase 2 will add editing.

**Q: Are photos backed up?**
A: Yes. Vercel Blob includes automatic backups. Database has deletion records.

**Q: How long are photos kept?**
A: Until listing is deleted. Contact support for recovery options.

## Related Documentation

- [STORAGE_SETUP.md](./STORAGE_SETUP.md) - Cloud storage configuration
- [HANGARSHARE_COMPLETE_GUIDE.md](./HANGARSHARE_COMPLETE_GUIDE.md) - Full HangarShare guide
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API documentation

---

**Last Updated:** January 15, 2025  
**Version:** 1.0  
**Status:** Production Ready
