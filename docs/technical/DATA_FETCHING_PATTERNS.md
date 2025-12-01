# Data Fetching Patterns - BlueShark Production Management

This document describes the consistent data fetching patterns used across the BlueShark application to ensure reliability and maintainability.

## Key Principles

1. **Always fetch related data via Prisma includes** - Don't fetch data separately and join manually
2. **Use consistent field mapping** - Frontend record structure should match across all views
3. **Include all relations for calculations** - Rejection/Alteration data must be included for accurate summaries

---

## Worker Logs Data Flow

### Backend Service: `workerLogService.ts`

**Function**: `getWorkerLogsBySubBatch(sub_batch_id, department_id?, department_sub_batch_id?)`

**Required Includes**:
```typescript
include: {
  worker: true,
  sub_batch: true,
  departments: true,
  department_sub_batch: true,
  rejected_entry: true,    // CRITICAL for rejection data
  altered_entry: true,     // CRITICAL for alteration data
}
```

### Frontend Mapping: `TaskDetailsModal.tsx`

**Location**: `fetchWorkerLogs()` function (lines 54-142)

**Record Structure**:
```typescript
{
  id: number,
  worker: string,           // From r.worker_name or r.worker?.name
  worker_id: number,
  date: string,             // Formatted from r.work_date
  realCategory: string,     // r.size_category
  particulars: string,
  qtyReceived: number,      // r.quantity_received
  qtyWorked: number,        // r.quantity_worked
  unitPrice: number,
  rejectReturn: number,     // From r.rejected_entry[0].quantity
  returnTo: string,         // Department name from rejection
  rejectionReason: string,  // r.rejected_entry[0].reason
  alteration: number,       // From r.altered_entry[0].quantity
  alterationNote: string,   // r.altered_entry[0].reason
  status: string,
  department_id: number,
  department_sub_batch_id: number,
  activity_type: string,
}
```

### Critical: Extraction Pattern for Rejection/Alteration

```typescript
// Extract rejection data from rejected_entry array
const rejectedEntry = r.rejected_entry && r.rejected_entry.length > 0 ? r.rejected_entry[0] : null;
const rejectedQty = rejectedEntry?.quantity ?? 0;
const rejectionReason = rejectedEntry?.reason || '-';

// Extract alteration data from altered_entry array
const alteredEntry = r.altered_entry && r.altered_entry.length > 0 ? r.altered_entry[0] : null;
const alteredQty = alteredEntry?.quantity ?? 0;
const alterationNote = alteredEntry?.reason || '-';
```

---

## Production Summary Calculations

### Location: `TaskDetailsModal.tsx` - `workProgress` useMemo (lines 509-543)

**Calculation Logic**:
```typescript
const totalWorkDone = currentDepartmentRecords.reduce((sum, record) => sum + (record.qtyWorked || 0), 0);
const totalAltered = currentDepartmentRecords.reduce((sum, record) => sum + (record.alteration || 0), 0);
const totalRejected = currentDepartmentRecords.reduce((sum, record) => sum + (record.rejectReturn || 0), 0);

// Remaining = Received - Worked - Rejected - Altered
const remainingWork = quantityToWork - totalWorkDone - totalRejected - totalAltered;
```

**Display Fields**:
- Received: `quantityToWork` (from taskData.quantity_received or fallbacks)
- Worked: `totalWorkDone`
- Altered: `totalAltered`
- Rejected: `totalRejected`
- Remaining: `remainingWork`

---

## Activity History Events

### Location: `TaskDetailsModal.tsx` (lines 1373-1528)

**Event Types**:
1. **Department Arrival** (blue dot) - When sub-batch arrives at department
2. **Worker Assignment** (green dot) - Each worker assignment
3. **Rejection Event** (red dot) - When worker's work is rejected
4. **Alteration Event** (yellow dot) - When worker's work is sent for alteration
5. **Current Status** (varies) - Current stage indicator

**Event Count Calculation**:
```typescript
const eventCount =
  (currentDepartmentRecords?.length || 0) +                                    // Worker assignments
  (currentDepartmentRecords?.filter(r => (r.rejectReturn || 0) > 0).length || 0) +  // Rejections
  (currentDepartmentRecords?.filter(r => (r.alteration || 0) > 0).length || 0) +     // Alterations
  1;  // Department arrival
```

---

## Alteration Flow

### Backend Service: `adminProductionService.ts`

**Function**: `createAlteration(data: AdminAlterationInput)`

**CRITICAL**: Must set `worker_log_id` when creating `sub_batch_altered` record:
```typescript
const altered = await tx.sub_batch_altered.create({
  data: {
    sub_batch_id: data.sub_batch_id,
    quantity: data.quantity,
    reason: data.note,
    sent_to_department_id: data.return_to_department_id,
    source_department_sub_batch_id: sourceEntry.id,
    created_department_sub_batch_id: newDeptSubBatch.id,
    worker_log_id: data.worker_log_id,  // CRITICAL: Links alteration to worker
  },
});
```

**Why This Matters**:
- The `altered_entry` relation on `worker_logs` is populated via this foreign key
- Without `worker_log_id`, the worker's `altered_entry[]` will be empty
- Frontend calculates `totalAltered` from this data

---

## Rejection Flow

### Backend Service: `adminProductionService.ts`

**Function**: `createRejection(data: AdminRejectionInput)`

**Structure** (similar to alteration):
```typescript
const rejected = await tx.sub_batch_rejected.create({
  data: {
    sub_batch_id: data.sub_batch_id,
    quantity: data.quantity,
    reason: data.reason,
    sent_to_department_id: null,  // Rejection = waste, no destination
    source_department_sub_batch_id: sourceEntry.id,
    created_department_sub_batch_id: null,  // No new card created
    worker_log_id: data.worker_log_id,  // CRITICAL: Links rejection to worker
  },
});
```

---

## Common Issues and Solutions

### Issue 1: Production Summary Shows 0 for Altered/Rejected
**Cause**: `worker_log_id` not being set when creating `sub_batch_altered` or `sub_batch_rejected`
**Solution**: Ensure backend service sets `worker_log_id` field

### Issue 2: Activity History Missing Events
**Cause**: Not filtering records properly by alteration/rejection quantity
**Solution**: Use `(record.alteration || 0) > 0` filter pattern

### Issue 3: Data Shows in One View But Not Another
**Cause**: Inconsistent record mapping between views
**Solution**: Use same extraction pattern for `rejected_entry` and `altered_entry` arrays

### Issue 4: Kanban Card Shows Wrong Quantities
**Cause**: API response doesn't include full worker_logs with relations
**Solution**: Use "Processed" label (Received - Remaining) or add `quantity_rejected/altered` to API

---

## Checklist for New Features

When adding features that involve worker logs, rejection, or alteration:

- [ ] Backend includes `rejected_entry: true` and `altered_entry: true` in Prisma query
- [ ] Backend sets `worker_log_id` when creating `sub_batch_rejected` or `sub_batch_altered`
- [ ] Frontend extracts rejection/alteration data from arrays (handle empty case)
- [ ] Frontend calculations use consistent field names (`rejectReturn`, `alteration`)
- [ ] Activity History includes new event type if applicable
- [ ] Production Summary calculations updated if new tracking field added

---

**Last Updated**: 2025-12-01
**Related Files**:
- `blueshark-backend-test/backend/src/services/workerLogService.ts`
- `blueshark-backend-test/backend/src/services/adminProductionService.ts`
- `src/app/SupervisorDashboard/depcomponents/TaskDetailsModal.tsx`
- `src/app/SupervisorDashboard/depcomponents/AlterationModal.tsx`
- `src/app/SupervisorDashboard/depcomponents/RejectionModal.tsx`
