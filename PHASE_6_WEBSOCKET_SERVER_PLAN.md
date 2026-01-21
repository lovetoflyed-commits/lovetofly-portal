# Phase 6: WebSocket Server Implementation Plan
## January 21, 2026

---

## Overview

**Status:** ✅ CLIENT READY → 🔄 SERVER IMPLEMENTATION  
**Phase:** 6 of 7  
**Estimated Duration:** 4-6 hours  
**Complexity:** HIGH (streaming, database integration, connection management)

---

## Current State

### Client Components ✅ COMPLETE
- WebSocket manager (`src/utils/websocket.ts`) - 227 lines
- React hook (`src/hooks/useRealtimeStats.ts`) - 164 lines  
- Display component (`src/components/hangarshare-v2/RealtimeMetricsDisplay.tsx`) - 298 lines
- Dashboard integration - DONE

### Server Components ❌ NOT IMPLEMENTED
- WebSocket endpoint (`/api/ws`) - MISSING
- Database integration - MISSING
- Event broadcasting system - MISSING
- Connection lifecycle management - MISSING

---

## Implementation Tasks

### Task 6.1: WebSocket HTTP Upgrade Endpoint
**File:** `src/app/api/ws/route.ts` (NEW)  
**Lines:** ~150-200  
**Requirements:**
- JWT authentication
- Connection upgrade handling
- Client message routing
- Error handling

**Dependencies:**
- `ws` library (may need install)
- JWT verification from `src/utils/auth.ts`
- Connection registry

**Key Functions:**
- Accept WebSocket upgrade requests
- Verify JWT tokens
- Extract owner context
- Handle connection errors

---

### Task 6.2: WebSocket Manager Class
**File:** `src/utils/websocket-server.ts` (NEW)  
**Lines:** ~300-400  
**Requirements:**
- Connection registry (Map<ownerId, WebSocket>)
- Message broadcasting
- Auto-reconnect handling
- Memory cleanup on disconnect

**Key Methods:**
```
- broadcastMetrics(ownerId, data)
- broadcastBookingEvent(ownerId, data)
- broadcastOccupancyChange(ownerId, data)
- broadcastRevenueUpdate(ownerId, data)
- disconnectClient(ownerId)
- getConnectedClients()
```

**Data Sources:**
- Database polling (every 5-10 seconds)
- Webhook triggers (Stripe, etc.)
- Direct API calls (booking updates)

---

### Task 6.3: Real Metrics Collection
**File:** `src/utils/metrics-aggregator.ts` (NEW)  
**Lines:** ~200-300  
**Requirements:**
- Query database for metrics
- Calculate real-time statistics
- Track revenue, bookings, occupancy
- Optimize query performance

**Queries Needed:**
```sql
-- Get listing count by status
SELECT status, COUNT(*) FROM hangar_listings 
WHERE owner_id = $1 
GROUP BY status;

-- Get revenue (last 30 days)
SELECT SUM(payment_amount) FROM bookings
WHERE owner_id = $1 AND created_at > NOW() - '30 days'::interval;

-- Get occupancy percentage
SELECT COUNT(*) as occupied FROM hangar_listings
WHERE owner_id = $1 AND status = 'occupied';

-- Get monthly growth
SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count
FROM bookings WHERE owner_id = $1
GROUP BY month ORDER BY month DESC LIMIT 12;
```

---

### Task 6.4: Event Triggers
**Files:** 
- `src/app/api/hangarshare/bookings/[id]/route.ts` (MODIFY)
- `src/app/api/hangarshare/listings/[id]/route.ts` (MODIFY)
- `src/app/api/hangarshare/webhook/stripe/route.ts` (MODIFY)

**Requirements:**
- Trigger WebSocket broadcasts on events
- Emit `booking_created`, `booking_updated`, etc.
- Send to connected clients

**Pattern:**
```typescript
import { getWebSocketServer } from '@/utils/websocket-server';

// After database update
const wsServer = getWebSocketServer();
wsServer.broadcastBookingEvent(ownerId, {
  type: 'booking_created',
  data: newBooking
});
```

---

### Task 6.5: Database Integration
**Files:** Multiple API routes
**Requirements:**
- Replace mock data with real queries
- Optimize for performance
- Add error handling

**Migration Needed:** None (schema already exists)

---

### Task 6.6: Testing
**File:** `tests/websocket-server.test.ts` (NEW)  
**Tests:**
- Connection lifecycle
- Authentication
- Message broadcasting
- Reconnection handling
- Memory cleanup

---

## Architecture

```
Client Browser
    ↓ (WebSocket)
    ↓
/api/ws (HTTP Upgrade)
    ↓
WebSocketServer
├── ConnectionRegistry (Map<ownerId, socket>)
├── MetricsAggregator (database queries)
├── EventEmitter (booking, occupancy, revenue events)
└── BroadcastService (send to connected clients)
    ↓
Database (PostgreSQL queries)
    ↓
Analytics (real metrics)
```

---

## Implementation Order

1. **Task 6.1** → Create `/api/ws` endpoint
2. **Task 6.2** → Build WebSocketServer class
3. **Task 6.3** → Implement metrics collection
4. **Task 6.4** → Add event triggers to existing APIs
5. **Task 6.5** → Test end-to-end
6. **Task 6.6** → Add unit tests

---

## Success Criteria

- ✅ WebSocket endpoint responds to upgrades
- ✅ Authentication works (JWT verified)
- ✅ Real metrics returned in message
- ✅ Client receives updates < 100ms
- ✅ Auto-reconnect works
- ✅ Multiple tabs work independently
- ✅ Memory doesn't leak on disconnect
- ✅ 1000+ concurrent connections supported
- ✅ Zero TypeScript errors
- ✅ Build passes

---

## Known Challenges

### Challenge 1: Library Support
WebSocket in Next.js requires:
- `ws` library (npm install ws)
- Raw Node.js socket handling
- Custom HTTP upgrade logic

**Solution:** Use Next.js API route with Node.js upgrade handler

### Challenge 2: Scaling
Single-server WebSocket won't scale beyond 10,000 connections.

**Future:** Implement Redis pub/sub for multi-server clustering

### Challenge 3: Token Expiry
Tokens expire after 24 hours; client needs refresh mechanism.

**Solution:** Send `token_expired` message to force reconnect with new token

### Challenge 4: Database Load
Real-time metrics from database every second = high query load.

**Solution:** Cache metrics for 5 seconds, poll on interval

---

## Dependencies to Install

```bash
npm install ws
npm install --save-dev @types/ws
```

---

## Environment Variables

Already configured:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing
- `NEXTAUTH_SECRET` - Session handling

New (optional):
- `WS_HEARTBEAT_INTERVAL` - Default: 30s
- `WS_METRICS_POLL_INTERVAL` - Default: 5s

---

## Documentation

Will create:
- `PHASE_6_IMPLEMENTATION_GUIDE.md` (step-by-step)
- `WEBSOCKET_SERVER_API.md` (architecture reference)
- `WEBSOCKET_TESTING_GUIDE.md` (manual + automated tests)

---

## Timeline

| Task | Duration | Owner |
|------|----------|-------|
| 6.1: Endpoint | 45 min | AI Agent |
| 6.2: Manager | 60 min | AI Agent |
| 6.3: Metrics | 45 min | AI Agent |
| 6.4: Triggers | 60 min | AI Agent |
| 6.5: Testing | 45 min | AI Agent |
| 6.6: Unit Tests | 45 min | AI Agent |
| **TOTAL** | **5h** | **AI Agent** |

---

## Success Sign-Off

When complete, validate:
- ✅ `npm run build` passes
- ✅ `npx tsc --noEmit` passes
- ✅ All tests pass
- ✅ Dashboard connects automatically
- ✅ Metrics update in real-time
- ✅ No console errors

---

## Next Phase (After Phase 6)

**Phase 7:** Performance Optimization & Production Hardening
- Load testing (5000+ concurrent connections)
- Latency optimization
- Memory profiling
- Security audit
- Deployment configuration

---

**Plan Created:** January 21, 2026  
**Ready to Proceed:** YES ✅  
**Blocker:** None  

