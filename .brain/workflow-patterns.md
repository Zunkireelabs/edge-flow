# BlueShark - Workflow Patterns & Best Practices

**Last Updated:** November 29, 2025
**Purpose:** Established patterns for consistent development

---

## UI/UX Patterns

### Modal Design Pattern

All modals in BlueShark follow these standards:

```tsx
// Modal Container
<div className="fixed inset-0 z-50 flex">
  {/* Blur Backdrop */}
  <div
    className="absolute inset-0 bg-white/30 transition-opacity duration-300"
    style={{ backdropFilter: 'blur(4px)' }}
    onClick={closeDrawer}
  />

  {/* Modal Content */}
  <div className="ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto">
    {/* Header */}
    <div className="flex justify-between items-center mb-3 pb-3 border-b">
      <h2 className="text-lg font-semibold">Title</h2>
      <button onClick={closeDrawer}>
        <X size={20} />
      </button>
    </div>

    {/* Form Content */}
    <div className="space-y-3">
      {/* Form fields */}
    </div>

    {/* Sticky Footer */}
    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
      <button className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
        Save
      </button>
    </div>
  </div>
</div>
```

**Key Properties:**
- `max-w-xl` (640px width)
- `h-screen` (full height)
- No border radius
- Blur backdrop (`blur(4px)`)
- Sticky footer buttons
- Compact spacing (`space-y-3`, `p-4`)

---

### Button Patterns

**Primary Action Buttons (Add/Create):**
```tsx
<button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
  <Plus className="w-4 h-4" />
  Add Item
</button>
```

**Cancel/Secondary Buttons:**
```tsx
<button className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors">
  Cancel
</button>
```

**Submit/Save Buttons:**
```tsx
<button className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm">
  Save
</button>
```

---

### Form Input Pattern

```tsx
<div>
  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
    Field Name <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    value={formData.field}
    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
    className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
    required
  />
</div>
```

**Key Properties:**
- `rounded-[10px]` for inputs
- `focus:ring-1` (not ring-2)
- `text-sm` for input text
- `mb-1.5` for label margin

---

### Dropdown/Select Pattern

**Rich Dropdown (with details):**
```tsx
<select className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
  <option value="">Select item...</option>
  {items.sort((a, b) => b.id - a.id).map((item) => (
    <option key={item.id} value={item.id}>
      {`${item.name} (ID: ${item.id}) | Qty: ${item.quantity} | Status: ${item.status}`}
    </option>
  ))}
</select>
```

---

## Data Fetching Pattern

```tsx
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setData(response.data);
  } catch (err) {
    console.error("Error fetching data:", err);
    setError("Failed to load data");
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

## Worker Assignment Pattern

```tsx
// Validation before assignment
const handleAssignWorker = async () => {
  const quantity = parseInt(newWorkerQuantity);

  // Validate quantity is positive
  if (isNaN(quantity) || quantity <= 0) {
    alert('Please enter a valid quantity greater than 0');
    return;
  }

  // Check against remaining work
  if (quantity > remainingWork) {
    alert(`Cannot assign ${quantity} units!\nOnly ${remainingWork} units remaining.`);
    return;
  }

  // Proceed with assignment
  try {
    const response = await axios.post(API_URL, {
      worker_id: newWorkerId,
      quantity: quantity,
      date: newWorkerDate,
      is_billable: isBillable,
      department_sub_batch_id: taskData.id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Refresh data
    await fetchWorkerRecords();
    resetForm();
  } catch (error) {
    console.error("Assignment failed:", error);
    alert("Failed to assign worker");
  }
};
```

---

## Department Advancement Pattern

```tsx
const handleAdvanceToDepartment = async () => {
  // Validate quantity
  if (!quantityBeingSent || !quantityBeingSent.trim()) {
    alert('Please enter the quantity you want to send');
    return;
  }

  const quantity = parseInt(quantityBeingSent);
  const availableQuantity = taskData.quantity_remaining ?? taskData.total_quantity;

  if (quantity > availableQuantity) {
    alert(`Cannot send ${quantity} pieces!\nOnly ${availableQuantity} available.`);
    return;
  }

  const requestBody = {
    departmentSubBatchId: taskData.id,
    toDepartmentId: parseInt(sendToDepartment),
    quantityBeingSent: quantity
  };

  const response = await axios.post(
    process.env.NEXT_PUBLIC_SEND_TO_ANOTHER_DEPARTMENT,
    requestBody,
    { headers: { Authorization: `Bearer ${token}` }}
  );
};
```

---

## Edit/Delete Actions Pattern

```tsx
// Three-dot menu state
const [openMenuId, setOpenMenuId] = useState<number | null>(null);

// In table row
<td className="relative">
  <button onClick={() => setOpenMenuId(record.id)}>
    <MoreVertical size={18} />
  </button>

  {openMenuId === record.id && (
    <div className="absolute right-0 top-full z-10 bg-white shadow-lg rounded-lg border py-1 min-w-[100px]">
      <button
        onClick={() => handleEditWorker(record)}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
      >
        Edit
      </button>
      <button
        onClick={() => handleDeleteWorker(record.id)}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  )}
</td>
```

---

## Authentication Pattern

```tsx
// Login
const handleLogin = async (email: string, password: string) => {
  const response = await axios.post(LOGIN_URL, { email, password });

  localStorage.setItem("token", response.data.token);
  localStorage.setItem("role", response.data.role);
  if (response.data.departmentId) {
    localStorage.setItem("departmentId", response.data.departmentId);
  }

  // Redirect based on role
  if (response.data.role === "ADMIN") {
    router.push("/Dashboard");
  } else {
    router.push("/SupervisorDashboard");
  }
};

// Logout
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("departmentId");
  router.push("/loginandsignup");
};

// Auth header
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
});
```

---

## Color Coding Pattern (Kanban Cards)

```tsx
// Card type badges
const getCardColor = (type: string) => {
  switch (type) {
    case 'REJECTED':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'ALTERED':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'ASSIGNED':
      return 'bg-blue-100 border-blue-300 text-blue-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

// Billable status
const BillableStatus = ({ isBillable }: { isBillable: boolean }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs ${
    isBillable
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-600'
  }`}>
    {isBillable ? 'Billable' : 'Not Billable'}
  </span>
);
```

---

## Date Handling (Nepali Calendar)

```tsx
import NepaliDatePicker from "@/app/Components/NepaliDatePicker";

<NepaliDatePicker
  value={formData.date}
  onChange={(nepaliDate: string) => setFormData({ ...formData, date: nepaliDate })}
  className="rounded-[10px]"
  required
/>
```

---

## Error Handling Pattern

```tsx
try {
  const response = await axios.post(API_URL, data, {
    headers: getAuthHeaders()
  });

  if (response.status === 200 || response.status === 201) {
    // Success
    await refreshData();
    closeModal();
  }
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || "Operation failed";
    alert(message);
  } else {
    alert("An unexpected error occurred");
  }
  console.error("Error:", error);
}
```

---

## Loading State Pattern

```tsx
{loading ? (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
) : (
  <div>
    {/* Content */}
  </div>
)}
```

---

**These patterns ensure consistency across BlueShark. Follow them for all new features.**
