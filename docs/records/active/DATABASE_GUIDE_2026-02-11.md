# Database Configuration Guide — 2026-02-11

## ⚠️ CRITICAL: Dual Database Configuration Policy

**This project supports TWO database configurations:**

1. **Production/Cloud**: Neon PostgreSQL (Cloud) - Used in production
2. **Local Development**: Local PostgreSQL - Database name MUST be `lovetofly-portal` (with hyphen)

### Common Mistakes to Avoid
❌ **DON'T**:
- Use a different database name (e.g., `lovetofly_portal` with underscore)
- Create new `pg.Pool()` instances in code
- Use hardcoded connection strings in application code
- Edit existing migration files

✅ **DO**:
- Always import from `src/config/db.ts`
- Use `lovetofly-portal` (with hyphen) for local development
- Use Neon PostgreSQL for production via `DATABASE_URL`
- Use parameterized queries for all SQL
- Create new migration files for schema changes
- Check table status in DB_VALIDATION_REPORT before using

## Database Connection Details

### Production & Cloud Database
**Provider**: Neon PostgreSQL (Cloud)
**Region**: São Paulo, Brazil (sa-east-1)
**SSL**: Required

```
Host: ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech
Port: 5432
Database: neondb
User: neondb_owner
SSL Mode: require
Channel Binding: require
```

### Local Development Database
**Provider**: PostgreSQL (Local)
**Database**: `lovetofly-portal` ⚠️ **MUST use hyphen, cannot be changed**

```
Host: localhost
Port: 5432
Database: lovetofly-portal
User: postgres (or your local PostgreSQL user)
Password: (your local password)
```

### Connection String Format

**For Production/Cloud (Neon)**:
```bash
DATABASE_URL=postgresql://neondb_owner:{password}@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**For Local Development**:
```bash
# Option 1: Connection string to local database
DATABASE_URL=postgresql://postgres:{password}@localhost:5432/lovetofly-portal

# Option 2: Individual environment variables (used as fallback)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lovetofly-portal
DB_PASSWORD=yourpassword
DB_PORT=5432
```

**Note**: If `DATABASE_URL` is set, it takes precedence over individual `DB_*` variables.

### Environment Setup

**File**: `.env` (for production/cloud)
```bash
DATABASE_URL=postgresql://neondb_owner:{password}@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=https://lovetofly.com.br
```

**File**: `.env` (for local development)
```bash
# Option 1: Use DATABASE_URL pointing to local database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/lovetofly-portal
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Option 2: Use individual DB variables
# (Comment out or remove DATABASE_URL to use these)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lovetofly-portal
DB_PASSWORD=yourpassword
DB_PORT=5432
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**File**: `.env.example` (template)
```bash
# Database (Neon / PostgreSQL)
# For production/cloud, use Neon connection:
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require

# For local development, either:
# 1. Use DATABASE_URL with local PostgreSQL:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/lovetofly-portal

# 2. Or use individual variables (when DATABASE_URL not set):
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lovetofly-portal
DB_PASSWORD=yourpassword
DB_PORT=5432

# JWT / Auth
JWT_SECRET=replace-with-a-strong-secret
ADMIN_SECRET=replace-with-admin-secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Resend (Emails)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

## Code Configuration

### Database Connection (src/config/db.ts)

**This is the ONLY place to create database connections.**

```typescript
import { Pool } from 'pg';

// Configuração da conexão com o banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback para variáveis individuais se DATABASE_URL não estiver definida
  ...(process.env.DATABASE_URL ? {} : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lovetofly-portal',
    password: process.env.DB_PASSWORD || 'Master@51',
    port: Number(process.env.DB_PORT) || 5432,
  }),
});

export default pool;
```

### How to Use in Your Code

```typescript
// ✅ CORRECT: Import the singleton pool
import pool from '@/config/db';

export async function GET(request: Request) {
  try {
    // Use parameterized queries
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json(
      { message: 'Database error' },
      { status: 500 }
    );
  }
}
```

```typescript
// ❌ WRONG: Don't create new connections
import { Pool } from 'pg';
const newPool = new Pool({ ... }); // DON'T DO THIS!
```

## Database Schema

### Current State (as of 2026-01-29)
- **Total Tables**: 65 tables in production
- **Schema**: `public` (main schema) + `neon_auth` (auth tables)
- **Status**: Reorganization in progress (see DB_REORG_TASKS_2026-01-29.md)

### Core Tables (Actively Used)
```
✅ users                  - User accounts
✅ user_memberships       - Subscription plans
✅ user_moderation        - Content moderation
✅ user_access_status     - Account status tracking
✅ activity_log           - User activity tracking
✅ notifications          - User notifications
```

### Feature-Specific Tables
```
HangarShare:
  - hangar_owners
  - hangar_listings
  - hangar_bookings
  - hangar_photos
  - hangar_reviews
  - hangar_favorites

Classifieds:
  - aircraft_listings
  - avionics_listings
  - parts_listings
  - classified_photos

Careers:
  - career_profiles

Forum:
  - forum_topics
  - forum_replies
  - forum_topic_likes
  - forum_reply_likes

Financial:
  - financial_transactions
  - invoices

Admin:
  - admin_activity_log
  - business_activity_log
```

### Tables Under Review
⚠️ See `DB_VALIDATION_REPORT_2026-01-29.md` for:
- Tables without code references
- Tables with no data
- Tables marked for archival/removal
- Table consolidation candidates

## Migration Management

### Migration Rules
1. **Never edit existing migration files** - Always create new ones
2. Migrations are numbered sequentially: `001_*.sql`, `002_*.sql`, etc.
3. Migrations must be idempotent (safe to run multiple times)
4. Always create indexes for foreign keys
5. Update TypeScript types after schema changes

### Migration Location
```
src/migrations/
├── 001_create_users_table.sql
├── 002_create_marketplace_table.sql
├── 003_add_user_plan_column.sql
└── ... (up to 067 as of 2026-01-29)
```

### Migration Commands
```bash
# Create a new migration
npm run migrate:create name_of_migration

# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status
```

### Migration Template
```sql
-- Migration: 068_description_of_change.sql
-- Description: What this migration does
-- Date: 2026-02-11

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table (idempotent)
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_table_name_created_at 
  ON table_name(created_at);

-- Add foreign key constraints
ALTER TABLE table_name 
  ADD CONSTRAINT fk_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Create index for foreign key
CREATE INDEX IF NOT EXISTS idx_table_name_user_id 
  ON table_name(user_id);
```

## Database Queries Best Practices

### 1. Always Use Parameterized Queries
```typescript
// ✅ CORRECT: Parameterized query (prevents SQL injection)
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1 AND active = $2',
  [email, true]
);

// ❌ WRONG: String concatenation (SQL injection risk)
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### 2. Handle Errors Properly
```typescript
try {
  const result = await pool.query('SELECT * FROM users');
  return NextResponse.json({ data: result.rows });
} catch (error) {
  console.error('Database query failed:', error);
  // Log full error for debugging
  console.error('Query details:', { query: 'SELECT * FROM users' });
  
  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 }
  );
}
```

### 3. Use Transactions for Multi-Step Operations
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO user_memberships ...');
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 4. Validate Data Before Queries
```typescript
// Validate inputs
if (!email || typeof email !== 'string') {
  return NextResponse.json(
    { message: 'Invalid email' },
    { status: 400 }
  );
}

// Then query
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email.toLowerCase().trim()]
);
```

## Testing Database Connections

### Manual Test (psql)

**For Production/Cloud (Neon)**:
```bash
PGPASSWORD='your-password' psql \
  -h ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  -c "SELECT NOW();"
```

**For Local Development**:
```bash
psql -U postgres -d lovetofly-portal -c "SELECT NOW();"
```

### Test Script (Node.js)
```javascript
// test-db-connection.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log('Current time:', result.rows[0].now);
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

```bash
node test-db-connection.js
```

## Troubleshooting

### Connection Errors

**Error**: "password authentication failed"
- **Solution**: Check DATABASE_URL has correct password
- **Check**: Verify credentials in Neon dashboard

**Error**: "SSL connection required"
- **Solution**: Add `?sslmode=require` to connection string
- **Note**: Neon requires SSL for all connections

**Error**: "channel binding required"
- **Solution**: Add `&channel_binding=require` to connection string

**Error**: "too many connections"
- **Solution**: Check for connection leaks in code
- **Fix**: Always release clients after use
- **Config**: Consider adjusting pool size in db.ts

### Query Errors

**Error**: "relation 'table_name' does not exist"
- **Solution**: Run migrations: `npm run migrate:up`
- **Check**: Verify table exists in database

**Error**: "column 'field_name' does not exist"
- **Solution**: Check if migration was run
- **Tip**: Compare schema with TypeScript types

**Error**: "syntax error at or near"
- **Solution**: Check SQL syntax
- **Tool**: Test query in pgAdmin or psql first

### Performance Issues

**Slow Queries**
- Add indexes for frequently queried columns
- Use EXPLAIN ANALYZE to identify bottlenecks
- Consider query optimization

**Connection Timeouts**
- Check network connectivity
- Verify Neon service status
- Consider increasing timeout in pool config

## Additional Resources

### Documentation References
- **Setup Guide**: `documentation/SETUP_AND_CONNECTIONS.md`
- **Neon Setup**: `documentation/NEON_SETUP.md`
- **Database Tasks**: `docs/records/active/DB_REORG_TASKS_2026-01-29.md`
- **Table Validation**: `docs/records/active/DB_VALIDATION_REPORT_2026-01-29.md`

### External Links
- Neon Dashboard: https://console.neon.tech
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- node-postgres (pg): https://node-postgres.com/

## Version History

**2026-02-11**: Initial comprehensive database guide created to prevent database misconfigurations and establish single source of truth.

---

**Remember**: Always use the Neon PostgreSQL database via `src/config/db.ts`. Never create local connections or use mock databases unless explicitly instructed for testing purposes.
