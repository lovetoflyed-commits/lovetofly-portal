# Photo System - Quick Reference

## 🚀 Quick Start

### For Users

**Upload Photos When Creating a Listing:**
1. Go to `/hangarshare/listing/create`
2. Fill in listing details (8 sections)
3. Click "Submit Listing"
4. Upload photos using drag-and-drop
5. Watch progress indicator
6. Photos save automatically

**View Photos on Listing:**
1. Go to any listing: `/hangarshare/listing/{id}`
2. Click any photo in the gallery
3. Use arrow keys or buttons to navigate
4. Press ESC to close

**Edit Listing Photos:**
1. Go to `/hangarshare/listing/{id}/edit`
2. See existing photos with delete buttons
3. Add new photos via drag-and-drop
4. Delete old photos by clicking 🗑️
5. Save changes (updates listing + uploads photos)

---

## 🔌 API Reference

### Upload Photo
```bash
curl -X POST http://localhost:3000/api/hangarshare/listings/123/upload-photo \
  -H "Authorization: Bearer <token>" \
  -F "file=@photo.jpg"
```

**Response (200):**
```json
{
  "success": true,
  "photo": {
    "id": 456,
    "listingId": 123,
    "photoUrl": "https://...",
    "displayOrder": 1,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Delete Photo
```bash
curl -X DELETE "http://localhost:3000/api/hangarshare/listings/123/delete-photo?photoId=456" \
  -H "Authorization: Bearer <token>"
```

### Fetch Photos
```bash
curl http://localhost:3000/api/hangarshare/listings/123/photos
```

**Response:**
```json
{
  "success": true,
  "photos": [
    {
      "id": 456,
      "photoUrl": "https://...",
      "displayOrder": 1
    }
  ],
  "count": 1
}
```

### Fetch Listing with Photos
```bash
curl http://localhost:3000/api/hangarshare/listing/123
```

**Response includes `photos` array:**
```json
{
  "success": true,
  "hangar": {
    "id": 123,
    "hangarNumber": "101",
    "photos": [
      {
        "id": 456,
        "photoUrl": "https://...",
        "displayOrder": 1
      }
    ]
  }
}
```

---

## 💻 React Component Usage

```tsx
import PhotoGallery from '@/components/PhotoGallery';

// In your component
const [photos, setPhotos] = useState([
  { id: 1, photoUrl: 'https://...', displayOrder: 1 },
  { id: 2, photoUrl: 'https://...', displayOrder: 2 },
]);

<PhotoGallery 
  photos={photos}
  title="My Hangar Photos"
/>
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/components/PhotoGallery.tsx` | Gallery component with lightbox |
| `src/utils/storage.ts` | Upload/delete file handling |
| `src/app/hangarshare/listing/create/page.tsx` | Create listing + upload |
| `src/app/hangarshare/listing/[id]/page.tsx` | View listing + gallery |
| `src/app/hangarshare/listing/[id]/edit/page.tsx` | Edit listing + manage photos |
| `src/app/api/hangarshare/listings/[id]/upload-photo/route.ts` | Upload endpoint |
| `src/app/api/hangarshare/listings/[id]/delete-photo/route.ts` | Delete endpoint |

---

## ⚙️ Configuration

### Environment Variables (.env.local)
```
BLOB_READ_WRITE_TOKEN=<your_token>
NEXT_PUBLIC_STORAGE_MODE=vercel_blob  # or local_base64
```

### Image Requirements
- **Min Size:** 400 x 300 pixels
- **Max Size:** 5 MB
- **Formats:** JPEG, PNG, WebP
- **Recommended:** 800x600px, < 1MB (compressed)

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Image too small" | Use image >= 400x300px |
| "File too large" | Keep under 5MB |
| "Invalid format" | Use JPEG, PNG, or WebP |
| "Unauthorized" | Include JWT token in header |
| "403 Forbidden" | Must be listing owner |
| "Photo not showing" | Check photoUrl in database |

---

## 🎯 Features

### Photo Gallery
- ✅ Responsive grid (2-6 columns)
- ✅ Full-screen lightbox modal
- ✅ Keyboard navigation (← → ESC)
- ✅ Photo pagination (6 per page)
- ✅ Smooth animations
- ✅ Mobile optimized
- ✅ Photo counter display
- ✅ Display order badges

### Photo Management
- ✅ Drag-and-drop upload
- ✅ Individual file upload
- ✅ Real-time progress indicator
- ✅ Delete with confirmation
- ✅ Error handling
- ✅ Optional (doesn't block listing)

### Storage
- ✅ Vercel Blob (production)
- ✅ Base64 (development)
- ✅ Automatic CDN serving
- ✅ Secure deletion

---

## 📊 Database Tables

### hangar_photos
```sql
id             INTEGER PRIMARY KEY
listing_id     INTEGER REFERENCES hangar_listings
photo_url      TEXT NOT NULL
display_order  INTEGER DEFAULT 0
is_primary     BOOLEAN DEFAULT FALSE
created_at     TIMESTAMP DEFAULT NOW()
updated_at     TIMESTAMP DEFAULT NOW()
```

### Indexes
```sql
idx_hangar_photos_listing ON hangar_photos(listing_id)
idx_hangar_photos_order ON hangar_photos(listing_id, display_order)
```

---

## 🚦 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (file validation) |
| 401 | Missing/invalid token |
| 403 | Not authorized (wrong owner) |
| 404 | Listing/photo not found |
| 413 | File too large |
| 422 | Invalid image dimensions |
| 500 | Server error |

---

## 🔐 Security

✅ **JWT Authentication** - Required for upload/delete  
✅ **Owner Verification** - Must own listing  
✅ **File Validation** - Type, size, dimensions  
✅ **SQL Injection** - Parameterized queries  
✅ **CORS** - Properly configured  

---

## 📈 Performance

| Operation | Time |
|-----------|------|
| Load gallery | < 100ms |
| Open lightbox | < 50ms |
| Upload photo | Network dependent |
| Page render | + 50ms |
| DB query | < 10ms |
| CDN serve | < 100ms |

---

## 🎓 Examples

### Upload in JavaScript
```javascript
const file = document.querySelector('input[type=file]').files[0];
const formData = new FormData();
formData.append('file', file);

const res = await fetch(
  `/api/hangarshare/listings/123/upload-photo`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  }
);

const { photo } = await res.json();
console.log('Photo URL:', photo.photoUrl);
```

### Fetch and Display
```javascript
const res = await fetch('/api/hangarshare/listing/123');
const { hangar } = await res.json();

// hangar.photos = [{id: 1, photoUrl: '...', displayOrder: 1}]

// Display with component
<PhotoGallery photos={hangar.photos} />
```

### Delete Photo
```javascript
const res = await fetch(
  `/api/hangarshare/listings/123/delete-photo?photoId=456`,
  {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  }
);
```

---

## 📞 Support

For detailed documentation, see: **PHOTO_SYSTEM_GUIDE.md**  
For full API reference, see: **API_REFERENCE.md**  
For setup instructions, see: **STORAGE_SETUP.md**

---

**Last Updated:** January 15, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
