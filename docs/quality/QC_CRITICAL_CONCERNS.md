# Critical QC Concerns - BlueShark Production System

## 🔴 **HIGH PRIORITY CONCERNS**

### 1. **Quantity Conservation Law**
**Concern**: Does the system properly enforce: `Received = Worked + Altered + Rejected + Remaining`?

**Test Scenario**:
- RT-SB-1 has 50 pieces
- Assign 20 pieces to RT-X-W1 (Worked: 20, Remaining: 30)
- Mark 5 pieces as altered (Worked: 20, Altered: 5, Remaining: 25)
- Mark 10 pieces as rejected (Worked: 20, Altered: 5, Rejected: 10, Remaining: 15)
- Verify: 20 + 5 + 10 + 15 = 50 ✅

**SQL Verification**:
```sql
SELECT
  quantity_received,
  SUM(COALESCE(quantity_worked, 0)) AS total_worked,
  SUM(COALESCE(altered_quantity, 0)) AS total_altered,
  SUM(COALESCE(rejected_quantity, 0)) AS total_rejected,
  quantity_remaining
FROM department_sub_batches
WHERE id = 36;  -- RT-SB-1's department_sub_batch entry
```

---

### 2. **Alteration vs Wastage/Rejection Distinction**
**Concern**: Are altered items (fixable) treated differently from rejected items (wastage)?

**Business Rules to Verify**:
- ✅ **Alteration**: Creates a yellow card in another department
- ✅ **Alteration**: Items can be reworked and returned
- ✅ **Rejection**: Items are permanently lost (wastage)
- ✅ **Rejection**: No card is created (direct quantity loss)

**Test Scenario A - Alteration**:
1. Mark 10 pieces from RT-SB-1 as "ALTERED"
2. Reason: "Wrong stitching"
3. Send to: Dep-Y for rework
4. Expected: Yellow card appears in Dep-Y with 10 pieces

**Test Scenario B - Rejection**:
1. Mark 5 pieces as "REJECTED"
2. Reason: "Fabric torn"
3. Expected: NO card created, quantity simply reduces

---

### 3. **Piece-Rate Wage Calculation**
**Concern**: Are wages calculated correctly based on quantity × unit_price?

**Formula**: `wage = quantity_worked × unit_price`

**Test Data**:
| Worker | Quantity | Unit Price | Expected Wage |
|--------|----------|-----------|---------------|
| RT-X-W1 | 20 | ₹10 | ₹200 |
| RT-X-W2 | 15 | ₹12 | ₹180 |

**SQL Verification**:
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

**Critical Check**: Ensure unit_price is NOT confused with worker.wage_rate

---

### 4. **Department Flow & is_current Flag**
**Concern**: Does the system correctly track sub-batch location as it moves between departments?

**Test Scenario**:
1. RT-SB-1 is currently in Dep-X (is_current = true)
2. Mark as COMPLETED and send to Dep-Y
3. Expected:
   - Dep-X entry: `is_current = false`
   - New Dep-Y entry: `is_current = true`
   - Old entry preserved for history

**SQL Verification**:
```sql
SELECT
  dsb.id,
  d.name,
  dsb.stage,
  dsb.is_current,
  dsb.created_at
FROM department_sub_batches dsb
JOIN departments d ON d.id = dsb.department_id
WHERE dsb.sub_batch_id = 10
ORDER BY dsb.id ASC;
```

---

### 5. **Partial Quantity Movement**
**Concern**: Can a supervisor send partial quantity to next department while keeping rest?

**Example**:
- RT-SB-1 has 50 pieces in Dep-X
- Supervisor completes work on 30 pieces
- Wants to send only 30 to Dep-Y
- Keeps remaining 20 for more work

**Expected Behavior**:
- ❓ **Question for User**: Should we allow partial quantity advancement?
- ❓ OR: Must complete ALL work before sending to next department?

---

### 6. **Worker Assignment After Partial Work**
**Concern**: What happens when work is partially done?

**Scenario**:
1. RT-X-W1 assigned 20 pieces (Remaining: 30)
2. Supervisor accidentally deletes RT-X-W1's record
3. Expected: Remaining should increase back to 50

**Test Steps**:
1. Assign RT-X-W1 with 20 pieces
2. Delete the record
3. Verify Remaining = 50 again

---

### 7. **Concurrent Worker Assignment**
**Concern**: Race condition when multiple workers are assigned simultaneously

**Test Scenario**:
1. Open two browser tabs as RT-X-S
2. Tab 1: Assign RT-X-W1 with 25 pieces
3. Tab 2: Assign RT-X-W2 with 30 pieces (should fail if tab 1 saved first)
4. Expected: Second assignment should show error if exceeds remaining

---

### 8. **Date Validation**
**Concern**: Can workers log work for future dates or very old dates?

**Test Cases**:
| Date | Expected |
|------|----------|
| Yesterday | ✅ Allow |
| Today | ✅ Allow |
| Tomorrow | ❓ Allow? |
| 1 year ago | ❓ Allow? |
| 1 year future | ❌ Reject? |

**Question for User**: What's your business rule on work date validation?

---

### 9. **Sub-Batch Completion**
**Concern**: What happens when all work is done?

**Test Scenario**:
1. Assign workers totaling 50 pieces (all work done)
2. Remaining becomes 0
3. Try to:
   - a) Assign more workers (should fail)
   - b) Mark as COMPLETED (should succeed)
   - c) Send to next department

**Expected**:
- Status changes to COMPLETED
- sub_batches.status = COMPLETED
- Cannot add more workers

---

### 10. **Billable vs Non-Billable Work**
**Concern**: Is billable status tracked correctly for client invoicing?

**Test Data**:
| Worker | Quantity | Billable | Should Appear in Invoice |
|--------|----------|----------|-------------------------|
| RT-X-W1 | 20 | Yes | ✅ |
| RT-X-W2 | 15 | No | ❌ (Internal rework) |

**Use Case**: If RT-X-W2's work is rework due to error, it should NOT be billed to client.

**SQL Verification**:
```sql
SELECT
  w.name,
  wl.quantity_worked,
  wl.unit_price,
  wl.is_billable,
  CASE
    WHEN wl.is_billable THEN (wl.quantity_worked * wl.unit_price)
    ELSE 0
  END AS billable_amount
FROM worker_logs wl
JOIN workers w ON w.id = wl.worker_id
WHERE wl.sub_batch_id = 10;
```

---

### 11. **Altered Items Return Flow**
**Concern**: When altered items are fixed, how do they return to main flow?

**Scenario**:
1. Dep-X marks 10 pieces as ALTERED, sends to Dep-Y
2. Dep-Y fixes the 10 pieces
3. Where do these 10 pieces go?
   - a) Back to Dep-X to rejoin main batch?
   - b) Move forward to Dep-Z?

**Question for User**: What's the expected behavior?

---

### 12. **Department Capacity Checking**
**Concern**: Can a department handle multiple sub-batches simultaneously?

**Test Scenario**:
1. RT-SB-1 already in Dep-X
2. Create RT-SB-2 and send to Dep-X
3. Expected:
   - Both should appear in Dep-X kanban
   - Workers can be assigned to either

---

## 🟡 **MEDIUM PRIORITY CONCERNS**

### 13. **Worker Deletion Impact**
**Concern**: What happens to historical data if a worker is deleted?

**Options**:
- a) Soft delete (keep worker_logs intact)
- b) Hard delete (cascade delete logs) ❌ DANGEROUS
- c) Prevent deletion if logs exist ✅ RECOMMENDED

### 14. **Department Deletion Impact**
**Concern**: Can't delete department if sub-batches exist there

### 15. **Unit Price vs Worker Wage Rate**
**Concern**: Ensure `unit_price` in worker_logs is PER PIECE, not confused with `wage_rate` in workers table

**Example**:
- Worker wage_rate: ₹500/day (IRRELEVANT for piece-rate)
- Unit price for this task: ₹10/piece (THIS is used for calculation)

---

## 🟢 **LOW PRIORITY (Future Enhancements)**

### 16. **Multi-Currency Support**
### 17. **Overtime Calculation**
### 18. **Quality Grading (A/B/C grade work)**

---

## Summary of Questions for User

1. **Partial Quantity Movement**: Allow partial advancement?
2. **Work Date Validation**: How far back/forward to allow?
3. **Altered Items Return**: Where do fixed items go?
4. **Worker Deletion**: Soft delete or prevent deletion?

---

**Created**: 2025-11-23
**For**: Phase 1 QC Testing - BlueShark Production System
