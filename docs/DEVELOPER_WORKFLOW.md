# BlueShark Developer Workflow Guide

**Last Updated:** 2025-11-30

---

## Quick Start

```bash
# 1. Start backend (Terminal 1)
cd blueshark-backend-test/backend
npm run dev

# 2. Start frontend (Terminal 2)
npm run dev

# 3. Open browser
http://localhost:3000
```

**Login:** admin@gmail.com / admin

---

## Development Workflow

```
LOCAL (your PC)  →  DEV (shared preview)  →  PROD (live)
     ↓                    ↓                      ↓
  You test           Team reviews          Client uses
  Fast iteration     QC/approval           Stable only
```

### Step-by-Step Process

#### 1. Local Development

```bash
# Make sure you're on dev branch
git checkout dev
git pull origin dev

# Create feature branch (optional but recommended)
git checkout -b feature/my-feature

# Start local servers
cd blueshark-backend-test/backend && npm run dev  # Terminal 1
cd .. && npm run dev                               # Terminal 2

# Make your changes, test locally
# Iterate until feature works
```

#### 2. Push to Dev

```bash
# Commit your changes
git add .
git commit -m "feat: add my feature"

# Push to dev (or your feature branch)
git push origin dev
# OR
git push origin feature/my-feature

# Create PR if on feature branch
# feature/my-feature → dev
```

**Auto-deploy:** Vercel & Render will auto-deploy on push to `dev`

**Dev URLs:**
- Frontend: https://edge-flow-git-dev-sthasadins-projects.vercel.app
- Backend: https://edge-flow-backend-dev.onrender.com

#### 3. QC & Review

- Test on dev environment
- Share URL with team for review
- Fix any issues found
- Repeat until approved

#### 4. Deploy to Production

```bash
# Create PR: dev → main
# On GitHub: Pull Request → New → base: main, compare: dev

# After approval, merge the PR
# Production auto-deploys
```

**Prod URLs:**
- Frontend: https://edge-flow-gamma.vercel.app
- Backend: https://edge-flow-backend.onrender.com

---

## Environment Configuration

### Frontend (.env)

| Environment | NEXT_PUBLIC_API_URL |
|-------------|---------------------|
| Local | `http://localhost:5000/api` |
| Dev | `https://edge-flow-backend-dev.onrender.com/api` |
| Production | `https://edge-flow-backend.onrender.com/api` |

### Backend (.env)

| Environment | DATABASE_URL Host |
|-------------|-------------------|
| Local/Dev | `ep-orange-rice-a1w8omkg-pooler` (dev database) |
| Production | `ep-odd-sunset-a15pegww-pooler` (prod database) |

---

## Git Branch Strategy

```
main (production)
  │
  └── dev (development)
       │
       ├── feature/login-page
       ├── feature/dashboard-charts
       └── fix/worker-validation
```

### Branch Rules

| Branch | Purpose | Deploy To | Protection |
|--------|---------|-----------|------------|
| `main` | Production code | edge-flow-gamma.vercel.app | PR required |
| `dev` | Development/testing | edge-flow-git-dev-*.vercel.app | Direct push OK |
| `feature/*` | New features | Preview (if PR exists) | - |
| `fix/*` | Bug fixes | Preview (if PR exists) | - |

### Common Git Commands

```bash
# Start new feature
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# Save work in progress
git add .
git commit -m "wip: feature progress"
git push origin feature/my-feature

# Merge feature to dev
git checkout dev
git merge feature/my-feature
git push origin dev

# Deploy to production (via PR)
# Create PR: dev → main on GitHub
# After merge, prod auto-deploys
```

---

## Commit Message Convention

```
type: short description

type options:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation only
- style:    Formatting, no code change
- refactor: Code change that neither fixes bug nor adds feature
- test:     Adding tests
- chore:    Maintenance tasks
```

**Examples:**
```bash
git commit -m "feat: add worker billable tracking"
git commit -m "fix: correct quantity validation in modal"
git commit -m "docs: update API endpoint documentation"
git commit -m "refactor: extract shared modal styles"
```

---

## Database Notes

### Neon Free Tier Behavior

- **Auto-suspend:** Database sleeps after 5 minutes of inactivity
- **Cold start:** First request after sleep takes 5-10 seconds
- **Solution:** Just wait, or add `connect_timeout=30` to connection string

### Switching Databases

```bash
# In backend/.env

# Development (default for local)
DATABASE_URL="postgresql://...@ep-orange-rice-...neon.tech/neondb?sslmode=require"

# Production (only for deployment)
DATABASE_URL="postgresql://...@ep-odd-sunset-...neon.tech/neondb?sslmode=require"
```

### Prisma Commands

```bash
cd blueshark-backend-test/backend

# Push schema changes to database
npx prisma db push

# Generate Prisma client after schema changes
npx prisma generate

# Open database GUI
npx prisma studio

# Create admin user
npx ts-node seed-admin.ts
```

---

## Troubleshooting

### Frontend won't start

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Backend won't connect to database

1. Check if Neon database is awake (visit console.neon.tech)
2. Verify DATABASE_URL in .env
3. Make sure connection string doesn't have `psql '...'` wrapper

### Login not working

1. Check backend is running: `curl http://localhost:5000/api/health`
2. Check admin user exists: `npx prisma studio` → User table
3. If missing, run: `npx ts-node seed-admin.ts`

### Changes not showing in dev/prod

1. Check deployment status on Vercel/Render dashboards
2. Render free tier is slow (~2-3 min deploy)
3. Hard refresh browser: Ctrl+Shift+R

---

## Useful Links

| Resource | URL |
|----------|-----|
| GitHub Repo | github.com/Zunkiree-Technologies/edge-flow |
| Vercel Dashboard | vercel.com/dashboard |
| Render Dashboard | dashboard.render.com |
| Neon Console | console.neon.tech |
| Production App | edge-flow-gamma.vercel.app |
| Dev App | edge-flow-git-dev-sthasadins-projects.vercel.app |

---

## When to Skip Local Testing

Direct push to dev is acceptable for:
- Typo fixes
- Small CSS/styling changes
- README/documentation updates
- Environment variable changes
- When away from dev machine

**Always test locally for:**
- New features
- API changes
- Database schema changes
- Bug fixes
- Anything that could break the app

---

*Keep this guide updated as the workflow evolves!*
