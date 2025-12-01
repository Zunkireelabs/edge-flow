# BlueShark Production - Product Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Roles & Personas](#user-roles--personas)
4. [Core Features](#core-features)
5. [User Stories](#user-stories)
6. [User Flows](#user-flows)
7. [Technical Architecture](#technical-architecture)
8. [Feature Roadmap](#feature-roadmap)
9. [Metrics & KPIs](#metrics--kpis)

---

## Executive Summary

**Product Name:** BlueShark Production Management System

**Purpose:** A comprehensive web-based production management system designed specifically for garment manufacturing facilities in Nepal.

**Target Market:** Textile and garment manufacturing companies requiring multi-department workflow management, worker tracking, quality control, and wage calculation.

**Key Value Propositions:**
- End-to-end production tracking from raw materials to finished goods
- Multi-department workflow management with visual kanban boards
- Integrated quality control (rejections and alterations)
- Automated wage calculation for piece-rate, hourly, and daily workers
- Role-based access control (Admin vs Supervisor)
- Nepali calendar (Bikram Sambat) integration

**Technology Stack:**
- Frontend: Next.js 15 + React 19 + TypeScript
- Styling: TailwindCSS 4
- Backend API: Node.js (hosted on Render.com)
- Authentication: JWT token-based

---

## Product Overview

### What Problem Does It Solve?

**Before BlueShark:**
- Manual tracking of production across departments
- Difficulty monitoring worker productivity
- Complex wage calculations done manually
- No visibility into production bottlenecks
- Quality issues (rejections/alterations) not tracked systematically
- Lost or misplaced inventory

**After BlueShark:**
- Real-time production visibility across all departments
- Automated worker assignment and tracking
- One-click wage calculation with detailed breakdowns
- Visual kanban boards showing production status
- Systematic quality control workflow
- Complete inventory management with history

### Core Modules

1. **Raw Material Management** - Track fabric rolls and materials
2. **Batch Management** - Create production batches
3. **Sub-Batch Management** - Define detailed production orders
4. **Production Workflow** - Visual kanban board across departments
5. **Worker Management** - Track workers, assignments, and productivity
6. **Quality Control** - Manage rejections and alterations
7. **Wage Calculation** - Automated wage computation
8. **Inventory Management** - Track accessories and supplies
9. **Vendor Management** - Maintain vendor database

---

## User Roles & Personas

### 1. Admin User

**Primary Persona:** Ramesh Kumar - Production Manager
- Age: 35-45
- Role: Oversees entire production facility
- Tech Savviness: Moderate
- Goals: Maximize production efficiency, reduce waste, track costs

**Responsibilities:**
- Create and manage raw materials (rolls)
- Create production batches and sub-batches
- Configure department workflows
- Manage all workers across departments
- View complete production status
- Calculate wages for all workers
- Manage inventory and vendors
- Create supervisor accounts

**Access Level:** Full system access

**Pain Points:**
- Needs visibility into all departments simultaneously
- Must track quality issues across the entire workflow
- Requires accurate wage calculations for payroll
- Needs to identify bottlenecks quickly

---

### 2. Supervisor User

**Primary Persona:** Sita Sharma - Stitching Department Supervisor
- Age: 28-40
- Role: Manages specific department (e.g., Cutting, Stitching)
- Tech Savviness: Low to Moderate
- Goals: Complete department tasks on time, maintain quality, manage team

**Responsibilities:**
- View tasks assigned to their department
- Assign workers to specific sub-batches
- Track work progress (New → In Progress → Completed)
- Mark items for rejection or alteration
- Advance completed work to next department
- Manage department workers

**Access Level:** Department-specific only

**Pain Points:**
- Needs simple interface to assign work
- Must track which workers are working on what
- Needs to handle quality issues (rejects/alterations) easily
- Must ensure quantities match across handoffs

---

## Core Features

### Feature 1: Raw Material Management

**Description:** Track all raw materials (fabric rolls) coming into the facility.

**User Story:** As an Admin, I want to create and track fabric rolls so that I can manage raw material inventory.

**Key Capabilities:**
- Create roll with name, quantity, unit (Kg/Meter), color
- Associate with vendor
- Edit/delete rolls
- View all rolls in table format

**Business Rules:**
- Roll quantity must be positive
- Each roll must have a vendor
- Unit can be Kilogram or Meter

---

### Feature 2: Batch Management

**Description:** Group rolls into production batches.

**User Story:** As an Admin, I want to create batches from rolls so that I can organize production orders.

**Key Capabilities:**
- Create batch from existing rolls
- Auto-fill color and vendor from selected roll
- Define batch quantity
- Edit/delete batches
- Preview batch details

**Business Rules:**
- Batch must be linked to a roll
- Color and vendor inherited from roll
- Batch quantity cannot exceed roll quantity

---

### Feature 3: Sub-Batch Management (Production Orders)

**Description:** Create detailed production orders with sizes, quantities, and department workflows.

**User Story:** As an Admin, I want to create sub-batches with size details and department workflows so that I can send specific orders to production.

**Key Capabilities:**
- Define estimated pieces and expected items
- Set start and due dates (Nepali calendar)
- Add multiple size categories (XL, L, M, S) with piece counts
- Add attachments/accessories (buttons, zippers) with quantities
- Configure multi-department workflow route
- Send to production with status tracking

**Business Rules:**
- Must have at least one size category
- Start date cannot be after due date
- Must select at least one department for workflow
- Status: DRAFT → IN_PRODUCTION → COMPLETED → CANCELLED

**Acceptance Criteria:**
- [ ] Can add unlimited size categories
- [ ] Can add unlimited attachments
- [ ] Can select multiple departments in sequence
- [ ] Start/due dates use Nepali calendar
- [ ] Validation prevents invalid quantities

---

### Feature 4: Production Kanban Board (Admin View)

**Description:** Visual overview of all sub-batches across all departments.

**User Story:** As an Admin, I want to see all production tasks across departments in one view so that I can identify bottlenecks and monitor progress.

**Key Capabilities:**
- Horizontal columns for each department
- Vertical rows for each sub-batch
- Color-coded cards:
  - Blue: Assigned to worker
  - Gray: Unassigned (Main)
  - Red: Rejected items
  - Yellow: Altered items
- Click card to view details
- View worker assignments
- See rejection/alteration status

**Business Rules:**
- Only shows sub-batches in IN_PRODUCTION status
- Cards update in real-time based on supervisor actions
- Each department shows current tasks

**Acceptance Criteria:**
- [ ] Displays all departments horizontally
- [ ] Shows sub-batch name, dates, quantities
- [ ] Color coding is accurate
- [ ] Click opens detailed modal
- [ ] Updates without page refresh

---

### Feature 5: Department Kanban Board (Supervisor View)

**Description:** Department-specific task management board for supervisors.

**User Story:** As a Supervisor, I want to see tasks assigned to my department in a kanban board so that I can manage workflow efficiently.

**Key Capabilities:**
- Three columns: New Arrivals, In Progress, Completed
- Drag-and-drop capability (future)
- Click card to open task details
- Assign workers to tasks
- Mark rejections and alterations
- Advance to next department

**Business Rules:**
- Only shows tasks for supervisor's assigned department
- New Arrivals: Tasks just received (stage: NEW_ARRIVAL)
- In Progress: Tasks being worked on (stage: IN_PROGRESS)
- Completed: Tasks finished (stage: COMPLETED)

**Acceptance Criteria:**
- [ ] Only department-specific tasks visible
- [ ] Three columns clearly labeled
- [ ] Cards show key information (name, dates, quantities)
- [ ] Click opens detailed modal
- [ ] Real-time updates

---

### Feature 6: Worker Assignment

**Description:** Assign workers to specific tasks with quantity tracking.

**User Story:** As a Supervisor, I want to assign workers to sub-batches so that I can track who is working on what.

**Key Capabilities:**
- Select worker from department dropdown
- Enter quantity being assigned
- Set work date (Nepali calendar)
- Mark as billable or non-billable
- Set unit price per piece
- View all worker logs for a task
- Edit/delete worker assignments

**Business Rules:**
- Can only assign workers from same department
- Quantity assigned cannot exceed remaining quantity
- Worker must exist in system
- Each assignment creates a worker log entry

**Acceptance Criteria:**
- [ ] Dropdown shows only department workers
- [ ] Quantity validation prevents over-assignment
- [ ] Date picker uses Nepali calendar
- [ ] Billable toggle works correctly
- [ ] Worker log updates immediately
- [ ] Remaining quantity updates after assignment

---

### Feature 7: Quality Control - Rejections (Scrap/Waste)

**Description:** Mark defective items as permanent waste/scrap that cannot be fixed.

**User Story:** As a Supervisor, I want to mark unfixable defective items as rejected/scrapped so that they are logged as inventory loss.

**Key Capabilities:**
- Open reject modal from task details
- Select worker whose work has defects (accountability tracking)
- Enter rejection reason
- Specify quantity being rejected
- System logs rejection as permanent waste
- NO card created - items are discarded

**Business Rules:**
- Reject quantity cannot exceed worker's assigned quantity
- Must provide rejection reason
- ✅ Can reject from ANY department (including first department)
- NO new card created - items are permanent loss
- Quantity permanently reduced from inventory
- Logged in wastage/rejection records for analysis

**Acceptance Criteria:**
- [ ] Modal opens with form fields
- [ ] Worker dropdown shows workers with assigned work
- [ ] Reason field is required
- [ ] Quantity validation works (max = worker's assigned qty)
- [ ] NO card created (items scrapped)
- [ ] Original card's quantity reduced permanently
- [ ] Rejection logged with worker accountability

---

### Feature 8: Quality Control - Alterations (Send Back for Rework)

**Description:** Send fixable defective items back to a PREVIOUS department for rework.

**User Story:** As a Supervisor, I want to send items with fixable defects back to a previous department so that they can be reworked and returned to production.

**Key Capabilities:**
- Open alteration modal from task details
- Select worker whose work has fixable defects
- Enter alteration reason (what needs to be fixed)
- Specify quantity for alteration
- Select PREVIOUS department to send items to (for rework)
- System creates new "Altered" card (yellow) in target department
- Items return to production after rework is complete

**Business Rules:**
- Alteration quantity cannot exceed worker's assigned quantity
- Must provide alteration reason
- ❌ CANNOT alter from FIRST department (no previous department to send back to)
- Can only send to departments BEFORE current in workflow
- New yellow card created with "Altered" badge
- Links to original sub-batch for traceability
- Appears in target department's kanban as "New Arrival"

**Acceptance Criteria:**
- [ ] Modal opens with form fields
- [ ] Worker dropdown shows workers with assigned work
- [ ] Reason field is required
- [ ] Quantity validation works (max = worker's assigned qty)
- [ ] Department dropdown shows ONLY previous departments in workflow
- [ ] First department shows "Cannot send for alteration from first department"
- [ ] New yellow card appears in target department
- [ ] Original card's quantity reduced
- [ ] Alteration reason and source visible in new card

---

### Feature 9: Advance to Next Department

**Description:** Move completed work to the next department in the workflow.

**User Story:** As a Supervisor, I want to advance completed work to the next department so that production continues flowing.

**Key Capabilities:**
- Select next department from workflow
- Enter quantity being advanced
- Validate against remaining quantity
- System moves task to next department
- Updates status automatically

**Business Rules:**
- Next department determined by original workflow route
- Quantity advanced cannot exceed remaining quantity
- Task appears in next department's "New Arrivals"
- Previous department shows reduced quantity

**Acceptance Criteria:**
- [ ] Shows next department in workflow
- [ ] Quantity input with validation
- [ ] Submit creates task in next department
- [ ] Previous department quantity updates
- [ ] Status changes appropriately

---

### Feature 10: Worker Management

**Description:** Maintain database of all workers across departments.

**User Story:** As an Admin, I want to manage all workers so that I can assign them to departments and track their information.

**Key Capabilities:**
- Create worker with name, PAN, address
- Assign to department
- Set wage type (HOURLY, PIECE_RATE, DAILY)
- Set wage rate
- Edit/delete workers
- View all workers in table

**Business Rules:**
- Worker can belong to one department
- PAN number required for wage calculations
- Wage type determines payment calculation
- Wage rate must be positive number

**Acceptance Criteria:**
- [ ] Form validates all required fields
- [ ] Department dropdown populated
- [ ] Wage type dropdown has 3 options
- [ ] Can edit existing workers
- [ ] Delete confirmation before removing
- [ ] Table shows all workers with actions

---

### Feature 11: Wage Calculation

**Description:** Calculate worker wages for a specified date range.

**User Story:** As an Admin, I want to calculate worker wages for a date range so that I can process payroll accurately.

**Key Capabilities:**
- Select worker from dropdown
- Set start and end date (Nepali calendar)
- View detailed work log breakdown
- See calculations: quantity × unit price
- Filter billable items only
- Display grand total
- Edit individual log entries

**Business Rules:**
- Only billable items included in total by default
- Calculation: quantity_worked × unit_price
- Grouped by date and sub-batch
- Shows size category and particulars

**Acceptance Criteria:**
- [ ] Worker dropdown shows all workers
- [ ] Date range picker uses Nepali calendar
- [ ] Table displays all logs in range
- [ ] Calculations are accurate
- [ ] Grand total updates dynamically
- [ ] Billable filter works correctly
- [ ] Can edit unit price inline

---

### Feature 12: Inventory Management

**Description:** Track accessories, supplies, and materials with addition/subtraction history.

**User Story:** As an Admin, I want to track inventory items so that I can manage stock levels and avoid shortages.

**Key Capabilities:**
- Create inventory item with name, unit, quantity, price
- Associate with vendor
- Add stock with date and remarks
- Subtract stock with date and purpose
- View addition history
- View subtraction history
- Delete inventory items

**Business Rules:**
- Inventory ID auto-generated (I001, I002, etc.)
- Quantity cannot go negative
- Each addition/subtraction tracked separately
- Date tracked using Nepali calendar

**Acceptance Criteria:**
- [ ] Create form validates all fields
- [ ] Inventory ID auto-increments
- [ ] Add stock increases quantity
- [ ] Subtract stock decreases quantity
- [ ] History tables show all transactions
- [ ] Can delete additions/subtractions
- [ ] Current quantity updates in real-time

---

### Feature 13: Vendor Management

**Description:** Maintain vendor database with contact information.

**User Story:** As an Admin, I want to manage vendors so that I can track suppliers for materials and inventory.

**Key Capabilities:**
- Create vendor with name, VAT/PAN, address, phone
- Add comments/notes
- Edit vendor information
- Delete vendors
- Preview vendor details
- Link to rolls and batches

**Business Rules:**
- Vendor name required
- VAT/PAN optional but recommended
- Can be associated with multiple rolls/batches

**Acceptance Criteria:**
- [ ] Form validates vendor name
- [ ] All fields editable
- [ ] Preview shows all vendor info
- [ ] Delete confirmation before removing
- [ ] Vendor appears in roll/batch dropdowns

---

### Feature 14: Supervisor Account Management

**Description:** Admin can create and manage supervisor accounts.

**User Story:** As an Admin, I want to create supervisor accounts so that I can assign department management to supervisors.

**Key Capabilities:**
- Create supervisor with name, email, password
- Assign to department
- Edit supervisor details
- Delete supervisor accounts
- View all supervisors

**Business Rules:**
- Supervisor can only access assigned department
- Email must be unique
- Password required for authentication
- One supervisor per department recommended

**Acceptance Criteria:**
- [ ] Form validates email format
- [ ] Password field secure
- [ ] Department assignment works
- [ ] Supervisor can login
- [ ] Supervisor sees only their department
- [ ] Delete removes supervisor access

---

### Feature 15: Department Management

**Description:** Create and configure production departments.

**User Story:** As an Admin, I want to create departments so that I can organize the production workflow.

**Key Capabilities:**
- Create department with name
- Assign supervisor
- View department details
- Edit department information
- Delete departments

**Business Rules:**
- Department name must be unique
- Each department can have one supervisor
- Multiple workers can belong to department

**Acceptance Criteria:**
- [ ] Department name validated
- [ ] Supervisor dropdown populated
- [ ] Can edit department name and supervisor
- [ ] Delete removes department
- [ ] Department appears in workflow selections

---

## User Stories

### Epic 1: Production Setup

**US-001:** As an Admin, I want to add fabric rolls to the system so that I can track raw materials.
- **Acceptance Criteria:**
  - Can enter roll name, quantity, unit, color
  - Can select vendor from dropdown
  - Form validates required fields
  - Roll appears in rolls list immediately

**US-002:** As an Admin, I want to create batches from rolls so that I can organize production orders.
- **Acceptance Criteria:**
  - Can select existing roll
  - Color and vendor auto-fill from roll
  - Can specify batch quantity
  - Batch appears in batches list

**US-003:** As an Admin, I want to create sub-batches with detailed specifications so that production can begin.
- **Acceptance Criteria:**
  - Can add multiple size categories
  - Can add multiple attachments
  - Can select start and due dates
  - Can configure department workflow
  - Can send to production

---

### Epic 2: Production Workflow

**US-004:** As a Supervisor, I want to see new tasks in my department so that I can start assigning work.
- **Acceptance Criteria:**
  - New tasks appear in "New Arrivals" column
  - Can see sub-batch name, dates, quantities
  - Can click to view details

**US-005:** As a Supervisor, I want to assign workers to tasks so that work can begin.
- **Acceptance Criteria:**
  - Can select worker from department
  - Can enter quantity
  - Can set work date
  - Worker assignment creates log entry
  - Remaining quantity updates

**US-006:** As a Supervisor, I want to mark tasks as in progress so that everyone knows work has started.
- **Acceptance Criteria:**
  - Can change status to "In Progress"
  - Task moves to "In Progress" column
  - Status visible to Admin in production view

**US-007:** As a Supervisor, I want to advance completed work to the next department so that production continues.
- **Acceptance Criteria:**
  - Can select next department
  - Can specify quantity advancing
  - Task appears in next department's "New Arrivals"
  - Remaining quantity updates

---

### Epic 3: Quality Control

**US-008:** As a Supervisor, I want to reject defective items so that they can be reworked.
- **Acceptance Criteria:**
  - Can enter rejection reason
  - Can specify reject quantity
  - Can select return department
  - New red "Rejected" card created
  - Appears in target department

**US-009:** As a Supervisor, I want to mark items for alteration so that they can be modified.
- **Acceptance Criteria:**
  - Can enter alteration reason
  - Can specify alteration quantity
  - Can select alteration department
  - New yellow "Altered" card created
  - Appears in target department

**US-010:** As an Admin, I want to track all rejections and alterations across departments so that I can identify quality issues.
- **Acceptance Criteria:**
  - Can see all rejected items (red cards) in production view
  - Can see all altered items (yellow cards) in production view
  - Can view rejection/alteration reasons
  - Can track source and destination departments

---

### Epic 4: Worker Management

**US-011:** As an Admin, I want to add workers to the system so that supervisors can assign them to tasks.
- **Acceptance Criteria:**
  - Can enter worker name, PAN, address
  - Can assign to department
  - Can set wage type and rate
  - Worker appears in supervisor's dropdown

**US-012:** As a Supervisor, I want to view all workers in my department so that I know who is available.
- **Acceptance Criteria:**
  - Can navigate to Workers view
  - See only department workers
  - See worker details (name, PAN, wage info)

**US-013:** As an Admin, I want to calculate worker wages for a date range so that I can process payroll.
- **Acceptance Criteria:**
  - Can select any worker
  - Can set date range
  - See detailed work log
  - See accurate wage calculations
  - See grand total

---

### Epic 5: Inventory Management

**US-014:** As an Admin, I want to add inventory items so that I can track supplies.
- **Acceptance Criteria:**
  - Can create inventory with name, unit, quantity, price
  - Can associate with vendor
  - Inventory ID auto-generated

**US-015:** As an Admin, I want to add stock to inventory so that I can update quantities when I purchase.
- **Acceptance Criteria:**
  - Can select inventory item
  - Can enter quantity to add
  - Can set date and remarks
  - Inventory quantity increases
  - Addition recorded in history

**US-016:** As an Admin, I want to subtract stock from inventory so that I can track usage.
- **Acceptance Criteria:**
  - Can select inventory item
  - Can enter quantity to subtract
  - Can set date and purpose
  - Inventory quantity decreases
  - Subtraction recorded in history

---

### Epic 6: Reporting & Analytics (Future)

**US-017:** As an Admin, I want to see production statistics on the dashboard so that I can monitor performance.
- **Status:** Planned
- **Acceptance Criteria:**
  - Dashboard shows total sub-batches in production
  - Shows completed sub-batches count
  - Shows department utilization
  - Shows average completion time

**US-018:** As an Admin, I want to export wage calculations to CSV so that I can use them in accounting software.
- **Status:** Planned
- **Acceptance Criteria:**
  - Export button on wage calculation view
  - CSV includes all log details
  - File named with worker and date range

---

## User Flows

### Flow 1: Complete Production Cycle (Happy Path)

```
Admin:
1. Login at /loginandsignup
2. Navigate to Roll View
3. Create new roll: "Blue Cotton Fabric, 100kg, Vendor: ABC Textiles"
4. Navigate to Batch View
5. Create batch from roll: "Batch-001"
6. Navigate to Sub-Batch View
7. Create sub-batch:
   - Name: "Blue T-Shirts Order #001"
   - Estimated: 500 pieces
   - Sizes: XL(100), L(150), M(200), S(50)
   - Attachments: Buttons(500), Labels(500)
   - Dates: 2081/08/01 to 2081/08/15
   - Workflow: Cutting → Stitching → Finishing → Packing
8. Click "Send to Production"
9. Navigate to Production View
10. See sub-batch card in "Cutting" department column

Cutting Supervisor:
1. Login at /loginandsignup
2. See "Blue T-Shirts Order #001" in "New Arrivals"
3. Click card to open details
4. Click "Assign Worker"
5. Select Worker: "Ram Bahadur"
6. Enter quantity: 250
7. Set date: 2081/08/05
8. Mark as billable
9. Submit
10. Click "Update Status" → "In Progress"
11. Card moves to "In Progress" column
12. Worker completes cutting
13. Open card details
14. Click "Advance to Next Department"
15. Select: Stitching
16. Enter quantity: 250
17. Submit

Stitching Supervisor:
1. See "Blue T-Shirts Order #001" in "New Arrivals"
2. Assign to workers
3. During work, finds 10 defective pieces
4. Open card details
5. Click "Reject"
6. Enter reason: "Wrong cut size"
7. Quantity: 10
8. Send to: Cutting
9. Submit
10. New red "Rejected" card appears in Cutting
11. Continue stitching remaining 240
12. Advance 240 to Finishing

Finishing Supervisor:
1. Receives 240 pieces
2. Assigns workers
3. Completes finishing
4. Advances to Packing

Packing Supervisor:
1. Receives 240 pieces
2. Assigns workers
3. Marks as "Completed"

Admin:
1. Views Production View
2. Sees sub-batch progress across all departments
3. Sees rejected items being reworked in Cutting
4. Navigates to Wage Calculation
5. Selects worker: "Ram Bahadur"
6. Sets date range: 2081/08/01 to 2081/08/15
7. Sees all work logs
8. Sees total wage: NPR 12,500
9. Exports for payroll
```

---

### Flow 2: Rejection Workflow

```
Supervisor (Stitching Department):
1. Working on sub-batch "Blue T-Shirts"
2. Finds 15 pieces have wrong cut size
3. Opens task details modal
4. Clicks "Reject Items" button
5. Reject modal opens
6. Enters:
   - Reason: "Fabric cut too small for size specifications"
   - Quantity: 15
   - Send to: Cutting Department
7. Clicks "Submit Rejection"
8. Modal closes
9. Sees notification: "15 items rejected and sent to Cutting"
10. Original card quantity reduced by 15
11. New red card appears: "Blue T-Shirts (Rejected)"

Supervisor (Cutting Department):
1. Sees new red card in "New Arrivals"
2. Badge shows "Rejected from Stitching"
3. Opens card details
4. Sees rejection reason: "Fabric cut too small..."
5. Assigns to worker for rework
6. Worker re-cuts 15 pieces
7. Advances 15 pieces back to Stitching
8. Rejected card moves to "Completed"

Supervisor (Stitching):
1. Receives reworked 15 pieces
2. Processes normally
3. Advances to next department
```

---

### Flow 3: Worker Assignment & Wage Calculation

```
Supervisor:
1. Opens task: "Blue T-Shirts - 500 pieces"
2. Clicks "Assign Worker"
3. Modal opens with form:
   - Worker dropdown (shows only department workers)
   - Quantity field (max: 500)
   - Date picker (Nepali calendar)
   - Unit price field
   - Billable checkbox
4. Fills form:
   - Worker: "Sita Kumari"
   - Quantity: 100
   - Date: 2081/08/05
   - Unit price: NPR 5
   - Billable: Yes
5. Clicks "Assign"
6. Worker log created:
   - Worker: Sita Kumari
   - Quantity: 100
   - Date: 2081/08/05
   - Total: NPR 500 (100 × 5)
7. Remaining quantity: 400
8. Repeats for other workers

Admin (End of Week):
1. Navigates to Wage Calculation
2. Selects worker: "Sita Kumari"
3. Sets date range: 2081/08/01 to 2081/08/07
4. Clicks "Calculate"
5. Table shows all logs:
   | Date | Size | Particulars | Qty | Rate | Total | Billable |
   |------|------|-------------|-----|------|-------|----------|
   | 08/05| M    | Blue T-Shirts| 100 | 5    | 500   | Yes      |
   | 08/06| L    | Red Shirts   | 80  | 6    | 480   | Yes      |
   | 08/06| XL   | Black Pants  | 50  | 8    | 400   | No       |
6. Grand Total (Billable only): NPR 980
7. Exports to CSV for payroll
```

---

## Technical Architecture

### System Architecture

```
Client (Browser)
    ↓
Next.js 15 Frontend (React 19)
    ↓
Axios HTTP Client
    ↓
JWT Token Authentication
    ↓
REST API (Node.js Backend)
    ↓
PostgreSQL Database
```

### Frontend Architecture

**Framework:** Next.js 15 (App Router)
**UI Library:** React 19
**Language:** TypeScript
**Styling:** TailwindCSS 4
**State Management:** React Hooks (useState, useEffect, useCallback)

**Folder Structure:**
```
src/app/
├── Components/              # Shared components
│   ├── Loader.tsx
│   └── NepaliDatePicker.tsx
├── Dashboard/               # Admin routes
│   └── components/          # Admin components
├── SupervisorDashboard/     # Supervisor routes
│   └── components/          # Supervisor components
├── loginandsignup/          # Auth page
├── globals.css
├── layout.tsx
└── page.tsx
```

### Backend API

**Base URL:** `https://blueshark-production.onrender.com/api`
**Authentication:** JWT Bearer Token
**Response Format:** JSON

**Key Endpoints:**
- Auth: `/api/auth/*`
- Rolls: `/api/rolls/*`
- Batches: `/api/batches/*`
- Sub-batches: `/api/sub-batches/*`
- Departments: `/api/departments/*`
- Workers: `/api/workers/*`
- Worker Logs: `/api/worker-logs/*`
- Inventory: `/api/inventory/*`
- Vendors: `/api/vendors/*`
- Supervisors: `/supervisors/*`
- Production: `/api/production-view`

### Database Schema (Inferred)

**Tables:**
- users (admin, supervisor)
- departments
- workers
- vendors
- rolls
- batches
- sub_batches
- size_details
- attachments
- department_sub_batches (junction table for workflow)
- worker_logs
- inventory_items
- inventory_additions
- inventory_subtractions
- rejection_entries
- alteration_entries

### Authentication Flow

```
1. User submits login (email + password)
2. Backend validates credentials
3. Backend generates JWT token
4. Frontend stores:
   - token (localStorage)
   - role (ADMIN or SUPERVISOR)
   - departmentId (for supervisors)
5. All API requests include:
   Authorization: Bearer <token>
6. Backend validates token on each request
7. Backend authorizes based on role and department
```

### State Management Pattern

**No Global State Library** - Uses React Hooks

**Pattern:**
```typescript
// Component-level state
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [isModalOpen, setIsModalOpen] = useState(false);

// Data fetching
useEffect(() => {
  fetchData();
}, []);

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const response = await axios.get(API_URL);
    setData(response.data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, []);

// User actions trigger refetch
const handleSubmit = async () => {
  await saveData();
  fetchData(); // Refresh
};
```

---

## Feature Roadmap

### Phase 1: Current Features (Completed)
- ✅ Raw material management
- ✅ Batch and sub-batch creation
- ✅ Multi-department workflow
- ✅ Kanban boards (Admin & Supervisor)
- ✅ Worker assignment
- ✅ Quality control (reject/alter)
- ✅ Wage calculation
- ✅ Inventory management
- ✅ Vendor management
- ✅ Role-based access control

### Phase 2: Enhancements (Next 3 Months)

**Priority: High**
- [ ] Dashboard analytics and statistics
  - Total production count
  - Department utilization rates
  - Average completion time per sub-batch
  - Quality metrics (reject/alter rates)
  - Worker productivity stats

- [ ] Export functionality
  - Wage calculations to CSV/PDF
  - Production reports
  - Inventory reports
  - Worker productivity reports

- [ ] Notifications system
  - Task assignments
  - Approaching deadlines
  - Quality issues
  - Inventory low stock alerts

- [ ] Search and filtering
  - Search sub-batches by name/date
  - Filter by department/status
  - Filter workers by department
  - Advanced date range filters

**Priority: Medium**
- [ ] Drag-and-drop on kanban boards
- [ ] Bulk worker assignments
- [ ] Print sub-batch labels/cards
- [ ] Task comments/notes
- [ ] File attachments (images, PDFs)

**Priority: Low**
- [ ] Mobile responsive improvements
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] User preferences

### Phase 3: Advanced Features (6-12 Months)

- [ ] Production planning & forecasting
  - Estimate completion dates
  - Resource allocation optimization
  - Capacity planning

- [ ] Quality control analytics
  - Defect tracking by worker
  - Rejection rate trends
  - Root cause analysis

- [ ] Inventory automation
  - Auto-deduct inventory on production
  - Reorder point alerts
  - Vendor performance tracking

- [ ] Advanced reporting
  - Custom report builder
  - Scheduled reports
  - Email reports

- [ ] Mobile app (React Native)
  - Supervisor mobile access
  - Worker self-service portal
  - QR code scanning for tasks

- [ ] Integration capabilities
  - Accounting software integration
  - WhatsApp notifications
  - API for third-party integrations

### Phase 4: Enterprise Features (Future)

- [ ] Multi-factory support
- [ ] Advanced permissions (custom roles)
- [ ] Audit logs
- [ ] Data backup and restore
- [ ] Multi-language support (Nepali localization)
- [ ] Offline mode
- [ ] Real-time collaboration
- [ ] Video training modules

---

## Metrics & KPIs

### Product Metrics to Track

**User Engagement:**
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Session duration
- Feature adoption rate
- Login frequency

**Production Metrics:**
- Sub-batches created per week
- Average sub-batch completion time
- On-time completion rate
- Department throughput
- Bottleneck identification

**Quality Metrics:**
- Rejection rate (% of total production)
- Alteration rate (% of total production)
- Rejection rate by department
- Top rejection reasons
- Quality improvement over time

**Worker Metrics:**
- Worker productivity (pieces per day)
- Worker utilization rate
- Average wage per worker
- Billable vs non-billable work ratio

**Inventory Metrics:**
- Inventory turnover rate
- Stock-out incidents
- Inventory value
- Usage trends

**System Performance:**
- Page load time
- API response time
- Error rate
- Uptime

### Success Criteria

**Month 1:**
- All departments onboarded
- All workers added to system
- 50+ sub-batches created
- 90% of production tracked digitally

**Month 3:**
- 100% production tracked digitally
- Wage calculation saving 10+ hours/week
- Quality issue resolution time reduced 50%
- Zero manual tracking spreadsheets

**Month 6:**
- Production cycle time reduced 20%
- Rejection rate reduced 30%
- Admin reporting time reduced 80%
- Supervisor satisfaction score > 4/5

---

## Competitive Advantage

**Why BlueShark vs Alternatives:**

1. **Industry-Specific:** Built specifically for garment manufacturing
2. **Nepali Calendar:** Native support for Nepal business practices
3. **Quality Control:** Integrated rejection/alteration workflow
4. **Wage Calculation:** Automated piece-rate wage calculation
5. **Visual Workflow:** Kanban boards for easy understanding
6. **Role-Based:** Proper separation of admin and supervisor duties
7. **Affordable:** No per-user pricing (self-hosted option)

**Compared to Generic Systems:**
- No need for complex configuration
- Industry-specific terminology and workflows
- Faster onboarding and training
- Lower total cost of ownership

---

## Risk & Mitigation

### Technical Risks

**Risk:** Backend hosted on free Render.com tier may have downtime
- **Mitigation:** Upgrade to paid tier for production use

**Risk:** No data backup mechanism
- **Mitigation:** Implement daily automated backups to cloud storage

**Risk:** Client-side state management causes data staleness
- **Mitigation:** Implement auto-refresh or move to global state

### Business Risks

**Risk:** Low user adoption due to complexity
- **Mitigation:** Simplified UI, training videos, in-person onboarding

**Risk:** Resistance to digital transformation
- **Mitigation:** Show ROI early, run parallel with manual process initially

**Risk:** Internet connectivity issues in factory
- **Mitigation:** Plan offline mode for Phase 3

### Security Risks

**Risk:** JWT tokens in localStorage vulnerable to XSS
- **Mitigation:** Move to httpOnly cookies, implement CSRF protection

**Risk:** No rate limiting on login endpoint
- **Mitigation:** Add rate limiting, implement account lockout

**Risk:** No audit trail for sensitive actions
- **Mitigation:** Add audit logging for critical operations

---

## Conclusion

BlueShark Production is a **comprehensive, purpose-built production management system** for garment manufacturing. It successfully addresses the core pain points of production tracking, worker management, quality control, and wage calculation.

**Key Strengths:**
- Complete feature set for garment production workflow
- Intuitive visual interfaces (kanban boards)
- Nepali calendar integration for local market
- Role-based access control
- Integrated quality control

**Next Steps:**
1. Gather user feedback from current usage
2. Prioritize Phase 2 enhancements based on user needs
3. Implement analytics and reporting
4. Add export functionality
5. Improve error handling and user feedback
6. Create comprehensive user documentation and training materials

**Target Users:** Small to medium-sized garment manufacturing facilities in Nepal looking to digitize their production management.
