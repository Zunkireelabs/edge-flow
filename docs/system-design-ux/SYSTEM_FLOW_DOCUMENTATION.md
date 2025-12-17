# BlueShark System Flow Documentation

**Purpose:** Complete UX and Technical Flow Maps for Client Discussion
**Date:** December 16, 2025
**For:** Sadin's Client Meeting

---

## PART 1: HIGH-LEVEL UX FLOW (Business View)

### 1.1 System Overview - Two User Portals

```
+==============================================================================+
|                        BLUESHARK PRODUCTION MANAGEMENT                        |
+==============================================================================+
|                                                                              |
|    +---------------------------+       +---------------------------+         |
|    |      ADMIN PORTAL         |       |    SUPERVISOR PORTAL      |         |
|    |      /Dashboard           |       |   /SupervisorDashboard    |         |
|    +---------------------------+       +---------------------------+         |
|    |                           |       |                           |         |
|    | - Full system access      |       | - Department-only access  |         |
|    | - Create materials/batches|       | - View assigned tasks     |         |
|    | - Configure departments   |       | - Assign workers          |         |
|    | - Manage all workers      |       | - Report quality issues   |         |
|    | - View production kanban  |       | - Advance completed work  |         |
|    | - Calculate wages         |       | - Manage dept workers     |         |
|    | - Manage inventory        |       |                           |         |
|    |                           |       |                           |         |
|    +---------------------------+       +---------------------------+         |
|                                                                              |
+==============================================================================+
```

---

### 1.2 Admin Dashboard - Module Map

```
+==============================================================================+
|                           ADMIN DASHBOARD MODULES                             |
+==============================================================================+
|                                                                              |
|  +------------------+  +------------------+  +------------------+            |
|  |    DASHBOARD     |  |    ROLL VIEW     |  |   BATCH VIEW     |            |
|  |    (Overview)    |  |  (Raw Materials) |  | (Production Lots)|            |
|  +------------------+  +------------------+  +------------------+            |
|  | - Stats cards    |  | - CRUD rolls     |  | - CRUD batches   |            |
|  | - Recent activity|  | - Link to vendor |  | - Link to roll   |            |
|  | - Quick links    |  | - Track quantity |  | - Auto-fill color|            |
|  +------------------+  +------------------+  +------------------+            |
|          |                    |                      |                       |
|          v                    v                      v                       |
|  +------------------+  +------------------+  +------------------+            |
|  |  SUB-BATCH VIEW  |  |  PRODUCTION VIEW |  | DEPT KANBAN VIEW |            |
|  | (Work Orders)    |  | (All Departments)|  | (Single Dept)    |            |
|  +------------------+  +------------------+  +------------------+            |
|  | - CRUD sub-batch |  | - Horizontal cols|  | - 3-column board |            |
|  | - Size categories|  | - All depts shown|  | - Task cards     |            |
|  | - Attachments    |  | - Task cards     |  | - Status colors  |            |
|  | - Send to prod   |  | - Click for modal|  |                  |            |
|  | - Dept workflow  |  |                  |  |                  |            |
|  +------------------+  +------------------+  +------------------+            |
|          |                                                                   |
|          v                                                                   |
|  +------------------+  +------------------+  +------------------+            |
|  |   INVENTORY      |  | WAGE CALCULATION |  |    SETTINGS      |            |
|  | (Stock Tracking) |  |  (Worker Wages)  |  |   (Config)       |            |
|  +------------------+  +------------------+  +------------------+            |
|  | - CRUD items     |  | - Select worker  |  | > Vendors        |            |
|  | - Categories     |  | - Date range     |  | > Workers        |            |
|  | - Add/subtract   |  | - Billable filter|  | > Departments    |            |
|  | - Stock history  |  | - Wage breakdown |  | > Supervisors    |            |
|  +------------------+  +------------------+  +------------------+            |
|                                                                              |
+==============================================================================+
```

---

### 1.3 Supervisor Dashboard - Module Map

```
+==============================================================================+
|                        SUPERVISOR DASHBOARD MODULES                           |
+==============================================================================+
|                                                                              |
|  +------------------------+  +------------------------+  +------------------+|
|  |       DASHBOARD        |  |    TASK MANAGEMENT     |  |     WORKERS      ||
|  |       (Overview)       |  |    (Kanban Board)      |  |  (Dept Workers)  ||
|  +------------------------+  +------------------------+  +------------------+|
|  |                        |  |                        |  |                  ||
|  | Stats:                 |  | 3-Column Layout:       |  | - View workers   ||
|  | - New Arrivals count   |  |                        |  | - Add worker     ||
|  | - In Progress count    |  | [NEW] [PROGRESS] [DONE]|  | - Edit worker    ||
|  | - Completed count      |  |   |       |        |   |  | - Delete worker  ||
|  | - Active Workers       |  |   v       v        v   |  |                  ||
|  |                        |  | Cards   Cards   Cards  |  |                  ||
|  | Quick Actions:         |  |                        |  |                  ||
|  | - View Tasks           |  | Click Card = Modal     |  |                  ||
|  | - Manage Workers       |  |                        |  |                  ||
|  |                        |  |                        |  |                  ||
|  +------------------------+  +------------------------+  +------------------+|
|                                                                              |
+==============================================================================+
```

---

### 1.4 Core Production Flow - User Journey

```
+==============================================================================+
|                    PRODUCTION FLOW - END TO END JOURNEY                       |
+==============================================================================+

ADMIN ACTIONS:
==============

Step 1: Create Raw Material
+------------------+
|  CREATE ROLL     |
|------------------|
| Name: "Wool-001" |
| Qty: 100 kg      |
| Color: Red       |
| Vendor: ABC Ltd  |
+------------------+
        |
        v
Step 2: Create Batch from Roll
+------------------+
|  CREATE BATCH    |
|------------------|
| Name: "B-001"    |
| Roll: Wool-001   | <-- Auto-fills color & vendor
| Qty: 500 pcs     |
+------------------+
        |
        v
Step 3: Create Sub-Batch (Work Order)
+------------------------+
|  CREATE SUB-BATCH      |
|------------------------|
| Name: "SB-001"         |
| Batch: B-001           | <-- Auto-fills roll
| Est. Pieces: 500       |
| Start: 2081-09-01      |
| Due: 2081-09-15        |
|                        |
| Size Categories:       |
| - Small: 100 pcs       |
| - Medium: 200 pcs      |
| - Large: 150 pcs       |
| - XL: 50 pcs           |
|                        |
| Attachments:           |
| - Buttons: 500         |
| - Zippers: 500         |
+------------------------+
        |
        v
Step 4: Send to Production
+----------------------------------+
|  DEFINE DEPARTMENT WORKFLOW      |
|----------------------------------|
|                                  |
|  Select Departments in Order:    |
|                                  |
|  [Cutting] --> [Stitching] --> [QC] --> [Packaging]
|                                  |
|  Click: "Send to Production"     |
|                                  |
+----------------------------------+
        |
        | Status: DRAFT --> IN_PRODUCTION
        v

================================================================================

SUPERVISOR ACTIONS (Per Department):
====================================

Department 1: CUTTING
+------------------------------------------------------------------+
|                      KANBAN BOARD VIEW                            |
+------------------------------------------------------------------+
|                                                                   |
|  NEW ARRIVALS        IN PROGRESS         COMPLETED                |
|  +-----------+       +-----------+       +-----------+            |
|  |  SB-001   |       |           |       |           |            |
|  |-----------|       |           |       |           |            |
|  | 500 pcs   |       |           |       |           |            |
|  | [Main]    |       |           |       |           |            |
|  +-----------+       +-----------+       +-----------+            |
|       |                                                           |
|       | Click card                                                |
|       v                                                           |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                    TASK DETAILS MODAL                             |
+------------------------------------------------------------------+
|                                                                   |
|  Sub-Batch: SB-001              Status: NEW_ARRIVAL               |
|  Batch: B-001                   Qty Remaining: 500                |
|  Roll: Wool-001                                                   |
|                                                                   |
|  +-- ASSIGN WORKERS ------------------------------------------+   |
|  |                                                            |   |
|  |  Worker     | Date       | Qty  | Billable | Actions      |   |
|  |-------------|------------|------|----------|--------------|   |
|  |  Ram Kumar  | 2081-09-02 | 100  |    Yes   | [Edit] [Del] |   |
|  |  Sita Devi  | 2081-09-02 | 150  |    Yes   | [Edit] [Del] |   |
|  |                                                            |   |
|  |  [+ Add Worker]                                            |   |
|  +------------------------------------------------------------+   |
|                                                                   |
|  +-- ACTIONS -------------------------------------------------+   |
|  |  [Mark Alteration]  [Mark Rejection]                       |   |
|  +------------------------------------------------------------+   |
|                                                                   |
|  +-- SEND TO NEXT DEPARTMENT (when completed) ----------------+   |
|  |  Department: [Stitching v]                                 |   |
|  |  Quantity: [450] / 500 available                           |   |
|  |  [Send to Stitching]                                       |   |
|  +------------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+

        |
        | After all work done & sent
        v

Department 2: STITCHING
+------------------------------------------------------------------+
|  NEW ARRIVALS        IN PROGRESS         COMPLETED                |
|  +-----------+       +-----------+       +-----------+            |
|  |  SB-001   |       |           |       |           |            |
|  |-----------|       |           |       |           |            |
|  | 450 pcs   |       |           |       |           |            |
|  | [Main]    |       |           |       |           |            |
|  +-----------+       +-----------+       +-----------+            |
+------------------------------------------------------------------+
        |
        | (Same process: Assign workers, complete, send to next)
        v

Department 3: QC (Quality Check)
+------------------------------------------------------------------+
|  NEW ARRIVALS        IN PROGRESS         COMPLETED                |
|  +-----------+       +-----------+       +-----------+            |
|  |  SB-001   |       |           |       |           |            |
|  |-----------|       |           |       |           |            |
|  | 430 pcs   |       |           |       |           |            |
|  | [Main]    |       |           |       |           |            |
|  +-----------+       +-----------+       +-----------+            |
|                                                                   |
|  ** QUALITY ISSUES FOUND **                                       |
|  - 20 pcs need alteration --> [Mark Alteration]                   |
|  - 10 pcs rejected        --> [Mark Rejection]                    |
|                                                                   |
+------------------------------------------------------------------+
        |
        v

BRANCHING: Alteration & Rejection Cards
+------------------------------------------------------------------+
|                                                                   |
|  MAIN CARD (400 pcs)      ALTERED (20 pcs)     REJECTED (10 pcs)  |
|  +-------------+          +-------------+      +-------------+    |
|  |   [Main]    |          |  [Altered]  |      | [Rejected]  |    |
|  |   400 pcs   |          |    20 pcs   |      |   10 pcs    |    |
|  | --> Next    |          | --> Rework  |      | --> Return  |    |
|  +-------------+          +-------------+      +-------------+    |
|        |                        |                    |            |
|        v                        v                    v            |
|   [Packaging]             [Alteration Dept]    [Previous Dept]    |
|                                                                   |
+------------------------------------------------------------------+
        |
        v

Department 4: PACKAGING (Final Department)
+------------------------------------------------------------------+
|  NEW ARRIVALS        IN PROGRESS         COMPLETED                |
|  +-----------+       +-----------+       +-----------+            |
|  |  SB-001   |       |           |       |  SB-001   |            |
|  |-----------|       |           |       |-----------|            |
|  | 400 pcs   |       |           |       | 400 pcs   |            |
|  | [Main]    |       |           |       | [Done]    |            |
|  +-----------+       +-----------+       +-----------+            |
|                                                                   |
|  ** LAST DEPARTMENT - SPECIAL ACTION **                           |
|                                                                   |
|  [Mark Sub-batch as Completed]                                    |
|  Confirmation: Type "yes" to finalize                             |
|                                                                   |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
|                    PRODUCTION COMPLETE                            |
|------------------------------------------------------------------|
|  Sub-batch Status: COMPLETED                                      |
|  All worker logs finalized                                        |
|  Ready for wage calculation                                       |
+------------------------------------------------------------------+
```

---

### 1.5 Quality Control Flow - Alteration & Rejection

```
+==============================================================================+
|                    QUALITY CONTROL - BRANCHING WORKFLOW                       |
+==============================================================================+

NORMAL FLOW:
============
    [Main Card] --> [Dept 1] --> [Dept 2] --> [Dept 3] --> [DONE]
                      |            |            |
                      v            v            v
                  (Workers)   (Workers)    (Workers)


ALTERATION FLOW:
================
                           QUALITY ISSUE FOUND
                                   |
                                   v
+------------------------------------------------------------------+
|                    ALTERATION MODAL                               |
|------------------------------------------------------------------|
|  Worker whose work needs alteration: [Ram Kumar v]                |
|  Quantity to alter: [20] pieces                                   |
|  Reason: [Stitching pattern incorrect]                            |
|  Send to Department: [Stitching v] (previous dept)                |
|                                                                   |
|  [Cancel]                              [Mark for Alteration]      |
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                ALTERATION CARD CREATED                            |
|------------------------------------------------------------------|
|                                                                   |
|  Previous Dept (Stitching) receives:                              |
|                                                                   |
|  +-----------------------+                                        |
|  |    [ALTERED] Card     |  <-- Yellow badge                      |
|  |-----------------------|                                        |
|  | From: QC Dept         |                                        |
|  | Reason: Stitching...  |                                        |
|  | Qty: 20 pcs           |                                        |
|  +-----------------------+                                        |
|         |                                                         |
|         v                                                         |
|  Supervisor assigns workers to fix                                |
|  When done --> Send back to QC                                    |
|                                                                   |
+------------------------------------------------------------------+


REJECTION FLOW:
===============
                           DEFECTIVE ITEMS FOUND
                                   |
                                   v
+------------------------------------------------------------------+
|                    REJECTION MODAL                                |
|------------------------------------------------------------------|
|  Worker whose work is rejected: [Sita Devi v]                     |
|  Quantity rejected: [10] pieces                                   |
|  Reason: [Fabric tear, unfixable]                                 |
|                                                                   |
|  [Cancel]                              [Mark as Rejected]         |
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                REJECTION CARD CREATED                             |
|------------------------------------------------------------------|
|                                                                   |
|  Same Dept or Previous Dept receives:                             |
|                                                                   |
|  +-----------------------+                                        |
|  |   [REJECTED] Card     |  <-- Red badge                         |
|  |-----------------------|                                        |
|  | From: QC Dept         |                                        |
|  | Reason: Fabric tear   |                                        |
|  | Qty: 10 pcs           |                                        |
|  +-----------------------+                                        |
|         |                                                         |
|         v                                                         |
|  Track accountability                                             |
|  Attempt repair or write-off                                      |
|                                                                   |
+------------------------------------------------------------------+


CARD COLOR LEGEND:
==================
+------------------+--------------------------------------------------+
| Badge            | Meaning                                          |
+------------------+--------------------------------------------------+
| [Main]     Gray  | Original production card, no workers yet         |
| [Assigned] Blue  | Workers have been assigned to this card          |
| [Altered]  Yellow| Item sent for rework/alteration                  |
| [Rejected] Red   | Item marked as defective/rejected                |
| [Rework]   Amber | Alteration card with workers assigned            |
+------------------+--------------------------------------------------+
```

---

### 1.6 Wage Calculation Flow

```
+==============================================================================+
|                         WAGE CALCULATION FLOW                                 |
+==============================================================================+

Step 1: Select Parameters
+------------------------------------------------------------------+
|                    WAGE CALCULATION VIEW                          |
|------------------------------------------------------------------|
|                                                                   |
|  Worker: [All Workers v] or [Specific Worker v]                   |
|  Department: [All Departments v] or [Specific v]                  |
|  Date Range: [2081-09-01] to [2081-09-30]                         |
|  Filter: [x] Billable Only  [ ] All Work                          |
|                                                                   |
|  [Calculate Wages]                                                |
|                                                                   |
+------------------------------------------------------------------+
        |
        v
Step 2: View Results
+------------------------------------------------------------------+
|                       WAGE SUMMARY                                |
|------------------------------------------------------------------|
|                                                                   |
|  +----------------+  +----------------+  +----------------+       |
|  | Total Wages    |  | Billable Wages |  | Non-Billable   |       |
|  | Rs. 45,000     |  | Rs. 42,000     |  | Rs. 3,000      |       |
|  +----------------+  +----------------+  +----------------+       |
|                                                                   |
|  DETAILED BREAKDOWN:                                              |
|  +----------------------------------------------------------------+
|  | Worker    | Date       | Sub-batch | Qty  | Rate | Amount    |
|  |-----------|------------|-----------|------|------|-----------|
|  | Ram Kumar | 2081-09-02 | SB-001    | 100  | 50   | Rs. 5,000 |
|  | Ram Kumar | 2081-09-03 | SB-002    | 80   | 50   | Rs. 4,000 |
|  | Sita Devi | 2081-09-02 | SB-001    | 150  | 45   | Rs. 6,750 |
|  | ...       | ...        | ...       | ...  | ...  | ...       |
|  +----------------------------------------------------------------+
|                                                                   |
|  [Export to CSV]  [Print Report]                                  |
|                                                                   |
+------------------------------------------------------------------+
```

---

### 1.7 Inventory Management Flow

```
+==============================================================================+
|                        INVENTORY MANAGEMENT FLOW                              |
+==============================================================================+

INVENTORY ITEM LIFECYCLE:
=========================

Step 1: Create Category (if needed)
+---------------------------+
| CREATE CATEGORY           |
|---------------------------|
| Name: "Buttons"           |
| [Save]                    |
+---------------------------+
        |
        v
Step 2: Add Inventory Item
+---------------------------+
| CREATE ITEM               |
|---------------------------|
| Name: "Red Button 12mm"   |
| Category: Buttons         |
| Unit: pieces              |
| Initial Qty: 0            |
| Min Qty Alert: 100        |
| Vendor: XYZ Supplies      |
+---------------------------+
        |
        v
Step 3: Add Stock (Additions)
+---------------------------+
| ADD STOCK                 |
|---------------------------|
| Item: Red Button 12mm     |
| Quantity: 500             |
| Date: 2081-09-01          |
| Price: Rs. 5/pc           |
| Remarks: "Initial stock"  |
+---------------------------+
        |
        | Current Qty: 0 --> 500
        v
Step 4: Use Stock (Subtractions)
+---------------------------+
| SUBTRACT STOCK            |
|---------------------------|
| Item: Red Button 12mm     |
| Quantity: 100             |
| Reason: PRODUCTION_USE    |
| Sub-batch: SB-001         |
| Remarks: "For batch B-001"|
+---------------------------+
        |
        | Current Qty: 500 --> 400
        v
Step 5: Monitor Stock
+---------------------------+
| STOCK ALERT               |
|---------------------------|
| Red Button 12mm           |
| Current: 80 pcs           |
| Minimum: 100 pcs          |
| [!] LOW STOCK WARNING     |
+---------------------------+


SUBTRACTION REASONS:
====================
+------------------+----------------------------------+
| Reason Code      | Description                      |
+------------------+----------------------------------+
| PRODUCTION_USE   | Used in production               |
| DAMAGED          | Item damaged, write-off          |
| SAMPLE           | Given as sample                  |
| RETURNED         | Returned to vendor               |
| EXPIRED          | Item expired                     |
| OTHER            | Other reason (specify)           |
+------------------+----------------------------------+
```

---

## PART 2: TECHNICAL FLOW (Implementation View)

### 2.1 Database Entity Relationship

```
+==============================================================================+
|                    DATABASE ENTITY RELATIONSHIP DIAGRAM                       |
+==============================================================================+

+-------------+       +-------------+       +-------------+
|   vendors   |       |    rolls    |       |   batches   |
+-------------+       +-------------+       +-------------+
| id (PK)     |<------| vendor_id   |<------| roll_id     |
| name        |  1:N  | id (PK)     |  1:N  | vendor_id   |----+
| vat_pan     |       | name        |       | id (PK)     |    |
| address     |       | quantity    |       | name        |    |
| phone       |       | unit        |       | quantity    |    |
| comment     |       | color       |       | unit        |    |
+-------------+       +-------------+       | color       |    |
                                            +-------------+    |
                                                  |            |
                                                  | 1:N        |
                                                  v            |
                      +--------------------------------------------------+
                      |                    sub_batches                    |
                      +--------------------------------------------------+
                      | id (PK)                                          |
                      | name                                             |
                      | batch_id (FK) -----------------------------------+
                      | roll_id (FK)                                     |
                      | estimated_pieces                                 |
                      | expected_items                                   |
                      | start_date                                       |
                      | due_date                                         |
                      | status: DRAFT | IN_PRODUCTION | COMPLETED | CANCELLED
                      | total_quantity                                   |
                      | quantity_remaining                               |
                      +--------------------------------------------------+
                                |                    |
                                | 1:N                | 1:N
                                v                    v
              +--------------------+      +--------------------+
              |   size_details     |      |    attachments     |
              +--------------------+      +--------------------+
              | id (PK)            |      | id (PK)            |
              | sub_batch_id (FK)  |      | sub_batch_id (FK)  |
              | size_category      |      | attachment_name    |
              | quantity           |      | quantity           |
              +--------------------+      +--------------------+

+-------------+                           +---------------------------+
| departments |                           | department_sub_batches    |
+-------------+                           | (JUNCTION TABLE)          |
| id (PK)     |<--------------------------|---------------------------+
| name        |  1:N                      | id (PK)                   |
| description |                           | sub_batch_id (FK)         |
| supervisor_id                           | department_id (FK)        |
+-------------+                           | quantity_received         |
      |                                   | quantity_remaining        |
      |                                   | status: NEW_ARRIVAL |     |
      |                                   |   IN_PROGRESS | COMPLETED |
      | 1:N                               | remarks: Main | Assigned  |
      v                                   |   | Rejected | Altered    |
+-------------+                           | alteration_source_id (FK) |
|   workers   |                           | rejection_source_id (FK)  |
+-------------+                           | created_at                |
| id (PK)     |                           +---------------------------+
| name        |                                     |
| pan         |                                     | 1:N
| address     |                                     v
| department_id (FK)                      +---------------------------+
| wage_type   |                           |      worker_logs          |
| wage_rate   |                           +---------------------------+
+-------------+                           | id (PK)                   |
      |                                   | worker_id (FK)            |
      |                                   | department_sub_batch_id   |
      +---------------------------------->| sub_batch_id (FK)         |
                           N:1            | department_id (FK)        |
                                          | work_date                 |
                                          | quantity_worked           |
                                          | unit_price                |
                                          | is_billable               |
                                          | activity_type: NORMAL |   |
                                          |   ALTERED | REJECTED      |
                                          | particulars               |
                                          | created_at                |
                                          +---------------------------+

+--------------------+      +------------------------+      +------------------------+
| inventory_categories|      |    inventory_items     |      | inventory_additions    |
+--------------------+      +------------------------+      +------------------------+
| id (PK)            |<-----| category_id (FK)       |<-----| inventory_id (FK)      |
| name               |  1:N | id (PK)                |  1:N | id (PK)                |
+--------------------+      | name                   |      | quantity               |
                            | unit                   |      | date                   |
                            | quantity               |      | price                  |
                            | min_quantity           |      | remarks                |
                            | vendor (string)        |      +------------------------+
                            | phone                  |
                            | remarks                |      +------------------------+
                            +------------------------+      | inventory_subtractions |
                                    |                       +------------------------+
                                    +---------------------->| inventory_id (FK)      |
                                                       1:N  | id (PK)                |
                                                            | quantity               |
                                                            | reason                 |
                                                            | date                   |
                                                            | remarks                |
                                                            +------------------------+

+-------------+
| supervisors |
+-------------+
| id (PK)     |
| name        |
| email       |
| password    |
| department_id (FK)
+-------------+
```

---

### 2.2 API Endpoint Map

```
+==============================================================================+
|                           API ENDPOINT MAP                                    |
+==============================================================================+

BASE URL: https://edge-flow-backend.onrender.com/api

AUTHENTICATION:
===============
POST   /auth/login              --> Admin login, returns JWT token
POST   /auth/supervisor-login   --> Supervisor login, returns JWT + departmentId

ROLLS (Raw Materials):
======================
GET    /rolls                   --> List all rolls
POST   /rolls                   --> Create roll
PUT    /rolls/:id               --> Update roll
DELETE /rolls/:id               --> Delete roll

BATCHES:
========
GET    /batches                 --> List all batches (with roll, vendor included)
POST   /batches                 --> Create batch
PUT    /batches/:id             --> Update batch
DELETE /batches/:id             --> Delete batch (validates no sub-batches)

SUB-BATCHES:
============
GET    /sub-batches             --> List all sub-batches
POST   /sub-batches             --> Create sub-batch
PUT    /sub-batches/:id         --> Update sub-batch
DELETE /sub-batches/:id         --> Delete sub-batch

PRODUCTION OPERATIONS:
======================
POST   /sub-batches/send-to-production
       Payload: { subBatchId, manualDepartments[], total_quantity }
       Response: { success, workflow: { id, steps[] } }
       Effect: Creates department_sub_batches rows, status DRAFT --> IN_PRODUCTION

POST   /sub-batches/advance-department
       Payload: { departmentSubBatchId, toDepartmentId, quantityBeingSent }
       Response: { success, message }
       Effect: Creates new dept_sub_batch row in target department

GET    /department-sub-batches/sub-batch-history/:subBatchId
       Response: { department_flow, department_details[], worker_logs[] }

POST   /admin/production/alteration
       Payload: { workerId, quantity, note, returnToDepartmentId }
       Effect: Creates ALTERED department_sub_batch

POST   /admin/production/reject
       Payload: { workerId, quantity, reason }
       Effect: Creates REJECTED department_sub_batch

PUT    /admin/production/mark-complete
       Payload: { sub_batch_id }
       Effect: SubBatch status --> COMPLETED

DEPARTMENTS:
============
GET    /departments             --> List all departments
POST   /departments             --> Create department
PUT    /departments/:id         --> Update department
DELETE /departments/:id         --> Delete department
GET    /departments/:id/sub-batches --> Kanban data for single department

WORKERS:
========
GET    /workers                 --> List all workers
GET    /workers/department/:departmentId --> Workers in specific department
POST   /workers                 --> Create worker
PUT    /workers/:id             --> Update worker
DELETE /workers/:id             --> Delete worker

WORKER LOGS:
============
GET    /worker-logs/:departmentSubBatchId --> Logs for a task
POST   /worker-logs             --> Create worker assignment
PUT    /worker-logs/:id         --> Update worker log
DELETE /worker-logs/:id         --> Delete worker log

VENDORS:
========
GET    /vendors                 --> List all vendors
POST   /vendors                 --> Create vendor
PUT    /vendors/:id             --> Update vendor
DELETE /vendors/:id             --> Delete vendor

INVENTORY:
==========
GET    /inventory               --> List all inventory items
POST   /inventory               --> Create item
PUT    /inventory/:id           --> Update item
DELETE /inventory/:id           --> Delete item

GET    /inventory-categories    --> List categories
POST   /inventory-categories    --> Create category
PUT    /inventory-categories/:id --> Update category
DELETE /inventory-categories/:id --> Delete category

POST   /inventory-additions     --> Add stock
GET    /inventory-additions/inventory/:id --> Addition history

POST   /inventory-subtractions  --> Subtract stock
GET    /inventory-subtractions/inventory/:id --> Subtraction history

SUPERVISORS:
============
GET    /supervisors             --> List all supervisors
POST   /supervisors             --> Create supervisor
PUT    /supervisors/:id         --> Update supervisor
DELETE /supervisors/:id         --> Delete supervisor

SUPERVISOR-SPECIFIC:
====================
GET    /supervisors/sub-batches --> Kanban data for supervisor's department
       (Uses departmentId from JWT token)

WAGES:
======
GET    /wages/summary/:workerId --> Wage summary for worker
GET    /wages/details           --> Detailed wage breakdown with filters
```

---

### 2.3 Component Architecture

```
+==============================================================================+
|                        FRONTEND COMPONENT TREE                                |
+==============================================================================+

src/app/
|
+-- layout.tsx                    # Root layout with Providers
|   +-- Providers.tsx             # ToastContext wrapper
|       +-- ToastContext.tsx      # Global toast/confirm state
|       +-- Toast.tsx             # Toast notification component
|       +-- ConfirmModal.tsx      # Confirmation modal component
|
+-- loginandsignup/
|   +-- page.tsx                  # Login page (Admin + Supervisor)
|
+-- Dashboard/                    # ADMIN PORTAL
|   +-- page.tsx                  # Main admin page, manages activeView
|   +-- components/
|       +-- layout/
|       |   +-- Header.tsx        # Top header with user info
|       |   +-- LeftSidebar.tsx   # Navigation sidebar
|       |   +-- RightContent.tsx  # Main content area
|       |
|       +-- navigation/
|       |   +-- Navigation.tsx    # Nav item renderer
|       |   +-- SidebarItem.tsx   # Individual nav items
|       |
|       +-- views/
|           +-- Dashboard.tsx          # Overview stats
|           +-- RollView.tsx           # Roll CRUD
|           +-- BatchView.tsx          # Batch CRUD
|           +-- SubBatchView.tsx       # Sub-batch CRUD + Send to Production
|           +-- ProductionView.tsx     # Kanban (all departments)
|           +-- DepartmentView.tsx     # Kanban (single department)
|           +-- Inventory.tsx          # Inventory management
|           +-- WageCalculation.tsx    # Wage reports
|           +-- GenericView.tsx        # Vendor CRUD
|           +-- Worker.tsx             # Worker CRUD
|           +-- DepartmentForm.tsx     # Department CRUD
|           +-- CreateSupervisor.tsx   # Supervisor CRUD
|           +-- SettingsView.tsx       # Settings (placeholder)
|           +-- modals/
|               +-- ProductionTaskDetailsModal.tsx
|               +-- AlterationModal.tsx
|               +-- RejectModal.tsx
|
+-- SupervisorDashboard/          # SUPERVISOR PORTAL
    +-- page.tsx                  # Main supervisor page
    +-- components/
    |   +-- layout/
    |   |   +-- Header.tsx
    |   |   +-- LeftSidebar.tsx
    |   |   +-- ContentRouter.tsx
    |   |
    |   +-- navigation/
    |   |   +-- Navigation.tsx
    |   |
    |   +-- views/
    |       +-- Dashboard.tsx      # Supervisor overview
    |       +-- DepartmentView.tsx # Kanban board
    |       +-- Worker.tsx         # Dept worker management
    |
    +-- depcomponents/            # Task-specific components
        +-- TaskDetailsModal.tsx       # Normal task modal
        +-- AddRecordModal.tsx         # Add worker assignment
        +-- EditRecordModal.tsx        # Edit worker record
        +-- WorkerAssignmentTable.tsx  # Worker table
        +-- AlterationModal.tsx        # Create alteration
        +-- RejectionModal.tsx         # Create rejection
        |
        +-- altered/
        |   +-- AlteredTaskDetailsModal.tsx    # Rework task modal
        |   +-- AssignAlteredWorkerModal.tsx   # Assign to rework
        |
        +-- rejected/
            +-- RejectedTaskDetailsModal.tsx   # Rejection task modal
            +-- AssignRejectedWorkerModal.tsx  # Assign to rejection fix
```

---

### 2.4 State Management Flow

```
+==============================================================================+
|                          STATE MANAGEMENT FLOW                                |
+==============================================================================+

AUTHENTICATION STATE:
=====================
localStorage:
+---------------------------+
| token    | "Bearer xxx"   |  --> Used in all API calls
| role     | "ADMIN" or     |  --> Determines which dashboard
|          | "SUPERVISOR"   |
| departmentId | "1"        |  --> Supervisor's department (if supervisor)
| userId   | "5"            |  --> Current user ID
| userName | "John"         |  --> Display name
| userEmail| "john@..."     |  --> Display email
+---------------------------+


VIEW STATE (Per Component):
===========================
Each view manages its own state:

+------------------------------------------------------------------+
|  BatchView.tsx Example                                            |
|------------------------------------------------------------------|
|                                                                   |
|  // Data state                                                    |
|  const [batches, setBatches] = useState<Batch[]>([]);             |
|  const [loading, setLoading] = useState(false);                   |
|  const [error, setError] = useState<string | null>(null);         |
|                                                                   |
|  // UI state                                                      |
|  const [isModalOpen, setIsModalOpen] = useState(false);           |
|  const [editingBatch, setEditingBatch] = useState<Batch | null>();|
|  const [selectedIds, setSelectedIds] = useState<number[]>([]);    |
|                                                                   |
|  // Filter state                                                  |
|  const [selectedUnit, setSelectedUnit] = useState("all");         |
|  const [selectedColor, setSelectedColor] = useState("all");       |
|  const [sortColumn, setSortColumn] = useState("id");              |
|  const [sortDirection, setSortDirection] = useState("desc");      |
|                                                                   |
|  // Pagination state                                              |
|  const [currentPage, setCurrentPage] = useState(1);               |
|  const [itemsPerPage, setItemsPerPage] = useState(25);            |
|                                                                   |
+------------------------------------------------------------------+


DATA FETCH PATTERN:
===================

+-------------------+
| Component Mounts  |
+-------------------+
        |
        v
+-------------------+
| useEffect(() => { |
|   fetchData();    |
| }, []);           |
+-------------------+
        |
        v
+-------------------+
| setLoading(true)  |
+-------------------+
        |
        v
+-------------------+     +-------------------+
| axios.get(API)    |---->| Backend API       |
| with Bearer token |     | Returns JSON      |
+-------------------+     +-------------------+
        |
        v
+-------------------+
| setData(response) |
| setLoading(false) |
+-------------------+
        |
        v
+-------------------+
| useMemo: Filter,  |
| Sort, Paginate    |
+-------------------+
        |
        v
+-------------------+
| Render Table      |
+-------------------+


MODAL STATE FLOW:
=================

User Click "Add"
      |
      v
+------------------+
| setIsModalOpen   |
|   (true)         |
| setEditingItem   |
|   (null)         |
+------------------+
      |
      v
+------------------+
| Modal Renders    |
| (Create Mode)    |
+------------------+
      |
      | User fills form
      v
+------------------+
| handleSubmit()   |
| axios.post()     |
+------------------+
      |
      v
+------------------+
| showToast        |
|   ("success")    |
| fetchData()      |  <-- Refresh list
| closeModal()     |
+------------------+


User Click "Edit"
      |
      v
+------------------+
| setIsModalOpen   |
|   (true)         |
| setEditingItem   |
|   (selectedItem) |
+------------------+
      |
      v
+------------------+
| Modal Renders    |
| (Edit Mode)      |
| Form pre-filled  |
+------------------+
      |
      | User modifies
      v
+------------------+
| handleSubmit()   |
| axios.put()      |
+------------------+
      |
      v
+------------------+
| showToast        |
|   ("success")    |
| fetchData()      |
| closeModal()     |
+------------------+
```

---

### 2.5 Production Workflow - Technical Sequence

```
+==============================================================================+
|                  PRODUCTION WORKFLOW - TECHNICAL SEQUENCE                     |
+==============================================================================+

1. SEND TO PRODUCTION
=====================

Frontend (SubBatchView.tsx):
+------------------------------------------------------------------+
| handleSendToProduction() {                                        |
|   const payload = {                                               |
|     subBatchId: selectedSubBatch.id,                              |
|     manualDepartments: [1, 2, 3, 4],  // dept IDs in order        |
|     total_quantity: 500                                           |
|   };                                                              |
|   axios.post('/sub-batches/send-to-production', payload);         |
| }                                                                 |
+------------------------------------------------------------------+
        |
        v
Backend:
+------------------------------------------------------------------+
| POST /sub-batches/send-to-production                              |
|------------------------------------------------------------------|
| 1. Validate sub-batch exists and is DRAFT                         |
| 2. Create workflow record                                         |
| 3. For each department in manualDepartments:                      |
|    - INSERT INTO department_sub_batches (                         |
|        sub_batch_id, department_id,                               |
|        quantity_received, quantity_remaining,                     |
|        status: 'NEW_ARRIVAL', remarks: 'Main'                     |
|      )                                                            |
| 4. UPDATE sub_batches SET status = 'IN_PRODUCTION'                |
| 5. Return { success: true, workflow }                             |
+------------------------------------------------------------------+
        |
        v
Database State After:
+------------------------------------------------------------------+
| sub_batches:                                                      |
|   id: 1, status: 'IN_PRODUCTION'                                  |
|                                                                   |
| department_sub_batches:                                           |
|   id: 1, sub_batch_id: 1, dept_id: 1, qty: 500, status: NEW      |
|   id: 2, sub_batch_id: 1, dept_id: 2, qty: 0, status: PENDING    |
|   id: 3, sub_batch_id: 1, dept_id: 3, qty: 0, status: PENDING    |
|   id: 4, sub_batch_id: 1, dept_id: 4, qty: 0, status: PENDING    |
+------------------------------------------------------------------+


2. WORKER ASSIGNMENT
====================

Frontend (TaskDetailsModal.tsx):
+------------------------------------------------------------------+
| handleAssignWorker() {                                            |
|   const payload = {                                               |
|     worker_id: selectedWorkerId,                                  |
|     department_sub_batch_id: taskData.id,                         |
|     sub_batch_id: taskData.sub_batch_id,                          |
|     department_id: taskData.department_id,                        |
|     work_date: selectedDate,                                      |
|     quantity_worked: 100,                                         |
|     unit_price: 50,                                               |
|     is_billable: true,                                            |
|     activity_type: 'NORMAL'                                       |
|   };                                                              |
|   axios.post('/worker-logs', payload);                            |
| }                                                                 |
+------------------------------------------------------------------+
        |
        v
Backend:
+------------------------------------------------------------------+
| POST /worker-logs                                                 |
|------------------------------------------------------------------|
| 1. Validate worker exists and belongs to department               |
| 2. Validate quantity <= quantity_remaining                        |
| 3. INSERT INTO worker_logs (...)                                  |
| 4. UPDATE department_sub_batches                                  |
|    SET quantity_remaining = quantity_remaining - 100              |
|    SET status = 'IN_PROGRESS' (if was NEW_ARRIVAL)                |
| 5. Return { success: true }                                       |
+------------------------------------------------------------------+


3. DEPARTMENT ADVANCEMENT
=========================

Frontend (TaskDetailsModal.tsx):
+------------------------------------------------------------------+
| handleAdvanceDepartment() {                                       |
|   const payload = {                                               |
|     departmentSubBatchId: taskData.id,                            |
|     toDepartmentId: nextDeptId,                                   |
|     quantityBeingSent: 450                                        |
|   };                                                              |
|   axios.post('/sub-batches/advance-department', payload);         |
| }                                                                 |
+------------------------------------------------------------------+
        |
        v
Backend:
+------------------------------------------------------------------+
| POST /sub-batches/advance-department                              |
|------------------------------------------------------------------|
| 1. Validate current dept is COMPLETED or has available qty        |
| 2. Validate toDepartmentId is next in workflow                    |
| 3. UPDATE current department_sub_batches                          |
|    SET status = 'COMPLETED'                                       |
| 4. UPDATE target department_sub_batches                           |
|    SET quantity_received = 450,                                   |
|        quantity_remaining = 450,                                  |
|        status = 'NEW_ARRIVAL'                                     |
| 5. Return { success: true }                                       |
+------------------------------------------------------------------+


4. ALTERATION CREATION
======================

Frontend (AlterationModal.tsx):
+------------------------------------------------------------------+
| handleCreateAlteration() {                                        |
|   const payload = {                                               |
|     worker_log_id: selectedWorkerLog.id,                          |
|     quantity: 20,                                                 |
|     reason: "Stitching pattern incorrect",                        |
|     return_to_department_id: previousDeptId                       |
|   };                                                              |
|   axios.post('/admin/production/alteration', payload);            |
| }                                                                 |
+------------------------------------------------------------------+
        |
        v
Backend:
+------------------------------------------------------------------+
| POST /admin/production/alteration                                 |
|------------------------------------------------------------------|
| 1. Validate worker_log exists                                     |
| 2. Validate quantity <= worker_log.quantity_worked                |
| 3. INSERT INTO department_sub_batches (                           |
|      sub_batch_id, department_id: return_to_department_id,        |
|      quantity_received: 20, quantity_remaining: 20,               |
|      status: 'NEW_ARRIVAL', remarks: 'Altered',                   |
|      alteration_source_id: original_dept_sub_batch_id             |
|    )                                                              |
| 4. UPDATE original worker_log (mark as altered)                   |
| 5. Return { success: true }                                       |
+------------------------------------------------------------------+


5. MARK COMPLETE (Final Department)
===================================

Frontend (TaskDetailsModal.tsx):
+------------------------------------------------------------------+
| handleMarkComplete() {                                            |
|   const payload = { sub_batch_id: subBatchId };                   |
|   axios.put('/admin/production/mark-complete', payload);          |
| }                                                                 |
+------------------------------------------------------------------+
        |
        v
Backend:
+------------------------------------------------------------------+
| PUT /admin/production/mark-complete                               |
|------------------------------------------------------------------|
| 1. Validate this is the last department in workflow               |
| 2. UPDATE department_sub_batches SET status = 'COMPLETED'         |
| 3. UPDATE sub_batches SET status = 'COMPLETED'                    |
| 4. Return { success: true }                                       |
+------------------------------------------------------------------+
```

---

## PART 3: SUMMARY QUICK REFERENCE

### 3.1 User Actions by Role

```
+==============================================================================+
|                         USER ACTIONS BY ROLE                                  |
+==============================================================================+

ADMIN CAN:
==========
[x] Create/Edit/Delete Rolls
[x] Create/Edit/Delete Batches
[x] Create/Edit/Delete Sub-batches
[x] Define department workflow
[x] Send sub-batch to production
[x] View production kanban (all departments)
[x] Create/Edit/Delete Departments
[x] Create/Edit/Delete Workers (all)
[x] Create/Edit/Delete Vendors
[x] Create/Edit/Delete Supervisors
[x] Manage Inventory (add/subtract)
[x] Calculate wages for any worker
[x] View all production data

SUPERVISOR CAN:
===============
[x] View their department's kanban board
[x] See tasks in: New Arrivals, In Progress, Completed
[x] Assign workers to tasks
[x] Edit/Delete worker assignments
[x] Mark items for Alteration (send to previous dept)
[x] Mark items for Rejection
[x] Advance completed work to next department
[x] Mark sub-batch as completed (if last dept)
[x] Manage workers in their department only
[ ] Cannot see other departments
[ ] Cannot create batches/sub-batches
[ ] Cannot configure system settings
```

---

### 3.2 Status Transitions Summary

```
+==============================================================================+
|                          STATUS TRANSITIONS                                   |
+==============================================================================+

SUB-BATCH STATUS:
=================
    DRAFT
      |
      | [Send to Production]
      v
    IN_PRODUCTION
      |
      | [Mark Complete at last dept]
      v
    COMPLETED

    (or CANCELLED if manually cancelled)


DEPARTMENT_SUB_BATCH STATUS:
============================
    NEW_ARRIVAL
      |
      | [First worker assigned]
      v
    IN_PROGRESS
      |
      | [All work done + sent to next]
      v
    COMPLETED


CARD REMARKS (Visual Badge):
============================
    Main      --> Original production line (gray)
    Assigned  --> Has workers assigned (blue)
    Altered   --> Rework item (yellow)
    Rejected  --> Defective item (red)
    Rework    --> Altered with workers (amber)
```

---

### 3.3 Key File Locations

```
+==============================================================================+
|                           KEY FILE LOCATIONS                                  |
+==============================================================================+

FRONTEND:
=========
Admin Dashboard Entry:     src/app/Dashboard/page.tsx
Admin Views:               src/app/Dashboard/components/views/
Supervisor Dashboard:      src/app/SupervisorDashboard/page.tsx
Supervisor Views:          src/app/SupervisorDashboard/components/views/
Task Modals:               src/app/SupervisorDashboard/depcomponents/
Shared Components:         src/app/Components/
Styles:                    src/app/globals.css

BACKEND:
========
Controllers:               blueshark-backend-test/backend/src/controllers/
Services:                  blueshark-backend-test/backend/src/services/
Routes:                    blueshark-backend-test/backend/src/routes/
Prisma Schema:             blueshark-backend-test/backend/prisma/schema.prisma

CONFIG:
=======
Environment Variables:     .env (local), .env.production (Vercel)
Brain Files:               .brain/
Documentation:             docs/
```

---

## NEXT STEPS

This document provides the complete current state of BlueShark.

**For the client meeting:**
1. Use Part 1 (UX Flow) diagrams to discuss current workflow
2. Mark areas where client wants changes
3. Identify dependencies using Part 2 (Technical Flow)

**After meeting:**
1. Document requested changes
2. Analyze impact on existing flows
3. Plan implementation phases

---

**Document Created:** December 16, 2025
**For:** BlueShark UX Flow Discussion with Client
