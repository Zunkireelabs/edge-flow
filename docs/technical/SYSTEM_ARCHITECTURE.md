# BlueShark System Architecture
**Version:** 1.0.0
**Last Updated:** 2025-11-29
**Authors:** Development Team

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Environment Strategy](#3-environment-strategy)
4. [Database Architecture](#4-database-architecture)
5. [Deployment Pipeline](#5-deployment-pipeline)
6. [Multi-Client Scalability](#6-multi-client-scalability)
7. [Current Status & Issues](#7-current-status--issues)
8. [Action Items](#8-action-items)

---

## 1. Executive Summary

BlueShark is a **Production Management System** designed for textile/garment manufacturing operations. The system tracks:
- Rolls → Batches → Sub-Batches → Department workflow
- Worker assignments and productivity
- Quality Control (alterations, rejections)
- Billing and reporting

**Architecture Goal:** Build a scalable SaaS platform that can serve multiple clients while maintaining strict data isolation and easy deployment.

---

## 2. System Overview

### 2.1 Technology Stack

| Layer      | Technology        | Purpose                          |
|------------|-------------------|----------------------------------|
| Frontend   | Next.js 15.5      | React-based web application      |
| Backend    | Express.js + Node | REST API server                  |
| ORM        | Prisma            | Database abstraction & migrations|
| Database   | PostgreSQL (Neon) | Serverless, branch-based DB      |
| Hosting    | Vercel + Render   | Frontend + Backend hosting       |
| Version Control | GitHub       | Code repository & CI/CD triggers |

### 2.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USERS                                      │
│                    (Admin / Supervisor)                              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vercel)                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Next.js Application                                         │    │
│  │  - Admin Dashboard (/Dashboard)                              │    │
│  │  - Supervisor Dashboard (/SupervisorDashboard)               │    │
│  │  - Login Pages                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Production: edge-flow-gamma.vercel.app                             │
│  (Auto-deploys from: main branch)                                   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTPS API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Render)                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Express.js API Server                                       │    │
│  │  - /api/auth/* (Authentication)                              │    │
│  │  - /api/rolls, /api/batches, /api/sub-batches               │    │
│  │  - /api/workers, /api/departments                            │    │
│  │  - /api/worker-logs, /api/department-sub-batches            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Production: edge-flow-backend.onrender.com                         │
│  (Auto-deploys from: main branch)                                   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (Neon PostgreSQL)                      │
│  ┌──────────────────────┐    ┌──────────────────────┐               │
│  │  production branch   │    │  development branch  │               │
│  │  (Client Data)       │    │  (Testing/Dev)       │               │
│  │  30.79 MB            │    │  Clean sandbox       │               │
│  │                      │    │                      │               │
│  │  ep-odd-sunset-*     │    │  ep-orange-rice-*    │               │
│  └──────────────────────┘    └──────────────────────┘               │
│                                                                      │
│  Region: Singapore (ap-southeast-1)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Environment Strategy

### 3.1 Two-Environment Model

| Environment | Purpose | Who Uses | Data |
|-------------|---------|----------|------|
| **Development** | Build features, fix bugs, experiment | Developers | Test/mock data only |
| **Production** | Live client operations | Client users | Real production data |

### 3.2 Environment Configuration

#### Development Environment
```
Frontend: localhost:3000
Backend:  localhost:4000
Database: Neon development branch (ep-orange-rice-*)
```

#### Production Environment
```
Frontend: edge-flow-gamma.vercel.app
Backend:  edge-flow-backend.onrender.com
Database: Neon production branch (ep-odd-sunset-*)
```

### 3.3 Golden Rules

1. **NEVER** connect local development to production database
2. **NEVER** push directly to main branch (always PR from dev branch)
3. **ALWAYS** test in development before merging to production
4. **ALWAYS** back up production data before major migrations

---

## 4. Database Architecture

### 4.1 Neon Branch Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     NEON PROJECT                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  production (DEFAULT)                                │    │
│  │  └── Client's live data                             │    │
│  │      └── All tables with real records               │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          │ (branched from)                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  development                                         │    │
│  │  └── Schema only (no client data)                   │    │
│  │      └── Used for feature development               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Database Schema (Core Tables)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│    Vendor    │     │     Roll     │     │      Batch       │
├──────────────┤     ├──────────────┤     ├──────────────────┤
│ id           │◄────│ vendor_id    │◄────│ roll_id          │
│ name         │     │ id           │     │ id               │
│ contact      │     │ name         │     │ name             │
│ address      │     │ type         │     │ quantity         │
└──────────────┘     │ quantity     │     │ color            │
                     │ unit         │     │ unit             │
                     └──────────────┘     │ date             │
                                          └────────┬─────────┘
                                                   │
                                                   ▼
┌──────────────┐     ┌──────────────────────────────────────┐
│  Department  │     │              SubBatch                │
├──────────────┤     ├──────────────────────────────────────┤
│ id           │◄────│ id                                   │
│ name         │     │ batch_id                             │
│ order        │     │ name                                 │
│ description  │     │ quantity                             │
└──────┬───────┘     │ current_department_id                │
       │             │ status                               │
       │             │ department_flow                      │
       │             └────────────────┬─────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────────────────────────────────────────────────┐
│              DepartmentSubBatch (Junction)               │
├──────────────────────────────────────────────────────────┤
│ id                                                       │
│ sub_batch_id ──────────────────────────────────────────►│
│ department_id ◄─────────────────────────────────────────│
│ quantity_received                                        │
│ quantity_sent                                            │
│ status (PENDING/IN_PROGRESS/COMPLETED/SENT)             │
│ is_current                                               │
└──────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│                      WorkerLog                           │
├──────────────────────────────────────────────────────────┤
│ id                                                       │
│ department_sub_batch_id                                  │
│ worker_id ────────────────────────────────────────────► │
│ quantity                                                 │
│ date                                                     │
│ activity_type (NORMAL/ALTERED/REJECTED)                 │
│ is_billable                                              │
└──────────────────────────────────────────────────────────┘
```

### 4.3 Database Connection Strings

| Branch | Endpoint | Pooler URL |
|--------|----------|------------|
| production | ep-odd-sunset-a15pegww | `postgresql://neondb_owner:***@ep-odd-sunset-a15pegww-pooler.ap-southeast-1.aws.neon.tech/neondb` |
| development | ep-orange-rice-a1w8omkg | `postgresql://neondb_owner:***@ep-orange-rice-a1w8omkg-pooler.ap-southeast-1.aws.neon.tech/neondb` |

---

## 5. Deployment Pipeline

### 5.1 Git Branch Strategy

```
main (protected)
  │
  │◄─── Merge via PR (requires review)
  │
sadin/dev (development branch)
  │
  │◄─── All development work happens here
  │
feature/* (optional feature branches)
```

### 5.2 Deployment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Developer  │────►│  sadin/dev  │────►│    PR to    │────►│    main     │
│  commits    │     │  branch     │     │    main     │     │   branch    │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                          ┌────────────────────────────────────────┴────┐
                          │                                             │
                          ▼                                             ▼
                   ┌─────────────┐                              ┌─────────────┐
                   │   Vercel    │                              │   Render    │
                   │  Frontend   │                              │   Backend   │
                   │  Auto-deploy│                              │  Auto-deploy│
                   └─────────────┘                              └─────────────┘
```

### 5.3 Deployment Checklist

Before merging to main:
- [ ] All features tested in development
- [ ] No TypeScript/ESLint errors
- [ ] Database migrations tested
- [ ] API endpoints tested
- [ ] Environment variables verified
- [ ] Backup production data (if schema changes)

---

## 6. Multi-Client Scalability

### 6.1 Future Architecture (Multi-Tenant)

When onboarding new clients, we have two options:

#### Option A: Shared Database with Tenant ID
```
┌─────────────────────────────────────────────────────────────┐
│  Single Database                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  All tables have: tenant_id column                   │    │
│  │  - Client A data: tenant_id = 1                     │    │
│  │  - Client B data: tenant_id = 2                     │    │
│  │  - Client C data: tenant_id = 3                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```
**Pros:** Single deployment, easy maintenance
**Cons:** Data isolation requires careful coding, harder compliance

#### Option B: Separate Database per Client (Recommended)
```
┌─────────────────────────────────────────────────────────────┐
│  Neon Project                                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │  client_a_db  │  │  client_b_db  │  │  client_c_db  │    │
│  │  (branch)     │  │  (branch)     │  │  (branch)     │    │
│  └───────────────┘  └───────────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────────┘
```
**Pros:** Complete data isolation, easy compliance, client-specific customization
**Cons:** More infrastructure to manage

### 6.2 Recommended Multi-Client Setup

```
For each new client:
1. Create new Neon branch: client_{name}_prod
2. Create new Render backend instance (or use dynamic DB routing)
3. Create new Vercel deployment (or use subdomain routing)
4. Configure client-specific environment variables

Example:
- Client A: clienta.blueshark.app → clienta-backend → client_a_db
- Client B: clientb.blueshark.app → clientb-backend → client_b_db
```

---

## 7. Current Status & Issues

### 7.1 What's Working ✅

| Component | Status | URL |
|-----------|--------|-----|
| GitHub Repository | ✅ Live | github.com/Zunkiree-Technologies/edge-flow |
| Vercel Frontend | ✅ Deployed | edge-flow-gamma.vercel.app |
| Render Backend | ✅ Running | edge-flow-backend.onrender.com |
| Neon Database | ✅ Provisioned | ap-southeast-1 (Singapore) |

### 7.2 Current Issues 🔴

| Issue | Severity | Description | Resolution |
|-------|----------|-------------|------------|
| Production DB Tables Missing | 🔴 CRITICAL | Render backend cannot find tables | Run `prisma db push` on production |
| Login Not Working | 🔴 CRITICAL | Users cannot authenticate | Depends on DB fix |
| Local .env Misconfigured | 🟡 WARNING | Points to wrong endpoints | Update local .env files |

### 7.3 Environment Variable Status

#### Render Backend (.env on Render)
```
DATABASE_URL = ??? (Need to verify)
JWT_SECRET   = ??? (Need to verify)
```

#### Vercel Frontend (Environment Variables)
```
NEXT_PUBLIC_API_URL                  = https://edge-flow-backend.onrender.com ✅
NEXT_PUBLIC_API_LOGIN_URL_ADMIN      = https://edge-flow-backend.onrender.com/auth/login ❌
NEXT_PUBLIC_API_LOGIN_URL_SUPERVISOR = https://edge-flow-backend.onrender.com/auth/supervisor-login ❌
```

**Note:** Login URLs should be `/api/auth/login` not `/auth/login`

---

## 8. Action Items

### Phase 1: Fix Production (CRITICAL)

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1.1 | Verify Render DATABASE_URL points to production Neon branch | DevOps | ⏳ |
| 1.2 | Run `prisma db push` to create tables in production | DevOps | ⏳ |
| 1.3 | Create admin user in production database | DevOps | ⏳ |
| 1.4 | Fix Vercel login URL environment variables | DevOps | ⏳ |
| 1.5 | Test login on production | QA | ⏳ |

### Phase 2: Fix Development Environment

| # | Task | Owner | Status |
|---|------|-------|--------|
| 2.1 | Configure local backend .env for development DB | Dev | ⏳ |
| 2.2 | Configure local frontend .env for localhost | Dev | ⏳ |
| 2.3 | Seed development database with test data | Dev | ⏳ |
| 2.4 | Test local development workflow | Dev | ⏳ |

### Phase 3: Documentation

| # | Task | Owner | Status |
|---|------|-------|--------|
| 3.1 | Complete API documentation | Dev | ⏳ |
| 3.2 | Create database schema documentation | Dev | ⏳ |
| 3.3 | Write deployment runbook | DevOps | ⏳ |
| 3.4 | Create developer onboarding guide | Dev | ⏳ |

### Phase 4: Security & Performance (Future)

| # | Task | Owner | Status |
|---|------|-------|--------|
| 4.1 | Implement password hashing (bcrypt) | Dev | ⏳ |
| 4.2 | Add database indexes | Dev | ⏳ |
| 4.3 | Optimize N+1 queries | Dev | ⏳ |
| 4.4 | Set up monitoring/logging | DevOps | ⏳ |

---

## Appendix

### A. Useful Commands

```bash
# Local Development
cd blueshark-backend-test/backend
npm run dev

# Database Operations
npx prisma db push          # Push schema to database
npx prisma generate         # Generate Prisma client
npx prisma studio           # Open database GUI

# Git Workflow
git checkout sadin/dev      # Switch to dev branch
git pull origin sadin/dev   # Get latest changes
git push origin sadin/dev   # Push changes

# Deployment
# Vercel: Auto-deploys on push to main
# Render: Auto-deploys on push to main
```

### B. Contact & Resources

- **GitHub Repo:** github.com/Zunkiree-Technologies/edge-flow
- **Neon Console:** console.neon.tech
- **Vercel Dashboard:** vercel.com/dashboard
- **Render Dashboard:** dashboard.render.com

---

**Document Status:** Living document - update as architecture evolves
