# QC Session: Scenario 2 - Complete All Work & Transfer to Next Department

**Date:** 2025-12-01
**Tester:** Sadin + BlueShark-Stark AI
**Environment:** Local (localhost:3000 + localhost:5000)
**Status:** ✅ PASSED

---

## Test Objective

Verify that:
1. Assigning **all remaining pieces** to workers completes the work
2. Card status can be changed to "Completed" when all work is done
3. Sub-batch can be **transferred to the next department** in the workflow
4. New card appears in the next department's Kanban

---

## Pre-Conditions

- [x] Frontend running (localhost:3000)
- [x] Backend running (localhost:5000)
- [x] Supervisor logged in (Dep-1)
- [x] SB-T2 in "In Progress" column with:
  - Total: 49 pieces
  - Worked: 15 pieces (D1-W1)
  - Remaining: 34 pieces
- [x] Workflow: Dep-1 → Dep-2 → Dep-3

---

## Test Steps & Results

### Step 1: Verify Current State
- **Action:** View SB-T2 card in Kanban
- **Result:** [PENDING]
- **Expected:**
  | Field | Expected |
  |-------|----------|
  | Column | In Progress |
  | Remaining | 34 pcs |
  | Worked | 15 pcs |
- **Screenshot:** `temp_ss/image copy 12.png`

### Step 2: Open Task Details Modal
- **Action:** Click on SB-T2 card
- **Result:** [PENDING]
- **Data Check:**
  | Field | Expected |
  |-------|----------|
  | Received | 49 |
  | Worked | 15 |
  | Remaining | 34 |
  | Status | In Progress |

### Step 3: Assign Remaining 34 Pieces to Second Worker
- **Action:** Click "+ Add Record", assign remaining 34 pieces to D1-W2 (or D1-W1)
- **Result:** [PENDING]
- **Expected After Assignment:**
  | Field | Expected |
  |-------|----------|
  | Received | 49 |
  | Worked | 49 (15+34) |
  | Remaining | 0 |
  | "+ Add Record" | Disabled (no remaining work) |

### Step 4: Verify "Work Complete" Message
- **Action:** Check if system shows "All work complete" indicator
- **Result:** [PENDING]
- **Expected:** Green message indicating all pieces processed

### Step 5: Change Status to "Completed"
- **Action:** Change status dropdown to "Completed", click Save
- **Result:** [PENDING]
- **Expected:**
  - Card moves to "Completed" column
  - "Send to Department" dropdown appears

### Step 6: Send to Next Department (Dep-2)
- **Action:** Select "Dep-2" from dropdown, click "Send to Department"
- **Result:** [PENDING]
- **Expected:**
  - Success message
  - Card disappears from Dep-1 Kanban (or shows as sent)

### Step 7: Verify Card in Dep-2
- **Action:** Login as Dep-2 Supervisor, check Kanban
- **Result:** [PENDING]
- **Expected:**
  - SB-T2 appears in "New Arrivals" column of Dep-2
  - Quantity: 49 pieces (full amount transferred)

---

## UI/UX Issues Found

| ID | Severity | Component | Issue Description | Screenshot |
|----|----------|-----------|-------------------|------------|
| UI-S2-001 | **Medium** | Task Details Modal / Kanban | **Data doesn't auto-refresh after worker assignment.** User must manually refresh browser to see updated Kanban card. The modal closes but Kanban doesn't reflect new Worked/Remaining values. | `image copy 14.png` |
| UI-S2-002 | **Low** | Department Transfer | **Native browser alert** used for "Successfully sent to department!" instead of custom Toast notification. | `image copy 17.png` |

---

## Bugs Found

| ID | Severity | Component | Bug Description | Status |
|----|----------|-----------|-----------------|--------|
| | | | | |

---

## Data Integrity Checks

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| worker_logs count after full assignment | 2 | 2 (D1-W1: 15, D1-W2: 34) | ✅ |
| quantity_remaining after full assignment | 0 | 0 | ✅ |
| quantity_assigned after full assignment | 49 | 49 | ✅ |
| New department_sub_batch in Dep-2 | 1 | 1 (SB-T2 in New Arrivals) | ✅ |
| quantity_received in Dep-2 | 49 | 49 pcs | ✅ |

---

## Final Verdict

| Criteria | Status |
|----------|--------|
| All pieces can be assigned | ✅ PASS |
| Status changes correctly | ✅ PASS |
| Department transfer works | ✅ PASS |
| Data integrity maintained | ✅ PASS |

**Overall Status:** ✅ PASSED

---

## Notes

- Testing with SB-T2 (49 pieces) in Dep-1
- Workflow: Dep-1 → Dep-2 → Dep-3
- Will assign remaining 34 pieces to complete all work
- Will verify transfer to Dep-2

---

## Backlog Items (Future Improvements)

| ID | Priority | Feature/Fix | Description | Recommendation |
|----|----------|-------------|-------------|----------------|
| BACKLOG-001 | **Medium** | Conditional "Mark Sub-batch as Completed" Button | Button is currently visible at ALL departments, risking accidental permanent lock of sub-batch before workflow completion. | **Hide button** unless: (1) Current dept is LAST in workflow, OR (2) User is ADMIN. Prevents data loss from accidental clicks. |

---

*Last Updated: 2025-12-01*
