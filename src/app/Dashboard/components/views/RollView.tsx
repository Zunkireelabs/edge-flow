"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  X,
  Trash2,
  Edit2,
  Package,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Check,
  Building2,
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import { useToast } from "@/app/Components/ToastContext";
import { formatNepaliDate } from "@/app/utils/dateUtils";
import { formatUnitShort } from "@/app/utils/formatUtils";

// Helper function to get background color from color name
const getColorBg = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    black: '#1f2937',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#fbbf24',
    pink: '#f472b6',
    white: '#f3f4f6',
    orange: '#f97316',
    purple: '#a855f7',
    brown: '#92400e',
    gray: '#6b7280',
    grey: '#6b7280',
  };
  return colorMap[colorName?.toLowerCase()] || '#e5e7eb';
};

// Helper function to determine if text should be white or black
const getColorText = (colorName: string): string => {
  const darkColors = ['black', 'red', 'blue', 'green', 'purple', 'brown', 'gray', 'grey', 'orange'];
  return darkColors.includes(colorName?.toLowerCase()) ? '#ffffff' : '#1f2937';
};

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

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="absolute -top-2 left-4 w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45" />
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
                  <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    value === option.value ? "border-[#2272B4] bg-[#2272B4]" : "border-gray-300"
                  }`}>
                    {value === option.value && <Check className="w-2 h-2 text-white" />}
                  </div>
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

interface Vendor {
  id: number | string;
  name: string;
  vat_pan?: string;
  address?: string;
  phone?: string;
  comment?: string;
}

interface Roll {
  id: number | string;
  name: string;
  quantity: number;
  remaining_quantity?: number;  // Calculated: quantity - sum of batch quantities
  roll_unit_count?: number;  // Number of physical roll pieces
  remaining_unit_count?: number;  // Calculated: roll_unit_count - sum of batch unit_counts
  unit: string;
  color: string;
  vendor: Vendor | null;
  created_at?: string;  // Date when roll was created
}

// ✅ .env API variables
const CREATE_ROLLS = process.env.NEXT_PUBLIC_CREATE_ROLLS;
const GET_ROLLS = process.env.NEXT_PUBLIC_GET_ROLLS;
const UPDATE_ROLL = process.env.NEXT_PUBLIC_UPDATE_ROLL;
const DELETE_ROLL = process.env.NEXT_PUBLIC_DELETE_ROLL;
const GET_VENDORS = process.env.NEXT_PUBLIC_API_VENDOR;

const RollView = () => {
  const { showToast, showConfirm } = useToast();
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRoll, setEditingRoll] = useState<Roll | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(new Set());

  // HubSpot-style filter states
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("all");

  // Date filter states
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

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
    quantity: "",
    roll_unit_count: "" as string | number,
    unit: "Kilogram",
    color: "",
    vendorId: "",
  });

  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);

  // Vendor Modal State
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorFormData, setVendorFormData] = useState({
    name: "",
    vat_pan: "",
    address: "",
    phone: "",
    comment: "",
  });
  const [saveVendorLoading, setSaveVendorLoading] = useState(false);

  // Form dropdown states
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const unitDropdownRef = useRef<HTMLDivElement>(null);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // Toggle row selection
  const toggleRowSelection = (id: number | string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Get unique values for filters
  const uniqueUnits = Array.from(new Set(rolls.map(r => r.unit).filter(Boolean)));
  const uniqueColors = Array.from(new Set(rolls.map(r => r.color).filter(Boolean)));

  // Helper function to check if date is within filter range
  const isDateInRange = (dateStr: string | undefined): boolean => {
    if (!dateStr) return true; // If no date, include it
    const rollDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (selectedDateFilter) {
      case "all":
        return true;
      case "today":
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        return rollDate >= today && rollDate <= todayEnd;
      case "last7days":
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        return rollDate >= last7;
      case "last30days":
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        return rollDate >= last30;
      case "thisMonth":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return rollDate >= monthStart;
      case "custom":
        if (customDateFrom && customDateTo) {
          const from = new Date(customDateFrom);
          const to = new Date(customDateTo);
          to.setHours(23, 59, 59, 999);
          return rollDate >= from && rollDate <= to;
        }
        return true;
      default:
        return true;
    }
  };

  // Filter, sort, and paginate rolls using useMemo
  const { paginatedRolls, totalPages, totalFiltered } = useMemo(() => {
    // Step 1: Filter
    let filtered = rolls.filter(roll => {
      if (selectedUnit !== "all" && roll.unit !== selectedUnit) return false;
      if (selectedColor !== "all" && roll.color !== selectedColor) return false;
      if (selectedVendorFilter !== "all" && roll.vendor?.id.toString() !== selectedVendorFilter) return false;

      // Date filter
      if (selectedDateFilter !== "all" && !isDateInRange(roll.created_at)) return false;

      // Search filter
      if (tableSearchQuery.trim()) {
        const query = tableSearchQuery.toLowerCase();
        const searchFields = [
          roll.name,
          `R${String(roll.id).padStart(3, '0')}`,
          roll.color,
          roll.unit,
          roll.vendor?.name,
        ].filter(Boolean).map(f => String(f).toLowerCase());

        if (!searchFields.some(field => field.includes(query))) {
          return false;
        }
      }

      return true;
    });

    // Step 2: Sort
    filtered = [...filtered].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let aVal: any = a[sortColumn as keyof Roll];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bVal: any = b[sortColumn as keyof Roll];
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Step 3: Paginate
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { paginatedRolls: paginated, totalPages, totalFiltered };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolls, selectedUnit, selectedColor, selectedVendorFilter, selectedDateFilter, customDateFrom, customDateTo, tableSearchQuery, sortColumn, sortDirection, currentPage, itemsPerPage]);

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

  // Toggle all rows (only on current page)
  const toggleAllRows = () => {
    if (paginatedRolls.length > 0 && paginatedRolls.every(r => selectedRows.has(r.id))) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedRolls.map(r => r.id)));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedUnit("all");
    setSelectedColor("all");
    setSelectedVendorFilter("all");
    setSelectedDateFilter("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    setTableSearchQuery("");
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedUnit !== "all" || selectedColor !== "all" || selectedVendorFilter !== "all" || selectedDateFilter !== "all" || tableSearchQuery.trim() !== "";

  // Get date filter display label
  const getDateFilterLabel = (): string => {
    switch (selectedDateFilter) {
      case "all": return "All Dates";
      case "today": return "Today";
      case "last7days": return "Last 7 Days";
      case "last30days": return "Last 30 Days";
      case "thisMonth": return "This Month";
      case "custom":
        if (customDateFrom && customDateTo) {
          const from = new Date(customDateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const to = new Date(customDateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `${from} - ${to}`;
        }
        return "Custom Range";
      default: return "All Dates";
    }
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      id: "",
      name: "",
      quantity: "",
      roll_unit_count: "",
      unit: "Kilogram",
      color: "",
      vendorId: "",
    });
  };

  // Fetch rolls
  const fetchRolls = async () => {
    try {
      setLoading(true);
      if (!GET_ROLLS) {
        throw new Error("GET_ROLLS environment variable is not configured");
      }
      const res = await fetch(GET_ROLLS);
      if (!res.ok) throw new Error("Failed to fetch rolls");
      const data = await res.json();
      setRolls(data);
    } catch {
      showToast("error", "Failed to fetch rolls. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      if (!GET_VENDORS) {
        throw new Error("GET_VENDORS environment variable is not configured");
      }
      const res = await fetch(GET_VENDORS);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const data = await res.json();
      setVendors(data);
    } catch {
      showToast("error", "Failed to fetch vendors.");
    }
  };

  useEffect(() => {
    fetchRolls();
    fetchVendors();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const target = event.target as HTMLElement;
        // Check if click is outside the dropdown menu
        if (!target.closest('.relative')) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Close form dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setShowUnitDropdown(false);
      }
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
        setVendorSearchQuery("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save (Create/Update)
  const handleSave = async () => {
    try {
      setSaveLoading(true);

      // Validation
      if (!formData.name.trim()) {
        showToast("warning", "Roll name is required");
        return;
      }
      if (!formData.quantity || Number(formData.quantity) <= 0) {
        showToast("warning", "Valid quantity is required");
        return;
      }

      // Prepare payload - DON'T include 'id' field for backend
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        name: formData.name.trim(),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        color: formData.color.trim(),
        vendor_id: formData.vendorId ? Number(formData.vendorId) : null,
      };

      // Add roll_unit_count if provided
      if (formData.roll_unit_count && Number(formData.roll_unit_count) > 0) {
        payload.roll_unit_count = Number(formData.roll_unit_count);
      }

      let response;

      if (editingRoll) {
        if (!UPDATE_ROLL) {
          throw new Error("UPDATE_ROLL environment variable is not configured");
        }
        response = await fetch(`${UPDATE_ROLL}/${editingRoll.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
        });
      } else {
        if (!CREATE_ROLLS) {
          throw new Error("CREATE_ROLLS environment variable is not configured");
        }
        response = await fetch(CREATE_ROLLS, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${editingRoll ? 'update' : 'create'} roll: ${response.status} ${errorText}`);
      }

      await response.json();

      // Refresh the rolls list
      await fetchRolls();

      // Show success message
      showToast("success", `Roll ${editingRoll ? 'updated' : 'created'} successfully!`);

    } catch (err) {
      showToast("error", `Error ${editingRoll ? 'updating' : 'creating'} roll: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaveLoading(false);
      resetFormData();
      setEditingRoll(null);
      setIsDrawerOpen(false);
      setIsPreview(false);
    }
  };

  // Edit
  const handleEdit = (roll: Roll) => {
    setEditingRoll(roll);
    setFormData({
      id: roll.id.toString(),
      name: roll.name,
      quantity: String(roll.quantity),
      roll_unit_count: roll.roll_unit_count || "",
      unit: roll.unit,
      color: roll.color,
      vendorId: roll.vendor?.id.toString() || "",
    });
    setIsPreview(false);
    setIsDrawerOpen(true);
  };

  // Preview
  const handlePreview = (roll: Roll) => {
    setEditingRoll(roll);
    setFormData({
      id: roll.id.toString(),
      name: roll.name,
      quantity: String(roll.quantity),
      roll_unit_count: roll.roll_unit_count || "",
      unit: roll.unit,
      color: roll.color,
      vendorId: roll.vendor?.id.toString() || "",
    });
    setIsPreview(true);
    setIsDrawerOpen(true);
  };

  // Delete
  const handleDelete = async (id: number | string) => {
    const confirmed = await showConfirm({
      title: "Delete Roll",
      message: "Are you sure you want to delete this roll? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      if (!DELETE_ROLL) {
        throw new Error("DELETE_ROLL environment variable is not configured");
      }
      const res = await fetch(`${DELETE_ROLL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete roll");
      await fetchRolls();
      showToast("success", "Roll deleted successfully!");
    } catch {
      showToast("error", "Failed to delete roll. Please try again.");
    }
  };

  // Close drawer
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingRoll(null);
    setOpenMenuId(null);
    setIsPreview(false);
    resetFormData();
  };

  // Vendor Modal Handlers
  const resetVendorFormData = () => {
    setVendorFormData({
      name: "",
      vat_pan: "",
      address: "",
      phone: "",
      comment: "",
    });
  };

  const handleVendorFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setVendorFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveVendor = async () => {
    try {
      setSaveVendorLoading(true);

      // Validation
      if (!vendorFormData.name.trim()) {
        showToast("warning", "Vendor name is required");
        return;
      }

      const payload = {
        name: vendorFormData.name.trim(),
        vat_pan: vendorFormData.vat_pan.trim() || "",
        address: vendorFormData.address.trim() || "",
        phone: vendorFormData.phone.trim() || "",
        comment: vendorFormData.comment.trim() || "",
      };

      if (!GET_VENDORS) {
        throw new Error("GET_VENDORS environment variable is not configured");
      }
      const response = await fetch(GET_VENDORS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create vendor");
      }

      const newVendor = await response.json();

      // Refresh vendors list
      await fetchVendors();

      // Auto-select the new vendor
      setFormData((prev) => ({
        ...prev,
        vendorId: newVendor.id.toString(),
      }));

      // Close modal and show success
      setShowVendorModal(false);
      resetVendorFormData();
      showToast("success", "Vendor created successfully!");

    } catch {
      showToast("error", "Failed to create vendor. Please try again.");
    } finally {
      setSaveVendorLoading(false);
    }
  };

  const closeVendorModal = () => {
    setShowVendorModal(false);
    resetVendorFormData();
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Roll View</h2>
          <p className="text-gray-500 text-sm">Manage production rolls and track progress</p>
        </div>
        <button
          className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          onClick={() => {
            resetFormData();
            setIsDrawerOpen(true);
            setOpenMenuId(null);
            setIsPreview(false);
          }}
        >
          <Plus size={14} /> Add Roll
        </button>
      </div>

      {/* HubSpot-style Horizontal Filter Bar - Compact */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {/* 1. Search Input - Quick find (PRIMARY) */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={tableSearchQuery}
            onChange={(e) => {
              setTableSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-1 focus:ring-[#2272B4] focus:border-[#2272B4]"
          />
        </div>

        {/* 2. Date Filter - Time-based filtering */}
        <FilterDropdown
          label={getDateFilterLabel()}
          value={selectedDateFilter}
          onChange={(val) => {
            if (val === "custom") {
              setShowCustomDateModal(true);
            } else {
              setSelectedDateFilter(val);
              setCustomDateFrom("");
              setCustomDateTo("");
              setCurrentPage(1);
            }
          }}
          searchable={false}
          options={[
            { value: "all", label: "All Dates", description: "Show rolls from any date" },
            { value: "today", label: "Today", description: "Rolls created today" },
            { value: "last7days", label: "Last 7 Days", description: "Rolls from the past week" },
            { value: "last30days", label: "Last 30 Days", description: "Rolls from the past month" },
            { value: "thisMonth", label: "This Month", description: "Rolls created this month" },
            { value: "custom", label: "Custom Range...", description: "Select specific date range" },
          ]}
        />

        {/* 3. Vendor Filter - Source/supplier filter */}
        <FilterDropdown
          label="All Vendors"
          value={selectedVendorFilter}
          onChange={(val) => { setSelectedVendorFilter(val); setCurrentPage(1); }}
          options={[
            { value: "all", label: "All Vendors", description: "Show rolls from all vendors" },
            ...vendors.map(vendor => ({
              value: String(vendor.id),
              label: vendor.name,
              description: vendor.address || "No address"
            }))
          ]}
        />

        {/* 4. Color Filter - Visual attribute */}
        <FilterDropdown
          label="All Colors"
          value={selectedColor}
          onChange={(val) => { setSelectedColor(val); setCurrentPage(1); }}
          options={[
            { value: "all", label: "All Colors", description: "Show rolls with any color" },
            ...uniqueColors.map(color => ({
              value: color,
              label: color,
              description: `Filter by ${color} color`
            }))
          ]}
        />

        {/* 5. Unit Filter - Measurement type */}
        <FilterDropdown
          label="All Units"
          value={selectedUnit}
          onChange={(val) => { setSelectedUnit(val); setCurrentPage(1); }}
          options={[
            { value: "all", label: "All Units", description: "Show rolls with any unit" },
            ...uniqueUnits.map(unit => ({
              value: unit,
              label: unit,
              description: `Filter by ${unit}`
            }))
          ]}
        />

        {/* 6. Sort Dropdown - Ordering after filtering */}
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
            { value: "id-asc", label: "Oldest first", description: "First created rolls" },
            { value: "name-asc", label: "Name A-Z", description: "Alphabetical order" },
            { value: "name-desc", label: "Name Z-A", description: "Reverse alphabetical" },
            { value: "quantity-desc", label: "Quantity (High to Low)", description: "Largest quantities first" },
            { value: "quantity-asc", label: "Quantity (Low to High)", description: "Smallest quantities first" },
          ]}
        />

        {/* 7. Advanced Filters - Icon only with tooltip */}
        <button
          className="p-1.5 rounded-md border border-gray-300 text-gray-500 hover:text-[#2272B4] hover:border-[#2272B4] transition-colors"
          title="Advanced filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Clear Filters */}
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
        {loading ? (
          <Loader loading={true} message="Loading Rolls..." />
        ) : totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No rolls found</p>
            <p className="text-gray-500 mb-2 font-medium">
              {hasActiveFilters ? "Try adjusting your filters or " : "Get started by "}creating your first roll.
            </p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="mt-3 text-sm text-[#2272B4] hover:underline font-medium">
                Clear all filters
              </button>
            )}
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
                        checked={paginatedRolls.length > 0 && paginatedRolls.every(r => selectedRows.has(r.id))}
                        onChange={toggleAllRows}
                        className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }} onClick={() => handleSort("id")}>
                      <div className="flex items-center gap-1">Id {sortColumn === "id" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }} onClick={() => handleSort("created_at")}>
                      <div className="flex items-center gap-1">Created {sortColumn === "created_at" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }} onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Name {sortColumn === "name" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }} onClick={() => handleSort("quantity")}>
                      <div className="flex items-center gap-1">Total Qty {sortColumn === "quantity" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>
                      <div className="flex items-center gap-1">Remaining</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>Unit</th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>Roll Units</th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>Remaining Units</th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>Color</th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>Vendor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium whitespace-nowrap" style={{ color: '#141414', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRolls.map((roll) => (
                    <tr key={roll.id} className={`transition-colors ${selectedRows.has(roll.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-1.5 whitespace-nowrap border-r border-gray-200">
                        <input type="checkbox" checked={selectedRows.has(roll.id)} onChange={() => toggleRowSelection(roll.id)} className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]" />
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-500 font-light whitespace-nowrap border-r border-gray-200">R{String(roll.id).padStart(3, '0')}</td>
                      <td className="px-4 py-1.5 text-sm text-gray-500 font-light whitespace-nowrap border-r border-gray-200">
                        {formatNepaliDate(roll.created_at)}
                      </td>
                      <td className="px-4 py-1.5 whitespace-nowrap border-r border-gray-200"><span className="text-sm font-medium text-[#2272B4] hover:underline cursor-pointer" onClick={() => handlePreview(roll)}>{roll.name}</span></td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 font-light whitespace-nowrap border-r border-gray-200">{roll.quantity}</td>
                      <td className="px-4 py-1.5 text-sm whitespace-nowrap border-r border-gray-200">
                        {(() => {
                          const remaining = roll.remaining_quantity ?? roll.quantity;
                          const isLow = remaining < roll.quantity * 0.2; // Less than 20% remaining
                          const isEmpty = remaining <= 0;
                          return (
                            <span className={`font-light ${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
                              {remaining.toFixed(2)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 font-light whitespace-nowrap border-r border-gray-200">{formatUnitShort(roll.unit)}</td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 font-light whitespace-nowrap border-r border-gray-200">{roll.roll_unit_count || <span className="text-gray-400">-</span>}</td>
                      <td className="px-4 py-1.5 text-sm whitespace-nowrap border-r border-gray-200">
                        {(() => {
                          // Only show remaining if roll has unit count
                          if (!roll.roll_unit_count) {
                            return <span className="text-gray-400 font-light">-</span>;
                          }
                          const remainingUnits = roll.remaining_unit_count ?? roll.roll_unit_count;
                          const isLow = remainingUnits < roll.roll_unit_count * 0.2; // Less than 20% remaining
                          const isEmpty = remainingUnits <= 0;
                          return (
                            <span className={`font-light ${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
                              {remainingUnits}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-1.5 text-sm whitespace-nowrap border-r border-gray-200">
                        {roll.color ? (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: getColorBg(roll.color),
                              color: getColorText(roll.color)
                            }}
                          >
                            {roll.color}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-light">-</span>
                        )}
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 font-light whitespace-nowrap border-r border-gray-200">{roll.vendor ? roll.vendor.name : <span className="text-gray-400">-</span>}</td>
                      <td className="px-4 py-1.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handlePreview(roll)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Preview"><Eye size={16} /></button>
                          <button onClick={() => handleEdit(roll)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(roll.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={16} /></button>
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
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"><ChevronsLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="px-3 py-1 text-sm text-gray-700">Page {currentPage} of {totalPages || 1}</span>
                  <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"><ChevronRight className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"><ChevronsRight className="w-4 h-4" /></button>
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
            className="absolute inset-0 bg-black/20 transition-opacity duration-300"
            onClick={closeDrawer}
          />
          <div className={`ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeDrawer}
            >
              <X size={20} />
            </button>

            {isPreview ? (
              // Preview Layout - Compact
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  Roll Details
                </h3>

                <div className="space-y-0">
                  {/* ID */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">ID</span>
                    <span className="text-sm text-gray-500">R00{formData.id}</span>
                  </div>

                  {/* Name */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Name</span>
                    <span className="text-sm text-gray-500">{formData.name}</span>
                  </div>

                  {/* Quantity */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Quantity</span>
                    <span className="text-sm text-gray-500">{formData.quantity} {formData.unit}</span>
                  </div>

                  {/* Roll Units */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Roll Units</span>
                    <span className="text-sm text-gray-500">{formData.roll_unit_count || "-"}</span>
                  </div>

                  {/* Color */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Color</span>
                    <span className="text-sm text-gray-500">{formData.color || "-"}</span>
                  </div>

                  {/* Vendor */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Vendor</span>
                    <span className="text-sm text-gray-500">
                      {vendors.find(v => v.id.toString() === formData.vendorId)?.name || "-"}
                    </span>
                  </div>

                  {/* Remaining Quantity */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Remaining Quantity</span>
                    <span className="text-sm">
                      {(() => {
                        const remaining = editingRoll?.remaining_quantity ?? Number(formData.quantity);
                        const total = Number(formData.quantity);
                        const isLow = remaining < total * 0.2;
                        const isEmpty = remaining <= 0;
                        return (
                          <span className={`${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
                            {remaining.toFixed(2)} {formData.unit}
                          </span>
                        );
                      })()}
                    </span>
                  </div>

                  {/* Remaining Units */}
                  {formData.roll_unit_count && (
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Remaining Units</span>
                      <span className="text-sm">
                        {(() => {
                          const remainingUnits = editingRoll?.remaining_unit_count ?? Number(formData.roll_unit_count);
                          const totalUnits = Number(formData.roll_unit_count);
                          const isLow = remainingUnits < totalUnits * 0.2;
                          const isEmpty = remainingUnits <= 0;
                          return (
                            <span className={`${isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
                              {remainingUnits}
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Created Date</span>
                    <span className="text-sm text-gray-500">
                      {editingRoll?.created_at ? formatNepaliDate(editingRoll.created_at) : "-"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              // Edit/Add Layout
              <>
                {/* Modal Header */}
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingRoll ? "Edit Roll" : "Add New Roll"}
                  </h3>
                </div>

                <div className="space-y-4">
              {/* ID field - Show only for existing rolls */}
              {editingRoll && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">ID</label>
                  <input
                    type="text"
                    name="id"
                    value={`R${String(formData.id).padStart(3, '0')}`}
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Roll Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Roll Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter roll name"
                  value={formData.name}
                  onChange={handleChange}
                  readOnly={isPreview}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Quantity + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    readOnly={isPreview}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Unit
                  </label>
                  {isPreview ? (
                    <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">
                      {formData.unit}
                    </div>
                  ) : (
                    <div className="relative" ref={unitDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <span>{formData.unit || "Select Unit"}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUnitDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showUnitDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                          {[
                            { value: "Kilogram", label: "Kilogram", description: "Weight measurement (kg)" },
                            { value: "Meter", label: "Meter", description: "Length measurement (m)" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, unit: option.value }));
                                setShowUnitDropdown(false);
                              }}
                              className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                                formData.unit === option.value ? "bg-blue-50" : ""
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.unit === option.value ? "border-[#2272B4] bg-[#2272B4]" : "border-gray-300"
                              }`}>
                                {formData.unit === option.value && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${formData.unit === option.value ? "text-[#2272B4]" : "text-gray-900"}`}>
                                  {option.label}
                                </div>
                                <div className="text-xs text-gray-500">{option.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Total no of Roll Unit - NEW FIELD */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Total no of Roll Unit
                </label>
                <input
                  type="number"
                  name="roll_unit_count"
                  placeholder="e.g., 15 rolls"
                  value={formData.roll_unit_count}
                  onChange={handleChange}
                  readOnly={isPreview}
                  min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Number of physical roll pieces (e.g., 15 rolls vs 350 kg weight)</p>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  placeholder="Enter color"
                  value={formData.color}
                  onChange={handleChange}
                  readOnly={isPreview}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  Vendor
                </label>
                <div className="flex gap-2">
                  {isPreview ? (
                    <div className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">
                      {vendors.find(v => v.id.toString() === formData.vendorId)?.name || "No vendor selected"}
                    </div>
                  ) : (
                    <div className="flex-1 relative" ref={vendorDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowVendorDropdown(!showVendorDropdown)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <span className={formData.vendorId ? "text-gray-900" : "text-gray-500"}>
                          {formData.vendorId
                            ? vendors.find(v => v.id.toString() === formData.vendorId)?.name
                            : "Select Vendor"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVendorDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showVendorDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search vendors..."
                                value={vendorSearchQuery}
                                onChange={(e) => setVendorSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2272B4] focus:border-transparent"
                                autoFocus
                              />
                            </div>
                          </div>
                          {/* Options */}
                          <div className="max-h-48 overflow-y-auto">
                            {/* No Vendor Option */}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, vendorId: "" }));
                                setShowVendorDropdown(false);
                                setVendorSearchQuery("");
                              }}
                              className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                                !formData.vendorId ? "bg-blue-50" : ""
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                !formData.vendorId ? "border-[#2272B4] bg-[#2272B4]" : "border-gray-300"
                              }`}>
                                {!formData.vendorId && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${!formData.vendorId ? "text-[#2272B4]" : "text-gray-900"}`}>
                                  No Vendor
                                </div>
                                <div className="text-xs text-gray-500">Leave vendor unassigned</div>
                              </div>
                            </button>
                            {/* Vendor Options */}
                            {vendors
                              .filter(v => v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()))
                              .map((vendor) => (
                                <button
                                  key={vendor.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, vendorId: vendor.id.toString() }));
                                    setShowVendorDropdown(false);
                                    setVendorSearchQuery("");
                                  }}
                                  className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                                    formData.vendorId === vendor.id.toString() ? "bg-blue-50" : ""
                                  }`}
                                >
                                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    formData.vendorId === vendor.id.toString() ? "border-[#2272B4] bg-[#2272B4]" : "border-gray-300"
                                  }`}>
                                    {formData.vendorId === vendor.id.toString() && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium ${formData.vendorId === vendor.id.toString() ? "text-[#2272B4]" : "text-gray-900"}`}>
                                      {vendor.name}
                                    </div>
                                    <div className="text-xs text-gray-500">{vendor.address || "No address"}</div>
                                  </div>
                                </button>
                              ))}
                            {vendors.filter(v => v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase())).length === 0 && (
                              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No vendors found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!isPreview && (
                    <button
                      type="button"
                      onClick={() => setShowVendorModal(true)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      title="Add New Vendor"
                    >
                      <Plus size={16} />
                      Add New
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                onClick={closeDrawer}
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded bg-[#2272B4] text-white hover:bg-[#0E538B] disabled:opacity-50 font-medium transition-colors shadow-sm"
                onClick={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? "Saving..." : "Save Roll"}
              </button>
            </div>
          </>
        )}
        </div>
        </div>
      )}

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 transition-opacity duration-300"
            onClick={closeVendorModal}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 size={20} className="text-blue-600" />
                Add New Vendor
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={closeVendorModal}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Vendor Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter vendor name"
                  value={vendorFormData.name}
                  onChange={handleVendorFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                  autoFocus
                />
              </div>

              {/* VAT/PAN */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  VAT/PAN
                </label>
                <input
                  type="text"
                  name="vat_pan"
                  placeholder="Enter VAT/PAN number"
                  value={vendorFormData.vat_pan}
                  onChange={handleVendorFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter address"
                  value={vendorFormData.address}
                  onChange={handleVendorFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  value={vendorFormData.phone}
                  onChange={handleVendorFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Comment
                </label>
                <textarea
                  name="comment"
                  placeholder="Optional comments"
                  value={vendorFormData.comment}
                  onChange={handleVendorFormChange}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors text-sm"
                onClick={closeVendorModal}
                disabled={saveVendorLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#2272B4] text-white hover:bg-[#1b5a8a] disabled:opacity-50 font-medium transition-colors text-sm shadow-sm"
                onClick={handleSaveVendor}
                disabled={saveVendorLoading}
              >
                {saveVendorLoading ? "Saving..." : "Save Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Range Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowCustomDateModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-5">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCustomDateModal(false)}
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Custom Date Range
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  From Date
                </label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2272B4] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  To Date
                </label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2272B4] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setCustomDateFrom("");
                  setCustomDateTo("");
                  setSelectedDateFilter("all");
                  setShowCustomDateModal(false);
                  setCurrentPage(1);
                }}
              >
                Clear
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-[#2272B4] rounded-lg hover:bg-[#1b5a8a] transition-colors disabled:opacity-50"
                disabled={!customDateFrom || !customDateTo}
                onClick={() => {
                  if (customDateFrom && customDateTo) {
                    setSelectedDateFilter("custom");
                    setShowCustomDateModal(false);
                    setCurrentPage(1);
                  }
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default RollView;