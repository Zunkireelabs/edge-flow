# QC Session Notes - BlueShark

**Purpose:** Document all QC testing sessions, findings, and issues for systematic review and fixing.

> **📋 Master Backlog:** See [BACKLOG.md](../BACKLOG.md) for consolidated view of all open items

---

## Test Scenarios

| # | Scenario | File | Status | Issues Found |
|---|----------|------|--------|--------------|
| 1 | Partial Worker Assignment (No Splitting) | [SCENARIO_1_PARTIAL_WORKER_ASSIGNMENT.md](./SCENARIO_1_PARTIAL_WORKER_ASSIGNMENT.md) | ✅ PASSED | BUG-001, BUG-002, UI-001 to UI-004 |
| 2 | Complete Work & Transfer to Next Department | [SCENARIO_2_COMPLETE_WORK_AND_TRANSFER.md](./SCENARIO_2_COMPLETE_WORK_AND_TRANSFER.md) | ✅ PASSED | UI-S2-001, UI-S2-002, BACKLOG-001 |
| 3 | Multiple Workers on Same Sub-Batch | [SCENARIO_3_MULTIPLE_WORKERS_SAME_BATCH.md](./SCENARIO_3_MULTIPLE_WORKERS_SAME_BATCH.md) | ✅ PASSED | None |
| 4 | Rejection Flow | ⏳ Pending | ⏳ Pending | - |
| 5 | Alteration Flow | ⏳ Pending | ⏳ Pending | - |
| 6 | Full End-to-End Workflow | ⏳ Pending | ⏳ Pending | - |

---

## Issue Summary

### Bugs Found & Fixed

| ID | Scenario | Severity | Description | Status |
|----|----------|----------|-------------|--------|
| BUG-001 | 1 | **Critical** | `getWorkersByDepartment()` queried wrong column. Workers not showing in Supervisor dropdown. | ✅ FIXED |
| BUG-002 | 1 | **Medium** | Kanban card only showed "Worked" for Assigned cards, not Main cards. | ✅ FIXED |
| BUG-003 | 4 (pre-test) | **Medium** | Data sync - Kanban showed stale `quantity_assigned` instead of calculated worked value. | ✅ FIXED |
| BUG-004 | 4 (pre-test) | **Medium** | Stage not auto-updating to IN_PROGRESS when workers assigned. Cards stayed in New Arrivals. | ✅ FIXED |

### UI/UX Issues

| ID | Scenario | Severity | Description | Status |
|----|----------|----------|-------------|--------|
| UI-001 | 1 | Low | Roll Name shows Batch name in Task Details | 🔴 Open |
| UI-002 | 1 | Low | Dates show "Jan 1, 1970" (Unix epoch default) | 🔴 Open |
| UI-004 | 1 | Medium | Native browser alert for "Stage updated successfully!" | 🔴 Open |
| UI-S2-001 | 2 | Medium | Data doesn't auto-refresh after worker assignment | 🔴 Open |
| UI-S2-002 | 2 | Low | Native browser alert for "Successfully sent to department!" | 🔴 Open |

### Backlog Items

| ID | Priority | Description | Status |
|----|----------|-------------|--------|
| BACKLOG-001 | Medium | Hide "Mark Sub-batch as Completed" button until LAST department in workflow | 🔴 Open |

---

## Current Test Data State

| Sub-Batch | Location | Status | Workers | Pieces |
|-----------|----------|--------|---------|--------|
| SB-T1 | Dep-1 | In Progress | D1-W1 (10 pcs) | 10/20 worked |
| SB-T2 | Dep-2 | In Progress (All Done) | D2-W1 (15), D2-W2 (20), D2-W3 (14) | 49/49 worked |

---

## How to Resume Testing

1. **Start servers:**
   ```bash
   # Frontend (Terminal 1)
   npm run dev  # localhost:3000

   # Backend (Terminal 2)
   cd blueshark-backend-test/backend && npm run dev  # localhost:5000
   ```

2. **Next Scenario:** Scenario 4 - Rejection Flow
   - Test rejecting pieces during worker assignment
   - Verify rejection creates proper sub_batch_rejected records
   - Test rejection card flow in Kanban

3. **Test credentials:**
   - Admin: admin@gmail.com / admin
   - Supervisor Dep-1: Login as supervisor, department auto-detected
   - Supervisor Dep-2: Login as supervisor, department auto-detected

---

## Status Legend

- ✅ PASSED
- ❌ FAILED
- 🔄 In Progress
- ⏳ Pending
- 🔴 Open (Issue)
- 🟢 Fixed

---

## Testing Environment

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | localhost:3000 | ✅ Running |
| Backend | localhost:5000 | ✅ Running |
| Database | Neon Dev Branch | ✅ Connected |

---

*Last Updated: 2025-12-01*
