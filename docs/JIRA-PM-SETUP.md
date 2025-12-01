# BlueShark - Jira Project Management Setup

**Created:** November 30, 2025
**Project:** BlueShark Production Management System
**Team:** Sadin (Lead), Khum (Developer)
**Jira Instance:** simplifytech-team.atlassian.net

---

## Quick Start Guide

### Step 1: Create BlueShark Jira Project

1. Go to: **https://simplifytech-team.atlassian.net**
2. Click **"Create project"**
3. Select **"Scrum"** template (for sprint-based development)
4. Configure:
   - **Name:** BlueShark Production Management
   - **Key:** `BSK` (all tickets will be BSK-1, BSK-2, etc.)
   - **Template:** Scrum
5. Click **Create**

---

### Step 2: Configure Project Settings

#### Issue Types
Navigate to: **Project Settings > Issue Types**

| Issue Type | Use For |
|------------|---------|
| **Epic** | Major features (e.g., "Wage Calculation Module") |
| **Story** | User-facing features (e.g., "As admin, I can calculate worker wages") |
| **Task** | Technical work (e.g., "Set up API endpoint for wages") |
| **Bug** | Defects and issues |
| **Sub-task** | Breakdown of stories/tasks |

#### Board Columns
Navigate to: **Board > Board Settings > Columns**

Recommended columns:
```
BACKLOG | TO DO | IN PROGRESS | CODE REVIEW | TESTING | DONE
```

#### Sprint Settings
- Sprint duration: **2 weeks** (recommended)
- Sprint goal: Set at each planning meeting

---

### Step 3: Add Team Members

1. Go to: **Project Settings > People**
2. Add members:
   - **Sadin** - Administrator, Developer
   - **Khum** - Developer
3. Set roles:
   - Sadin: Project Lead (can manage project settings)
   - Khum: Developer (can create/update issues)

---

### Step 4: Create Initial Epics

Based on BlueShark modules, create these epics:

| Epic | Description | Key Features |
|------|-------------|--------------|
| **BSK-E1: Raw Material Management** | Roll tracking and management | CRUD rolls, vendor linking |
| **BSK-E2: Batch Management** | Production batch creation | Batch creation, auto-fill from roll |
| **BSK-E3: Sub-Batch Management** | Production orders | Size details, attachments, workflow |
| **BSK-E4: Production Workflow** | Kanban-based tracking | Admin/Supervisor views, card management |
| **BSK-E5: Worker Management** | Worker assignment and tracking | CRUD workers, department filtering |
| **BSK-E6: Quality Control** | Rejections and alterations | QC workflow, rework tracking |
| **BSK-E7: Wage Calculation** | Worker pay computation | Date range, billable filtering |
| **BSK-E8: Inventory Management** | Stock tracking | Add/subtract, history |
| **BSK-E9: User Management** | Auth and roles | Admin, Supervisor accounts |
| **BSK-E10: Infrastructure** | DevOps and tooling | Deployment, CI/CD, monitoring |

---

## Sprint Planning Template

### Sprint Planning Meeting Agenda

**Duration:** 1-2 hours
**Attendees:** Sadin, Khum

1. **Review Previous Sprint** (15 min)
   - What was completed?
   - What carried over?
   - Any blockers?

2. **Sprint Goal Definition** (10 min)
   - What's the main objective this sprint?
   - Example: "Complete worker wage calculation feature"

3. **Backlog Grooming** (20 min)
   - Review top backlog items
   - Clarify requirements
   - Estimate story points

4. **Sprint Commitment** (30 min)
   - Select items for sprint
   - Assign owners
   - Identify dependencies

5. **Capacity Planning** (10 min)
   - Sadin: X story points available
   - Khum: Y story points available
   - Total capacity: X + Y points

---

### Story Point Guidelines

| Points | Complexity | Example |
|--------|------------|---------|
| **1** | Trivial | Fix typo, update text |
| **2** | Simple | Add button, simple styling |
| **3** | Small | New form field, simple CRUD |
| **5** | Medium | New modal, API endpoint |
| **8** | Large | New view/page, complex logic |
| **13** | Very Large | New module, major refactor |

**Team Velocity (Estimated):**
- Per 2-week sprint: ~30-40 story points
- Sadin: ~15-20 points (split with PM duties)
- Khum: ~15-20 points

---

## User Story Templates

### Feature Story Template
```
**Title:** [As a <role>, I want <feature> so that <benefit>]

**User Story:**
As a [Admin/Supervisor/Worker],
I want to [action/feature],
So that [benefit/value].

**Acceptance Criteria:**
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

**Technical Notes:**
- API endpoint: [if applicable]
- Database changes: [if applicable]
- Dependencies: [if applicable]

**Story Points:** [1/2/3/5/8/13]
**Epic:** [Link to epic]
**Assignee:** [Sadin/Khum]
```

### Bug Report Template
```
**Title:** [Short description of the bug]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile]
- Environment: [Local/Production]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[Attach if applicable]

**Priority:** [Highest/High/Medium/Low]
**Assignee:** [Sadin/Khum]
```

---

## Workflow Configuration

### Issue Workflow

```
BACKLOG → TO DO → IN PROGRESS → CODE REVIEW → TESTING → DONE
   ↓         ↓          ↓            ↓           ↓
(future) (ready to  (actively   (PR created)  (QA      (deployed/
          start)    working)                 testing)  merged)
```

### Workflow Rules

| Transition | Who | Conditions |
|------------|-----|------------|
| Backlog → To Do | PM (Sadin) | Sprint planning |
| To Do → In Progress | Developer | Taking ownership |
| In Progress → Code Review | Developer | PR created |
| Code Review → Testing | Reviewer | PR approved |
| Testing → Done | QA/PM | Tests pass |
| Any → Backlog | Anyone | Deprioritized |

---

## JQL Quick Queries

Save these as filters in Jira:

### My Current Sprint Tasks
```jql
project = BSK AND sprint in openSprints() AND assignee = currentUser()
```

### All Open Bugs
```jql
project = BSK AND type = Bug AND resolution = Unresolved ORDER BY priority DESC
```

### Sprint Burndown
```jql
project = BSK AND sprint in openSprints()
```

### Sadin's Tasks
```jql
project = BSK AND assignee = "sadin" AND resolution = Unresolved
```

### Khum's Tasks
```jql
project = BSK AND assignee = "khum" AND resolution = Unresolved
```

### Ready for Code Review
```jql
project = BSK AND status = "Code Review"
```

### High Priority Items
```jql
project = BSK AND priority in (Highest, High) AND resolution = Unresolved
```

---

## Integration with Development

### Git Commit Convention
Include Jira ticket in commits:
```bash
git commit -m "BSK-123: Implement wage calculation modal"
git commit -m "BSK-45: Fix worker assignment bug"
```

### Branch Naming
```
feature/BSK-123-wage-calculation
bugfix/BSK-45-worker-assignment-fix
```

### PR Title Convention
```
BSK-123: Add wage calculation feature
```

This enables automatic linking between Jira and GitHub.

---

## Automation Rules (Optional)

### Auto-move to In Progress
**Trigger:** Branch created with issue key
**Action:** Transition issue to "In Progress"

### Auto-move to Code Review
**Trigger:** PR created with issue key
**Action:** Transition issue to "Code Review"

### Auto-close on Merge
**Trigger:** PR merged with issue key
**Action:** Transition issue to "Done"

Set up in: **Project Settings > Automation**

---

## Daily Standup Format

**When:** Daily at [agreed time]
**Duration:** 15 minutes max
**Format:** Async (via Slack/Discord) or Sync (call)

Each person answers:
1. **Yesterday:** What did I complete?
2. **Today:** What will I work on?
3. **Blockers:** Any impediments?

Example:
```
Sadin - Nov 30:
- Yesterday: Completed BSK-45 (worker assignment fix)
- Today: Working on BSK-67 (wage calculation API)
- Blockers: None

Khum - Nov 30:
- Yesterday: Finished BSK-52 (modal styling)
- Today: Starting BSK-68 (date picker integration)
- Blockers: Need API endpoint for wage data (depends on BSK-67)
```

---

## Sprint Retrospective Template

**When:** End of each sprint
**Duration:** 30-45 minutes

### Questions to Discuss:

**1. What went well?**
- List positives
- Celebrate wins

**2. What didn't go well?**
- List challenges
- No blame, focus on process

**3. What can we improve?**
- Actionable improvements
- Pick 1-2 to implement next sprint

**4. Action Items**
- Specific improvements to try
- Assign owner for each

---

## Initial Backlog Items

### Priority 1 (First Sprint)
| Key | Summary | Type | Points | Epic |
|-----|---------|------|--------|------|
| BSK-1 | Backend local development setup | Task | 5 | Infrastructure |
| BSK-2 | Database schema verification | Task | 3 | Infrastructure |
| BSK-3 | API endpoint testing | Task | 5 | Infrastructure |
| BSK-4 | Login URL configuration fix | Bug | 2 | User Management |
| BSK-5 | Environment variables audit | Task | 2 | Infrastructure |

### Priority 2 (Second Sprint)
| Key | Summary | Type | Points | Epic |
|-----|---------|------|--------|------|
| BSK-6 | Dashboard analytics - production stats | Story | 8 | Production Workflow |
| BSK-7 | Export to CSV functionality | Story | 5 | Reporting |
| BSK-8 | Search and filtering | Story | 5 | Production Workflow |
| BSK-9 | Mobile responsive improvements | Story | 8 | UI/UX |

---

## Links & Resources

- **Jira Project:** https://simplifytech-team.atlassian.net/jira/software/c/projects/BSK/boards/X
- **GitHub Repo:** https://github.com/Simplifycodes/blueshark-dev
- **Production URL:** https://edge-flow-gamma.vercel.app
- **Backend:** https://edge-flow-backend.onrender.com

---

## Quick Commands

### View Jira Dashboard
```
https://simplifytech-team.atlassian.net/jira/software/c/projects/BSK/boards/X
```

### Create New Issue
```
https://simplifytech-team.atlassian.net/jira/software/c/projects/BSK/issues/create
```

### Sprint Board
```
https://simplifytech-team.atlassian.net/jira/software/c/projects/BSK/boards/X/backlog
```

---

## Next Steps After Setup

1. [ ] Create BSK project in Jira
2. [ ] Add Sadin and Khum to project
3. [ ] Create initial epics
4. [ ] Import Priority 1 backlog items
5. [ ] Plan first sprint
6. [ ] Start development

---

**BlueShark PM Setup Guide - Ready for collaborative development!**
