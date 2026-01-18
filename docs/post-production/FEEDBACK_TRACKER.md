# BlueShark - Client Feedback Tracker

**Purpose:** Track all client feedback from production usage and convert to actionable items
**Client:** Zunkiree Technologies (Khum)
**Production URL:** https://edge-flow-gamma.vercel.app

---

## How This Works

### 1. Client Reports Issue/Feedback
- Via WhatsApp, call, or email
- Document it immediately in "Incoming Feedback" section below

### 2. Triage & Categorize
- Assign FB-XXX ID
- Determine type: Bug | UI/UX | Feature Request | Question
- Set priority: Critical | High | Medium | Low

### 3. Convert to Action
- If Bug/UI: Add to `docs/BACKLOG.md`
- If Feature: Add to `docs/ROADMAP.md` or BACKLOG
- If Question: Answer and document resolution

### 4. Track Resolution
- Update status as work progresses
- Link to commits/PRs when fixed
- Notify client when deployed

---

## Priority Definitions

| Priority | Definition | Response Time |
|----------|------------|---------------|
| **Critical** | Production down, data loss, can't use system | Same day |
| **High** | Major feature broken, blocking work | 1-2 days |
| **Medium** | Minor bug, workaround exists | This week |
| **Low** | Nice to have, polish items | Next sprint |

---

## Incoming Feedback

### Template
```
### FB-XXX: [Short Title]
**Date:** YYYY-MM-DD
**Reported By:** [Name]
**Type:** Bug | UI/UX | Feature Request | Question
**Priority:** Critical | High | Medium | Low
**Status:** New | Investigating | In Progress | Fixed | Deployed | Won't Fix

**Description:**
[What the client reported - their exact words if possible]

**Steps to Reproduce:** (if bug)
1.
2.
3.

**Expected vs Actual:**
- Expected:
- Actual:

**Screenshots/Videos:** [Link or "None"]

**Resolution:**
- [ ] Added to BACKLOG as [ID]
- [ ] Fixed in commit [hash]
- [ ] Deployed on [date]
- [ ] Client notified

**Notes:**
[Any additional context, workarounds given, etc.]
```

---

## Active Feedback

<!-- Add new feedback items here using the template above -->

### FB-004: Clear all data for fresh start
**Date:** 2026-01-18
**Reported By:** Khum
**Type:** Feature Request
**Priority:** High
**Status:** Deployed

**Description:**
Client wants to clear all existing data to start fresh with production.

**Requirements:**
- Create backup snapshot before clearing
- Keep admin@gmail.com / admin login credentials
- Clear: inventory, workers, rolls, batches, sub-batches, departments, vendors, supervisors

**Resolution:**
- [x] Created backup snapshot at docs/backups/2026-01-18-production-backup.json (352 records, 116KB)
- [x] Cleared all data via Prisma script (backup-and-reset.ts)
- [x] Verified admin login works (admin@gmail.com preserved)
- [x] Client verified - production site cleared

**Notes:**
Script created at `blueshark-backend-test/backend/scripts/backup-and-reset.ts`
Production backup contains: 1 User, 1 Supervisor, 5 departments, 5 vendors, 12 rolls, 8 batches, 10 sub_batches, 19 workers, 60 worker_logs, etc.

---

### FB-003: Inventory modal not scrollable on tablet devices
**Date:** 2025-12-09
**Reported By:** Khum
**Type:** UI/UX
**Priority:** Medium
**Status:** Investigating

**Description:**
Client using the software on a tablet device reports that the "Add New Item" modal in Inventory view is not scrollable. They cannot see the Save button or any CTA at the bottom of the modal.

**Steps to Reproduce:**
1. Open the app on a tablet device (or Chrome DevTools iPad Pro 1024x1366)
2. Go to Inventory page
3. Click "Add Item" button
4. Modal opens but footer with Save/Cancel buttons is cut off
5. Cannot scroll to see the buttons

**Expected vs Actual:**
- Expected: Modal should be scrollable, footer with Save/Cancel buttons should be visible
- Actual: Modal content extends beyond viewport, footer is not visible, cannot scroll

**Screenshots/Videos:** `temp_ss/image copy 3.png`, `temp_ss/image copy 4.png`, `temp_ss/image copy 5.png`

**Resolution:**
- [ ] Added to BACKLOG
- [ ] Fixed in commit [hash]
- [ ] Deployed on [date]
- [ ] Client notified

**Notes:**
Multiple fix attempts made:
- Flexbox layout with flex-shrink-0/flex-1/overflow-y-auto
- CSS Grid with auto/1fr/auto
- Absolute positioning with explicit pixel heights
- React Portal to escape overflow constraints
- Various viewport height units (100vh, 100dvh, -webkit-fill-available)
- inset-y-0 for full viewport height

All approaches work on desktop but fail on tablet simulation. Issue deferred for further investigation.

### FB-002: Failed to fetch inventory items
**Date:** 2025-12-08
**Reported By:** Khum
**Type:** Bug
**Priority:** High
**Status:** Fixed

**Description:**
Inventory page shows "Failed to fetch inventory items" error. Other pages (Batch View, Sub Batch View) are now working after FB-001 fix.

**Steps to Reproduce:**
1. Go to https://edge-flow-gamma.vercel.app
2. Login as admin
3. Go to Inventory page
4. See error toast "Failed to fetch inventory items"

**Expected vs Actual:**
- Expected: Inventory items load
- Actual: "Failed to fetch inventory items" error, 0 results

**Screenshots/Videos:** `temp_ss/image copy 27.png`

**Resolution:**
- [x] Root cause identified: `inventory_category` and `inventory` tables missing from production database
- [x] Fixed via `npx prisma db push` against production Neon database
- [x] Fixed on 2025-12-08
- [ ] Client notified

**Notes:**
Root cause: Production Neon database was missing the inventory-related tables (`inventory_category`, `inventory`, `inventory_addition`, `inventory_subtraction`).

Fix: Ran `npx prisma db push` locally with production DATABASE_URL to sync schema.

---

## Resolved Feedback

### FB-001: Failed to fetch data on Dashboard, Batch View, Sub Batch View
**Date:** 2025-12-08
**Reported By:** Khum
**Type:** Bug
**Priority:** Critical
**Status:** Deployed

**Description:**
Client reports that when accessing the app, Batch View and Sub Batch View show "Failed to fetch" errors. Dashboard shows multiple error toasts: "Failed to fetch batches", "Failed to fetch rolls", "Failed to fetch vendors".

**Steps to Reproduce:**
1. Go to https://edge-flow-gamma.vercel.app
2. Login as admin
3. View Dashboard - see error toasts
4. Go to Batch View or Sub Batch View - "Failed to fetch"

**Expected vs Actual:**
- Expected: Data loads normally
- Actual: Multiple "Failed to fetch" errors, all counts show 0

**Screenshots/Videos:** `temp_ss/image copy 25.png`

**Resolution:**
- [x] Root cause identified: `.env.production` was missing, frontend using localhost URLs
- [x] Fixed in commit `4c99130` (dev) → `d172954` (main)
- [x] Deployed on 2025-12-08
- [ ] Client notified

**Notes:**
Root cause: The `.env.production` file was missing from the repository. Vercel was falling back to `.env` which had localhost:5000 URLs instead of the production backend URL (edge-flow-backend.onrender.com).

Fix: Created `.env.production` with all 40+ environment variables pointing to production backend.

---

## Feedback Summary

| ID | Title | Type | Priority | Status | Date |
|----|-------|------|----------|--------|------|
| FB-004 | Clear all data for fresh start | Feature Request | High | Deployed | 2026-01-18 |
| FB-003 | Modal not scrollable on tablet | UI/UX | Medium | Investigating | 2025-12-09 |
| FB-002 | Failed to fetch inventory | Bug | High | Fixed | 2025-12-08 |
| FB-001 | Failed to fetch data | Bug | Critical | Deployed | 2025-12-08 |

---

## Quick Actions

### When Client Reports Something:

1. **Acknowledge immediately**: "Got it, looking into it"
2. **Document here**: Add FB-XXX entry
3. **Investigate**: Check logs, reproduce issue
4. **Communicate**: Tell client ETA or ask clarifying questions
5. **Fix & Deploy**: Work on dev → test → merge to main
6. **Confirm**: Ask client to verify fix

### Emergency Protocol (Critical Issues):

1. Check production logs immediately
2. If data issue: Check Neon database
3. If backend down: Check Render dashboard
4. If frontend broken: Check Vercel deployment
5. Hotfix if needed, deploy ASAP
6. Post-mortem after resolved

---

## Links

- **BACKLOG:** `docs/BACKLOG.md` - All bugs & issues
- **ROADMAP:** `docs/ROADMAP.md` - Feature planning
- **Production:** https://edge-flow-gamma.vercel.app
- **Backend:** https://edge-flow-backend.onrender.com

---

**Last Updated:** 2026-01-18
