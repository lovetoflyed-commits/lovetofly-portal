## Admin Plan Upgrade

To promote accounts as requested (you + any email containing "kaiser" to Pro, remaining users to Premium), use the admin endpoint shipped at `src/app/api/admin/upgrade-plans/route.ts`.

Prerequisites:
- Set `ADMIN_SECRET` in your hosting environment to a strong value (example: `ltfp-admin-2025-secure-key`)
- Ensure `DATABASE_URL` (Neon connection string) and `JWT_SECRET` are configured

### Netlify/Render/Vercel Environment Variables Setup:
1. Go to your hosting dashboard → Settings → Environment Variables
2. Add these variables:
   ```
   ADMIN_SECRET=ltfp-admin-2025-secure-key
   DATABASE_URL=postgresql://neondb_owner:XXXXX@ep-XXXXX.us-east-2.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   ```
3. Redeploy after adding variables

### Run (production):

First, get your JWT token by logging in:
```bash
curl -X POST https://your-domain.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lovetofly.ed@gmail.com","password":"your-password"}'
```

Then run the upgrade (with your JWT to mark yourself as Pro):
```bash
curl -X POST https://your-domain.netlify.app/api/admin/upgrade-plans \
  -H "x-admin-secret: ltfp-admin-2025-secure-key" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_FROM_LOGIN" \
  -H "Content-Type: application/json"
```

Or run without JWT (only emails containing "kaiser" will be set to Pro):
```bash
curl -X POST https://your-domain.netlify.app/api/admin/upgrade-plans \
  -H "x-admin-secret: ltfp-admin-2025-secure-key" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "message": "Plans updated: me + kaiser => pro; others => premium",
  "meUpdated": true,
  "proUpdatedKaiser": 2,
  "premiumUpdated": 5
}
```
### Prerequisites
- GitHub repository (already set up)
- External PostgreSQL database (e.g., Supabase, Railway, or PlanetScale)
- Netlify account

### Steps

1. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect your GitHub account and select the `lovetofly-portal` repository

2. **Configure Build Settings**
   - Build command: `yarn build`
   - Publish directory: `.next` (will be set automatically)
   - Node version: 18

3. **Set Environment Variables**
   In Netlify dashboard > Site settings > Environment variables, add:
   
   | Variable | Value | Notes |
   |----------|-------|-------|
   | `DATABASE_URL` | `postgresql://neondb_owner:XXXXX@ep-XXXXX.us-east-2.aws.neon.tech/neondb?sslmode=require` | Get from Neon dashboard → Connection Details → Connection string |
   | `JWT_SECRET` | `your-super-secret-jwt-key-min-32-chars` | Generate a strong random string (32+ chars) |
   | `NODE_ENV` | `production` | Required for Next.js optimizations |
   | `ADMIN_SECRET` | `ltfp-admin-2025-secure-key` | For admin endpoints like plan upgrades |
   | `NEWS_API_KEY` | (optional) | If using NewsAPI for aviation news |
   
   **⚠️ CRITICAL:** 
   - Use your actual Neon connection string from: Neon Dashboard → Your Project → Connection Details → "Pooled connection" 
   - Include `?sslmode=require` at the end
   - Never commit `.env` files with these values to git!

4. **Database Setup (Neon PostgreSQL)**
   
   **Option A: Use Neon's SQL Editor (Recommended)**
   1. Go to [Neon Console](https://console.neon.tech/)
   2. Select your project
   3. Click "SQL Editor" in the left sidebar
   4. Copy and paste each migration file from `src/migrations/` in order:
      - `001_create_users_table.sql`
      - `002_create_marketplace_table.sql`
      - `003_add_user_plan_column.sql`
   5. Click "Run" for each migration
   
   **Option B: Run Locally (requires psql client)**
   ```bash
   # Get your Neon connection string from console
   export DATABASE_URL="postgresql://neondb_owner:XXXXX@ep-XXXXX.us-east-2.aws.neon.tech/neondb?sslmode=require"
   
   # Run migrations in order
   psql $DATABASE_URL -f src/migrations/001_create_users_table.sql
   psql $DATABASE_URL -f src/migrations/002_create_marketplace_table.sql
   psql $DATABASE_URL -f src/migrations/003_add_user_plan_column.sql
   ```
   
   **Verify tables created:**
   ```sql
   -- Run in Neon SQL Editor
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   
   Expected output: `users`, `marketplace_items`

5. **Deploy**
   - Netlify will automatically build and deploy on pushes to main branch
   - First deploy takes 2-4 minutes
   - Check deployment logs for any errors
   - API routes at `/api/*` will be converted to Netlify serverless functions
   
   **Post-Deploy Verification:**
   ```bash
   # Test home page
   curl -I https://your-site.netlify.app
   
   # Test API health (should return 200 or redirect to login)
   curl -I https://your-site.netlify.app/api/auth/login
   
   # Create first user account via the web interface:
   # https://your-site.netlify.app → Click "Cadastrar"
   ```

6. **Custom Domain**
   - In Netlify dashboard > Site settings > Domain management
   - Add your custom domain

### Running Migrations on Neon
Neon is a serverless Postgres platform with a generous free tier. Migrations must be run directly on the database:

**Method 1: Neon SQL Editor (No local setup required)**
1. Go to https://console.neon.tech/
2. Select your project
3. Click "SQL Editor"
4. Paste contents of each migration file from `src/migrations/` in order
5. Click "Run"

**Method 2: Using psql locally**
```bash
# Install psql (if not already installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql-client

# Set your Neon connection string
export DATABASE_URL="postgresql://neondb_owner:XXXXX@ep-XXXXX.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Run each migration
psql $DATABASE_URL -f src/migrations/001_create_users_table.sql
psql $DATABASE_URL -f src/migrations/002_create_marketplace_table.sql
psql $DATABASE_URL -f src/migrations/003_add_user_plan_column.sql
```

**Verify:**
```bash
psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

Expected tables: `users`, `marketplace_items`

## Option 2: Self-hosted Server

### 1. Clone the Repository
```bash
git clone https://github.com/lovetoflyed-commits/lovetofly-portal.git
cd lovetofly-portal
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Environment Setup
Create a `.env` file with your Neon database configuration:
```env
# Neon Database Connection (get from console.neon.tech)
DATABASE_URL=postgresql://neondb_owner:XXXXX@ep-XXXXX.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Admin Secret for plan upgrades
ADMIN_SECRET=ltfp-admin-2025-secure-key

# Node Environment
NODE_ENV=production
```

**⚠️ Security:** Never commit `.env` to git! It's already in `.gitignore`.

### 4. Database Setup
Since you're using Neon (serverless Postgres), run migrations directly on Neon:

```bash
# Using psql client with Neon connection string
export DATABASE_URL="postgresql://neondb_owner:XXXXX@ep-XXXXX.us-east-2.aws.neon.tech/neondb?sslmode=require"

psql $DATABASE_URL -f src/migrations/001_create_users_table.sql
psql $DATABASE_URL -f src/migrations/002_create_marketplace_table.sql
psql $DATABASE_URL -f src/migrations/003_add_user_plan_column.sql
```

Or use the Neon SQL Editor web interface (no local tools needed).

### 5. Build the Application
```bash
yarn build
```

### 6. Start the Application
```bash
yarn start
```

The app will run on port 3000 by default.

### 7. Configure Web Server (Nginx example)
Create `/etc/nginx/sites-available/lovetofly-portal`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/lovetofly-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL Certificate (Optional but recommended)
Use Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Alternative: Using PM2 for Process Management
Install PM2:
```bash
npm install -g pm2
```

Start the app:
```bash
pm2 start yarn --name "lovetofly-portal" -- start
pm2 save
pm2 startup
```

## Monitoring
- Check logs: `pm2 logs lovetofly-portal`
- Restart: `pm2 restart lovetofly-portal`
- Stop: `pm2 stop lovetofly-portal`