# BlueShark Production Management System - Project Context

**Last Updated:** November 29, 2025
**AI Instance:** BlueShark-Stark
**Project Type:** Production Management SaaS for Garment Manufacturing
**Status:** Active Development

---

## Executive Summary

BlueShark is a **comprehensive production management system** specifically designed for textile and garment manufacturing facilities in Nepal. It provides end-to-end tracking from raw materials to finished goods with integrated quality control, worker management, and wage calculation.

---

## Core Purpose

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

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.2 | React-based web framework |
| React | 19.1.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.1.12 | Styling |
| Lucide React | 0.542.0 | Icons |
| @hello-pangea/dnd | 18.0.1 | Drag-and-drop |
| nepali-datepicker-reactjs | 1.1.9 | Nepali calendar |
| Axios | 1.11.0 | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js | REST API server |
| Node.js | Runtime |
| Prisma | ORM |
| PostgreSQL (Neon) | Serverless database |
| JWT | Authentication |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| Neon | PostgreSQL database |
| GitHub | Version control |

---

## Application Structure

```
blueshark-dev/
├── src/app/
│   ├── Components/           # Shared components
│   │   ├── Loader.tsx
│   │   └── NepaliDatePicker.tsx
│   ├── Dashboard/            # ADMIN routes
│   │   ├── page.tsx          # Admin main page
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── LeftSidebar.tsx
│   │   │   │   └── RightContent.tsx
│   │   │   ├── navigation/
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── SidebarItem.tsx
│   │   │   └── views/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── RollView.tsx
│   │   │       ├── BatchView.tsx
│   │   │       ├── SubBatchView.tsx
│   │   │       ├── ProductionView.tsx
│   │   │       ├── DepartmentView.tsx
│   │   │       ├── DepartmentForm.tsx
│   │   │       ├── Worker.tsx
│   │   │       ├── WageCalculation.tsx
│   │   │       ├── Inventory.tsx
│   │   │       ├── GenericView.tsx (Vendors)
│   │   │       ├── CreateSupervisor.tsx
│   │   │       ├── SettingsView.tsx
│   │   │       └── modals/
│   │   │           ├── AlterationModal.tsx
│   │   │           ├── RejectModal.tsx
│   │   │           └── ProductionTaskDetailsModal.tsx
│   │   └── types/
│   │       └── navigation.d.ts
│   ├── SupervisorDashboard/  # SUPERVISOR routes
│   │   ├── page.tsx          # Supervisor main page
│   │   ├── components/       # (mirrors Dashboard structure)
│   │   └── depcomponents/    # Department-specific components
│   │       ├── TaskDetailsModal.tsx
│   │       ├── WorkerAssignmentTable.tsx
│   │       ├── AddWorkerModal.tsx
│   │       ├── AlterationModal.tsx
│   │       ├── RejectionModal.tsx
│   │       ├── altered/
│   │       │   ├── AlteredTaskDetailsModal.tsx
│   │       │   └── AssignAlteredWorkerModal.tsx
│   │       └── rejected/
│   │           ├── RejectedTaskDetailsModal.tsx
│   │           └── AssignRejectedWorkerModal.tsx
│   ├── loginandsignup/       # Authentication
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx              # Root redirect
│   └── globals.css
├── blueshark-backend-test/   # Local backend for testing
├── docs/
│   ├── SYSTEM_ARCHITECTURE.md
│   └── INFRASTRUCTURE_AUDIT.md
├── .brain/                   # BlueShark-Stark brain system
├── .env                      # Environment variables
└── package.json
```

---

## User Roles & Access

### 1. Admin User
**Access:** Full system access
**Dashboard:** `/Dashboard`
**Capabilities:**
- Create and manage raw materials (rolls)
- Create production batches and sub-batches
- Configure department workflows
- Manage all workers across departments
- View complete production status (kanban)
- Calculate wages for all workers
- Manage inventory and vendors
- Create supervisor accounts

### 2. Supervisor User
**Access:** Department-specific only
**Dashboard:** `/SupervisorDashboard`
**Capabilities:**
- View tasks assigned to their department
- Assign workers to specific sub-batches
- Track work progress (New → In Progress → Completed)
- Mark items for rejection or alteration
- Advance completed work to next department
- Manage department workers

---

## Core Modules

### 1. Raw Material Management (Rolls)
- Track fabric rolls with name, quantity, unit (Kg/Meter), color
- Associate with vendor
- CRUD operations

### 2. Batch Management
- Create batches from rolls
- Auto-fill color and vendor from selected roll
- Batch quantity tracking

### 3. Sub-Batch Management (Production Orders)
- Define estimated pieces and expected items
- Set start/due dates (Nepali calendar)
- Add size categories (XL, L, M, S) with piece counts
- Add attachments/accessories (buttons, zippers)
- Configure multi-department workflow route
- Status: DRAFT → IN_PRODUCTION → COMPLETED → CANCELLED

### 4. Production Workflow (Kanban)
**Admin View:** All departments horizontally, sub-batches as cards
**Supervisor View:** Three columns (New Arrivals, In Progress, Completed)

**Card Colors:**
- Blue: Assigned to worker
- Gray: Unassigned (Main)
- Red: Rejected items
- Yellow: Altered items

### 5. Worker Assignment
- Assign workers to tasks with quantity
- Set work date (Nepali calendar)
- Mark as billable or non-billable
- Set unit price per piece
- Edit/delete assignments

### 6. Quality Control
**Rejections:** Mark defective items for return to previous departments
**Alterations:** Mark items needing modifications

### 7. Wage Calculation
- Select worker and date range
- View detailed work log breakdown
- Calculations: quantity × unit price
- Filter billable items only
- Grand total display

### 8. Inventory Management
- Track accessories, supplies, materials
- Add/subtract stock with history
- Associate with vendor

### 9. Vendor Management
- Maintain vendor database with contact info
- Link to rolls and batches

### 10. Department Management
- Create and configure departments
- Assign supervisors
- Define workflow sequences

---

## Database Schema (Core Tables)

```
Vendor → Roll → Batch → SubBatch
                           ↓
                  DepartmentSubBatch (junction)
                           ↓
                       WorkerLog
                           ↓
                        Worker
```

**Key Tables:**
- vendors
- rolls
- batches
- sub_batches
- size_details
- attachments
- departments
- department_sub_batches (junction for workflow)
- workers
- worker_logs
- inventory_items
- inventory_additions
- inventory_subtractions

---

## API Endpoints

**Base URL:** `https://blueshark-production.onrender.com/api` (Production)
**Local:** `http://localhost:5000/api` (Development)

### Authentication
- `POST /auth/login` - Admin login
- `POST /auth/supervisor-login` - Supervisor login

### Resources
- `/rolls` - CRUD
- `/batches` - CRUD
- `/sub-batches` - CRUD
- `/departments` - CRUD
- `/workers` - CRUD
- `/worker-logs` - CRUD
- `/inventory` - CRUD
- `/vendors` - CRUD
- `/supervisors` - CRUD

### Production Operations
- `POST /sub-batches/send-to-production`
- `POST /sub-batches/advance-department`
- `GET /department-sub-batches/sub-batch-history/:id`

---

## Recent Development Work

### November 2025 Sessions

**Session 2025-11-13:**
- Enhanced worker assignment validation
- Added edit/delete functionality for workers
- Implemented billable/not billable tracking
- Three-dot actions menu
- Department-based worker filtering
- Quantity-based department advancement

**Session 2025-11-22:**
- Batch-first selection with auto-fill roll
- Modal width consistency fixes
- Date input styling consistency
- Comprehensive UI consistency across all modals
- Standardized "Add" button styling

**Session 2025-11-29:**
- System architecture documentation
- Infrastructure audit
- Backend test setup (local development)

---

## Current Issues & Priorities

### Active Issues
1. Production DB tables may need verification
2. Environment variables need audit
3. Login URL configuration

### Development Priorities
1. Backend local development setup
2. Database schema verification
3. API endpoint testing
4. Feature completion

---

## Environment Configuration

### Development
```
Frontend: localhost:3000
Backend: localhost:5000
Database: Neon development branch
```

### Production
```
Frontend: edge-flow-gamma.vercel.app
Backend: edge-flow-backend.onrender.com
Database: Neon production branch
```

---

## Key Patterns Used

### State Management
- React Hooks (useState, useEffect, useCallback)
- No global state library
- Local component state with prop drilling

### Data Fetching
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await axios.get(API_URL);
    setData(response.data);
  } finally {
    setLoading(false);
  }
};
```

### Modal Pattern
- Slide-in drawer from right
- Full height, no border radius
- Blur backdrop
- Sticky footer buttons

### Form Validation
- Client-side validation
- Required field indicators
- Error messages via alert()

---

## Development Guidelines

### Code Style
- TypeScript strict mode
- TailwindCSS for styling
- Lucide React for icons
- Consistent component structure

### Naming Conventions
- PascalCase for components
- camelCase for functions/variables
- SCREAMING_SNAKE_CASE for constants

### File Organization
- Views in `components/views/`
- Modals in `components/views/modals/` or `depcomponents/`
- Types in `types/` directory

---

## Deployment

### Git Workflow
```
main (protected) ← PR from sadin/dev
     ↑
sadin/dev ← All development
```

### Auto-Deploy
- Vercel: Auto-deploys on push to main
- Render: Auto-deploys on push to main

---

**This context document is the source of truth for BlueShark-Stark AI assistant.**
