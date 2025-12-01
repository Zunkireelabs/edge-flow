# QC Session: Scenario 4 - Rejection Flow

**Date:** 2025-12-01
**Tester:** Sadin + BlueShark-Stark AI
**Environment:** Local (localhost:3000 + localhost:5000)
**Status:** 🔄 In Progress

---

## Test Objective

Verify that:
1. Supervisor can **reject pieces** during worker assignment
2. Rejection creates a record in `sub_batch_rejected` table
3. A **rejection card** appears in the Rejected section/Kanban
4. Main card **quantities update correctly** after rejection
5. Rejection can be **sent to another department** for rework

---

## Pre-Conditions

- [x] Frontend running (localhost:3000)
- [x] Backend running (localhost:5000)
- [x] Supervisor logged in
- [x] Sub-batch available with remaining pieces for testing

---

## Test Data Selection

**Option A: Use SB-T1 in Dep-1**
- Location: Dep-1
- Status: In Progress
- Remaining: ~10-20 pcs (need to verify)
- Good for: Testing rejection at first department

**Option B: Use SB-T2 in Dep-2**
- Location: Dep-2
- Status: In Progress (All 49 worked)
- Good for: Testing rejection after department transfer

---

## Test Steps & Results

### Step 1: Verify Current State
- **Action:** Login as Dep-1 Supervisor, view SB-T1 card
- **Result:** [PENDING]
- **Screenshot:** [PENDING]

### Step 2: Open Task Details for Rejection Test
- **Action:** Click on card to open Task Details modal
- **Result:** [PENDING]
- **Verify:** "+ Add Record" button enabled, "Rejected" column visible in worker table

### Step 3: Assign Worker WITH Rejection
- **Action:** Click "+ Add Record", assign pieces with some rejected
- **Input:**
  | Field | Value |
  |-------|-------|
  | Worker | Select available worker |
  | Quantity Worked | X pieces |
  | **Rejected** | Y pieces |
- **Result:** [PENDING]

### Step 4: Verify Production Summary Updates
- **Action:** Check Production Summary after rejection
- **Result:** [PENDING]
- **Expected:**
  | Field | Before | After |
  |-------|--------|-------|
  | Worked | Old | Old + X |
  | Rejected | 0 | Y |
  | Remaining | Old | Old - X - Y |

### Step 5: Verify Rejection Record Created
- **Action:** Check if rejection appears in system
- **Result:** [PENDING]
- **Expected:** `sub_batch_rejected` record created with correct quantity

### Step 6: Verify Rejection Card in Kanban (if applicable)
- **Action:** Check for rejection card in Rejected view/section
- **Result:** [PENDING]

### Step 7: Test Sending Rejection to Another Department
- **Action:** Send rejected pieces to another department for rework
- **Result:** [PENDING]

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
| sub_batch_rejected record created | Yes | [PENDING] | 🔄 |
| Rejected quantity matches input | Y pcs | [PENDING] | 🔄 |
| Production Summary Rejected count | Y | [PENDING] | 🔄 |
| Remaining correctly calculated | Adjusted | [PENDING] | 🔄 |

---

## Final Verdict

| Criteria | Status |
|----------|--------|
| Rejection input works | 🔄 Pending |
| Rejection record created | 🔄 Pending |
| Quantities update correctly | 🔄 Pending |
| Rejection card visible | 🔄 Pending |

**Overall Status:** 🔄 IN PROGRESS

---

## Notes

- Testing rejection flow in BlueShark
- Need to identify where rejection input field is located
- Verify rejection creates separate tracking records

---

*Last Updated: 2025-12-01*
