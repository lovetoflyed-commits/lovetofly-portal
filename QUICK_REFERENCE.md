# Love to Fly Portal - Quick Reference Guide

**Last Updated**: December 25, 2025
**Project**: Aviation Portal (Next.js + PostgreSQL)
**Status**: ✅ PRODUCTION READY

---

## 🚀 Quick Start Commands

### Development
```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Run production build locally
yarn start

# Lint code
yarn lint
```

### Database
```bash
# Connect to production database
psql "postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Connect to local database (if running locally)
psql "postgresql://user:password@localhost:5432/lovetofly"
```

### Deployment
```bash
# Deploy to production (Netlify)
netlify deploy --prod --build

# Deploy preview (testing before production)
netlify deploy --build

# Check deployment status
netlify status

# View deployment logs
netlify logs
```

### Git
```bash
# View recent commits
git log --oneline -10

# View all changes
git status

# Commit changes
git add .
git commit -m "Your message here"

# Push to GitHub
git push origin main

# View diff of last commit
git show HEAD
```

---

## 📁 Important Files & Directories

### Configuration Files
| File | Purpose | Key Settings |
|------|---------|--------------|
| `next.config.ts` | Next.js config | Turbopack, build optimization |
| `tsconfig.json` | TypeScript config | Strict mode, path aliases |
| `tailwind.config.js` | Tailwind CSS | Theme customization, colors |
| `netlify.toml` | Netlify deployment | Build command, env vars, redirects |
| `.env.local` | Local environment variables | DATABASE_URL, JWT_SECRET |
| `package.json` | Dependencies & scripts | All npm packages and commands |

### Source Code
| Directory | Contents |
|-----------|----------|
| `src/app` | Next.js App Router pages |
| `src/app/api` | API routes (auth, user, etc) |
| `src/components` | Reusable React components |
| `src/context` | React Context (AuthContext) |
| `src/utils` | Utility functions (E6B logic, etc) |
| `src/config` | Configuration files (DB config) |
| `src/migrations` | Database migration scripts |

### Documentation
| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `SETUP_AND_CONNECTIONS.md` | Complete setup & reference guide |
| `AVIATION_INDUSTRY_STRATEGY.md` | Strategic growth roadmap |
| `DEPLOYMENT_READY.md` | Deployment instructions & checklist |
| `SESSION_SUMMARY.md` | This session's accomplishments |

---

## 🌐 Key URLs

### Live Site
- **Production**: https://lovetofly.com.br
- **Netlify Dashboard**: https://app.netlify.com/sites/lovetofly
- **GitHub**: https://github.com/lovetoflyed-commits/lovetofly-portal

### Local Development
- **Dev Server**: http://localhost:3000
- **API Base**: http://localhost:3000/api

### External Services
- **Database (Neon)**: https://console.neon.tech
- **Node.js**: https://nodejs.org (v20+)
- **Yarn**: https://yarnpkg.com

---

## 🔐 Environment Variables

### Required for Development (.env.local)
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require&channel_binding=require"
JWT_SECRET="your-secret-key-here"
```

### Required for Production (Netlify)
```env
DATABASE_URL="postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="esosduaasmcnopeodascopnmauss!@#$%^&*()"
NETLIFY_USE_BLOBS="false"
NETLIFY_NEXT_PLUGIN_SKIP_CACHE="true"
```

---

## 📊 API Endpoints

### Authentication
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|----------------|
| `/api/auth/register` | POST | Create new user account | ❌ No |
| `/api/auth/login` | POST | User login (returns JWT) | ❌ No |
| `/api/auth/logout` | POST | User logout | ✅ Yes |

### User
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|----------------|
| `/api/user/profile` | GET | Get user profile data | ✅ Yes |

### Request/Response Examples
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@example.com",
    "password": "SecurePass123!",
    "cpf": "12345678900",
    "birthDate": "1990-01-15",
    "mobilePhone": "11999999999",
    "addressStreet": "Rua Principal",
    "addressNumber": "123",
    "addressNeighborhood": "Centro",
    "addressCity": "São Paulo",
    "addressState": "SP",
    "addressZip": "01000-000",
    "addressCountry": "BR",
    "aviationRole": "Pilot",
    "newsletter": true,
    "terms": true
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "SecurePass123!"
  }'

# Get Profile (with auth header)
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🗄️ Database Schema

### users table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  birth_date DATE,
  mobile_phone VARCHAR(20),
  address_street VARCHAR(255),
  address_number VARCHAR(10),
  address_complement VARCHAR(255),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  address_country VARCHAR(2),
  aviation_role VARCHAR(50),
  aviation_role_other VARCHAR(255),
  newsletter BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### marketplace table
```sql
CREATE TABLE marketplace (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(50),
  price DECIMAL(10, 2),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_plans table
```sql
CREATE TABLE user_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plan_type VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## 🧪 Testing Checklist

### Before Deployment
- [ ] `yarn build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] All 17 pages generate successfully
- [ ] Database connection works
- [ ] Authentication endpoints tested
- [ ] UI renders correctly on desktop/mobile
- [ ] E6B widget shows correctly based on auth state
- [ ] No console errors in DevTools

### After Deployment
- [ ] Site loads at https://lovetofly.com.br
- [ ] Can create new account with full profile
- [ ] Can login with email/password
- [ ] Dashboard loads with all widgets
- [ ] E6B widget accessible when logged in
- [ ] Mobile responsive design works
- [ ] Error handling displays proper messages
- [ ] No 404 or 500 errors in production logs

---

## 🐛 Common Issues & Solutions

### Issue: "DATABASE_URL not found"
**Solution**: 
```bash
# Check if env variable is set
echo $DATABASE_URL

# If empty, set it
export DATABASE_URL="postgresql://..."

# Or add to .env.local for development
DATABASE_URL="postgresql://..."
```

### Issue: "Port 3000 already in use"
**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
yarn dev --port 3001
```

### Issue: "SSL error" with database connection
**Solution**:
```bash
# Ensure connection string has sslmode=require
# Example: postgresql://user:pass@host/db?sslmode=require&channel_binding=require

# If using psql client:
PGSSLMODE=require psql "postgresql://user:pass@host/db"
```

### Issue: "JWT verification failed"
**Solution**:
- Check JWT_SECRET is set in environment
- Verify token hasn't expired (24hr expiry)
- Clear sessionStorage and login again

### Issue: "Build fails on Netlify"
**Solution**:
1. Check build logs: https://app.netlify.com/sites/lovetofly/deploys
2. Verify NODE_VERSION=20 in netlify.toml
3. Check environment variables are set
4. Ensure NETLIFY_USE_BLOBS=false

---

## 📈 Performance Tips

### Development
- Use `yarn dev --turbopack` for faster hot reload
- Open DevTools Performance tab to profile slow components
- Use React DevTools to check for unnecessary re-renders

### Production
- Deployed with Next.js optimizations enabled
- Static pages pre-generated at build time
- Image optimization via Next.js Image component
- CSS optimization via Tailwind
- Database connections pooled via Neon

### Monitoring
- Check Netlify Analytics: https://app.netlify.com/sites/lovetofly/analytics
- Monitor error logs in Netlify Functions
- Use browser DevTools Network tab for API performance

---

## 🔧 Useful Debugging Commands

```bash
# Check Node version
node --version

# Check Yarn version
yarn --version

# List all npm scripts
yarn run

# Check if database is accessible
psql $DATABASE_URL -c "SELECT version();"

# View database tables
psql $DATABASE_URL -c "\dt"

# Watch for file changes (auto-rebuild)
yarn build --watch

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install

# Check for TypeScript errors
yarn tsc --noEmit
```

---

## 📞 Support Resources

### Documentation
- Read [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) for overview
- Read [SETUP_AND_CONNECTIONS.md](./SETUP_AND_CONNECTIONS.md) for setup details
- Read [AVIATION_INDUSTRY_STRATEGY.md](./AVIATION_INDUSTRY_STRATEGY.md) for growth strategy
- Read [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md) for deployment

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

### Code Search
```bash
# Search for a function or variable
grep -r "functionName" src/

# Search with regex
grep -r "export.*function" src/

# Search in specific file type
find src -name "*.tsx" -o -name "*.ts" | xargs grep "searchTerm"
```

---

## 🎯 Development Workflow

### Adding a New Feature
1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and test locally: `yarn dev`
3. Build to verify no errors: `yarn build`
4. Commit with clear message: `git commit -m "Add feature-name"`
5. Push to GitHub: `git push origin feature/feature-name`
6. Create pull request for review
7. Merge to main when approved
8. Deploy to production: `netlify deploy --prod --build`

### Fixing a Bug
1. Create fix branch: `git checkout -b fix/bug-name`
2. Reproduce bug and locate code
3. Make fix and test: `yarn dev`
4. Build to verify: `yarn build`
5. Commit: `git commit -m "Fix: bug-name"`
6. Push and create PR
7. Merge to main when verified
8. Deploy: `netlify deploy --prod --build`

---

## 📋 Daily Checklist

- [ ] Check production site is running
- [ ] Check for new errors in Netlify logs
- [ ] Monitor user registrations
- [ ] Check database storage usage
- [ ] Review analytics/engagement metrics
- [ ] Test authentication flows
- [ ] Test main user journeys
- [ ] Backup important data

---

## 🏆 Key Achievements

✅ **Infrastructure**: PostgreSQL, Node.js, Next.js configured
✅ **Authentication**: JWT-based secure login/registration  
✅ **Database**: Full user profile schema with 19 fields
✅ **Frontend**: Professional dashboard with E6B integration
✅ **Deployment**: Live at https://lovetofly.com.br
✅ **Documentation**: 1000+ lines across 4 documents
✅ **Strategy**: 4-phase growth roadmap

---

**Status**: ✅ PRODUCTION READY | **Last Updated**: December 25, 2025
