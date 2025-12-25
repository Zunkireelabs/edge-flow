# Multi-Roll Batch Creation Workflow

**Feature Version**: v3
**Date**: 2025-12-21 (Updated: 2025-12-22)
**Status**: Frontend UI Complete, Backend Integration Pending

---

## Overview

Replace the current single-roll batch creation with a multi-roll workflow where:
1. User types fabric name (autocomplete from existing roll names)
2. System shows matching rolls (differentiated by color)
3. User can add multiple rolls with weight/units per roll
4. Batch totals are auto-calculated from the rolls

---

## Problem Statement

### Current State
- Batch has ONE optional roll (`batches.roll_id`)
- Rolls can have the SAME name but different colors (e.g., "zunkireelabs" in Pink AND Yellow)
- Current UI doesn't handle multiple rolls per batch

### New Requirement
- A batch should be able to use fabric from MULTIPLE rolls of the same name
- Each roll's remaining quantity should be reduced by the weight used
- Batch quantity = sum of all roll weights

---

## Visual Design

### New Add Batch Form
```
+----------------------------------------------------------+
| Add New Batch                                         X  |
+----------------------------------------------------------+
| Fabric Name *                                            |
| +------------------------------------------------------+ |
| | zunkireelabs          [Search Rolls]                 | |
| +------------------------------------------------------+ |
|   (autocomplete dropdown shows matching roll names)      |
|                                                          |
| Order Name (Optional)                                    |
| +------------------------------------------------------+ |
| | Enter order name                                     | |
| +------------------------------------------------------+ |
|                                                          |
| Unit (auto-filled from first roll)                       |
| +------------------------------------------------------+ |
| | Kilogram                                             | |
| +------------------------------------------------------+ |
|                                                          |
| Available Rolls (2 found)                                |
| +------------------+-------------+----------+----------+ |
| | Color            | Available   | Roll Units| Action  | |
| +------------------+-------------+----------+----------+ |
| | Yellow           | 100 kg      | 0        | [+ Add]  | |
| | Pink             | 200 kg      | 0        | [+ Add]  | |
| +------------------+-------------+----------+----------+ |
|                                                          |
| Selected Rolls (2)                                       |
| +------------------+-------------+----------+----------+ |
| | Color            | Weight *    | Units    | Remove   | |
| +------------------+-------------+----------+----------+ |
| | Yellow           | [30    ]    | [1    ]  |   🗑️     | |
| |   Max: 100 kg    |             |          |          | |
| +------------------+-------------+----------+----------+ |
| | Pink             | [50    ]    | [2    ]  |   🗑️     | |
| |   Max: 200 kg    |             |          |          | |
| +------------------+-------------+----------+----------+ |
| | TOTAL (2 rolls)  | 80 kg       | 3 pcs    |          | |
| +------------------+-------------+----------+----------+ |
|                                                          |
| ═══════════ SIZE BREAKDOWN SECTION (NEW) ═══════════    |
|                                                          |
| Total Pieces *                                           |
| +------------------------------------------------------+ |
| | 175                                                  | |
| +------------------------------------------------------+ |
|                                                          |
| Size Breakdown                          [+ Add Size]     |
| +------------------------------------------------------+ |
| | [Enter size...    ] [Pieces    ] 🗑️                  | |
| | [M                ] [100       ] 🗑️                  | |
| | [L                ] [75        ] 🗑️                  | |
| +------------------------------------------------------+ |
| | Total: 175 / 175 pieces  ✓ Matched                   | |
| +------------------------------------------------------+ |
|                                                          |
|                              [Cancel]  [Save Batch]      |
+----------------------------------------------------------+
```

### Field Mapping
| UI Summary | Batch Field | Calculation |
|------------|-------------|-------------|
| Total weight (80 kg) | `quantity` | sum of all weights |
| Total units (3) | `unit_count` | sum of all units |
| Fabric Name | `name` | user input |
| Unit | `unit` | from first roll selected |
| Total Pieces | `total_pieces` (NEW) | user input |
| Size Breakdown | `batch_sizes[]` (NEW) | user input array |

---

## Size Breakdown Feature (NEW - 2025-12-22)

### Purpose
Allow admin to specify the expected garment pieces and their size distribution when creating a batch. This data flows to sub-batch creation for production tracking.

### Key Points
- **Total Pieces**: Expected number of garments from this batch
- **Size**: Free text input (NOT dropdown) - business uses non-standard sizes
- **Pieces per Size**: Number of garments for each size
- **Validation**: Sum of size pieces should match total pieces (warning, not blocking)

### UI Behavior
1. Section appears **only after rolls are selected**
2. "+ Add Size" button adds new empty row
3. Each row: Size (text) + Pieces (number) + Delete button
4. Validation footer shows match/mismatch status
5. Green background when matched, amber when mismatched

### Data Structure
```typescript
// Frontend state
type SizeEntry = {
  id: string;      // Temporary UI ID
  size: string;    // e.g., "M", "L", "42", "Free Size"
  pieces: number;  // e.g., 100
};

const [totalPieces, setTotalPieces] = useState<number | string>("");
const [sizeEntries, setSizeEntries] = useState<SizeEntry[]>([]);
```

### Proposed Database Schema

**Option A: JSON field on batches**
```prisma
model batches {
  // ... existing fields ...
  total_pieces    Int?
  size_breakdown  Json?   // [{ size: "M", pieces: 100 }, ...]
}
```

**Option B: Separate table (Recommended for querying)**
```prisma
model batch_sizes {
  id         Int      @id @default(autoincrement())
  batch_id   Int
  size       String   // "M", "L", "XL", "42", etc.
  pieces     Int
  created_at DateTime @default(now())

  batch      batches  @relation(fields: [batch_id], references: [id], onDelete: Cascade)

  @@index([batch_id])
}

model batches {
  // ... existing fields ...
  total_pieces  Int?
  batch_sizes   batch_sizes[]
}
```

### Integration with Sub-Batch Creation

When creating a sub-batch from a batch:
1. Display batch's total pieces and size breakdown as reference
2. Allow admin to allocate pieces per size to the sub-batch
3. Track remaining pieces per size across sub-batches
4. Sub-batch `estimated_pieces` = sum of allocated sizes

**Sub-Batch Size Tracking**
```
Batch: 175 total pieces
├── M: 100 pieces
├── L: 75 pieces

Sub-Batch 1: 50 pieces
├── M: 30 pieces (70 remaining in batch)
├── L: 20 pieces (55 remaining in batch)

Sub-Batch 2: 125 pieces
├── M: 70 pieces (0 remaining in batch)
├── L: 55 pieces (0 remaining in batch)
```

### API Endpoints (Proposed)

```
POST /api/batches/with-rolls
Body: {
  name: string,
  order_name?: string,
  unit: string,
  rolls: [...],
  total_pieces: number,        // NEW
  size_breakdown: [            // NEW
    { size: "M", pieces: 100 },
    { size: "L", pieces: 75 }
  ]
}

GET /api/batches/:id/with-rolls
Response: {
  ...batch,
  total_pieces: 175,
  batch_sizes: [
    { id: 1, size: "M", pieces: 100 },
    { id: 2, size: "L", pieces: 75 }
  ]
}
```

---

## Database Schema Changes

### New Junction Table: `batch_rolls`

**File**: `blueshark-backend-test/backend/prisma/schema.prisma`

```prisma
model batch_rolls {
  id         Int      @id @default(autoincrement())
  batch_id   Int
  roll_id    Int
  weight     Float    // Weight taken from this roll
  units      Int?     // Units taken from this roll
  created_at DateTime @default(now())

  batch      batches  @relation(fields: [batch_id], references: [id], onDelete: Cascade)
  roll       rolls    @relation(fields: [roll_id], references: [id])

  @@unique([batch_id, roll_id])  // Each roll can only be added once per batch
  @@index([batch_id])
  @@index([roll_id])
}
```

### Update `batches` Model
```prisma
model batches {
  // ... existing fields ...
  roll_id     Int?          // KEEP for backward compatibility

  // NEW relation
  batch_rolls batch_rolls[]
}
```

### Update `rolls` Model
```prisma
model rolls {
  // ... existing fields ...

  // NEW relation
  batch_rolls batch_rolls[]
}
```

---

## Backend API Changes

### New Service Functions

**File**: `blueshark-backend-test/backend/src/services/batchServices.ts`

```typescript
// 1. Get unique fabric names (for autocomplete)
export const getUniqueFabricNames = async (): Promise<string[]>

// 2. Search rolls by fabric name
export const getRollsByFabricName = async (fabricName: string): Promise<Roll[]>

// 3. Validate rolls before creating batch
export const validateBatchRolls = async (
  rolls: { roll_id: number; weight: number; units?: number }[],
  excludeBatchId?: number
): Promise<{ isValid: boolean; validations: ValidationResult[] }>

// 4. Create batch with multiple rolls
export const createBatchWithRolls = async (data: {
  name: string;
  order_name?: string;
  unit: string;
  vendor_id?: number;
  rolls: { roll_id: number; weight: number; units?: number }[];
}): Promise<Batch>

// 5. Update batch with multiple rolls
export const updateBatchWithRolls = async (
  batchId: number,
  data: Partial<CreateBatchData>
): Promise<Batch>
```

### Update Roll Remaining Calculation

**File**: `blueshark-backend-test/backend/src/services/rollServices.ts`

```typescript
// Update to include batch_rolls in calculation
export const getRollRemainingQuantity = async (rollId: number, excludeBatchId?: number) => {
  // Sum from legacy batches.roll_id
  // + Sum from new batch_rolls table
  // = total used
  // remaining = roll.quantity - total used
}
```

### New API Endpoints

**File**: `blueshark-backend-test/backend/src/routes/batch.ts`

```
POST   /api/batches/with-rolls     - Create batch with multiple rolls
PUT    /api/batches/:id/with-rolls - Update batch with multiple rolls
GET    /api/batches/fabric-names   - Get unique fabric names (autocomplete)
GET    /api/batches/search-rolls   - Search rolls by fabric name
POST   /api/batches/validate-rolls - Validate rolls before save
```

---

## Frontend Changes

### New TypeScript Interfaces

**File**: `src/app/Dashboard/components/views/BatchView.tsx`

```typescript
interface BatchRollEntry {
  id: string;           // Temp ID for UI tracking
  roll_id: number;
  roll_name: string;
  roll_color: string;
  roll_remaining: number;
  weight: number;       // Weight to take
  units: number;        // Units to take
  isValid: boolean;
  errorMessage?: string;
}
```

### New State Variables

```typescript
const [fabricNameSearch, setFabricNameSearch] = useState("");
const [fabricNameSuggestions, setFabricNameSuggestions] = useState<string[]>([]);
const [matchingRolls, setMatchingRolls] = useState<Roll[]>([]);
const [rollEntries, setRollEntries] = useState<BatchRollEntry[]>([]);
const [showFabricSuggestions, setShowFabricSuggestions] = useState(false);
```

### Computed Values

```typescript
const rollTotals = useMemo(() => ({
  totalWeight: rollEntries.reduce((sum, e) => sum + e.weight, 0),
  totalUnits: rollEntries.reduce((sum, e) => sum + e.units, 0),
  rollCount: rollEntries.length,
  allValid: rollEntries.every(e => e.isValid)
}), [rollEntries]);

const usedColors = useMemo(() =>
  new Set(rollEntries.map(e => e.roll_color))
, [rollEntries]);

const availableRolls = useMemo(() =>
  matchingRolls.filter(r => !usedColors.has(r.color))
, [matchingRolls, usedColors]);
```

---

## Validation Rules

### Frontend Validation
| Rule | When | Action |
|------|------|--------|
| Fabric name must match roll | On search | Show warning if no rolls found |
| At least one roll required | On save | Block save, show error |
| Weight <= roll remaining | On input change | Show error, highlight red |
| Total weight > 0 | On save | Block save, show error |
| No duplicate colors | On add | Filter out used colors |

### Backend Validation
| Rule | Response |
|------|----------|
| Name required | 400: "Name is required" |
| Unit required | 400: "Unit is required" |
| Rolls array not empty | 400: "At least one roll required" |
| Roll exists | 400: "Roll not found" |
| Weight <= remaining | 400: "Requested X but only Y available" |

---

## Migration Strategy

### Data Migration
1. Create `batch_rolls` table
2. For each existing batch with `roll_id`:
   - Create `batch_rolls` record: `{ batch_id, roll_id, weight: batch.quantity, units: batch.unit_count }`
3. Keep `roll_id` column (don't drop for backward compatibility)

### Migration SQL
```sql
-- Create junction table
CREATE TABLE "batch_rolls" (
    "id" SERIAL PRIMARY KEY,
    "batch_id" INTEGER NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
    "roll_id" INTEGER NOT NULL REFERENCES "rolls"("id"),
    "weight" DOUBLE PRECISION NOT NULL,
    "units" INTEGER,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing data
INSERT INTO "batch_rolls" ("batch_id", "roll_id", "weight", "units")
SELECT id, roll_id, quantity, unit_count
FROM "batches"
WHERE roll_id IS NOT NULL;

-- Create indexes
CREATE UNIQUE INDEX "batch_rolls_batch_id_roll_id_key" ON "batch_rolls"("batch_id", "roll_id");
CREATE INDEX "batch_rolls_batch_id_idx" ON "batch_rolls"("batch_id");
CREATE INDEX "batch_rolls_roll_id_idx" ON "batch_rolls"("roll_id");
```

---

## Clarified Requirements

- **Edit Mode**: Convert old single-roll batches to new multi-roll format when editing
- **Order Name**: Keep as optional field
- **Unit Field**: Auto-fill from first roll selected (disabled after selection)

---

## Files to Modify

| File | Changes | Status |
|------|---------|--------|
| `blueshark-backend-test/backend/prisma/schema.prisma` | Add `batch_rolls` model, update relations | ✅ Done |
| `blueshark-backend-test/backend/prisma/schema.prisma` | Add `batch_sizes` model, `total_pieces` field | ⏳ Pending |
| `blueshark-backend-test/backend/src/services/batchServices.ts` | Add multi-roll functions | ✅ Done |
| `blueshark-backend-test/backend/src/services/batchServices.ts` | Add size breakdown save/update | ⏳ Pending |
| `blueshark-backend-test/backend/src/services/rollServices.ts` | Update remaining calculation | ✅ Done |
| `blueshark-backend-test/backend/src/controllers/batchController.ts` | Add new controller functions | ✅ Done |
| `blueshark-backend-test/backend/src/routes/batch.ts` | Add new endpoints | ✅ Done |
| `src/app/Dashboard/components/views/BatchView.tsx` | Multi-roll UI + Size breakdown UI | ✅ Done |
| `src/app/Dashboard/components/views/RollView.tsx` | Compact filter bar | ✅ Done |
| `src/app/Dashboard/components/views/SubBatchView.tsx` | Compact filter bar + Size allocation (future) | ✅ Filter done, ⏳ Size pending |

---

## Task Checklist

### Backend Tasks - Multi-Roll Batch
- [x] Add `batch_rolls` model to Prisma schema
- [x] Run Prisma migration (`npx prisma db push`)
- [x] Add `getUniqueFabricNames()` service function
- [x] Add `getRollsByFabricName(name)` service function
- [x] Add `validateBatchRolls(rolls)` service function
- [x] Add `createBatchWithRolls(data)` service function
- [x] Add `updateBatchWithRolls(id, data)` service function
- [x] Update `getRollRemainingQuantity()` to include batch_rolls
- [x] Add new controller functions
- [x] Add new API routes

### Backend Tasks - Size Breakdown (NEW)
- [ ] Add `total_pieces` field to `batches` model
- [ ] Add `batch_sizes` table to Prisma schema
- [ ] Update `createBatchWithRolls()` to save size breakdown
- [ ] Update `updateBatchWithRolls()` to update size breakdown
- [ ] Add size breakdown to batch GET response
- [ ] Run Prisma migration

### Frontend Tasks - Multi-Roll Batch
- [x] Add new TypeScript interfaces (BatchRollEntry, etc.)
- [x] Add new state variables for multi-roll mode
- [x] Create fabric name autocomplete input
- [x] Create "Search Rolls" functionality
- [x] Create matching rolls table (available colors)
- [x] Create added rolls table with weight/units inputs
- [x] Add summary row (totals calculation)
- [x] Implement real-time validation (weight vs remaining)
- [x] Update save handler to use new API
- [x] Handle edit mode (convert old batches to new format)
- [x] Remove old Roll dropdown and manual fields

### Frontend Tasks - Size Breakdown (NEW)
- [x] Add SizeEntry type definition
- [x] Add totalPieces and sizeEntries state variables
- [x] Move Unit field after Order Name
- [x] Add Total Pieces input (appears after rolls selected)
- [x] Add "+ Add Size" button and size entry rows
- [x] Add size/pieces validation with match/mismatch indicator
- [x] Reset size breakdown on modal close
- [ ] Update save handler to include size breakdown data
- [ ] Load size breakdown when editing existing batch

### Frontend Tasks - UI Improvements (2025-12-22)
- [x] Compact filter bar in RollView (text-xs, reduced padding)
- [x] Compact filter bar in BatchView
- [x] Compact filter bar in SubBatchView
- [x] Move Search to first position in filter bar
- [x] Change Advanced filters to icon-only with tooltip
- [x] Logical filter ordering

### Testing
- [x] Test create batch with multiple rolls
- [x] Test validation (exceed remaining)
- [x] Test edit existing batch
- [x] Verify roll remaining is reduced correctly
- [ ] Test size breakdown save/load
- [ ] Test size breakdown validation
- [ ] Test sub-batch creation with size allocation

---

## API Payload Examples

### Create Batch (New)
```json
POST /api/batches/with-rolls
{
  "name": "zunkireelabs",
  "order_name": "Order-2024-001",
  "unit": "Kilogram",
  "rolls": [
    { "roll_id": 13, "weight": 30, "units": 1 },
    { "roll_id": 14, "weight": 50, "units": 2 }
  ]
}
```

### Response
```json
{
  "id": 25,
  "name": "zunkireelabs",
  "order_name": "Order-2024-001",
  "quantity": 80,
  "unit": "Kilogram",
  "unit_count": 3,
  "color": "Yellow",
  "batch_rolls": [
    { "id": 1, "roll_id": 13, "weight": 30, "units": 1, "roll": { "color": "Yellow" } },
    { "id": 2, "roll_id": 14, "weight": 50, "units": 2, "roll": { "color": "Pink" } }
  ]
}
```
