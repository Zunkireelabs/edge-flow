# BlueShark Backlog

**Purpose:** Single source of truth for all actionable items - bugs, UI issues, features, and technical debt.

**Last Updated:** 2025-12-01

---

## Quick Summary

| Category | Open | Fixed/Done |
|----------|------|------------|
| Bugs | 0 | 4 |
| UI/UX Issues | 6 | 0 |
| Feature Backlog | 3 | 0 |
| QC Quick Wins | 0 | 1 |

---

## Bugs (Fix Required)

| ID | Severity | Description | Found In | Status |
|----|----------|-------------|----------|--------|
| BUG-001 | **Critical** | `getWorkersByDepartment()` queried wrong column. Workers not showing in Supervisor dropdown. | Scenario 1 | ✅ FIXED |
| BUG-002 | **Medium** | Kanban card only showed "Worked" for Assigned cards, not Main cards. | Scenario 1 | ✅ FIXED |
| BUG-003 | **Medium** | Data sync - Kanban showed `quantity_assigned` (stale) instead of calculated worked value. | Scenario 4 Pre-test | ✅ FIXED |
| BUG-004 | **Medium** | Stage not auto-updating to IN_PROGRESS when workers assigned. Cards stayed in New Arrivals. | Scenario 4 Pre-test | ✅ FIXED |

---

## UI/UX Issues

| ID | Severity | Description | Found In | Status |
|----|----------|-------------|----------|--------|
| UI-001 | Low | Roll Name shows Batch name in Task Details modal | Scenario 1 | 🔴 Open |
| UI-002 | Low | Dates show "Jan 1, 1970" (Unix epoch default) when not set | Scenario 1 | 🔴 Open |
| UI-004 | Medium | Native browser alert for "Stage updated successfully!" - should use Toast | Scenario 1 | 🔴 Open |
| UI-S2-001 | Medium | Data doesn't auto-refresh after worker assignment (requires manual refresh) | Scenario 2 | 🔴 Open |
| UI-S2-002 | Low | Native browser alert for "Successfully sent to department!" - should use Toast | Scenario 2 | 🔴 Open |
| UI-003 | Low | Activity History "Arrived at Department" shows "Date not available" - backend API not returning `createdAt` field | QC Session | 🔴 Open |

---

## Feature Backlog

| ID | Priority | Description | Source | Status |
|----|----------|-------------|--------|--------|
| BACKLOG-001 | Medium | Hide "Mark Sub-batch as Completed" button until LAST department in workflow | Scenario 2 | 🔴 Open |
| BACKLOG-002 | Medium | Full audit trail with stage change logging (for Production) | QC Session | 🔴 Open |
| BACKLOG-003 | Low | Rejection reporting dashboard - view all rejections by worker/batch/department/date range | QC Session | 🔴 Open |

---

## QC Quick Wins

| ID | Priority | Description | Purpose | Status |
|----|----------|-------------|---------|--------|
| QC-001 | High | Add History tab to TaskDetailsModal showing worker_logs + department transfers | Helps debug during QC testing | ✅ Done |

---

## Technical Debt

| ID | Priority | Description | Status |
|----|----------|-------------|--------|
| TECH-001 | Low | `updateWorkerLog` in workerLogService.ts sets `quantity_assigned` directly instead of calculating delta | 🔴 Open |
| TECH-002 | Medium | Kanban API should include `quantity_rejected` summary field to display accurate "Worked" (good pieces only) vs "Processed" (all assigned). Currently showing "Processed" as workaround. | 🔴 Open |

---

## How to Use This File

### Adding New Items
1. Find the appropriate category
2. Add new row with next ID (e.g., BUG-004, UI-005)
3. Include "Found In" to link back to scenario/source
4. Set status to 🔴 Open

### Updating Status
- 🔴 Open - Not started
- 🔄 In Progress - Being worked on
- ✅ FIXED/Done - Completed
- ⏸️ Deferred - Postponed intentionally

### Linking to Scenarios
Issues found during QC should:
1. Be documented in detail in the scenario file (full context)
2. Be summarized here for tracking (actionable item)

---

## Status Legend

- 🔴 Open
- 🔄 In Progress
- ✅ FIXED / Done
- ⏸️ Deferred

---

*See also: [QC Session Notes](./qc-session-notes/README.md) for detailed test scenarios*
