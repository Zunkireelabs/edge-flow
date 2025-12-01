# QC Workflow Validation Plan - BlueShark Production System

## Test Date: 2025-11-22
## Test Session: Production Workflow Complete QC - Industry Standard Implementation

---

## 🎯 **CORE BUSINESS LOGIC - INDUSTRY STANDARD**

### **Wage System: PIECE-RATE (Not Hourly)**
- Workers are paid per piece completed, not per hour
- Formula: `wage = quantity_worked × unit_price`
- Different rates for different activity types (NORMAL vs ALTERED)

### **Two Distinct Workflows:**

#### **1. ALTERATION (Yellow Card) 🟡**
- **Purpose**: Items that CAN be fixed/modified
- **Action**: Send to department for rework
- **Creates**: Yellow card in target department
- **Worker Activity**: `activity_type: "ALTERED"`
- **Outcome**: Items RETURN to production after fixing
- **Quantity Impact**: NO reduction (items separated then returned)
- **Button**: "Send for Alteration"

#### **2. WASTAGE/REJECTION (No Card) ❌**
- **Purpose**: Items that CANNOT be fixed, must discard
- **Action**: Remove from production count permanently
- **Creates**: Entry in `wastage_log` table (NO card)
- **Worker Activity**: None (no work to do)
- **Outcome**: Items REMOVED from production forever
- **Quantity Impact**: PERMANENT reduction
- **Button**: "Mark as Wastage"

### **Quantity Conservation Law:**
```
At any time:
  SUM(quantity_remaining) + SUM(quantity_worked) + SUM(quantity_wasted) = original_quantity

Example (50 pieces):
  In production: 15 remaining
  Assigned to workers: 30 worked
  Wasted: 5 discarded
  Total: 15 + 30 + 5 = 50 ✓
```

---

## Test Environment Setup

### Departments Created
1. **Dep-X** (ID: TBD) - First department (Cutting)
2. **Dep-Y** (ID: TBD) - Second department (Stitching)
3. **Dep-Z** (ID: TBD) - Third department (Finishing)

**Workflow**: Dep-X → Dep-Y → Dep-Z

### Supervisors Created
1. **RT-X-S** - Supervisor for Dep-X
2. **RT-Y-S** - Supervisor for Dep-Y
3. **RT-Z-S** - Supervisor for Dep-Z

### Workers Created (2 per department)
- **Dep-X**: RT-X-W1, RT-X-W2
- **Dep-Y**: RT-Y-W1, RT-Y-W2
- **Dep-Z**: RT-Z-W1, RT-Z-W2

### Production Data Created
- **Vendor**: Vendor-T
- **Roll**: Roll-Test (100 meters, Pink, Vendor: Vendor-T)
- **Batch**: RT-Batch (100 meters)
- **Sub-Batch 1 (RT-SB-1)**: 50 pieces, Category: XXL, Start: 2082-08-09, Due: 2082-08-10
- **Sub-Batch 2 (RT-SB-2)**: 10 pieces, Start: 2082-08-06, Due: 2082-08-10

**Status**: RT-SB-1 has been sent to production with workflow Dep-X → Dep-Y → Dep-Z

---

## QC Test Phases

## PHASE 0: Admin Production View Verification

### Objective
Verify that Admin can see complete production state before supervisor testing

### Test Steps
1. [ ] Login as Admin
2. [ ] Navigate to Production View
3. [ ] Verify all 3 departments (Dep-X, Dep-Y, Dep-Z) are visible as columns
4. [ ] Verify RT-SB-1 appears in Dep-X column
5. [ ] Verify card shows correct details:
   - Name: RT-SB-1
   - Quantity: 50 pieces
   - Status: Unassigned (gray card)
   - Category: XXL
   - Start/Due dates visible
6. [ ] Verify Dep-Y and Dep-Z columns are empty (no cards yet)
7. [ ] Click on RT-SB-1 card to open details modal
8. [ ] Verify modal shows:
   - Sub-batch info (name, dates, quantities)
   - Size details (XXL category)
   - Department route (Dep-X → Dep-Y → Dep-Z)
   - Current department: Dep-X
   - Quantity received: 50
   - Quantity remaining: 50
   - Worker logs: Empty (no assignments yet)

### Expected Results
- Admin can see entire production state
- RT-SB-1 is in correct initial state (Dep-X, unassigned)
- All department columns visible and labeled correctly
- Card color: Gray (unassigned)
- No data inconsistencies

### Data Validation
```
department_sub_batches table should have:
- Record for Dep-X: is_current = true, quantity_received = 50, quantity_remaining = 50
- Record for Dep-Y: is_current = false, quantity_received = 0, quantity_remaining = 0
- Record for Dep-Z: is_current = false, quantity_received = 0, quantity_remaining = 0
```

---

## PHASE 1: Normal Production Flow - Dep-X (First Department)

### Objective
Test complete normal production workflow in first department including worker assignment, piece-rate wage tracking, quantity tracking, and department advancement.

### Test Steps

#### 1.1 Supervisor Login & Dashboard View
1. [ ] Logout from Admin account
2. [ ] Login as RT-X-S (Dep-X Supervisor)
3. [ ] Verify redirected to Supervisor Dashboard
4. [ ] Verify only Dep-X tasks are visible (department filtering)
5. [ ] Verify RT-SB-1 appears in "New Arrivals" column
6. [ ] Verify card shows:
   - Name: RT-SB-1
   - Quantity: 50 pieces
   - Status: Main (Unassigned)
   - Card color: Gray

#### 1.2 First Worker Assignment (Piece-Rate Wage)
7. [ ] Click on RT-SB-1 card
8. [ ] Task details modal opens
9. [ ] Click "Assign Worker" button
10. [ ] Assign Worker modal opens
11. [ ] Verify "Available Quantity: 50 pieces" is shown
12. [ ] Select worker: RT-X-W1
13. [ ] Enter quantity: 25 pieces
14. [ ] Select work date: 2082-08-10
15. [ ] Enter/verify unit price: Rs 2.00 per piece
16. [ ] Check "Billable" checkbox
17. [ ] Click "Assign"
18. [ ] Verify success message

**Expected Results:**
- Worker logs table now shows RT-X-W1 with 25 pieces
- Quantity Assigned: 25
- Quantity Remaining: 25
- **Wage Calculation**: 25 pieces × Rs 2.00 = Rs 50.00
- Total amount auto-calculated: Rs 50.00
- Billable status shows green checkmark

**Data Validation:**
```
worker_logs table should have new record:
- worker_id: RT-X-W1's ID
- sub_batch_id: RT-SB-1's ID
- department_id: Dep-X's ID
- quantity_worked: 25  ⬅️ PIECES (not hours)
- unit_price: 2.00  ⬅️ RATE PER PIECE
- total_amount: 50.00  (25 × 2.00)
- activity_type: "NORMAL"
- is_billable: true

department_sub_batches table (Dep-X record):
- assigned_worker_id: RT-X-W1's ID
- quantity_assigned: 25
- quantity_remaining: 25
```

#### 1.3 Second Worker Assignment
19. [ ] Click "Assign Another Worker" button
20. [ ] Select worker: RT-X-W2
21. [ ] Enter quantity: 25 pieces
22. [ ] Select work date: 2082-08-10
23. [ ] Unit price: Rs 2.00 per piece
24. [ ] Check "Billable" checkbox
25. [ ] Click "Assign"

**Expected Results:**
- Worker logs table shows both RT-X-W1 and RT-X-W2
- Quantity Assigned: 50 (25 + 25)
- Quantity Remaining: 0
- **Total Wages**:
  - RT-X-W1: 25 × Rs 2.00 = Rs 50.00
  - RT-X-W2: 25 × Rs 2.00 = Rs 50.00
  - **Total Dep-X Labor Cost**: Rs 100.00

**Data Validation:**
```
worker_logs table should have 2 records for RT-SB-1 in Dep-X

department_sub_batches (Dep-X):
- quantity_assigned: 50
- quantity_remaining: 0
```

#### 1.4 Kanban Board Update Verification
26. [ ] Close task details modal
27. [ ] Return to kanban board
28. [ ] Verify RT-SB-1 card has moved to "In Progress" column
29. [ ] Verify card color changed from Gray → Blue (assigned)
30. [ ] Verify card shows worker names and assigned quantities

#### 1.5 Partial Quantity Advancement Test
31. [ ] Reopen RT-SB-1 task details
32. [ ] Click "Update Status" → "Mark as Completed"
33. [ ] Verify card moves to "Completed" column
34. [ ] Card color changes to Green
35. [ ] Click "Advance to Next Department"
36. [ ] Advance modal opens
37. [ ] Verify "Next Department: Dep-Y" is shown
38. [ ] Verify department route is displayed correctly
39. [ ] Enter quantity to advance: 25 pieces (partial - only half)
40. [ ] Click "Advance"
41. [ ] Verify success message: "25 pieces advanced to Dep-Y"

**Expected Results - CRITICAL PARTIAL ADVANCEMENT LOGIC:**
- RT-SB-1 card should STAY in Dep-X (because 25 pieces still remain)
- Card should move back to "In Progress" (not completed yet)
- Card should show "25 remaining (25 advanced to Dep-Y)"

**Data Validation:**
```
department_sub_batches (Dep-X):
- is_current: true (STAYS TRUE - not all pieces moved)
- stage: "IN_PROGRESS" (NOT "COMPLETED")
- quantity_remaining: 25 (reduced from 50)

department_sub_batches (Dep-Y):
- is_current: true (NOW ACTIVE)
- quantity_received: 25 (partial delivery)
- quantity_remaining: 25
- remarks: "Main"
```

#### 1.6 Admin Production View Verification After Partial Advancement
42. [ ] Switch to Admin account
43. [ ] Navigate to Production View
44. [ ] Verify RT-SB-1 appears in BOTH Dep-X AND Dep-Y columns
45. [ ] Dep-X card shows: 25 pieces remaining
46. [ ] Dep-Y card shows: 25 pieces (new arrival)

**Critical Business Logic Check:**
- Same sub-batch can exist in multiple departments simultaneously
- Quantities must add up: Dep-X (25) + Dep-Y (25) = Total (50) ✓

#### 1.7 Complete Remaining Quantity Advancement
47. [ ] Switch back to RT-X-S supervisor account
48. [ ] Open RT-SB-1 card in Dep-X
49. [ ] Click "Advance to Next Department"
50. [ ] Enter quantity: 25 pieces (remaining pieces)
51. [ ] Click "Advance"

**Expected Results:**
- RT-SB-1 card DISAPPEARS from Dep-X (all work complete)
- Dep-X record: is_current = false, stage = "COMPLETED"

**Data Validation:**
```
department_sub_batches (Dep-X):
- is_current: false (NO LONGER ACTIVE)
- stage: "COMPLETED"
- quantity_remaining: 0

department_sub_batches (Dep-Y):
- quantity_received: 50 (25 + 25)
- quantity_remaining: 50
```

#### 1.8 Final Verification
52. [ ] Verify RT-SB-1 no longer appears in RT-X-S dashboard
53. [ ] Login as RT-Y-S (Dep-Y supervisor)
54. [ ] Verify RT-SB-1 appears in "New Arrivals" with 50 pieces

**Dep-X Summary:**
- Total pieces worked: 50
- Total labor cost: Rs 100.00 (2 workers × 25 pieces × Rs 2.00)
- Activity type: 100% NORMAL
- Billable: 100% Yes

---

## PHASE 2: Alteration Workflow (Yellow Card) 🟡

### Objective
Test the complete alteration workflow for FIXABLE items: marking items for alteration, sending to another department, assigning workers with ALTERED activity type, and returning altered items.

### Business Context
**ALTERATION = REWORK for fixable items**
- Items CAN be fixed/modified
- Worker does alteration work (paid at alteration rate)
- Items RETURN to production after fixing
- Quantity stays in system (not lost)

### Test Steps

#### 2.1 Assign Workers in Dep-Y (Normal Work)
1. [ ] Login as RT-Y-S (Dep-Y supervisor)
2. [ ] Verify RT-SB-1 shows 50 pieces in "New Arrivals"
3. [ ] Assign RT-Y-W1: 30 pieces at Rs 3.00/piece (NORMAL stitching)
4. [ ] Leave 20 pieces unassigned for testing

**Expected State:**
- Assigned: 30 pieces
- Remaining: 20 pieces
- RT-Y-W1 wage: 30 × Rs 3.00 = Rs 90.00

#### 2.2 Create Alteration in Dep-Y
5. [ ] Open RT-SB-1 task details
6. [ ] Click "Actions" dropdown → "Send for Alteration"
7. [ ] Alteration modal opens
8. [ ] Fill form:
   - Alteration Reason: "Collar too loose - needs tightening"
   - Quantity to Alter: 5 pieces
   - Send to Department: Select "Dep-Y" (same dept) or "Dep-X"
9. [ ] Click "Send for Alteration"
10. [ ] Verify success message

**Expected Results:**
- New YELLOW card appears in target department (Dep-Y or Dep-X)
- Dep-Y main card quantity remaining reduced by 5
- Alteration creates new department_sub_batches record with remarks: "Altered"

**Data Validation:**
```
department_sub_batches table - NEW RECORD:
- department_id: Target department (Dep-Y or Dep-X)
- sub_batch_id: RT-SB-1's ID
- quantity_received: 5
- quantity_remaining: 5
- remarks: "Altered"
- alter_reason: "Collar too loose - needs tightening"
- alteration_source_department_id: Dep-Y's ID
- is_current: true
- stage: "NEW_ARRIVAL"

department_sub_batches (Dep-Y - main record):
- quantity_remaining: 15 (was 20, reduced by 5)

IMPORTANT: Total quantity still 50!
  Main in Dep-Y: 15 remaining
  Assigned in Dep-Y: 30 worked
  Altered (separated): 5 pieces
  Total: 15 + 30 + 5 = 50 ✓
```

#### 2.3 Verify Yellow Card Appearance
11. [ ] Navigate to target department dashboard
12. [ ] Verify YELLOW card appears in "New Arrivals"
13. [ ] Card should show:
    - 🟡 Badge: "ALTERED"
    - Name: RT-SB-1
    - Quantity: 5 pieces
    - From: Dep-Y
    - Reason: "Collar too loose - needs tightening"
    - Status: Unassigned (yellow background)

#### 2.4 Admin Production View - Alteration Verification
14. [ ] Login as Admin
15. [ ] Navigate to Production View
16. [ ] Verify YELLOW card appears in target department column
17. [ ] Click on yellow card
18. [ ] Modal should show:
    - Alteration Details section
    - Sent From: Dep-Y
    - Reason: "Collar too loose - needs tightening"
    - Quantity: 5
    - Worker logs: Empty (not assigned yet)

#### 2.5 Assign Worker to Alteration Work (ALTERED Activity Type)
19. [ ] Login as supervisor of department with yellow card
20. [ ] Click on yellow altered card
21. [ ] Click "Assign Worker for Alteration"
22. [ ] Select worker: RT-Y-W1 (or appropriate worker)
23. [ ] Quantity: 5 pieces
24. [ ] Work date: 2082-08-11
25. [ ] Unit price: Rs 2.00/piece (alteration rate - lower than normal stitching)
26. [ ] Billable: Yes (or No if our mistake)
27. [ ] Click "Assign"

**Expected Results:**
- Worker log created with **activity_type: "ALTERED"**
- Card color changes from Yellow → Blue (assigned)
- Quantity remaining: 0 (all 5 pieces assigned)
- **Alteration Wage**: 5 × Rs 2.00 = Rs 10.00

**Data Validation:**
```
worker_logs table - NEW RECORD:
- worker_id: Worker's ID
- department_sub_batch_id: (altered card's ID)
- quantity_worked: 5
- unit_price: 2.00
- total_amount: 10.00  (5 × 2.00)
- activity_type: "ALTERED" ⬅️ CRITICAL - NOT "NORMAL"
- is_billable: true/false
```

#### 2.6 Complete Alteration and Return to Production
28. [ ] Mark altered work as "Completed"
29. [ ] Click "Advance to Next Department"
30. [ ] Select "Dep-Y" (send back to source for continuation)
31. [ ] Quantity: 5
32. [ ] Click "Advance"

**Expected Results:**
- Yellow card disappears from alteration department
- Dep-Y receives 5 pieces back
- Dep-Y quantity_received increases by 5

**Data Validation:**
```
department_sub_batches (altered record):
- stage: "COMPLETED"
- is_current: false

department_sub_batches (Dep-Y - main record):
- quantity_received: 50 (unchanged - items returned!)
- quantity_remaining: 20 (15 + 5 returned)

Quantity Conservation Check:
  Assigned: 30 (RT-Y-W1 normal work)
  Remaining: 20 (15 main + 5 returned)
  Total: 30 + 20 = 50 ✓ CORRECT
```

#### 2.7 Wage Calculation Verification (CRITICAL)
33. [ ] Query worker_logs for RT-SB-1 in Dep-Y
34. [ ] Verify two distinct activity types:

```sql
SELECT
  worker_name,
  activity_type,
  SUM(quantity_worked) as pieces,
  AVG(unit_price) as rate,
  SUM(quantity_worked * unit_price) as wage
FROM worker_logs
WHERE sub_batch_id = RT-SB-1_ID
  AND department_id = Dep-Y_ID
GROUP BY worker_name, activity_type;

Expected Result:
worker_name | activity_type | pieces | rate | wage
RT-Y-W1     | NORMAL       | 30     | 3.00 | Rs 90.00
RT-Y-W1     | ALTERED      | 5      | 2.00 | Rs 10.00

RT-Y-W1 Total Wage: Rs 100.00
```

35. [ ] Verify NO duplicate wage calculation
36. [ ] Verify alteration work is tracked separately

**Critical Check:**
- Same worker (RT-Y-W1) has TWO log entries
- This is CORRECT (different work types)
- Total wage = Rs 90 (normal) + Rs 10 (alteration) = Rs 100 ✓

---

## PHASE 3: Wastage/Rejection Workflow (Permanent Loss) ❌

### Objective
Test the wastage workflow for UNFIXABLE items: marking items as wastage, permanently removing from production count, logging for analysis.

### Business Context
**WASTAGE = PERMANENT LOSS of defective items**
- Items CANNOT be fixed
- No worker assignment (no rework)
- Items REMOVED from production forever
- Quantity permanently reduced
- Recorded in wastage_log for analysis

### Test Steps

#### 3.1 Create Wastage in Dep-Y
1. [ ] Login as RT-Y-S (Dep-Y supervisor)
2. [ ] Open RT-SB-1 main card
3. [ ] Current state should show 20 pieces remaining
4. [ ] Click "Actions" dropdown → "Mark as Wastage"
5. [ ] Wastage modal opens
6. [ ] Verify warning message: "⚠️ This action is PERMANENT. Items will be removed from production count."
7. [ ] Fill form:
   - Wastage Reason: "Wrong size cut - cannot repair, fabric wasted"
   - Quantity to Mark as Wastage: 3 pieces
   - (NO department selection - items are discarded)
8. [ ] Modal shows: "After wastage, you will have: 17 pieces"
9. [ ] Click "Confirm Wastage"
10. [ ] Verify confirmation dialog (double-check)
11. [ ] Click "Yes, Mark as Wastage"

**Expected Results:**
- NO card created anywhere (items discarded)
- Dep-Y main card quantity reduced by 3
- Wastage log entry created
- Sub-batch total_wastage updated

**Data Validation:**
```
wastage_log table - NEW RECORD:
- sub_batch_id: RT-SB-1's ID
- department_id: Dep-Y's ID
- department_sub_batch_id: (Dep-Y main card ID)
- quantity_wasted: 3
- wastage_reason: "Wrong size cut - cannot repair, fabric wasted"
- wasted_by_supervisor_id: RT-Y-S's ID
- wasted_at: timestamp

department_sub_batches (Dep-Y - main record):
- quantity_remaining: 17 (was 20, LOST 3 forever)
- quantity_wasted: 3  ⬅️ NEW FIELD

sub_batches table (RT-SB-1):
- total_wastage: 3
- effective_quantity: 47 (50 - 3)

CRITICAL: Total quantity now 47!
  Assigned: 30 (RT-Y-W1 normal) + 5 (RT-Y-W1 altered) = 35
  Remaining: 17
  Wasted: 3
  Total: 35 + 17 + 3 = 55... WAIT, this is wrong!

CORRECT calculation:
  Original: 50 pieces
  Worked (assigned): 35 pieces
  Remaining: 12 pieces (should be)
  Wasted: 3 pieces
  Total: 35 + 12 + 3 = 50 ✓

So quantity_remaining should be 12, not 17!
```

**IMPORTANT EDGE CASE TO TEST:**
- If 30 assigned + 5 altered + 3 wasted = 38 pieces accounted for
- Original 50 - 38 = 12 pieces should be remaining
- Need to verify backend correctly calculates this!

#### 3.2 Verify Wastage Display in Task Card
12. [ ] Click on RT-SB-1 main card in Dep-Y
13. [ ] Task details modal should show:
    - Quantity Received: 50
    - Quantity Assigned: 35
    - Quantity Remaining: 12 (or whatever is correct)
    - ⚠️ Quantity Wasted: 3  ⬅️ NEW

14. [ ] Scroll to "Wastage Log" section (NEW)
15. [ ] Verify table shows:

```
┌────────┬─────┬──────────────────┬────────┬──────────┐
│ Dept   │ Qty │ Reason           │ By     │ Date     │
├────────┼─────┼──────────────────┼────────┼──────────┤
│ Dep-Y  │ 3   │ Wrong size cut...│ RT-Y-S │ 2082-... │
└────────┴─────┴──────────────────┴────────┴──────────┘

Total Wastage: 3 pieces
Effective Production: 47 pieces (50 - 3)
```

#### 3.3 Admin Production View - Wastage Verification
16. [ ] Login as Admin
17. [ ] Navigate to Production View
18. [ ] Verify NO new card created (wastage doesn't create cards)
19. [ ] Click on Dep-Y main card
20. [ ] Verify wastage section appears in modal
21. [ ] Verify red badge or indicator showing "⚠️ 3 pcs wasted"

#### 3.4 Verify NO Worker Assignment for Wastage
22. [ ] Check worker_logs table
23. [ ] Verify NO worker log entry for wastage
24. [ ] Wastage does NOT create work (no one gets paid to discard items)

**Data Validation:**
```
worker_logs table:
- Should have NO entry for the 3 wasted pieces
- Only entries for:
  * RT-Y-W1: 30 pieces (NORMAL)
  * RT-Y-W1: 5 pieces (ALTERED)
```

#### 3.5 Quantity Conservation with Wastage (CRITICAL)
25. [ ] Calculate total quantity:

```
Original Sub-Batch: 50 pieces

Dep-X (completed):
  - RT-X-W1: 25 pieces (NORMAL) = Rs 50.00
  - RT-X-W2: 25 pieces (NORMAL) = Rs 50.00
  Total: 50 pieces worked

Dep-Y (in progress):
  - RT-Y-W1: 30 pieces (NORMAL) = Rs 90.00
  - RT-Y-W1: 5 pieces (ALTERED) = Rs 10.00
  - Wasted: 3 pieces (NO WAGE)
  - Remaining: 12 pieces (unassigned)
  Total: 30 + 5 + 3 + 12 = 50 ✓

FORMULA CHECK:
  SUM(quantity_worked) + SUM(quantity_remaining) + SUM(quantity_wasted) = 50
  (25+25+30+5) + 12 + 3 = 50 ✓ CORRECT
```

26. [ ] Verify this math in database
27. [ ] Document if any discrepancies found

---

## PHASE 4: Edge Cases & Business Logic Validation ⚠️

### Objective
Test system behavior under edge cases and validate critical business logic.

### Test Steps

#### 4.1 Over-Assignment Prevention
1. [ ] Login as RT-Y-S
2. [ ] Open RT-SB-1 card (assume 12 pieces remaining)
3. [ ] Click "Assign Worker"
4. [ ] Select worker: RT-Y-W2
5. [ ] Enter quantity: 50 pieces (MORE than available 12)
6. [ ] Click "Assign"

**Expected Results:**
- ❌ Error message: "Cannot assign 50 pieces. Only 12 pieces available."
- Form does not submit
- Quantity field highlighted in red
- No worker_logs record created

**Data Validation:**
```
worker_logs table: No new record created
department_sub_batches: quantity_remaining unchanged (12)
```

#### 4.2 Negative/Zero Quantity Prevention
7. [ ] In assign worker form, enter quantity: -5
8. [ ] Verify error or form validation prevents negative numbers
9. [ ] Enter quantity: 0
10. [ ] Verify error: "Quantity must be greater than 0"

#### 4.3 Wastage More Than Available
11. [ ] Try to mark 20 pieces as wastage (more than 12 available)
12. [ ] Verify error: "Cannot waste 20 pieces. Only 12 pieces available."

#### 4.4 Alteration More Than Available
13. [ ] Try to send 20 pieces for alteration (more than available)
14. [ ] Verify error: "Cannot alter 20 pieces. Only 12 pieces available."

#### 4.5 Department Filtering Test (Security)
15. [ ] Login as RT-X-S (Dep-X supervisor)
16. [ ] Verify ONLY Dep-X tasks are visible
17. [ ] Verify NO tasks from Dep-Y or Dep-Z are shown
18. [ ] Try to access a Dep-Y task directly via URL (if possible)

**Expected Results:**
- ✅ Supervisor sees only their department's tasks
- ✅ Access denied or redirect if trying to access other department's tasks

#### 4.6 Completing Task with Remaining Quantity
19. [ ] Have a task with 12 pieces remaining
20. [ ] Try to mark status as "Completed" WITHOUT advancing all pieces

**Expected Results:**
- ❌ Error: "Cannot mark as completed. 12 pieces still remaining."
- Must either:
  - Advance remaining pieces, OR
  - Mark remaining as wastage

#### 4.7 Final Department Advancement (Dep-Z → Complete)
21. [ ] Advance RT-SB-1 all the way to Dep-Z (final department)
22. [ ] Assign all pieces to workers in Dep-Z
23. [ ] Mark as completed
24. [ ] Click "Advance to Next Department"

**Expected Results:**
- ✅ No "next department" available
- ✅ Modal shows: "This is the last department. Sub-batch will be marked as COMPLETED."
- ✅ Sub-batch status changes to "COMPLETED"
- ✅ Card disappears from all department columns

**Data Validation:**
```
sub_batches table:
- status: "IN_PRODUCTION" → "COMPLETED"
- completed_at: timestamp set
- effective_quantity: 47 (if 3 wasted)

department_sub_batches (Dep-Z):
- stage: "COMPLETED"
- is_current: false
```

---

## PHASE 5: Wage Calculation & Activity Type Validation 💰

### Objective
Verify piece-rate wage calculations are accurate, activity types are correctly tracked, and reports can be generated.

### Test Steps

#### 5.1 Complete Wage Calculation for RT-SB-1
1. [ ] Query all worker_logs for RT-SB-1
2. [ ] Calculate total wages by department:

```sql
SELECT
  d.name as department,
  w.name as worker,
  wl.activity_type,
  SUM(wl.quantity_worked) as pieces,
  AVG(wl.unit_price) as avg_rate,
  SUM(wl.quantity_worked * wl.unit_price) as total_wage
FROM worker_logs wl
JOIN workers w ON wl.worker_id = w.id
JOIN departments d ON wl.department_id = d.id
WHERE wl.sub_batch_id = RT-SB-1_ID
GROUP BY d.name, w.name, wl.activity_type
ORDER BY d.name, w.name, wl.activity_type;
```

**Expected Result Example:**
```
Department | Worker   | Activity | Pieces | Avg Rate | Total Wage
Dep-X      | RT-X-W1  | NORMAL   | 25     | 2.00     | Rs 50.00
Dep-X      | RT-X-W2  | NORMAL   | 25     | 2.00     | Rs 50.00
Dep-Y      | RT-Y-W1  | NORMAL   | 30     | 3.00     | Rs 90.00
Dep-Y      | RT-Y-W1  | ALTERED  | 5      | 2.00     | Rs 10.00
Dep-Z      | RT-Z-W1  | NORMAL   | 47     | 1.50     | Rs 70.50

TOTAL LABOR COST: Rs 270.50
```

3. [ ] Verify total pieces worked = original - wastage
4. [ ] Verify no duplicate wage entries

#### 5.2 Activity Type Distribution
5. [ ] Query activity type breakdown:

```sql
SELECT
  activity_type,
  COUNT(*) as log_entries,
  SUM(quantity_worked) as total_pieces,
  SUM(quantity_worked * unit_price) as total_cost
FROM worker_logs
WHERE sub_batch_id = RT-SB-1_ID
GROUP BY activity_type;
```

**Expected:**
```
Activity Type | Entries | Pieces | Total Cost
NORMAL        | 4       | 127    | Rs 260.50
ALTERED       | 1       | 5      | Rs 10.00
```

6. [ ] Verify ALTERED work is tracked separately
7. [ ] Verify NO "REJECTED" activity type (we don't use this anymore)

#### 5.3 Billable vs Non-Billable Wage Breakdown
8. [ ] Query billable status:

```sql
SELECT
  is_billable,
  SUM(quantity_worked) as pieces,
  SUM(quantity_worked * unit_price) as total_wage
FROM worker_logs
WHERE sub_batch_id = RT-SB-1_ID
GROUP BY is_billable;
```

**Expected:**
```
Billable | Pieces | Wage
true     | 120    | Rs 250.50
false    | 12     | Rs 20.00  (if some work marked non-billable)
```

#### 5.4 Sub-Batch Cost Analysis
9. [ ] Calculate complete sub-batch cost:

```
RT-SB-1 Financial Summary:

Original Quantity: 50 pieces
Completed Quantity: 47 pieces
Wastage: 3 pieces

Labor Costs:
  Dep-X (Cutting): Rs 100.00
  Dep-Y (Stitching): Rs 100.00
  Dep-Z (Finishing): Rs 70.50
  Total Labor: Rs 270.50

Material Cost (estimated): Rs 500.00
Wastage Cost: Rs 30.00 (3 pieces wasted)

TOTAL COST: Rs 800.50
Cost per Piece: Rs 17.03 (800.50 / 47)

Selling Price: Rs 50.00 per piece
Revenue: Rs 2,350.00 (47 × 50)
PROFIT: Rs 1,549.50
Profit Margin: 65.9%
```

10. [ ] Document actual values from database
11. [ ] Verify calculations are accurate

---

## PHASE 6: Quantity Conservation & Data Integrity 🧮

### Objective
Verify that quantity tracking is 100% accurate throughout the entire workflow.

### Test Steps

#### 6.1 Total Quantity Conservation Law
At ANY point in the workflow, this equation MUST hold:

```
SUM(quantity_remaining) + SUM(quantity_worked) + SUM(quantity_wasted) = original_quantity
```

**Manual Calculation Check:**
1. [ ] Get RT-SB-1 original quantity: **50 pieces**
2. [ ] Query all department_sub_batches for RT-SB-1
3. [ ] Sum all quantity_remaining across all departments
4. [ ] Query all worker_logs for RT-SB-1
5. [ ] Sum all quantity_worked
6. [ ] Query wastage_log for RT-SB-1
7. [ ] Sum all quantity_wasted
8. [ ] Verify: remaining + worked + wasted = 50

**Example Calculation:**
```
Remaining:
  Dep-X: 0 (completed)
  Dep-Y: 0 (completed)
  Dep-Z: 0 (completed)
  Total Remaining: 0

Worked (from worker_logs):
  Dep-X NORMAL: 50 (RT-X-W1: 25, RT-X-W2: 25)
  Dep-Y NORMAL: 30 (RT-Y-W1: 30)
  Dep-Y ALTERED: 5 (RT-Y-W1: 5)
  Dep-Z NORMAL: 47 (RT-Z-W1: 47)
  Total Worked: 132 pieces

WAIT - This seems wrong! We're double-counting!

CORRECT UNDERSTANDING:
  - Dep-X worked on 50 pieces (cut them)
  - Dep-Y worked on 35 pieces (30 normal + 5 altered)
  - Dep-Z worked on 47 pieces (50 - 3 wasted)

  Total UNIQUE pieces: 50 original - 3 wasted = 47 final
  Total WORK DONE: 132 pieces-worth of work (some pieces worked multiple times)

This is CORRECT for wage calculation!
  - Workers get paid for WORK DONE, not unique pieces
  - If 5 pieces need alteration, workers do extra work on them
  - Total wages reflect total work, not just final product count
```

9. [ ] Verify this understanding with database
10. [ ] Document formula for quantity conservation

**CORRECT FORMULA:**
```
For Production Tracking:
  quantity_remaining + quantity_completed + quantity_wasted = original_quantity

For Wage Calculation:
  SUM(quantity_worked) >= original_quantity
  (Because some pieces are worked on multiple times via alteration)
```

#### 6.2 is_current Flag Validation
11. [ ] Query department_sub_batches for RT-SB-1
12. [ ] Check is_current flags
13. [ ] Verify business rule:
    - If sub_batch status = "IN_PRODUCTION": At least ONE department must have is_current = true
    - If sub_batch status = "COMPLETED": ALL departments should have is_current = false

#### 6.3 Alteration Return Tracking
14. [ ] When altered items are returned, verify:
    - Source department quantity_remaining increases
    - Altered card is marked completed
    - Quantity math reconciles

---

## PHASE 7: Concurrent Operations & Multiple Alterations ⚡

### Objective
Test what happens when multiple operations occur simultaneously.

### Test Steps

#### 7.1 Simultaneous Alteration + Wastage
1. [ ] Have 20 pieces remaining in Dep-Y
2. [ ] Create Alteration: 5 pieces to Dep-X
3. [ ] Immediately create Wastage: 3 pieces
4. [ ] Verify both operations succeed

**Expected Results:**
- ✅ Yellow card in Dep-X (5 pieces)
- ✅ Wastage log entry (3 pieces)
- ✅ Dep-Y remaining: 12 pieces (20 - 5 - 3)

**Data Validation:**
```
department_sub_batches:
- Dep-Y main: quantity_remaining = 12
- Dep-X altered: quantity_received = 5, remarks = "Altered"

wastage_log:
- quantity_wasted = 3

Total: 12 + 5 + 3 = 20 ✓
```

#### 7.2 Multiple Alterations from Same Department
2. [ ] Create first alteration: 5 pieces to Dep-X
3. [ ] Create second alteration: 3 pieces to Dep-Z
4. [ ] Verify both yellow cards appear
5. [ ] Verify source department quantity reduced by 8

---

## PHASE 8: Admin Production View Complete Verification 📊

### Objective
Verify Admin can accurately monitor entire production state in real-time.

### Test Steps

#### 8.1 Multi-Department Simultaneous View
1. [ ] Login as Admin
2. [ ] Navigate to Production View
3. [ ] Create scenario where RT-SB-1 exists in multiple states:
   - Dep-Y: Blue main card (12 pieces in progress)
   - Dep-X: Yellow altered card (5 pieces)
4. [ ] Verify all cards visible simultaneously

#### 8.2 Card Color Legend Verification
2. [ ] Verify card colors match status:
   - **Gray**: Unassigned
   - **Blue**: Worker assigned
   - **Yellow**: Altered items
   - **Green**: Completed
   - **Red Badge/Indicator**: Wastage (not a card, just indicator)

#### 8.3 Wastage Visibility
3. [ ] Verify wastage is visible in:
   - Task details modal (wastage log section)
   - Sub-batch summary (total wastage count)
   - Red badge or indicator on cards

---

## Issues & Findings Log

### Critical Issues 🔴
| Issue # | Phase | Description | Severity | Status |
|---------|-------|-------------|----------|--------|
| | | | | |

### Medium Issues 🟡
| Issue # | Phase | Description | Severity | Status |
|---------|-------|-------------|----------|--------|
| | | | | |

### Minor Issues 🟢
| Issue # | Phase | Description | Severity | Status |
|---------|-------|-------------|----------|--------|
| | | | | |

### Enhancements 💡
| Item # | Phase | Suggestion | Priority | Status |
|--------|-------|------------|----------|--------|
| | | | | |

---

## Test Summary

### Phases Completed
- [ ] Phase 0: Admin Production View Verification
- [ ] Phase 1: Normal Production Flow - Dep-X
- [ ] Phase 2: Alteration Workflow (Yellow Card)
- [ ] Phase 3: Wastage/Rejection Workflow (Permanent Loss)
- [ ] Phase 4: Edge Cases & Business Logic
- [ ] Phase 5: Wage Calculation & Activity Type
- [ ] Phase 6: Quantity Conservation & Data Integrity
- [ ] Phase 7: Concurrent Operations
- [ ] Phase 8: Admin Production View Complete

### Overall Status
- **Pass Rate**: ____%
- **Critical Issues Found**: ___
- **Business Logic Flaws**: ___
- **System Stability**: ⭐⭐⭐⭐⭐

### Key Metrics Validated
- [ ] Quantity conservation law holds
- [ ] Wage calculations accurate (piece-rate)
- [ ] Activity types correctly tracked (NORMAL vs ALTERED)
- [ ] Wastage properly logged and deducted
- [ ] No duplicate wage payments
- [ ] Department filtering works (security)

---

## Sign-off

**Tested By**: Sadin & Claude (QC Team)
**Date**: 2025-11-22
**Version**: Production Workflow QC v2.0 - Industry Standard
**Status**: ⏳ Ready to Begin Testing

---

## Notes

### Critical Business Rules
1. **Piece-Rate Wages**: Workers paid per piece (quantity_worked × unit_price)
2. **Alteration ≠ Rejection**: Alteration = fixable (yellow card), Wastage = unfixable (no card)
3. **Activity Types**: NORMAL (regular work), ALTERED (rework/modification)
4. **Quantity Conservation**: remaining + worked + wasted = original
5. **No Duplicate Wages**: Each worker log = unique work performed
6. **Wastage is Permanent**: Items removed forever, quantity reduced
