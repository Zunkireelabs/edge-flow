"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { Plus, X, Edit2, Trash2, Package, Eye, ChevronDown, ChevronUp, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Search, Check } from "lucide-react";
import Loader from "@/app/Components/Loader";
import { useToast } from "@/app/Components/ToastContext";
import { formatNepaliDate } from "@/app/utils/dateUtils";

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

// Helper function to get all colors from a batch (supports multi-roll batches)
const getBatchColors = (batch: Batch): string[] => {
  // If batch has batch_rolls with colors, extract unique colors
  if (batch.batch_rolls && batch.batch_rolls.length > 0) {
    const colors = batch.batch_rolls
      .map(br => br.roll?.color)
      .filter((color): color is string => !!color);
    // Return unique colors
    return [...new Set(colors)];
  }
  // Fallback to single batch.color
  if (batch.color) {
    return [batch.color];
  }
  return [];
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

type Vendor = {
  id: number;
  name: string;
  vat_pan?: string;
  address?: string;
  phone?: string;
  comment?: string;
};

type Roll = {
  id: number;
  name: string;
  quantity: number;
  remaining_quantity?: number; // Calculated: quantity - sum of batch quantities
  roll_unit_count?: number;    // Total unit count (e.g., 15 rolls)
  remaining_unit_count?: number; // Calculated: roll_unit_count - sum of batch unit_counts
  unit: string;
  color: string;
  vendor: Vendor | null;
};

type Batch = {
  id: number;
  roll_id: number | null;
  name: string;
  order_name?: string;  // Order Name
  quantity: number;
  unit: string;
  unit_count?: number;  // Number of fabric pieces
  color: string;
  vendor_id: number | null;
  total_pieces?: number; // Expected total pieces for size breakdown
  roll: Roll | null;
  vendor: Vendor | null;
  batch_rolls?: BatchRoll[]; // NEW: Multi-roll support
  batch_sizes?: BatchSize[]; // Size breakdown entries
  created_at?: string; // Creation date for filtering
};

type BatchSize = {
  id: number;
  batch_id: number;
  size: string;
  pieces: number;
};

// NEW: Multi-roll batch types
type BatchRoll = {
  id: number;
  batch_id: number;
  roll_id: number;
  weight: number;
  units?: number;
  roll: Roll;
};

type BatchRollEntry = {
  id: string;           // Temp ID for UI tracking
  roll_id: number;
  roll_name: string;
  roll_color: string;
  roll_unit: string;
  roll_remaining: number;       // Available weight/quantity
  roll_remaining_units: number; // Available units
  weight: number;       // Weight to take
  units: number;        // Units to take
  isValid: boolean;
  errorMessage?: string;
  unitsErrorMessage?: string;   // Separate error for units
};

// Size breakdown entry type
type SizeEntry = {
  id: string;
  size: string;
  pieces: number;
};

const BatchView = () => {
  const { showToast, showConfirm } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

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

  // Bulk delete states
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [batchesWithSubBatches, setBatchesWithSubBatches] = useState<Batch[]>([]);
  const [cleanBatches, setCleanBatches] = useState<Batch[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    order_name: "",
    quantity: 0,
    unit: "Kilogram",
    unit_count: "" as string | number,
    color: "",
    roll_id: null as number | null,
    vendor_id: null as number | null,
  });

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const API = process.env.NEXT_PUBLIC_API_URL;

  // Modal dropdown states
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const unitDropdownRef = useRef<HTMLDivElement>(null);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // NEW: Multi-roll batch state variables
  const [fabricNameSearch, setFabricNameSearch] = useState("");
  const [fabricNameSuggestions, setFabricNameSuggestions] = useState<string[]>([]);
  const [showFabricSuggestions, setShowFabricSuggestions] = useState(false);
  const [matchingRolls, setMatchingRolls] = useState<Roll[]>([]);
  const [rollEntries, setRollEntries] = useState<BatchRollEntry[]>([]);
  const [isSearchingRolls, setIsSearchingRolls] = useState(false);
  const [isLoadingBatchDetails, setIsLoadingBatchDetails] = useState(false);
  const [previewBatchRolls, setPreviewBatchRolls] = useState<BatchRoll[]>([]); // For preview modal
  const fabricInputRef = useRef<HTMLInputElement>(null);
  const fabricSuggestionsRef = useRef<HTMLDivElement>(null);

  // Size breakdown state variables
  const [totalPieces, setTotalPieces] = useState<number | string>("");
  const [sizeEntries, setSizeEntries] = useState<SizeEntry[]>([]);

  // Helper function to get vendor initials
  const getVendorInitials = (name: string) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper function to get avatar color
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Toggle row selection
  const toggleRowSelection = (id: number) => {
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
  const uniqueUnits = Array.from(new Set(batches.map(b => b.unit).filter(Boolean)));
  const uniqueColors = Array.from(new Set(batches.map(b => b.color).filter(Boolean)));

  // Helper function to check if date is within filter range
  const isDateInRange = (dateStr: string | undefined): boolean => {
    if (!dateStr) return true; // If no date, include it
    const batchDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (selectedDateFilter) {
      case "all":
        return true;
      case "today":
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        return batchDate >= today && batchDate <= todayEnd;
      case "last7days":
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        return batchDate >= last7;
      case "last30days":
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        return batchDate >= last30;
      case "thisMonth":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return batchDate >= monthStart;
      case "custom":
        if (customDateFrom && customDateTo) {
          const from = new Date(customDateFrom);
          const to = new Date(customDateTo);
          to.setHours(23, 59, 59, 999);
          return batchDate >= from && batchDate <= to;
        }
        return true;
      default:
        return true;
    }
  };

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

  // Filter, sort, and paginate batches using useMemo
  const { filteredBatches, paginatedBatches, totalPages, totalFiltered } = useMemo(() => {
    // Step 1: Filter
    let filtered = batches.filter(batch => {
      if (selectedUnit !== "all" && batch.unit !== selectedUnit) return false;
      if (selectedColor !== "all" && batch.color !== selectedColor) return false;
      if (selectedVendorFilter !== "all" && batch.vendor_id !== Number(selectedVendorFilter)) return false;

      // Date filter
      if (selectedDateFilter !== "all" && !isDateInRange(batch.created_at)) return false;

      // Search filter
      if (tableSearchQuery.trim()) {
        const query = tableSearchQuery.toLowerCase();
        const searchFields = [
          batch.name,
          `B${String(batch.id).padStart(3, '0')}`,
          batch.color,
          batch.unit,
          batch.roll?.name,
          batch.vendor?.name,
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
      let aVal: any = a[sortColumn as keyof Batch];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bVal: any = b[sortColumn as keyof Batch];
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // Step 3: Paginate
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { filteredBatches: filtered, paginatedBatches: paginated, totalPages, totalFiltered };
  }, [batches, selectedUnit, selectedColor, selectedVendorFilter, selectedDateFilter, customDateFrom, customDateTo, tableSearchQuery, sortColumn, sortDirection, currentPage, itemsPerPage]);

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
    if (paginatedBatches.length > 0 && paginatedBatches.every(b => selectedRows.has(b.id))) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedBatches.map(b => b.id)));
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

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: "",
      order_name: "",
      quantity: 0,
      unit: "Kilogram",
      unit_count: "",
      color: "",
      roll_id: null,
      vendor_id: null,
    });
  };

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/batches`);
      setBatches(res.data);
    } catch {
      showToast("error", "Failed to fetch batches. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [API]);

  // Fetch rolls
  const fetchRolls = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/rolls`);
      setRolls(res.data);
    } catch {
      showToast("error", "Failed to fetch rolls.");
    }
  }, [API]);

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/vendors`);
      setVendors(res.data);
    } catch {
      showToast("error", "Failed to fetch vendors.");
    }
  }, [API]);

  useEffect(() => {
    fetchBatches();
    fetchRolls();
    fetchVendors();
  }, [fetchBatches, fetchRolls, fetchVendors]);

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

  // Handle click outside for modal dropdowns
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

    if (showUnitDropdown || showVendorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUnitDropdown, showVendorDropdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value: string | number | null = e.target.value;

    if (e.target.name === "roll_id" || e.target.name === "vendor_id") {
      value = value === "" || value === "0" ? null : Number(value);
    } else if (e.target.type === "number") {
      value = Number(value);
    }

    // Auto-fill color and vendor when roll is selected
    if (e.target.name === "roll_id" && value !== null) {
      const selectedRoll = rolls.find((roll) => roll.id === value);
      if (selectedRoll) {
        setFormData({
          ...formData,
          roll_id: value as number,
          color: selectedRoll.color,
          vendor_id: selectedRoll.vendor?.id || null,
        });
        return;
      }
    }

    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSaveBatch = async () => {
    try {
      setSaveLoading(true);

      // Validation
      if (!formData.name.trim()) {
        showToast("warning", "Batch name is required");
        return;
      }
      if (!formData.quantity || formData.quantity <= 0) {
        showToast("warning", "Valid quantity is required");
        return;
      }

      // Validate quantity against roll's available quantity
      if (formData.roll_id) {
        const selectedRoll = rolls.find(r => r.id === formData.roll_id);
        if (selectedRoll) {
          const available = selectedRoll.remaining_quantity ?? selectedRoll.quantity;
          // For editing, add back the current batch's quantity to available
          const adjustedAvailable = editingBatch && editingBatch.roll_id === formData.roll_id
            ? available + editingBatch.quantity
            : available;

          if (Number(formData.quantity) > adjustedAvailable) {
            showToast("error", `Quantity exceeds available roll quantity! Available: ${adjustedAvailable} ${selectedRoll.unit}`);
            return;
          }

          // Validate unit_count against roll's available units (only if roll has unit count)
          if (formData.unit_count && Number(formData.unit_count) > 0 && selectedRoll.roll_unit_count && selectedRoll.roll_unit_count > 0) {
            const availableUnits = selectedRoll.remaining_unit_count ?? selectedRoll.roll_unit_count;
            // For editing, add back the current batch's unit_count to available
            const adjustedAvailableUnits = editingBatch && editingBatch.roll_id === formData.roll_id
              ? availableUnits + (editingBatch.unit_count || 0)
              : availableUnits;

            if (Number(formData.unit_count) > adjustedAvailableUnits) {
              showToast("error", `Unit count exceeds available! Available: ${adjustedAvailableUnits} pcs from roll`);
              return;
            }
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        name: formData.name.trim(),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        color: formData.color.trim(),
      };

      // Add order_name if provided
      if (formData.order_name && formData.order_name.trim()) {
        payload.order_name = formData.order_name.trim();
      }

      // Add unit_count if provided
      if (formData.unit_count && Number(formData.unit_count) > 0) {
        payload.unit_count = Number(formData.unit_count);
      }

      // Only include roll_id and vendor_id if they have values
      if (formData.roll_id !== null) {
        payload.roll_id = formData.roll_id;
      }
      if (formData.vendor_id !== null) {
        payload.vendor_id = formData.vendor_id;
      }

      if (editingBatch) {
        await axios.put(`${API}/batches/${editingBatch.id}`, payload);
        showToast("success", "Batch updated successfully!");
      } else {
        await axios.post(`${API}/batches`, payload);
        showToast("success", "Batch created successfully!");
      }

      // Reset and close
      setIsDrawerOpen(false);
      setEditingBatch(null);
      setIsPreview(false);
      resetFormData();
      await fetchBatches();
      await fetchRolls(); // Refresh rolls to update remaining_quantity

    } catch (err: unknown) {
      // Check if it's an axios error with a response message
      const axiosError = err as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error ||
        `Error ${editingBatch ? 'updating' : 'creating'} batch. Please try again.`;
      showToast("error", errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = async (batch: Batch) => {
    setIsDrawerOpen(true);
    setOpenMenuId(null);
    setIsPreview(false);
    setIsLoadingBatchDetails(true);

    try {
      // Fetch full batch data with batch_rolls
      const response = await axios.get(`${API}/batches/${batch.id}/with-rolls`);
      const fullBatch = response.data;

      setEditingBatch(fullBatch);
      setFormData({
        name: fullBatch.name,
        order_name: fullBatch.order_name || "",
        quantity: fullBatch.quantity,
        unit: fullBatch.unit,
        unit_count: fullBatch.unit_count || "",
        color: fullBatch.color,
        roll_id: fullBatch.roll_id,
        vendor_id: fullBatch.vendor_id,
      });

      // Load multi-roll data for editing
      await loadBatchForEdit(fullBatch);
    } catch {
      showToast("error", "Failed to load batch details. Please try again.");
      setIsDrawerOpen(false);
    } finally {
      setIsLoadingBatchDetails(false);
    }
  };

  const handlePreview = async (batch: Batch) => {
    setIsDrawerOpen(true);
    setOpenMenuId(null);
    setIsPreview(true);
    setIsLoadingBatchDetails(true);
    setPreviewBatchRolls([]);

    try {
      // Fetch full batch data with batch_rolls
      const response = await axios.get(`${API}/batches/${batch.id}/with-rolls`);
      const fullBatch = response.data;

      setEditingBatch(fullBatch);
      setFormData({
        name: fullBatch.name,
        order_name: fullBatch.order_name || "",
        quantity: fullBatch.quantity,
        unit: fullBatch.unit,
        unit_count: fullBatch.unit_count || "",
        color: fullBatch.color,
        roll_id: fullBatch.roll_id,
        vendor_id: fullBatch.vendor_id,
      });

      // Store batch_rolls for preview display
      if (fullBatch.batch_rolls && fullBatch.batch_rolls.length > 0) {
        setPreviewBatchRolls(fullBatch.batch_rolls);
      }
    } catch {
      showToast("error", "Failed to load batch details. Please try again.");
      setIsDrawerOpen(false);
    } finally {
      setIsLoadingBatchDetails(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Batch",
      message: "Are you sure you want to delete this batch? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      await axios.delete(`${API}/batches/${id}`);
      await fetchBatches();
      await fetchRolls(); // Refresh rolls to update remaining_quantity
      showToast("success", "Batch deleted successfully!");
    } catch {
      showToast("error", "Failed to delete batch. Please try again.");
    }
  };

  // Bulk Delete Functions
  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      showToast("warning", "Please select batches to delete");
      return;
    }

    try {
      const selectedBatchIds = Array.from(selectedRows);

      // Try to check if batches have sub-batches
      try {
        const response = await axios.post(`${API}/batches/check-dependencies`, {
          batchIds: selectedBatchIds
        });

        const { batchesWithSubBatches: withSub, cleanBatches: clean } = response.data;

        // Get full batch objects
        const batchesWithSub = batches.filter(b => withSub.includes(b.id));
        const batchesClean = batches.filter(b => clean.includes(b.id));

        setBatchesWithSubBatches(batchesWithSub);
        setCleanBatches(batchesClean);

        if (batchesWithSub.length > 0) {
          // Show warning modal if some batches have sub-batches
          setShowDeleteWarning(true);
        } else {
          // Directly show type-to-confirm modal if all are clean
          setShowDeleteConfirm(true);
        }
      } catch (apiErr) {
        // If endpoint doesn't exist yet, skip dependency check and go straight to confirm
        console.warn("Dependency check endpoint not available, proceeding without check:", apiErr);

        // Treat all batches as clean (no dependencies)
        const selectedBatches = batches.filter(b => selectedBatchIds.includes(b.id));
        setCleanBatches(selectedBatches);
        setBatchesWithSubBatches([]);

        // Go directly to type-to-confirm modal
        setShowDeleteConfirm(true);
      }
    } catch {
      showToast("error", "An unexpected error occurred. Please try again.");
    }
  };

  const handleContinueDelete = () => {
    setShowDeleteWarning(false);
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") {
      showToast("warning", "Please type 'delete' to confirm");
      return;
    }

    try {
      setIsDeleting(true);
      const selectedBatchIds = Array.from(selectedRows);

      // Delete all selected batches
      await Promise.all(
        selectedBatchIds.map(id => axios.delete(`${API}/batches/${id}`))
      );

      // Success - refresh and reset
      await fetchBatches();
      await fetchRolls(); // Refresh rolls to update remaining_quantity
      setSelectedRows(new Set());
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
      setBatchesWithSubBatches([]);
      setCleanBatches([]);

      showToast("success", `Successfully deleted ${selectedBatchIds.length} batch(es)`);
    } catch {
      showToast("error", "Failed to delete some batches. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelBulkDelete = () => {
    setShowDeleteWarning(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    setBatchesWithSubBatches([]);
    setCleanBatches([]);
  };

  // =============================================================================
  // NEW: Multi-Roll Batch Functions
  // =============================================================================

  // Fetch unique fabric names for autocomplete
  const fetchFabricNames = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/batches/fabric-names`);
      setFabricNameSuggestions(response.data);
    } catch {
      // Silently fail - fabric name suggestions are optional
    }
  }, [API]);

  // Search rolls by fabric name
  const searchRollsByFabricName = async (fabricName: string) => {
    if (!fabricName.trim()) {
      setMatchingRolls([]);
      return;
    }

    try {
      setIsSearchingRolls(true);
      const response = await axios.get(`${API}/batches/search-rolls`, {
        params: { name: fabricName }
      });

      // Add remaining_quantity from the response
      const rollsWithRemaining = response.data.map((roll: Roll & { remaining_quantity: number; remaining_unit_count: number }) => ({
        ...roll,
        remaining_quantity: roll.remaining_quantity,
        remaining_unit_count: roll.remaining_unit_count,
      }));

      setMatchingRolls(rollsWithRemaining);

      if (rollsWithRemaining.length === 0) {
        showToast("warning", `No rolls found with fabric name "${fabricName}"`);
      }
    } catch {
      showToast("error", "Failed to search rolls");
    } finally {
      setIsSearchingRolls(false);
    }
  };

  // Handle fabric name input change with autocomplete
  const handleFabricNameChange = (value: string) => {
    setFabricNameSearch(value);
    setFormData({ ...formData, name: value });

    // Show suggestions if there's input
    if (value.trim()) {
      setShowFabricSuggestions(true);
    } else {
      setShowFabricSuggestions(false);
    }
  };

  // Handle fabric name selection from autocomplete
  const handleFabricNameSelect = (name: string) => {
    setFabricNameSearch(name);
    setFormData({ ...formData, name });
    setShowFabricSuggestions(false);
    // Auto-search for matching rolls
    searchRollsByFabricName(name);
  };

  // Filter suggestions based on input
  const filteredFabricSuggestions = fabricNameSuggestions.filter(name =>
    name.toLowerCase().includes(fabricNameSearch.toLowerCase())
  );

  // Add a roll to the batch
  const handleAddRollEntry = (roll: Roll) => {
    // Check if roll is already added
    if (rollEntries.some(entry => entry.roll_id === roll.id)) {
      showToast("warning", `${roll.color} roll is already added`);
      return;
    }

    const remaining = roll.remaining_quantity ?? roll.quantity;
    const remainingUnits = roll.remaining_unit_count ?? roll.roll_unit_count ?? 0;

    const newEntry: BatchRollEntry = {
      id: `temp-${Date.now()}`,
      roll_id: roll.id,
      roll_name: roll.name,
      roll_color: roll.color,
      roll_unit: roll.unit,
      roll_remaining: remaining,
      roll_remaining_units: remainingUnits,
      weight: 0,
      units: 0,
      isValid: true,
    };

    setRollEntries([...rollEntries, newEntry]);

    // Auto-fill unit from first roll
    if (rollEntries.length === 0) {
      setFormData({ ...formData, unit: roll.unit });
    }

    // Auto-fill vendor from first roll if not set
    if (rollEntries.length === 0 && roll.vendor?.id && !formData.vendor_id) {
      setFormData(prev => ({ ...prev, vendor_id: roll.vendor?.id || null }));
    }
  };

  // Update roll entry weight/units
  const handleUpdateRollEntry = (entryId: string, field: 'weight' | 'units', value: number) => {
    setRollEntries(entries =>
      entries.map(entry => {
        if (entry.id === entryId) {
          const updatedEntry = { ...entry, [field]: value };

          // Validate weight against remaining
          if (field === 'weight') {
            if (value > entry.roll_remaining) {
              updatedEntry.errorMessage = `Exceeds available (${entry.roll_remaining} ${entry.roll_unit})`;
            } else if (value <= 0) {
              updatedEntry.errorMessage = 'Weight must be > 0';
            } else {
              updatedEntry.errorMessage = undefined;
            }
          }

          // Validate units against remaining units
          if (field === 'units') {
            if (entry.roll_remaining_units > 0 && value > entry.roll_remaining_units) {
              updatedEntry.unitsErrorMessage = `Exceeds available (${entry.roll_remaining_units} units)`;
            } else if (value < 0) {
              updatedEntry.unitsErrorMessage = 'Units cannot be negative';
            } else {
              updatedEntry.unitsErrorMessage = undefined;
            }
          }

          // Check overall validity (both weight and units must be valid)
          const weightValid = !updatedEntry.errorMessage && updatedEntry.weight > 0;
          const unitsValid = !updatedEntry.unitsErrorMessage;
          updatedEntry.isValid = weightValid && unitsValid;

          return updatedEntry;
        }
        return entry;
      })
    );
  };

  // Remove a roll entry
  const handleRemoveRollEntry = (entryId: string) => {
    setRollEntries(entries => entries.filter(entry => entry.id !== entryId));
  };

  // Calculate totals from roll entries
  const rollEntryTotals = useMemo(() => {
    const totalWeight = rollEntries.reduce((sum, entry) => sum + (entry.weight || 0), 0);
    const totalUnits = rollEntries.reduce((sum, entry) => sum + (entry.units || 0), 0);
    const rollCount = rollEntries.length;
    const allValid = rollEntries.every(entry => entry.isValid && entry.weight > 0);

    return { totalWeight, totalUnits, rollCount, allValid };
  }, [rollEntries]);

  // Get available rolls (not already added)
  const availableRolls = useMemo(() => {
    const addedRollIds = rollEntries.map(e => e.roll_id);
    return matchingRolls.filter(roll =>
      !addedRollIds.includes(roll.id) &&
      (roll.remaining_quantity ?? roll.quantity) > 0
    );
  }, [matchingRolls, rollEntries]);

  // Size breakdown helper functions
  const handleAddSizeEntry = () => {
    const newEntry: SizeEntry = {
      id: `size-${Date.now()}`,
      size: "",
      pieces: 0,
    };
    setSizeEntries([...sizeEntries, newEntry]);
  };

  const handleUpdateSizeEntry = (entryId: string, field: 'size' | 'pieces', value: string | number) => {
    setSizeEntries(entries =>
      entries.map(entry => {
        if (entry.id === entryId) {
          return { ...entry, [field]: value };
        }
        return entry;
      })
    );
  };

  const handleRemoveSizeEntry = (entryId: string) => {
    setSizeEntries(entries => entries.filter(entry => entry.id !== entryId));
  };

  // Calculate size breakdown totals and validation
  const sizeBreakdownTotals = useMemo(() => {
    const totalSizePieces = sizeEntries.reduce((sum, entry) => sum + (Number(entry.pieces) || 0), 0);
    const expectedPieces = Number(totalPieces) || 0;
    const isMatching = totalSizePieces === expectedPieces;
    const hasEntries = sizeEntries.length > 0;
    const allEntriesValid = sizeEntries.every(entry => entry.size.trim() !== "" && Number(entry.pieces) > 0);

    return { totalSizePieces, expectedPieces, isMatching, hasEntries, allEntriesValid };
  }, [sizeEntries, totalPieces]);

  // Handle save for multi-roll batch
  const handleSaveMultiRollBatch = async () => {
    try {
      setSaveLoading(true);

      // Validations
      if (!formData.name.trim()) {
        showToast("warning", "Fabric name is required");
        return;
      }

      if (rollEntries.length === 0) {
        showToast("warning", "Please add at least one roll");
        return;
      }

      if (!rollEntryTotals.allValid) {
        showToast("error", "Please fix validation errors in roll entries");
        return;
      }

      const payload = {
        name: formData.name.trim(),
        order_name: formData.order_name?.trim() || undefined,
        unit: formData.unit,
        color: rollEntries[0]?.roll_color || '',
        vendor_id: formData.vendor_id || undefined,
        rolls: rollEntries.map(entry => ({
          roll_id: entry.roll_id,
          weight: entry.weight,
          units: entry.units || undefined,
        })),
        // Size breakdown data
        total_pieces: Number(totalPieces) || undefined,
        size_breakdown: sizeEntries.length > 0
          ? sizeEntries.map(entry => ({
              size: entry.size,
              pieces: Number(entry.pieces),
            }))
          : undefined,
      };

      if (editingBatch) {
        await axios.put(`${API}/batches/${editingBatch.id}/with-rolls`, payload);
        showToast("success", "Batch updated successfully!");
      } else {
        await axios.post(`${API}/batches/with-rolls`, payload);
        showToast("success", "Batch created successfully!");
      }

      // Reset and close
      closeDrawer();
      await fetchBatches();
      await fetchRolls();

    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError?.response?.data?.message ||
        `Error ${editingBatch ? 'updating' : 'creating'} batch. Please try again.`;
      showToast("error", errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  // Reset multi-roll state when opening drawer
  const resetMultiRollState = () => {
    setFabricNameSearch("");
    setShowFabricSuggestions(false);
    setMatchingRolls([]);
    setRollEntries([]);
    // Reset size breakdown
    setTotalPieces("");
    setSizeEntries([]);
  };

  // Load existing batch rolls when editing
  const loadBatchForEdit = async (batch: Batch) => {
    resetMultiRollState();

    // Check if batch has multi-roll data
    if (batch.batch_rolls && batch.batch_rolls.length > 0) {
      // Multi-roll batch - load roll entries
      setFabricNameSearch(batch.name);

      // Search for matching rolls first
      await searchRollsByFabricName(batch.name);

      // Convert batch_rolls to roll entries
      const entries: BatchRollEntry[] = batch.batch_rolls.map(br => ({
        id: `existing-${br.id}`,
        roll_id: br.roll_id,
        roll_name: br.roll.name,
        roll_color: br.roll.color,
        roll_unit: br.roll.unit,
        roll_remaining: (br.roll.remaining_quantity ?? br.roll.quantity) + br.weight, // Add back current allocation
        roll_remaining_units: (br.roll.remaining_unit_count ?? br.roll.roll_unit_count ?? 0) + (br.units || 0), // Add back current units
        weight: br.weight,
        units: br.units || 0,
        isValid: true,
      }));

      setRollEntries(entries);
    } else if (batch.roll_id && batch.roll) {
      // Legacy single-roll batch - convert to new format
      setFabricNameSearch(batch.name);
      await searchRollsByFabricName(batch.name);

      // Create single entry from legacy roll
      const roll = batch.roll;
      const entry: BatchRollEntry = {
        id: `legacy-${roll.id}`,
        roll_id: roll.id,
        roll_name: roll.name,
        roll_color: roll.color,
        roll_unit: roll.unit,
        roll_remaining: (roll.remaining_quantity ?? roll.quantity) + batch.quantity,
        roll_remaining_units: (roll.remaining_unit_count ?? roll.roll_unit_count ?? 0) + (batch.unit_count || 0),
        weight: batch.quantity,
        units: batch.unit_count || 0,
        isValid: true,
      };

      setRollEntries([entry]);
    }

    // Load size breakdown data if exists
    if (batch.total_pieces) {
      setTotalPieces(batch.total_pieces);
    }
    if (batch.batch_sizes && batch.batch_sizes.length > 0) {
      const sizes: SizeEntry[] = batch.batch_sizes.map((bs: { id: number; size: string; pieces: number }) => ({
        id: `existing-${bs.id}`,
        size: bs.size,
        pieces: bs.pieces,
      }));
      setSizeEntries(sizes);
    }
  };

  // Fetch fabric names on mount
  useEffect(() => {
    fetchFabricNames();
  }, [fetchFabricNames]);

  // Handle click outside for fabric suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fabricSuggestionsRef.current &&
        !fabricSuggestionsRef.current.contains(event.target as Node) &&
        fabricInputRef.current &&
        !fabricInputRef.current.contains(event.target as Node)
      ) {
        setShowFabricSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingBatch(null);
    setOpenMenuId(null);
    setIsPreview(false);
    setPreviewBatchRolls([]);
    setIsLoadingBatchDetails(false);
    resetFormData();
    resetMultiRollState();
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fabric View (Batch)</h2>
          <p className="text-gray-500 text-sm">Manage production fabrics and track progress</p>
        </div>
        <button
          className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          onClick={() => {
            resetFormData();
            resetMultiRollState();
            setIsDrawerOpen(true);
            setEditingBatch(null);
            setOpenMenuId(null);
            setIsPreview(false);
          }}
        >
          <Plus size={14} /> Add Batch
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

        {/* 2. Vendor Filter */}
        <FilterDropdown
          label="All Vendors"
          value={selectedVendorFilter}
          onChange={(val) => { setSelectedVendorFilter(val); setCurrentPage(1); }}
          options={[
            { value: "all", label: "All Vendors", description: "Show batches from all vendors" },
            ...vendors.map(vendor => ({
              value: String(vendor.id),
              label: vendor.name,
              description: vendor.address || "No address"
            }))
          ]}
        />

        {/* 3. Color Filter */}
        <FilterDropdown
          label="All Colors"
          value={selectedColor}
          onChange={(val) => { setSelectedColor(val); setCurrentPage(1); }}
          options={[
            { value: "all", label: "All Colors", description: "Show batches with any color" },
            ...uniqueColors.map(color => ({
              value: color,
              label: color,
              description: `Filter by ${color} color`
            }))
          ]}
        />

        {/* 4. Unit Filter */}
        <FilterDropdown
          label="All Units"
          value={selectedUnit}
          onChange={(val) => { setSelectedUnit(val); setCurrentPage(1); }}
          options={[
            { value: "all", label: "All Units", description: "Show batches with any unit" },
            ...uniqueUnits.map(unit => ({
              value: unit,
              label: unit,
              description: `Filter by ${unit}`
            }))
          ]}
        />

        {/* 5. Date Filter - Time-based filtering */}
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
            { value: "all", label: "All Dates", description: "Show batches from any date" },
            { value: "today", label: "Today", description: "Batches created today" },
            { value: "last7days", label: "Last 7 Days", description: "Batches from the past week" },
            { value: "last30days", label: "Last 30 Days", description: "Batches from the past month" },
            { value: "thisMonth", label: "This Month", description: "Batches created this month" },
            { value: "custom", label: "Custom Range...", description: "Select specific date range" },
          ]}
        />

        {/* 6. Sort Dropdown */}
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
            { value: "id-asc", label: "Oldest first", description: "First created batches" },
            { value: "name-asc", label: "Name A-Z", description: "Alphabetical order" },
            { value: "name-desc", label: "Name Z-A", description: "Reverse alphabetical" },
            { value: "quantity-desc", label: "Quantity (High to Low)", description: "Largest quantities first" },
            { value: "quantity-asc", label: "Quantity (Low to High)", description: "Smallest quantities first" },
            { value: "unit_count-desc", label: "No of Unit (High to Low)", description: "Most pieces first" },
            { value: "unit_count-asc", label: "No of Unit (Low to High)", description: "Fewest pieces first" },
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
          <Loader loading={true} message="Loading Batches..." />
        ) : totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No batches found</p>
            <p className="text-gray-500 mb-2 font-medium">
              {hasActiveFilters ? "Try adjusting your filters or " : "Get started by "}creating your first batch.
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
                        checked={paginatedBatches.length > 0 && paginatedBatches.every(b => selectedRows.has(b.id))}
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
                    <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }} onClick={() => handleSort("order_name")}>
                      <div className="flex items-center gap-1">Order Name {sortColumn === "order_name" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }} onClick={() => handleSort("quantity")}>
                      <div className="flex items-center gap-1">Quantity {sortColumn === "quantity" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>Unit</th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>Color</th>
                    <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }} onClick={() => handleSort("unit_count")}>
                      <div className="flex items-center gap-1">No of Unit {sortColumn === "unit_count" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>Roll</th>
                    <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer hover:bg-gray-100 whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }} onClick={() => handleSort("total_pieces")}>
                      <div className="flex items-center gap-1">Pieces {sortColumn === "total_pieces" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap border-r border-gray-200" style={{ color: '#141414', fontWeight: 500 }}>Sizes</th>
                    <th className="px-4 py-2 text-right text-xs font-medium whitespace-nowrap" style={{ color: '#141414', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedBatches.map((batch) => (
                    <tr key={batch.id} className={`transition-colors ${selectedRows.has(batch.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-1.5 whitespace-nowrap border-r border-gray-200">
                        <input type="checkbox" checked={selectedRows.has(batch.id)} onChange={() => toggleRowSelection(batch.id)} className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]" />
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-500 font-light whitespace-nowrap border-r border-gray-200">B{String(batch.id).padStart(3, '0')}</td>
                      <td className="px-4 py-1.5 text-sm text-gray-500 font-light whitespace-nowrap border-r border-gray-200">
                        {formatNepaliDate(batch.created_at)}
                      </td>
                      <td className="px-4 py-1.5 whitespace-nowrap border-r border-gray-200"><span className="text-sm font-medium text-[#2272B4] hover:underline cursor-pointer" onClick={() => handlePreview(batch)}>{batch.name}</span></td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 font-light whitespace-nowrap border-r border-gray-200">{batch.order_name || <span className="text-gray-400">-</span>}</td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 font-light whitespace-nowrap border-r border-gray-200">{batch.quantity}</td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 font-light whitespace-nowrap border-r border-gray-200">{batch.unit}</td>
                      <td className="px-4 py-1.5 text-sm whitespace-nowrap border-r border-gray-200">
                        {(() => {
                          const colors = getBatchColors(batch);
                          if (colors.length === 0) {
                            return <span className="text-gray-400 font-light">-</span>;
                          }
                          if (colors.length === 1) {
                            // Single color - show regular badge
                            return (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: getColorBg(colors[0]),
                                  color: getColorText(colors[0])
                                }}
                              >
                                {colors[0]}
                              </span>
                            );
                          }
                          // Multiple colors - show dots + count with tooltip
                          return (
                            <div
                              className="flex items-center gap-1 cursor-pointer group relative"
                              title={colors.join(', ')}
                            >
                              {colors.slice(0, 4).map((color, idx) => (
                                <span
                                  key={idx}
                                  className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                                  style={{ backgroundColor: getColorBg(color) }}
                                  title={color}
                                />
                              ))}
                              {colors.length > 4 && (
                                <span className="text-xs text-gray-500 ml-0.5">+{colors.length - 4}</span>
                              )}
                              <span className="text-xs text-gray-500 ml-1">({colors.length})</span>
                              {/* Tooltip on hover - appears to the right */}
                              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                                  <div className="font-medium mb-1">{colors.length} Colors:</div>
                                  {colors.map((color, idx) => (
                                    <div key={idx} className="flex items-center gap-2 py-0.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: getColorBg(color) }}
                                      />
                                      {color}
                                    </div>
                                  ))}
                                </div>
                                {/* Arrow pointing left */}
                                <div className="absolute top-1/2 -translate-y-1/2 right-full w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 font-light whitespace-nowrap border-r border-gray-200">{batch.unit_count || <span className="text-gray-400">-</span>}</td>
                      <td className="px-4 py-1.5 text-sm whitespace-nowrap border-r border-gray-200">
                        {(() => {
                          const batchRolls = batch.batch_rolls || [];
                          // Check for multi-roll batches first
                          if (batchRolls.length > 0) {
                            if (batchRolls.length === 1) {
                              // Single roll from batch_rolls
                              return <span className="text-gray-600 font-light">{batchRolls[0].roll?.name || '-'}</span>;
                            }
                            // Multiple rolls - show count with tooltip
                            return (
                              <div className="flex items-center gap-1 cursor-pointer group relative">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  {batchRolls.length} rolls
                                </span>
                                {/* Tooltip on hover - appears to the right */}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block z-50">
                                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                                    <div className="font-medium mb-1">Rolls Used:</div>
                                    {batchRolls.map((br, idx) => (
                                      <div key={idx} className="flex items-center gap-3 py-0.5">
                                        <span
                                          className="w-2.5 h-2.5 rounded-full"
                                          style={{ backgroundColor: getColorBg(br.roll?.color || '') }}
                                        />
                                        <span className="text-gray-300 min-w-[60px]">{br.roll?.name || 'Unknown'}</span>
                                        <span className="font-medium">{br.weight} {br.roll?.unit || 'kg'}</span>
                                        {br.units && <span className="text-gray-400">│ {br.units} pcs</span>}
                                      </div>
                                    ))}
                                    <div className="border-t border-gray-700 mt-1 pt-1 flex items-center gap-3">
                                      <span className="w-2.5 h-2.5"></span>
                                      <span className="text-gray-300 min-w-[60px]">Total</span>
                                      <span className="font-medium">{batchRolls.reduce((sum, br) => sum + (br.weight || 0), 0)} {batchRolls[0]?.roll?.unit || 'kg'}</span>
                                      {batchRolls.some(br => br.units) && (
                                        <span className="text-gray-400">│ {batchRolls.reduce((sum, br) => sum + (br.units || 0), 0)} pcs</span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Arrow pointing left */}
                                  <div className="absolute top-1/2 -translate-y-1/2 right-full w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                                </div>
                              </div>
                            );
                          }
                          // Fallback to legacy single roll field
                          return batch.roll?.name ? (
                            <span className="text-gray-600 font-light">{batch.roll.name}</span>
                          ) : (
                            <span className="text-gray-400 font-light">-</span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-1.5 text-sm text-gray-600 font-light whitespace-nowrap border-r border-gray-200">{batch.total_pieces || <span className="text-gray-400">-</span>}</td>
                      <td className="px-4 py-1.5 text-sm whitespace-nowrap border-r border-gray-200">
                        {(() => {
                          const sizes = batch.batch_sizes || [];
                          if (sizes.length === 0) {
                            return <span className="text-gray-400 font-light">-</span>;
                          }
                          // Show count with tooltip
                          return (
                            <div className="flex items-center gap-1 cursor-pointer group relative">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                {sizes.length} {sizes.length === 1 ? 'size' : 'sizes'}
                              </span>
                              {/* Tooltip on hover - appears to the right */}
                              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                                  <div className="font-medium mb-1">Size Breakdown:</div>
                                  {sizes.map((s, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                                      <span className="text-gray-300">{s.size}</span>
                                      <span className="font-medium">{s.pieces} pcs</span>
                                    </div>
                                  ))}
                                  <div className="border-t border-gray-700 mt-1 pt-1 flex items-center justify-between gap-4">
                                    <span className="text-gray-300">Total</span>
                                    <span className="font-medium">{sizes.reduce((sum, s) => sum + s.pieces, 0)} pcs</span>
                                  </div>
                                </div>
                                {/* Arrow pointing left */}
                                <div className="absolute top-1/2 -translate-y-1/2 right-full w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-1.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handlePreview(batch)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Preview"><Eye size={16} /></button>
                          <button onClick={() => handleEdit(batch)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(batch.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={16} /></button>
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

            {isLoadingBatchDetails ? (
              // Loading State
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#2272B4] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-gray-500">Loading batch details...</p>
              </div>
            ) : isPreview ? (
              // Preview Layout - Compact
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  Batch Details
                </h3>

                <div className="space-y-0">
                  {/* ID */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">ID</span>
                    <span className="text-sm text-gray-500">BA00{editingBatch?.id}</span>
                  </div>

                  {/* Name */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Name</span>
                    <span className="text-sm text-gray-500">{formData.name}</span>
                  </div>

                  {/* Order Name (if exists) */}
                  {formData.order_name && (
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Order Name</span>
                      <span className="text-sm text-gray-500">{formData.order_name}</span>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Total Quantity</span>
                    <span className="text-sm text-gray-500">{formData.quantity} {formData.unit}</span>
                  </div>

                  {/* No of Units */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">No of Units</span>
                    <span className="text-sm text-gray-500">{formData.unit_count || "-"}</span>
                  </div>

                  {/* Vendor */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Vendor</span>
                    <span className="text-sm text-gray-500">{editingBatch?.vendor?.name || "-"}</span>
                  </div>

                  {/* Total Pieces */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Total Pieces</span>
                    <span className="text-sm text-gray-500">{editingBatch?.total_pieces || "-"}</span>
                  </div>

                  {/* Created Date */}
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Created Date</span>
                    <span className="text-sm text-gray-500">
                      {editingBatch?.created_at
                        ? new Date(editingBatch.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : "-"}
                    </span>
                  </div>

                  {/* Size Breakdown Section */}
                  {editingBatch?.batch_sizes && editingBatch.batch_sizes.length > 0 && (
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Size Breakdown</span>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-medium text-gray-600">Size</th>
                              <th className="px-2 py-1.5 text-right font-medium text-gray-600">Pieces</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {editingBatch.batch_sizes.map((size, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1.5 text-gray-700">{size.size}</td>
                                <td className="px-2 py-1.5 text-right text-gray-600">{size.pieces}</td>
                              </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="bg-gray-50 font-medium text-xs">
                              <td className="px-2 py-1.5 text-gray-600">Total</td>
                              <td className="px-2 py-1.5 text-right text-[#2272B4]">
                                {editingBatch.batch_sizes.reduce((sum, s) => sum + s.pieces, 0)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Rolls Section - Multi-roll or Legacy */}
                  {previewBatchRolls.length > 0 ? (
                    // Multi-roll batch - show compact table
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Rolls Used ({previewBatchRolls.length})</span>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-medium text-gray-600">Color</th>
                              <th className="px-2 py-1.5 text-left font-medium text-gray-600">Weight</th>
                              <th className="px-2 py-1.5 text-left font-medium text-gray-600">Units</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {previewBatchRolls.map((br, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1.5">
                                  <span className="inline-flex items-center gap-1">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                      style={{ backgroundColor: br.roll?.color?.toLowerCase() || '#ccc' }}
                                    />
                                    {br.roll?.color || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-2 py-1.5">{br.weight} {formData.unit}</td>
                                <td className="px-2 py-1.5 text-gray-500">{br.units || '-'}</td>
                              </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="bg-gray-50 font-medium text-xs">
                              <td className="px-2 py-1.5 text-gray-600">Total</td>
                              <td className="px-2 py-1.5 text-[#2272B4]">
                                {previewBatchRolls.reduce((sum, br) => sum + br.weight, 0)} {formData.unit}
                              </td>
                              <td className="px-2 py-1.5 text-[#2272B4]">
                                {previewBatchRolls.reduce((sum, br) => sum + (br.units || 0), 0) || '-'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : editingBatch?.roll ? (
                    // Legacy single-roll batch
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Roll</span>
                      <span className="text-sm text-gray-500">
                        {editingBatch.roll.name} ({editingBatch.roll.color})
                      </span>
                    </div>
                  ) : (
                    // No roll assigned
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Roll</span>
                      <span className="text-sm text-gray-400 italic">No roll assigned</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Edit/Add Layout - NEW MULTI-ROLL UI
              <>
                {/* Modal Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingBatch ? "Edit Batch" : "Add New Batch"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Create a batch using fabric from one or more rolls</p>
                </div>

                <div className="space-y-4">
                  {/* Fabric Name with Autocomplete */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Fabric Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          ref={fabricInputRef}
                          type="text"
                          placeholder="Type to search fabric names..."
                          value={fabricNameSearch}
                          onChange={(e) => handleFabricNameChange(e.target.value)}
                          onFocus={() => fabricNameSearch && setShowFabricSuggestions(true)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        {/* Autocomplete Suggestions */}
                        {showFabricSuggestions && filteredFabricSuggestions.length > 0 && (
                          <div
                            ref={fabricSuggestionsRef}
                            className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                          >
                            {filteredFabricSuggestions.map((name, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleFabricNameSelect(name)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
                              >
                                <Package className="w-4 h-4 text-gray-400" />
                                {name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => searchRollsByFabricName(fabricNameSearch)}
                        disabled={!fabricNameSearch.trim() || isSearchingRolls}
                        className="px-4 py-2 bg-[#2272B4] text-white rounded-lg text-sm font-medium hover:bg-[#1a5a8a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSearchingRolls ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            Search Rolls
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Search by fabric name to find matching rolls</p>
                  </div>

                  {/* Order Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Order Name <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="order_name"
                      placeholder="Enter order name"
                      value={formData.order_name}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Unit (moved here - after Order Name) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Unit
                      {rollEntries.length > 0 && (
                        <span className="text-gray-400 text-xs font-normal ml-2">(Auto-filled from first roll)</span>
                      )}
                    </label>
                    <div className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm ${
                      rollEntries.length > 0 ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''
                    }`}>
                      {formData.unit || 'Kilogram'}
                    </div>
                  </div>

                  {/* Available Rolls Section */}
                  {matchingRolls.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        Available Rolls
                        <span className="text-gray-400 text-xs font-normal ml-2">
                          ({availableRolls.length} roll{availableRolls.length !== 1 ? 's' : ''} available)
                        </span>
                      </label>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Color</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Available</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Roll Units</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-600">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableRolls.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                                  All matching rolls have been added
                                </td>
                              </tr>
                            ) : (
                              availableRolls.map((roll) => (
                                <tr key={roll.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-3 py-2">
                                    <span className="inline-flex items-center gap-1.5">
                                      <span
                                        className="w-3 h-3 rounded-full border border-gray-200"
                                        style={{ backgroundColor: roll.color?.toLowerCase() || '#ccc' }}
                                      />
                                      {roll.color || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 font-medium">
                                    {roll.remaining_quantity ?? roll.quantity} {roll.unit}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500">
                                    {roll.remaining_unit_count ?? roll.roll_unit_count ?? '-'}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleAddRollEntry(roll)}
                                      className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-medium hover:bg-green-100 transition-colors"
                                    >
                                      + Add
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Added Rolls Section */}
                  {rollEntries.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        Selected Rolls
                        <span className="text-blue-600 text-xs font-normal ml-2">
                          ({rollEntries.length} roll{rollEntries.length !== 1 ? 's' : ''} selected)
                        </span>
                      </label>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-50 border-b border-blue-100">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Color</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Weight <span className="text-red-500">*</span></th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Units</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700">Remove</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rollEntries.map((entry) => (
                              <tr key={entry.id} className={`border-b border-gray-100 ${!entry.isValid ? 'bg-red-50' : ''}`}>
                                <td className="px-3 py-2">
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className="w-3 h-3 rounded-full border border-gray-200"
                                      style={{ backgroundColor: entry.roll_color?.toLowerCase() || '#ccc' }}
                                    />
                                    {entry.roll_color || 'N/A'}
                                  </span>
                                  <div className="text-xs text-gray-400">
                                    Avail: {entry.roll_remaining} {entry.roll_unit}
                                    {entry.roll_remaining_units > 0 && ` | ${entry.roll_remaining_units} units`}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={entry.weight || ''}
                                    onChange={(e) => handleUpdateRollEntry(entry.id, 'weight', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    max={entry.roll_remaining}
                                    step="0.01"
                                    className={`w-24 border rounded px-2 py-1 text-sm ${
                                      entry.errorMessage ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="0"
                                  />
                                  {entry.errorMessage && (
                                    <div className="text-xs text-red-500 mt-0.5">{entry.errorMessage}</div>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={entry.units || ''}
                                    onChange={(e) => handleUpdateRollEntry(entry.id, 'units', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max={entry.roll_remaining_units > 0 ? entry.roll_remaining_units : undefined}
                                    className={`w-20 border rounded px-2 py-1 text-sm ${
                                      entry.unitsErrorMessage ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="0"
                                  />
                                  {entry.unitsErrorMessage && (
                                    <div className="text-xs text-red-500 mt-0.5">{entry.unitsErrorMessage}</div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRollEntry(entry.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          {/* Totals Row */}
                          <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                              <td className="px-3 py-2 font-medium text-gray-700">
                                Total ({rollEntryTotals.rollCount} roll{rollEntryTotals.rollCount !== 1 ? 's' : ''})
                              </td>
                              <td className="px-3 py-2 font-semibold text-blue-600">
                                {rollEntryTotals.totalWeight.toFixed(2)} {formData.unit}
                              </td>
                              <td className="px-3 py-2 font-semibold text-blue-600">
                                {rollEntryTotals.totalUnits} pcs
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Total Pieces and Size Breakdown - Only shown after rolls are selected */}
                  {rollEntries.length > 0 && (
                    <>
                      {/* Total Pieces */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1.5">
                          Total Pieces <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Enter total expected pieces"
                          value={totalPieces}
                          onChange={(e) => setTotalPieces(e.target.value)}
                          min="0"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Size Breakdown */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-gray-900">
                            Size Breakdown
                          </label>
                          <button
                            type="button"
                            onClick={handleAddSizeEntry}
                            className="text-sm text-[#2272B4] hover:text-[#1a5a8a] font-medium flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Size
                          </button>
                        </div>

                        {sizeEntries.length > 0 ? (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="divide-y divide-gray-100">
                              {sizeEntries.map((entry) => (
                                <div key={entry.id} className="flex items-center gap-3 p-3 bg-white">
                                  <input
                                    type="text"
                                    placeholder="Enter size..."
                                    value={entry.size}
                                    onChange={(e) => handleUpdateSizeEntry(entry.id, 'size', e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Pieces"
                                    value={entry.pieces || ''}
                                    onChange={(e) => handleUpdateSizeEntry(entry.id, 'pieces', parseInt(e.target.value) || 0)}
                                    min="0"
                                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSizeEntry(entry.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            {/* Validation Footer */}
                            <div className={`px-3 py-2 border-t text-sm font-medium flex items-center justify-between ${
                              sizeBreakdownTotals.isMatching
                                ? 'bg-green-50 border-green-100 text-green-700'
                                : 'bg-amber-50 border-amber-100 text-amber-700'
                            }`}>
                              <span>
                                Total: {sizeBreakdownTotals.totalSizePieces} / {sizeBreakdownTotals.expectedPieces || 0} pieces
                              </span>
                              {sizeBreakdownTotals.expectedPieces > 0 && (
                                <span>
                                  {sizeBreakdownTotals.isMatching ? '✓ Matched' : '⚠ Mismatch'}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm">
                            No sizes added yet. Click &quot;+ Add Size&quot; to add size breakdown.
                          </div>
                        )}
                      </div>
                    </>
                  )}
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
                onClick={handleSaveMultiRollBatch}
                disabled={saveLoading || (rollEntries.length > 0 && !rollEntryTotals.allValid)}
              >
                {saveLoading ? "Saving..." : editingBatch ? "Update Batch" : "Save Batch"}
              </button>
            </div>
          </>
        )}
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedRows.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-600 text-white rounded-full shadow-2xl px-6 py-4 flex items-center gap-6 animate-slide-up">
            <span className="font-semibold text-sm">
              {selectedRows.size} {selectedRows.size === 1 ? 'item' : 'items'} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-4 py-2 bg-white text-blue-600 rounded-full font-medium hover:bg-gray-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors text-sm flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showDeleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelBulkDelete}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Warning: Some batches have sub-batches
                </h3>
                <p className="text-gray-600 mb-4">
                  Deleting these batches will also delete all associated sub-batches and production data. This action cannot be undone.
                </p>

                {/* Batches with Sub-batches */}
                {batchesWithSubBatches.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Batches with Sub-batches ({batchesWithSubBatches.length})
                    </h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {batchesWithSubBatches.map(batch => (
                        <div key={batch.id} className="text-sm text-gray-700 py-1">
                          BA00{batch.id} - {batch.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clean Batches */}
                {cleanBatches.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Batches without Sub-batches ({cleanBatches.length})
                    </h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {cleanBatches.map(batch => (
                        <div key={batch.id} className="text-sm text-gray-700 py-1">
                          BA00{batch.id} - {batch.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelBulkDelete}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueDelete}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Type-to-Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelBulkDelete}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-gray-600 mb-4">
                  You are about to permanently delete {selectedRows.size} batch{selectedRows.size === 1 ? '' : 'es'}. This action cannot be undone.
                </p>

                {/* List batches to be deleted */}
                <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {Array.from(selectedRows).map(id => {
                    const batch = batches.find(b => b.id === id);
                    return batch ? (
                      <div key={batch.id} className="text-sm text-gray-700 py-1">
                        BA00{batch.id} - {batch.name}
                      </div>
                    ) : null;
                  })}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Type <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600">delete</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type 'delete' here"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelBulkDelete}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={deleteConfirmText.toLowerCase() !== "delete" || isDeleting}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
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

export default BatchView;