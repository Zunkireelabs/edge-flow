# BlueShark v2 Migration Notes

This document outlines the database migration steps required for BlueShark v2.

---

## Prerequisites

- PostgreSQL database access
- Prisma CLI installed (`npm install -g prisma`)
- Backend server stopped during migration
- Database backup completed

---

## Migration Overview

| Migration | Table | Change |
|-----------|-------|--------|
| 1 | Role enum | Add `SUPER_SUPERVISOR` |
| 2 | rolls | Add `roll_unit_count` column |
| 3 | batches | Add `order_name`, `unit_count` columns |

---

## Step-by-Step Migration

### Step 1: Backup Database

```bash
# PostgreSQL backup
pg_dump -U postgres -h localhost blueshark_db > backup_before_v2.sql
```

### Step 2: Update Prisma Schema

Ensure your `prisma/schema.prisma` has the following changes:

```prisma
// 1. Update Role enum
enum Role {
  ADMIN
  SUPERVISOR
  SUPER_SUPERVISOR
}

// 2. Update rolls model
model rolls {
  id              Int           @id @default(autoincrement())
  name            String
  quantity        Int
  roll_unit_count Int?          // NEW
  unit            String
  color           String
  vendor_id       Int?
  // ... existing relations
}

// 3. Update batches model
model batches {
  id              Int           @id @default(autoincrement())
  roll_id         Int?
  name            String
  order_name      String?       // NEW
  quantity        Int
  unit            String
  unit_count      Int?          // NEW
  color           String
  vendor_id       Int?
  // ... existing relations
}
```

### Step 3: Generate Migration

```bash
cd blueshark-backend-test/backend

# Generate migration files
npx prisma migrate dev --name add_v2_features
```

This will create a migration file in `prisma/migrations/` with:
- ALTER TYPE for Role enum
- ALTER TABLE for rolls
- ALTER TABLE for batches

### Step 4: Review Generated SQL

Check the generated migration file. It should contain:

```sql
-- Add SUPER_SUPERVISOR to Role enum
ALTER TYPE "Role" ADD VALUE 'SUPER_SUPERVISOR';

-- Add roll_unit_count to rolls table
ALTER TABLE "rolls" ADD COLUMN "roll_unit_count" INTEGER;

-- Add order_name and unit_count to batches table
ALTER TABLE "batches" ADD COLUMN "order_name" TEXT;
ALTER TABLE "batches" ADD COLUMN "unit_count" INTEGER;
```

### Step 5: Apply Migration

```bash
# Apply to development
npx prisma migrate dev

# Apply to production
npx prisma migrate deploy
```

### Step 6: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 7: Verify Migration

```bash
# Open Prisma Studio to verify
npx prisma studio
```

Check:
- [ ] Role enum has SUPER_SUPERVISOR option
- [ ] rolls table has roll_unit_count column
- [ ] batches table has order_name column
- [ ] batches table has unit_count column

---

## Alternative: Direct SQL Migration

If you prefer direct SQL without Prisma migrations:

```sql
-- Run in PostgreSQL

-- 1. Add SUPER_SUPERVISOR to Role enum
ALTER TYPE "Role" ADD VALUE 'SUPER_SUPERVISOR';

-- 2. Add roll_unit_count to rolls
ALTER TABLE rolls ADD COLUMN roll_unit_count INTEGER;

-- 3. Add columns to batches
ALTER TABLE batches ADD COLUMN order_name VARCHAR(255);
ALTER TABLE batches ADD COLUMN unit_count INTEGER;

-- 4. Verify changes
\d rolls
\d batches
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'Role'::regtype;
```

---

## Rollback Procedure

If you need to rollback:

### Using Prisma

```bash
# Rollback last migration
npx prisma migrate reset --skip-seed
```

### Using SQL

```sql
-- Remove new columns
ALTER TABLE rolls DROP COLUMN IF EXISTS roll_unit_count;
ALTER TABLE batches DROP COLUMN IF EXISTS order_name;
ALTER TABLE batches DROP COLUMN IF EXISTS unit_count;

-- Note: Removing enum values in PostgreSQL is complex
-- You may need to recreate the enum type
```

---

## Data Migration (Optional)

### Set Default Values

If you want to set default values for existing records:

```sql
-- Set roll_unit_count to 1 for existing rolls
UPDATE rolls SET roll_unit_count = 1 WHERE roll_unit_count IS NULL;

-- Set unit_count to quantity for existing batches
UPDATE batches SET unit_count = quantity WHERE unit_count IS NULL;
```

### Migrate Existing Supervisors

Existing supervisors will have `role = 'SUPERVISOR'` by default. No action needed unless you want to promote some to SUPER_SUPERVISOR:

```sql
-- Promote a supervisor to super supervisor
UPDATE supervisors SET role = 'SUPER_SUPERVISOR', department_id = NULL WHERE id = ?;
```

---

## Troubleshooting

### Error: Enum value already exists

```
ERROR: enum label "SUPER_SUPERVISOR" already exists
```

**Solution**: Migration was already applied. Skip this step.

### Error: Column already exists

```
ERROR: column "roll_unit_count" of relation "rolls" already exists
```

**Solution**: Column was already added. Skip this step or use `IF NOT EXISTS`:

```sql
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS roll_unit_count INTEGER;
```

### Error: Prisma generate fails

```
Error: EPERM: operation not permitted
```

**Solution**: Stop the backend server before running `prisma generate`.

### Error: Migration drift detected

```
Drift detected: Your database schema is not in sync
```

**Solution**:
```bash
# Push schema directly (development only)
npx prisma db push

# Or reset and re-migrate
npx prisma migrate reset
```

---

## Post-Migration Checklist

- [ ] Database backup completed
- [ ] Migrations applied successfully
- [ ] Prisma client regenerated
- [ ] Backend server restarted
- [ ] Test SUPER_SUPERVISOR login
- [ ] Test new form fields (roll_unit_count, order_name, unit_count)
- [ ] Verify existing data is intact

---

## Environment-Specific Notes

### Development

```bash
npx prisma migrate dev --name add_v2_features
```

### Staging

```bash
npx prisma migrate deploy
```

### Production

```bash
# 1. Take database backup
# 2. Put application in maintenance mode
# 3. Apply migrations
npx prisma migrate deploy

# 4. Restart application
# 5. Verify functionality
# 6. Exit maintenance mode
```

---

## Schema Reference

### Final Schema After Migration

```prisma
enum Role {
  ADMIN
  SUPERVISOR
  SUPER_SUPERVISOR
}

model supervisors {
  id            Int         @id @default(autoincrement())
  name          String
  email         String      @unique
  password      String
  role          Role        @default(SUPERVISOR)
  department_id Int?
  department    departments? @relation(fields: [department_id], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model rolls {
  id              Int       @id @default(autoincrement())
  name            String
  quantity        Int
  roll_unit_count Int?
  unit            String
  color           String
  vendor_id       Int?
  vendor          vendors?  @relation(fields: [vendor_id], references: [id])
  batches         batches[]
  sub_batches     sub_batches[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model batches {
  id          Int       @id @default(autoincrement())
  roll_id     Int?
  name        String
  order_name  String?
  quantity    Int
  unit        String
  unit_count  Int?
  color       String
  vendor_id   Int?
  roll        rolls?    @relation(fields: [roll_id], references: [id])
  vendor      vendors?  @relation(fields: [vendor_id], references: [id])
  sub_batches sub_batches[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## Support

For migration issues, contact:
- Database Administrator
- Development Team
