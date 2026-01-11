# BlueShark Project Setup Guide

## Quick Reference for Claude Code Setup

Use this guide to set up and run the BlueShark project on a new machine (Mac or Windows).

---

## Project Overview

**BlueShark** is a production management system for garment/textile manufacturing with:
- **Frontend**: Next.js 16 (React 19) with TypeScript, TailwindCSS 4
- **Backend**: Express.js 5 with TypeScript, Prisma ORM
- **Database**: PostgreSQL (hosted on Neon)

### Two Dashboards:
1. **Admin Dashboard** (`/Dashboard`) - Full system management
2. **Supervisor Dashboard** (`/SupervisorDashboard`) - Department-specific production tracking

---

## Project Structure

```
blueshark-dev/
├── src/                          # Frontend source (Next.js)
│   ├── app/
│   │   ├── Components/           # Shared components (Toast, Loader, etc.)
│   │   ├── Dashboard/            # Admin dashboard pages
│   │   │   ├── components/
│   │   │   │   ├── layout/       # Header, LeftSidebar, RightContent
│   │   │   │   ├── navigation/   # Navigation, SidebarItem
│   │   │   │   └── views/        # All admin views (BatchView, RollView, etc.)
│   │   │   └── page.tsx
│   │   ├── SupervisorDashboard/  # Supervisor dashboard pages
│   │   │   ├── components/       # Similar structure to Dashboard
│   │   │   ├── depcomponents/    # Department-specific components
│   │   │   │   ├── altered/      # Altered task handling
│   │   │   │   └── rejected/     # Rejected task handling
│   │   │   └── page.tsx
│   │   ├── loginandsignup/       # Authentication page
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Redirects to login
│   │   └── globals.css
│   └── middleware.ts             # Auth middleware (cookie-based)
├── blueshark-backend-test/
│   └── backend/                  # Backend source (Express)
│       ├── src/
│       │   ├── config/           # Database, environment config
│       │   ├── controllers/      # Route controllers
│       │   ├── middleware/       # Auth, security middleware
│       │   ├── routes/           # API route definitions
│       │   ├── services/         # Business logic
│       │   ├── types/            # TypeScript types
│       │   └── utils/            # Helpers (JWT, validation, etc.)
│       ├── prisma/
│       │   └── schema.prisma     # Database schema
│       ├── index.ts              # Express app entry point
│       ├── package.json
│       └── .env                  # Backend environment variables
├── package.json                  # Frontend dependencies
├── .env                          # Frontend environment variables
├── CLAUDE.md                     # Development history/context
└── BLUESHARK_SETUP_GUIDE.md      # This file
```

---

## Setup Instructions

### Prerequisites

1. **Node.js 18+** (recommended: 20.x)
2. **npm** or **yarn**
3. **PostgreSQL** database access (Neon hosted DB)
4. **Git**

### Step 1: Clone and Install Dependencies

```bash
# Navigate to project root
cd blueshark-dev

# Install frontend dependencies
npm install

# Navigate to backend folder
cd blueshark-backend-test/backend

# Install backend dependencies
npm install
```

### Step 2: Configure Backend Environment

Create or update `blueshark-backend-test/backend/.env`:

```env
# Database Connection (Neon PostgreSQL)
# Ask for credentials from team or use your own Neon DB
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST/neondb?sslmode=require"

# JWT Secret (use a strong random string, minimum 32 characters)
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long"

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Step 3: Set Up Database

```bash
# From backend folder: blueshark-backend-test/backend
cd blueshark-backend-test/backend

# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables if they don't exist)
npx prisma db push

# (Optional) View database in Prisma Studio
npx prisma studio
```

### Step 4: Configure Frontend Environment

The frontend `.env` file should already exist at project root. Verify these values:

```env
# CRITICAL: These URLs must match where your backend is running
NEXT_PUBLIC_API_LOGIN_URL_ADMIN=http://localhost:5000
NEXT_PUBLIC_API_LOGIN_URL_SUPERVISOR=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# All other endpoints are derived from NEXT_PUBLIC_API_URL
# No changes needed for the rest
```

### Step 5: Start the Servers

**Terminal 1 - Start Backend:**
```bash
cd blueshark-backend-test/backend
npm run dev
# Should show: "Server running on port 5000"
```

**Terminal 2 - Start Frontend:**
```bash
# From project root
npm run dev
# Should show: "Ready on http://localhost:3000"
```

### Step 6: Verify Setup

1. Backend health check: Open `http://localhost:5000/api/health` - should return OK
2. Frontend: Open `http://localhost:3000` - should redirect to login page
3. Test login with existing credentials (ask team for test accounts)

---

## Troubleshooting "Failed to Fetch" on Login

### Common Causes & Solutions:

#### 1. Backend Not Running
```bash
# Check if backend is running
curl http://localhost:5000/
# Should return: "Backend server is running!"

# If not, start it:
cd blueshark-backend-test/backend
npm run dev
```

#### 2. CORS Issues (Mac-specific)
The backend allows all origins in development mode. If you still have CORS issues:

Check `blueshark-backend-test/backend/index.ts` line 41-50:
```typescript
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? [...production_urls...]
    : "*",  // Allows all origins in development
  credentials: true,
}));
```

Make sure `NODE_ENV=development` in your backend `.env`.

#### 3. Database Connection Issues
```bash
# Test database connection
cd blueshark-backend-test/backend
npx prisma db pull
# If this fails, your DATABASE_URL is wrong
```

Check that:
- DATABASE_URL has correct username/password
- SSL mode is set: `?sslmode=require`
- Neon database is not paused (Neon pauses inactive free-tier DBs)

#### 4. Port Conflicts
```bash
# Check if port 5000 is already in use
lsof -i :5000  # Mac/Linux
# If occupied, kill the process or change PORT in backend .env
```

#### 5. Environment Variables Not Loading
```bash
# Restart both servers after changing .env files
# Next.js caches env vars - restart required!

# Backend
cd blueshark-backend-test/backend
npm run dev

# Frontend (restart with cleared cache)
cd ../..
npm run dev
```

#### 6. Network/Firewall Issues (Mac-specific)
On Mac, you may need to allow Node.js through the firewall:
- System Preferences > Security & Privacy > Firewall > Firewall Options
- Add Node.js or allow incoming connections

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/supervisor-login` - Supervisor login

### Core Resources
| Resource | Endpoints |
|----------|-----------|
| Rolls | `/api/rolls` |
| Batches | `/api/batches` |
| Sub-Batches | `/api/sub-batches` |
| Departments | `/api/departments` |
| Workers | `/api/workers` |
| Vendors | `/api/vendors` |
| Supervisors | `/api/supervisors` |

### Production Workflow
| Resource | Endpoints |
|----------|-----------|
| Worker Logs | `/api/worker-logs` |
| Department Sub-Batches | `/api/department-sub-batches` |
| Sub-Batch History | `/api/department-sub-batches/sub-batch-history/:id` |
| Advance Department | `/api/sub-batches/advance-department` |
| Send to Production | `/api/sub-batches/send-to-production` |

### Inventory
| Resource | Endpoints |
|----------|-----------|
| Inventory | `/api/inventory` |
| Inventory Categories | `/api/inventory-categories` |
| Inventory Subtraction | `/api/inventory-subtraction` |
| Inventory Addition | `/api/inventory/additions` |

---

## Database Schema Overview

### Core Entities:
- **rolls** - Raw material rolls (fabric)
- **batches** - Production batches made from rolls
- **sub_batches** - Sub-divisions of batches sent to production
- **departments** - Production departments
- **workers** - Factory workers
- **vendors** - Raw material suppliers

### Workflow Entities:
- **department_sub_batches** - Tracks sub-batch progress through departments
- **worker_logs** - Records of work done by workers
- **sub_batch_altered** - Altered/rework items
- **sub_batch_rejected** - Rejected items

### User Roles:
- `ADMIN` - Full system access
- `SUPERVISOR` - Single department access
- `SUPER_SUPERVISOR` - All departments access (no specific department)

---

## Development Commands

### Frontend (from project root):
```bash
npm run dev      # Start development server (with Turbopack)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend (from blueshark-backend-test/backend):
```bash
npm run dev           # Start with ts-node-dev (hot reload)
npm run build         # Compile TypeScript + push Prisma schema
npm run start         # Start compiled JS
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Create new migration
```

---

## Creating Test Users

To create an admin user for testing:

```bash
cd blueshark-backend-test/backend
npx prisma studio
```

In Prisma Studio:
1. Go to `User` table
2. Add new record:
   - email: `admin@test.com`
   - password: (bcrypt hash - see below)
   - role: `ADMIN`

To generate bcrypt hash:
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(console.log)"
```

Or create a supervisor:
1. Go to `Supervisor` table
2. Add new record with same fields + optional `departmentId`

---

## Key Technical Details

### Authentication Flow:
1. User submits email/password to `/api/auth/login`
2. Backend validates credentials, returns JWT token
3. Frontend stores token in:
   - Cookie (for middleware auth)
   - localStorage (for client-side access)
4. Subsequent requests include token in headers
5. Middleware checks cookie/token for protected routes

### Frontend State Management:
- React Context for global state (ToastContext, DepartmentContext)
- localStorage for persistent user data
- Component-level state with useState/useEffect

### Environment Variable Pattern:
Frontend uses `NEXT_PUBLIC_` prefix for client-accessible variables.
All API endpoints are derived from `NEXT_PUBLIC_API_URL`.

---

## Common Issues on Mac

1. **Node version mismatch**: Use `nvm` to manage Node versions
   ```bash
   nvm install 20
   nvm use 20
   ```

2. **Permission errors**: Don't use `sudo npm install`
   ```bash
   # Fix npm permissions
   sudo chown -R $(whoami) ~/.npm
   ```

3. **Prisma binary issues**: Regenerate Prisma client
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

4. **SSL certificate errors**: For Neon DB, ensure `sslmode=require` in DATABASE_URL

---

## Git Workflow

### Branch Structure:
- `main` - Production-ready code
- `feature/*` - Feature branches

### Commit Rules (from CLAUDE.md):
- DO NOT include Claude/AI attribution in commits
- All commits should appear as authored by **Zunkireelabs**

---

## Quick Checklist

Before saying "it's not working":

- [ ] Backend `.env` has correct DATABASE_URL
- [ ] Backend `.env` has JWT_SECRET set
- [ ] Backend is running on port 5000
- [ ] Frontend `.env` points to `http://localhost:5000`
- [ ] Both `npm install` completed without errors
- [ ] `npx prisma generate` ran successfully
- [ ] Database tables exist (`npx prisma db push`)
- [ ] No other process using port 5000 or 3000
- [ ] Restarted both servers after env changes

---

## Support

If you're still stuck:
1. Check browser DevTools > Network tab for actual error
2. Check backend terminal for error logs
3. Try `curl http://localhost:5000/api/health` to verify backend
4. Verify DATABASE_URL with `npx prisma db pull`

---

Last Updated: 2025-12-30
