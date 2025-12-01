# BlueShark Jira - Quick Reference Card

**Project Key:** BSK
**URL:** simplifytech-team.atlassian.net

---

## Daily Workflow

### Morning
```
1. Check Jira board: BSK sprint board
2. Review assigned tasks
3. Update status of items you're working on
```

### During Work
```
1. Move task to "In Progress" when starting
2. Create PR with BSK-XXX in title
3. Move to "Code Review" when PR ready
```

### End of Day
```
1. Update task status
2. Log any blockers
3. Post standup update
```

---

## Git Commands

### Branch Creation
```bash
git checkout -b feature/BSK-123-description
git checkout -b bugfix/BSK-45-fix-name
```

### Commit Messages
```bash
git commit -m "BSK-123: Add wage calculation feature"
git commit -m "BSK-45: Fix worker assignment validation"
```

### PR Title
```
BSK-123: Short description of change
```

---

## Story Points Reference

| Points | Time Estimate | Example |
|--------|---------------|---------|
| 1 | Few hours | Text change, minor fix |
| 2 | Half day | Simple component |
| 3 | 1 day | New form, simple API |
| 5 | 2-3 days | New modal, endpoint |
| 8 | 1 week | New page/view |
| 13 | 2 weeks | Major feature |

---

## Issue Types

| Type | Icon | Use For |
|------|------|---------|
| Epic | Lightning | Major feature areas |
| Story | Book | User-facing features |
| Task | Checkbox | Technical work |
| Bug | Bug | Defects |
| Sub-task | Sub-list | Task breakdown |

---

## Status Flow

```
BACKLOG → TO DO → IN PROGRESS → CODE REVIEW → TESTING → DONE
```

---

## Quick JQL Filters

**My tasks:**
```
assignee = currentUser() AND resolution = Unresolved
```

**Sprint tasks:**
```
sprint in openSprints()
```

**Bugs:**
```
type = Bug AND resolution = Unresolved
```

---

## Contacts

| Role | Person | Focus |
|------|--------|-------|
| Tech Lead | Sadin | Architecture, Backend |
| Developer | Khum | Frontend, UI |

---

## Links

- Board: `simplifytech-team.atlassian.net/jira/.../BSK/boards`
- Backlog: `simplifytech-team.atlassian.net/jira/.../BSK/backlog`
- Create Issue: Click "Create" in top nav

---

**Keep this handy for daily reference!**
