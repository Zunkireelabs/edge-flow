/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, X, Trash2, Edit2, Users, ChevronDown, ChevronUp, SlidersHorizontal, ChevronLeft, ChevronRight, ArrowUpDown, Search, Check } from "lucide-react";
import Loader from "@/app/Components/Loader";
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

// Supervisor interface
interface Supervisor {
  id: number;
  name: string;
  email: string;
  role: "SUPERVISOR" | "SUPER_SUPERVISOR";
  departmentId?: number | null;
  department?: {
    id: number;
    name: string;
  };
}

interface Department {
  id: number;
  name: string;
}

interface SupervisorFormData {
  name: string;
  email: string;
  password: string;
  role: "SUPERVISOR" | "SUPER_SUPERVISOR";
  departmentId: string;
}

const CREATE_SUPERVISOR = process.env.NEXT_PUBLIC_CREATE_SUPERVISOR!;
const GET_SUPERVISORS = process.env.NEXT_PUBLIC_GET_SUPERVISOR!;

const CreateSupervisor = () => {
  const { showToast, showConfirm } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<SupervisorFormData>({
    name: "",
    email: "",
    password: "",
    role: "SUPERVISOR",
    departmentId: "",
  });

  // Sorting and pagination states
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modal dropdown states
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState("");
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const departmentDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch supervisors
  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(GET_SUPERVISORS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch supervisors");
      const data = await res.json();
      const supervisorsArray = Array.isArray(data)
        ? data
        : data?.data || data?.supervisors || [];
      setSupervisors(supervisorsArray);
    } catch (err) {
      console.error(err);
      showToast("error", "Error fetching supervisors.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data || []);
      } else {
        console.error("Failed to fetch departments:", res.status);
        showToast("warning", "Could not load departments");
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      showToast("warning", "Could not load departments");
    }
  };

  useEffect(() => {
    fetchSupervisors();
    fetchDepartments();
  }, []);

  // Handle click outside for modal dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target as Node)) {
        setShowDepartmentDropdown(false);
        setDepartmentSearchQuery("");
      }
    };

    if (showRoleDropdown || showDepartmentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRoleDropdown, showDepartmentDropdown]);

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "SUPERVISOR", departmentId: "" });
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("error", "Admin not logged in!");
        window.location.href = "/login";
        return;
      }

      if (!editingId && (!formData.name || !formData.email || !formData.password)) {
        showToast("warning", "Name, email, and password are required for new supervisor");
        return;
      }

      // SUPER_SUPERVISOR cannot have department, regular SUPERVISOR must have department
      if (formData.role === "SUPERVISOR" && !formData.departmentId && !editingId) {
        showToast("warning", "Please select a department for the supervisor");
        return;
      }

      const payload: any = {};
      if (formData.name?.trim()) payload.name = formData.name.trim();
      if (formData.email?.trim()) payload.email = formData.email.trim();
      if (formData.password?.trim()) {
        if (editingId) {
          payload.newPassword = formData.password.trim();
        } else {
          payload.password = formData.password.trim();
        }
      }
      // Add role to payload
      payload.role = formData.role;
      // Add departmentId only for SUPERVISOR role
      if (formData.role === "SUPERVISOR" && formData.departmentId) {
        payload.departmentId = parseInt(formData.departmentId);
      } else if (formData.role === "SUPER_SUPERVISOR") {
        payload.departmentId = null;
      }

      const url = editingId
        ? `${CREATE_SUPERVISOR}/${editingId}`
        : CREATE_SUPERVISOR;

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save supervisor");
      }

      await fetchSupervisors();
      showToast("success", `Supervisor ${editingId ? "updated" : "created"} successfully!`);
      resetForm();
      setIsDrawerOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Error saving supervisor.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Supervisor",
      message: "Are you sure you want to delete this supervisor? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("error", "Admin not logged in!");
        window.location.href = "/login";
        return;
      }

      const res = await fetch(`${CREATE_SUPERVISOR}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to delete supervisor");
      }

      await fetchSupervisors();
      showToast("success", "Supervisor deleted successfully!");
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Error deleting supervisor.");
    }
  };

  const handleEdit = (sup: Supervisor) => {
    setFormData({
      name: sup.name,
      email: sup.email,
      password: "",
      role: sup.role || "SUPERVISOR",
      departmentId: sup.departmentId ? String(sup.departmentId) : "",
    });
    setEditingId(sup.id);
    setIsDrawerOpen(true);
  };

  // Sort and paginate supervisors using useMemo
  const { paginatedSupervisors, totalPages, totalFiltered } = useMemo(() => {
    // Step 1: Sort
    const sorted = [...supervisors].sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Supervisor];
      let bVal: any = b[sortColumn as keyof Supervisor];
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

    return { paginatedSupervisors: paginated, totalPages, totalFiltered };
  }, [supervisors, sortColumn, sortDirection, currentPage, itemsPerPage]);

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

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Supervisor View</h2>
          <p className="text-gray-500 text-sm">
            Manage Supervisor and look after it.
          </p>
        </div>

        <button
          className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-medium hover:bg-[#1a5a8a]"
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Supervisor
        </button>
      </div>

      {/* HubSpot-style Horizontal Filter Bar */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
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
            { value: "id-asc", label: "Oldest first", description: "First created supervisors" },
            { value: "name-asc", label: "Name A-Z", description: "Alphabetical order" },
            { value: "name-desc", label: "Name Z-A", description: "Reverse alphabetical" },
            { value: "email-asc", label: "Email A-Z", description: "Email alphabetical order" },
            { value: "email-desc", label: "Email Z-A", description: "Email reverse alphabetical" },
          ]}
        />

        {/* Advanced Filters Link */}
        <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#2272B4] transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Advanced filters
        </button>

        {/* Results Count */}
        <span className="text-sm text-gray-500 ml-auto">
          {totalFiltered} {totalFiltered === 1 ? "result" : "results"}
        </span>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <Loader loading={true} message="Loading Supervisors..." />
        ) : totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-900 mb-2 font-medium">No Supervisor Found</p>
            <p className="text-gray-500 text-sm">
              Get started by creating your first supervisor.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center gap-1">
                        ID
                        {sortColumn === "id" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortColumn === "name" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {sortColumn === "email" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("role")}
                    >
                      <div className="flex items-center gap-1">
                        Role
                        {sortColumn === "role" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedSupervisors.map((sup) => (
                    <tr key={sup.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-500">S{String(sup.id).padStart(3, '0')}</td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-medium text-[#2272B4] hover:underline cursor-pointer">{sup.name}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{sup.email}</td>
                      <td className="px-4 py-2">
                        {sup.role === "SUPER_SUPERVISOR" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            Super Supervisor
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Supervisor
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {sup.role === "SUPER_SUPERVISOR" ? (
                          <span className="text-gray-400 italic">All Departments</span>
                        ) : sup.department ? (
                          sup.department.name
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(sup)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(sup.id)}
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
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#2272B4]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-3" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4 -ml-3" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex ">
          <div
            className="absolute inset-0 bg-white/30 transition-opacity duration-300"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setIsDrawerOpen(false)}
            >
              <X size={20} />
            </button>
            {/* Header */}
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                {editingId ? "Edit Supervisor" : "Add New Supervisor"}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter supervisor name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Password {editingId ? <span className="text-gray-500 font-normal">(Leave blank to keep current)</span> : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder={editingId ? "Enter new password to change" : "Enter password"}
                />
              </div>

              {/* Role Selection */}
              <div className="relative" ref={roleDropdownRef}>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-left text-sm flex items-center justify-between bg-white hover:border-gray-300"
                >
                  <span className="text-gray-900">
                    {formData.role === "SUPER_SUPERVISOR" ? "Super Supervisor" : "Supervisor"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showRoleDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    {[
                      { value: 'SUPERVISOR', label: 'Supervisor', description: 'Access to assigned department only' },
                      { value: 'SUPER_SUPERVISOR', label: 'Super Supervisor', description: 'Access to all departments' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          const newRole = option.value as "SUPERVISOR" | "SUPER_SUPERVISOR";
                          setFormData({
                            ...formData,
                            role: newRole,
                            departmentId: newRole === "SUPER_SUPERVISOR" ? "" : formData.departmentId,
                          });
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                          formData.role === option.value ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          formData.role === option.value ? 'border-[#2272B4] bg-[#2272B4]' : 'border-gray-300'
                        }`}>
                          {formData.role === option.value && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${formData.role === option.value ? 'text-[#2272B4]' : 'text-gray-900'}`}>
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {formData.role === "SUPER_SUPERVISOR" && (
                  <p className="mt-1.5 text-xs text-purple-600">
                    Super Supervisors can access and manage all departments
                  </p>
                )}
              </div>

              {/* Department Selection - Only show for SUPERVISOR role */}
              {formData.role === "SUPERVISOR" && (
                <div className="relative" ref={departmentDropdownRef}>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-left text-sm flex items-center justify-between bg-white hover:border-gray-300"
                  >
                    <span className={formData.departmentId ? 'text-gray-900' : 'text-gray-400'}>
                      {formData.departmentId
                        ? departments.find(d => d.id === parseInt(formData.departmentId))?.name || 'Select department...'
                        : 'Select department...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDepartmentDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDepartmentDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                      {/* Search */}
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search departments..."
                            value={departmentSearchQuery}
                            onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2272B4]"
                          />
                        </div>
                      </div>

                      {/* Options */}
                      <div className="max-h-48 overflow-y-auto">
                        {departments
                          .filter(d => d.name.toLowerCase().includes(departmentSearchQuery.toLowerCase()))
                          .map((dept) => (
                            <button
                              key={dept.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, departmentId: String(dept.id) });
                                setShowDepartmentDropdown(false);
                                setDepartmentSearchQuery("");
                              }}
                              className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                                formData.departmentId === String(dept.id) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.departmentId === String(dept.id) ? 'border-[#2272B4] bg-[#2272B4]' : 'border-gray-300'
                              }`}>
                                {formData.departmentId === String(dept.id) && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${formData.departmentId === String(dept.id) ? 'text-[#2272B4]' : 'text-gray-900'}`}>
                                  {dept.name}
                                </div>
                                <div className="text-xs text-gray-500">Department ID: {dept.id}</div>
                              </div>
                            </button>
                          ))}

                        {departments.filter(d => d.name.toLowerCase().includes(departmentSearchQuery.toLowerCase())).length === 0 && (
                          <div className="px-3 py-4 text-sm text-gray-500 text-center">No departments found</div>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="mt-1.5 text-xs text-gray-500">
                    This supervisor will only have access to the selected department
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                onClick={() => setIsDrawerOpen(false)}
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded bg-[#2272B4] text-white hover:bg-[#0E538B] disabled:opacity-50 font-medium transition-colors shadow-sm"
                onClick={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? "Saving..." : editingId ? "Update Supervisor" : "Save Supervisor"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default CreateSupervisor;
