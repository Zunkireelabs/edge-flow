# Sub-Batch Completion Status API Documentation

## Overview

This API allows you to mark sub-batches as completed and query sub-batches by their completion status. This is essential for production tracking and reporting.

---

## Database Schema Changes

### sub_batches Table

**New Fields:**
- `status` - Enum: `DRAFT`, `IN_PRODUCTION`, `COMPLETED`, `CANCELLED` (already existed)
- `completed_at` - DateTime (nullable) - Timestamp when sub-batch was marked as completed

**Status Flow:**
```
DRAFT → IN_PRODUCTION → COMPLETED
                     ↓
                 CANCELLED
```

---

## API Endpoints

### 1. Mark Sub-Batch as Completed

Mark a sub-batch as completed and record the completion timestamp.

**Endpoint:** `POST /api/sub-batches/mark-completed`

**Request Body:**
```json
{
  "subBatchId": 123
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Sub-batch marked as completed",
  "subBatch": {
    "id": 123,
    "name": "Batch A - Blue Jeans",
    "status": "COMPLETED",
    "completed_at": "2025-11-09T10:30:00.000Z",
    "estimated_pieces": 500,
    "expected_items": 450,
    "start_date": "2025-11-01T00:00:00.000Z",
    "due_date": "2025-11-15T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request** (Missing subBatchId):
```json
{
  "success": false,
  "message": "subBatchId is required"
}
```

**500 Internal Server Error** (Sub-batch not found):
```json
{
  "success": false,
  "message": "Sub-batch with id 123 not found"
}
```

**500 Internal Server Error** (Already completed):
```json
{
  "success": false,
  "message": "Sub-batch 123 is already marked as completed"
}
```

---

### 2. Get Sub-Batches by Status

Retrieve all sub-batches with a specific status.

**Endpoint:** `GET /api/sub-batches/status/:status`

**Parameters:**
- `status` (required) - One of: `DRAFT`, `IN_PRODUCTION`, `COMPLETED`, `CANCELLED`

**Example Requests:**
```bash
# Get all completed sub-batches
GET /api/sub-batches/status/COMPLETED

# Get all sub-batches in production
GET /api/sub-batches/status/IN_PRODUCTION

# Get all draft sub-batches
GET /api/sub-batches/status/DRAFT
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 15,
  "subBatches": [
    {
      "id": 123,
      "name": "Batch A - Blue Jeans",
      "status": "COMPLETED",
      "completed_at": "2025-11-09T10:30:00.000Z",
      "estimated_pieces": 500,
      "expected_items": 450,
      "start_date": "2025-11-01T00:00:00.000Z",
      "due_date": "2025-11-15T00:00:00.000Z",
      "department": {
        "id": 5,
        "name": "Packaging"
      },
      "size_details": [
        {
          "id": 1,
          "category": "S",
          "pieces": 100
        },
        {
          "id": 2,
          "category": "M",
          "pieces": 200
        }
      ],
      "workflows": {
        "id": 10,
        "current_step_index": 5,
        "steps": [
          {
            "step_index": 0,
            "department": {
              "id": 1,
              "name": "Cutting"
            }
          }
        ]
      }
    }
  ]
}
```

**Error Responses:**

**400 Bad Request** (Invalid status):
```json
{
  "success": false,
  "message": "Invalid status. Must be DRAFT, IN_PRODUCTION, COMPLETED, or CANCELLED"
}
```

---

### 3. Get Completed Sub-Batches

Retrieve completed sub-batches with optional date filtering.

**Endpoint:** `GET /api/sub-batches/completed/all`

**Query Parameters:**
- `start_date` (optional) - Start date in YYYY-MM-DD format
- `end_date` (optional) - End date in YYYY-MM-DD format

**Example Requests:**
```bash
# Get all completed sub-batches
GET /api/sub-batches/completed/all

# Get sub-batches completed in November 2025
GET /api/sub-batches/completed/all?start_date=2025-11-01&end_date=2025-11-30

# Get sub-batches completed after a specific date
GET /api/sub-batches/completed/all?start_date=2025-11-01

# Get sub-batches completed before a specific date
GET /api/sub-batches/completed/all?end_date=2025-11-30
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 8,
  "subBatches": [
    {
      "id": 125,
      "name": "Batch C - Red Shirts",
      "status": "COMPLETED",
      "completed_at": "2025-11-09T14:20:00.000Z",
      "estimated_pieces": 300,
      "expected_items": 280,
      "start_date": "2025-11-05T00:00:00.000Z",
      "due_date": "2025-11-10T00:00:00.000Z",
      "department": {
        "id": 5,
        "name": "Packaging"
      },
      "size_details": [],
      "attachments": []
    },
    {
      "id": 123,
      "name": "Batch A - Blue Jeans",
      "status": "COMPLETED",
      "completed_at": "2025-11-09T10:30:00.000Z",
      "estimated_pieces": 500,
      "expected_items": 450,
      "start_date": "2025-11-01T00:00:00.000Z",
      "due_date": "2025-11-15T00:00:00.000Z",
      "department": {
        "id": 5,
        "name": "Packaging"
      },
      "size_details": [],
      "attachments": []
    }
  ]
}
```

**Note:** Results are sorted by `completed_at` descending (most recent first)

---

## Usage Examples

### Frontend Integration (React/Next.js)

#### Mark Sub-Batch as Completed
```typescript
const markSubBatchCompleted = async (subBatchId: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sub-batches/mark-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subBatchId })
    });

    const data = await response.json();

    if (data.success) {
      alert(`Sub-batch marked as completed at ${data.subBatch.completed_at}`);
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Failed to mark sub-batch as completed:', error);
  }
};
```

#### Get Completed Sub-Batches
```typescript
const fetchCompletedSubBatches = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/sub-batches/completed/all?${params.toString()}`
  );

  const data = await response.json();
  return data.subBatches;
};
```

#### Get Sub-Batches by Status
```typescript
const fetchSubBatchesByStatus = async (status: 'DRAFT' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED') => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/sub-batches/status/${status}`
  );

  const data = await response.json();
  return data.subBatches;
};
```

---

## Testing with cURL

### Mark as Completed
```bash
curl -X POST http://localhost:5000/api/sub-batches/mark-completed \
  -H "Content-Type: application/json" \
  -d '{"subBatchId": 123}'
```

### Get Completed Sub-Batches
```bash
# All completed
curl http://localhost:5000/api/sub-batches/completed/all

# With date filter
curl "http://localhost:5000/api/sub-batches/completed/all?start_date=2025-11-01&end_date=2025-11-30"
```

### Get by Status
```bash
curl http://localhost:5000/api/sub-batches/status/COMPLETED
curl http://localhost:5000/api/sub-batches/status/IN_PRODUCTION
```

---

## When to Mark Sub-Batches as Completed

A sub-batch should be marked as `COMPLETED` when:
1. ✅ All workflow departments have finished processing
2. ✅ All quality checks are passed
3. ✅ Final packaging/delivery is done
4. ✅ No more work is required on this sub-batch

**Important:**
- Once marked as `COMPLETED`, the system prevents duplicate completion
- The `completed_at` timestamp is automatically set to the current time
- Completed sub-batches can be filtered out from active workflow views

---

## Production View Integration

For the Production View component, you can use these APIs to:

1. **Show Active Production:**
   ```typescript
   GET /api/sub-batches/status/IN_PRODUCTION
   ```

2. **Show Completed Production:**
   ```typescript
   GET /api/sub-batches/completed/all
   ```

3. **Mark Work as Done:**
   ```typescript
   POST /api/sub-batches/mark-completed
   ```

4. **Filter by Date Range:**
   ```typescript
   GET /api/sub-batches/completed/all?start_date=2025-11-01&end_date=2025-11-09
   ```

---

## Future Enhancements

Potential improvements:
1. **Auto-completion:** Automatically mark as completed when last department finishes
2. **Completion Validation:** Verify all quantities are accounted for before completion
3. **Completion Workflow:** Add approval steps before marking as completed
4. **Reporting:** Generate completion reports with analytics
5. **Notifications:** Alert stakeholders when sub-batches are completed

---

## Support

For issues or questions about the completion status API, contact the development team.
