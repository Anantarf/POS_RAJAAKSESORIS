# 🔐 Security & Environment Setup Guide

> **CRITICAL:** Never commit actual `.env` files to git. Use `.env.example` as template only.

## ⚠️ If You Committed Credentials

If `.env` was ever committed with real credentials:

```bash
# 1. IMMEDIATELY rotate all credentials in Supabase Dashboard
#    Settings > API > Regenerate keys

# 2. Remove .env from git history (rewrite history - use with caution)
git rm --cached .env
git commit -m "security: remove exposed credentials"
git push

# 3. Ask team members to pull fresh repo
```

## 🚀 First-Time Setup

### 1. Get Supabase Credentials
```
Dashboard: https://supabase.com > Your Project > Settings > API

Copy these:
- VITE_SUPABASE_URL         (Project URL)
- VITE_SUPABASE_ANON_KEY    (Anon Key)
- SUPABASE_URL              (same as VITE_SUPABASE_URL)
- SUPABASE_ANON_KEY         (same as VITE_SUPABASE_ANON_KEY)
- SUPABASE_SERVICE_ROLE_KEY (Service Role Key - backend only!)
```

### 2. Setup Local Environment
```bash
# Create .env from template
cp .env.example .env

# Fill Supabase values (from step 1)
# Then generate JWT_SECRET
npm run gen:jwt

# Verify environment is complete
npm run verify:env
```

### 3. Verify Database
```bash
# Check all required tables, views, functions exist
npm run verify:database
```

### 4. Start Development
```bash
# Root (frontend + Vercel functions)
npm run dev

# Backend (in separate terminal, if running locally)
cd backend
npm run dev
```

## 📋 Environment Variables Checklist

### Required (All Environments)
- ✅ `VITE_SUPABASE_URL` - Supabase project URL
- ✅ `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- ✅ `SUPABASE_URL` - Backend Supabase URL
- ✅ `SUPABASE_ANON_KEY` - Backend anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Backend service role (🔐 SECRET)
- ✅ `JWT_SECRET` - Backend authentication secret (🔐 SECRET, min 32 chars)

### Recommended (Backend)
- 📌 `CORS_ORIGIN` - Frontend URL for CORS
- 📌 `FONNTE_TOKEN` - WhatsApp API token
- 📌 `FONNTE_TARGETS` - WhatsApp target numbers

### Optional (Legacy MySQL)
- ❌ `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` - Only if `ENABLE_LEGACY_MYSQL_ROUTES=true`

## 🔑 Generating Secrets

### JWT_SECRET
```bash
# Auto-generate and add to .env
npm run gen:jwt

# Or manual (32 random hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rotating Credentials
```bash
# Supabase Dashboard > Settings > API
# - Click "Reveal" on SERVICE_ROLE_KEY
# - Click refresh icon to rotate
# Update .env with new key
# Redeploy to Vercel
```

## 🚨 Security Best Practices

1. **Never commit `.env` files**
   - Only `.env.example` should be in git
   - `.env` is in `.gitignore`

2. **Service Role Key is backend-only**
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
   - Never pass in `VITE_*` variables
   - If frontend needs Supabase, use `VITE_SUPABASE_ANON_KEY`

3. **JWT_SECRET rotation**
   - Change on each deployment to production
   - Tokens with old secret will expire in 24h anyway
   - But still good practice to rotate

4. **Rate limiting**
   - Configured per user per action
   - Default: 10 requests per 60 seconds
   - For WhatsApp notifications to prevent abuse

5. **CORS origin control**
   - Production: explicitly set `CORS_ORIGIN=https://yourdomain.com`
   - Development: uses localhost pattern if `CORS_ORIGIN` not set
   - Never use `*` (allow all)

## 🧪 Verification Scripts

```bash
# Check all required env vars are set
npm run verify:env

# Check database schema is correct
npm run verify:database

# Check build-time configuration
npm run verify:hardening

# Full deployment check
npm run verify:deploy
```

## 🌐 Production Deployment (Vercel)

### 1. Add Secrets in Vercel Dashboard
```
Settings > Environment Variables > Production

Add all required variables (but NOT .env file upload!)
```

### 2. Deploy
```bash
# Vercel CLI (if installed)
vercel env pull          # Download secrets
npm run verify:deploy    # Pre-deployment checks
vercel deploy            # Deploy to production

# Or use git push
git push                 # Vercel auto-deploys
```

### 3. Verify Production
```bash
# Check logs in Vercel Dashboard
# POST https://yourdomain.com/api/health
# Should return { status: 'OK', timestamp: '...' }
```

## 🔧 Troubleshooting

### "JWT_SECRET not configured"
```bash
npm run gen:jwt
# Check .env has JWT_SECRET=<long-hex-string>
npm start
```

### "Missing required build env"
```bash
npm run verify:env
# Follow printed instructions
npm run build
```

### "Database verification failed"
```bash
npm run verify:database
# Check Supabase Dashboard > SQL Editor > Migrations
# All migrations must be applied
```

### "CORS errors from frontend"
```
Check: CORS_ORIGIN in .env matches frontend URL
Current default: http://localhost:5173
For production: https://yourdomain.com
```

---

**Questions?** Check recent commits for changes:
```bash
git log --oneline -n 20 -- .env.example scripts/
```
