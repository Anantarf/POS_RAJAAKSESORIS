# ⚡ Quick Setup Guide

## 1. Clone & Install
```bash
git clone <repo>
cd POS-RAJA-AKSESORIS-REVISI-main
npm install
cd backend && npm install && cd ..
```

## 2. Configure Environment

### Get Credentials from Supabase
1. Go to https://supabase.com > Your Project > Settings > API
2. Copy these 4 values:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **Anon Key** → `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY` (🔐 backend only)
   - **JWT Secret** (from Auth section if available)

### Setup .env Files
```bash
# Create from template
cp .env.example .env
cp backend/.env.example backend/.env

# Fill Supabase values in both files

# Generate JWT_SECRET and add to .env
npm run gen:jwt

# Verify everything is correct
npm run verify:env
```

## 3. Verify Database Schema
```bash
npm run verify:database
```

If this fails, apply Supabase migrations:
- Go to Supabase Dashboard > SQL Editor
- Run pending migrations

## 4. Development

### Terminal 1: Frontend
```bash
npm run dev
# Vite server on http://localhost:5173
```

### Terminal 2: Backend (Optional for local testing)
```bash
cd backend
npm run dev
# Express server on http://localhost:3002
```

### Terminal 3: WhatsApp Testing
```bash
cd backend
npm run test:wa
```

## 5. Verify Setup
```bash
# Check all required configs
npm run verify:env

# Check database
npm run verify:database

# Run tests
npm test
npm run test:money  # Critical money operations

# Full pre-deployment check
npm run verify:deploy
```

## 🚀 Production Deployment (Vercel)

### 1. Push to GitHub
```bash
git add .
git commit -m "setup: configure environment validation"
git push
```

### 2. Connect to Vercel
- Go to https://vercel.com > Add New Project
- Import your GitHub repo
- Click "Environment Variables"

### 3. Add Secrets
Paste all values from your `.env` file:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
CORS_ORIGIN=https://yourdomain.com
FONNTE_TOKEN=...
FONNTE_TARGETS=...
```

### 4. Deploy
```bash
git push
# Vercel auto-deploys
```

## 📋 Environment Variables Quick Ref

| Var | Source | Backend Only? | Example |
|-----|--------|---------------|---------|
| `VITE_SUPABASE_URL` | Supabase Settings | No | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Settings | No | `eyJhb...` |
| `SUPABASE_URL` | Supabase Settings | Yes | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Settings | Yes | `eyJhb...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings | **YES** 🔐 | `eyJhb...` |
| `JWT_SECRET` | Generate | Yes | `a1b2c3d4...` (32+ chars) |
| `CORS_ORIGIN` | Your domain | Yes | `http://localhost:5173` |
| `FONNTE_TOKEN` | Fonnte Dashboard | Yes | `e6jEV491...` |
| `FONNTE_TARGETS` | Your choice | Yes | `6287884820507` |

## 🆘 Troubleshooting

### "JWT_SECRET not configured"
```bash
npm run gen:jwt
npm run verify:env
```

### "Missing SUPABASE_SERVICE_ROLE_KEY"
- Supabase Dashboard > Settings > API > Service Role Key
- Copy & paste to both `.env` files

### "Database verification failed"
```bash
npm run verify:database
# Check Supabase > SQL Editor for failed migrations
```

### "CORS errors in browser"
```
Check .env: CORS_ORIGIN should match your frontend URL
Development: http://localhost:5173
Production: https://yourdomain.com
```

### "Frontend can't connect to backend"
- Check `VITE_BACKEND_URL` in `.env` (only needed if backend separate)
- On Vercel: frontend auto-uses relative `/api/` paths

## 📚 More Documentation
- [Security Guide](SECURITY.md) - Credentials, best practices, troubleshooting
- [Audit Report](AUDIT.md) - Full backend & database audit
- [Architecture](ARCHITECTURE.md) - System design & data flow

## ✅ Checklist Before Deployment
- [ ] `.env` file exists (NOT committed!)
- [ ] `npm run verify:env` passes
- [ ] `npm run verify:database` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] `npm run verify:deploy` passes
- [ ] Vercel secrets are set
- [ ] CORS_ORIGIN points to production domain
- [ ] JWT_SECRET is unique (not example value)

---

**Ready?** Start with:
```bash
npm run verify:env
```
