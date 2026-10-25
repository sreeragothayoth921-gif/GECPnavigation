# CampusNav GEC Palakkad - Deployment Guide

## Overview

This guide covers deploying the CampusNav application to **Vercel + Supabase** for a permanent, publicly accessible HTTPS URL suitable for your college project presentation.

**Architecture**: Next.js 14 (App Router) + Prisma ORM + PostgreSQL (Supabase) + NextAuth.js

---

## Quick Start

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - CampusNav ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/campusnav-gec-palakkad.git
git push -u origin main
```

### 2. Set Up Supabase Database
Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to:
- Create Supabase project
- Get connection strings and API keys
- Run migrations and seed data

### 3. Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `prisma generate && next build`
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install`
4. Add Environment Variables (see below)
5. Click **Deploy**

#### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Environment Variables

Add these in **Vercel Dashboard > Settings > Environment Variables**:

### Required (Production, Preview, Development)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres` |
| `DIRECT_URL` | Supabase session pooler for migrations | `postgresql://postgres:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://YOUR_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (secret!) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXTAUTH_SECRET` | Auth secret (32+ chars) | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | OpenAI API key for AI assistant | `sk-...` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `GOCSPX-...` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_DEFAULT_WALKING_SPEED_KMH` | Default walking speed | `5` |
| `NODE_ENV` | Environment | `production` |

### Required (Production Only)
| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://YOUR_APP.vercel.app` |

### Optional
| Variable | Description |
|----------|-------------|
| `MAPTILER_KEY` | Custom map styles (optional) |

### Google OAuth Configuration
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Authorized redirect URIs:
   - `https://YOUR_APP.vercel.app/api/auth/callback/google`
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel

---

## Post-Deployment Steps

### 1. Update NEXTAUTH_URL
After first deployment, copy your Vercel URL (e.g., `https://campusnav-gec-palakkad.vercel.app`) and update:
- Vercel Environment Variable: `NEXTAUTH_URL`
- Google OAuth: Authorized redirect URI

### 2. Run Database Migrations
```bash
# Option A: Via Vercel CLI (after deployment)
vercel env pull .env.local
npx prisma migrate deploy

# Option B: Locally with production DATABASE_URL
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

### 3. Seed Database (if empty)
```bash
# Run seed script against production database
DATABASE_URL="your-production-url" npm run db:seed
```

### 4. Verify Deployment
Visit your Vercel URL and test:
- [ ] Home page loads
- [ ] Login/Register works
- [ ] Map loads (MapLibre GL)
- [ ] Routing works (Dijkstra)
- [ ] AI Assistant responds
- [ ] Admin dashboard accessible
- [ ] Indoor navigation works

---

## Health Check Endpoint

Add a health check for monitoring:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    const { prisma } = await import('@/lib/database/prisma');
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ status: 'error', database: 'disconnected' }, { status: 503 });
  }
}
```

Test: `GET https://your-app.vercel.app/api/health`

---

## Free Tier Limits & Presentation Tips

### Supabase Free Tier
| Resource | Limit |
|----------|-------|
| Database | 500 MB |
| API Requests | 50,000/month |
| Auth Users | Unlimited |
| Storage | 1 GB |
| **Auto-pause** | **After 1 week inactivity** |

### Vercel Free Tier
| Resource | Limit |
|----------|-------|
| Bandwidth | 100 GB/month |
| Serverless Functions | 100 GB-hrs/month |
| Build Minutes | 6,000/month |
| **No auto-sleep** | ✅ |

### Presentation Day Checklist

**⚠️ CRITICAL: Supabase pauses after 1 week of inactivity!**

**Before Presentation:**
- [ ] Visit the app 1 hour before to wake up Supabase
- [ ] Or run: `curl https://your-app.vercel.app/api/health` 
- [ ] Keep browser tab open during presentation
- [ ] Test all features 30 mins before

**During Presentation:**
- Keep a browser tab open to prevent Supabase sleep
- Have a backup screenshot/video ready

**Auto-wake script (run before presentation):**
```bash
# Run this 5 minutes before presentation
for i in {1..3}; do curl -s https://your-app.vercel.app/api/health; sleep 10; done
```

---

## Custom Domain (Optional)

### Setup `campusnav.gecskp.ac.in`
1. Vercel Dashboard > Settings > Domains
2. Add `campusnav.gecskp.ac.in`
3. Add DNS records at your domain registrar:
   - **A Record**: `@` → `76.76.21.21` (Vercel)
   - **CNAME**: `www` → `cname.vercel-dns.com`
4. Enable HTTPS (automatic)

---

## Monitoring & Logs

### Vercel Logs
- Dashboard > Functions > View logs
- Real-time logs during deployment

### Supabase Logs
- Dashboard > Logs > Database / API / Auth
- Slow query detection in Database > Advisors

### Error Tracking (Optional)
Add Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## Troubleshooting

### Build Fails: "Prisma Client not generated"
```bash
# Add to build command in Vercel:
prisma generate && next build
```

### Database Connection Failed
- Check `DATABASE_URL` format
- Ensure Supabase project not paused
- Verify `DIRECT_URL` uses session pooler (port 6543)

### NextAuth Error: "Invalid secret"
```bash
# Generate new secret
openssl rand -base64 32
# Update NEXTAUTH_SECRET in Vercel
```

### Google OAuth: "redirect_uri_mismatch"
- Check Google Console authorized redirect URIs match exactly
- Must include: `https://YOUR_APP.vercel.app/api/auth/callback/google`

### Prisma: "Table doesn't exist"
```bash
npx prisma db push
npx prisma generate
```

---

## Rollback Procedure

```bash
# Vercel Dashboard > Deployments > Click "..." > "Rollback"
# Or CLI:
vercel rollback [deployment-url]
```

---

## Security Checklist

- [ ] `.env.local` in `.gitignore`
- [ ] `NEXTAUTH_SECRET` is 32+ chars random
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in server env
- [ ] Google OAuth restricted to your domains
- [ ] Supabase RLS enabled on all tables
- [ ] 2FA enabled on Vercel, Supabase, GitHub

---

## Quick Reference

```bash
# Local development
npm run dev

# Build locally
npm run build

# Database
npx prisma db push          # Push schema
npx prisma generate         # Generate client
npx prisma migrate dev      # Create migration
npx prisma migrate deploy   # Apply migrations (prod)
npm run db:seed             # Seed campus data

# Deploy
vercel --prod               # Manual deploy

# Health check
curl https://your-app.vercel.app/api/health
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org

---

## Summary Checklist

- [ ] GitHub repository created and pushed
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Database seeded with campus data
- [ ] Vercel project connected to GitHub
- [ ] All environment variables set in Vercel
- [ ] Google OAuth configured
- [ ] First deployment successful
- [ ] `NEXTAUTH_URL` updated to production URL
- [ ] Database migrations applied to production
- [ ] Database seeded in production
- [ ] Health check passes
- [ ] All features tested
- [ ] Custom domain configured (optional)
- [ ] Presentation wake-up script tested

---

**Your app will be live at: `https://YOUR_APP.vercel.app`**

For presentation: Ensure Supabase is awake by visiting the URL 30 minutes before!