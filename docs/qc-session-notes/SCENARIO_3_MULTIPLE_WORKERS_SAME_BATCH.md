# QC Session: Scenario 3 - Multiple Workers on Same Sub-Batch

**Date:** 2025-12-01
**Tester:** Sadin + BlueShark-Stark AI
**Environment:** Local (localhost:3000 + localhost:5000)
**Status:** ✅ PASSED

---

## Test Objective

Verify that:
1. **Multiple different workers** can be assigned to the same sub-batch
2. Each worker's assignment creates a **separate worker_log** record
3. The **department_sub_batch remains ONE record** (no splitting)
4. Production Summary correctly **sums all workers' work**
5. Worker table shows **all assigned workers** with their individual quantities

---

## Pre-Conditions

- [x] Frontend running (localhost:3000)
- [x] Backend running (localhost:5000)
- [x] Logged in as Dep-2 Supervisor
- [x] SB-T2 in Dep-2 "New Arrivals" with 49 pieces (fresh from Dep-1 transfer)
- [x] Dep-2 has active workers available

---

## Test Steps & Results

### Step 1: Verify Current State in Dep-2
- **Action:** View SB-T2 card in Dep-2 Kanban
- **Result:** [PENDING]
- **Expected:**
  | Field | Expected |
  |-------|----------|
  | Column | New Arrivals |
  | Remaining | 49 pcs |
  | Status | Unassigned |
- **Screenshot:** `temp_ss/image copy 20.png`

### Step 2: Open Task Details & Change to In Progress
- **Action:** Click SB-T2 → Change status to "In Progress" → Save
- **Result:** [PENDING]
- **Expected:** Card moves to "In Progress" column, "+ Add Record" enabled

### Step 3: Assign First Worker (Worker A) - 15 pieces
- **Action:** Click "+ Add Record", assign 15 pieces to first worker
- **Result:** [PENDING]
- **Expected After:**
  | Field | Expected |
  |-------|----------|
  | Worked | 15 |
  | Remaining | 34 |
  | Records Found | 1 |

### Step 4: Assign Second Worker (Worker B) - 20 pieces
- **Action:** Click "+ Add Record", assign 20 pieces to DIFFERENT worker
- **Result:** [PENDING]
- **Expected After:**
  | Field | Expected |
  |-------|----------|
  | Worked | 35 (15+20) |
  | Remaining | 14 |
  | Records Found | 2 |

### Step 5: Assign Third Worker (Worker C or A again) - 14 pieces
- **Action:** Click "+ Add Record", assign remaining 14 pieces
- **Result:** [PENDING]
- **Expected After:**
  | Field | Expected |
  |-------|----------|
  | Worked | 49 (15+20+14) |
  | Remaining | 0 |
  | Records Found | 3 |
  | "+ Add Record" | Disabled (no remaining) |

### Step 6: Verify Worker Table Shows All Assignments
- **Action:** Review Current Assignment table
- **Result:** [PENDING]
- **Expected:**
  | Worker | Qty Worked |
  |--------|------------|
  | Worker A | 15 |
  | Worker B | 20 |
  | Worker C | 14 |
  | **Total** | **49** |

### Step 7: Verify Kanban Shows Correct Totals
- **Action:** Close modal, check Kanban card
- **Result:** [PENDING]
- **Expected:**
  - Remaining: 0 pcs
  - Worked: 49 pcs (green)
  - ONE card only (no splitting)

---

## UI/UX Issues Found

| ID | Severity | Component | Issue Description | Screenshot |
|----|----------|-----------|-------------------|------------|
| | | | | |

---

## Bugs Found

| ID | Severity | Component | Bug Description | Status |
|----|----------|-----------|-----------------|--------|
| | | | | |

---

## Data Integrity Checks

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| department_sub_batch records for SB-T2 in Dep-2 | 1 | 1 (one card in Kanban) | ✅ |
| worker_logs count for SB-T2 in Dep-2 | 3 | 3 (D2-W1, D2-W2, D2-W3) | ✅ |
| Sum of quantity_worked across all logs | 49 | 49 (15+20+14) | ✅ |
| quantity_assigned on department_sub_batch | 49 | 49 | ✅ |
| quantity_remaining on department_sub_batch | 0 | 0 | ✅ |

---

## Final Verdict

| Criteria | Status |
|----------|--------|
| Multiple workers can be assigned | ✅ PASS |
| No duplicate sub-batch records | ✅ PASS (one card only) |
| Production Summary sums correctly | ✅ PASS (49 total) |
| Worker table shows all workers | ✅ PASS (3 workers listed) |
| "Work Complete" message appears | ✅ PASS |

**Overall Status:** ✅ PASSED

---

## Notes

- Testing with SB-T2 (49 pieces) in Dep-2
- Will assign 3 different workers: 15 + 20 + 14 = 49 pieces
- Key validation: ONE department_sub_batch record, MULTIPLE worker_logs

---

*Last Updated: 2025-12-01*
