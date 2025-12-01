# Supervisor User Stories - Complete Scenarios

## Table of Contents
1. [Introduction](#introduction)
2. [Supervisor Persona](#supervisor-persona)
3. [Scenario 1: Daily Workflow - Normal Production](#scenario-1-daily-workflow---normal-production)
4. [Scenario 2: Assigning Workers to Tasks](#scenario-2-assigning-workers-to-tasks)
5. [Scenario 3: Handling Rejections](#scenario-3-handling-rejections)
6. [Scenario 4: Handling Alterations](#scenario-4-handling-alterations)
7. [Scenario 5: Advancing Work to Next Department](#scenario-5-advancing-work-to-next-department)
8. [Scenario 6: Managing Worker Assignments](#scenario-6-managing-worker-assignments)
9. [Scenario 7: Handling Multiple Cards Simultaneously](#scenario-7-handling-multiple-cards-simultaneously)
10. [Scenario 8: Partial Work Completion](#scenario-8-partial-work-completion)
11. [Scenario 9: Receiving Rejected Items from Another Department](#scenario-9-receiving-rejected-items-from-another-department)
12. [Scenario 10: Receiving Altered Items from Another Department](#scenario-10-receiving-altered-items-from-another-department)
13. [Edge Cases & Special Scenarios](#edge-cases--special-scenarios)

---

## Introduction

This document provides **comprehensive step-by-step scenarios** for Supervisor users of the BlueShark Production system. Each scenario includes:
- Supervisor actions
- System behavior
- Card movements
- Data changes
- UI changes
- What records are created/updated
- Visual representations

**Key Difference from Admin:**
- Supervisors have **department-specific access only**
- Can only see and manage tasks in their assigned department
- Cannot create sub-batches or view other departments
- Focus on day-to-day task execution

---

## Supervisor Persona

**Name:** Sita Sharma
**Role:** Stitching Department Supervisor
**Age:** 32
**Department:** Stitching
**Experience:** 8 years in garment manufacturing
**Tech Skills:** Basic to Moderate (comfortable with mobile apps and simple web interfaces)
**Team Size:** 12 workers

**Goals:**
- Complete assigned tasks on time
- Maintain quality standards
- Manage team efficiently
- Track worker productivity
- Minimize rejections and rework

**Daily Tasks:**
- Check new arrivals (tasks from previous department)
- Assign workers to tasks
- Monitor work progress
- Handle quality issues (rejections/alterations)
- Advance completed work to next department
- Update task statuses

---

## Scenario 1: Daily Workflow - Normal Production

### Overview
Supervisor logs in, sees tasks in the kanban board, assigns workers, and manages workflow throughout the day.

---

### Step 1: Supervisor Logs In

**User Action:**
1. Sita Sharma opens BlueShark app
2. Goes to `/loginandsignup`
3. Enters credentials:
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
    "department_name": "Stitching",
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

---

### Step 2: Supervisor Views Department Kanban Board

**What Supervisor Sees:**
```
┌────────────────────────────────────────────────────────────────────────┐
│ Stitching Department Dashboard                                        │
│ Supervisor: Sita Sharma                                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ ┌───────────────┬────────────────────┬─────────────────────────────┐  │
│ │ NEW ARRIVALS  │   IN PROGRESS      │       COMPLETED             │  │
│ │ (Blue BG)     │   (Yellow BG)      │       (Green BG)            │  │
│ ├───────────────┼────────────────────┼─────────────────────────────┤  │
│ │               │                    │                             │  │
│ │ ┌───────────┐ │  ┌──────────────┐ │  ┌────────────────────────┐ │  │
│ │ │Gray Card  │ │  │ Blue Card    │ │  │ Green Card             │ │  │
│ │ │           │ │  │              │ │  │                        │ │  │
│ │ │Blue       │ │  │ Red Shirts   │ │  │ Yellow Jackets #100    │ │  │
│ │ │T-Shirts   │ │  │ Order #200   │ │  │                        │ │  │
│ │ │Order #500 │ │  │              │ │  │ Start: 08/01           │ │  │
│ │ │           │ │  │ 100 pcs      │ │  │ Due: 08/15             │ │  │
│ │ │Start:08/10│ │  │              │ │  │                        │ │  │
│ │ │Due: 08/25 │ │  │ Worker:      │ │  │ 50 pcs completed       │ │  │
│ │ │           │ │  │ Hari Prasad  │ │  │                        │ │  │
│ │ │500 pcs    │ │  │              │ │  │ ✓ Ready to advance     │ │  │
│ │ │           │ │  │ Remaining:   │ │  │                        │ │  │
│ │ │Main       │ │  │ 50 pcs       │ │  │                        │ │  │
│ │ │(Unassigned│ │  │              │ │  │                        │ │  │
│ │ │)          │ │  │              │ │  │                        │ │  │
│ │ └───────────┘ │  └──────────────┘ │  └────────────────────────┘ │  │
│ │               │                    │                             │  │
│ │               │  ┌──────────────┐ │                             │  │
│ │               │  │ Gray Card    │ │                             │  │
│ │               │  │              │ │                             │  │
│ │               │  │ Green Pants  │ │                             │  │
│ │               │  │ Order #300   │ │                             │  │
│ │               │  │              │ │                             │  │
│ │               │  │ 150 pcs      │ │                             │  │
│ │               │  │              │ │                             │  │
│ │               │  │ Main         │ │                             │  │
│ │               │  │ (Unassigned) │ │                             │  │
│ │               │  └──────────────┘ │                             │  │
│ │               │                    │                             │  │
│ └───────────────┴────────────────────┴─────────────────────────────┘  │
│                                                                        │
│ [Logout]                                                               │
└────────────────────────────────────────────────────────────────────────┘
```

**System Behavior:**
```
GET /supervisors/sub-batches?department_id=2

Response: {
  "department_id": 2,
  "department_name": "Stitching",
  "tasks": {
    "new_arrivals": [
      {
        "department_sub_batch_id": 402,
        "sub_batch": {
          "id": 78,
          "name": "Blue T-Shirts Order #500",
          "start_date": "2081-08-10",
          "due_date": "2081-08-25",
          "estimated_pieces": 500
        },
        "stage": "NEW_ARRIVAL",
        "quantity_received": 500,
        "quantity_remaining": 500,
        "assigned_worker_id": null,
        "remarks": "Main"
      }
    ],
    "in_progress": [
      {
        "department_sub_batch_id": 405,
        "sub_batch": {
          "id": 80,
          "name": "Red Shirts Order #200",
          "estimated_pieces": 100
        },
        "stage": "IN_PROGRESS",
        "quantity_remaining": 50,
        "assigned_worker_id": 18,
        "worker_name": "Hari Prasad"
      },
      {
        "department_sub_batch_id": 406,
        "sub_batch": {
          "id": 81,
          "name": "Green Pants Order #300",
          "estimated_pieces": 150
        },
        "stage": "IN_PROGRESS",
        "quantity_remaining": 150,
        "assigned_worker_id": null
      }
    ],
    "completed": [
      {
        "department_sub_batch_id": 404,
        "sub_batch": {
          "id": 79,
          "name": "Yellow Jackets Order #100",
          "estimated_pieces": 50
        },
        "stage": "COMPLETED",
        "quantity_remaining": 0
      }
    ]
  }
}
```

**Supervisor's Understanding:**
- **New Arrivals (1 task):** "Blue T-Shirts" - just received from Cutting, needs worker assignment
- **In Progress (2 tasks):**
  - "Red Shirts" - Hari Prasad working on it
  - "Green Pants" - Unassigned, needs worker
- **Completed (1 task):** "Yellow Jackets" - ready to send to next department

---

### Step 3: Supervisor Clicks on "Blue T-Shirts" Card

**User Action:**
1. Supervisor clicks on "Blue T-Shirts Order #500" card in New Arrivals

**Task Details Modal Opens:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Task Details - Blue T-Shirts Order #500                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [Sub-Batch Info] [Assign Worker] [Update Status] [Actions ▼]       │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ SUB-BATCH INFORMATION                                           │ │
│ │                                                                 │ │
│ │ Name: Blue T-Shirts Order #500                                  │ │
│ │ Start Date: 2081/08/10                                          │ │
│ │ Due Date: 2081/08/25                                            │ │
│ │ Estimated Pieces: 500                                           │ │
│ │ Expected Items: 500                                             │ │
│ │                                                                 │ │
│ │ Size Details:                                                   │ │
│ │ ├─ XL: 100 pieces                                              │ │
│ │ ├─ L: 150 pieces                                               │ │
│ │ ├─ M: 200 pieces                                               │ │
│ │ └─ S: 50 pieces                                                │ │
│ │                                                                 │ │
│ │ Attachments:                                                    │ │
│ │ ├─ Buttons: 500                                                │ │
│ │ ├─ Labels: 500                                                 │ │
│ │ └─ Thread Spools: 10                                           │ │
│ │                                                                 │ │
│ │ Department Route:                                               │ │
│ │ Cutting ✓ → Stitching (current) → Finishing → QC → Packing    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ CURRENT STATUS                                                  │ │
│ │                                                                 │ │
│ │ Department: Stitching                                           │ │
│ │ Stage: NEW_ARRIVAL                                              │ │
│ │ Quantity Received: 500                                          │ │
│ │ Quantity Remaining: 500                                         │ │
│ │ Quantity Assigned: 0                                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ WORKER LOGS                                                     │ │
│ │                                                                 │ │
│ │ No workers assigned yet                                         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ [Close] [Assign Worker] [Update Status]                            │
└─────────────────────────────────────────────────────────────────────┘
```

**System Behavior:**
```
GET /api/department-sub-batches/402

Response: {
  "department_sub_batch_id": 402,
  "department_id": 2,
  "stage": "NEW_ARRIVAL",
  "quantity_received": 500,
  "quantity_remaining": 500,
  "quantity_assigned": 0,
  "sub_batch": {
    "id": 78,
    "name": "Blue T-Shirts Order #500",
    "start_date": "2081-08-10",
    "due_date": "2081-08-25",
    "estimated_pieces": 500,
    "expected_items": 500,
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
    ]
  },
  "department_route": [
    { "name": "Cutting", "completed": true },
    { "name": "Stitching", "current": true },
    { "name": "Finishing", "upcoming": true },
    { "name": "Quality Check", "upcoming": true },
    { "name": "Packing", "upcoming": true }
  ],
  "worker_logs": []
}
```

**Supervisor Sees:**
- Complete sub-batch details
- All sizes and attachments needed
- Current status (500 pieces waiting)
- No workers assigned yet
- Department flow showing they're second step

---

## Scenario 2: Assigning Workers to Tasks

### Complete Worker Assignment Flow

**Continuing from previous scenario...**

---

### Step 1: Supervisor Clicks "Assign Worker" Button

**User Action:**
1. In task details modal, clicks "Assign Worker" button

**Assign Worker Modal Opens:**
```
┌──────────────────────────────────────────────────────┐
│ Assign Worker - Blue T-Shirts Order #500            │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Available Quantity: 500 pieces                       │
│                                                      │
│ Select Worker: [Dropdown ▼]                         │
│                                                      │
│ Quantity to Assign: [________]                      │
│                                                      │
│ Work Date: [Nepali Date Picker]                     │
│                                                      │
│ Unit Price (per piece): [________]                  │
│                                                      │
│ [ ] Billable                                        │
│                                                      │
│ [Cancel] [Assign]                                    │
└──────────────────────────────────────────────────────┘
```

---

### Step 2: Supervisor Fills Worker Assignment Form

**User Action:**
1. Clicks "Select Worker" dropdown

**Dropdown Shows:**
```
┌─────────────────────────────────┐
│ Select Worker                   │
├─────────────────────────────────┤
│ ○ Hari Prasad                   │
│ ○ Maya Devi                     │
│ ○ Krishna Bahadur               │
│ ○ Laxmi Thapa                   │
│ ○ Sunita Rai                    │
│ ○ Binod Chaudhary               │
│ ○ Kamala Shrestha               │
│ ○ Deepak Magar                  │
│ ... (all Stitching dept workers)│
└─────────────────────────────────┘
```

**System Behavior:**
```
GET /api/workers/department/2

Response: {
  "department_id": 2,
  "department_name": "Stitching",
  "workers": [
    { "id": 18, "name": "Hari Prasad", "wage_rate": 3.00 },
    { "id": 19, "name": "Maya Devi", "wage_rate": 3.00 },
    { "id": 20, "name": "Krishna Bahadur", "wage_rate": 2.50 },
    { "id": 21, "name": "Laxmi Thapa", "wage_rate": 3.50 },
    { "id": 22, "name": "Sunita Rai", "wage_rate": 3.00 },
    { "id": 23, "name": "Binod Chaudhary", "wage_rate": 2.50 },
    { "id": 24, "name": "Kamala Shrestha", "wage_rate": 3.00 },
    { "id": 25, "name": "Deepak Magar", "wage_rate": 2.50 }
  ]
}
```

**Important:** Only shows workers from Stitching department (ID: 2)

---

### Step 3: Supervisor Completes Form

**User Action:**
1. Selects "Hari Prasad" from dropdown
2. Enters Quantity: 250
3. Selects Work Date: 2081/08/13 (from Nepali calendar picker)
4. Unit Price auto-fills: 3.00 (from worker's wage rate)
5. Checks "Billable" checkbox
6. Clicks "Assign" button

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "worker_id": 18,
  "sub_batch_id": 78,
  "department_id": 2,
  "department_sub_batch_id": 402,
  "work_date": "2081-08-13",
  "quantity_worked": 250,
  "unit_price": 3.00,
  "activity_type": "NORMAL",
  "is_billable": true
}

Response: {
  "id": 520,
  "worker_id": 18,
  "worker_name": "Hari Prasad",
  "sub_batch_id": 78,
  "department_id": 2,
  "department_sub_batch_id": 402,
  "work_date": "2081-08-13",
  "quantity_worked": 250,
  "unit_price": 3.00,
  "total_amount": 750.00,
  "activity_type": "NORMAL",
  "is_billable": true,
  "created_at": "2025-11-21T11:30:00Z"
}

Then updates department_sub_batches:
PUT /api/department-sub-batches/402
{
  "assigned_worker_id": 18,
  "quantity_assigned": 250,
  "quantity_remaining": 250
}
```

**Data Created:**
- New record in `worker_logs` table (ID: 520)
  ```
  {
    id: 520,
    worker_id: 18,
    sub_batch_id: 78,
    department_id: 2,
    department_sub_batch_id: 402,
    quantity_worked: 250,
    unit_price: 3.00,
    work_date: "2081-08-13",
    activity_type: "NORMAL",
    is_billable: true
  }
  ```

**Data Updated:**
- `department_sub_batches` table (ID: 402):
  ```
  assigned_worker_id: null → 18
  quantity_assigned: 0 → 250
  quantity_remaining: 500 → 250
  ```

---

### Step 4: Modal Closes, UI Updates

**Assign Worker Modal Closes**

**Task Details Modal Updates:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Task Details - Blue T-Shirts Order #500                             │
├─────────────────────────────────────────────────────────────────────┤
│ ...                                                                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ CURRENT STATUS                                                  │ │
│ │                                                                 │ │
│ │ Quantity Received: 500                                          │ │
│ │ Quantity Remaining: 250 ⬅️ UPDATED                             │ │
│ │ Quantity Assigned: 250 ⬅️ UPDATED                              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ WORKER LOGS                                                     │ │
│ │                                                                 │ │
│ │ ┌──────────────┬──────────┬─────────┬──────┬────────┬────────┐ │ │
│ │ │ Worker       │ Date     │ Quantity│ Rate │ Total  │ Billable││ │
│ │ ├──────────────┼──────────┼─────────┼──────┼────────┼────────┤│ │
│ │ │ Hari Prasad  │ 08/13    │ 250     │ 3.00 │ 750.00 │ ✓      ││ │
│ │ └──────────────┴──────────┴─────────┴──────┴────────┴────────┘│ │
│ │                                                                 │ │
│ │ [Edit] [Delete]                                                 │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ [Close] [Assign Another Worker] [Update Status]                    │
└─────────────────────────────────────────────────────────────────────┘
```

**Changes:**
- Quantity Remaining: 500 → 250
- Quantity Assigned: 0 → 250
- Worker log table now shows Hari Prasad's assignment
- "Assign Another Worker" button available (250 pieces still remaining)

---

### Step 5: Supervisor Closes Modal and Views Kanban

**User Action:**
1. Supervisor clicks "Close" button
2. Returns to kanban board

**Kanban Board Updates:**
```
┌───────────────────────────────────────────────────────────┐
│ NEW ARRIVALS                                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐                                  │
│ │ BLUE CARD           │ ⬅️ COLOR CHANGED (was gray)     │
│ │ (Assigned)          │                                  │
│ │                     │                                  │
│ │ Blue T-Shirts #500  │                                  │
│ │ Start: 08/10        │                                  │
│ │ Due: 08/25          │                                  │
│ │                     │                                  │
│ │ 250 pcs assigned    │ ⬅️ NEW INFO                     │
│ │ Worker: Hari Prasad │ ⬅️ NEW INFO                     │
│ │                     │                                  │
│ │ Remaining: 250 pcs  │ ⬅️ NEW INFO                     │
│ └─────────────────────┘                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Card Changes:**
- **Color:** Gray → Blue (indicates worker assigned)
- **Shows:** Worker name, assigned quantity, remaining quantity
- **Still in:** New Arrivals column (hasn't moved to In Progress yet)

---

### Step 6: Supervisor Assigns Second Worker

**User Action:**
1. Clicks on same "Blue T-Shirts" card again
2. Clicks "Assign Another Worker"
3. Selects "Maya Devi"
4. Quantity: 250 (remaining amount)
5. Work Date: 2081/08/13
6. Unit Price: 3.00
7. Billable: Yes
8. Clicks "Assign"

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "worker_id": 19,
  "sub_batch_id": 78,
  "department_id": 2,
  "department_sub_batch_id": 402,
  "work_date": "2081-08-13",
  "quantity_worked": 250,
  "unit_price": 3.00,
  "activity_type": "NORMAL",
  "is_billable": true
}

Response: {
  "id": 521,
  "worker_name": "Maya Devi",
  ...
}

Updates:
PUT /api/department-sub-batches/402
{
  "quantity_remaining": 0
}
```

**Data Created:**
- New worker log (ID: 521) for Maya Devi

**Data Updated:**
- `department_sub_batches` (ID: 402):
  ```
  quantity_remaining: 250 → 0
  ```

**Worker Logs Now Show:**
```
┌──────────────┬──────────┬─────────┬──────┬────────┬────────┐
│ Worker       │ Date     │ Quantity│ Rate │ Total  │Billable│
├──────────────┼──────────┼─────────┼──────┼────────┼────────┤
│ Hari Prasad  │ 08/13    │ 250     │ 3.00 │ 750.00 │ ✓      │
│ Maya Devi    │ 08/13    │ 250     │ 3.00 │ 750.00 │ ✓      │
└──────────────┴──────────┴─────────┴──────┴────────┴────────┘

Total: 500 pieces, NPR 1,500.00
```

**Status:**
- All 500 pieces now assigned
- Two workers working on task
- Remaining: 0 pieces

---

## Scenario 3: Handling Rejections

### Complete Rejection Flow from Supervisor's Perspective

**Scenario Setup:**
- Supervisor has completed stitching 300 pieces
- Finds 20 pieces with poor stitching quality (need rework)
- Needs to send back to Cutting for re-cutting

---

### Step 1: Supervisor Opens Task Details

**User Action:**
1. Supervisor clicks on "Blue T-Shirts" card
2. Task details modal opens
3. Supervisor reviews work

**Current State:**
```
Quantity Received: 500
Quantity Assigned: 500
Workers: Hari Prasad (250), Maya Devi (250)
Completed Stitching: 300 pieces
Remaining: 200 pieces
```

---

### Step 2: Supervisor Clicks "Reject Items" Button

**User Action:**
1. In task details modal, clicks "Actions" dropdown
2. Selects "Reject Items"

**Reject Modal Opens:**
```
┌──────────────────────────────────────────────────────┐
│ Reject Items - Blue T-Shirts Order #500             │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ⚠️  REJECTING ITEMS FOR REWORK                      │
│                                                      │
│ Current Quantity: 500 pieces                         │
│ Remaining: 200 pieces                                │
│                                                      │
│ Rejection Reason:                                    │
│ ┌────────────────────────────────────────────────┐  │
│ │                                                │  │
│ │                                                │  │
│ │                                                │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ Quantity to Reject: [________]                      │
│                                                      │
│ Send to Department: [Dropdown ▼]                    │
│                                                      │
│ [Cancel] [Submit Rejection]                          │
└──────────────────────────────────────────────────────┘
```

---

### Step 3: Supervisor Fills Rejection Form

**User Action:**
1. Types rejection reason: "Stitching thread loose - cutting issue with fabric edges"
2. Enters quantity: 20
3. Clicks "Send to Department" dropdown

**Dropdown Shows:**
```
┌─────────────────────────────┐
│ Select Department           │
├─────────────────────────────┤
│ ○ Cutting                   │
│ ○ Finishing                 │
│ ○ Quality Check             │
│ ○ Packing                   │
└─────────────────────────────┘
```

**(Note: Stitching not shown - can't send to own department)**

4. Selects "Cutting"
5. Clicks "Submit Rejection"

---

### Step 4: System Processes Rejection

**System Behavior:**
```
POST /api/department-sub-batches/reject
Body: {
  "department_sub_batch_id": 402,
  "reject_reason": "Stitching thread loose - cutting issue with fabric edges",
  "reject_quantity": 20,
  "send_to_department_id": 1,
  "sub_batch_id": 78,
  "source_department_id": 2,
  "source_department_name": "Stitching",
  "rejected_by_supervisor_id": 101
}

Response: {
  "message": "20 items rejected successfully and sent to Cutting",
  "rejection": {
    "id": 430,
    "department_id": 1,
    "sub_batch_id": 78,
    "stage": "NEW_ARRIVAL",
    "is_current": true,
    "quantity_received": 20,
    "quantity_remaining": 20,
    "remarks": "Rejected",
    "reject_reason": "Stitching thread loose - cutting issue with fabric edges",
    "rejection_source": {
      "department_id": 2,
      "department_name": "Stitching",
      "rejected_by": "Sita Sharma",
      "rejected_at": "2025-11-21T12:30:00Z"
    }
  },
  "original_updated": {
    "id": 402,
    "quantity_remaining": 180
  }
}
```

**Data Created:**
- New record in `department_sub_batches` table:
  ```
  {
    id: 430,
    department_id: 1 (Cutting),
    sub_batch_id: 78,
    stage: "NEW_ARRIVAL",
    is_current: true,
    quantity_received: 20,
    quantity_remaining: 20,
    remarks: "Rejected",
    reject_reason: "Stitching thread loose - cutting issue with fabric edges",
    rejection_source_department_id: 2,
    rejected_by_supervisor_id: 101,
    rejected_at: "2025-11-21T12:30:00Z"
  }
  ```

**Data Updated:**
- Original Stitching record (ID: 402):
  ```
  quantity_remaining: 200 → 180
  ```

**Possibly Created:**
- Record in `rejection_entries` table for tracking/history

---

### Step 5: UI Updates After Rejection

**Success Message Shows:**
```
┌────────────────────────────────────────────────┐
│ ✓ Success                                      │
│                                                │
│ 20 items rejected and sent to Cutting dept.   │
│                                                │
│ A new rejected card has been created.         │
│                                                │
│ [OK]                                           │
└────────────────────────────────────────────────┘
```

**Modal Closes**

**Kanban Board Updates:**
```
┌───────────────────────────────────────────────────────────┐
│ NEW ARRIVALS      │  IN PROGRESS                          │
├───────────────────┼───────────────────────────────────────┤
│                   │                                       │
│ (Empty)           │  ┌─────────────────────┐             │
│                   │  │ BLUE CARD           │             │
│                   │  │                     │             │
│                   │  │ Blue T-Shirts #500  │             │
│                   │  │                     │             │
│                   │  │ Remaining: 180 pcs  │ ⬅️ UPDATED │
│                   │  │ (was 200)           │             │
│                   │  │                     │             │
│                   │  │ 2 workers assigned  │             │
│                   │  └─────────────────────┘             │
│                   │                                       │
└───────────────────┴───────────────────────────────────────┘
```

**Card Updates:**
- Quantity remaining: 200 → 180 (reduced by 20)
- Everything else unchanged

**Important:** Supervisor does NOT see the red rejected card because it was sent to Cutting department (different from their department)

---

### Step 6: What Cutting Supervisor Sees

**(From Cutting Supervisor's perspective)**

**Cutting Supervisor logs in and sees:**
```
┌───────────────────────────────────────────────────────────┐
│ NEW ARRIVALS                                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐                                  │
│ │ RED CARD            │ ⬅️ NEW CARD APPEARED             │
│ │ 🔴 REJECTED         │                                  │
│ │                     │                                  │
│ │ Blue T-Shirts #500  │                                  │
│ │                     │                                  │
│ │ 20 pcs              │                                  │
│ │                     │                                  │
│ │ From: Stitching     │                                  │
│ │ By: Sita Sharma     │                                  │
│ │                     │                                  │
│ │ Reason:             │                                  │
│ │ Stitching thread    │                                  │
│ │ loose - cutting     │                                  │
│ │ issue               │                                  │
│ │                     │                                  │
│ │ Main (Unassigned)   │                                  │
│ └─────────────────────┘                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Cutting Supervisor will:**
1. See red rejected card
2. Read rejection reason
3. Assign worker to rework
4. Complete rework
5. Send back to Stitching

---

### Step 7: Tracking Rejection in Worker Logs

**When Cutting Supervisor assigns rework:**

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "worker_id": 15,
  "sub_batch_id": 78,
  "department_id": 1,
  "department_sub_batch_id": 430,
  "quantity_worked": 20,
  "activity_type": "REJECTED",  ⬅️ TAGGED AS REJECTED WORK
  "is_billable": true,
  "unit_price": 2.50
}
```

**Key Field:** `activity_type: "REJECTED"` tags this as rework

**Benefits:**
- Tracks rework separately from normal production
- Can calculate rework costs
- Identifies quality issues
- Worker performance analysis

---

## Scenario 4: Handling Alterations

### Complete Alteration Flow from Supervisor's Perspective

**Scenario Setup:**
- Supervisor completed stitching 150 pieces
- Finds 10 pieces need collar adjustment (not defective, just needs modification)
- Sends to Finishing department for collar work

---

### Step 1: Supervisor Opens Task and Selects Alteration

**User Action:**
1. Supervisor clicks on task card
2. Clicks "Actions" dropdown
3. Selects "Alteration Items"

**Alteration Modal Opens:**
```
┌──────────────────────────────────────────────────────┐
│ Alteration - Blue T-Shirts Order #500               │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 🔧 SEND ITEMS FOR ALTERATION                        │
│                                                      │
│ Current Quantity: 500 pieces                         │
│ Remaining: 180 pieces                                │
│                                                      │
│ Alteration Reason:                                   │
│ ┌────────────────────────────────────────────────┐  │
│ │                                                │  │
│ │                                                │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ Quantity for Alteration: [________]                 │
│                                                      │
│ Send to Department: [Dropdown ▼]                    │
│                                                      │
│ [Cancel] [Submit Alteration]                         │
└──────────────────────────────────────────────────────┘
```

---

### Step 2: Supervisor Fills Alteration Form

**User Action:**
1. Types reason: "Collar too loose - needs tightening for better fit"
2. Enters quantity: 10
3. Selects department: "Finishing" (alterations done in finishing)
4. Clicks "Submit Alteration"

**System Behavior:**
```
POST /api/department-sub-batches/alteration
Body: {
  "department_sub_batch_id": 402,
  "alter_reason": "Collar too loose - needs tightening for better fit",
  "alter_quantity": 10,
  "send_to_department_id": 3,
  "sub_batch_id": 78,
  "source_department_id": 2,
  "source_department_name": "Stitching",
  "altered_by_supervisor_id": 101
}

Response: {
  "message": "10 items sent for alteration to Finishing",
  "alteration": {
    "id": 435,
    "department_id": 3,
    "sub_batch_id": 78,
    "stage": "NEW_ARRIVAL",
    "is_current": true,
    "quantity_received": 10,
    "quantity_remaining": 10,
    "remarks": "Altered",
    "alter_reason": "Collar too loose - needs tightening for better fit",
    "alteration_source": {
      "department_id": 2,
      "department_name": "Stitching",
      "altered_by": "Sita Sharma",
      "altered_at": "2025-11-21T13:00:00Z"
    }
  },
  "original_updated": {
    "id": 402,
    "quantity_remaining": 170
  }
}
```

**Data Created:**
- New record in `department_sub_batches` table:
  ```
  {
    id: 435,
    department_id: 3 (Finishing),
    sub_batch_id: 78,
    stage: "NEW_ARRIVAL",
    quantity_received: 10,
    quantity_remaining: 10,
    remarks: "Altered",
    alter_reason: "Collar too loose - needs tightening for better fit",
    alteration_source_department_id: 2,
    altered_by_supervisor_id: 101
  }
  ```

**Data Updated:**
- Stitching record (ID: 402):
  ```
  quantity_remaining: 180 → 170
  ```

---

### Step 3: UI Updates

**Success Message:**
```
✓ 10 items sent for alteration to Finishing department
```

**Kanban Updates:**
```
┌───────────────────────────────────────────────────────────┐
│ IN PROGRESS                                               │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐                                  │
│ │ BLUE CARD           │                                  │
│ │                     │                                  │
│ │ Blue T-Shirts #500  │                                  │
│ │                     │                                  │
│ │ Remaining: 170 pcs  │ ⬅️ UPDATED (was 180)           │
│ │                     │                                  │
│ └─────────────────────┘                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

### Step 4: What Finishing Supervisor Sees

**Finishing Supervisor's kanban:**
```
┌───────────────────────────────────────────────────────────┐
│ NEW ARRIVALS                                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐                                  │
│ │ YELLOW CARD         │ ⬅️ NEW CARD APPEARED             │
│ │ 🟡 ALTERED          │                                  │
│ │                     │                                  │
│ │ Blue T-Shirts #500  │                                  │
│ │                     │                                  │
│ │ 10 pcs              │                                  │
│ │                     │                                  │
│ │ From: Stitching     │                                  │
│ │ By: Sita Sharma     │                                  │
│ │                     │                                  │
│ │ Reason:             │                                  │
│ │ Collar too loose    │                                  │
│ │ needs tightening    │                                  │
│ │                     │                                  │
│ │ Main (Unassigned)   │                                  │
│ └─────────────────────┘                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Finishing Supervisor will:**
1. See yellow altered card
2. Read alteration reason
3. Assign worker for alteration work
4. Complete alteration
5. Send back to Stitching or advance to next department

---

### Step 5: Worker Log for Alteration

**When Finishing Supervisor assigns alteration work:**

```
POST /api/worker-logs/logs
Body: {
  "worker_id": 30,
  "department_sub_batch_id": 435,
  "quantity_worked": 10,
  "activity_type": "ALTERED",  ⬅️ TAGGED AS ALTERATION
  "unit_price": 2.00,
  "is_billable": true
}
```

**Key:** `activity_type: "ALTERED"` tracks this separately

---

### Key Differences: Rejection vs Alteration

**From Supervisor's Perspective:**

**Rejection:**
- **Used when:** Items are defective, need complete rework
- **Sends to:** Usually previous department
- **Card Color:** Red 🔴
- **Example:** Wrong cut, damaged fabric, broken stitching

**Alteration:**
- **Used when:** Items need modification, not defective
- **Sends to:** Any department that can do the modification
- **Card Color:** Yellow 🟡
- **Example:** Adjust fit, modify design, add feature

**Both Create:**
- New card in target department
- Reduce quantity in source department
- Separate worker logs with activity_type tag
- Tracking for quality metrics

---

## Scenario 5: Advancing Work to Next Department

### Complete Advance Workflow

**Scenario Setup:**
- Supervisor completed stitching all 500 pieces (including reworked items)
- Ready to send to Finishing department
- Next department in workflow: Finishing

---

### Step 1: Supervisor Marks Task as Completed

**User Action:**
1. Supervisor clicks on "Blue T-Shirts" card
2. Clicks "Update Status" button
3. Selects "Mark as Completed"

**System Updates:**
```
PUT /api/department-sub-batches/402
Body: {
  "stage": "COMPLETED"
}

Response: {
  "id": 402,
  "stage": "COMPLETED",
  ...
}
```

**Card Moves:**
- From "In Progress" column → "Completed" column

**Kanban After:**
```
┌───────────────┬────────────────────┬─────────────────────┐
│ NEW ARRIVALS  │   IN PROGRESS      │     COMPLETED       │
├───────────────┼────────────────────┼─────────────────────┤
│               │                    │ ┌─────────────────┐ │
│               │                    │ │ GREEN CARD      │ │
│               │                    │ │                 │ │
│               │                    │ │ Blue T-Shirts   │ │
│               │                    │ │ Order #500      │ │
│               │                    │ │                 │ │
│               │                    │ │ 500 pcs done    │ │
│               │                    │ │                 │ │
│               │                    │ │ ✓ Ready to      │ │
│               │                    │ │   advance       │ │
│               │                    │ └─────────────────┘ │
│               │                    │                     │
└───────────────┴────────────────────┴─────────────────────┘
```

**Card Changes:**
- Background color: Yellow/Blue → Green
- Shows "Ready to advance"

---

### Step 2: Supervisor Clicks "Advance to Next Department"

**User Action:**
1. Clicks on completed task card
2. Task details modal opens
3. Clicks "Advance to Next Department" button

**Advance Modal Opens:**
```
┌──────────────────────────────────────────────────────┐
│ Advance to Next Department                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Sub-Batch: Blue T-Shirts Order #500                  │
│ Current Department: Stitching                        │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ Department Flow:                               │  │
│ │ Cutting ✓ → Stitching ✓ → Finishing (next)   │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ Next Department: Finishing ✓                         │
│ (Auto-selected from workflow)                        │
│                                                      │
│ Total Completed: 500 pieces                          │
│                                                      │
│ Quantity to Advance: [________]                     │
│                                                      │
│ [Cancel] [Advance]                                   │
└──────────────────────────────────────────────────────┘
```

**Key Points:**
- Next department auto-selected from original workflow
- Supervisor can see department route
- Must specify quantity advancing

---

### Step 3: Supervisor Enters Quantity and Advances

**User Action:**
1. Enters quantity: 500 (all pieces)
2. Clicks "Advance" button

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 402,
  "next_department_id": 3,
  "quantity_advancing": 500,
  "sub_batch_id": 78
}

Response: {
  "message": "Successfully advanced 500 pieces to Finishing",
  "current_updated": {
    "id": 402,
    "stage": "COMPLETED",
    "is_current": false,
    "quantity_remaining": 0
  },
  "next_updated": {
    "id": 403,
    "department_id": 3,
    "stage": "NEW_ARRIVAL",
    "is_current": true,
    "quantity_received": 500,
    "quantity_remaining": 500,
    "remarks": "Main"
  }
}
```

**Data Updated:**

**Stitching (ID: 402):**
```
stage: "COMPLETED" (unchanged)
is_current: true → false
quantity_remaining: 500 → 0
```

**Finishing (ID: 403):**
```
stage: "NEW_ARRIVAL" (unchanged)
is_current: false → true
quantity_received: 0 → 500
quantity_remaining: 0 → 500
remarks: null → "Main"
```

---

### Step 4: UI Updates After Advancement

**Success Message:**
```
┌────────────────────────────────────────────────┐
│ ✓ Success                                      │
│                                                │
│ 500 pieces advanced to Finishing department   │
│                                                │
│ [OK]                                           │
└────────────────────────────────────────────────┘
```

**Stitching Supervisor's Kanban Updates:**
```
┌───────────────┬────────────────────┬─────────────────────┐
│ NEW ARRIVALS  │   IN PROGRESS      │     COMPLETED       │
├───────────────┼────────────────────┼─────────────────────┤
│               │                    │                     │
│               │                    │ (Empty)             │
│               │                    │                     │
│               │                    │ Card disappeared!   │
│               │                    │                     │
└───────────────┴────────────────────┴─────────────────────┘
```

**Card Disappears:**
- Once advanced, card no longer shows in Stitching supervisor's view
- Task moved to Finishing department
- Stitching supervisor's work is done

---

### Step 5: What Finishing Supervisor Sees

**Finishing Supervisor's Kanban:**
```
┌───────────────────────────────────────────────────────────┐
│ NEW ARRIVALS                                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐                                  │
│ │ GRAY CARD           │ ⬅️ NEW CARD APPEARED             │
│ │                     │                                  │
│ │ Blue T-Shirts #500  │                                  │
│ │ Start: 08/10        │                                  │
│ │ Due: 08/25          │                                  │
│ │                     │                                  │
│ │ 500 pcs             │                                  │
│ │                     │                                  │
│ │ Main (Unassigned)   │                                  │
│ └─────────────────────┘                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Finishing Supervisor will:**
1. See new task in "New Arrivals"
2. Review sub-batch details
3. Assign workers for finishing work
4. Complete finishing
5. Advance to Quality Check

---

### Step 6: Complete Flow Summary

**Data Flow:**
```
[Stitching Department - Before]
department_sub_batches (ID: 402):
  stage: "COMPLETED"
  is_current: true
  quantity_remaining: 500

↓ Supervisor clicks "Advance"

[System Creates Handoff]
POST /api/sub-batches/advance-department

↓ Updates Both Departments

[Stitching Department - After]
department_sub_batches (ID: 402):
  stage: "COMPLETED"
  is_current: false ⬅️ No longer active
  quantity_remaining: 0

[Finishing Department - After]
department_sub_batches (ID: 403):
  stage: "NEW_ARRIVAL"
  is_current: true ⬅️ Now active
  quantity_received: 500
  quantity_remaining: 500
  remarks: "Main"

↓ UI Updates

[Stitching Supervisor]
- Card disappears from kanban
- Task complete

[Finishing Supervisor]
- Card appears in "New Arrivals"
- Ready to assign workers
```

---

## Scenario 6: Managing Worker Assignments

### Editing and Deleting Worker Assignments

**Scenario Setup:**
- Task has 2 worker assignments
- Supervisor needs to fix a mistake (wrong quantity entered)
- Then needs to delete an assignment

---

### Step 1: Supervisor Views Worker Logs

**User Action:**
1. Supervisor opens task details
2. Sees worker logs table:

```
┌──────────────┬──────────┬─────────┬──────┬────────┬────────┬─────────┐
│ Worker       │ Date     │ Quantity│ Rate │ Total  │Billable│ Actions │
├──────────────┼──────────┼─────────┼──────┼────────┼────────┼─────────┤
│ Hari Prasad  │ 08/13    │ 250     │ 3.00 │ 750.00 │ ✓      │ [Edit]  │
│ Maya Devi    │ 08/13    │ 250     │ 3.00 │ 750.00 │ ✓      │ [Edit]  │
└──────────────┴──────────┴─────────┴──────┴────────┴────────┴─────────┘
```

---

### Step 2: Supervisor Clicks "Edit" on First Worker

**User Action:**
1. Clicks "[Edit]" button for Hari Prasad

**Edit Worker Assignment Modal Opens:**
```
┌──────────────────────────────────────────────────────┐
│ Edit Worker Assignment                               │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Worker: Hari Prasad (read-only)                     │
│                                                      │
│ Quantity Worked: [250]                              │
│                                                      │
│ Work Date: [2081/08/13] (Nepali Date Picker)        │
│                                                      │
│ Unit Price: [3.00]                                  │
│                                                      │
│ [✓] Billable                                        │
│                                                      │
│ [Cancel] [Save Changes] [Delete Assignment]          │
└──────────────────────────────────────────────────────┘
```

---

### Step 3: Supervisor Changes Quantity

**User Action:**
1. Realizes Hari only worked 200 pieces, not 250
2. Changes quantity from 250 to 200
3. Total auto-updates: 750.00 → 600.00
4. Clicks "Save Changes"

**System Behavior:**
```
PUT /api/worker-logs/520
Body: {
  "quantity_worked": 200,
  "unit_price": 3.00,
  "is_billable": true,
  "work_date": "2081-08-13"
}

Response: {
  "id": 520,
  "quantity_worked": 200,
  "total_amount": 600.00,
  ...
}

Then recalculates department quantities:
PUT /api/department-sub-batches/402
{
  "quantity_assigned": 500 → 450,
  "quantity_remaining": 0 → 50
}
```

**Data Updated:**
- `worker_logs` (ID: 520): quantity_worked 250 → 200
- `department_sub_batches` (ID: 402):
  - quantity_assigned: 500 → 450
  - quantity_remaining: 0 → 50

---

### Step 4: UI Updates After Edit

**Worker Logs Table Updates:**
```
┌──────────────┬──────────┬─────────┬──────┬────────┬────────┬─────────┐
│ Worker       │ Date     │ Quantity│ Rate │ Total  │Billable│ Actions │
├──────────────┼──────────┼─────────┼──────┼────────┼────────┼─────────┤
│ Hari Prasad  │ 08/13    │ 200     │ 3.00 │ 600.00 │ ✓      │ [Edit]  │
│              │          │ ↑       │      │  ↑     │        │         │
│              │          │ CHANGED │      │CHANGED │        │         │
│ Maya Devi    │ 08/13    │ 250     │ 3.00 │ 750.00 │ ✓      │ [Edit]  │
└──────────────┴──────────┴─────────┴──────┴────────┴────────┴─────────┘
```

**Status Updates:**
```
Quantity Assigned: 450 (200 + 250)
Quantity Remaining: 50
```

---

### Step 5: Supervisor Deletes Second Assignment

**User Action:**
1. Realizes Maya Devi didn't actually work on this task
2. Clicks "[Edit]" for Maya Devi
3. In edit modal, clicks "Delete Assignment" button
4. Confirmation dialog appears:

```
┌────────────────────────────────────────────────┐
│ Confirm Delete                                 │
│                                                │
│ Are you sure you want to delete this worker    │
│ assignment?                                    │
│                                                │
│ Worker: Maya Devi                              │
│ Quantity: 250 pieces                           │
│                                                │
│ This action cannot be undone.                  │
│                                                │
│ [Cancel] [Delete]                              │
└────────────────────────────────────────────────┘
```

5. Clicks "Delete"

**System Behavior:**
```
DELETE /api/worker-logs/521

Response: {
  "message": "Worker assignment deleted successfully",
  "status": 200
}

Then recalculates:
PUT /api/department-sub-batches/402
{
  "quantity_assigned": 450 → 200,
  "quantity_remaining": 50 → 300,
  "assigned_worker_id": 18 (Hari Prasad only)
}
```

**Data Deleted:**
- `worker_logs` record (ID: 521) removed

**Data Updated:**
- `department_sub_batches` (ID: 402):
  - quantity_assigned: 450 → 200
  - quantity_remaining: 50 → 300

---

### Step 6: Final UI State

**Worker Logs Table:**
```
┌──────────────┬──────────┬─────────┬──────┬────────┬────────┬─────────┐
│ Worker       │ Date     │ Quantity│ Rate │ Total  │Billable│ Actions │
├──────────────┼──────────┼─────────┼──────┼────────┼────────┼─────────┤
│ Hari Prasad  │ 08/13    │ 200     │ 3.00 │ 600.00 │ ✓      │ [Edit]  │
└──────────────┴──────────┴─────────┴──────┴────────┴────────┴─────────┘

Maya Devi's row REMOVED
```

**Status:**
```
Quantity Assigned: 200
Quantity Remaining: 300
```

**Supervisor can now:**
- Assign remaining 300 to other workers
- Continue production

---

## Scenario 7: Handling Multiple Cards Simultaneously

### Managing Multiple Tasks in Same Department

**Scenario:**
- Supervisor has 5 tasks in department
- 2 in New Arrivals
- 2 in In Progress
- 1 in Completed

---

### Supervisor's Full Kanban View:

```
┌─────────────────┬──────────────────────┬─────────────────────┐
│ NEW ARRIVALS    │   IN PROGRESS        │     COMPLETED       │
│ (2 tasks)       │   (2 tasks)          │     (1 task)        │
├─────────────────┼──────────────────────┼─────────────────────┤
│                 │                      │                     │
│ ┌─────────────┐ │  ┌────────────────┐ │  ┌────────────────┐ │
│ │Blue T-Shirts│ │  │ Red Shirts     │ │  │ Yellow Jackets │ │
│ │Order #500   │ │  │ Order #200     │ │  │ Order #100     │ │
│ │500 pcs      │ │  │ 50 pcs left    │ │  │ 50 pcs done    │ │
│ │Unassigned   │ │  │ Hari working   │ │  │ Ready          │ │
│ └─────────────┘ │  └────────────────┘ │  └────────────────┘ │
│                 │                      │                     │
│ ┌─────────────┐ │  ┌────────────────┐ │                     │
│ │Green Pants  │ │  │ Black Hoodies  │ │                     │
│ │Order #300   │ │  │ Order #150     │ │                     │
│ │150 pcs      │ │  │ 75 pcs left    │ │                     │
│ │Unassigned   │ │  │ 3 workers      │ │                     │
│ └─────────────┘ │  └────────────────┘ │                     │
│                 │                      │                     │
└─────────────────┴──────────────────────┴─────────────────────┘
```

---

### Supervisor's Workflow:

**Morning:**
1. Check New Arrivals - 2 new tasks overnight
2. Assign workers to both
3. Move to In Progress

**During Day:**
1. Monitor In Progress tasks
2. Check worker progress
3. Handle any quality issues

**Afternoon:**
1. Complete finished tasks
2. Advance to next department
3. Clear Completed column

---

### System Loads All Department Tasks:

```
GET /supervisors/sub-batches?department_id=2

Response: {
  "department_id": 2,
  "tasks": {
    "new_arrivals": [
      { department_sub_batch_id: 402, sub_batch: {...}, quantity: 500 },
      { department_sub_batch_id: 406, sub_batch: {...}, quantity: 150 }
    ],
    "in_progress": [
      { department_sub_batch_id: 405, sub_batch: {...}, quantity: 50 },
      { department_sub_batch_id: 408, sub_batch: {...}, quantity: 75 }
    ],
    "completed": [
      { department_sub_batch_id: 404, sub_batch: {...}, quantity: 0 }
    ]
  }
}
```

**Single API call loads entire department state**

---

## Scenario 8: Partial Work Completion

### Advancing Partial Quantities

**Scenario:**
- Task has 500 pieces
- Only 300 completed so far
- Supervisor wants to advance 300 to next department
- Keep 200 in current department to finish later

---

### Step 1: Supervisor Marks Partial Completion

**User Action:**
1. Opens task "Blue T-Shirts Order #500"
2. Status shows:
   - Quantity Received: 500
   - Workers assigned: 500
   - Completed: 300
   - Remaining: 200
3. Clicks "Advance to Next Department"

---

### Step 2: Advance Modal with Partial Quantity

**Modal Shows:**
```
┌──────────────────────────────────────────────────────┐
│ Advance to Next Department                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Sub-Batch: Blue T-Shirts Order #500                  │
│ Current Department: Stitching                        │
│ Next Department: Finishing                           │
│                                                      │
│ Total in Department: 500 pieces                      │
│ Completed: 300 pieces                                │
│ Still Working: 200 pieces                            │
│                                                      │
│ Quantity to Advance: [________]                     │
│                                                      │
│ ⚠️  Note: You can advance partial quantities.       │
│    Remaining pieces will stay in this department.    │
│                                                      │
│ [Cancel] [Advance]                                   │
└──────────────────────────────────────────────────────┘
```

---

### Step 3: Supervisor Advances 300 Only

**User Action:**
1. Enters quantity: 300
2. Clicks "Advance"

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 402,
  "next_department_id": 3,
  "quantity_advancing": 300,
  "sub_batch_id": 78
}

Response: {
  "message": "Partial advancement: 300 pieces sent to Finishing, 200 remain",
  "current_updated": {
    "id": 402,
    "stage": "IN_PROGRESS",  ⬅️ STAYS IN_PROGRESS
    "quantity_remaining": 200,
    "is_current": true  ⬅️ STAYS ACTIVE
  },
  "next_updated": {
    "id": 403,
    "quantity_received": 300,
    "quantity_remaining": 300,
    "is_current": true
  }
}
```

**Key Difference:**
- Current department record NOT marked completed
- `is_current` stays `true`
- `stage` stays `IN_PROGRESS`
- `quantity_remaining` reduced to 200

---

### Step 4: UI After Partial Advancement

**Stitching Supervisor's Kanban:**
```
┌───────────────┬────────────────────┬─────────────────────┐
│ NEW ARRIVALS  │   IN PROGRESS      │     COMPLETED       │
├───────────────┼────────────────────┼─────────────────────┤
│               │ ┌────────────────┐ │                     │
│               │ │ Blue T-Shirts  │ │                     │
│               │ │ Order #500     │ │                     │
│               │ │                │ │                     │
│               │ │ 200 pcs remain │ │  CARD STAYS HERE!   │
│               │ │ (300 advanced) │ │                     │
│               │ │                │ │                     │
│               │ │ Still working  │ │                     │
│               │ └────────────────┘ │                     │
│               │                    │                     │
└───────────────┴────────────────────┴─────────────────────┘
```

**Card Changes:**
- Stays in "In Progress" column
- Quantity updated: 500 → 200
- Shows note: "300 pieces advanced to Finishing"

---

### Step 5: Finishing Supervisor Receives Partial

**Finishing Supervisor's Kanban:**
```
┌───────────────────────────────────────────────────────────┐
│ NEW ARRIVALS                                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐                                  │
│ │ GRAY CARD           │                                  │
│ │                     │                                  │
│ │ Blue T-Shirts #500  │                                  │
│ │                     │                                  │
│ │ 300 pcs             │ ⬅️ PARTIAL QUANTITY             │
│ │                     │                                  │
│ │ (Partial delivery   │                                  │
│ │  from Stitching)    │                                  │
│ │                     │                                  │
│ │ Main (Unassigned)   │                                  │
│ └─────────────────────┘                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Finishing starts working on 300 pieces**

---

### Step 6: Advancing Remaining 200 Later

**Later that day...**

**User Action:**
1. Stitching supervisor completes remaining 200
2. Opens same task card (still in In Progress)
3. Clicks "Advance to Next Department"
4. Enters quantity: 200
5. Clicks "Advance"

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 402,
  "next_department_id": 3,
  "quantity_advancing": 200,
  "sub_batch_id": 78
}

Response: {
  "current_updated": {
    "id": 402,
    "stage": "COMPLETED",  ⬅️ NOW COMPLETED
    "quantity_remaining": 0,
    "is_current": false
  },
  "next_updated": {
    "id": 403,
    "quantity_received": 500,  ⬅️ 300 + 200
    "quantity_remaining": 500
  }
}
```

**Data Updated:**

**Stitching (ID: 402):**
```
quantity_remaining: 200 → 0
stage: "IN_PROGRESS" → "COMPLETED"
is_current: true → false
```

**Finishing (ID: 403):**
```
quantity_received: 300 → 500 (added 200)
quantity_remaining: depends on how much Finishing already worked
```

---

### Step 7: Final State

**Stitching Kanban:**
- Card disappears (all work complete)

**Finishing Kanban:**
- Same card, quantity now 500 total
- Shows all pieces received

**Complete Flow:**
```
Stitching Department:
  Initial: 500 pieces
  ↓
  Advanced: 300 pieces → Finishing
  Remaining: 200 pieces in Stitching
  ↓
  Later: 200 pieces → Finishing
  ↓
  Final: 0 pieces, task completed

Finishing Department:
  First arrival: 300 pieces
  ↓
  Second arrival: 200 pieces
  ↓
  Total: 500 pieces to work on
```

---

## Scenario 9: Receiving Rejected Items from Another Department

### Complete Flow When Receiving Red Cards

**Scenario:**
- Finishing department rejected 15 pieces
- Sent back to Stitching for rework
- Stitching supervisor receives red rejected card

---

### Step 1: Red Card Appears in Kanban

**Stitching Supervisor's View:**
```
┌───────────────────────────────────────────────────────────┐
│ NEW ARRIVALS                                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐                                  │
│ │ RED CARD            │ ⬅️ APPEARED OVERNIGHT            │
│ │ 🔴 REJECTED         │                                  │
│ │                     │                                  │
│ │ Blue T-Shirts #500  │                                  │
│ │                     │                                  │
│ │ 15 pcs              │                                  │
│ │                     │                                  │
│ │ From: Finishing     │                                  │
│ │ By: Maya Thapa      │                                  │
│ │                     │                                  │
│ │ Reason:             │                                  │
│ │ Loose stitching on  │                                  │
│ │ shoulder seams      │                                  │
│ │                     │                                  │
│ │ Main (Unassigned)   │                                  │
│ └─────────────────────┘                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

### Step 2: Supervisor Clicks Rejected Card

**Task Details Modal:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Task Details - Blue T-Shirts Order #500 (REJECTED)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ⚠️  REJECTED ITEMS - REWORK REQUIRED                               │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ REJECTION DETAILS                                               │ │
│ │                                                                 │ │
│ │ Rejected From: Finishing Department                             │ │
│ │ Rejected By: Maya Thapa (Supervisor)                            │ │
│ │ Rejected At: 2081/08/16 03:45 PM                               │ │
│ │ Reason: Loose stitching on shoulder seams                       │ │
│ │ Quantity: 15 pieces                                             │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ CURRENT STATUS                                                  │ │
│ │                                                                 │ │
│ │ Current Department: Stitching                                   │ │
│ │ Quantity to Rework: 15                                          │ │
│ │ Remaining: 15 (unassigned)                                      │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ORIGINAL SUB-BATCH INFO                                         │ │
│ │                                                                 │ │
│ │ Name: Blue T-Shirts Order #500                                  │ │
│ │ Size Details: XL(100), L(150), M(200), S(50)                   │ │
│ │ Original Route: Cutting → Stitching → Finishing → QC → Packing│ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ WORKER LOGS                                                     │ │
│ │                                                                 │ │
│ │ No rework assigned yet                                          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ [Close] [Assign Worker for Rework] [Contact Finishing Dept]        │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Step 3: Supervisor Assigns Worker for Rework

**User Action:**
1. Clicks "Assign Worker for Rework"
2. Assign Worker modal opens (same as normal assignment)
3. Selects worker: "Hari Prasad"
4. Quantity: 15
5. Work Date: 2081/08/17
6. Unit Price: 3.50 (higher rate for rework)
7. Billable: Yes
8. Clicks "Assign"

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "worker_id": 18,
  "sub_batch_id": 78,
  "department_id": 2,
  "department_sub_batch_id": 430,  ⬅️ Rejected card's ID
  "quantity_worked": 15,
  "unit_price": 3.50,
  "activity_type": "REJECTED",  ⬅️ TAGGED AS REJECTED REWORK
  "is_billable": true,
  "work_date": "2081-08-17"
}

Response: {
  "id": 525,
  "activity_type": "REJECTED",
  ...
}
```

**Data Created:**
- Worker log with `activity_type: "REJECTED"`

---

### Step 4: Card Changes After Assignment

**Red Card Updates:**
```
┌───────────────────────────────────────────────────────────┐
│ NEW ARRIVALS                                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐                                  │
│ │ BLUE CARD           │ ⬅️ COLOR CHANGED (was red)      │
│ │ (Assigned)          │                                  │
│ │                     │                                  │
│ │ Blue T-Shirts #500  │                                  │
│ │ [REJECTED REWORK]   │                                  │
│ │                     │                                  │
│ │ 15 pcs              │                                  │
│ │ Worker: Hari Prasad │                                  │
│ │                     │                                  │
│ │ From: Finishing     │                                  │
│ │ Rework in progress  │                                  │
│ └─────────────────────┘                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Changes:**
- Color: Red → Blue (worker assigned)
- Shows worker name
- Badge: "REJECTED REWORK"

---

### Step 5: Completing Rework and Sending Back

**After rework complete:**

**User Action:**
1. Supervisor marks rework as complete
2. Changes status to "Completed"
3. Clicks "Advance to Next Department"
4. System shows: "Send to Finishing" (original source)
5. Quantity: 15
6. Clicks "Advance"

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 430,
  "next_department_id": 3,  ⬅️ Back to Finishing
  "quantity_advancing": 15,
  "sub_batch_id": 78
}

Response: {
  "current_updated": {
    "id": 430,
    "stage": "COMPLETED",
    "is_current": false
  },
  "next_updated": {
    "id": 403,  ⬅️ Original Finishing record
    "quantity_received": 515,  ⬅️ 500 + 15 reworked
    "quantity_remaining": updated
  }
}
```

---

### Step 6: Card Disappears, Finishing Receives

**Stitching Kanban:**
- Red/blue rework card disappears

**Finishing Kanban:**
- Original card quantity increases by 15
- Or new card appears with reworked items
- Supervisor can continue normal workflow

---

### Step 7: Complete Rejection Cycle Summary

```
[Finishing Department - Day 1]
  Finds 15 defective pieces
  ↓
  Clicks "Reject Items"
  ↓
  Sends to Stitching
  ↓
  Creates RED card in Stitching

[Stitching Department - Day 2]
  Sees RED card in "New Arrivals"
  ↓
  Reviews rejection reason
  ↓
  Assigns worker for rework
  ↓
  Card turns BLUE (assigned)
  ↓
  Worker completes rework (activity_type: REJECTED)
  ↓
  Marks completed
  ↓
  Advances back to Finishing

[Finishing Department - Day 3]
  Receives 15 reworked pieces
  ↓
  Continues normal workflow
  ↓
  Completes finishing

[System Tracking]
  worker_logs: activity_type = "REJECTED"
  rejection_entries: Full history
  Quality metrics: Tracks rejection rate
  Cost analysis: Rework costs separate
```

---

## Scenario 10: Receiving Altered Items from Another Department

### Complete Flow When Receiving Yellow Cards

**Scenario:**
- Quality Check department needs collar adjustment on 10 pieces
- Sent to Stitching for modification (not defective, just needs adjustment)
- Stitching supervisor receives yellow altered card

---

### Step 1: Yellow Card Appears

**Stitching Supervisor's Kanban:**
```
┌───────────────────────────────────────────────────────────┐
│ NEW ARRIVALS                                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────┐                                  │
│ │ YELLOW CARD         │ ⬅️ APPEARED                      │
│ │ 🟡 ALTERED          │                                  │
│ │                     │                                  │
│ │ Blue T-Shirts #500  │                                  │
│ │                     │                                  │
│ │ 10 pcs              │                                  │
│ │                     │                                  │
│ │ From: Quality Check │                                  │
│ │ By: Ram KC          │                                  │
│ │                     │                                  │
│ │ Reason:             │                                  │
│ │ Collar needs        │                                  │
│ │ reinforcement       │                                  │
│ │ stitching           │                                  │
│ │                     │                                  │
│ │ Main (Unassigned)   │                                  │
│ └─────────────────────┘                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

### Step 2: Supervisor Reviews Alteration

**Clicks Yellow Card:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Task Details - Blue T-Shirts Order #500 (ALTERED)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 🔧 ITEMS FOR ALTERATION                                            │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ALTERATION DETAILS                                              │ │
│ │                                                                 │ │
│ │ Sent From: Quality Check Department                             │ │
│ │ Sent By: Ram KC (Supervisor)                                    │ │
│ │ Sent At: 2081/08/18 10:30 AM                                   │ │
│ │ Reason: Collar needs reinforcement stitching for durability    │ │
│ │ Quantity: 10 pieces                                             │ │
│ │                                                                 │ │
│ │ Note: Items passed QC but need modification for better quality  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ CURRENT STATUS                                                  │ │
│ │                                                                 │ │
│ │ Quantity to Alter: 10                                           │ │
│ │ Remaining: 10 (unassigned)                                      │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ [Close] [Assign Worker for Alteration]                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Step 3: Assign Worker for Alteration

**User Action:**
1. Clicks "Assign Worker for Alteration"
2. Selects: Maya Devi
3. Quantity: 10
4. Work Date: 2081/08/19
5. Unit Price: 2.00 (alteration rate)
6. Billable: Yes
7. Clicks "Assign"

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "worker_id": 19,
  "department_sub_batch_id": 435,  ⬅️ Altered card's ID
  "quantity_worked": 10,
  "unit_price": 2.00,
  "activity_type": "ALTERED",  ⬅️ TAGGED AS ALTERATION
  "is_billable": true
}
```

**Data Created:**
- Worker log with `activity_type: "ALTERED"`

---

### Step 4: Complete Alteration and Return

**After alteration complete:**

**User Action:**
1. Marks as completed
2. Advances to next department
3. System shows: "Send to Quality Check" (or next in workflow)
4. Clicks "Advance"

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 435,
  "next_department_id": 4,  ⬅️ Back to Quality Check
  "quantity_advancing": 10
}
```

**Yellow card disappears from Stitching, reappears in Quality Check**

---

### Step 5: Alteration vs Rejection - Quick Reference

**Supervisor's Decision Guide:**

**Use REJECTION (Red) when:**
- Items are defective
- Quality standard not met
- Need complete rework
- Examples: Wrong size, torn fabric, broken seams

**Use ALTERATION (Yellow) when:**
- Items are acceptable but need improvement
- Design modification needed
- Enhancement required
- Examples: Adjust fit, add reinforcement, modify style

---

## Edge Cases & Special Scenarios

### Edge Case 1: Trying to Assign More Than Available

**Scenario:**
- Task has 100 pieces remaining
- Supervisor tries to assign 150 pieces

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "quantity_worked": 150
}

Response: {
  "error": "Cannot assign 150 pieces. Only 100 pieces available.",
  "available_quantity": 100,
  "status": 400
}
```

**UI Shows:**
```
┌────────────────────────────────────────────────┐
│ ❌ Error                                       │
│                                                │
│ Cannot assign 150 pieces.                      │
│ Only 100 pieces available.                     │
│                                                │
│ [OK]                                           │
└────────────────────────────────────────────────┘
```

**Form doesn't submit, quantity field highlighted red**

---

### Edge Case 2: Card in Wrong Column

**Scenario:**
- Task marked "Completed" but still has quantity remaining
- System validation prevents this

**System Behavior:**
```
PUT /api/department-sub-batches/402
Body: {
  "stage": "COMPLETED"
}

Response: {
  "error": "Cannot mark as completed. 200 pieces still remaining.",
  "quantity_remaining": 200,
  "status": 400
}
```

**Forces supervisor to either:**
1. Advance remaining quantity first
2. Or account for all pieces

---

### Edge Case 3: Accessing Other Department's Tasks

**Scenario:**
- Stitching supervisor tries to access Cutting department task

**System Behavior:**
```
GET /api/department-sub-batches/401

Response: {
  "error": "Access denied. This task belongs to Cutting department.",
  "your_department": "Stitching",
  "task_department": "Cutting",
  "status": 403
}
```

**UI shows error or redirects to dashboard**

---

### Edge Case 4: Nepali Date Validation

**Scenario:**
- Supervisor selects work date in the future

**System Behavior:**
```
POST /api/worker-logs/logs
Body: {
  "work_date": "2081-09-01"  (future date)
}

Response: {
  "error": "Work date cannot be in the future",
  "status": 400
}
```

**Form validation prevents future dates**

---

### Edge Case 5: Department Workflow End

**Scenario:**
- Supervisor in Packing (last department) tries to advance

**System Behavior:**
```
POST /api/sub-batches/advance-department
Body: {
  "current_department_sub_batch_id": 405
}

Response: {
  "message": "This is the last department in workflow. Marking sub-batch as COMPLETED.",
  "sub_batch_updated": {
    "status": "COMPLETED",
    "completed_at": "2025-11-21T16:00:00Z"
  }
}
```

**Instead of advancing to next department, marks entire sub-batch as COMPLETED**

---

### Edge Case 6: Network Error During Assignment

**Scenario:**
- Network fails while assigning worker
- Form submitted but no response

**UI Behavior:**
```
┌────────────────────────────────────────────────┐
│ ⚠️  Network Error                              │
│                                                │
│ Assignment may or may not have been saved.     │
│                                                │
│ Please check the worker logs to confirm.       │
│                                                │
│ [Retry] [Cancel]                               │
└────────────────────────────────────────────────┘
```

**Best Practice:**
- Close modal
- Reopen task
- Check worker logs
- If not saved, retry assignment

---

## Conclusion

This document provides **complete supervisor workflows** including:
- Daily operations (login, view kanban, manage tasks)
- Worker assignment (assign, edit, delete)
- Quality control (rejections and alterations)
- Advancing work between departments
- Handling multiple tasks
- Partial completions
- Receiving rejected/altered items
- Edge cases and error handling

**Key Takeaways for Supervisors:**

1. **Department Scope:** Only see your department's tasks
2. **Three Columns:** New Arrivals → In Progress → Completed
3. **Card Colors:**
   - Gray: Unassigned
   - Blue: Worker assigned
   - Red: Rejected items (rework needed)
   - Yellow: Altered items (modification needed)
   - Green: Completed

4. **Main Actions:**
   - Assign workers
   - Update status
   - Reject items (send to other departments)
   - Alter items (send for modifications)
   - Advance to next department

5. **Worker Logs:**
   - Track with activity_type: NORMAL, REJECTED, ALTERED
   - Edit/delete assignments as needed
   - Billable vs non-billable tracking

6. **Data Flow:**
   - Cards move between departments via "Advance"
   - Rejections create new red cards in target department
   - Alterations create new yellow cards
   - Partial quantities supported

Use this document for:
- Understanding complete workflows
- Training new supervisors
- Debugging issues
- Development reference
- User acceptance testing
