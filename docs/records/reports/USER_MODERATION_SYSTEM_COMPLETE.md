# User Moderation & Activity Monitoring System

## Overview

Complete user management, moderation, and activity monitoring system for the Love to Fly Portal admin panel. This system allows admins to:

- **Search and filter** users efficiently
- **Issue moderation actions** (warnings, strikes, suspensions, bans)
- **Track user activity** (login, logout, actions)
- **Monitor inactive users** and send re-engagement reminders
- **Collect feedback** from inactive users about their absence
- **Manage user access** with temporary restrictions or permanent bans

---

## Database Schema

### 1. `user_moderation` Table
Stores all moderation actions taken against users with a complete audit trail.

```sql
CREATE TABLE user_moderation (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action_type VARCHAR(20) CHECK (action_type IN ('warning', 'strike', 'suspend', 'ban')),
  reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'critical')),
  is_active BOOLEAN DEFAULT true,
  suspension_end_date TIMESTAMP WITH TIME ZONE,
  issued_by INTEGER REFERENCES users(id),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by INTEGER REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `action_type`: warning, strike, suspend, or ban
- `severity`: low, normal, high, or critical (for prioritization)
- `suspension_end_date`: When user regains access (for suspend actions)
- `is_active`: Whether action is currently in effect
- `issued_by`: Admin who issued the action
- `resolved_at`: When action was resolved/lifted

---

### 2. `user_activity_log` Table
Detailed log of all user activities for monitoring and analytics.

```sql
CREATE TABLE user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Activity Types:**
- `login`: User logged in
- `logout`: User logged out
- `post_listing`: Posted hangar listing
- `apply_job`: Applied for job
- `book_hangar`: Booked hangar
- `message`: Sent message
- `profile_update`: Updated profile
- `file_upload`: Uploaded file/photo

---

### 3. `user_access_status` Table
Current access status of each user (independent from role).

```sql
CREATE TABLE user_access_status (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  access_level VARCHAR(20) DEFAULT 'active' CHECK (access_level IN ('active', 'warning', 'restricted', 'suspended', 'banned')),
  access_reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by INTEGER REFERENCES users(id),
  restore_date TIMESTAMP WITH TIME ZONE
);
```

**Access Levels:**
- `active`: Full portal access
- `warning`: Full access but warned about behavior
- `restricted`: Limited access (e.g., cannot post listings)
- `suspended`: No access until `restore_date`
- `banned`: Permanent no access

---

### 4. Views for Quick Queries

#### `user_last_activity` View
Shows last activity timestamp and days inactive for each user.

```sql
SELECT 
  u.id, u.email, u.first_name, u.last_name,
  MAX(al.created_at) as last_activity_at,
  EXTRACT(DAY FROM NOW() - MAX(al.created_at)) as days_inactive
FROM users u
LEFT JOIN user_activity_log al ON u.id = al.user_id
GROUP BY u.id;
```

#### `user_moderation_status` View
Shows current moderation status (warnings, strikes, bans) for each user.

```sql
SELECT 
  u.id, u.email,
  COUNT(CASE WHEN um.action_type = 'warning' AND um.is_active THEN 1 END) as active_warnings,
  COUNT(CASE WHEN um.action_type = 'strike' AND um.is_active THEN 1 END) as active_strikes,
  CASE WHEN EXISTS(SELECT 1 FROM user_moderation WHERE user_id = u.id AND action_type = 'ban' AND is_active) 
    THEN true ELSE false END as is_banned
FROM users u
LEFT JOIN user_moderation um ON u.id = um.user_id
GROUP BY u.id;
```

---

## API Endpoints

### User Search & Management

#### `GET /api/admin/users/search?q=email&page=1&limit=20`
Search and paginate through users with filtering.

**Query Parameters:**
- `q`: Email or name (partial match, case-insensitive)
- `page`: Page number (default: 1)
- `limit`: Users per page (default: 20)

**Response:**
```json
{
  "users": [
    {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "access_level": "active",
      "active_warnings": 0,
      "active_strikes": 0,
      "is_banned": false,
      "last_activity_at": "2026-01-13T10:30:00Z",
      "days_inactive": 5
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

---

### Moderation Actions

#### `POST /api/admin/moderation/action`
Issue a moderation action against a user.

**Request Body:**
```json
{
  "userId": "123",
  "actionType": "warning|strike|suspend|ban",
  "reason": "User violated community guidelines",
  "severity": "normal|low|high|critical",
  "suspensionDays": 7,
  "adminId": "1"
}
```

**Response:**
```json
{
  "message": "User warning recorded successfully",
  "moderation": {
    "id": "456",
    "user_id": "123",
    "action_type": "warning",
    "issued_at": "2026-01-13T10:30:00Z"
  }
}
```

#### `GET /api/admin/moderation/action?userId=123`
Get all moderation actions for a user.

**Response:**
```json
{
  "actions": [
    {
      "id": "456",
      "user_id": "123",
      "action_type": "warning",
      "reason": "User violated community guidelines",
      "severity": "normal",
      "is_active": true,
      "issued_at": "2026-01-13T10:30:00Z",
      "resolved_at": null
    }
  ]
}
```

---

### Activity Logging

#### `POST /api/admin/activity/log`
Log a user activity.

**Request Body:**
```json
{
  "userId": "123",
  "activityType": "login",
  "description": "User logged in from desktop",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": { "device": "desktop", "location": "São Paulo" }
}
```

#### `GET /api/admin/activity/log?userId=123&limit=50&activityType=login`
Get user activity log.

**Query Parameters:**
- `userId`: User ID to query
- `limit`: Number of records (default: 50)
- `activityType`: Filter by activity type (optional)

---

### Inactive User Monitoring

#### `GET /api/admin/monitoring/inactive?days=30&limit=20`
Get users inactive for X days.

**Query Parameters:**
- `days`: Days of inactivity threshold (default: 30)
- `limit`: Number of results (default: 20)

**Response:**
```json
{
  "inactiveUsers": [
    {
      "id": "123",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "last_activity_at": "2025-12-10T10:30:00Z",
      "days_inactive": 34,
      "created_at": "2024-01-01T00:00:00Z",
      "plan": "pro",
      "access_level": "active"
    }
  ],
  "summary": {
    "daysThreshold": 30,
    "inactiveCount": 15,
    "totalInactive": 45
  }
}
```

---

## UI Components

### 1. UserManagementPanel Component
Enhanced admin user management with search, filters, and moderation.

**Features:**
- 🔍 Real-time search by email/name
- 🏷️ Filter by access status (all, banned, suspended, warned, inactive)
- 📊 Display moderation status (warnings, strikes, bans)
- ⏱️ Show days inactive
- 🎯 Quick moderation actions
- 📄 Pagination support (20 users per page)

**Statuses Displayed:**
- ✓ **Active** (green)
- ⚠ **Warning** (yellow)
- 🚫 **Restricted** (orange)
- ⛔ **Suspended** (red)
- 🔒 **Banned** (gray)

---

### 2. InactiveUsersMonitoring Component
Monitor and re-engage inactive users.

**Features:**
- 📅 Filter by inactivity threshold (7, 14, 30, 60, 90 days)
- ☐ Bulk select inactive users
- 📧 Send re-engagement reminders
- 📝 Collect feedback about inactivity
- 📊 Color-coded inactivity levels
- 🏷️ Quick view of user plan and status

**Inactivity Colors:**
- 🔵 Blue: 7-30 days
- 🟡 Yellow: 31-60 days
- 🟠 Orange: 61-90 days
- 🔴 Red: 90+ days

---

## Moderation Workflow

### Warning Flow
1. **Issue Warning**: Admin issues warning with reason
2. **Record**: Stored in `user_moderation` table as active
3. **Display**: User sees warning badge (⚠) in admin view
4. **Action**: User can appeal or improve behavior
5. **Resolve**: Admin resolves warning when appropriate

### Strike Flow
Similar to warning but more severe, typically leads to suspension if multiple strikes.

### Suspension Flow
1. **Issue Suspension**: Admin specifies duration (days)
2. **Automatic Calculation**: `suspension_end_date = NOW() + duration days`
3. **Access Restriction**: `access_level` set to `suspended`
4. **Portal Check**: Login endpoint checks `user_access_status` before allowing login
5. **Auto-Restore**: After `suspension_end_date`, access restored automatically
6. **Manual Override**: Admin can resolve early if user improves

### Ban Flow
1. **Issue Ban**: Admin bans user permanently
2. **Access Denied**: `access_level` set to `banned`, login always denied
3. **Audit Trail**: All reasons documented in `user_moderation`
4. **Manual Only**: Only admin can unban (automatic restoration impossible)

---

## Inactive User Re-engagement

### Detection
Users identified as inactive when:
- Last activity timestamp is older than threshold (default: 30 days)
- No `user_activity_log` entry for X days

### Re-engagement Strategy
1. **Monitor**: Dashboard shows inactive users sorted by days inactive
2. **Reach Out**: Admins send reminders via email (Resend integration)
3. **Feedback**: Collect reasons for inactivity
4. **Understand**: Analyze feedback patterns
5. **Improve**: Use feedback to improve features or fix issues

### Feedback Categories
- **Too Busy**: Will return when less busy
- **Missing Features**: Need to add/improve features
- **Price**: Plan too expensive, consider pricing changes
- **Competitor**: Lost user to competitor, analyze why
- **Other**: Custom feedback

---

## Integration Points

### Activity Logging Integration
Log activities at key points in application:

```typescript
// In login endpoint
await fetch('/api/admin/activity/log', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    activityType: 'login',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  })
});

// In posting hangar listing
await fetch('/api/admin/activity/log', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    activityType: 'post_listing',
    metadata: { listing_id: listing.id, property: listing.property }
  })
});
```

### Access Check Integration
Check user access status on protected routes:

```typescript
// In protected API routes
const accessStatus = await pool.query(
  'SELECT access_level FROM user_access_status WHERE user_id = $1',
  [userId]
);

if (accessStatus.rows[0].access_level === 'banned') {
  return NextResponse.json(
    { message: 'Account banned' },
    { status: 403 }
  );
}

if (accessStatus.rows[0].access_level === 'suspended') {
  const restoreDate = await pool.query(
    'SELECT restore_date FROM user_access_status WHERE user_id = $1',
    [userId]
  );
  if (new Date() < new Date(restoreDate.rows[0].restore_date)) {
    return NextResponse.json(
      { message: 'Account suspended until ' + restoreDate },
      { status: 403 }
    );
  }
}
```

---

## Security Considerations

1. **Audit Trail**: All moderation actions logged with admin ID
2. **Timestamps**: All actions include exact timestamps for accountability
3. **Immutable Records**: Cannot delete moderation history, only mark resolved
4. **Admin Only**: Moderation endpoints should require admin role check
5. **Transparency**: Users should be able to see their warnings/suspensions
6. **Appeals**: Consider implementing appeal process for banned users

---

## Future Enhancements

- [ ] **Bulk Moderation**: Apply same action to multiple users
- [ ] **Automation Rules**: Auto-ban after X strikes, auto-suspend after X warnings
- [ ] **Email Notifications**: Notify user of moderation actions
- [ ] **Appeal System**: Allow users to appeal bans/suspensions
- [ ] **Moderation Queue**: Dashboard showing pending moderation cases
- [ ] **Analytics**: Reports on most common violation types
- [ ] **User Segments**: Target different user groups for re-engagement
- [ ] **A/B Testing**: Test different reminder messages for re-engagement
- [ ] **Export Reports**: Export moderation actions and user activity reports

---

## Files Created

1. **Database Migration**: `src/migrations/042_create_user_moderation_tables.sql`
2. **API Endpoints**:
   - `src/app/api/admin/users/search/route.ts` - User search with pagination
   - `src/app/api/admin/moderation/action/route.ts` - Moderation actions
   - `src/app/api/admin/activity/log/route.ts` - Activity logging
   - `src/app/api/admin/monitoring/inactive/route.ts` - Inactive users
3. **UI Components**:
   - `src/components/UserManagementPanel.tsx` - Enhanced (search, moderation)
   - `src/components/InactiveUsersMonitoring.tsx` - Inactive user monitoring

---

## Usage Examples

### Search for user
```
Input: "john@example.com"
Output: Find all users matching "john" in email or name, paginated
```

### Issue warning
```
User: Carlos Silva (violated posting guidelines)
Action: Warning
Reason: "Posted false information about aircraft availability"
Severity: High
```

### Monitor inactive users
```
Threshold: 30 days
Results: 15 users inactive for 30+ days
Action: Send personalized re-engagement emails asking for feedback
```

### Temporary suspension
```
User: Maria Santos (multiple complaints)
Action: Suspend for 7 days
Reason: "Violation of community guidelines - inappropriate listings"
Auto-restore: January 20, 2026
```

---

## Status: ✅ COMPLETE

All components implemented and ready for use.
