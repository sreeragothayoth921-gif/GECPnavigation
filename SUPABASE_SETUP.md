# Supabase Database Setup Guide for CampusNav

This guide walks you through setting up a Supabase PostgreSQL database for the CampusNav application.

## Prerequisites
- GitHub account
- Supabase account (free tier available at https://supabase.com)

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `campusnav-gec-palakkad` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
   - **Pricing Plan**: Free tier is sufficient for college project
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

---

## Step 2: Get Connection Strings

After project is ready, go to **Settings > Database**:

### 1. DATABASE_URL (for application)
- Copy **"Connection string"** > **"URI"** (not Session Pooler)
- Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- Replace `[PASSWORD]` with your database password

### 2. DIRECT_URL (for migrations)
- Copy **"Connection string"** > **"Session Pooler"**
- Format: `postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
- Replace `[PASSWORD]` with your database password

---

## Step 3: Get API Keys

Go to **Settings > API**:

1. **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
2. **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **service_role secret key**: `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Step 4: Run Database Migrations

### Option A: Local Development (Recommended)

```bash
# 1. Copy .env.example to .env.local and fill in your values
cp .env.example .env.local

# 2. Push schema to Supabase
npx prisma db push

# 3. Generate Prisma Client
npx prisma generate

# 4. Seed with campus data
npm run db:seed
```

### Option B: Direct Supabase SQL Editor

If `prisma db push` fails, you can run migrations manually:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the generated SQL from `prisma migrate dev` or use the schema from `prisma/schema.prisma`

---

## Step 5: Configure Supabase Auth

### Email/Password Auth
1. Go to **Authentication > Providers**
2. Enable **Email** provider
2. Configure email templates if desired

### Google OAuth (Optional)
1. Go to **Authentication > Providers > Google**
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add redirect URLs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://YOUR_APP.vercel.app/api/auth/callback/google`

---

## Step 6: Configure Storage (Optional)

For file uploads (campus images, etc.):

1. Go to **Storage > Buckets**
2. Create bucket: `campus-images`
3. Set to **Public** (for campus map images)
4. Add policy for authenticated uploads

---

## Step 7: Verify Database Connection

Run the health check endpoint after deployment:
```
GET https://YOUR_APP.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-..."
}
```

---

## Step 8: Environment Variables for Vercel

In Vercel Dashboard > Settings > Environment Variables, add:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://postgres:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_REF.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `YOUR_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `YOUR_SERVICE_ROLE_KEY` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://YOUR_APP.vercel.app` | Production |
| `NEXTAUTH_SECRET` | `your-generated-secret` | Production, Preview, Development |
| `GOOGLE_CLIENT_ID` | `your-google-client-id` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `your-google-client-secret` | Production, Preview, Development |
| `OPENAI_API_KEY` | `sk-...` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR_APP.vercel.app` | Production, Preview, Development |
| `NEXT_PUBLIC_DEFAULT_WALKING_SPEED_KMH` | `5` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

---

## Step 9: Custom Domain (Optional)

1. Go to **Vercel Dashboard > Settings > Domains**
2. Add your domain: `campusnav.gecskp.ac.in`
3. Configure DNS records as instructed by Vercel
4. Enable **HTTPS** (automatic)

---

## Free Tier Limits (Important for College Project)

| Resource | Supabase Free Tier | Vercel Free Tier |
|----------|-------------------|------------------|
| Database | 500 MB | N/A |
| API Requests | 50,000/month | 100 GB bandwidth/month |
| Auth Users | Unlimited | N/A |
| Storage | 1 GB | N/A |
| Functions | N/A | 100 GB-hrs/month |
| Build Minutes | N/A | 6,000/month |
| Sleep | Project pauses after 1 week inactivity | None |

**Important**: Supabase free tier pauses projects after **1 week of inactivity**. For your college presentation:
- **Before presentation**: Visit the app or run a curl to wake it up
- **During presentation**: Keep a tab open or set up a cron job to ping `/api/health` every 5 minutes

---

## Troubleshooting

### "Connection refused" / "ENOTFOUND"
- Check `DATABASE_URL` format
- Ensure Supabase project is not paused
- Verify IP allowlist (Supabase allows all by default)

### "Prisma Client not generated"
```bash
npx prisma generate
```

### "Migration failed"
```bash
npx prisma migrate reset --force
npx prisma db push
```

### "NextAuth secret error"
- Generate new secret: `openssl rand -base64 32`
- Update `NEXTAUTH_SECRET` in Vercel

---

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Use `SUPABASE_SERVICE_ROLE_KEY` only in server-side code
- [ ] Enable RLS (Row Level Security) on all tables in Supabase
- [ ] Use `NEXTAUTH_SECRET` with 32+ characters
- [ ] Restrict Google OAuth redirect URIs to your domains only
- [ ] Enable 2FA on Supabase and Vercel accounts

---

## Quick Reference Commands

```bash
# Development
npm run dev

# Build
npm run build

# Database
npx prisma db push          # Push schema changes
npx prisma generate         # Generate client
npx prisma migrate dev      # Create migration
npx prisma migrate deploy   # Apply migrations (prod)
npm run db:seed             # Seed campus data
npx prisma studio           # Visual DB editor

# Deploy
vercel --prod               # Manual deploy to Vercel
```

---

## Support

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs