# Love to Fly Portal - Setup & Connection Details

## Project Overview
- **Project Name**: Love to Fly Portal
- **Framework**: Next.js 16.1.1 with App Router
- **React Version**: 19
- **Language**: TypeScript
- **Package Manager**: Yarn
- **Hosting**: Netlify
- **Database**: Neon PostgreSQL (Cloud)
- **Deploy Date**: December 25, 2025
- **Production URL**: https://lovetofly.com.br

---

## Database Connection Details

### Neon PostgreSQL (Production & Development)

| Parameter | Value |
|-----------|-------|
| **Host** | ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech |
| **Port** | 5432 |
| **Database** | neondb |
| **User** | neondb_owner |
| **Password** | npg_2yGJ1IjpWEDF |
| **Region** | São Paulo (sa-east-1) |
| **SSL Mode** | Required |
| **Channel Binding** | Required |

### Connection String
```
postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### psql Command
```bash
PGPASSWORD='npg_2yGJ1IjpWEDF' psql -h ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech -U neondb_owner -d neondb
```

---

## Environment Variables

### Local Development (.env)
```
DATABASE_URL=postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=esosduaasmcnopeodascopnmauss
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Production (Netlify Environment Variables)
```
DATABASE_URL=postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=esosduaasmcnopeodascopnmauss
NODE_VERSION=20
NETLIFY_USE_BLOBS=false
NETLIFY_NEXT_PLUGIN_SKIP_CACHE=true
```

---

## API Endpoints

### Authentication Routes

#### Register User
- **Method**: POST
- **Endpoint**: `/api/auth/register`
- **Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123",
  "cpf": "123.456.789-00",
  "birthDate": "1990-01-01",
  "mobilePhone": "(11) 99999-9999",
  "addressStreet": "Rua das Flores",
  "addressNumber": "123",
  "addressComplement": "Apt 456",
  "addressNeighborhood": "Centro",
  "addressCity": "São Paulo",
  "addressState": "SP",
  "addressZip": "01310-100",
  "addressCountry": "Brasil",
  "aviationRole": "student",
  "terms": true
}
```

#### Login
- **Method**: POST
- **Endpoint**: `/api/auth/login`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```
- **Response**:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John"
  }
}
```

#### Get User Profile
- **Method**: GET
- **Endpoint**: `/api/user/profile`
- **Headers**: 
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Database Schema

### Users Table (001_create_users_table.sql)
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  cpf VARCHAR(20) UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  mobile_phone VARCHAR(20),
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_complement VARCHAR(255),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  address_country VARCHAR(100),
  aviation_role VARCHAR(50),
  aviation_role_other VARCHAR(255),
  social_media VARCHAR(255),
  newsletter BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Marketplace Table (002_create_marketplace_table.sql)
```sql
CREATE TABLE IF NOT EXISTS marketplace (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Plans Table (003_add_user_plan_column.sql)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';
```

---

## Netlify Deployment Details

### Site Information
- **Site Name**: lovetofly-portal
- **Project URL**: https://lovetofly.com.br
- **Admin URL**: https://app.netlify.com/projects/lovetofly-portal
- **Project ID**: 2bf20134-2d55-4c06-87bf-507f4c926697

### Build Configuration (netlify.toml)
```toml
[build]
  command = "yarn build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  DATABASE_URL = "postgresql://..."
  JWT_SECRET = "..."
  NETLIFY_USE_BLOBS = "false"
  NETLIFY_NEXT_PLUGIN_SKIP_CACHE = "true"
```

### Deployment Commands
```bash
# Local deploy with build
netlify deploy --prod --build --debug

# Set environment variables
netlify env:set DATABASE_URL "postgresql://..."
netlify env:set JWT_SECRET "..."
netlify env:set NODE_VERSION "20"

# List environment variables
netlify env:list
```

---

## Local Development Setup

### Prerequisites
- Node.js 20+ (Required)
- Yarn package manager
- PostgreSQL 15+ client (psql)

### Installation
```bash
cd /Users/edsonassumpcao/Desktop/lovetofly-portal
yarn install
```

### Environment Setup
1. Create `.env` file in project root:
```
DATABASE_URL=postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=esosduaasmcnopeodascopnmauss
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Database Migrations
```bash
# Run all migrations
PGPASSWORD='npg_2yGJ1IjpWEDF' psql \
  -h ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  -f src/migrations/001_create_users_table.sql

# Repeat for 002 and 003 migrations
```

### Start Development Server
```bash
yarn dev
# Application runs on http://localhost:3000
```

### Build for Production
```bash
yarn build
```

---

## Key Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **User Registration**: Comprehensive form with CPF validation
- **User Login**: Email/password authentication
- **Aviation Portal**: Specialized aviation tools and widgets
- **Dashboard**: UTC clock, weather, airport status, news feed
- **Responsive Design**: Mobile-first Tailwind CSS styling
- **Serverless Functions**: API routes via Netlify Functions

---

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout with AuthProvider
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/        # Login endpoint
│   │   │   └── register/     # Registration endpoint
│   │   └── user/
│   │       └── profile/      # User profile endpoint
│   └── [routes]/             # Other pages (career, courses, forum, etc.)
├── components/
│   ├── AuthGuard.tsx         # Protected route wrapper
│   ├── Header.tsx            # Navigation header
│   ├── Footer.tsx            # Footer component
│   └── [widgets]/            # UI widgets
├── config/
│   └── db.ts                 # Database connection
├── context/
│   └── AuthContext.tsx       # Authentication context
├── controllers/
│   └── userController.tsx    # User business logic
├── migrations/               # SQL migration files
└── utils/
    └── e6bLogic.ts          # Aviation calculator logic
```

---

## Important Notes

### Security
- ⚠️ Never commit `.env` to git
- ⚠️ JWT_SECRET should be strong and unique
- ⚠️ All API routes use HTTPS in production
- ⚠️ Database password is stored in environment variables only

### Production Considerations
- Database connections use SSL/TLS
- All user passwords are hashed with bcrypt
- Tokens expire after 24 hours
- CORS headers configured for security

### Troubleshooting
- **Database Connection Error**: Verify Neon network settings allow your IP
- **Build Failures**: Clear `.netlify` cache and retry
- **Auth Issues**: Check JWT_SECRET matches between local and production
- **Blobs Error**: Set `NETLIFY_USE_BLOBS=false` in environment

---

## Team Access

### Netlify
- **Team**: Love to Fly
- **Owner Email**: lovetofly.ed@gmail.com

### Database
- **Neon Project**: Love to Fly Portal
- **Access**: Via neondb_owner credentials above

### Repository
- **GitHub**: https://github.com/lovetoflyed-commits/lovetofly-portal
- **Branch**: main

---

## Contact & Support

For database issues, contact Neon support: https://neon.tech
For deployment issues, contact Netlify support: https://netlify.com

**Last Updated**: December 25, 2025
