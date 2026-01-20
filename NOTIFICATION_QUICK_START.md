# Notification System - Quick Start Guide

**Implementation:** Option 2 - Simple Dropdown Notification Panel ✅

---

## 🚀 What's Been Delivered

### Database
- ✅ Migration `064_create_notifications_uuid.sql` created and applied
- ✅ `user_notifications` table with UUID support
- ✅ Indexes for optimal performance

### Backend APIs
- ✅ `GET /api/user/notifications` - Fetch notifications with unread filter
- ✅ `PATCH /api/user/notifications` - Mark as read (single or all)
- ✅ `POST /api/admin/notifications/create` - Admin endpoint to create notifications

### Frontend Components
- ✅ `NotificationDropdown.tsx` - Dropdown panel component
- ✅ Updated `Header.tsx` - Bell icon with dropdown integration
- ✅ Unread count badge with pulsing animation
- ✅ Relative timestamps ("5m ago", "2h ago", etc.)
- ✅ Emoji icons by notification type

### Documentation
- ✅ Complete guide: `NOTIFICATION_SYSTEM_OPTION2.md`
- ✅ Test data seeded in database (4 sample notifications)

---

## 🧪 Testing

### Quick Manual Test

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Login** to the app (use test user: 7e3fa5fd-19b1-4540-a265-9e936e5dc735)

3. **Check the bell icon** in the top-right corner of the header
   - Should show red badge with count "4" (we seeded 4 notifications)
   - Badge pulses to indicate unread notifications

4. **Click the bell icon** to open dropdown
   - Shows last 5 notifications
   - Displays notification title + message
   - Shows relative timestamp
   - Blue dot indicates unread status

5. **Click notification** to mark as read
   - Blue dot disappears
   - Unread count decreases
   - Notification stays in list

6. **Click "Mark all as read"** (if exists)
   - All notifications marked as read
   - Badge disappears
   - Count resets to 0

7. **Click action button** (e.g., "Ver anúncio")
   - Should navigate to the action URL
   - Closes dropdown

---

## 🔌 Integration Points (For Next Development)

### When to Create Notifications

#### 1. **Classifieds Interest**
When user expresses interest in a listing:
```typescript
// In your classifieds interest API route
await pool.query(
  `INSERT INTO user_notifications 
   (user_id, type, title, message, action_url, action_label)
   VALUES ($1, 'listing_interest', $2, $3, $4, $5)`,
  [
    listingOwnerId,
    `Novo interesse em seu ${listingType}`,
    `${buyerName} se interessou pelo seu ${listingTitle}`,
    `/classifieds/${listingType}/${listingId}`,
    'Ver anúncio'
  ]
);
```

#### 2. **Forum Replies**
When someone replies to a forum post:
```typescript
await pool.query(
  `INSERT INTO user_notifications 
   (user_id, type, title, message, action_url, action_label)
   VALUES ($1, 'forum_reply', $2, $3, $4, $5)`,
  [
    postAuthorId,
    'Resposta ao seu tópico',
    `${replyAuthor} respondeu: "${replyPreview}"`,
    `/forum/topic/${topicId}`,
    'Ver resposta'
  ]
);
```

#### 3. **Booking Requests**
When a new booking is created:
```typescript
await pool.query(
  `INSERT INTO user_notifications 
   (user_id, type, title, message, action_url, action_label)
   VALUES ($1, 'booking', $2, $3, $4, $5)`,
  [
    hangarOwnerId,
    'Nova solicitação de reserva',
    `${bookerName} quer reservar seu hangar em ${city}`,
    `/profile/bookings`,
    'Ver reserva'
  ]
);
```

#### 4. **System Alerts**
For admin notifications:
```typescript
await pool.query(
  `INSERT INTO user_notifications 
   (user_id, type, title, message, action_url, action_label)
   VALUES ($1, 'system_alert', $2, $3, $4, $5)`,
  [
    userId,
    'Alerta do sistema',
    'Mensagem de manutenção ou atualização',
    null,
    null
  ]
);
```

---

## 📊 Notification Types Reference

| Type | Icon | Use Case |
|------|------|----------|
| `listing_interest` | ✈️ | New buyer interest in classifieds |
| `forum_reply` | 💬 | Reply to forum post |
| `booking` | 📅 | New booking request |
| `new_message` | 💌 | Direct message from user |
| `system_alert` | ⚠️ | System announcements |
| `payment_confirmation` | 💳 | Payment received |
| `admin_approval` | ✅ | Admin approval |

---

## 🔧 Admin API Usage (For Testing)

### Create Notification via API

```bash
curl -X POST http://localhost:3000/api/admin/notifications/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "7e3fa5fd-19b1-4540-a265-9e936e5dc735",
    "title": "Test Notification",
    "message": "This is a test notification from the API",
    "type": "system_alert",
    "actionUrl": "/profile",
    "actionLabel": "Go to Profile"
  }'
```

---

## 🐛 Troubleshooting

### Bell icon not showing count
- Check localStorage for token: `localStorage.getItem('token')`
- Verify user_id in token matches database
- Check network tab - `/api/user/notifications` should return 200

### Dropdown not opening
- Ensure `NotificationDropdown` is imported in Header
- Check browser console for errors
- Verify `isNotificationOpen` state is toggling

### Notifications not appearing
- Verify user_notifications table exists: `psql "$DATABASE_URL" -c "\d user_notifications"`
- Check test data: `psql "$DATABASE_URL" -c "SELECT * FROM user_notifications LIMIT 5"`
- Ensure user_id matches the logged-in user

---

## 📝 Next Phase Features (Optional)

1. **Real-time notifications** - Upgrade to WebSocket for instant updates
2. **Email digest** - Send daily/weekly email summary
3. **Notification preferences** - User can disable specific types
4. **Toast notifications** - In-app popup alerts
5. **Archive/delete** - User can clear old notifications
6. **Categories** - Organize by personal/system/offers

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `src/migrations/064_create_notifications_uuid.sql` | Database schema |
| `src/components/NotificationDropdown.tsx` | Dropdown UI component |
| `src/components/Header.tsx` | Integration point |
| `src/app/api/user/notifications/route.ts` | GET/PATCH endpoints |
| `src/app/api/admin/notifications/create/route.ts` | Admin creation endpoint |
| `NOTIFICATION_SYSTEM_OPTION2.md` | Complete documentation |

---

## ✅ Deployment Checklist

- [ ] Migration applied to production DB
- [ ] Environment variables set (if using external services)
- [ ] Test notifications created for QA
- [ ] Classifieds interest integration in progress
- [ ] Forum reply integration in progress
- [ ] Booking notification integration in progress
- [ ] User testing completed
- [ ] Monitoring/logging verified

---

**Status:** Ready for deployment and feature integration! 🎉

