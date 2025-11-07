# Wage Calculation API Documentation

## Overview

The wage calculation system calculates worker wages based on `worker_logs` data, filtering by the `is_billable` flag to exclude non-billable work (such as rework on rejected pieces).

**Key Formula:**
```
Total Billable Wages = SUM(quantity_worked × unit_price) WHERE is_billable = true
```

---

## API Endpoints

### 1. Get Worker Wages

Calculate wages for a specific worker with optional date filtering.

**Endpoint:** `GET /api/wages/worker/:workerId`

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

**Example Requests:**
```bash
# All-time wages for worker ID 5
GET /api/wages/worker/5

# Wages for worker ID 5 in a specific date range
GET /api/wages/worker/5?start_date=2025-01-01&end_date=2025-01-31
```

**Response:**
```json
{
  "summary": {
    "worker_id": 5,
    "worker_name": "John Doe",
    "total_billable_wages": 15000.50,
    "total_non_billable_wages": 2500.00,
    "total_quantity_worked": 1000,
    "billable_quantity": 850,
    "non_billable_quantity": 150,
    "total_entries": 25,
    "billable_entries": 20,
    "non_billable_entries": 5
  },
  "detailed_logs": [
    {
      "id": 101,
      "work_date": "2025-01-15T00:00:00.000Z",
      "sub_batch_name": "Batch A - Size M",
      "quantity_worked": 100,
      "unit_price": 15.50,
      "amount": 1550.00,
      "is_billable": true,
      "activity_type": "NORMAL",
      "particulars": "Regular work"
    },
    {
      "id": 102,
      "work_date": "2025-01-16T00:00:00.000Z",
      "sub_batch_name": "Batch B - Size L",
      "quantity_worked": 50,
      "unit_price": 20.00,
      "amount": 1000.00,
      "is_billable": false,
      "activity_type": "NORMAL",
      "particulars": "Rework on rejected pieces"
    }
  ]
}
```

**Use Case:** View a single worker's wage breakdown for payroll

---

### 2. Get All Workers Wages

Calculate wages for all workers with optional filtering.

**Endpoint:** `GET /api/wages/all`

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `department_id` (optional): Filter by department

**Example Requests:**
```bash
# All workers, all time
GET /api/wages/all

# All workers in January 2025
GET /api/wages/all?start_date=2025-01-01&end_date=2025-01-31

# All workers in department 3
GET /api/wages/all?department_id=3

# Workers in department 3 for January 2025
GET /api/wages/all?start_date=2025-01-01&end_date=2025-01-31&department_id=3
```

**Response:**
```json
[
  {
    "worker_id": 5,
    "worker_name": "John Doe",
    "total_billable_wages": 15000.50,
    "total_non_billable_wages": 2500.00,
    "total_quantity_worked": 1000,
    "billable_quantity": 850,
    "non_billable_quantity": 150,
    "total_entries": 25,
    "billable_entries": 20,
    "non_billable_entries": 5
  },
  {
    "worker_id": 8,
    "worker_name": "Jane Smith",
    "total_billable_wages": 12500.00,
    "total_non_billable_wages": 1000.00,
    "total_quantity_worked": 800,
    "billable_quantity": 700,
    "non_billable_quantity": 100,
    "total_entries": 20,
    "billable_entries": 18,
    "non_billable_entries": 2
  }
]
```

**Note:** Results are sorted by `total_billable_wages` descending (highest earners first)

**Use Case:** Generate company-wide payroll report

---

### 3. Get Billable Work Logs

Retrieve only billable work logs with optional filtering.

**Endpoint:** `GET /api/wages/billable`

**Query Parameters:**
- `worker_id` (optional): Filter by specific worker
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

**Example Requests:**
```bash
# All billable logs
GET /api/wages/billable

# Billable logs for worker ID 5
GET /api/wages/billable?worker_id=5

# Billable logs in January 2025
GET /api/wages/billable?start_date=2025-01-01&end_date=2025-01-31

# Billable logs for worker 5 in January 2025
GET /api/wages/billable?worker_id=5&start_date=2025-01-01&end_date=2025-01-31
```

**Response:**
```json
[
  {
    "id": 101,
    "worker_id": 5,
    "sub_batch_id": 10,
    "quantity_received": 120,
    "quantity_worked": 100,
    "unit_price": 15.50,
    "work_date": "2025-01-15T00:00:00.000Z",
    "is_billable": true,
    "activity_type": "NORMAL",
    "particulars": "Regular work",
    "worker": {
      "id": 5,
      "name": "John Doe"
    },
    "sub_batch": {
      "id": 10,
      "name": "Batch A - Size M"
    }
  }
]
```

**Use Case:** Audit billable work, verify payroll calculations

---

### 4. Get Department Wage Summary

Calculate total wages for all workers in a department.

**Endpoint:** `GET /api/wages/department/:departmentId`

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

**Example Requests:**
```bash
# All-time wages for department 3
GET /api/wages/department/3

# Department 3 wages for January 2025
GET /api/wages/department/3?start_date=2025-01-01&end_date=2025-01-31
```

**Response:**
```json
{
  "department_id": 3,
  "total_workers": 5,
  "total_billable_wages": 50000.00,
  "total_non_billable_wages": 5000.00,
  "workers": [
    {
      "worker_id": 5,
      "worker_name": "John Doe",
      "total_billable_wages": 15000.50,
      "total_non_billable_wages": 2500.00,
      "total_quantity_worked": 1000,
      "billable_quantity": 850,
      "non_billable_quantity": 150,
      "total_entries": 25,
      "billable_entries": 20,
      "non_billable_entries": 5
    }
  ]
}
```

**Use Case:** Department-wise labor cost analysis, budget tracking

---

### 5. Get Sub-Batch Wage Summary

Calculate total wages spent on a specific sub-batch.

**Endpoint:** `GET /api/wages/sub-batch/:subBatchId`

**Example Requests:**
```bash
# Wages for sub-batch 10
GET /api/wages/sub-batch/10
```

**Response:**
```json
{
  "sub_batch_id": 10,
  "total_billable_wages": 8500.00,
  "total_non_billable_wages": 1200.00,
  "total_wages": 9700.00,
  "workers": [
    {
      "worker_id": 5,
      "worker_name": "John Doe",
      "billable_wages": 4500.00,
      "non_billable_wages": 500.00,
      "total_wages": 5000.00,
      "entries": 8
    },
    {
      "worker_id": 8,
      "worker_name": "Jane Smith",
      "billable_wages": 4000.00,
      "non_billable_wages": 700.00,
      "total_wages": 4700.00,
      "entries": 6
    }
  ]
}
```

**Note:** Workers are sorted by `billable_wages` descending

**Use Case:** Calculate labor cost per sub-batch, track project expenses

---

## Error Responses

All endpoints return appropriate error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid worker ID"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to calculate wages"
}
```

---

## Important Notes

### 1. Billable vs Non-Billable Work

- **Billable work** (`is_billable = true`): Regular work that should be paid
- **Non-billable work** (`is_billable = false`): Rework on rejected pieces, should NOT be paid

The supervisor controls this via a checkbox when creating worker logs.

### 2. Date Filtering

- Dates should be in **YYYY-MM-DD** format
- Both `start_date` and `end_date` are inclusive
- If only `start_date` is provided, returns all logs from that date onwards
- If only `end_date` is provided, returns all logs up to that date

### 3. Wage Calculation Formula

For each worker log entry:
```
Amount = quantity_worked × unit_price
```

Total billable wages:
```
Total = SUM(Amount) WHERE is_billable = true
```

### 4. Performance Considerations

- For large date ranges, queries may take longer
- Consider adding pagination for `/api/wages/all` in production
- Use specific date ranges when possible for better performance

---

## Frontend Integration Examples

### Fetch Worker Wages (React/Next.js)

```typescript
const fetchWorkerWages = async (workerId: number, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/wages/worker/${workerId}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch worker wages');
  }

  return await response.json();
};
```

### Fetch All Workers Wages

```typescript
const fetchAllWages = async (departmentId?: number) => {
  const params = new URLSearchParams();
  if (departmentId) params.append('department_id', departmentId.toString());

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/wages/all?${params.toString()}`
  );

  return await response.json();
};
```

---

## Database Schema Reference

The wage calculation system uses the following database fields:

### worker_logs table
- `id`: Primary key
- `worker_id`: Foreign key to workers table
- `sub_batch_id`: Foreign key to sub_batches table
- `quantity_worked`: Number of pieces worked (nullable)
- `unit_price`: Price per piece (nullable)
- `is_billable`: Boolean flag (default: true) ✅ **NEW FIELD**
- `work_date`: Date of work (nullable)
- `activity_type`: NORMAL, REJECTED, ALTERED (nullable)

---

## Testing the API

### Using cURL

```bash
# Test worker wages
curl -X GET "http://localhost:5000/api/wages/worker/5?start_date=2025-01-01&end_date=2025-01-31"

# Test all workers wages
curl -X GET "http://localhost:5000/api/wages/all"

# Test billable logs
curl -X GET "http://localhost:5000/api/wages/billable?worker_id=5"

# Test department wages
curl -X GET "http://localhost:5000/api/wages/department/3"

# Test sub-batch wages
curl -X GET "http://localhost:5000/api/wages/sub-batch/10"
```

### Using Postman

1. Create a new collection: "Wage Calculations"
2. Add requests for each endpoint above
3. Set environment variable: `base_url = http://localhost:5000/api`
4. Test with various query parameters

---

## Future Enhancements

Potential improvements for the wage system:

1. **Payment Tracking**: Add a `worker_payments` table to track actual payments made
2. **Pagination**: Add pagination to `/api/wages/all` for large datasets
3. **Export**: Add CSV/Excel export functionality
4. **Notifications**: Alert when wages are calculated/paid
5. **Approval Workflow**: Add manager approval before finalizing wages
6. **Overtime Calculation**: Support for overtime multipliers
7. **Bonuses**: Add bonus calculations based on performance

---

## Support

For issues or questions about the wage calculation system, please contact the development team.
