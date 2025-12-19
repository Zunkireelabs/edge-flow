# Super Supervisor User Guide

This guide explains how to use the new SUPER_SUPERVISOR role in BlueShark v2.

---

## What is a Super Supervisor?

A **Super Supervisor** is a supervisor with elevated privileges who can access and manage **all departments** in the system, rather than being assigned to a single department like regular supervisors.

### Comparison

| Feature | Supervisor | Super Supervisor |
|---------|------------|------------------|
| Department Access | Single assigned department | All departments |
| Dashboard Stats | Own department only | Aggregated or per-department |
| Worker Management | Own department workers | All workers |
| Sub-Batch Access | Own department | All departments |
| UI Theme | Blue accents | Purple accents |

---

## Creating a Super Supervisor

### Step 1: Access Admin Dashboard

1. Login as Admin
2. Navigate to **Settings > Supervisor** in the sidebar

### Step 2: Add New Supervisor

1. Click **"Add Supervisor"** button
2. Fill in the required fields:
   - **Name**: Supervisor's full name
   - **Email**: Login email address
   - **Password**: Initial password
   - **Role**: Select **"Super Supervisor"** from dropdown

### Step 3: Note About Department

When "Super Supervisor" is selected:
- The Department field is **automatically hidden**
- A purple info message appears: "Super Supervisors can access and manage all departments"

### Step 4: Save

Click **"Save Supervisor"** to create the account.

---

## Logging In as Super Supervisor

1. Go to the login page
2. Enter your email and password
3. You will be redirected to the **Supervisor Dashboard**
4. Notice the **purple user badge** indicating Super Supervisor role

---

## Using the Department Selector

The department selector appears in the **header** for Super Supervisors only.

### Location
Top-left of the header, next to the page title.

### Options

1. **Select Department** (default)
   - Amber/yellow styling
   - Shows aggregated stats on Dashboard
   - Workers view shows all workers
   - Kanban/Department View shows "Select a department" message

2. **Specific Department**
   - Blue styling when selected
   - All views filter to that department
   - Kanban board loads with department's tasks

### How to Use

1. Click the department selector button
2. A dropdown appears with:
   - Search input at top
   - "All Departments" option
   - List of individual departments
3. Click to select
4. All views update automatically

---

## Dashboard Overview

### When "All Departments" Selected

- **Purple banner**: "Viewing All Departments - Stats shown are aggregated across X departments"
- **Stats cards** show totals across all departments:
  - New Arrivals (sum of all departments)
  - In Progress (sum of all departments)
  - Completed (sum of all departments)
  - Active Workers (total across all departments)

### When Specific Department Selected

- Stats show only that department's numbers
- Subtitle updates to show department name

---

## Task Management (Kanban)

### When "All Departments" Selected

The Kanban board **does not load**. Instead, you see:

1. Amber building icon
2. "Select a Department" heading
3. Instruction text
4. List of available departments as badges

**Why?** The Kanban board is designed for managing tasks within a single department. Showing all departments would be overwhelming and impractical.

### When Specific Department Selected

- Full Kanban board loads
- Three columns: New Arrivals, In Progress, Completed
- All task management features work normally
- Click tasks to open details modal

---

## Workers View

### When "All Departments" Selected

- **Purple banner**: "Viewing All Departments - Showing workers across X departments (Y total workers)"
- Table shows workers from **all departments**
- Department column shows which department each worker belongs to

### When Specific Department Selected

- Shows only workers from that department
- Subtitle shows department name

---

## Sub-Batches View

Access via **"Sub-Batches"** in the sidebar.

### Features

1. **View all sub-batches** in table format
2. **Sort** by ID, Name, Pieces, Status
3. **Status badges**:
   - Draft (gray)
   - In Production (blue)
   - Completed (green)
   - Cancelled (red)

### Send to Production

1. Click **"Send to Dept"** button on a Draft sub-batch
2. Modal appears with:
   - Sub-batch name and piece count
   - Department dropdown
3. Select destination department
4. Click **"Send to Production"**
5. Confirmation dialog appears
6. Sub-batch is sent and status updates

### When "All Departments" Selected

- Purple banner shows count of sub-batches across all departments
- All sub-batches visible regardless of current department

---

## Visual Indicators

### Purple Theme Elements

Super Supervisors have purple accents to distinguish them:

| Element | Location | Description |
|---------|----------|-------------|
| User Badge | Header, top-right | Purple circle with user icon |
| Role Label | Header, below name | "Super Supervisor" in purple text |
| Info Banners | Various views | Purple background with Building2 icon |
| Department Selector | Header | Amber when "All", Blue when specific |

### Department Badges in Views

When viewing "All Departments", small badges show available departments as reference.

---

## Best Practices

### 1. Use Specific Departments for Task Management

Select a specific department before:
- Managing tasks on Kanban board
- Assigning workers to tasks
- Advancing tasks between departments

### 2. Use "All Departments" for Overview

Use the aggregated view for:
- Checking overall production stats
- Reviewing total worker count
- Getting a big-picture view

### 3. Check Multiple Departments

Quickly switch between departments to:
- Compare progress
- Identify bottlenecks
- Balance workload

---

## Troubleshooting

### Department Selector Not Showing

**Cause**: You may be logged in as a regular Supervisor, not Super Supervisor.

**Solution**:
1. Check the role badge in header (should say "Super Supervisor")
2. If it says "Supervisor", contact admin to update your role
3. Log out and log back in after role change

### Kanban Not Loading

**Cause**: "All Departments" is selected.

**Solution**: Select a specific department from the dropdown.

### Stats Showing Zero

**Cause**: API error or no data in departments.

**Solution**:
1. Check browser console for errors
2. Try refreshing the page
3. Verify departments have data in admin view

### Can't Send Sub-Batch to Production

**Cause**: Sub-batch may already be in production or completed.

**Solution**: Only sub-batches with "Draft" status can be sent to production.

---

## API Reference (For Developers)

### Login Response

```json
{
  "token": "jwt_token",
  "supervisor": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "SUPER_SUPERVISOR",
    "departmentId": null
  }
}
```

### Department-Specific API Calls

For SUPER_SUPERVISOR, add `departmentId` query param:

```
GET /api/departments/{departmentId}/sub-batches?departmentId=5
```

### LocalStorage Keys

| Key | Value for SUPER_SUPERVISOR |
|-----|---------------------------|
| `role` | `"SUPER_SUPERVISOR"` |
| `departmentId` | `""` (empty string) |
| `token` | JWT token |
| `userName` | Display name |

---

## Contact

For issues with Super Supervisor functionality, contact:
- System Administrator
- Development Team
