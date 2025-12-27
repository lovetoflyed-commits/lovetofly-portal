# 🎯 QUICK START - Love to Fly Portal

## ✅ ALREADY DONE

### 1. Glass Cockpit Simulator
- ✅ Built with full flight physics
- ✅ 6-pack analog instruments (Cessna C152 style)
- ✅ Moving map with terrain & flight path trail
- ✅ Altitude profile chart
- ✅ NAV1/VOR navigation system
- ✅ Engine sound effects
- ✅ FREE for all users (5-day promo)

### 2. Database Setup
- ✅ Neon PostgreSQL connected
- ✅ Table `users` created with 2 test users
- ✅ `.env.local` configured with Neon credentials
- ✅ Code ready for production

---

## 📋 WHAT YOU NEED TO DO NOW

### STEP 1: Configure Netlify Environment Variables

Go to: **https://app.netlify.com/sites/lovetofly-portal/settings/env**

Click "Add a variable" and add these 4 variables:

| Variable Name | Value |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `JWT_SECRET` | `esosduaasmcnopeodascopnmauss` |
| `NEXTAUTH_SECRET` | `esosduaasmcnopeodascopnmauss` |
| `NEXTAUTH_URL` | `https://lovetofly.com.br` |

**Then save and close.**

---

### STEP 2: Redeploy on Netlify

1. Go to **https://app.netlify.com/sites/lovetofly-portal/deploys**
2. Find your latest deploy
3. Click the **3 dots** (⋯) on the right
4. Click **"Redeploy site"**
5. Wait for it to finish (green checkmark = success)

**That's it!** Your site will now work with the Neon database.

---

## 🧪 TEST IT

Once redeploy is done:

1. Visit **https://lovetofly.com.br**
2. Click "Cadastrar" (Register)
3. Fill in the form and submit
4. You should get a success message!

If it works, you're done. If not, see troubleshooting below.

---

## ⚠️ TROUBLESHOOTING

### Error: "Database connection failed"
- Check that ALL 4 variables are in Netlify (no typos)
- Wait 5 minutes for Netlify to apply changes
- Redeploy again

### Error: "relation users does not exist"
- The migration already ran, but if you get this:
- Run this in Neon SQL Editor:
```sql
DROP TABLE IF EXISTS users;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
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
  newsletter_opt_in BOOLEAN DEFAULT FALSE,
  terms_agreed BOOLEAN DEFAULT FALSE,
  plan VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Registration still not working after that
- Check Netlify Function logs: https://app.netlify.com/sites/lovetofly-portal/functions
- Look for any error messages

---

## 📱 FEATURES AVAILABLE NOW

### Free Features (Everyone)
- E6B Flight Computer
- Glass Cockpit Simulator ← New!
- Weather/METAR

### Pro Features (Need to configure)
- Advanced navigation
- Flight planning
- Career tools
- HitchFlying (carona aérea estilo BlaBlaCar — roadmap global)

---

## 📚 YOUR FILES

| File | Purpose |
|---|---|
| `.env.local` | Neon credentials (local only) |
| `src/migrations/000_fresh_users.sql` | Database schema |
| `src/app/page.tsx` | Main dashboard |
| `src/components/tools/GlassCockpit.tsx` | Flight simulator |
| `setup-neon-db.js` | Database setup script |

---

## 🚀 QUICK REFERENCE

**Production URL**: https://lovetofly.com.br
**Neon Console**: https://console.neon.tech
**Netlify Dashboard**: https://app.netlify.com/sites/lovetofly-portal
**GitHub Repo**: https://github.com/lovetoflyed-commits/lovetofly-portal

---

## ✨ You're Almost There!

Just do these 2 steps:
1. Add 4 variables to Netlify
2. Redeploy

Then test the registration and you're done! 🎉
