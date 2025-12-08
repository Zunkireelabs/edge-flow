"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { Plus, X, Edit2, Trash2, Package, Eye, ChevronDown, ChevronUp, SlidersHorizontal, ChevronLeft, ChevronRight, ArrowUpDown, Search, Check } from "lucide-react";
import Loader from "@/app/Components/Loader";
import Select from "react-select";
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
  unit: string;
  color: string;
  vendor: Vendor | null;
};

type Batch = {
  id: number;
  roll_id: number | null;
  name: string;
  quantity: number;
  unit: string;
  color: string;
  vendor_id: number | null;
  roll: Roll | null;
  vendor: Vendor | null;
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

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Bulk delete states
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [batchesWithSubBatches, setBatchesWithSubBatches] = useState<Batch[]>([]);
  const [cleanBatches, setCleanBatches] = useState<Batch[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    unit: "Kilogram",
    color: "",
    roll_id: null as number | null,
    vendor_id: null as number | null,
  });

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const API = process.env.NEXT_PUBLIC_API_URL;

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

  // Filter, sort, and paginate batches using useMemo
  const { filteredBatches, paginatedBatches, totalPages, totalFiltered } = useMemo(() => {
    // Step 1: Filter
    let filtered = batches.filter(batch => {
      if (selectedUnit !== "all" && batch.unit !== selectedUnit) return false;
      if (selectedColor !== "all" && batch.color !== selectedColor) return false;
      if (selectedVendorFilter !== "all" && batch.vendor_id !== Number(selectedVendorFilter)) return false;
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
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Step 3: Paginate
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { filteredBatches: filtered, paginatedBatches: paginated, totalPages, totalFiltered };
  }, [batches, selectedUnit, selectedColor, selectedVendorFilter, sortColumn, sortDirection, currentPage, itemsPerPage]);

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
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedUnit !== "all" || selectedColor !== "all" || selectedVendorFilter !== "all";

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: "",
      quantity: 0,
      unit: "Kilogram",
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
    } catch (err) {
      console.error("Failed to fetch batches:", err);
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
    } catch (err) {
      console.error("Failed to fetch rolls:", err);
      showToast("error", "Failed to fetch rolls.");
    }
  }, [API]);

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/vendors`);
      setVendors(res.data);
      console.log("✅ Vendors fetched:", res.data);
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        name: formData.name.trim(),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        color: formData.color.trim(),
      };

      // Only include roll_id and vendor_id if they have values
      if (formData.roll_id !== null) {
        payload.roll_id = formData.roll_id;
      }
      if (formData.vendor_id !== null) {
        payload.vendor_id = formData.vendor_id;
      }

      console.log("🔥 Payload being sent:", payload);

      if (editingBatch) {
        console.log("🔄 Updating batch with ID:", editingBatch.id);
        await axios.put(`${API}/batches/${editingBatch.id}`, payload);
        showToast("success", "Batch updated successfully!");
      } else {
        console.log("➕ Creating new batch");
        await axios.post(`${API}/batches`, payload);
        showToast("success", "Batch created successfully!");
      }

      // Reset and close
      setIsDrawerOpen(false);
      setEditingBatch(null);
      setIsPreview(false);
      resetFormData();
      await fetchBatches();

    } catch (err) {
      console.error("Save error:", err);
      showToast("error", `Error ${editingBatch ? 'updating' : 'creating'} batch. Please try again.`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (batch: Batch) => {
    console.log("🔧 Editing batch:", batch);
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      quantity: batch.quantity,
      unit: batch.unit,
      color: batch.color,
      roll_id: batch.roll_id,
      vendor_id: batch.vendor_id,
    });
    setIsDrawerOpen(true);
    setOpenMenuId(null);
    setIsPreview(false);
  };

  const handlePreview = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      quantity: batch.quantity,
      unit: batch.unit,
      color: batch.color,
      roll_id: batch.roll_id,
      vendor_id: batch.vendor_id,
    });
    setIsDrawerOpen(true);
    setOpenMenuId(null);
    setIsPreview(true);
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
      showToast("success", "Batch deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
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
    } catch (err) {
      console.error("Error in bulk delete:", err);
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
      setSelectedRows(new Set());
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
      setBatchesWithSubBatches([]);
      setCleanBatches([]);

      showToast("success", `Successfully deleted ${selectedBatchIds.length} batch(es)`);
    } catch (err) {
      console.error("Bulk delete error:", err);
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

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingBatch(null);
    setOpenMenuId(null);
    setIsPreview(false);
    resetFormData();
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Batch View</h2>
          <p className="text-gray-500 text-sm">Manage production batches and track progress</p>
        </div>
        <button
          className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-semibold shadow-md hover:bg-[#0E538B] hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            resetFormData();
            setIsDrawerOpen(true);
            setEditingBatch(null);
            setOpenMenuId(null);
            setIsPreview(false);
          }}
        >
          <Plus size={18} /> Add Batch
        </button>
      </div>

      {/* HubSpot-style Horizontal Filter Bar */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        {/* Unit Filter */}
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

        {/* Color Filter */}
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

        {/* Vendor Filter */}
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
            { value: "id-asc", label: "Oldest first", description: "First created batches" },
            { value: "name-asc", label: "Name A-Z", description: "Alphabetical order" },
            { value: "name-desc", label: "Name Z-A", description: "Reverse alphabetical" },
            { value: "quantity-desc", label: "Quantity (High to Low)", description: "Largest quantities first" },
            { value: "quantity-asc", label: "Quantity (Low to High)", description: "Smallest quantities first" },
          ]}
        />

        {/* Advanced Filters Link */}
        <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#2272B4] transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Advanced filters
        </button>

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
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={paginatedBatches.length > 0 && paginatedBatches.every(b => selectedRows.has(b.id))}
                        onChange={toggleAllRows}
                        className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("id")}>
                      <div className="flex items-center gap-1">ID {sortColumn === "id" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Name {sortColumn === "name" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("quantity")}>
                      <div className="flex items-center gap-1">Quantity {sortColumn === "quantity" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedBatches.map((batch) => (
                    <tr key={batch.id} className={`transition-colors ${selectedRows.has(batch.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedRows.has(batch.id)} onChange={() => toggleRowSelection(batch.id)} className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]" />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">B{String(batch.id).padStart(3, '0')}</td>
                      <td className="px-4 py-3"><span className="text-sm font-medium text-[#2272B4] hover:underline cursor-pointer">{batch.name}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{batch.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{batch.unit}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{batch.color}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{batch.roll?.name || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{batch.vendor ? batch.vendor.name : <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 text-right">
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

          <div className={`ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeDrawer}
            >
              <X size={20} />
            </button>

            {isPreview ? (
              // Preview Layout
              <>
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  Batch Details
                </h3>

                <div className="space-y-4">
                  {/* ID */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-black">ID</span>
                    <span className="text-sm text-gray-500">BA00{editingBatch?.id}</span>
                  </div>

                  {/* Roll */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-black">Roll</span>
                    <span className="text-sm text-gray-500">{editingBatch?.roll?.name || "-"}</span>
                  </div>

                  {/* Name */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-black">Name</span>
                    <span className="text-sm text-gray-500">{formData.name}</span>
                  </div>

                  {/* Quantity */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-black">Quantity</span>
                    <span className="text-sm text-gray-500">{formData.quantity} {formData.unit}</span>
                  </div>

                  {/* Color */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-black">Color</span>
                    <span className="text-sm text-gray-500">{formData.color || "-"}</span>
                  </div>

                  {/* Vendor */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-black">Vendor</span>
                    <span className="text-sm text-gray-500">{editingBatch?.vendor?.name || "-"}</span>
                  </div>
                </div>

                
              </>
            ) : (
              // Edit/Add Layout
              <>
                {/* Modern Header with Step Indicator */}
                <div className="border-b border-gray-200 pb-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900" style={{ letterSpacing: '-0.01em' }}>
                      {editingBatch ? "Edit Batch" : "Add New Batch"}
                    </h3>
                    <span className="text-sm text-gray-500">Step 1 of 1</span>
                  </div>

                  {/* Progress Stepper */}
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <span className="text-sm font-medium text-gray-900">Basic Info</span>
                    </div>
                    <div className="flex-1 h-[2px] bg-gray-200"></div>
                  </div>
                </div>

                <div className="space-y-3">
              {/* Batch Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Batch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter batch name"
                  value={formData.name}
                  onChange={handleChange}
                  readOnly={isPreview}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Roll - Moved up for better auto-fill UX */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Roll
                </label>
                <Select
                  name="roll_id"
                  value={
                    formData.roll_id
                      ? {
                          value: formData.roll_id,
                          label: (() => {
                            const roll = rolls.find(r => r.id === formData.roll_id);
                            return roll
                              ? `${roll.name} (R${String(roll.id).padStart(3, '0')}) | Qty: ${roll.quantity} ${roll.unit} | Color: ${roll.color || 'N/A'} | Vendor: ${roll.vendor?.name || 'No Vendor'}`
                              : '';
                          })()
                        }
                      : null
                  }
                  onChange={(selectedOption) => {
                    const rollId = selectedOption ? selectedOption.value : null;
                    const selectedRoll = rolls.find(r => r.id === rollId);

                    setFormData({
                      ...formData,
                      roll_id: rollId,
                      color: selectedRoll?.color || "",
                      vendor_id: selectedRoll?.vendor?.id || null,
                    });
                  }}
                  options={[...rolls]
                    .sort((a, b) => b.id - a.id) // Sort by ID descending (newest first)
                    .map((roll) => ({
                      value: roll.id,
                      label: `${roll.name} (R${String(roll.id).padStart(3, '0')}) | Qty: ${roll.quantity} ${roll.unit} | Color: ${roll.color || 'N/A'} | Vendor: ${roll.vendor?.name || 'No Vendor'}`
                    }))}
                  isDisabled={isPreview}
                  isClearable
                  placeholder="Select Roll"
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#E5E7EB',
                      borderRadius: '0.5rem',
                      padding: '0.125rem',
                      minHeight: '38px',
                      '&:hover': {
                        borderColor: '#3B82F6'
                      },
                      '&:focus': {
                        borderColor: '#3B82F6',
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
                      }
                    }),
                    option: (base, state) => ({
                      ...base,
                      fontSize: '0.875rem',
                      padding: '0.75rem',
                      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
                      color: state.isSelected ? 'white' : '#111827',
                      cursor: 'pointer'
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999
                    })
                  }}
                />
              </div>

              {/* Quantity + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="string"
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
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    disabled={isPreview}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="Kilogram">Kilogram</option>
                    <option value="Meter">Meter</option>
                    <option value="Piece">Piece</option>
                  </select>
                </div>
              </div>

              {/* Color - Auto-filled from Roll */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Color {formData.roll_id && <span className="text-xs text-gray-500 font-normal">(Auto-filled from Roll)</span>}
                </label>
                <input
                  type="text"
                  name="color"
                  placeholder="Enter color"
                  value={formData.color}
                  onChange={handleChange}
                  readOnly={isPreview}
                  className={`w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${formData.roll_id ? 'bg-blue-50' : ''}`}
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Vendor {formData.roll_id && <span className="text-xs text-gray-500 font-normal">(Auto-filled from Roll)</span>}
                </label>
                <select
                  name="vendor_id"
                  value={formData.vendor_id ?? ""}
                  onChange={handleChange}
                  disabled={isPreview}
                  className={`w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white ${formData.roll_id ? 'bg-blue-50' : ''}`}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
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
                onClick={handleSaveBatch}
                disabled={saveLoading}
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
    </div>
  );
};

export default BatchView;