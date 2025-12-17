# BlueShark System Design & UX Documentation

**Date Created:** December 16, 2025
**Purpose:** Complete system flow documentation for client discussions

---

## Files in this Directory

| File | Description |
|------|-------------|
| `SYSTEM_FLOW_DOCUMENTATION.md` | Complete ASCII documentation with all flows |
| `diagrams-part1-ux-flow.mmd` | Mermaid diagrams for UX/Business flows |
| `diagrams-part2-technical-flow.mmd` | Mermaid diagrams for Technical flows |
| `01-system-overview.drawio` | Native draw.io - Admin & Supervisor Portal Overview |
| `02-production-flow.drawio` | Native draw.io - End-to-End Production Flow |
| `03-quality-control.drawio` | Native draw.io - Alteration & Rejection Workflow |
| `04-database-erd.drawio` | Native draw.io - Database Entity Relationships |

---

## Quick Start: Opening Draw.io Files

**Recommended Method - Native .drawio files:**
1. Open [diagrams.net](https://app.diagrams.net/) or desktop app
2. File > Open from > Device
3. Select any `.drawio` file from this folder
4. Diagram opens instantly with full editing capabilities

**Available Diagrams:**
- `01-system-overview.drawio` - Two user portals with feature comparison
- `02-production-flow.drawio` - Complete production journey with department flow
- `03-quality-control.drawio` - Alteration & rejection branching workflows
- `04-database-erd.drawio` - All database tables with relationships

---

## Alternative: Import Mermaid Diagrams into diagrams.net (draw.io)

### Method 1: Direct Mermaid Import

1. Open [diagrams.net](https://app.diagrams.net/) or your desktop app
2. Create a new diagram or open existing
3. Go to **Arrange > Insert > Advanced > Mermaid...**
4. Copy a single diagram section from the `.mmd` file (one graph at a time)
5. Paste into the Mermaid dialog
6. Click **Insert**

### Method 2: Copy Individual Diagrams

Each `.mmd` file contains multiple diagrams separated by `---`. To use:

1. Open the `.mmd` file in any text editor
2. Find the diagram you need (look for comments like `%% DIAGRAM 1:`)
3. Copy from `graph TB` or `erDiagram` to the next `---`
4. Paste into diagrams.net Mermaid importer

### Diagram Index

#### Part 1: UX Flow (diagrams-part1-ux-flow.mmd)
1. System Overview - Two User Portals
2. Admin Dashboard Module Map
3. Supervisor Dashboard Module Map
4. Production Flow - End to End
5. Quality Control - Alteration Flow
6. Quality Control - Rejection Flow
7. Wage Calculation Flow
8. Inventory Management Flow
9. Card Status Types
10. Status Transitions

#### Part 2: Technical Flow (diagrams-part2-technical-flow.mmd)
1. Database Entity Relationship (ERD)
2. API Endpoints - Authentication
3. API Endpoints - CRUD Resources
4. API Endpoints - Production Operations
5. Component Architecture - Admin
6. Component Architecture - Supervisor
7. State Management Flow
8. Data Fetch Pattern
9. Send to Production - Sequence Diagram
10. Worker Assignment - Sequence Diagram
11. Department Advancement - Sequence Diagram
12. Alteration Creation - Sequence Diagram
13. User Roles and Permissions

---

## Quick Tips for Client Presentation

### Recommended Order for Demo:
1. Start with **System Overview** (two portals)
2. Show **Production Flow** (end-to-end journey)
3. Explain **Quality Control** (alteration/rejection)
4. Show **Status Transitions** (how things move)

### Color Legend:
- **Blue (#2272B4)** - BlueShark brand, assigned items
- **Gray** - Main/unassigned items
- **Yellow/Amber** - Altered items
- **Red** - Rejected items
- **Green** - Completed/success

---

## For Developers

If you need to modify these diagrams:

1. Edit the `.mmd` files directly (they're plain text)
2. Test in [Mermaid Live Editor](https://mermaid.live/)
3. Re-import into diagrams.net

### Mermaid Syntax Reference:
- `graph TB` - Top to Bottom flowchart
- `graph LR` - Left to Right flowchart
- `erDiagram` - Entity Relationship diagram
- `sequenceDiagram` - Sequence diagram

---

## Next Steps After Client Meeting

After discussing with client:
1. Mark areas that need changes in this document
2. Create a new document with change requests
3. Map dependencies between components
4. Plan implementation phases

---

**Maintained by:** Sadin / BlueShark-Stark
**Repository:** Zunkireelabs/edge-flow
