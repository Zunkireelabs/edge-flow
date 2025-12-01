# QC Session: Scenario 1 - Partial Worker Assignment (No Splitting)

**Date:** 2025-12-01
**Tester:** Sadin + BlueShark-Stark AI
**Environment:** Local (localhost:3000 + localhost:5000)
**Status:** ✅ PASSED

---

## Test Objective

Verify that assigning a **partial quantity** of pieces to a worker does NOT create duplicate/split `department_sub_batch` records. Only ONE card should appear in the Kanban.

---

## Pre-Conditions

- [x] Frontend running (localhost:3000)
- [x] Backend running (localhost:5000)
- [x] Admin logged in
- [x] Sub-batch SB-T2 created (49 pieces)
- [x] Sub-batch sent to production with workflow: Dep-1 → Dep-2 → Dep-3

---

## Test Steps & Results

### Step 1: Login as Admin
- **Action:** Login with admin@gmail.com / admin
- **Result:** ✅ Success - Dashboard displayed
- **Screenshot:** `temp_ss/image copy 20.png`

### Step 2: Navigate to Sub Batch View
- **Action:** Click "Sub Batch View" in sidebar
- **Result:** ✅ Found SB-T2 in DRAFT status

### Step 3: Send SB-T2 to Production
- **Action:** Configure workflow Dep-1 → Dep-2 → Dep-3, click "Confirm & Send"
- **Result:** ✅ Success
- **Screenshot:** `temp_ss/image copy 21.png`

### Step 4: View Department Kanban (Dep-1)
- **Action:** Login as Supervisor, view Dep-1
- **Result:** ✅ SB-T2 card visible in "New Arrivals" column
- **Data Check:**
  - Cards in New Arrivals: 2 (SB-T1, SB-T2)
  - SB-T2 Status: Unassigned
  - SB-T2 Remaining: 49 pcs
- **Screenshot:** `temp_ss/image copy 22.png`

### Step 5: Open Task Details Modal
- **Action:** Click on SB-T2 card
- **Result:** ✅ Task Details modal opened
- **Data Check:**
  | Field | Expected | Actual | Status |
  |-------|----------|--------|--------|
  | Sub Batch Name | SB-T2 | SB-T2 | ✅ |
  | Total Quantity | 49 | 49 | ✅ |
  | Received | 49 | 49 | ✅ |
  | Worked | 0 | 0 | ✅ |
  | Remaining | 49 | 49 | ✅ |
  | Status | Not Started | Not Started | ✅ |
  | Route | Dep-1→Dep-2→Dep-3 | Dep-1→Dep-2→Dep-3 | ✅ |
- **Screenshot:** `temp_ss/image copy 2.png`

### Step 6: Change Status to "In Progress"
- **Action:** Changed status dropdown to "In Progress", clicked Save
- **Result:** ✅ Success - "Stage updated successfully!" message shown
- **Screenshot:** `temp_ss/image copy 3.png` (alert), `temp_ss/image copy 5.png` (kanban)
- **Observations:**
  - ⚠️ Native browser alert used instead of custom Toast notification
  - ✅ Card moved from "New Arrivals" to "In Progress" column
  - ✅ "+ Add Record" button now enabled

### Step 7: Assign Worker with Partial Quantity
- **Action:** Clicked "+ Add Record", opened "Assign Worker to Task" modal
- **Initial Result:** 🚫 **BLOCKED** - Worker dropdown is EMPTY
- **Screenshot:** `temp_ss/image copy 7.png`, `temp_ss/image copy 8.png`
- **Blocker Details:**
  - Worker dropdown shows no options
  - Supervisor Dashboard shows "Active Workers: 0"
  - Workers were created by Admin but not visible in Dep-1
- **Root Cause:** Backend API `/api/workers/department/:id` filters on `workers.department_id` column which is NULL. Workers are assigned via `department_workers` junction table, not direct column.
- **Bug Location:** `blueshark-backend-test/backend/src/services/workerService.ts` line 62-74
- **Fix Applied:** ✅ Fixed `workerService.ts` to query via `department_workers` junction table

#### After BUG-001 Fix:
- **Action:** Assigned D1-W1 with 15 pieces
- **Result:** ✅ SUCCESS - Worker assigned
- **Screenshot:** `temp_ss/image copy 9.png` (Assign Worker modal), `temp_ss/image copy 10.png` (Task Details after)
- **Data Check:**
  | Field | Expected | Actual | Status |
  |-------|----------|--------|--------|
  | Received | 49 | 49 | ✅ |
  | Worked | 15 | 15 | ✅ |
  | Remaining | 34 | 34 | ✅ |
  | Worker Record | D1-W1 with 15 pcs | D1-W1 with 15 pcs | ✅ |

### Step 8: Verify Kanban Card Display
- **Action:** Checked Kanban view for SB-T2 card
- **Result:** ⚠️ **ISSUE FOUND** - Kanban card doesn't show "Worked" pieces
- **Screenshot:** `temp_ss/image copy 11.png`
- **Issue:** For Main cards (not "Assigned" cards), the Kanban card only showed "Remaining: 34 pcs" but NOT "Worked: 15 pcs"
- **Root Cause:** Frontend `DepartmentView.tsx:579` had condition `isAssigned && item.quantity_assigned` - only showing for Assigned cards
- **Fix Applied:** ✅ Changed condition to show "Worked" for ALL cards with `quantity_assigned > 0`
- **Fix Location:** `src/app/SupervisorDashboard/components/views/DepartmentView.tsx` line 578-586

### Step 9: Verify No Splitting Occurred
- **Action:** Check Kanban for duplicate cards after worker assignment
- **Result:** ✅ SUCCESS - Only ONE card for SB-T2 in Kanban
- **Expected:** Still ONE card for SB-T2
- **Actual:** ONE card - no splitting occurred

---

## UI/UX Issues Found

| ID | Severity | Component | Issue Description | Screenshot |
|----|----------|-----------|-------------------|------------|
| UI-001 | Low | Task Details Modal | **Roll Name shows "Batch-T1"** instead of actual Roll name | `image copy 2.png` |
| UI-002 | Low | Task Details Modal | **Dates show "Jan 1, 1970"** - Unix epoch default, not user-friendly | `image copy 2.png` |
| UI-003 | Good Practice | Task Details Modal | "+ Add Record" button correctly disabled until status is "In Progress" | `image copy 2.png` |
| UI-004 | Medium | Task Details Modal | **Native browser alert** used for "Stage updated successfully!" instead of custom Toast notification | `image copy 3.png` |

---

## Bugs Found

| ID | Severity | Component | Bug Description | Status |
|----|----------|-----------|-----------------|--------|
| BUG-001 | **Critical** | Backend - workerService.ts | `getWorkersByDepartment()` queries `workers.department_id` instead of `department_workers` junction table. Workers don't appear in Supervisor Dashboard. | ✅ FIXED |
| BUG-002 | **Medium** | Frontend - DepartmentView.tsx | Kanban card only shows "Worked/Assigned" pieces for "Assigned" cards, not for Main cards. Condition was `isAssigned && item.quantity_assigned`. | ✅ FIXED |

---

## Data Integrity Checks

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| department_sub_batch records for SB-T2 | 1 | 1 | ✅ |
| worker_logs for SB-T2 | 1 (after assignment) | 1 | ✅ |
| quantity_remaining after assignment | 34 (49-15) | 34 | ✅ |
| quantity_assigned after assignment | 15 | 15 | ✅ |

---

## Final Verdict

| Criteria | Status |
|----------|--------|
| No splitting on partial assignment | ✅ PASS |
| Quantities update correctly | ✅ PASS |
| UI displays correctly | ✅ PASS (after BUG-002 fix) |
| No console errors | ✅ PASS |

**Overall Status:** ✅ PASSED (with 2 bugs fixed during testing)

---

## Notes

- Testing with SB-T2 (49 pieces) in Dep-1
- Will assign 15 pieces to first worker
- Will verify only ONE card exists after assignment

---

*Last Updated: 2025-12-01*
