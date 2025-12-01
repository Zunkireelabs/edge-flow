# Admin User Stories - Complete Scenarios

## Table of Contents
1. [Introduction](#introduction)
2. [Admin Persona](#admin-persona)
3. [Scenario 1: Complete Normal Production Workflow](#scenario-1-complete-normal-production-workflow)
4. [Scenario 2: Creating Raw Materials & Batches](#scenario-2-creating-raw-materials--batches)
5. [Scenario 3: Creating Sub-Batch with Department Workflow](#scenario-3-creating-sub-batch-with-department-workflow)
6. [Scenario 4: Monitoring Production View](#scenario-4-monitoring-production-view)
7. [Scenario 5: Handling Rejected Items](#scenario-5-handling-rejected-items)
8. [Scenario 6: Handling Altered Items](#scenario-6-handling-altered-items)
9. [Scenario 7: Calculating Worker Wages](#scenario-7-calculating-worker-wages)
10. [Scenario 8: Managing Inventory](#scenario-8-managing-inventory)
11. [Scenario 9: Setting Up Departments & Supervisors](#scenario-9-setting-up-departments--supervisors)
12. [Scenario 10: Worker Management](#scenario-10-worker-management)
13. [Edge Cases & Special Scenarios](#edge-cases--special-scenarios)

---

## Introduction

This document provides **comprehensive step-by-step scenarios** for Admin users of the BlueShark Production system. Each scenario includes:
- User actions
- System behavior
- Data changes
- UI changes
- What records are created/updated
- Visual flow diagrams

---

## Admin Persona

**Name:** Ramesh Kumar
**Role:** Production Manager
**Age:** 38
**Experience:** 12 years in garment manufacturing
**Tech Skills:** Moderate (comfortable with computers but not technical)
**Goals:**
- Track entire production from raw materials to finished goods
- Monitor all departments simultaneously
- Ensure quality standards
- Calculate accurate wages for payroll
- Minimize waste and optimize resources

**Daily Tasks:**
- Check production status across departments
- Create new production orders (sub-batches)
- Review quality issues (rejections/alterations)
- Calculate weekly/monthly wages
- Manage inventory and vendors

---

## Scenario 1: Complete Normal Production Workflow

### Overview
Admin creates a complete production order from raw material to finished product, flowing through 5 departments with no quality issues.

### Initial Setup
- 5 Departments exist: Cutting, Stitching, Finishing, Quality Check, Packing
- Each department has a supervisor assigned
- Workers are assigned to departments
- Vendor "ABC Textiles" exists in system

---

### Step 1: Admin Creates Roll (Raw Material)

**User Action:**
1. Admin logs in at `/loginandsignup`
2. Navigates to Dashboard → Roll View
3. Clicks "Add Roll" button
4. Fills form:
   - Name: "Cotton Fabric Blue"
   - Quantity: 100
   - Unit: "Kilogram"
   - Color: "Blue"
   - Vendor: Select "ABC Textiles" from dropdown
5. Clicks "Save"

**System Behavior:**
```
POST /api/rolls
Body: {
  "name": "Cotton Fabric Blue",
  "quantity": 100,
  "unit": "Kilogram",
  "color": "Blue",
  "vendor_id": 5
}

Response: {
  "id": 23,
  "name": "Cotton Fabric Blue",
  "quantity": 100,
  "unit": "Kilogram",
  "color": "Blue",
  "vendor_id": 5,
  "vendor": {
    "id": 5,
    "name": "ABC Textiles",
    "address": "Kathmandu"
  },
  "created_at": "2025-11-21T10:30:00Z"
}
```

**Data Created:**
- New record in `rolls` table with ID: 23

**UI Changes:**
- Modal closes
- Roll appears in rolls table
- Success message shown
- Roll ID: 23 displayed

**State After:**
```
Database:
rolls table:
  id: 23
  name: "Cotton Fabric Blue"
  quantity: 100
  unit: "Kilogram"
  color: "Blue"
  vendor_id: 5
```

---

### Step 2: Admin Creates Batch from Roll

**User Action:**
1. Still in Dashboard, navigates to Batch View
2. Clicks "Add Batch" button
3. Fills form:
   - Batch Name: "Batch-Nov-001"
   - Select Roll: "Cotton Fabric Blue" (ID: 23)
   - Color: Auto-filled as "Blue"
   - Vendor: Auto-filled as "ABC Textiles"
   - Quantity: 100
4. Clicks "Save"

**System Behavior:**
```
POST /api/batches
Body: {
  "name": "Batch-Nov-001",
  "roll_id": 23,
  "quantity": 100,
  "color": "Blue",
  "vendor_id": 5
}

Response: {
  "id": 45,
  "name": "Batch-Nov-001",
  "roll_id": 23,
  "quantity": 100,
  "color": "Blue",
  "vendor_id": 5,
  "roll": {
    "id": 23,
    "name": "Cotton Fabric Blue"
  },
  "vendor": {
    "id": 5,
    "name": "ABC Textiles"
  },
  "created_at": "2025-11-21T10:35:00Z"
}
```

**Data Created:**
- New record in `batches` table with ID: 45

**UI Changes:**
- Modal closes
- Batch appears in batches table
- Batch ID: 45 displayed
- Linked to Roll ID: 23

**State After:**
```
Database:
batches table:
  id: 45
  name: "Batch-Nov-001"
  roll_id: 23
  quantity: 100
  color: "Blue"
  vendor_id: 5

rolls table:
  id: 23 (unchanged)
```

---

### Step 3: Admin Creates Sub-Batch (Production Order)

**User Action:**
1. Navigates to Sub-Batch View
2. Clicks "Add Sub-Batch" button
3. Fills form:
   - **Basic Info:**
     - Name: "Blue T-Shirts Order #500"
     - Roll: Select "Cotton Fabric Blue" (ID: 23)
     - Batch: Select "Batch-Nov-001" (ID: 45)
     - Estimated Pieces: 500
     - Expected Items: 500
     - Start Date: 2081/08/10 (Nepali calendar)
     - Due Date: 2081/08/25 (Nepali calendar)

   - **Size Details Section:**
     - Clicks "Add Size"
     - Size 1: Category: "XL", Pieces: 100
     - Clicks "Add Size"
     - Size 2: Category: "L", Pieces: 150
     - Clicks "Add Size"
     - Size 3: Category: "M", Pieces: 200
     - Clicks "Add Size"
     - Size 4: Category: "S", Pieces: 50

   - **Attachments Section:**
     - Clicks "Add Attachment"
     - Attachment 1: Name: "Buttons", Quantity: 500
     - Clicks "Add Attachment"
     - Attachment 2: Name: "Labels", Quantity: 500
     - Clicks "Add Attachment"
     - Attachment 3: Name: "Thread Spools", Quantity: 10

   - **Department Workflow:**
     - Clicks "Add Department"
     - Department 1: "Cutting"
     - Clicks "Add Department"
     - Department 2: "Stitching"
     - Clicks "Add Department"
     - Department 3: "Finishing"
     - Clicks "Add Department"
     - Department 4: "Quality Check"
     - Clicks "Add Department"
     - Department 5: "Packing"

4. Clicks "Save"

**System Behavior:**
```
POST /api/sub-batches
Body: {
  "name": "Blue T-Shirts Order #500",
  "roll_id": 23,
  "batch_id": 45,
  "estimated_pieces": 500,
  "expected_items": 500,
  "start_date": "2081-08-10",
  "due_date": "2081-08-25",
  "size_details": [
    { "category": "XL", "pieces": 100 },
    { "category": "L", "pieces": 150 },
    { "category": "M", "pieces": 200 },
    { "category": "S", "pieces": 50 }
  ],
  "attachments": [
    { "attachment_name": "Buttons", "quantity": 500 },
    { "attachment_name": "Labels", "quantity": 500 },
    { "attachment_name": "Thread Spools", "quantity": 10 }
  ],
  "department_workflow": [1, 2, 3, 4, 5]
}

Response: {
  "id": 78,
  "name": "Blue T-Shirts Order #500",
  "roll_id": 23,
  "batch_id": 45,
  "estimated_pieces": 500,
  "expected_items": 500,
  "start_date": "2081-08-10",
  "due_date": "2081-08-25",
  "status": "DRAFT",
  "size_details": [
    { "id": 201, "sub_batch_id": 78, "category": "XL", "pieces": 100 },
    { "id": 202, "sub_batch_id": 78, "category": "L", "pieces": 150 },
    { "id": 203, "sub_batch_id": 78, "category": "M", "pieces": 200 },
    { "id": 204, "sub_batch_id": 78, "category": "S", "pieces": 50 }
  ],
  "attachments": [
    { "id": 301, "sub_batch_id": 78, "attachment_name": "Buttons", "quantity": 500 },
    { "id": 302, "sub_batch_id": 78, "attachment_name": "Labels", "quantity": 500 },
    { "id": 303, "sub_batch_id": 78, "attachment_name": "Thread Spools", "quantity": 10 }
  ],
  "created_at": "2025-11-21T10:45:00Z"
}
```

**Data Created:**
- 1 record in `sub_batches` table (ID: 78)
- 4 records in `size_details` table (IDs: 201-204)
- 3 records in `attachments` table (IDs: 301-303)

**UI Changes:**
- Modal closes
- Sub-batch appears in sub-batches table with status: DRAFT
- Sub-batch ID: 78 displayed

**State After:**
```
Database:
sub_batches table:
  id: 78
  name: "Blue T-Shirts Order #500"
  roll_id: 23
  batch_id: 45
  estimated_pieces: 500
  expected_items: 500
  start_date: "2081-08-10"
  due_date: "2081-08-25"
  status: "DRAFT"

size_details table:
  { id: 201, sub_batch_id: 78, category: "XL", pieces: 100 }
  { id: 202, sub_batch_id: 78, category: "L", pieces: 150 }
  { id: 203, sub_batch_id: 78, category: "M", pieces: 200 }
  { id: 204, sub_batch_id: 78, category: "S", pieces: 50 }

attachments table:
  { id: 301, sub_batch_id: 78, attachment_name: "Buttons", quantity: 500 }
  { id: 302, sub_batch_id: 78, attachment_name: "Labels", quantity: 500 }
  { id: 303, sub_batch_id: 78, attachment_name: "Thread Spools", quantity: 10 }
```

---

### Step 4: Admin Sends Sub-Batch to Production

**User Action:**
1. In Sub-Batch View, finds row for "Blue T-Shirts Order #500"
2. Clicks three-dot menu (⋮)
3. Clicks "Send to Production"
4. Confirmation modal appears
5. Clicks "Confirm"

**System Behavior:**
```
POST /api/sub-batches/send-to-production
Body: {
  "sub_batch_id": 78,
  "department_ids": [1, 2, 3, 4, 5]
}

Response: {
  "message": "Sub-batch sent to production",
  "sub_batch_id": 78,
  "status": "IN_PRODUCTION",
  "department_sub_batches": [
    {
      "id": 401,
      "department_id": 1,
      "sub_batch_id": 78,
      "stage": "NEW_ARRIVAL",
      "is_current": true,
      "quantity_received": 500,
      "quantity_remaining": 500,
      "remarks": "Main"
    },
    {
      "id": 402,
      "department_id": 2,
      "sub_batch_id": 78,
      "stage": "NEW_ARRIVAL",
      "is_current": false,
      "quantity_received": 0,
      "quantity_remaining": 0,
      "remarks": null
    },
    {
      "id": 403,
      "department_id": 3,
      "sub_batch_id": 78,
      "stage": "NEW_ARRIVAL",
      "is_current": false,
      "quantity_received": 0,
      "quantity_remaining": 0,
      "remarks": null
    },
    {
      "id": 404,
      "department_id": 4,
      "sub_batch_id": 78,
      "stage": "NEW_ARRIVAL",
      "is_current": false,
      "quantity_received": 0,
      "quantity_remaining": 0,
      "remarks": null
    },
    {
      "id": 405,
      "department_id": 5,
      "sub_batch_id": 78,
      "stage": "NEW_ARRIVAL",
      "is_current": false,
      "quantity_received": 0,
      "quantity_remaining": 0,
      "remarks": null
    }
  ]
}
```

**Data Created:**
- 5 records in `department_sub_batches` table (IDs: 401-405)
- Only first department (Cutting) has `is_current: true`

**Data Updated:**
- `sub_batches` table: status changed from "DRAFT" to "IN_PRODUCTION"

**UI Changes:**
- Status badge changes from gray "DRAFT" to blue "IN_PRODUCTION"
- Success message: "Sub-batch sent to production"
- Sub-batch now visible in Production View

**State After:**
```
Database:
sub_batches table:
  id: 78
  status: "IN_PRODUCTION" (CHANGED from DRAFT)

department_sub_batches table:
  {
    id: 401,
    department_id: 1 (Cutting),
    sub_batch_id: 78,
    stage: "NEW_ARRIVAL",
    is_current: true,
    quantity_received: 500,
    quantity_remaining: 500,
    remarks: "Main"
  }
  {
    id: 402,
    department_id: 2 (Stitching),
    sub_batch_id: 78,
    is_current: false,
    quantity_received: 0,
    quantity_remaining: 0
  }
  ... (departments 3, 4, 5 similar to department 2)
```

---

### Step 5: Admin Views Production Board

**User Action:**
1. Admin navigates to Production View
2. Sees horizontal layout with 5 department columns
3. Sees "Blue T-Shirts Order #500" card in Cutting column

**What Admin Sees:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION VIEW                               │
├─────────┬─────────┬─────────┬──────────────┬─────────────────────────┤
│ Cutting │Stitching│Finishing│Quality Check │        Packing          │
├─────────┼─────────┼─────────┼──────────────┼─────────────────────────┤
│         │         │         │              │                         │
│ ┌─────┐ │         │         │              │                         │
│ │Gray │ │         │         │              │                         │
│ │Card │ │         │         │              │                         │
│ └─────┘ │         │         │              │                         │
│         │         │         │              │                         │
│  Blue   │         │         │              │                         │
│T-Shirts │         │         │              │                         │
│Order#500│         │         │              │                         │
│         │         │         │              │                         │
│Start:   │         │         │              │                         │
│08/10    │         │         │              │                         │
│Due:     │         │         │              │                         │
│08/25    │         │         │              │                         │
│         │         │         │              │                         │
│500 pcs  │         │         │              │                         │
│         │         │         │              │                         │
│ Main    │         │         │              │                         │
│(Unassign│         │         │              │                         │
│  ed)    │         │         │              │                         │
└─────────┴─────────┴─────────┴──────────────┴─────────────────────────┘
```

**Card Details:**
- **Color:** Gray (unassigned)
- **Badge:** "Main" (indicates no quality issues)
- **Title:** Blue T-Shirts Order #500
- **Dates:** Start: 2081/08/10, Due: 2081/08/25
- **Quantity:** 500 pieces
- **Status:** Unassigned (no worker assigned yet)

**System Behavior:**
```
GET /api/production-view

Response: {
  "departments": [
    {
      "id": 1,
      "name": "Cutting",
      "tasks": [
        {
          "department_sub_batch_id": 401,
          "sub_batch": {
            "id": 78,
            "name": "Blue T-Shirts Order #500",
            "estimated_pieces": 500,
            "start_date": "2081-08-10",
            "due_date": "2081-08-25"
          },
          "stage": "NEW_ARRIVAL",
          "quantity_remaining": 500,
          "quantity_received": 500,
          "assigned_worker_id": null,
          "remarks": "Main"
        }
      ]
    },
    {
      "id": 2,
      "name": "Stitching",
      "tasks": []
    },
    ... other departments
  ]
}
```

**Admin's Understanding:**
- Order is in Cutting department
- No worker assigned yet (gray card)
- 500 pieces waiting to start
- Supervisor needs to assign workers

---

### Step 6: Cutting Supervisor Assigns Worker (Admin Observes)

**Note:** This happens in Supervisor Dashboard, but Admin can observe the changes

**What Happens:**
1. Cutting Supervisor logs in
2. Assigns Worker "Ram Bahadur" to cut 250 pieces
3. Date: 2081/08/12
4. Unit price: NPR 2 per piece
5. Billable: Yes

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "worker_id": 15,
  "sub_batch_id": 78,
  "department_id": 1,
  "department_sub_batch_id": 401,
  "work_date": "2081-08-12",
  "quantity_worked": 250,
  "unit_price": 2,
  "activity_type": "NORMAL",
  "is_billable": true
}

Response: {
  "id": 501,
  "worker_id": 15,
  "sub_batch_id": 78,
  "department_id": 1,
  "department_sub_batch_id": 401,
  "work_date": "2081-08-12",
  "quantity_worked": 250,
  "unit_price": 2,
  "activity_type": "NORMAL",
  "is_billable": true,
  "created_at": "2025-11-21T11:00:00Z"
}

Then updates department_sub_batches:
PUT /api/department-sub-batches/401
{
  "assigned_worker_id": 15,
  "quantity_assigned": 250,
  "quantity_remaining": 250
}
```

**Data Created:**
- New record in `worker_logs` table (ID: 501)

**Data Updated:**
- `department_sub_batches` table (ID: 401):
  - `assigned_worker_id`: 15
  - `quantity_assigned`: 250
  - `quantity_remaining`: 250 (500 - 250)

**What Admin Sees in Production View:**
```
┌─────────────────────────┐
│ Cutting                 │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ BLUE CARD           │ │
│ │ (Assigned)          │ │
│ │                     │ │
│ │ Blue T-Shirts #500  │ │
│ │ Start: 08/10        │ │
│ │ Due: 08/25          │ │
│ │                     │ │
│ │ 250 pcs assigned    │ │
│ │ Worker: Ram Bahadur │ │
│ │                     │ │
│ │ Remaining: 250 pcs  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Card Changed:**
- **Color:** Gray → Blue (assigned)
- **Worker Name:** Shows "Ram Bahadur"
- **Quantity:** Shows 250 assigned, 250 remaining

**State After:**
```
Database:
worker_logs table:
  {
    id: 501,
    worker_id: 15,
    sub_batch_id: 78,
    department_id: 1,
    department_sub_batch_id: 401,
    quantity_worked: 250,
    unit_price: 2,
    work_date: "2081-08-12",
    activity_type: "NORMAL",
    is_billable: true
  }

department_sub_batches table (ID: 401):
  assigned_worker_id: 15
  quantity_assigned: 250
  quantity_remaining: 250
```

---

### Step 7: Supervisor Assigns Second Worker

**What Happens:**
1. Cutting Supervisor assigns remaining 250 pieces
2. Worker "Sita Kumari"
3. Date: 2081/08/12
4. Unit price: NPR 2 per piece
5. Billable: Yes

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "worker_id": 16,
  "sub_batch_id": 78,
  "department_id": 1,
  "department_sub_batch_id": 401,
  "work_date": "2081-08-12",
  "quantity_worked": 250,
  "unit_price": 2,
  "activity_type": "NORMAL",
  "is_billable": true
}

Response: {
  "id": 502,
  "worker_id": 16,
  ...
}
```

**Data Created:**
- New record in `worker_logs` table (ID: 502)

**Data Updated:**
- `department_sub_batches` table (ID: 401):
  - `quantity_remaining`: 0 (250 - 250)

**State After:**
```
Database:
worker_logs table:
  { id: 501, worker_id: 15, quantity_worked: 250 }
  { id: 502, worker_id: 16, quantity_worked: 250 }

department_sub_batches table (ID: 401):
  quantity_remaining: 0 (all assigned)
```

---

### Step 8: Supervisor Advances to Stitching Department

**What Happens:**
1. Workers complete cutting
2. Supervisor changes status to "Completed"
3. Supervisor clicks "Advance to Next Department"
4. Selects "Stitching" (next in workflow)
5. Enters quantity: 500 (all pieces)
6. Clicks "Submit"

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 401,
  "next_department_id": 2,
  "quantity_advancing": 500,
  "sub_batch_id": 78
}

Response: {
  "message": "Advanced to Stitching",
  "current_updated": {
    "id": 401,
    "stage": "COMPLETED",
    "is_current": false
  },
  "next_updated": {
    "id": 402,
    "department_id": 2,
    "stage": "NEW_ARRIVAL",
    "is_current": true,
    "quantity_received": 500,
    "quantity_remaining": 500,
    "remarks": "Main"
  }
}
```

**Data Updated:**

**Cutting Department (ID: 401):**
- `stage`: "NEW_ARRIVAL" → "COMPLETED"
- `is_current`: true → false

**Stitching Department (ID: 402):**
- `stage`: "NEW_ARRIVAL" (unchanged)
- `is_current`: false → true
- `quantity_received`: 0 → 500
- `quantity_remaining`: 0 → 500
- `remarks`: null → "Main"

**What Admin Sees in Production View:**
```
┌─────────┬─────────┐
│ Cutting │Stitching│
├─────────┼─────────┤
│         │ ┌─────┐ │
│ ✓ Done  │ │Gray │ │
│         │ │Card │ │
│         │ └─────┘ │
│         │         │
│         │  Blue   │
│         │T-Shirts │
│         │Order#500│
│         │         │
│         │500 pcs  │
│         │         │
│         │ Main    │
│         │(Unassign│
│         │  ed)    │
└─────────┴─────────┘
```

**Card Movement:**
- Card disappears from Cutting column (completed)
- Card appears in Stitching column (gray, unassigned)
- Quantity: 500 pieces (full amount)

**State After:**
```
Database:
department_sub_batches table:
  {
    id: 401 (Cutting),
    stage: "COMPLETED",
    is_current: false
  }
  {
    id: 402 (Stitching),
    stage: "NEW_ARRIVAL",
    is_current: true,
    quantity_received: 500,
    quantity_remaining: 500,
    remarks: "Main"
  }
```

---

### Step 9: Production Flows Through Remaining Departments

**Similar Process for Each Department:**

**Stitching → Finishing:**
- Stitching supervisor assigns workers
- Completes stitching of 500 pieces
- Advances 500 to Finishing
- Card moves to Finishing column

**Finishing → Quality Check:**
- Finishing supervisor assigns workers
- Completes finishing of 500 pieces
- Advances 500 to Quality Check
- Card moves to Quality Check column

**Quality Check → Packing:**
- QC supervisor assigns workers
- Inspects all 500 pieces
- Passes all (no rejections)
- Advances 500 to Packing
- Card moves to Packing column

**Packing → Completion:**
- Packing supervisor assigns workers
- Packs all 500 pieces
- Marks as "Completed"
- Updates sub-batch status

**Final System Behavior:**
```
PUT /api/sub-batches/78
Body: {
  "status": "COMPLETED",
  "completed_at": "2025-11-21T15:30:00Z"
}

Response: {
  "id": 78,
  "status": "COMPLETED",
  "completed_at": "2025-11-21T15:30:00Z"
}
```

**Data Updated:**
- `sub_batches` table (ID: 78):
  - `status`: "IN_PRODUCTION" → "COMPLETED"
  - `completed_at`: "2025-11-21T15:30:00Z"

**Final State:**
```
Database:
sub_batches table:
  id: 78
  status: "COMPLETED"
  completed_at: "2025-11-21T15:30:00Z"

department_sub_batches table:
  { id: 401, department_id: 1, stage: "COMPLETED", is_current: false }
  { id: 402, department_id: 2, stage: "COMPLETED", is_current: false }
  { id: 403, department_id: 3, stage: "COMPLETED", is_current: false }
  { id: 404, department_id: 4, stage: "COMPLETED", is_current: false }
  { id: 405, department_id: 5, stage: "COMPLETED", is_current: true }
```

**What Admin Sees:**
- Sub-batch no longer appears in Production View (completed)
- Status badge in Sub-Batch View: "COMPLETED" (green)
- All 500 pieces successfully produced

---

## Scenario 2: Creating Raw Materials & Batches

### Sub-Scenario 2.1: Creating Multiple Rolls from Same Vendor

**User Action:**
1. Admin in Roll View
2. Creates Roll 1: "Red Cotton, 80kg, Red, Vendor: ABC Textiles"
3. Creates Roll 2: "Yellow Cotton, 60kg, Yellow, Vendor: ABC Textiles"
4. Creates Roll 3: "Green Cotton, 90kg, Green, Vendor: ABC Textiles"

**System Behavior:**
```
Three separate POST requests to /api/rolls

Roll 1 Response: { id: 24, name: "Red Cotton", ... }
Roll 2 Response: { id: 25, name: "Yellow Cotton", ... }
Roll 3 Response: { id: 26, name: "Green Cotton", ... }
```

**Data Created:**
- 3 records in `rolls` table (IDs: 24, 25, 26)
- All linked to same vendor (ID: 5)

**UI After:**
```
Rolls Table:
┌────┬──────────────┬──────────┬──────────┬────────┬──────────────┐
│ ID │ Name         │ Quantity │ Unit     │ Color  │ Vendor       │
├────┼──────────────┼──────────┼──────────┼────────┼──────────────┤
│ 24 │ Red Cotton   │ 80       │ Kilogram │ Red    │ ABC Textiles │
│ 25 │ Yellow Cotton│ 60       │ Kilogram │ Yellow │ ABC Textiles │
│ 26 │ Green Cotton │ 90       │ Kilogram │ Green  │ ABC Textiles │
└────┴──────────────┴──────────┴──────────┴────────┴──────────────┘
```

---

### Sub-Scenario 2.2: Editing Existing Roll

**User Action:**
1. Admin finds "Red Cotton" roll (ID: 24)
2. Clicks three-dot menu (⋮)
3. Clicks "Edit"
4. Changes quantity from 80 to 85
5. Clicks "Save"

**System Behavior:**
```
PUT /api/rolls/24
Body: {
  "name": "Red Cotton",
  "quantity": 85,
  "unit": "Kilogram",
  "color": "Red",
  "vendor_id": 5
}

Response: {
  "id": 24,
  "quantity": 85,
  ...
}
```

**Data Updated:**
- `rolls` table (ID: 24): quantity changed 80 → 85

**UI After:**
- Table updates showing 85 instead of 80
- Success message shown

---

### Sub-Scenario 2.3: Deleting Roll (with validation)

**User Action:**
1. Admin tries to delete "Red Cotton" roll (ID: 24)
2. Clicks three-dot menu (⋮)
3. Clicks "Delete"
4. Confirmation modal appears
5. Clicks "Confirm Delete"

**System Behavior (if roll has batches):**
```
DELETE /api/rolls/24

Response: {
  "error": "Cannot delete roll. It has associated batches.",
  "status": 400
}
```

**UI After:**
- Error alert shown
- Roll remains in table

**System Behavior (if roll has NO batches):**
```
DELETE /api/rolls/24

Response: {
  "message": "Roll deleted successfully",
  "status": 200
}
```

**Data Deleted:**
- Record removed from `rolls` table (ID: 24)

**UI After:**
- Roll disappears from table
- Success message shown

---

### Sub-Scenario 2.4: Creating Batch from Specific Roll

**User Action:**
1. Admin in Batch View
2. Clicks "Add Batch"
3. Selects Roll dropdown
4. Sees all available rolls:
   - "Cotton Fabric Blue" (100kg, Blue)
   - "Red Cotton" (85kg, Red)
   - "Yellow Cotton" (60kg, Yellow)
   - "Green Cotton" (90kg, Green)
5. Selects "Red Cotton"

**What Happens Automatically:**
- Color field auto-fills with "Red"
- Vendor field auto-fills with "ABC Textiles"
- Quantity field becomes editable

6. Enters Batch Name: "Batch-Red-Nov"
7. Enters Quantity: 50 (using 50kg of the 85kg roll)
8. Clicks "Save"

**System Behavior:**
```
POST /api/batches
Body: {
  "name": "Batch-Red-Nov",
  "roll_id": 24,
  "quantity": 50,
  "color": "Red",
  "vendor_id": 5
}

Response: {
  "id": 46,
  "name": "Batch-Red-Nov",
  "roll_id": 24,
  "quantity": 50,
  "color": "Red",
  "vendor_id": 5
}
```

**Data Created:**
- New record in `batches` table (ID: 46)

**Important Note:**
- Roll quantity (85kg) is NOT reduced
- Roll is still showing 85kg (system doesn't auto-deduct)
- This is current behavior

---

## Scenario 3: Creating Sub-Batch with Department Workflow

### Sub-Scenario 3.1: Sub-Batch with Custom Size Categories

**User Action:**
1. Admin creates sub-batch: "Custom Hoodies"
2. Adds custom size categories:
   - Category: "Extra Small", Pieces: 30
   - Category: "Small-Medium", Pieces: 70
   - Category: "Large-XL", Pieces: 100
   - Category: "2XL", Pieces: 50
   - Category: "3XL", Pieces: 20

**System Behavior:**
```
POST /api/sub-batches
Body: {
  "name": "Custom Hoodies",
  "size_details": [
    { "category": "Extra Small", "pieces": 30 },
    { "category": "Small-Medium", "pieces": 70 },
    { "category": "Large-XL", "pieces": 100 },
    { "category": "2XL", "pieces": 50 },
    { "category": "3XL", "pieces": 20 }
  ],
  ...
}
```

**Data Created:**
- 1 sub-batch record
- 5 size_details records with custom category names

**Key Point:**
- Category names are free text (not predefined)
- Admin can enter any size category

---

### Sub-Scenario 3.2: Sub-Batch with Many Attachments

**User Action:**
1. Admin creates sub-batch: "Premium Jackets"
2. Adds 8 attachments:
   - Zippers: 200
   - Buttons (large): 400
   - Buttons (small): 800
   - Hood strings: 200
   - Elastic bands: 400
   - Labels (brand): 200
   - Labels (size): 200
   - Thread spools: 15

**System Behavior:**
```
POST /api/sub-batches
Body: {
  "name": "Premium Jackets",
  "attachments": [
    { "attachment_name": "Zippers", "quantity": 200 },
    { "attachment_name": "Buttons (large)", "quantity": 400 },
    { "attachment_name": "Buttons (small)", "quantity": 800 },
    { "attachment_name": "Hood strings", "quantity": 200 },
    { "attachment_name": "Elastic bands", "quantity": 400 },
    { "attachment_name": "Labels (brand)", "quantity": 200 },
    { "attachment_name": "Labels (size)", "quantity": 200 },
    { "attachment_name": "Thread spools", "quantity": 15 }
  ],
  ...
}
```

**Data Created:**
- 1 sub-batch record
- 8 attachment records

**Key Point:**
- No limit on number of attachments
- Attachment names are free text

---

### Sub-Scenario 3.3: Sub-Batch with 3-Department Workflow

**User Action:**
1. Admin creates sub-batch: "Simple Scarves"
2. Selects only 3 departments:
   - Cutting
   - Finishing
   - Packing
3. (Skips Stitching and Quality Check)

**System Behavior:**
```
POST /api/sub-batches/send-to-production
Body: {
  "sub_batch_id": 79,
  "department_ids": [1, 3, 5]
}

Response: {
  "department_sub_batches": [
    { id: 410, department_id: 1, is_current: true },
    { id: 411, department_id: 3, is_current: false },
    { id: 412, department_id: 5, is_current: false }
  ]
}
```

**Data Created:**
- Only 3 department_sub_batches records (not 5)
- Workflow: Cutting → Finishing → Packing

**Production Flow:**
- After Cutting completes, advances to Finishing (skips Stitching)
- After Finishing completes, advances to Packing (skips QC)

**Key Point:**
- Flexible workflow (not all departments required)
- Order matters (selected sequence is followed)

---

## Scenario 4: Monitoring Production View

### Sub-Scenario 4.1: Admin Clicks Card to View Details

**User Action:**
1. Admin in Production View
2. Sees card "Blue T-Shirts Order #500" in Stitching column
3. Clicks on card

**Modal Opens Showing:**
```
┌─────────────────────────────────────────────────────────────┐
│ Task Details - Blue T-Shirts Order #500                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Sub-Batch Information:                                      │
│ ├─ Name: Blue T-Shirts Order #500                          │
│ ├─ Start Date: 2081/08/10                                  │
│ ├─ Due Date: 2081/08/25                                    │
│ ├─ Estimated Pieces: 500                                   │
│ ├─ Expected Items: 500                                     │
│                                                             │
│ Size Details:                                               │
│ ├─ XL: 100 pieces                                          │
│ ├─ L: 150 pieces                                           │
│ ├─ M: 200 pieces                                           │
│ └─ S: 50 pieces                                            │
│                                                             │
│ Attachments:                                                │
│ ├─ Buttons: 500                                            │
│ ├─ Labels: 500                                             │
│ └─ Thread Spools: 10                                       │
│                                                             │
│ Department Route:                                           │
│ Cutting ✓ → Stitching (current) → Finishing → QC → Packing │
│                                                             │
│ Current Department: Stitching                               │
│ Quantity Received: 500                                      │
│ Quantity Remaining: 350                                     │
│ Quantity Assigned: 150                                      │
│                                                             │
│ Worker Logs:                                                │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Worker      │ Date    │ Quantity │ Price │ Billable │  │
│ ├─────────────┼─────────┼──────────┼───────┼──────────┤  │
│ │ Hari Prasad │ 08/13   │ 100      │ 3.00  │ Yes      │  │
│ │ Maya Devi   │ 08/13   │ 50       │ 3.00  │ Yes      │  │
│ └─────────────┴─────────┴──────────┴───────┴──────────┘  │
│                                                             │
│ [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

**System Behavior:**
```
GET /api/admin/production/task-details/402

Response: {
  "department_sub_batch_id": 402,
  "sub_batch": {
    "id": 78,
    "name": "Blue T-Shirts Order #500",
    "start_date": "2081-08-10",
    "due_date": "2081-08-25",
    "estimated_pieces": 500,
    "size_details": [...],
    "attachments": [...]
  },
  "quantity_received": 500,
  "quantity_remaining": 350,
  "quantity_assigned": 150,
  "worker_logs": [
    {
      "worker": { "name": "Hari Prasad" },
      "work_date": "2081-08-13",
      "quantity_worked": 100,
      "unit_price": 3.00,
      "is_billable": true
    },
    {
      "worker": { "name": "Maya Devi" },
      "work_date": "2081-08-13",
      "quantity_worked": 50,
      "unit_price": 3.00,
      "is_billable": true
    }
  ],
  "department_route": [
    { "name": "Cutting", "completed": true },
    { "name": "Stitching", "current": true },
    { "name": "Finishing", "upcoming": true },
    { "name": "Quality Check", "upcoming": true },
    { "name": "Packing", "upcoming": true }
  ]
}
```

**Admin Can See:**
- Complete sub-batch details
- All size categories and quantities
- All attachments
- Full department route with progress
- Current department
- Quantities (received, remaining, assigned)
- All worker assignments
- Worker productivity

**Admin Actions Available:**
- View only (cannot edit from Admin view)
- Close modal
- (Some implementations allow admin to assign workers too)

---

### Sub-Scenario 4.2: Identifying Bottlenecks

**User Action:**
1. Admin in Production View
2. Scans across all departments

**What Admin Sees:**
```
┌─────────┬─────────┬─────────┬──────────────┬─────────┐
│ Cutting │Stitching│Finishing│Quality Check │ Packing │
├─────────┼─────────┼─────────┼──────────────┼─────────┤
│         │         │         │              │         │
│ 2 cards │ 8 cards │ 1 card  │ 0 cards      │ 1 card  │
│         │         │         │              │         │
└─────────┴─────────┴─────────┴──────────────┴─────────┘
```

**Admin's Analysis:**
- **Bottleneck Identified:** Stitching department has 8 tasks
- **Root Cause:** Tasks backing up in Stitching
- **Action Items:**
  - Check if Stitching needs more workers
  - Check if tasks are taking longer than expected
  - Consider reassigning workers from other departments

**Admin Actions:**
1. Clicks on multiple Stitching cards
2. Reviews worker logs
3. Identifies slow workers or complex tasks
4. Discusses with Stitching supervisor

**Key Benefit:**
- Visual representation makes bottlenecks obvious
- Admin can proactively address issues

---

## Scenario 5: Handling Rejected Items

### Complete Rejection Workflow from Admin's Perspective

**Initial State:**
- Sub-batch "Blue T-Shirts Order #500" (ID: 78)
- Currently in Stitching department (department_sub_batch_id: 402)
- Quantity received: 500
- Workers assigned: 150 pieces
- Remaining: 350 pieces

---

### Step 1: Stitching Supervisor Finds Defects

**What Happens (Supervisor's Action):**
1. Supervisor reviews stitched items
2. Finds 20 pieces have wrong seam alignment
3. Opens task details modal
4. Clicks "Reject Items" button
5. Fills reject modal:
   - Reason: "Seam alignment incorrect - cutting issue"
   - Quantity: 20
   - Send to Department: "Cutting"
6. Clicks "Submit Rejection"

**System Behavior:**
```
POST /api/department-sub-batches/reject
Body: {
  "department_sub_batch_id": 402,
  "reject_reason": "Seam alignment incorrect - cutting issue",
  "reject_quantity": 20,
  "send_to_department_id": 1,
  "sub_batch_id": 78,
  "source_department_id": 2
}

Response: {
  "message": "Items rejected successfully",
  "new_department_sub_batch": {
    "id": 420,
    "department_id": 1,
    "sub_batch_id": 78,
    "stage": "NEW_ARRIVAL",
    "is_current": true,
    "quantity_received": 20,
    "quantity_remaining": 20,
    "remarks": "Rejected",
    "reject_reason": "Seam alignment incorrect - cutting issue",
    "rejection_source": {
      "department_id": 2,
      "department_name": "Stitching",
      "rejected_by": "Supervisor Sita Sharma",
      "rejected_at": "2025-11-21T12:00:00Z"
    }
  },
  "original_updated": {
    "id": 402,
    "quantity_remaining": 330
  }
}
```

**Data Created:**
- New record in `department_sub_batches` table:
  ```
  {
    id: 420,
    department_id: 1 (Cutting),
    sub_batch_id: 78,
    stage: "NEW_ARRIVAL",
    is_current: true,
    quantity_received: 20,
    quantity_remaining: 20,
    remarks: "Rejected",
    reject_reason: "Seam alignment incorrect - cutting issue",
    rejection_source_department_id: 2
  }
  ```

**Data Updated:**
- Original Stitching record (ID: 402):
  ```
  quantity_remaining: 350 → 330
  ```

---

### Step 2: Admin Views Production Board After Rejection

**What Admin Sees:**
```
┌─────────────────────┬─────────────────────┐
│ Cutting             │ Stitching           │
├─────────────────────┼─────────────────────┤
│ ┌─────────────────┐ │ ┌─────────────────┐ │
│ │ RED CARD        │ │ │ BLUE CARD       │ │
│ │ 🔴 REJECTED     │ │ │                 │ │
│ │                 │ │ │                 │ │
│ │ Blue T-Shirts   │ │ │ Blue T-Shirts   │ │
│ │ Order #500      │ │ │ Order #500      │ │
│ │                 │ │ │                 │ │
│ │ 20 pcs          │ │ │ 330 pcs remain  │ │
│ │                 │ │ │                 │ │
│ │ From: Stitching │ │ │                 │ │
│ │ Reason:         │ │ │                 │ │
│ │ Seam alignment  │ │ │                 │ │
│ │ incorrect       │ │ │                 │ │
│ └─────────────────┘ │ └─────────────────┘ │
└─────────────────────┴─────────────────────┘
```

**Card Details:**

**Cutting Column - RED CARD:**
- **Color:** Red (indicates rejection)
- **Badge:** "Rejected from Stitching"
- **Quantity:** 20 pieces
- **Source:** Shows "From: Stitching"
- **Reason:** Visible on card
- **Status:** Unassigned (needs rework)

**Stitching Column - Original Card:**
- **Quantity Updated:** Now shows 330 remaining (was 350)
- Everything else unchanged

---

### Step 3: Admin Clicks on Rejected Card

**Modal Shows:**
```
┌─────────────────────────────────────────────────────────────┐
│ Task Details - Blue T-Shirts Order #500 (REJECTED)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️  REJECTED ITEMS                                         │
│                                                             │
│ Rejection Details:                                          │
│ ├─ Rejected From: Stitching Department                     │
│ ├─ Rejected By: Sita Sharma                                │
│ ├─ Rejected At: 2081/08/13 11:45 AM                       │
│ ├─ Reason: Seam alignment incorrect - cutting issue        │
│ └─ Quantity: 20 pieces                                     │
│                                                             │
│ Current Status:                                             │
│ ├─ Current Department: Cutting                             │
│ ├─ Quantity Remaining: 20                                  │
│ └─ Status: Awaiting rework                                 │
│                                                             │
│ Sub-Batch Information:                                      │
│ ├─ Name: Blue T-Shirts Order #500                          │
│ ├─ Original Estimated: 500 pieces                          │
│ └─ Size Details: XL(100), L(150), M(200), S(50)           │
│                                                             │
│ Worker Logs: (empty - no rework assigned yet)              │
│                                                             │
│ [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

**System Behavior:**
```
GET /api/admin/production/task-details/420

Response: {
  "department_sub_batch_id": 420,
  "remarks": "Rejected",
  "reject_reason": "Seam alignment incorrect - cutting issue",
  "rejection_source": {
    "department_id": 2,
    "department_name": "Stitching",
    "rejected_by": "Sita Sharma",
    "rejected_at": "2025-11-21T12:00:00Z"
  },
  "quantity_received": 20,
  "quantity_remaining": 20,
  "sub_batch": {
    "id": 78,
    "name": "Blue T-Shirts Order #500",
    ...
  },
  "worker_logs": []
}
```

**Admin's Understanding:**
- 20 pieces were rejected by Stitching
- Reason: Cutting quality issue
- Currently in Cutting for rework
- No workers assigned yet for rework
- Cutting supervisor needs to fix and resend

---

### Step 4: Cutting Supervisor Reworks Rejected Items

**What Happens:**
1. Cutting supervisor sees red rejected card
2. Assigns worker "Ram Bahadur" to rework
3. Worker re-cuts 20 pieces
4. Supervisor assigns:
   - Worker: Ram Bahadur
   - Quantity: 20
   - Date: 2081/08/14
   - Unit price: 2.50 (slightly higher for rework)
   - Activity type: "REJECTED" (system tags this)
   - Billable: Yes

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "worker_id": 15,
  "sub_batch_id": 78,
  "department_id": 1,
  "department_sub_batch_id": 420,
  "work_date": "2081-08-14",
  "quantity_worked": 20,
  "unit_price": 2.50,
  "activity_type": "REJECTED",
  "is_billable": true
}

Response: {
  "id": 510,
  "activity_type": "REJECTED",
  ...
}
```

**Data Created:**
- Worker log with `activity_type: "REJECTED"`

**Data Updated:**
- department_sub_batches (ID: 420):
  ```
  assigned_worker_id: 15
  quantity_remaining: 0
  ```

**Red Card Changes:**
- Color: Red → Blue (assigned)
- Shows worker name
- Shows "Rework in progress"

---

### Step 5: Supervisor Advances Reworked Items Back to Stitching

**What Happens:**
1. Rework completed
2. Supervisor marks as completed
3. Clicks "Advance to Next Department"
4. Selects "Stitching" (send back to original department)
5. Quantity: 20
6. Clicks "Submit"

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 420,
  "next_department_id": 2,
  "quantity_advancing": 20,
  "sub_batch_id": 78
}

Response: {
  "message": "Advanced to Stitching",
  "current_updated": {
    "id": 420,
    "stage": "COMPLETED",
    "is_current": false
  },
  "next_created_or_updated": {
    "id": 402,
    "quantity_received": 520,
    "quantity_remaining": 350
  }
}
```

**Data Updated:**

**Cutting (ID: 420):**
- `stage`: "NEW_ARRIVAL" → "COMPLETED"
- `is_current`: true → false

**Stitching (ID: 402):**
- `quantity_received`: 500 → 520 (added 20 reworked)
- `quantity_remaining`: 330 → 350 (added 20 reworked)

---

### Step 6: Admin Sees Updated Production View

**What Admin Sees:**
```
┌─────────────────────┬─────────────────────┐
│ Cutting             │ Stitching           │
├─────────────────────┼─────────────────────┤
│                     │ ┌─────────────────┐ │
│ ✓ Rework Done       │ │ GRAY CARD       │ │
│                     │ │                 │ │
│                     │ │ Blue T-Shirts   │ │
│                     │ │ Order #500      │ │
│                     │ │                 │ │
│                     │ │ 350 pcs remain  │ │
│                     │ │ (520 received)  │ │
│                     │ │                 │ │
│                     │ └─────────────────┘ │
└─────────────────────┴─────────────────────┘
```

**Changes:**
- Red card disappeared from Cutting (completed)
- Stitching card updated: 350 remaining (includes 20 reworked)
- Total received in Stitching: 520 (500 original + 20 reworked)

**Key Understanding:**
- Rejected items cycled back through system
- Properly tracked as "REJECTED" activity type
- Wage calculation will show rework separately
- Quality metrics track rejection rate

---

### Step 7: Full Rejection Data Flow Summary

**Data Flow Diagram:**
```
[Original Flow]
Cutting (500 pcs) → Stitching (500 pcs received)
                         ↓
                    Find 20 defects
                         ↓

[Rejection Created]
Stitching: quantity_remaining 350 → 330
      ↓
      ↓ Create new department_sub_batch (ID: 420)
      ↓
Cutting: New RED card (20 pcs, "Rejected")
      ↓

[Rework]
Cutting: Assign worker (activity_type: "REJECTED")
      ↓
      Complete rework
      ↓

[Return to Stitching]
Cutting: Mark completed
      ↓
Stitching: quantity_received 500 → 520
          quantity_remaining 330 → 350
      ↓

[Final State]
Stitching: 350 pcs remaining (includes 20 reworked)
Total processed: 520 (500 original + 20 rejected & reworked)
```

**Database Records Created:**
1. `department_sub_batches` (ID: 420) - rejection record
2. `worker_logs` (ID: 510) - rework assignment
3. Possibly `rejection_entries` table for history

**Database Records Updated:**
1. `department_sub_batches` (ID: 402) - quantities updated
2. `department_sub_batches` (ID: 420) - status completed

---

## Scenario 6: Handling Altered Items

### Complete Alteration Workflow from Admin's Perspective

**Initial State:**
- Sub-batch "Blue T-Shirts Order #500" (ID: 78)
- Currently in Finishing department (department_sub_batch_id: 403)
- Quantity received: 500
- Workers assigned: 200 pieces
- Remaining: 300 pieces

---

### Step 1: Finishing Supervisor Identifies Items Needing Alteration

**What Happens:**
1. Supervisor reviews finished items
2. Finds 15 pieces need collar adjustment (not defective, just needs modification)
3. Opens task details modal
4. Clicks "Alteration Items" button
5. Fills alteration modal:
   - Reason: "Collar needs tightening for better fit"
   - Quantity: 15
   - Send to Department: "Stitching" (alterations done in stitching)
6. Clicks "Submit Alteration"

**System Behavior:**
```
POST /api/department-sub-batches/alteration
Body: {
  "department_sub_batch_id": 403,
  "alter_reason": "Collar needs tightening for better fit",
  "alter_quantity": 15,
  "send_to_department_id": 2,
  "sub_batch_id": 78,
  "source_department_id": 3
}

Response: {
  "message": "Items sent for alteration",
  "new_department_sub_batch": {
    "id": 425,
    "department_id": 2,
    "sub_batch_id": 78,
    "stage": "NEW_ARRIVAL",
    "is_current": true,
    "quantity_received": 15,
    "quantity_remaining": 15,
    "remarks": "Altered",
    "alter_reason": "Collar needs tightening for better fit",
    "alteration_source": {
      "department_id": 3,
      "department_name": "Finishing",
      "altered_by": "Supervisor Maya Thapa",
      "altered_at": "2025-11-21T13:00:00Z"
    }
  },
  "original_updated": {
    "id": 403,
    "quantity_remaining": 285
  }
}
```

**Data Created:**
- New record in `department_sub_batches` table:
  ```
  {
    id: 425,
    department_id: 2 (Stitching),
    sub_batch_id: 78,
    stage: "NEW_ARRIVAL",
    is_current: true,
    quantity_received: 15,
    quantity_remaining: 15,
    remarks: "Altered",
    alter_reason: "Collar needs tightening for better fit",
    alteration_source_department_id: 3
  }
  ```

**Data Updated:**
- Finishing record (ID: 403):
  ```
  quantity_remaining: 300 → 285
  ```

---

### Step 2: Admin Views Production Board After Alteration

**What Admin Sees:**
```
┌─────────────────────┬─────────────────────┐
│ Stitching           │ Finishing           │
├─────────────────────┼─────────────────────┤
│ ┌─────────────────┐ │ ┌─────────────────┐ │
│ │ YELLOW CARD     │ │ │ BLUE CARD       │ │
│ │ 🟡 ALTERED      │ │ │                 │ │
│ │                 │ │ │                 │ │
│ │ Blue T-Shirts   │ │ │ Blue T-Shirts   │ │
│ │ Order #500      │ │ │ Order #500      │ │
│ │                 │ │ │                 │ │
│ │ 15 pcs          │ │ │ 285 pcs remain  │ │
│ │                 │ │ │                 │ │
│ │ From: Finishing │ │ │                 │ │
│ │ Reason:         │ │ │                 │ │
│ │ Collar needs    │ │ │                 │ │
│ │ tightening      │ │ │                 │ │
│ └─────────────────┘ │ └─────────────────┘ │
└─────────────────────┴─────────────────────┘
```

**Card Details:**

**Stitching Column - YELLOW CARD:**
- **Color:** Yellow (indicates alteration)
- **Badge:** "Altered from Finishing"
- **Quantity:** 15 pieces
- **Source:** Shows "From: Finishing"
- **Reason:** Visible on card
- **Status:** Unassigned (needs alteration work)

**Finishing Column - Original Card:**
- **Quantity Updated:** Now shows 285 remaining (was 300)

---

### Step 3: Admin Clicks on Altered Card

**Modal Shows:**
```
┌─────────────────────────────────────────────────────────────┐
│ Task Details - Blue T-Shirts Order #500 (ALTERED)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️  ITEMS FOR ALTERATION                                   │
│                                                             │
│ Alteration Details:                                         │
│ ├─ Sent From: Finishing Department                         │
│ ├─ Sent By: Maya Thapa                                     │
│ ├─ Sent At: 2081/08/14 02:30 PM                           │
│ ├─ Reason: Collar needs tightening for better fit          │
│ └─ Quantity: 15 pieces                                     │
│                                                             │
│ Current Status:                                             │
│ ├─ Current Department: Stitching                           │
│ ├─ Quantity Remaining: 15                                  │
│ └─ Status: Awaiting alteration work                        │
│                                                             │
│ Sub-Batch Information:                                      │
│ ├─ Name: Blue T-Shirts Order #500                          │
│ ├─ Original Estimated: 500 pieces                          │
│ └─ Size Details: XL(100), L(150), M(200), S(50)           │
│                                                             │
│ Worker Logs: (empty - no alteration work assigned yet)     │
│                                                             │
│ [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

**Admin's Understanding:**
- 15 pieces need collar tightening
- Sent from Finishing to Stitching
- Not defective, just needs adjustment
- Stitching supervisor needs to assign worker

---

### Step 4: Stitching Supervisor Performs Alteration

**What Happens:**
1. Stitching supervisor sees yellow altered card
2. Assigns worker "Hari Prasad" for alteration work
3. Worker adjusts collars on 15 pieces
4. Supervisor assigns:
   - Worker: Hari Prasad
   - Quantity: 15
   - Date: 2081/08/15
   - Unit price: 2.00 (alteration rate)
   - Activity type: "ALTERED" (system tags this)
   - Billable: Yes

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "worker_id": 18,
  "sub_batch_id": 78,
  "department_id": 2,
  "department_sub_batch_id": 425,
  "work_date": "2081-08-15",
  "quantity_worked": 15,
  "unit_price": 2.00,
  "activity_type": "ALTERED",
  "is_billable": true
}

Response: {
  "id": 515,
  "activity_type": "ALTERED",
  ...
}
```

**Data Created:**
- Worker log with `activity_type: "ALTERED"`

**Data Updated:**
- department_sub_batches (ID: 425):
  ```
  assigned_worker_id: 18
  quantity_remaining: 0
  ```

**Yellow Card Changes:**
- Color: Yellow → Blue (assigned)
- Shows worker name
- Shows "Alteration in progress"

---

### Step 5: Supervisor Advances Altered Items Back to Finishing

**What Happens:**
1. Alteration completed
2. Supervisor marks as completed
3. Clicks "Advance to Next Department"
4. Selects "Finishing" (send back to continue normal flow)
5. Quantity: 15
6. Clicks "Submit"

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 425,
  "next_department_id": 3,
  "quantity_advancing": 15,
  "sub_batch_id": 78
}

Response: {
  "message": "Advanced to Finishing",
  "current_updated": {
    "id": 425,
    "stage": "COMPLETED",
    "is_current": false
  },
  "next_updated": {
    "id": 403,
    "quantity_received": 515,
    "quantity_remaining": 300
  }
}
```

**Data Updated:**

**Stitching (ID: 425):**
- `stage`: "NEW_ARRIVAL" → "COMPLETED"
- `is_current`: true → false

**Finishing (ID: 403):**
- `quantity_received`: 500 → 515 (added 15 altered)
- `quantity_remaining`: 285 → 300 (added 15 altered)

---

### Step 6: Admin Sees Updated Production View

**What Admin Sees:**
```
┌─────────────────────┬─────────────────────┐
│ Stitching           │ Finishing           │
├─────────────────────┼─────────────────────┤
│                     │ ┌─────────────────┐ │
│ ✓ Alteration Done   │ │ GRAY CARD       │ │
│                     │ │                 │ │
│                     │ │ Blue T-Shirts   │ │
│                     │ │ Order #500      │ │
│                     │ │                 │ │
│                     │ │ 300 pcs remain  │ │
│                     │ │ (515 received)  │ │
│                     │ │                 │ │
│                     │ └─────────────────┘ │
└─────────────────────┴─────────────────────┘
```

**Changes:**
- Yellow card disappeared from Stitching (completed)
- Finishing card updated: 300 remaining (includes 15 altered)
- Total received in Finishing: 515 (500 original + 15 altered)

---

### Key Differences: Rejection vs Alteration

**Rejection (Red Card):**
- **Reason:** Defective, needs complete rework
- **Card Color:** Red 🔴
- **Typical Flow:** Send back to earlier department
- **Activity Type:** "REJECTED"
- **Example:** Wrong cut, damaged fabric, incorrect stitching
- **Worker Rate:** Often same or slightly higher

**Alteration (Yellow Card):**
- **Reason:** Needs modification/adjustment, not defective
- **Card Color:** Yellow 🟡
- **Typical Flow:** Send to specific department for modification
- **Activity Type:** "ALTERED"
- **Example:** Adjust fit, modify design, add extra stitching
- **Worker Rate:** Can be different rate for alteration work

**Both Track:**
- Source department
- Reason
- Quantity
- Separate worker logs
- Return path through workflow

---

## Scenario 7: Calculating Worker Wages

### Complete Wage Calculation from Admin's Perspective

**Scenario Setup:**
- Worker: "Ram Bahadur" (ID: 15)
- Department: Cutting
- Wage Type: PIECE_RATE
- Wage Rate: NPR 2.00 per piece
- Date Range: 2081/08/10 to 2081/08/20

---

### Step 1: Admin Opens Wage Calculation View

**User Action:**
1. Admin navigates to Dashboard
2. Clicks "Wage Calculation" in sidebar
3. Wage Calculation view opens

**UI Shows:**
```
┌─────────────────────────────────────────────────────────┐
│ Wage Calculation                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Select Worker: [Dropdown]                              │
│                                                         │
│ Start Date: [Nepali Date Picker]                       │
│                                                         │
│ End Date: [Nepali Date Picker]                         │
│                                                         │
│ [Calculate Wages]                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Step 2: Admin Selects Worker and Date Range

**User Action:**
1. Clicks "Select Worker" dropdown
2. Dropdown shows all workers:
   - Ram Bahadur (Cutting)
   - Sita Kumari (Cutting)
   - Hari Prasad (Stitching)
   - Maya Devi (Stitching)
   - ... (all workers listed)
3. Selects "Ram Bahadur"
4. Clicks "Start Date" picker
5. Selects: 2081/08/10
6. Clicks "End Date" picker
7. Selects: 2081/08/20
8. Clicks "Calculate Wages" button

---

### Step 3: System Fetches Worker Logs

**System Behavior:**
```
GET /api/wages/worker/15?start_date=2081-08-10&end_date=2081-08-20

Response: {
  "worker": {
    "id": 15,
    "name": "Ram Bahadur",
    "department": "Cutting",
    "wage_type": "PIECE_RATE",
    "wage_rate": 2.00
  },
  "logs": [
    {
      "id": 501,
      "work_date": "2081-08-12",
      "sub_batch_name": "Blue T-Shirts Order #500",
      "size_category": "M",
      "quantity_worked": 250,
      "unit_price": 2.00,
      "total_amount": 500.00,
      "is_billable": true,
      "activity_type": "NORMAL"
    },
    {
      "id": 503,
      "work_date": "2081-08-13",
      "sub_batch_name": "Red Shirts Order #200",
      "size_category": "L",
      "quantity_worked": 100,
      "unit_price": 2.00,
      "total_amount": 200.00,
      "is_billable": true,
      "activity_type": "NORMAL"
    },
    {
      "id": 510,
      "work_date": "2081-08-14",
      "sub_batch_name": "Blue T-Shirts Order #500",
      "size_category": "M",
      "quantity_worked": 20,
      "unit_price": 2.50,
      "total_amount": 50.00,
      "is_billable": true,
      "activity_type": "REJECTED"
    },
    {
      "id": 512,
      "work_date": "2081-08-15",
      "sub_batch_name": "Yellow Jackets Order #100",
      "size_category": "XL",
      "quantity_worked": 50,
      "unit_price": 2.00,
      "total_amount": 100.00,
      "is_billable": false,
      "activity_type": "NORMAL"
    },
    {
      "id": 514,
      "work_date": "2081-08-17",
      "sub_batch_name": "Green Pants Order #300",
      "size_category": "L",
      "quantity_worked": 150,
      "unit_price": 2.00,
      "total_amount": 300.00,
      "is_billable": true,
      "activity_type": "NORMAL"
    }
  ],
  "summary": {
    "total_quantity": 570,
    "total_amount_all": 1150.00,
    "total_amount_billable": 1050.00,
    "billable_count": 4,
    "non_billable_count": 1
  }
}
```

---

### Step 4: Admin Views Wage Calculation Table

**UI Shows:**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Wage Calculation for Ram Bahadur                                                      │
│ Department: Cutting | Wage Type: PIECE_RATE | Period: 2081/08/10 - 2081/08/20       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│ Filter: [x] Show Billable Only  [ ] Show All                                         │
│                                                                                        │
│ ┌────────┬──────┬───────────────────────┬─────────┬──────┬────────┬──────────┬─────┐ │
│ │ Date   │ Size │ Particulars           │ Quantity│ Rate │ Total  │ Billable │Type │ │
│ ├────────┼──────┼───────────────────────┼─────────┼──────┼────────┼──────────┼─────┤ │
│ │08/12   │ M    │Blue T-Shirts Order#500│   250   │ 2.00 │ 500.00 │    ✓     │NORM │ │
│ │08/13   │ L    │Red Shirts Order #200  │   100   │ 2.00 │ 200.00 │    ✓     │NORM │ │
│ │08/14   │ M    │Blue T-Shirts Order#500│    20   │ 2.50 │  50.00 │    ✓     │REJ  │ │
│ │08/15   │ XL   │Yellow Jackets #100    │    50   │ 2.00 │ 100.00 │    ✗     │NORM │ │
│ │08/17   │ L    │Green Pants Order #300 │   150   │ 2.00 │ 300.00 │    ✓     │NORM │ │
│ └────────┴──────┴───────────────────────┴─────────┴──────┴────────┴──────────┴─────┘ │
│                                                                                        │
│ Summary:                                                                               │
│ ├─ Total Pieces Worked: 570                                                          │
│ ├─ Total Amount (All): NPR 1,150.00                                                  │
│ └─ Total Amount (Billable Only): NPR 1,050.00                                        │
│                                                                                        │
│ [Export to CSV] [Print]                                                               │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Table Columns Explained:**

1. **Date:** Work date (Nepali calendar)
2. **Size:** Size category worked on
3. **Particulars:** Sub-batch name
4. **Quantity:** Pieces worked
5. **Rate:** Unit price per piece
6. **Total:** Quantity × Rate (auto-calculated)
7. **Billable:** Checkmark if billable
8. **Type:** NORM (Normal), REJ (Rejected rework), ALT (Alteration)

---

### Step 5: Admin Filters for Billable Only

**User Action:**
1. Admin clicks "Show Billable Only" checkbox

**UI Updates:**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Wage Calculation for Ram Bahadur (BILLABLE ONLY)                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│ Filter: [x] Show Billable Only  [ ] Show All                                         │
│                                                                                        │
│ ┌────────┬──────┬───────────────────────┬─────────┬──────┬────────┬──────────┬─────┐ │
│ │ Date   │ Size │ Particulars           │ Quantity│ Rate │ Total  │ Billable │Type │ │
│ ├────────┼──────┼───────────────────────┼─────────┼──────┼────────┼──────────┼─────┤ │
│ │08/12   │ M    │Blue T-Shirts Order#500│   250   │ 2.00 │ 500.00 │    ✓     │NORM │ │
│ │08/13   │ L    │Red Shirts Order #200  │   100   │ 2.00 │ 200.00 │    ✓     │NORM │ │
│ │08/14   │ M    │Blue T-Shirts Order#500│    20   │ 2.50 │  50.00 │    ✓     │REJ  │ │
│ │08/17   │ L    │Green Pants Order #300 │   150   │ 2.00 │ 300.00 │    ✓     │NORM │ │
│ └────────┴──────┴───────────────────────┴─────────┴──────┴────────┴──────────┴─────┘ │
│                                                                                        │
│ Summary (Billable):                                                                    │
│ ├─ Total Pieces Worked: 520                                                          │
│ └─ Total Payable Amount: NPR 1,050.00                                                │
│                                                                                        │
│ [Export to CSV] [Print] [Process Payment]                                            │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Changes:**
- Row for 08/15 (Yellow Jackets, non-billable) is hidden
- Summary shows only billable totals
- Total: NPR 1,050.00 (for payroll)

---

### Step 6: Understanding Activity Types in Wages

**Admin's Analysis:**

**Normal Work (NORM):**
- Regular production work
- Standard rate: NPR 2.00 per piece
- 3 entries totaling 500 pieces = NPR 1,000

**Rejected Rework (REJ):**
- Rework on rejected items
- Higher rate: NPR 2.50 per piece (premium for fixing errors)
- 1 entry: 20 pieces = NPR 50

**Why Track Separately:**
- Admin can see how much is rework vs normal production
- Can identify quality issues
- Can adjust pricing for rework
- Can track worker efficiency

**Billable vs Non-Billable:**
- **Billable:** Work charged to client / included in payroll
- **Non-Billable:** Training, samples, personal projects
- Admin only pays for billable work

---

### Step 7: Admin Edits Unit Price (If Needed)

**User Action:**
1. Admin notices 08/14 entry has wrong unit price
2. Should be NPR 2.00, not 2.50
3. Clicks on the "Rate" cell for that row
4. Cell becomes editable
5. Changes 2.50 to 2.00
6. Presses Enter

**System Behavior:**
```
PUT /api/worker-logs/510
Body: {
  "unit_price": 2.00
}

Response: {
  "id": 510,
  "unit_price": 2.00,
  ...
}
```

**Data Updated:**
- `worker_logs` table (ID: 510): unit_price 2.50 → 2.00

**UI Updates:**
- Total for that row: 50.00 → 40.00 (20 × 2.00)
- Grand Total: 1,050.00 → 1,040.00

**Admin Can Edit:**
- Unit price
- Billable status
- (Some implementations allow editing quantity and date too)

---

### Step 8: Wage Calculation State Summary

**Final Database State:**
```
worker_logs table (for Ram Bahadur, date range):
  {
    id: 501,
    work_date: "2081-08-12",
    quantity_worked: 250,
    unit_price: 2.00,
    total: 500.00,
    is_billable: true,
    activity_type: "NORMAL"
  }
  {
    id: 503,
    work_date: "2081-08-13",
    quantity_worked: 100,
    unit_price: 2.00,
    total: 200.00,
    is_billable: true,
    activity_type: "NORMAL"
  }
  {
    id: 510,
    work_date: "2081-08-14",
    quantity_worked: 20,
    unit_price: 2.00,
    total: 40.00,
    is_billable: true,
    activity_type: "REJECTED"
  }
  {
    id: 512,
    work_date: "2081-08-15",
    quantity_worked: 50,
    unit_price: 2.00,
    total: 100.00,
    is_billable: false,
    activity_type: "NORMAL"
  }
  {
    id: 514,
    work_date: "2081-08-17",
    quantity_worked: 150,
    unit_price: 2.00,
    total: 300.00,
    is_billable: true,
    activity_type: "NORMAL"
  }
```

**Calculations:**
- **All Work:** 570 pieces = NPR 1,040.00
- **Billable Only:** 520 pieces = NPR 1,040.00
- **Non-Billable:** 50 pieces = NPR 0.00 (not paid)

**Admin Actions:**
- Review and approve
- Export for payroll processing
- Generate payment voucher
- Update payment status (if that feature exists)

---

## Scenario 8: Managing Inventory

### Complete Inventory Management Flow

**Scenario:** Admin manages buttons inventory for production

---

### Step 1: Creating Inventory Item

**User Action:**
1. Admin navigates to Inventory view
2. Clicks "Add Inventory" button
3. Fills form:
   - Name: "Buttons - White Round 15mm"
   - Unit: "Pieces"
   - Date: 2081/08/10
   - Quantity: 5000
   - Price: NPR 10000 (total purchase price)
   - Vendor: "XYZ Supplies"
   - Phone: "9841234567"
   - Remarks: "Initial stock purchase for winter collection"
4. Clicks "Save"

**System Behavior:**
```
POST /api/inventory
Body: {
  "name": "Buttons - White Round 15mm",
  "unit": "Pieces",
  "date": "2081-08-10",
  "quantity": 5000,
  "price": 10000,
  "vendor": "XYZ Supplies",
  "phone": "9841234567",
  "remarks": "Initial stock purchase for winter collection"
}

Response: {
  "id": 1,
  "inventory_id": "I001",
  "name": "Buttons - White Round 15mm",
  "unit": "Pieces",
  "current_quantity": 5000,
  "price": 10000,
  "vendor": "XYZ Supplies",
  "created_at": "2025-11-21T10:00:00Z"
}
```

**Data Created:**
- Record in `inventory_items` table (ID: 1, inventory_id: "I001")

**UI Shows:**
```
Inventory Table:
┌──────────┬──────────────────────────┬──────┬──────────┬──────────┬──────────────┐
│ ID       │ Name                     │ Unit │ Quantity │ Price    │ Vendor       │
├──────────┼──────────────────────────┼──────┼──────────┼──────────┼──────────────┤
│ I001     │ Buttons-White Round 15mm │ Pcs  │ 5000     │ 10000.00 │ XYZ Supplies │
└──────────┴──────────────────────────┴──────┴──────────┴──────────┴──────────────┘
```

---

### Step 2: Adding Stock to Inventory

**User Action:**
1. Admin receives new shipment of same buttons
2. Finds "Buttons - White Round 15mm" in table
3. Clicks three-dot menu (⋮)
4. Clicks "Add Stock"
5. Modal opens with form:
   - Current Quantity: 5000 (read-only, shown for reference)
   - Add Quantity: 3000
   - Date: 2081/08/15
   - Remarks: "Restock for ongoing orders"
6. Clicks "Add"

**System Behavior:**
```
POST /api/inventory/additions
Body: {
  "inventory_id": 1,
  "quantity": 3000,
  "date": "2081-08-15",
  "remarks": "Restock for ongoing orders"
}

Response: {
  "id": 10,
  "inventory_id": 1,
  "quantity_added": 3000,
  "date": "2081-08-15",
  "remarks": "Restock for ongoing orders",
  "created_at": "2025-11-21T11:00:00Z"
}

Then updates inventory:
PUT /api/inventory/1
{
  "current_quantity": 8000
}
```

**Data Created:**
- Record in `inventory_additions` table (ID: 10)

**Data Updated:**
- `inventory_items` table (ID: 1): current_quantity 5000 → 8000

**UI Updates:**
```
Inventory Table:
┌──────────┬──────────────────────────┬──────┬──────────┬──────────┬──────────────┐
│ ID       │ Name                     │ Unit │ Quantity │ Price    │ Vendor       │
├──────────┼──────────────────────────┼──────┼──────────┼──────────┼──────────────┤
│ I001     │ Buttons-White Round 15mm │ Pcs  │ 8000     │ 10000.00 │ XYZ Supplies │
│          │                          │      │ ↑ +3000  │          │              │
└──────────┴──────────────────────────┴──────┴──────────┴──────────┴──────────────┘
```

---

### Step 3: Subtracting Stock (Usage)

**User Action:**
1. Production uses buttons for "Blue T-Shirts Order"
2. Admin needs to deduct from inventory
3. Finds "Buttons - White Round 15mm" in table
4. Clicks three-dot menu (⋮)
5. Clicks "Subtract Stock"
6. Modal opens with form:
   - Current Quantity: 8000 (read-only)
   - Subtract Quantity: 500
   - Date: 2081/08/16
   - Purpose: "Used for Blue T-Shirts Order #500"
7. Clicks "Subtract"

**System Behavior:**
```
POST /api/inventory-subtraction
Body: {
  "inventory_id": 1,
  "quantity": 500,
  "date": "2081-08-16",
  "purpose": "Used for Blue T-Shirts Order #500"
}

Response: {
  "id": 20,
  "inventory_id": 1,
  "quantity_subtracted": 500,
  "date": "2081-08-16",
  "purpose": "Used for Blue T-Shirts Order #500",
  "created_at": "2025-11-21T12:00:00Z"
}

Then updates inventory:
PUT /api/inventory/1
{
  "current_quantity": 7500
}
```

**Data Created:**
- Record in `inventory_subtractions` table (ID: 20)

**Data Updated:**
- `inventory_items` table (ID: 1): current_quantity 8000 → 7500

**UI Updates:**
```
Inventory Table:
┌──────────┬──────────────────────────┬──────┬──────────┬──────────┬──────────────┐
│ ID       │ Name                     │ Unit │ Quantity │ Price    │ Vendor       │
├──────────┼──────────────────────────┼──────┼──────────┼──────────┼──────────────┤
│ I001     │ Buttons-White Round 15mm │ Pcs  │ 7500     │ 10000.00 │ XYZ Supplies │
│          │                          │      │ ↓ -500   │          │              │
└──────────┴──────────────────────────┴──────┴──────────┴──────────┴──────────────┘
```

---

### Step 4: Viewing Addition History

**User Action:**
1. Admin wants to see all stock additions
2. Clicks "Buttons - White Round 15mm" row
3. Clicks "View Additions"
4. Modal opens showing history

**Modal Shows:**
```
┌─────────────────────────────────────────────────────────────┐
│ Addition History - Buttons - White Round 15mm              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Current Stock: 7500 pieces                                  │
│                                                             │
│ ┌──────────┬──────────┬──────────────────────────┬────────┐│
│ │ Date     │ Quantity │ Remarks                  │ Action ││
│ ├──────────┼──────────┼──────────────────────────┼────────┤│
│ │ 08/10    │ 5000     │ Initial stock purchase   │ [Del]  ││
│ │ 08/15    │ 3000     │ Restock for ongoing order│ [Del]  ││
│ └──────────┴──────────┴──────────────────────────┴────────┘│
│                                                             │
│ Total Added: 8000 pieces                                    │
│                                                             │
│ [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

**System Behavior:**
```
GET /api/inventory/additions/inventory/1

Response: {
  "inventory_id": 1,
  "additions": [
    {
      "id": 1,
      "quantity_added": 5000,
      "date": "2081-08-10",
      "remarks": "Initial stock purchase for winter collection"
    },
    {
      "id": 10,
      "quantity_added": 3000,
      "date": "2081-08-15",
      "remarks": "Restock for ongoing orders"
    }
  ],
  "total_added": 8000
}
```

---

### Step 5: Viewing Subtraction History

**User Action:**
1. Admin clicks "View Subtractions"

**Modal Shows:**
```
┌─────────────────────────────────────────────────────────────┐
│ Subtraction History - Buttons - White Round 15mm           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Current Stock: 7500 pieces                                  │
│                                                             │
│ ┌──────────┬──────────┬────────────────────────┬─────────┐ │
│ │ Date     │ Quantity │ Purpose                │ Action  │ │
│ ├──────────┼──────────┼────────────────────────┼─────────┤ │
│ │ 08/16    │ 500      │ Blue T-Shirts Order#500│ [Del]   │ │
│ └──────────┴──────────┴────────────────────────┴─────────┘ │
│                                                             │
│ Total Subtracted: 500 pieces                                │
│                                                             │
│ [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

**System Behavior:**
```
GET /api/inventory-subtraction/inventory/1

Response: {
  "inventory_id": 1,
  "subtractions": [
    {
      "id": 20,
      "quantity_subtracted": 500,
      "date": "2081-08-16",
      "purpose": "Used for Blue T-Shirts Order #500"
    }
  ],
  "total_subtracted": 500
}
```

---

### Step 6: Inventory State Summary

**Complete Inventory Flow:**
```
Initial Purchase:  5000 pieces (08/10)
    ↓
Addition:         +3000 pieces (08/15)
    ↓
Total:             8000 pieces
    ↓
Subtraction:       -500 pieces (08/16)
    ↓
Current:           7500 pieces
```

**Database State:**
```
inventory_items table:
  {
    id: 1,
    inventory_id: "I001",
    name: "Buttons - White Round 15mm",
    current_quantity: 7500,
    initial_quantity: 5000
  }

inventory_additions table:
  { id: 1, inventory_id: 1, quantity_added: 5000, date: "08/10" }
  { id: 10, inventory_id: 1, quantity_added: 3000, date: "08/15" }

inventory_subtractions table:
  { id: 20, inventory_id: 1, quantity_subtracted: 500, date: "08/16" }
```

**Admin Benefits:**
- Complete stock visibility
- Historical tracking
- Usage patterns
- Reorder point identification

---

## Scenario 9: Setting Up Departments & Supervisors

### Complete Department and Supervisor Setup

---

### Step 1: Admin Creates Department

**User Action:**
1. Admin navigates to Settings → Department
2. Clicks "Create Department" button
3. Fills form:
   - Department Name: "Cutting"
   - Remarks: "Handles all fabric cutting operations"
4. Clicks "Save"

**System Behavior:**
```
POST /api/departments
Body: {
  "name": "Cutting",
  "remarks": "Handles all fabric cutting operations"
}

Response: {
  "id": 1,
  "name": "Cutting",
  "remarks": "Handles all fabric cutting operations",
  "supervisor_id": null,
  "created_at": "2025-11-21T09:00:00Z"
}
```

**Data Created:**
- Record in `departments` table (ID: 1)
- No supervisor assigned yet

**UI Shows:**
```
Departments Table:
┌────┬──────────┬────────────┬─────────────────────────────┐
│ ID │ Name     │ Supervisor │ Remarks                     │
├────┼──────────┼────────────┼─────────────────────────────┤
│ 1  │ Cutting  │ Unassigned │ Handles all fabric cutting  │
└────┴──────────┴────────────┴─────────────────────────────┘
```

---

### Step 2: Admin Creates Multiple Departments

**User Action:**
1. Creates 4 more departments:
   - "Stitching" - Handles garment stitching
   - "Finishing" - Ironing, final touches
   - "Quality Check" - Inspection and QC
   - "Packing" - Packaging and labeling

**System Behavior:**
```
5 POST requests to /api/departments

Final State:
  { id: 1, name: "Cutting" }
  { id: 2, name: "Stitching" }
  { id: 3, name: "Finishing" }
  { id: 4, name: "Quality Check" }
  { id: 5, name: "Packing" }
```

---

### Step 3: Admin Creates Supervisor Account

**User Action:**
1. Admin navigates to Settings → Supervisor
2. Clicks "Create Supervisor" button
3. Fills form:
   - Name: "Sita Sharma"
   - Email: "sita.sharma@blueshark.com"
   - Password: "SecurePass123!"
   - Department: Select "Stitching" from dropdown
4. Clicks "Save"

**System Behavior:**
```
POST /supervisors
Body: {
  "name": "Sita Sharma",
  "email": "sita.sharma@blueshark.com",
  "password": "SecurePass123!",
  "department_id": 2,
  "role": "SUPERVISOR"
}

Response: {
  "id": 101,
  "name": "Sita Sharma",
  "email": "sita.sharma@blueshark.com",
  "department_id": 2,
  "role": "SUPERVISOR",
  "created_at": "2025-11-21T09:30:00Z"
}

Then updates department:
PUT /api/departments/2
{
  "supervisor_id": 101
}
```

**Data Created:**
- Record in `supervisors` table (ID: 101)

**Data Updated:**
- `departments` table (ID: 2): supervisor_id: null → 101

**UI Updates:**
```
Supervisors Table:
┌─────┬─────────────┬──────────────────────────────┬────────────┐
│ ID  │ Name        │ Email                        │ Department │
├─────┼─────────────┼──────────────────────────────┼────────────┤
│ 101 │ Sita Sharma │ sita.sharma@blueshark.com    │ Stitching  │
└─────┴─────────────┴──────────────────────────────┴────────────┘

Departments Table:
┌────┬───────────┬──────────────┬──────────────────────────┐
│ ID │ Name      │ Supervisor   │ Remarks                  │
├────┼───────────┼──────────────┼──────────────────────────┤
│ 1  │ Cutting   │ Unassigned   │ ...                      │
│ 2  │ Stitching │ Sita Sharma  │ ...                      │
│ 3  │ Finishing │ Unassigned   │ ...                      │
└────┴───────────┴──────────────┴──────────────────────────┘
```

---

### Step 4: Supervisor Login Test

**User Action:**
1. Sita Sharma opens BlueShark app
2. Goes to /loginandsignup
3. Enters:
   - Email: sita.sharma@blueshark.com
   - Password: SecurePass123!
4. Clicks "Supervisor Login" button

**System Behavior:**
```
POST /api/auth/supervisor-login
Body: {
  "email": "sita.sharma@blueshark.com",
  "password": "SecurePass123!"
}

Response: {
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "supervisor": {
    "id": 101,
    "name": "Sita Sharma",
    "email": "sita.sharma@blueshark.com",
    "department_id": 2,
    "role": "SUPERVISOR"
  }
}
```

**Client-Side Storage:**
```javascript
localStorage.setItem("token", "eyJhbGciOiJIUzI1NiIs...");
localStorage.setItem("role", "SUPERVISOR");
localStorage.setItem("departmentId", "2");
```

**Navigation:**
- Redirects to `/SupervisorDashboard`
- Only sees Stitching department tasks
- Cannot access other departments

---

## Scenario 10: Worker Management

### Complete Worker Management Flow

---

### Step 1: Admin Creates Worker

**User Action:**
1. Admin navigates to Settings → Workers
2. Clicks "Add Worker" button
3. Fills form:
   - Name: "Ram Bahadur Tamang"
   - PAN: "123456789"
   - Address: "Bhaktapur, Nepal"
   - Department: Select "Cutting"
   - Wage Type: Select "PIECE_RATE"
   - Wage Rate: 2.00
4. Clicks "Save"

**System Behavior:**
```
POST /api/workers
Body: {
  "name": "Ram Bahadur Tamang",
  "pan": "123456789",
  "address": "Bhaktapur, Nepal",
  "department_id": 1,
  "wage_type": "PIECE_RATE",
  "wage_rate": 2.00
}

Response: {
  "id": 15,
  "name": "Ram Bahadur Tamang",
  "pan": "123456789",
  "address": "Bhaktapur, Nepal",
  "department_id": 1,
  "wage_type": "PIECE_RATE",
  "wage_rate": 2.00,
  "created_at": "2025-11-21T10:00:00Z"
}
```

**Data Created:**
- Record in `workers` table (ID: 15)

**UI Shows:**
```
Workers Table:
┌────┬─────────────────────┬───────────┬──────────────────┬────────────┬───────────┬──────┐
│ ID │ Name                │ PAN       │ Address          │ Department │ Wage Type │ Rate │
├────┼─────────────────────┼───────────┼──────────────────┼────────────┼───────────┼──────┤
│ 15 │ Ram Bahadur Tamang  │ 123456789 │ Bhaktapur, Nepal │ Cutting    │PIECE_RATE │ 2.00 │
└────┴─────────────────────┴───────────┴──────────────────┴────────────┴───────────┴──────┘
```

---

### Step 2: Worker Shows in Supervisor Dropdown

**Impact:**
- When Cutting Supervisor assigns workers, "Ram Bahadur Tamang" appears in dropdown
- Only shows workers from Cutting department
- Ready to be assigned to tasks

---

## Edge Cases & Special Scenarios

### Edge Case 1: Partial Advancement

**Scenario:**
- Sub-batch has 500 pieces in Cutting
- Only 300 pieces completed
- Supervisor advances only 300 to Stitching
- 200 pieces remain in Cutting

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 401,
  "next_department_id": 2,
  "quantity_advancing": 300,
  "sub_batch_id": 78
}

Response: {
  "current_updated": {
    "id": 401,
    "quantity_remaining": 200,
    "stage": "IN_PROGRESS"
  },
  "next_updated": {
    "id": 402,
    "quantity_received": 300,
    "quantity_remaining": 300
  }
}
```

**Result:**
- Cutting still has 200 pieces (card remains in Cutting column)
- Stitching receives 300 pieces (new card appears)
- Both cards for same sub-batch exist simultaneously

**Production View:**
```
┌─────────┬──────────┐
│ Cutting │ Stitching│
├─────────┼──────────┤
│ ┌─────┐ │ ┌──────┐ │
│ │ 200 │ │ │ 300  │ │
│ │ pcs │ │ │ pcs  │ │
│ └─────┘ │ └──────┘ │
└─────────┴──────────┘
```

---

### Edge Case 2: Over-Assignment Prevention

**Scenario:**
- Task has 100 pieces remaining
- Supervisor tries to assign 150 pieces

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "quantity_worked": 150,
  ...
}

Response: {
  "error": "Cannot assign 150 pieces. Only 100 pieces remaining.",
  "status": 400
}
```

**UI Shows:**
- Error alert
- Form doesn't submit
- Quantity field highlighted in red

---

### Edge Case 3: Deleting Sub-Batch in Production

**Scenario:**
- Admin tries to delete sub-batch that's already in production

**System Behavior:**
```
DELETE /api/sub-batches/78

Response: {
  "error": "Cannot delete sub-batch. It is currently in production.",
  "status": 400
}
```

**Prevention:**
- Can only delete sub-batches with status "DRAFT"
- Once sent to production, cannot delete

---

## Conclusion

This document provides complete admin-side scenarios showing:
- Every user action
- Exact system behavior
- API requests and responses
- Data creation and updates
- UI changes
- Complete data flow

Use this as reference for:
- Understanding workflows
- Development planning
- Testing scenarios
- User training
- Debugging issues
