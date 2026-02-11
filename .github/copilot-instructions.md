# Love to Fly Portal – Copilot Instructions

> **Purpose**: This file provides coding guidelines, patterns, and conventions for AI assistants working on this aviation portal. Follow these instructions to maintain consistency and quality.

## 🎯 Project Overview

**Love to Fly Portal** is a comprehensive aviation community platform built with Next.js 16, featuring:
- **HangarShare**: Marketplace for hangar space rentals with booking system
- **Classifieds**: Aircraft, parts, and avionics marketplace
- **Career Center**: Aviation job board with company profiles
- **Flight Tools**: E6B calculators, flight planning, logbook, weather
- **Community**: Forums, mentorship, courses, procedures library
- **Admin System**: User management, compliance, analytics, audit logging

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, PostgreSQL (Neon), JWT auth, Stripe, Resend, WebSocket

---

## 🏗️ Architecture & Patterns

### Project Structure
```
src/
├── app/              # Next.js pages & API routes (App Router)
│   ├── api/         # REST API endpoints (route.ts files)
│   ├── admin/       # Admin dashboard pages
│   ├── hangarshare/ # Marketplace pages
│   └── ...
├── components/       # Reusable React components
├── context/         # React Context providers (Auth, Language)
├── hooks/           # Custom React hooks
├── utils/           # Utility functions (auth, validation, email)
├── lib/             # Library helpers (rate limiting, websocket)
├── services/        # Service layer (monitoring, notifications)
├── config/          # Configuration (db, sentry, storage)
├── types/           # TypeScript type definitions
├── migrations/      # Database migrations (numbered SQL files)
└── __tests__/       # Test files (unit, integration, e2e)
```

### Import Aliases
- Base path `@/` resolves to `/src/`
- Example: `import pool from '@/config/db'`

---

## 🔐 Authentication & Authorization

### JWT Authentication Pattern
```typescript
import { verifyToken } from '@/utils/auth';

export async function GET(request: Request) {
  // 1. Extract and verify JWT token
  const payload = verifyToken(request);
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = payload.id; // Use this for authorization checks
  // ... rest of logic
}
```

### Admin Authorization
```typescript
import { requireAdmin } from '@/utils/adminAuth';

export async function POST(request: Request) {
  // Check admin role (master, admin, or staff)
  const authError = await requireAdmin(request);
  if (authError) return authError;
  
  // ... admin logic
}
```

### Role Hierarchy
- **master**: Full system access
- **admin**: User management, compliance, moderation
- **staff**: Limited admin functions
- **partner**: Company/service provider accounts
- **owner**: HangarShare property owners
- **user**: Standard user (default)

### Authorization Headers
- Format: `Authorization: Bearer <JWT_TOKEN>`
- Token stored in localStorage on client
- Use `useAuth()` hook to access auth state in React components

---

## 🗄️ Database Patterns

### Connection
```typescript
import pool from '@/config/db';

// pool is a singleton pg.Pool instance
const result = await pool.query('SELECT ...', [params]);
```

### Query Patterns
**Always use parameterized queries** to prevent SQL injection:

```typescript
// ✅ CORRECT - Parameterized query
const result = await pool.query(
  'SELECT * FROM hangar_listings WHERE id = $1 AND status = $2',
  [listingId, 'active']
);

// ❌ WRONG - String interpolation (vulnerable to SQL injection)
const result = await pool.query(
  `SELECT * FROM hangar_listings WHERE id = '${listingId}'`
);

// INSERT with RETURNING
const result = await pool.query(
  'INSERT INTO bookings (user_id, listing_id, start_date) VALUES ($1, $2, $3) RETURNING *',
  [userId, listingId, startDate]
);

// UPDATE with row count check
const result = await pool.query(
  'UPDATE listings SET status = $1 WHERE id = $2',
  [status, id]
);
if (result.rowCount === 0) {
  return NextResponse.json({ message: 'Not found' }, { status: 404 });
}
```

### Migrations
- **Location**: `src/migrations/`
- **Naming**: `001_description.sql`, `002_description.sql` (sequential numbers)
- **Commands**: `npm run migrate:up`, `npm run migrate:down`, `npm run migrate:create`
- **Rules**:
  - Never edit existing migration files
  - Always create new migration files for schema changes
  - Make migrations idempotent (use `IF NOT EXISTS`, `IF EXISTS`)
  - Create indexes for foreign keys
  - Update TypeScript types in `src/types/` when schema changes

### Naming Conventions (Database)
- **Tables**: snake_case plural (`hangar_listings`, `user_profiles`)
- **Columns**: snake_case (`created_at`, `daily_rate`, `user_id`)
- **Foreign Keys**: `{table}_id` (e.g., `user_id`, `listing_id`)
- **Indexes**: `idx_{table}_{column}` or `idx_{table}_{col1}_{col2}`

---

## 🛣️ API Route Patterns

### Standard API Handler Structure
```typescript
import { NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function POST(request: Request) {
  try {
    // 1. Authentication
    const payload = verifyToken(request);
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorization (if needed)
    // Check ownership, roles, etc.

    // 3. Parse and validate request body
    const body = await request.json();
    // Use Zod for validation (see Validation section)

    // 4. Database operations
    const result = await pool.query(
      'SELECT * FROM table WHERE id = $1',
      [body.id]
    );

    // 5. Return success response
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error in POST /api/endpoint:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Response Format Standards
```typescript
// Success responses
return NextResponse.json({ success: true, data: {...} });
return NextResponse.json({ message: 'Success message' });

// Error responses (use appropriate status code)
return NextResponse.json({ message: 'Error description' }, { status: 400 });
return NextResponse.json({ error: 'Error description' }, { status: 500 });
```

### HTTP Status Codes
- **200**: Success with data
- **201**: Created (POST operations)
- **400**: Bad request (validation errors, missing parameters)
- **401**: Unauthorized (missing or invalid JWT)
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **429**: Rate limit exceeded
- **500**: Server error (catch block)

---

## ✅ Input Validation

### Zod Schema Pattern
```typescript
import { z } from 'zod';

// Define schema
const createListingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(5000),
  daily_rate: z.number().positive(),
  location: z.string().min(1),
  amenities: z.array(z.string()).optional(),
});

// In API route
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate and parse
    const validData = createListingSchema.parse(body);
    
    // Use validData (type-safe)
    const result = await pool.query(
      'INSERT INTO hangar_listings (title, description, daily_rate, location) VALUES ($1, $2, $3, $4) RETURNING *',
      [validData.title, validData.description, validData.daily_rate, validData.location]
    );
    
    return NextResponse.json({ success: true, data: result.rows[0] });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: 'Validation failed',
        errors: error.errors
      }, { status: 400 });
    }
    console.error('Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
```

---

## 🧪 Testing

### Test Types & Locations
- **Unit Tests**: `src/__tests__/api/` - Test individual API routes and utilities
- **Integration Tests**: `src/__tests__/integration/` - Test cross-component interactions
- **E2E Tests**: Playwright tests in `tests/` or `src/__tests__/e2e/`
- **Component Tests**: Co-located with components in `__tests__/` folders

### Running Tests
```bash
npm run test              # Unit + integration tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:integration  # Integration tests only
npm run test:e2e          # Playwright E2E tests
npm run test:all          # All test suites
```

### Test Patterns
```typescript
// API route test example
import { verifyToken } from '@/utils/auth';

describe('POST /api/hangarshare/listings', () => {
  test('creates listing with valid data', async () => {
    const mockPayload = { id: 1, email: 'test@example.com', role: 'owner' };
    jest.spyOn(verifyToken, 'verifyToken').mockReturnValue(mockPayload);
    
    const response = await fetch('/api/hangarshare/listings', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer mock-token' },
      body: JSON.stringify({ title: 'Test Listing', ... })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
  
  test('returns 401 without auth', async () => {
    const response = await fetch('/api/hangarshare/listings', {
      method: 'POST'
    });
    expect(response.status).toBe(401);
  });
});
```

---

## 🎨 Frontend Patterns

### Client Components
```typescript
'use client'; // Required for hooks, event handlers, browser APIs

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  
  return <div>{t('welcome')}</div>;
}
```

### Server Components (Default)
```typescript
// No 'use client' directive
// Can use async/await, access environment variables directly

export default async function ServerComponent() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}
```

### Component Props Types
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  // ...
}
```

---

## 🌐 Internationalization (i18n)

### Language Context
```typescript
import { useLanguage } from '@/context/LanguageContext';

function Component() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('pt')}>Português</button>
    </div>
  );
}
```

### Translation Files
- Location: `src/translations/`
- Languages: `pt` (Portuguese - default), `en` (English)
- Pattern: Key-value pairs for UI strings

---

## 🔌 Integrations

### Stripe (Payments)
- **Client**: `@stripe/react-stripe-js` for payment forms
- **Server**: `stripe` package for backend operations
- **Webhooks**: Handled in `/src/app/api/*/webhook/stripe/route.ts`
- **Pattern**: Remove explicit `apiVersion` parameters (use SDK default)

### Resend (Email)
- **Package**: `resend`
- **Usage**: Transactional emails (verification, notifications, etc.)
- **Configuration**: See `documentation/EMAIL_SETUP.md`

### WebSocket (Real-time)
- **Server**: WebSocket server in `server.js`
- **Manager**: Server manager and hooks for real-time analytics
- **Use Cases**: Live dashboard metrics, notifications

### Sentry (Error Tracking)
- **Package**: `@sentry/nextjs`
- **Config**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- **Usage**: Automatic error capture and reporting

---

## 📝 Naming Conventions

### Files & Folders
- **React Components**: PascalCase (`MetricCard.tsx`, `BookingForm.tsx`)
- **Utilities**: camelCase (`adminAuth.ts`, `emailService.ts`)
- **API Routes**: lowercase with hyphens (`/api/auth/login/route.ts`)
- **Pages**: lowercase with hyphens (`/hangarshare/page.tsx`)
- **Tests**: `*.test.ts`, `*.test.tsx`, `*.spec.ts`

### Code
- **Variables/Functions**: camelCase (`getUserById`, `isAuthenticated`)
- **Constants**: UPPER_SNAKE_CASE (`JWT_SECRET`, `MAX_FILE_SIZE`)
- **Interfaces/Types**: PascalCase (`UserProfile`, `JWTPayload`)
- **Boolean Variables**: `is*`, `has*`, `can*` prefix (`isLoading`, `hasError`, `canEdit`)
- **React Components**: PascalCase function names

---

## 🛡️ Security Best Practices

### Do's ✅
1. **Always use parameterized queries** for SQL (never string interpolation)
2. **Verify JWT tokens** before accessing protected resources
3. **Check user ownership** of resources before allowing modifications
4. **Validate all inputs** using Zod schemas
5. **Return generic error messages** to clients (don't expose sensitive details)
6. **Use environment variables** for secrets (never hardcode)
7. **Implement rate limiting** for authentication endpoints
8. **Log errors** with `console.error()` for debugging (include context)

### Don'ts ❌
1. **Never expose sensitive data** in error responses (stack traces, internal IDs, etc.)
2. **Don't trust client input** - always validate and sanitize
3. **Don't store secrets** in code or version control
4. **Don't skip authorization checks** on admin/owner routes
5. **Don't use string concatenation** for SQL queries
6. **Don't return detailed error messages** to clients in production
7. **Don't log sensitive data** (passwords, tokens, PII)

---

## 🚀 Development Workflow

### Commands (npm/yarn)
```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run dev:debug        # Dev server with increased memory

# Building
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint

# Testing
npm run test             # Unit + integration tests
npm run test:integration # Integration tests
npm run test:e2e         # Playwright E2E tests
npm run test:all         # All test suites

# Database
npm run migrate:up       # Run pending migrations
npm run migrate:down     # Rollback last migration
npm run migrate:create   # Create new migration file
npm run seed:dev         # Seed development database
```

### Git Workflow
- **Branch naming**: `feature/description`, `fix/description`, `refactor/description`
- **Commit messages**: Clear, descriptive (e.g., "Add user authentication to API routes")
- **PR reviews**: Required before merging to main

---

## 📚 Documentation References

### Key Documentation Files
- **Setup**: `documentation/QUICK_START.md`, `documentation/SETUP_AND_CONNECTIONS.md`
- **Database**: `documentation/NEON_SETUP.md`
- **HangarShare**: `documentation/HANGARSHARE_COMPLETE_GUIDE.md`
- **Email**: `documentation/EMAIL_SETUP.md`
- **Payments**: `documentation/PAYMENT_INTEGRATION.md`, `documentation/STRIPE_SETUP.md`
- **API**: `documentation/API_DOCUMENTATION.md`
- **Full Index**: `documentation/README.md`

### Entry Points
- **Root Layout**: `src/app/layout.tsx`
- **Global Styles**: `src/app/globals.css`
- **Auth Context**: `src/context/AuthContext.tsx`
- **DB Config**: `src/config/db.ts`

---

## 🎯 Code Quality Checklist

Before submitting code, ensure:
- [ ] All API routes have try-catch error handling
- [ ] JWT authentication is verified for protected routes
- [ ] Database queries use parameterized queries ($1, $2, etc.)
- [ ] Input validation is performed using Zod schemas
- [ ] Appropriate HTTP status codes are returned
- [ ] Error messages are logged with `console.error()`
- [ ] TypeScript types are defined for all data structures
- [ ] Tests are written/updated for new functionality
- [ ] Code follows naming conventions
- [ ] No hardcoded secrets or sensitive data
- [ ] Admin routes check for admin role authorization
- [ ] Client components have `'use client'` directive when needed

---

## 💡 Common Patterns Reference

### Check if user owns resource
```typescript
const listing = await pool.query(
  'SELECT * FROM hangar_listings WHERE id = $1',
  [listingId]
);

if (listing.rows[0].owner_id !== userId) {
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
}
```

### Get authenticated user ID
```typescript
const payload = verifyToken(request);
if (!payload) {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}
const userId = payload.id;
```

### Parse query parameters
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');
  // ...
}
```

---

## 🔄 When Making Changes

1. **Understand context**: Review related code and documentation first
2. **Run tests**: Execute `npm run test` before and after changes
3. **Test locally**: Use `npm run dev` to verify in development
4. **Follow patterns**: Match existing code style and patterns
5. **Update types**: Modify TypeScript types when data structures change
6. **Update docs**: Update relevant documentation if behavior changes
7. **Add tests**: Write tests for new functionality
8. **Security check**: Verify no security vulnerabilities introduced

---

**Remember**: This is an aviation community platform with real users. Prioritize security, data integrity, and user experience in all changes.
