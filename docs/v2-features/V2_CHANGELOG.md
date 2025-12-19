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
- `rollServices.ts` - Include roll_unit_count
- `batchServices.ts` - Include order_name, unit_count

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

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v2.0.0 | Dec 2025 | Initial v2 release with SUPER_SUPERVISOR role |
