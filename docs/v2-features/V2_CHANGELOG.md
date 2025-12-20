# BlueShark v2 Changelog

**Release Date**: December 2025
**Branch**: `dev-v2`

---

## Overview

BlueShark v2 introduces significant enhancements to the supervisor management system, including a new Super Supervisor role with cross-department access, improved batch/roll tracking fields, and UI refinements.

---

## New Features

### 1. SUPER_SUPERVISOR Role

A new role that allows supervisors to manage ALL departments instead of being tied to a single department.

**Capabilities:**
- View aggregated statistics across all departments
- Switch between departments using a dropdown selector
- Access workers from all departments
- Send sub-batches to production for any department
- Purple-themed UI elements to distinguish from regular supervisors

**Database Changes:**
```prisma
enum Role {
  ADMIN
  SUPERVISOR
  SUPER_SUPERVISOR  // NEW
}
```

### 2. Supervisor Send to Production

Supervisors (including SUPER_SUPERVISOR) can now send sub-batches to production directly from the Supervisor Dashboard.

**New Features:**
- Sub-Batches view added to supervisor sidebar
- Department selection modal for sending to production
- Status badges showing Draft/In Production/Completed
- Sortable table with batch information

### 3. Roll Form Enhancement

Added "Total No of Roll Unit" field to track the count of physical roll pieces.

**Use Case:**
- Quantity field tracks weight/length (e.g., 350 kg)
- Roll Unit Count tracks physical pieces (e.g., 15 rolls)

**Database Changes:**
```prisma
model rolls {
  roll_unit_count Int?  // NEW: Number of physical roll pieces
}
```

### 4. Batch Form Enhancements

Multiple improvements to the batch creation form:

| Change | Description |
|--------|-------------|
| Rename | "Batch Name" → "Fabric Name" |
| New Field | "Order Name" added |
| New Field | "No of Unit" (fabric piece count) |
| Auto-fill | Unit now auto-fills from selected Roll |

**Database Changes:**
```prisma
model batches {
  order_name String?   // NEW: Order reference
  unit_count Int?      // NEW: Number of fabric pieces
}
```

### 5. View Rename

"Batch View" renamed to "Fabric View (Batch)" in the admin sidebar for clarity.

### 6. Unit Count Deduction from Roll to Batch

When creating batches from a roll, the system now tracks and validates unit counts (physical pieces) in addition to quantity (weight/length).

**How it works:**
```
Roll: roll_unit_count = 15 pcs
         ↓
Batch created: unit_count = 5 pcs
         ↓
Roll remaining_unit_count = 15 - 5 = 10 pcs
```

**Backend Validation:**
- `createBatch()` validates unit_count against roll's remaining units
- `updateBatch()` validates unit_count when editing
- `updateRoll()` prevents reducing roll_unit_count below allocated units

**Frontend Features:**
- BatchView shows "(Available: X pcs)" when roll is selected
- Red border on unit_count input when exceeding available
- Error message: "Exceeds available units! Max: X pcs"
- RollView displays "Remaining Units" column with color indicators:
  - Green: > 20% remaining
  - Amber: < 20% remaining
  - Red: 0 remaining

**API Response Changes:**
```typescript
// Roll response now includes:
{
  roll_unit_count: 15,
  remaining_unit_count: 10  // Calculated: roll_unit_count - SUM(batches.unit_count)
}

// getRollRemainingQuantity() now returns:
{
  totalQuantity: 350,
  usedQuantity: 100,
  remainingQuantity: 250,
  totalUnitCount: 15,      // NEW
  usedUnitCount: 5,        // NEW
  remainingUnitCount: 10   // NEW
}
```

---

## Frontend Changes

### New Files Created

| File | Description |
|------|-------------|
| `SupervisorDashboard/contexts/DepartmentContext.tsx` | React context for department selection state |
| `SupervisorDashboard/components/DepartmentSelector.tsx` | Dropdown component for SUPER_SUPERVISOR |
| `SupervisorDashboard/components/views/SubBatchView.tsx` | Sub-batch management view for supervisors |

### Files Modified

| File | Changes |
|------|---------|
| `loginandsignup/page.tsx` | Handle SUPER_SUPERVISOR role storage |
| `SupervisorDashboard/page.tsx` | Wrap with DepartmentProvider |
| `SupervisorDashboard/components/layout/Header.tsx` | Add DepartmentSelector, role badge |
| `SupervisorDashboard/components/layout/LeftSidebar.tsx` | Add Sub-Batches menu item |
| `SupervisorDashboard/components/views/DepartmentView.tsx` | Support department selection, show message for "all" |
| `SupervisorDashboard/components/views/Dashboard.tsx` | Aggregate stats across departments |
| `SupervisorDashboard/components/views/Worker.tsx` | Filter/aggregate workers by department |
| `Dashboard/components/layout/LeftSidebar.tsx` | Rename to "Fabric View (Batch)" |
| `Dashboard/components/views/BatchView.tsx` | New fields, auto-fill unit |
| `Dashboard/components/views/RollView.tsx` | Add roll_unit_count field |
| `Dashboard/components/views/CreateSupervisor.tsx` | Add role dropdown, department selection |

---

## Backend Changes

### Database Schema (Prisma)

```prisma
// Role enum update
enum Role {
  ADMIN
  SUPERVISOR
  SUPER_SUPERVISOR
}

// Rolls table
model rolls {
  roll_unit_count Int?
}

// Batches table
model batches {
  order_name String?
  unit_count Int?
}
```

### API Endpoints

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/auth/supervisor-login` | POST | Returns role field |
| `/api/supervisors` | POST/PUT | Accepts role and departmentId |
| `/api/sub-batches/send-to-production` | POST | Added auth middleware |

### Services Updated

- `authService.ts` - Handle SUPER_SUPERVISOR login
- `supervisorService.ts` - Accept role parameter
- `rollServices.ts` - Include roll_unit_count, remaining_unit_count calculation, unit count validation
- `batchServices.ts` - Include order_name, unit_count, unit count validation against roll

---

## UI/UX Changes

### Color Coding

| Role | Primary Color | Badge Color |
|------|---------------|-------------|
| Supervisor | Blue (#2272B4) | Blue (bg-blue-100) |
| Super Supervisor | Purple | Purple (bg-purple-100) |

### Department Selector

- Appears in header for SUPER_SUPERVISOR only
- "All Departments" option shows aggregated view
- Individual department selection loads specific data
- Amber styling for "All Departments" selection
- Blue styling for specific department selection

### Informational Banners

Purple banners appear when SUPER_SUPERVISOR views "All Departments":
- Dashboard: "Viewing All Departments - Stats shown are aggregated across X departments"
- Workers: "Showing workers across X departments (Y total workers)"
- Sub-Batches: "Showing X sub-batches across Y departments"

### Department View Message

When SUPER_SUPERVISOR has "All Departments" selected, the Kanban board shows:
- Building icon with amber background
- "Select a Department" heading
- Instruction to select a specific department
- List of available departments as badges

---

## Migration Guide

See `MIGRATION_NOTES.md` for detailed database migration steps.

---

## Testing Checklist

### SUPER_SUPERVISOR Features
- [ ] Create SUPER_SUPERVISOR via admin form
- [ ] Login as SUPER_SUPERVISOR
- [ ] Verify department selector appears
- [ ] Test "All Departments" aggregated stats
- [ ] Test specific department selection
- [ ] Verify Kanban loads for specific department
- [ ] Test Sub-Batches view and send to production

### Form Changes
- [ ] Roll form shows "Total No of Roll Unit" field
- [ ] Batch form shows "Fabric Name" label
- [ ] Batch form has "Order Name" field
- [ ] Batch form has "No of Unit" field
- [ ] Unit auto-fills when Roll is selected

### Unit Count Deduction
- [ ] RollView displays "Remaining Units" column
- [ ] Remaining units show color indicators (green/amber/red)
- [ ] BatchView shows available units when roll selected
- [ ] Red border appears when unit_count exceeds available
- [ ] Error toast when trying to save exceeding units
- [ ] Cannot reduce roll_unit_count below allocated batches

### Admin Supervisor Form
- [ ] Role dropdown appears
- [ ] Department field hidden for SUPER_SUPERVISOR
- [ ] Department required for SUPERVISOR
- [ ] Role badge shows in table
- [ ] Department shows in table

---

## Known Limitations

1. SUPER_SUPERVISOR cannot view Kanban with "All Departments" selected - must choose a specific department
2. Backend requires `departmentId` query param for SUPER_SUPERVISOR API calls
3. Statistics aggregation makes multiple API calls (one per department)

---

## Super Supervisor Sub-Batch Permissions (v2.2.0)

### Overview
Enhanced Super Supervisor access to Sub-Batch management with full Workflow Builder for sending sub-batches to production, while maintaining appropriate restrictions on creation and deletion.

### Permission Matrix

| Feature | Admin | Super Supervisor |
|---------|-------|------------------|
| View Sub-Batches | ✅ | ✅ |
| Create Sub-Batch | ✅ | ❌ (Button hidden) |
| Delete Sub-Batch | ✅ | ❌ (Button hidden) |
| Send to Production (Workflow Builder) | ✅ | ✅ |
| Edit - Name, Batch, Roll, Pieces, Category, Items | ✅ | ❌ (Read-only) |
| Edit - Attachment | ✅ | ✅ |
| Edit - Start Date / Due Date | ✅ | ✅ |

### Changes Made

#### 1. Workflow Builder for Super Supervisor
**File:** `src/app/SupervisorDashboard/components/views/SubBatchView.tsx`

- Replaced simple "Select Department" dropdown with full Workflow Builder
- Super Supervisor can now:
  - Add multiple departments to workflow
  - Remove departments from workflow
  - See workflow preview before sending
  - Define complete production flow

**Workflow Builder Features:**
```
┌─────────────────────────────────────┐
│   Send Sub Batch to Production      │
│   ─────────────────────────────     │
│   Sub Batch Summary                 │
│   Name: testSCZ    ID: B0006        │
│                                     │
│   ┌─ Workflow Builder ────────────┐ │
│   │ [Select Start Department ▼] 🗑 │ │
│   │ [+ Add Next Department]       │ │
│   └───────────────────────────────┘ │
│                                     │
│   Workflow Preview: Cutting → ...   │
│                                     │
│   [Cancel]  [Confirm & Send]        │
└─────────────────────────────────────┘
```

#### 2. Edit Modal with Restricted Fields
- View and Edit buttons added to Actions column
- Edit modal shows all fields but restricts editing:
  - **Read-only (grayed out):** Name, Batch, Pieces
  - **Editable:** Attachments, Start Date, Due Date
- Info note displayed: "As a Super Supervisor, you can only edit Attachments and Dates."

#### 3. Hidden Actions for Super Supervisor
- "+ Add Sub Batch" button: Hidden (Super Supervisor cannot create)
- Delete button: Hidden (Super Supervisor cannot delete)
- Only Admin can create and delete sub-batches

### API Integration
Uses existing endpoint with workflow array:
```typescript
POST /sub-batches/send-to-production
{
  subBatchId: number,
  manualDepartments: number[],  // Array of department IDs in order
  total_quantity: number
}
```

### Testing Checklist
- [ ] Super Supervisor cannot see "+ Add Sub Batch" button
- [ ] Super Supervisor can see View, Edit, Send buttons
- [ ] Super Supervisor sees Workflow Builder (not simple dropdown)
- [ ] Can add multiple departments to workflow
- [ ] Workflow Preview displays correctly
- [ ] Edit modal shows read-only fields for Name, Batch, Pieces
- [ ] Can edit Attachments and Dates
- [ ] Save edit updates only allowed fields

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v2.0.0 | Dec 2025 | Initial v2 release with SUPER_SUPERVISOR role |
| v2.1.0 | Dec 19, 2025 | Unit count deduction from Roll to Batch |
| v2.2.0 | Dec 19, 2025 | Super Supervisor Sub-Batch permissions with Workflow Builder |
