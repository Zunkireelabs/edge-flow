/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  X,
  Trash2,
  Edit2,
  Eye,
  Users,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  Check,
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import NepaliDatePicker from "@/app/Components/NepaliDatePicker";
import { useToast } from "@/app/Components/ToastContext";

// Filter Dropdown Option Interface
interface FilterOption {
  value: string;
  label: string;
  description?: string;
}

// Custom Filter Dropdown Component
const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
  searchable = true,
  icon,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  icon?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || label;

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isActive = value !== "all";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-all duration-200 ${
          isActive
            ? "border-[#2272B4] bg-blue-50 text-[#2272B4]"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
        }`}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="max-w-[150px] truncate">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" />
          {searchable && (
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2272B4] focus:border-transparent"
                />
              </div>
            </div>
          )}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                    value === option.value ? "bg-blue-50" : ""
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    value === option.value ? "border-[#2272B4] bg-[#2272B4]" : "border-gray-300"
                  }`}>
                    {value === option.value && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${value === option.value ? "text-[#2272B4]" : "text-gray-900"}`}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface WorkerAssignment {
  id: string | number;
  date: string;
  name?: string; // Add name for display
}

interface Department {
  id: number | string;
  name: string;
  supervisor: {
    id: number;
    name: string;
    email: string;
  } | string; // Handle both object and string formats
  workers: WorkerAssignment[];
  dept_workers?: any[]; // Backend might return this
  remarks?: string;
}

// Added interface for supervisor
interface Supervisor {
  id: string | number;
  name: string;
  email: string;
}

// Updated interface for workers
interface Worker {
  id: string | number;
  name: string;
}

const CREATE_DEPARTMENTS = process.env.NEXT_PUBLIC_CREATE_DEPARTMENTS;
const GET_DEPARTMENTS = process.env.NEXT_PUBLIC_GET_DEPARTMENTS;
const UPDATE_DEPARTMENTS = process.env.NEXT_PUBLIC_UPDATE_DEPARTMENTS;
const DELETE_DEPARTMENTS = process.env.NEXT_PUBLIC_DELETE_DEPARTMENTS;
const GET_WORKERS = process.env.NEXT_PUBLIC_GET_WORKERS;
const GET_SUPERVISOR = process.env.NEXT_PUBLIC_GET_SUPERVISOR;

const DepartmentForm = () => {
  const { showToast, showConfirm } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Table search state
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    supervisor: "",
    workers: [] as WorkerAssignment[],
    remarks: "",
  });

  const [, setWorkerInput] = useState("");
  const [, setWorkerDate] = useState("");

  // Helper function to get supervisor name
  const getSupervisorName = (supervisor: Department['supervisor']) => {
    if (typeof supervisor === 'string') {
      return supervisor;
    }
    return supervisor?.name || 'Unknown';
  };

  // Helper function to get supervisor ID
  const getSupervisorId = (supervisor: Department['supervisor']) => {
    if (typeof supervisor === 'string') {
      // Try to find supervisor by name
      const found = supervisors.find(s => s.name === supervisor);
      return found?.id?.toString() || '';
    }
    return supervisor?.id?.toString() || '';
  };

  // Helper function to process workers data
  const processWorkersData = (dept: any) => {
    // Check if dept_workers exists and has data
    if (dept.dept_workers && dept.dept_workers.length > 0) {
      return dept.dept_workers.map((dw: any) => ({
        id: dw.worker?.id || dw.workerId || '',
        name: dw.worker?.name || 'Unknown',
        date: dw.assigned_date ? new Date(dw.assigned_date).toISOString().split('T')[0] : ''
      }));
    }
    // Fallback to workers array
    return dept.workers || [];
  };

  // Filter, sort and paginate departments using useMemo
  const { paginatedDepartments, totalPages, totalFiltered } = useMemo(() => {
    // Step 1: Filter
    let filtered = departments.filter(dept => {
      // Search filter
      if (tableSearchQuery.trim()) {
        const query = tableSearchQuery.toLowerCase();
        const searchFields = [
          dept.name,
          `D${String(dept.id).padStart(3, '0')}`,
          getSupervisorName(dept.supervisor),
        ].filter(Boolean).map(f => String(f).toLowerCase());

        if (!searchFields.some(field => field.includes(query))) {
          return false;
        }
      }
      return true;
    });

    // Step 2: Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Department];
      let bVal: any = b[sortColumn as keyof Department];

      // Handle supervisor name sorting
      if (sortColumn === "supervisor") {
        aVal = getSupervisorName(a.supervisor);
        bVal = getSupervisorName(b.supervisor);
      }

      // Handle workers count sorting
      if (sortColumn === "workers") {
        aVal = a.workers?.length || 0;
        bVal = b.workers?.length || 0;
      }

      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Step 2: Paginate
    const totalFiltered = sorted.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

    return { paginatedDepartments: paginated, totalPages, totalFiltered };
  }, [departments, tableSearchQuery, sortColumn, sortDirection, currentPage, itemsPerPage]);

  // Handle sort column click
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setTableSearchQuery("");
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = tableSearchQuery.trim() !== "";

  // Reset form
  const resetFormData = () => {
    setFormData({
      id: "",
      name: "",
      supervisor: "",
      workers: [],
      remarks: "",
    });
    setWorkerInput("");
    setWorkerDate("");
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch(GET_DEPARTMENTS!);
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();

      // Process the data to normalize the structure
      const normalizedData = data.map((dept: any) => ({
        ...dept,
        workers: processWorkersData(dept)
      }));

      setDepartments(normalizedData);
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("error", "Failed to fetch departments.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch supervisors from the correct API
  const fetchSupervisors = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token used to fetch supervisors:", token);

      const res = await fetch(GET_SUPERVISOR!, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch supervisors");

      const data = await res.json();
      console.log("Supervisors API response:", data);

      // Normalize supervisors into an array
      const supervisorsArray = Array.isArray(data)
        ? data
        : data?.data || data?.supervisors || [];

      setSupervisors(supervisorsArray);
    } catch (err) {
      console.error("Fetch supervisors error:", err);
      showToast("error", "Failed to fetch supervisors.");
    }
  };

  // Fetch workers for worker assignments
  const fetchWorkers = async () => {
    try {
      const res = await fetch(GET_WORKERS!);
      if (!res.ok) throw new Error("Failed to fetch workers");
      const data: Worker[] = await res.json();
      setWorkers(data);
      console.log(data)
    } catch (err) {
      console.error("Fetch workers error:", err);
      showToast("error", "Failed to fetch workers.");
    }
  };
  useEffect(() => {
    fetchDepartments();
    fetchSupervisors();
    fetchWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save
  const handleSave = async () => {
    try {
      setSaveLoading(true);

      if (!formData.name.trim()) {
        showToast("warning", "Department name is required");
        return;
      }
      if (!formData.supervisor.trim()) {
        showToast("warning", "Supervisor is required");
        return;
      }

      // Fixed payload for Prisma
      const payload = {
        name: formData.name.trim(),
        remarks: formData.remarks.trim(),
        supervisorId: Number(formData.supervisor), 
        workers: formData.workers?.map((w) => ({
          id: Number(w.id),
          assignedDate: w.date ? new Date(w.date).toISOString() : undefined,
        })) || [],
      };

      console.log("Payload sent to backend:", payload);

      let response;
      if (editingDept) {
        response = await fetch(`${UPDATE_DEPARTMENTS}/${editingDept.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(CREATE_DEPARTMENTS!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error("Failed to save department");

      await fetchDepartments();
      showToast("success", `Department ${editingDept ? "updated" : "created"} successfully`);
    } catch (err) {
      console.error("Save error:", err);
      showToast("error", "Error saving department.");
    } finally {
      setSaveLoading(false);
      resetFormData();
      setEditingDept(null);
      setIsDrawerOpen(false);
      setIsPreview(false);
    }
  };

  // Edit
  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      id: dept.id.toString(),
      name: dept.name,
      supervisor: getSupervisorId(dept.supervisor),
      workers: dept.workers,
      remarks: dept.remarks || "",
    });
    setIsPreview(false);
    setIsDrawerOpen(true);
  };

  // Preview
  const handlePreview = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      id: dept.id.toString(),
      name: dept.name,
      supervisor: getSupervisorId(dept.supervisor),
      workers: dept.workers,
      remarks: dept.remarks || "",
    });
    setIsPreview(true);
    setIsDrawerOpen(true);
  };

  // Delete
  const handleDelete = async (id: number | string) => {
    const confirmed = await showConfirm({
      title: "Delete Department",
      message: "Are you sure you want to delete this department? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`${DELETE_DEPARTMENTS}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete department");
      await fetchDepartments();
      showToast("success", "Department deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("error", "Failed to delete department");
    }
  };

  // Close drawer
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingDept(null);
    setIsPreview(false);
    resetFormData();
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
          <p className="text-gray-600 text-sm mt-1">Manage departments, supervisors, and workers</p>
        </div>
        <button
          className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-medium hover:bg-[#1a5a8a]"
          onClick={() => {
            resetFormData();
            setIsDrawerOpen(true);
            setIsPreview(false);
          }}
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* HubSpot-style horizontal filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Sort Dropdown */}
        <FilterDropdown
          label="Sort"
          value={`${sortColumn}-${sortDirection}`}
          onChange={(val) => {
            const [col, dir] = val.split('-');
            setSortColumn(col);
            setSortDirection(dir as "asc" | "desc");
            setCurrentPage(1);
          }}
          searchable={false}
          icon={<ArrowUpDown className="w-4 h-4" />}
          options={[
            { value: "id-desc", label: "Newest first", description: "Most recently created" },
            { value: "id-asc", label: "Oldest first", description: "First created departments" },
            { value: "name-asc", label: "Name A-Z", description: "Alphabetical order" },
            { value: "name-desc", label: "Name Z-A", description: "Reverse alphabetical" },
            { value: "supervisor-asc", label: "Supervisor A-Z", description: "Sort by supervisor name" },
            { value: "workers-desc", label: "Workers (High to Low)", description: "Most workers first" },
            { value: "workers-asc", label: "Workers (Low to High)", description: "Fewest workers first" },
          ]}
        />

        {/* Advanced Filters Link */}
        <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#2272B4] transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Advanced filters
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={tableSearchQuery}
            onChange={(e) => {
              setTableSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-[#2272B4] focus:border-[#2272B4]"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Clear all
          </button>
        )}

        {/* Results Count */}
        <span className="text-sm text-gray-500 ml-auto">
          {totalFiltered} {totalFiltered === 1 ? "result" : "results"}
        </span>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Loader loading={true} message="Loading Departments..." />
          </div>
        ) : totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No departments found</p>
            <p className="text-gray-500 text-sm">
              Get started by creating your first department.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("id")}>
                      <div className="flex items-center gap-1">ID {sortColumn === "id" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Department Name {sortColumn === "name" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("supervisor")}>
                      <div className="flex items-center gap-1">Supervisor {sortColumn === "supervisor" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("workers")}>
                      <div className="flex items-center gap-1">Workers {sortColumn === "workers" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-500">D{String(dept.id).padStart(3, '0')}</td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-medium text-[#2272B4] hover:underline cursor-pointer">{dept.name}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{getSupervisorName(dept.supervisor)}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{dept.workers?.length || 0} workers</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{dept.remarks || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePreview(dept)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(dept)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-white">
              <span className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalFiltered)} of {totalFiltered}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">per page</span>
                  <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#2272B4]">
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"><ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-3" /></button>
                  <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="px-3 py-1 text-sm text-gray-700">Page {currentPage} of {totalPages || 1}</span>
                  <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"><ChevronRight className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"><ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-3" /></button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-white/30 transition-opacity duration-300"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={closeDrawer}
          />
          <div className="ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeDrawer}
            >
              <X size={20} />
            </button>
            {/* Header */}
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                {isPreview
                  ? "Department Details"
                  : editingDept
                    ? "Edit Department"
                    : "Add New Department"}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Department Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter department name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  readOnly={isPreview}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Supervisor */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Supervisor <span className="text-red-500">*</span>
                </label>
                <select
                  name="supervisor"
                  value={formData.supervisor}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, supervisor: e.target.value }))
                  }
                  disabled={isPreview}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Workers */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Assign Workers
                </label>

                {!isPreview && (
                  <div className="space-y-2">
                    {formData.workers.map((w, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={w.id}
                          onChange={(e) => {
                            const newWorkers = [...formData.workers];
                            const workerId = Number(e.target.value);
                            const workerName = workers.find(worker => worker.id == workerId)?.name || '';
                            newWorkers[index] = { ...newWorkers[index], id: workerId, name: workerName };
                            setFormData((p) => ({ ...p, workers: newWorkers }));
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                        >
                          <option value="">Select Worker</option>
                          {workers.map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name}
                            </option>
                          ))}
                        </select>

                        <NepaliDatePicker
                          value={w.date}
                          onChange={(value) => {
                            const newWorkers = [...formData.workers];
                            newWorkers[index].date = value;
                            setFormData((p) => ({ ...p, workers: newWorkers }));
                          }}
                          className="rounded-lg"
                          placeholder="Select Date"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const newWorkers = [...formData.workers];
                            newWorkers.splice(index, 1);
                            setFormData((p) => ({ ...p, workers: newWorkers }));
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          -
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          workers: [...p.workers, { id: "", date: "", name: "" }],
                        }))
                      }
                      className="px-4 py-2 bg-[#2272B4] text-white rounded hover:bg-[#0E538B] transition-colors text-sm font-medium"
                    >
                      + Add Worker
                    </button>
                  </div>
                )}

                {/* Preview Mode */}
                {isPreview && (
                  <ul className="space-y-2 mt-2">
                    {formData.workers.length > 0 ? (
                      formData.workers.map((w, index) => {
                        const workerName = w.name || workers.find((worker) => worker.id == w.id)?.name || "Unknown";
                        return (
                          <li key={index} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <span className="text-sm text-gray-900">{workerName}</span>
                            <span className="text-xs text-gray-500">{w.date}</span>
                          </li>
                        );
                      })
                    ) : (
                      <li className="text-sm text-gray-500">No workers assigned</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  placeholder="Add remarks (optional)"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, remarks: e.target.value }))
                  }
                  readOnly={isPreview}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                onClick={closeDrawer}
                disabled={saveLoading}
              >
                {isPreview ? "Close" : "Cancel"}
              </button>
              {!isPreview && (
                <button
                  className="px-6 py-2 rounded bg-[#2272B4] text-white hover:bg-[#0E538B] disabled:opacity-50 font-medium transition-colors shadow-sm"
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? "Saving..." : "Save Department"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentForm;