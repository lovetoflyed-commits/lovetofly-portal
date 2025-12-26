## Admin Plan Upgrade

To promote accounts as requested (you + any email containing "kaiser" to Pro, remaining users to Premium), use the admin endpoint shipped at `src/app/api/admin/upgrade-plans/route.ts`.

Prerequisites:
- Set `ADMIN_SECRET` in your hosting environment (e.g., Netlify/Render/Vercel) to a strong value.
- Ensure `DATABASE_URL` and `JWT_SECRET` are configured.

Run (production):

```
curl -X POST https://<your-domain>/api/admin/upgrade-plans \
   -H "x-admin-secret: <ADMIN_SECRET>" \
   -H "Content-Type: application/json"
```

Optional: include your JWT to mark the caller as Pro (in addition to all emails with "kaiser"):

```
curl -X POST https://<your-domain>/api/admin/upgrade-plans \
   -H "x-admin-secret: <ADMIN_SECRET>" \
   -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
   -H "Content-Type: application/json"
```

The response includes counts: `meUpdated`, `proUpdatedKaiser`, and `premiumUpdated`.

# Deployment Guide for Love to Fly Portal

## Option 1: Deploy to Netlify (Recommended for simplicity)

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
   In Netlify dashboard > Site settings > Environment variables:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=production
   ```
   **⚠️ IMPORTANT:** Without `DATABASE_URL`, the login/register APIs will return 500 errors!

4. **Database Setup**
   - Create a PostgreSQL database on a service like Supabase or Railway
   - Run migrations manually or via a script (see below)
   - Update `DATABASE_URL` with the connection string

5. **Deploy**
   - Netlify will automatically build and deploy on pushes to main branch
   - API routes will be converted to Netlify Functions

6. **Custom Domain**
   - In Netlify dashboard > Site settings > Domain management
   - Add your custom domain

### Running Migrations on Netlify
Since Netlify doesn't support running migrations during build, run them locally or on your database server:

```bash
# Locally, after setting DATABASE_URL
npm run migrate:up
```

Or use a database management tool like pgAdmin or Supabase dashboard.

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
Create a `.env` file with your configuration:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/lovetofly_db
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### 4. Database Setup
Run the migrations:
```bash
yarn migrate:up
```

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