/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  Package,
  RefreshCw,
  Trash2,
  Eye,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  ArrowUpDown,
  SlidersHorizontal,
  FileX,
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import { useToast } from "@/app/Components/ToastContext";
import { useDepartment } from "../../contexts/DepartmentContext";
import { formatNepaliDate } from "@/app/utils/dateUtils";

const API = process.env.NEXT_PUBLIC_API_URL;

interface SubBatch {
  id: number;
  name: string;
  estimated_pieces: number;
  expected_items: string;
  start_date: string;
  due_date: string;
  produced_quantity: number;
  roll_id?: number | null;
  batch_id?: number | null;
  department_id?: number | null;
  status?: "DRAFT" | "IN_PRODUCTION" | "COMPLETED" | "CANCELLED";
  total_quantity?: number;
  attachments?: Array<{
    id?: number;
    attachment_name?: string;
    name?: string;
    quantity?: number;
  }>;
  batch?: {
    id: number;
    name: string;
    color?: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

interface Department {
  id: number;
  name: string;
}

interface Roll {
  id: number;
  name: string;
  color?: string;
}

interface Batch {
  id: number;
  name: string;
  color?: string;
  quantity?: number;
  unit?: string;
}

// Workflow step for Send to Production
interface WorkflowStep {
  current: string;
  next?: string;
  departmentId?: number;
}

// Form data for edit modal
interface EditFormData {
  name: string;
  estimatedPieces: string;
  startDate: string;
  dueDate: string;
}

// Attachment type
interface Attachment {
  name: string;
  quantity: string;
}

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

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || label;

  // Filter options based on search
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle click outside to close
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

  // Handle option select
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Check if filter is active (not default "all" value)
  const isActive = value !== "all" && value !== "id-desc";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-md transition-all duration-200 ${
          isActive
            ? "border-[#2272B4] bg-blue-50 text-[#2272B4]"
            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
        }`}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="max-w-[120px] truncate">{displayLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Arrow pointer */}
          <div className="absolute -top-2 left-4 w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45" />

          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#2272B4] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-start gap-2.5 ${
                    value === option.value ? "bg-blue-50" : ""
                  }`}
                >
                  {/* Selection indicator */}
                  <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    value === option.value
                      ? "border-[#2272B4] bg-[#2272B4]"
                      : "border-gray-300"
                  }`}>
                    {value === option.value && (
                      <Check className="w-2 h-2 text-white" />
                    )}
                  </div>

                  {/* Option content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium ${value === option.value ? "text-[#2272B4]" : "text-gray-900"}`}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-[11px] text-gray-500 mt-0.5">{option.description}</div>
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

const SubBatchView = () => {
  const { showToast, showConfirm } = useToast();
  const { selectedDepartmentId, isSuperSupervisor } = useDepartment();

  const [subBatches, setSubBatches] = useState<SubBatch[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state for send to production
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedSubBatch, setSelectedSubBatch] = useState<SubBatch | null>(null);
  const [departmentWorkflow, setDepartmentWorkflow] = useState<WorkflowStep[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubBatch, setEditingSubBatch] = useState<SubBatch | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: "",
    estimatedPieces: "",
    startDate: "",
    dueDate: "",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Filter states (HubSpot-style horizontal filters)
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>("all");
  const [selectedRollFilter, setSelectedRollFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Table search state
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  // Fetch departments for send-to-production dropdown
  const fetchDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllDepartments(response.data);
    } catch {
      // Error fetching departments
    }
  }, []);

  // Fetch rolls
  const fetchRolls = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/rolls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRolls(response.data || []);
    } catch {
      // Error fetching rolls
    }
  }, []);

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/batches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(response.data || []);
    } catch {
      // Error fetching batches
    }
  }, []);

  // Fetch sub-batches based on department selection
  const fetchSubBatches = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const storedDepartmentId = localStorage.getItem("departmentId");

      // Determine target department(s)
      const targetDeptId = isSuperSupervisor
        ? (typeof selectedDepartmentId === "number" ? selectedDepartmentId : null)
        : storedDepartmentId ? parseInt(storedDepartmentId) : null;

      // For SUPER_SUPERVISOR with "all" - fetch all sub-batches
      if (isSuperSupervisor && selectedDepartmentId === "all") {
        const response = await axios.get(`${API}/sub-batches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubBatches(response.data || []);
      } else if (targetDeptId) {
        // Fetch sub-batches for specific department via department_sub_batches
        const response = await axios.get(
          `${API}/departments/${targetDeptId}/sub-batches`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Extract sub-batches from kanban data structure
        const kanbanData = response.data.data;
        const allSubBatches: SubBatch[] = [];

        // Combine all stages
        ["newArrival", "inProgress", "completed"].forEach(stage => {
          if (kanbanData[stage]) {
            kanbanData[stage].forEach((item: any) => {
              if (item.sub_batch) {
                allSubBatches.push({
                  ...item.sub_batch,
                  status: stage === "completed" ? "COMPLETED" :
                          stage === "inProgress" ? "IN_PRODUCTION" : "DRAFT"
                });
              }
            });
          }
        });

        // Remove duplicates by id
        const uniqueSubBatches = allSubBatches.filter(
          (sb, index, self) => index === self.findIndex((t) => t.id === sb.id)
        );

        setSubBatches(uniqueSubBatches);
      }
    } catch {
      showToast("error", "Failed to fetch sub-batches");
    } finally {
      setLoading(false);
    }
  }, [isSuperSupervisor, selectedDepartmentId, showToast]);

  useEffect(() => {
    fetchDepartments();
    fetchRolls();
    fetchBatches();
  }, [fetchDepartments, fetchRolls, fetchBatches]);

  useEffect(() => {
    fetchSubBatches();
  }, [fetchSubBatches]);

  // Helper functions
  const getRollName = (roll_id: number | null | undefined): string => {
    if (!roll_id) return "-";
    const roll = rolls.find((r) => r.id === roll_id);
    return roll ? roll.name : "-";
  };

  const getBatchName = (batch_id: number | null | undefined): string => {
    if (!batch_id) return "-";
    const batch = batches.find((b) => b.id === batch_id);
    return batch ? batch.name : "-";
  };

  const getRollColor = (roll_id: number | null | undefined): string | null => {
    if (!roll_id) return null;
    const roll = rolls.find((r) => r.id === roll_id);
    return roll?.color || null;
  };

  // Color badge helpers
  const getColorBg = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      black: '#1f2937', red: '#ef4444', blue: '#3b82f6',
      green: '#22c55e', yellow: '#fbbf24', pink: '#f472b6',
      white: '#f3f4f6', orange: '#f97316', purple: '#a855f7',
      brown: '#92400e', gray: '#6b7280', grey: '#6b7280',
      navy: '#1e3a5f', maroon: '#7f1d1d', teal: '#14b8a6',
      cyan: '#06b6d4', lime: '#84cc16', indigo: '#6366f1',
      violet: '#8b5cf6', rose: '#f43f5e', amber: '#f59e0b',
      emerald: '#10b981', sky: '#0ea5e9', slate: '#64748b',
    };
    return colorMap[colorName?.toLowerCase()] || '#e5e7eb';
  };

  const getColorText = (colorName: string): string => {
    const darkColors = ['black', 'red', 'blue', 'green', 'purple', 'brown', 'gray', 'grey', 'navy', 'maroon', 'indigo', 'violet'];
    return darkColors.includes(colorName?.toLowerCase()) ? '#ffffff' : '#1f2937';
  };

  // Filter, sort, and paginate sub batches using useMemo
  const { paginatedSubBatches, totalPages, totalFiltered } = useMemo(() => {
    // Step 1: Filter
    let filtered = subBatches.filter(sb => {
      // Status filter
      if (selectedStatus !== "all" && sb.status !== selectedStatus) return false;
      // Batch filter
      if (selectedBatchFilter !== "all" && sb.batch_id !== Number(selectedBatchFilter)) return false;
      // Roll filter
      if (selectedRollFilter !== "all" && sb.roll_id !== Number(selectedRollFilter)) return false;

      // Search filter
      if (tableSearchQuery.trim()) {
        const query = tableSearchQuery.toLowerCase();
        const batchName = batches.find(b => b.id === sb.batch_id)?.name;
        const rollName = rolls.find(r => r.id === sb.roll_id)?.name;
        const searchFields = [
          sb.name,
          `SB${String(sb.id).padStart(3, '0')}`,
          sb.status,
          batchName,
          rollName,
        ].filter(Boolean).map(f => String(f).toLowerCase());

        if (!searchFields.some(field => field.includes(query))) {
          return false;
        }
      }

      return true;
    });

    // Step 2: Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortColumn) {
        case "id":
          aVal = a.id;
          bVal = b.id;
          break;
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "estimated_pieces":
          aVal = a.estimated_pieces || 0;
          bVal = b.estimated_pieces || 0;
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "start_date":
          aVal = a.start_date ? new Date(a.start_date).getTime() : 0;
          bVal = b.start_date ? new Date(b.start_date).getTime() : 0;
          break;
        case "due_date":
          aVal = a.due_date ? new Date(a.due_date).getTime() : 0;
          bVal = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    // Step 3: Paginate
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { paginatedSubBatches: paginated, totalPages, totalFiltered };
  }, [subBatches, selectedStatus, selectedBatchFilter, selectedRollFilter, tableSearchQuery, sortColumn, sortDirection, currentPage, itemsPerPage, batches, rolls]);

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

  // Get sort display value for dropdown
  const getSortValue = (): string => {
    return `${sortColumn}-${sortDirection}`;
  };

  // Handle sort dropdown change
  const handleSortChange = (value: string) => {
    const [col, dir] = value.split("-");
    setSortColumn(col);
    setSortDirection(dir as "asc" | "desc");
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedStatus("all");
    setSelectedBatchFilter("all");
    setSelectedRollFilter("all");
    setTableSearchQuery("");
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedStatus !== "all" || selectedBatchFilter !== "all" || selectedRollFilter !== "all" || tableSearchQuery.trim() !== "";

  // Toggle row selection
  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Toggle all rows (only on current page)
  const toggleAllRows = () => {
    if (selectedRows.size === paginatedSubBatches.length && paginatedSubBatches.every(sb => selectedRows.has(sb.id))) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedSubBatches.map(sb => sb.id)));
    }
  };

  // Open send to production modal
  const handleOpenSendModal = (subBatch: SubBatch) => {
    setSelectedSubBatch(subBatch);
    setDepartmentWorkflow([{ current: "", departmentId: undefined }]);
    setShowSendModal(true);
  };

  // Open edit modal
  const handleEdit = (subBatch: SubBatch, preview: boolean = false) => {
    setEditingSubBatch(subBatch);

    // Map attachments from sub-batch
    const mappedAttachments = subBatch.attachments?.map((a: any) => ({
      name: a.attachment_name || a.name || "",
      quantity: a.quantity?.toString() || "",
    })) || [];

    setAttachments(mappedAttachments);

    setEditFormData({
      name: subBatch.name || "",
      estimatedPieces: subBatch.estimated_pieces?.toString() || "",
      startDate: subBatch.start_date ? subBatch.start_date.split("T")[0] : "",
      dueDate: subBatch.due_date ? subBatch.due_date.split("T")[0] : "",
    });

    setIsPreview(preview);
    setIsEditModalOpen(true);
  };

  // Add attachment row
  const handleAddAttachment = () => {
    setAttachments([...attachments, { name: "", quantity: "" }]);
  };

  // Update attachment
  const handleAttachmentChange = (index: number, field: "name" | "quantity", value: string) => {
    const newAttachments = [...attachments];
    newAttachments[index][field] = value;
    setAttachments(newAttachments);
  };

  // Delete attachment
  const handleDeleteAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Save edit (Super Supervisor can only edit attachments and dates)
  const handleSaveEdit = async () => {
    if (!editingSubBatch) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");

      const payload: any = {
        startDate: editFormData.startDate ? `${editFormData.startDate}T00:00:00.000Z` : null,
        dueDate: editFormData.dueDate ? `${editFormData.dueDate}T00:00:00.000Z` : null,
        attachments: attachments.filter(a => a.name.trim()).map(a => ({
          attachmentName: a.name,
          quantity: parseInt(a.quantity) || 0,
        })),
      };

      await axios.put(`${API}/sub-batches/${editingSubBatch.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("success", "Sub-batch updated successfully!");
      setIsEditModalOpen(false);
      setEditingSubBatch(null);
      fetchSubBatches();
    } catch (error: any) {
      showToast("error", error.response?.data?.message || "Failed to update sub-batch");
    } finally {
      setIsSaving(false);
    }
  };

  // Send sub-batch to production with workflow
  const handleSendToProduction = async () => {
    if (!selectedSubBatch) {
      showToast("warning", "No sub-batch selected");
      return;
    }

    const validWorkflow = departmentWorkflow.filter(step => step.current && step.departmentId);
    if (validWorkflow.length === 0) {
      showToast("warning", "Please select at least one department for the workflow");
      return;
    }

    const confirmed = await showConfirm({
      title: "Send to Production",
      message: `Are you sure you want to send "${selectedSubBatch.name}" to production with ${validWorkflow.length} department(s) in the workflow?`,
      confirmText: "Confirm & Send",
      cancelText: "Cancel",
      type: "info",
    });

    if (!confirmed) return;

    try {
      setIsSending(true);
      const token = localStorage.getItem("token");

      const payload = {
        subBatchId: selectedSubBatch.id,
        manualDepartments: validWorkflow.map(step => step.departmentId),
        total_quantity: selectedSubBatch.total_quantity || selectedSubBatch.estimated_pieces || 0,
      };

      const response = await axios.post(
        `${API}/sub-batches/send-to-production`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const workflow = response.data.workflow;
        showToast(
          "success",
          `Sub-batch sent to production! Workflow ID: ${workflow.id}, Steps: ${workflow.steps.length} departments`
        );

        setShowSendModal(false);
        setSelectedSubBatch(null);
        setDepartmentWorkflow([]);
        fetchSubBatches();
      } else {
        showToast("error", "Failed to send sub-batch to production");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to send to production";
      showToast("error", errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "IN_PRODUCTION":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            In Production
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="flex items-center justify-center py-12">
          <Loader loading={true} message="Loading sub-batches..." />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sub Batch View</h1>
          <p className="text-sm text-gray-500">
            Manage sub batches and track progress
          </p>
        </div>
        <button
          onClick={fetchSubBatches}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* HubSpot-style Horizontal Filter Bar */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={tableSearchQuery}
            onChange={(e) => { setTableSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-[#2272B4] focus:border-transparent"
          />
        </div>

        {/* Status Filter Dropdown */}
        <FilterDropdown
          label="All Status"
          value={selectedStatus}
          onChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}
          options={[
            { value: "all", label: "All Status", description: "Show all sub-batches" },
            { value: "DRAFT", label: "Draft", description: "Not yet sent to production" },
            { value: "IN_PRODUCTION", label: "In Production", description: "Currently in departments" },
            { value: "COMPLETED", label: "Completed", description: "All departments finished" },
            { value: "CANCELLED", label: "Cancelled", description: "Production was cancelled" },
          ]}
        />

        {/* Batch Filter Dropdown */}
        <FilterDropdown
          label="All Batches"
          value={selectedBatchFilter}
          onChange={(val) => { setSelectedBatchFilter(val); setCurrentPage(1); }}
          options={[
            { value: "all", label: "All Batches", description: "Show sub-batches from all batches" },
            ...batches.map(batch => ({
              value: String(batch.id),
              label: batch.name,
              description: `${batch.quantity || 0} ${batch.unit || 'pcs'} • ${batch.color || 'No color'}`
            }))
          ]}
        />

        {/* Roll Filter Dropdown */}
        <FilterDropdown
          label="All Rolls"
          value={selectedRollFilter}
          onChange={(val) => { setSelectedRollFilter(val); setCurrentPage(1); }}
          options={[
            { value: "all", label: "All Rolls", description: "Show sub-batches from all rolls" },
            ...rolls.map(roll => ({
              value: String(roll.id),
              label: roll.name,
              description: roll.color || 'No color'
            }))
          ]}
        />

        {/* Sort Dropdown */}
        <FilterDropdown
          label="Newest first"
          value={getSortValue()}
          onChange={handleSortChange}
          searchable={false}
          icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          options={[
            { value: "id-desc", label: "Newest first", description: "Most recently created" },
            { value: "id-asc", label: "Oldest first", description: "First created sub-batches" },
            { value: "name-asc", label: "Name A-Z", description: "Alphabetical order" },
            { value: "name-desc", label: "Name Z-A", description: "Reverse alphabetical" },
            { value: "status-asc", label: "Status A-Z", description: "By status alphabetically" },
            { value: "status-desc", label: "Status Z-A", description: "Status reverse order" },
          ]}
        />

        {/* Advanced filters button (placeholder) */}
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-300 rounded-md text-gray-600 hover:border-gray-400 transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Clear all button (visible when filters active) */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            Clear all
          </button>
        )}

        {/* Results Count */}
        <span className="text-xs text-gray-400 ml-auto">
          {totalFiltered} {totalFiltered === 1 ? "result" : "results"}
        </span>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="rounded-[10px] p-6 m-4 flex flex-col items-center">
              <div className="bg-gray-100 mb-4 w-20 aspect-square rounded-full flex items-center justify-center">
                <FileX size={48} className="text-gray-300" />
              </div>
              <h3 className="text-black mb-2 font-bold">No sub batches found</h3>
              <p className="text-gray-500 font-medium">
                {hasActiveFilters ? "Try adjusting your filters" : "Sub-batches will appear here when created by admin."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 text-sm text-[#2272B4] hover:underline font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-max w-full">
                <thead>
                  <tr className="border-b border-gray-200" style={{ backgroundColor: 'rgb(247, 242, 242)' }}>
                    <th className="px-4 py-2 text-left w-12 whitespace-nowrap border-r border-gray-200">
                      <input
                        type="checkbox"
                        checked={paginatedSubBatches.length > 0 && paginatedSubBatches.every(sb => selectedRows.has(sb.id))}
                        onChange={toggleAllRows}
                        className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]"
                      />
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap border-r border-gray-200"
                      style={{ color: '#141414', fontWeight: 500 }}
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center gap-1">
                        Id
                        {sortColumn === "id" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap border-r border-gray-200"
                      style={{ color: '#141414', fontWeight: 500 }}
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortColumn === "name" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap border-r border-gray-200"
                      style={{ color: '#141414', fontWeight: 500 }}
                      onClick={() => handleSort("estimated_pieces")}
                    >
                      <div className="flex items-center gap-1">
                        Pieces
                        {sortColumn === "estimated_pieces" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>
                      Color
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>
                      Parent Batch
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>
                      Parent Roll
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap border-r border-gray-200"
                      style={{ color: '#141414', fontWeight: 500 }}
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortColumn === "status" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap border-r border-gray-200"
                      style={{ color: '#141414', fontWeight: 500 }}
                      onClick={() => handleSort("start_date")}
                    >
                      <div className="flex items-center gap-1">
                        Start Date
                        {sortColumn === "start_date" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap border-r border-gray-200"
                      style={{ color: '#141414', fontWeight: 500 }}
                      onClick={() => handleSort("due_date")}
                    >
                      <div className="flex items-center gap-1">
                        Due Date
                        {sortColumn === "due_date" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium whitespace-nowrap" style={{ color: '#141414', fontWeight: 500 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedSubBatches.map((sb) => (
                    <tr
                      key={sb.id}
                      className={`transition-colors ${selectedRows.has(sb.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-1.5 whitespace-nowrap border-r border-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(sb.id)}
                          onChange={() => toggleRowSelection(sb.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]"
                        />
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-500 whitespace-nowrap border-r border-gray-200 font-light">
                        SB{String(sb.id).padStart(3, '0')}
                      </td>
                      <td className="px-4 py-1.5 whitespace-nowrap border-r border-gray-200">
                        <span
                          className="text-sm font-medium text-[#2272B4] hover:underline cursor-pointer"
                          onClick={() => handleEdit(sb, true)}
                        >
                          {sb.name}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 whitespace-nowrap border-r border-gray-200 font-light">
                        {sb.estimated_pieces?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-1.5 text-sm whitespace-nowrap border-r border-gray-200">
                        {(() => {
                          const color = getRollColor(sb.roll_id);
                          if (color) {
                            return (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: getColorBg(color), color: getColorText(color) }}
                              >
                                {color}
                              </span>
                            );
                          }
                          return <span className="text-gray-400 font-light">—</span>;
                        })()}
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 whitespace-nowrap border-r border-gray-200 font-light">
                        {getBatchName(sb.batch_id)}
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 whitespace-nowrap border-r border-gray-200 font-light">
                        {getRollName(sb.roll_id)}
                      </td>
                      <td className="px-4 py-1.5 text-sm whitespace-nowrap border-r border-gray-200">
                        {getStatusBadge(sb.status)}
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 whitespace-nowrap border-r border-gray-200 font-light">
                        {formatNepaliDate(sb.start_date)}
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 whitespace-nowrap border-r border-gray-200 font-light">
                        {formatNepaliDate(sb.due_date)}
                      </td>
                      <td className="px-4 py-1.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(sb, true)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(sb, false)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          {/* Divider */}
                          <div className="w-px h-4 bg-gray-300 mx-1"></div>
                          {/* Send to Production - Prominent Green Pill Button */}
                          <button
                            onClick={() => handleOpenSendModal(sb)}
                            disabled={
                              sb.status === "COMPLETED" ||
                              sb.status === "IN_PRODUCTION"
                            }
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              sb.status === "COMPLETED" ||
                              sb.status === "IN_PRODUCTION"
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                            title={
                              sb.status === "IN_PRODUCTION"
                                ? "Already in production"
                                : sb.status === "COMPLETED"
                                ? "Already completed"
                                : "Send to production"
                            }
                          >
                            <Package size={12} />
                            Send
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalFiltered)} of {totalFiltered}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">per page</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#2272B4]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    title="First page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-3" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    title="Previous page"
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
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    title="Last page"
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

      {/* Send to Production Modal - Workflow Builder */}
      {showSendModal && selectedSubBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowSendModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                Send Sub Batch to Production
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Define the department workflow for this sub batch
            </p>

            {/* Sub Batch Summary */}
            <div className="border border-gray-300 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900 mb-2">Sub Batch Summary</p>
              <div className="flex justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Name: {selectedSubBatch.name}
                </p>
                <p className="text-sm text-gray-600">
                  ID: B{selectedSubBatch.id.toString().padStart(4, "0")}
                </p>
              </div>
              <div className="flex justify-between gap-4 mt-1">
                <p className="text-sm text-gray-600">
                  Estimated Quantity: {selectedSubBatch.estimated_pieces || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedSubBatch.start_date && selectedSubBatch.due_date
                    ? `${new Date(selectedSubBatch.start_date).toLocaleDateString()} - ${new Date(selectedSubBatch.due_date).toLocaleDateString()}`
                    : "-"}
                </p>
              </div>
            </div>

            {/* Workflow Builder */}
            <div className="border border-gray-300 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900 mb-3">Workflow Builder</p>

              {/* Workflow Steps */}
              {departmentWorkflow.map((row, index) => (
                <div key={index} className="flex items-center gap-3 mb-2">
                  <select
                    value={row.current}
                    onChange={(e) => {
                      const selectedDept = allDepartments.find(d => d.name === e.target.value);
                      const newWorkflow = [...departmentWorkflow];
                      newWorkflow[index].current = e.target.value;
                      newWorkflow[index].departmentId = selectedDept?.id;
                      setDepartmentWorkflow(newWorkflow);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">
                      {index === 0 ? "Select Start Department" : "Select Next Department"}
                    </option>
                    {allDepartments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      const newWorkflow = [...departmentWorkflow];
                      newWorkflow.splice(index, 1);
                      setDepartmentWorkflow(newWorkflow);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Add Department Button */}
              <button
                onClick={() =>
                  setDepartmentWorkflow([...departmentWorkflow, { current: "", departmentId: undefined }])
                }
                className="mt-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
              >
                + {departmentWorkflow.length === 0 ? "Add Start Department" : "Add Next Department"}
              </button>
            </div>

            {/* Workflow Preview */}
            {departmentWorkflow.length > 0 && (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-4">
                <p className="font-medium text-gray-900 mb-2">Workflow Preview</p>
                <div className="flex flex-wrap items-center gap-2 text-gray-700">
                  {departmentWorkflow.map((row, index) => (
                    <React.Fragment key={index}>
                      <span className="px-3 py-1 bg-white border border-gray-300 rounded text-sm">
                        {row.current || "?"}
                      </span>
                      {index < departmentWorkflow.length - 1 && (
                        <span className="text-blue-500 font-bold">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendToProduction}
                disabled={isSending || departmentWorkflow.filter(step => step.current && step.departmentId).length === 0}
                className={`px-4 py-2 rounded-lg text-white transition ${
                  isSending || departmentWorkflow.filter(step => step.current && step.departmentId).length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSending ? "Sending..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Right Side Slide-out */}
      {isEditModalOpen && editingSubBatch && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-white/30 transition-opacity duration-300"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Modal Panel */}
          <div className="ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isPreview ? "View Sub Batch" : "Edit Sub Batch"}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {isPreview ? (
              // Preview Mode - Read Only Display
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">ID</span>
                  <span className="text-sm text-gray-600">
                    SB{editingSubBatch.id.toString().padStart(4, "0")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Name</span>
                  <span className="text-sm text-gray-600">{editFormData.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Parent Batch</span>
                  <span className="text-sm text-gray-600">
                    {getBatchName(editingSubBatch.batch_id)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Parent Roll</span>
                  <span className="text-sm text-gray-600">
                    {getRollName(editingSubBatch.roll_id)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Pieces</span>
                  <span className="text-sm text-gray-600">{editFormData.estimatedPieces}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Color</span>
                  <span className="text-sm text-gray-600">
                    {(() => {
                      const color = getRollColor(editingSubBatch.roll_id);
                      if (color) {
                        return (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: getColorBg(color), color: getColorText(color) }}
                          >
                            {color}
                          </span>
                        );
                      }
                      return "-";
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Start Date</span>
                  <span className="text-sm text-gray-600">
                    {editFormData.startDate || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Due Date</span>
                  <span className="text-sm text-gray-600">
                    {editFormData.dueDate || "-"}
                  </span>
                </div>

                {/* Attachments in Preview */}
                {attachments.length > 0 && (
                  <div className="py-2">
                    <p className="font-medium text-gray-900 mb-3">Attachments</p>
                    <table className="w-full border border-gray-200 rounded">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">
                            Name
                          </th>
                          <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {attachments.map((att, index) => (
                          <tr key={index}>
                            <td className="text-sm text-gray-600 px-3 py-2">{att.name}</td>
                            <td className="text-sm text-gray-600 px-3 py-2">{att.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Edit Mode - Limited Fields for Super Supervisor
              <div className="space-y-4">
                {/* Name - Read Only for Super Supervisor */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Sub Batch Name
                    <span className="text-xs text-gray-500 font-normal ml-2">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    disabled={true}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Batch - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Parent Batch
                    <span className="text-xs text-gray-500 font-normal ml-2">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={getBatchName(editingSubBatch.batch_id)}
                    disabled={true}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Pieces - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Estimated Pieces
                    <span className="text-xs text-gray-500 font-normal ml-2">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.estimatedPieces}
                    disabled={true}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Attachments - Editable */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-900">
                      Attachment
                    </label>
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Attachment
                    </button>
                  </div>

                  {attachments.map((att, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={att.name}
                        onChange={(e) => handleAttachmentChange(index, "name", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Attachment name"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={att.quantity}
                          onChange={(e) => handleAttachmentChange(index, "quantity", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Quantity"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(index)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dates - Editable */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, startDate: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.dueDate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, dueDate: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> As a Super Supervisor, you can only edit Attachments and Dates.
                    Other fields are managed by Admin.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {isSaving ? "Saving..." : "Update Sub Batch"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubBatchView;
