# QC Test Script - Phase 1: Worker Assignment Workflow

**Test Date**: _____________
**Tester**: _____________
**Build Version**: Development
**Environment**: http://localhost:3001

---

## Test Data Setup

| Item | Value |
|------|-------|
| Sub-Batch | RT-SB-1 (ID: 10) |
| Batch | RT-Batch (100 Meter, Pink) |
| Roll | Roll-Test |
| Department | Dep-X (ID: 6) |
| Supervisor | RT-X-S |
| Workers | RT-X-W1, RT-X-W2 |
| Initial Quantity | 50 pieces |
| Current Stage | IN_PROGRESS |
| Worker Logs | 0 (clean state) |

---

## Test Case 1: Login & Dashboard Verification

**Objective**: Verify supervisor can login and see correct dashboard stats

**Pre-conditions**:
- Backend server running on port 5000
- Frontend server running on port 3001
- RT-X-S supervisor exists with valid credentials

**Steps**:
1. Navigate to http://localhost:3001/loginandsignup
2. Enter RT-X-S supervisor credentials
3. Click Login
4. Observe dashboard stats

**Expected Results**:

| Stat | Expected Value | Actual Value | Pass/Fail |
|------|---------------|--------------|-----------|
| Department Badge | "Dep-X" | | ⬜ |
| New Arrivals | 0 | | ⬜ |
| In Progress | 1 | | ⬜ |
| Completed | 0 | | ⬜ |
| Active Workers | 2 | | ⬜ |

**Notes**: _________________________________

---

## Test Case 2: Task Details Modal - Initial State

**Objective**: Verify RT-SB-1 task details display correctly

**Pre-conditions**:
- Logged in as RT-X-S
- RT-SB-1 is in Dep-X, IN_PROGRESS stage

**Steps**:
1. Click "Task Management" in sidebar
2. Locate RT-SB-1 in "In Progress" column
3. Click RT-SB-1 card
4. Observe modal content

**Expected Results**:

| Field | Expected Value | Actual Value | Pass/Fail |
|-------|---------------|--------------|-----------|
| Modal Backdrop | Blur effect visible | | ⬜ |
| Roll Name | Roll-Test | | ⬜ |
| Batch Name | RT-Batch | | ⬜ |
| Sub Batch Name | RT-SB-1 | | ⬜ |
| Total Quantity | 50 | | ⬜ |
| Status | In Progress | | ⬜ |
| Received | 50 | | ⬜ |
| Worked | 0 | | ⬜ |
| Altered | 0 | | ⬜ |
| Rejected | 0 | | ⬜ |
| Remaining | 50 | | ⬜ |
| "+ Add Record" button | Enabled | | ⬜ |
| Worker logs table | "No records yet" | | ⬜ |

**Notes**: _________________________________

---

## Test Case 3: Worker Assignment - Valid Quantity

**Objective**: Assign worker with valid quantity within remaining work

**Pre-conditions**:
- Task Details Modal is open
- Remaining work: 50 pieces

**Steps**:
1. Click "+ Add Record" button
2. Select Worker: RT-X-W1
3. Enter Quantity: 20
4. Select Date: (Today's date)
5. Enter Particulars: "Cutting fabric"
6. Enter Size/Category: "M"
7. Enter Unit Price: 10
8. Click Save

**Expected Results**:

| Item | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Success message | Appears | | ⬜ |
| Modal closes | Yes | | ⬜ |
| Worker appears in table | RT-X-W1, Qty: 20 | | ⬜ |
| Worked count | 20 | | ⬜ |
| Remaining count | 30 | | ⬜ |
| Console errors | None | | ⬜ |

**Database Verification**:
```sql
SELECT * FROM worker_logs WHERE sub_batch_id = 10;
-- Expected: 1 row with worker_id = 9, quantity_worked = 20
```

**Notes**: _________________________________

---

## Test Case 4: Worker Assignment - Second Worker

**Objective**: Assign second worker to same task

**Pre-conditions**:
- RT-X-W1 assigned with 20 pieces
- Remaining: 30 pieces

**Steps**:
1. Click "+ Add Record"
2. Select Worker: RT-X-W2
3. Enter Quantity: 15
4. Fill other required fields
5. Click Save

**Expected Results**:

| Item | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Both workers in table | RT-X-W1 (20), RT-X-W2 (15) | | ⬜ |
| Worked count | 35 | | ⬜ |
| Remaining count | 15 | | ⬜ |
| Table shows 2 rows | Yes | | ⬜ |

**Notes**: _________________________________

---

## Test Case 5: Validation - Exceeding Remaining Quantity

**Objective**: System prevents assigning more than remaining work

**Pre-conditions**:
- Total worked: 35 pieces
- Remaining: 15 pieces

**Steps**:
1. Click "+ Add Record"
2. Select Worker: RT-X-W1
3. Enter Quantity: 20 (exceeds 15 remaining)
4. Click Save

**Expected Results**:

| Item | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Error message | "Cannot assign 20 units! Only 15 units remaining..." | | ⬜ |
| Record NOT saved | Correct | | ⬜ |
| Worked count unchanged | Still 35 | | ⬜ |
| Remaining unchanged | Still 15 | | ⬜ |
| Worker logs count | Still 2 | | ⬜ |

**Notes**: _________________________________

---

## Test Case 6: Edit Worker Assignment

**Objective**: Modify existing worker assignment quantity

**Pre-conditions**:
- RT-X-W1 has 20 pieces assigned
- RT-X-W2 has 15 pieces assigned

**Steps**:
1. Click three-dot menu (⋮) on RT-X-W1 row
2. Click "Edit"
3. Change quantity from 20 to 25
4. Click Save

**Expected Results**:

| Item | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Quantity updates | 25 | | ⬜ |
| Worked count | 40 (25 + 15) | | ⬜ |
| Remaining count | 10 (50 - 40) | | ⬜ |
| Edit mode closes | Yes | | ⬜ |

**Notes**: _________________________________

---

## Test Case 7: Edit Validation - Exceeding Available Quantity

**Objective**: Edit validation prevents exceeding total work

**Pre-conditions**:
- RT-X-W1: 25 pieces
- RT-X-W2: 15 pieces
- Remaining: 10 pieces

**Steps**:
1. Edit RT-X-W1's quantity
2. Try to change from 25 to 45 (would exceed total)
3. Click Save

**Expected Results**:

| Item | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Error message | Validation error | | ⬜ |
| Quantity NOT updated | Still 25 | | ⬜ |
| Worked count unchanged | Still 40 | | ⬜ |

**Notes**: _________________________________

---

## Test Case 8: Delete Worker Assignment

**Objective**: Remove worker assignment

**Pre-conditions**:
- 2 workers assigned
- Total worked: 40

**Steps**:
1. Click three-dot menu on RT-X-W2 row
2. Click "Delete"
3. Confirm deletion

**Expected Results**:

| Item | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Confirmation dialog | Appears | | ⬜ |
| Worker removed from table | RT-X-W2 gone | | ⬜ |
| Worked count | 25 (only RT-X-W1) | | ⬜ |
| Remaining count | 25 (50 - 25) | | ⬜ |
| Table shows 1 row | Yes | | ⬜ |

**Database Verification**:
```sql
SELECT * FROM worker_logs WHERE sub_batch_id = 10;
-- Expected: 1 row (RT-X-W1 only)
```

**Notes**: _________________________________

---

## Test Case 9: Wage Calculation Verification

**Objective**: Verify wages are calculated correctly for piece-rate workers

**Pre-conditions**:
- RT-X-W1: 25 pieces @ ₹10/piece
- RT-X-W1 wage type: HOURLY (wage_rate: 10)

**Steps**:
1. Check worker logs in database
2. Calculate expected wage: 25 × ₹10 = ₹250

**Expected Results**:

| Item | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Quantity worked | 25 | | ⬜ |
| Unit price | ₹10.00 | | ⬜ |
| Expected wage | ₹250.00 | | ⬜ |

**SQL Query**:
```sql
SELECT
  w.name,
  wl.quantity_worked,
  wl.unit_price,
  (wl.quantity_worked * wl.unit_price) AS calculated_wage
FROM worker_logs wl
JOIN workers w ON w.id = wl.worker_id
WHERE wl.sub_batch_id = 10;
```

**Notes**: _________________________________

---

## Test Case 10: Billable/Non-Billable Tracking

**Objective**: Verify billable status is tracked correctly

**Pre-conditions**:
- RT-X-W1 record exists

**Steps**:
1. Check worker record details
2. Verify is_billable field

**Expected Results**:

| Item | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| is_billable field | true (default) | | ⬜ |
| Badge color | Green (Billable) | | ⬜ |

**Notes**: _________________________________

---

## Summary

**Total Test Cases**: 10
**Passed**: ___ / 10
**Failed**: ___ / 10
**Blocked**: ___ / 10

**Critical Issues Found**: _________________________________

**Non-Critical Issues**: _________________________________

**Overall Status**: ⬜ PASS  ⬜ FAIL  ⬜ BLOCKED

**Tester Signature**: _____________
**Date**: _____________
