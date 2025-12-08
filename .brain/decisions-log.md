# BlueShark - Technical Decisions Log

**Purpose:** Track major technical decisions and their rationale
**Last Updated:** December 8, 2025

---

## Architecture Decisions

### Decision: Next.js 15 with Turbopack
**Date:** November 2025
**Decision:** Use Next.js 15.5.2 with Turbopack for development
**Rationale:**
- Turbopack provides faster dev server startup and HMR
- Next.js 15 offers improved performance
- React 19 compatibility
**Impact:** `npm run dev --turbopack` and `npm run build --turbopack` in scripts

---

### Decision: Tailwind CSS v4
**Date:** November 2025
**Decision:** Use Tailwind CSS v4.1.12
**Rationale:**
- Latest version with improved performance
- Better JIT compilation
- New features for modern CSS
**Impact:** May have some syntax differences from v3 examples online

---

### Decision: Neon PostgreSQL with Branch Strategy
**Date:** November 2025
**Decision:** Use Neon serverless PostgreSQL with branch-based environments
**Rationale:**
- Serverless = no cold start management
- Branch strategy allows isolated dev/prod databases
- Easy to create new branches for features
**Impact:**
- `production` branch for live data
- `development` branch for testing
- Each branch has its own connection string

---

### Decision: Separate Admin and Supervisor Dashboards
**Date:** November 2025
**Decision:** Maintain separate route trees for Admin (`/Dashboard`) and Supervisor (`/SupervisorDashboard`)
**Rationale:**
- Clear separation of concerns
- Different navigation items per role
- Easier to customize per-role features
- Simpler permission management
**Impact:** Some component duplication, but clearer structure

---

## Build & Deployment Decisions

### Decision: Strict TypeScript ESLint Rules
**Date:** December 1, 2025
**Decision:** Maintain strict `@typescript-eslint/no-explicit-any` rule in production builds
**Rationale:**
- Vercel builds were failing due to `any` type usage in `BatchView.tsx`
- Strict typing catches errors at compile time
- Improves code quality and maintainability
**Impact:**
- All sorting logic must use proper type-safe implementations
- No `any` types allowed - use proper union types or generics
- Build failures provide early warning of type issues

---

## UI/UX Decisions

### Decision: Kanban Card Information Display
**Date:** December 1, 2025
**Decision:** Display Altered and Rejected counts on Kanban cards with color-coded indicators
**Rationale:**
- Users need "info at a glance" for quick decisions
- Enterprise-level UX following Databricks/HubSpot patterns
- Reduces need to open task details to see key metrics
**Impact:**
- Kanban cards show: Remaining (gray), Processed (green), Altered (amber), Rejected (red)
- Only show Altered/Rejected when count > 0 (keep cards clean)
- Processed calculation: `received - remaining - altered - rejected`
- Icons: Package (Remaining), CheckCircle (Processed), RefreshCw (Altered), XCircle (Rejected)

---

### Decision: Modal Width Standardization
**Date:** November 22, 2025
**Decision:** All modals use `max-w-xl` (640px)
**Rationale:**
- Consistency across application
- Matches Add Batch modal which was the reference
- Not too wide, not too narrow
**Impact:** Updated all 7 modal components

---

### Decision: Full-Height Modals with Blur Backdrop
**Date:** November 22, 2025
**Decision:** Modals extend full viewport height with blur backdrop
**Rationale:**
- Modern, professional appearance
- Clear focus on modal content
- Sticky footer buttons always visible
**Impact:**
- `h-screen` instead of `max-h-[90vh]`
- `backdrop-filter: blur(4px)`
- No border radius

---

### Decision: Batch-First Selection in Sub-Batch Creation
**Date:** November 22, 2025
**Decision:** Show batch dropdown first, auto-fill roll when batch selected
**Rationale:**
- Logical flow (sub-batches come FROM batches)
- Reduces user confusion
- Ensures data consistency (batch→roll relationship)
- Rich dropdown shows batch details
**Impact:**
- Batch dropdown moved to top of form
- Roll dropdown disabled (auto-filled)
- Roll labeled "(Auto-filled from Batch)"

---

### Decision: Compact Modal Spacing
**Date:** November 22, 2025
**Decision:** Reduce spacing in modals (space-y-3, p-4, mb-1.5)
**Rationale:**
- More content visible without scrolling
- Matches modern design trends
- Still maintains readability
**Impact:**
- Updated spacing across all modals
- `space-y-5` → `space-y-3`
- `p-6` → `p-4`
- `mb-2` → `mb-1.5`

---

### Decision: Standardized Add Button Design
**Date:** November 22, 2025
**Decision:** All "Add" buttons use consistent pill-shaped design with hover animation
**Rationale:**
- Visual consistency
- Clear call-to-action
- Professional appearance
**Impact:**
- `bg-blue-600` (darker blue)
- `rounded-xl` (pill shape)
- `hover:scale-105` (subtle animation)
- `shadow-md` → `hover:shadow-lg`

---

## Data Flow Decisions

### Decision: Quantity-Based Department Advancement
**Date:** November 13, 2025
**Decision:** Require quantity input when advancing work to next department
**Rationale:**
- Allows partial advancement (not all-or-nothing)
- Better tracking of exact quantities moved
- Backend requires this for proper calculations
**Impact:**
- Added quantity input field in advancement modal
- Validation against available quantity
- API payload includes `quantityBeingSent`

---

### Decision: Department-Based Worker Filtering
**Date:** November 13, 2025
**Decision:** Filter worker logs by current department, not just activity type
**Rationale:**
- When tasks move between departments, only show relevant workers
- Prevents confusion about which workers belong to which department
- Matches business logic (supervisor sees their department only)
**Impact:**
- Added `department_id` filtering to worker log queries
- Uses localStorage `departmentId` for comparison

---

### Decision: Billable/Not Billable Tracking
**Date:** November 13, 2025
**Decision:** Add explicit billable flag to worker assignments
**Rationale:**
- Some work is not chargeable (training, rework, etc.)
- Wage calculation needs to filter by billable status
- Clear visibility in UI with status badges
**Impact:**
- Added `is_billable` field to worker log creation
- Added checkbox in assignment form
- Added status badge in worker table

---

## Backend Decisions

### Decision: Local Backend for Development
**Date:** November 29, 2025
**Decision:** Run local Express backend on port 5000 for development
**Rationale:**
- Faster iteration (no Render deploy wait)
- Works offline
- Easy to debug
- Production backend stays stable
**Impact:**
- `.env` switches between localhost:5000 and render.com URLs
- Local backend in `blueshark-backend-test/` directory

---

### Decision: JWT Token in localStorage
**Date:** November 2025
**Decision:** Store JWT token in localStorage (not httpOnly cookie)
**Rationale:**
- Simple implementation
- Easy to access from frontend
- Standard approach for SPAs
**Trade-offs:**
- Vulnerable to XSS (future: move to httpOnly cookies)
- Must clear on logout
**Future:** Consider migrating to httpOnly cookies for security

---

## Naming Conventions

### Decision: Environment Variable Prefixes
**Date:** November 2025
**Decision:** Use `NEXT_PUBLIC_` prefix for all frontend-accessible env vars
**Rationale:**
- Next.js requirement for client-side access
- Clear distinction from server-only vars
- Consistent pattern
**Impact:** All API URLs prefixed with `NEXT_PUBLIC_`

---

### Decision: API Endpoint Structure
**Date:** November 2025
**Decision:** RESTful endpoints: `/${resource}` for collection, `/${resource}/:id` for single
**Rationale:**
- Standard REST convention
- Easy to understand and maintain
- Consistent across all resources
**Impact:**
- GET /rolls - list all
- GET /rolls/:id - get one
- POST /rolls - create
- PUT /rolls/:id - update
- DELETE /rolls/:id - delete

---

## Deployment Decisions

### Decision: Production v1.0 Release Strategy
**Date:** December 8, 2025
**Decision:** Deploy clean production with single admin user for client handoff
**Rationale:**
- Client needs clean slate to start real data
- Single admin account (admin@gmail.com) for initial access
- Dev branch continues parallel development
- Production updates via merge to main
**Impact:**
- Created `cleanup_production.ts` for database reset
- Created `create_admin.ts` for admin user creation
- `.env.production` for Vercel environment variables
- Development model: dev branch → test → main (production)

---

### Decision: Vercel Environment Variables via .env.production
**Date:** December 8, 2025
**Decision:** Use `.env.production` file with full URLs (no variable interpolation)
**Rationale:**
- Vercel doesn't support `${VAR}` interpolation in environment variables
- Each `NEXT_PUBLIC_*` variable needs complete URL
- `.env.production` is read during Vercel build process
**Impact:**
- Created `.env.production` with 40+ explicit URLs
- All URLs point to `https://edge-flow-backend.onrender.com/api`
- Local `.env` remains for localhost development
- Fixed "Error saving vendor" production issue

---

### Decision: Git Branch Strategy for Production
**Date:** December 8, 2025
**Decision:** Two-branch workflow: `main` (production) and `dev` (development)
**Rationale:**
- Clear separation of stable and experimental code
- Safe production deployments via merge
- Dev can be broken without affecting production
- Vercel auto-deploys each branch to different URLs
**Impact:**
- `main` → edge-flow-gamma.vercel.app (production)
- `dev` → edge-flow-git-dev-*.vercel.app (staging)
- All new work happens on `dev` first
- Production updates require merge to `main`

---

## Future Considerations

### Pending Decision: Multi-Tenant Architecture
**Options:**
1. Shared database with tenant_id column
2. Separate database per client (Neon branches)

**Leaning toward:** Option 2 (separate databases)
**Rationale:**
- Complete data isolation
- Easier compliance
- Client-specific customization possible
- Neon makes branching easy

---

### Pending Decision: State Management
**Current:** React hooks only (local state)
**Future consideration:** React Query or SWR for server state
**Rationale:**
- Better caching
- Automatic refetching
- Optimistic updates
- Reduced boilerplate

---

**Log new decisions as they are made. This document helps future sessions understand "why" not just "what".**
