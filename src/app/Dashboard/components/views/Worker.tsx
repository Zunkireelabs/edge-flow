"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, X, Eye, Shell, FileText, ChevronDown, ChevronUp, SlidersHorizontal, ChevronLeft, ChevronRight, ArrowUpDown, Search, Check } from "lucide-react";
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

interface Worker {
    id: number;
    name: string;
    pan: string;
    address: string;
    wage_type: string;
    wage_rate: number;
}

const API = {
    create: process.env.NEXT_PUBLIC_CREATE_WORKER,
    getAll: process.env.NEXT_PUBLIC_GET_WORKERS,
    update: (id: number) => `${process.env.NEXT_PUBLIC_UPDATE_WORKER}/${id}`,
    delete: (id: number) => `${process.env.NEXT_PUBLIC_DELETE_WORKER}/${id}`,
};

const WorkerPage = () => {
    const { showToast, showConfirm } = useToast();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    // HubSpot-style filter states
    const [selectedWageType, setSelectedWageType] = useState<string>("all");

    // Sorting states
    const [sortColumn, setSortColumn] = useState<string>("id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Table search state
    const [tableSearchQuery, setTableSearchQuery] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        pan: "",
        address: "",
        wage_type: "HOURLY",
        wage_rate_input: "",
    });

    // Modal dropdown states
    const [showWageTypeDropdown, setShowWageTypeDropdown] = useState(false);
    const wageTypeDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch workers
    const fetchWorkers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(API.getAll!);
            setWorkers(res.data);
        } catch (error) {
            console.error(error);
            showToast("error", "Failed to fetch workers.");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    // Handle click outside for modal dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wageTypeDropdownRef.current && !wageTypeDropdownRef.current.contains(event.target as Node)) {
                setShowWageTypeDropdown(false);
            }
        };

        if (showWageTypeDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showWageTypeDropdown]);

    // Get unique values for filters
    const uniqueWageTypes = Array.from(new Set(workers.map(w => w.wage_type).filter(Boolean)));

    // Filter, sort, and paginate workers using useMemo
    const { paginatedWorkers, totalPages, totalFiltered } = useMemo(() => {
        // Step 1: Filter
        let filtered = workers.filter(worker => {
            if (selectedWageType !== "all" && worker.wage_type !== selectedWageType) return false;

            // Search filter
            if (tableSearchQuery.trim()) {
                const query = tableSearchQuery.toLowerCase();
                const searchFields = [
                    worker.name,
                    `W${String(worker.id).padStart(3, '0')}`,
                    worker.pan,
                    worker.address,
                    worker.wage_type,
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
            let aVal: any = a[sortColumn as keyof Worker];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let bVal: any = b[sortColumn as keyof Worker];
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

        return { paginatedWorkers: paginated, totalPages, totalFiltered };
    }, [workers, selectedWageType, tableSearchQuery, sortColumn, sortDirection, currentPage, itemsPerPage]);

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
        setSelectedWageType("all");
        setTableSearchQuery("");
        setCurrentPage(1);
    };

    // Check if any filters are active
    const hasActiveFilters = selectedWageType !== "all" || tableSearchQuery.trim() !== "";

    // Form change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Add / Edit / Preview
    const handleEdit = (worker: Worker) => {
        setEditingWorker(worker);
        setFormData({
            name: worker.name,
            pan: worker.pan,
            address: worker.address,
            wage_type: worker.wage_type,
            wage_rate_input: worker.wage_rate.toString(),
        });
        setIsPreview(false);
        setIsDrawerOpen(true);
    };

    const handlePreview = (worker: Worker) => {
        setEditingWorker(worker);
        setFormData({
            name: worker.name,
            pan: worker.pan,
            address: worker.address,
            wage_type: worker.wage_type,
            wage_rate_input: worker.wage_rate.toString(),
        });
        setIsPreview(true);
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirm({
            title: "Delete Worker",
            message: "Are you sure you want to delete this worker? This action cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger",
        });

        if (!confirmed) return;

        try {
            await axios.delete(API.delete(id));
            fetchWorkers();
            showToast("success", "Worker deleted successfully!");
        } catch (error) {
            console.error(error);
            showToast("error", "Failed to delete worker.");
        }
    };

    const handleSave = async () => {
        try {
            setSaveLoading(true);

            // Validation - only name is required
            if (!formData.name.trim()) { showToast("warning", "Name is required"); return; }

            const payload = {
                name: formData.name.trim(),
                // Optional fields - only include if provided
                ...(formData.pan.trim() ? { pan: formData.pan.trim() } : { pan: "" }),
                ...(formData.address.trim() ? { address: formData.address.trim() } : { address: "" }),
                wage_type: formData.wage_type || "HOURLY",
                wage_rate: formData.wage_rate_input ? Number(formData.wage_rate_input) : 0,
            };

            if (editingWorker) {
                await axios.put(API.update(editingWorker.id), payload);
                showToast("success", "Worker updated successfully!");
            } else {
                await axios.post(API.create!, payload);
                showToast("success", "Worker created successfully!");
            }

            fetchWorkers();
            closeDrawer();
        } catch (error) {
            console.error(error);
            showToast("error", "Failed to save worker.");
        } finally {
            setSaveLoading(false);
        }
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setEditingWorker(null);
        setIsPreview(false);
        setFormData({
            name: "",
            pan: "",
            address: "",
            wage_type: "HOURLY",
            wage_rate_input: "",
        });
    };

    return (
        <div className="p-8 bg-white min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Workers</h2>
                    <p className="text-gray-500 text-sm">Manage workers, wages and details</p>
                </div>
                <button
                    className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-medium hover:bg-[#1a5a8a]"
                    onClick={() => { closeDrawer(); setIsDrawerOpen(true); }}
                >
                    <Plus size={18} /> Add Worker
                </button>
            </div>

            {/* HubSpot-style Horizontal Filter Bar */}
            <div className="mb-4 flex items-center gap-3 flex-wrap">
                {/* Wage Type Filter */}
                <FilterDropdown
                    label="All Wage Types"
                    value={selectedWageType}
                    onChange={(val) => { setSelectedWageType(val); setCurrentPage(1); }}
                    options={[
                        { value: "all", label: "All Wage Types", description: "Show workers with any wage type" },
                        ...uniqueWageTypes.map(type => ({
                            value: type,
                            label: type,
                            description: `Filter by ${type} wage type`
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
                        { value: "id-asc", label: "Oldest first", description: "First created workers" },
                        { value: "name-asc", label: "Name A-Z", description: "Alphabetical order" },
                        { value: "name-desc", label: "Name Z-A", description: "Reverse alphabetical" },
                        { value: "wage_rate-desc", label: "Wage Rate (High to Low)", description: "Highest wage rates first" },
                        { value: "wage_rate-asc", label: "Wage Rate (Low to High)", description: "Lowest wage rates first" },
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
                    <Loader loading={true} message="Loading Workers..." />
                ) : totalFiltered === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <FileText size={48} className="text-gray-300 mb-4" />
                        <p className="text-black mb-2 font-medium">No workers found</p>
                        <p className="text-gray-500 mb-2 font-medium">
                            {hasActiveFilters ? "Try adjusting your filters or " : "Get started by "}creating your first worker.
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
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("id")}>
                                            <div className="flex items-center gap-1">ID {sortColumn === "id" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                                            <div className="flex items-center gap-1">Name {sortColumn === "name" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("pan")}>
                                            <div className="flex items-center gap-1">PAN {sortColumn === "pan" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("address")}>
                                            <div className="flex items-center gap-1">Address {sortColumn === "address" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wage Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("wage_rate")}>
                                            <div className="flex items-center gap-1">Wage Rate {sortColumn === "wage_rate" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginatedWorkers.map((worker) => (
                                        <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-2 text-sm text-gray-500">W{String(worker.id).padStart(3, '0')}</td>
                                            <td className="px-4 py-2">
                                                <span className="text-sm font-medium text-[#2272B4] hover:underline cursor-pointer">{worker.name}</span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">{worker.pan}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600">{worker.address}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600">{worker.wage_type}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600">{worker.wage_rate}</td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handlePreview(worker)}
                                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Preview"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(worker)}
                                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(worker.id)}
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
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/20 transition-opacity duration-300"
                        onClick={closeDrawer}
                    />

                    {/* Drawer */}
                    <div className="ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto">
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                            onClick={closeDrawer}
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="border-b border-gray-200 pb-3 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex gap-2 items-center">
                                <Shell size={20} className="text-blue-600" />
                                {isPreview ? "Worker Details" : editingWorker ? "Edit Worker" : "Add New Worker"}
                            </h3>
                        </div>

                        {/* Worker ID */}
                        {editingWorker && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                                    Worker ID
                                </label>
                                <input
                                    type="text"
                                    value={`WR${editingWorker.id}`}
                                    readOnly
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 cursor-not-allowed text-sm text-gray-600"
                                />
                            </div>
                        )}

                        {/* Flex grid for inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter worker name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* PAN */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                                    PAN <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="pan"
                                    placeholder="Enter PAN number"
                                    value={formData.pan}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Address */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                                    Address <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Enter address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Wage Type */}
                            <div className="relative" ref={wageTypeDropdownRef}>
                                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                                    Wage Type <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => !isPreview && setShowWageTypeDropdown(!showWageTypeDropdown)}
                                    disabled={isPreview}
                                    className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-left text-sm flex items-center justify-between ${
                                        isPreview ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-gray-900">{formData.wage_type}</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showWageTypeDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showWageTypeDropdown && (
                                    <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                                        {[
                                            { value: 'HOURLY', label: 'Hourly', description: 'Paid per hour worked' },
                                            { value: 'SALARY', label: 'Salary', description: 'Fixed monthly payment' },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, wage_type: option.value });
                                                    setShowWageTypeDropdown(false);
                                                }}
                                                className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                                                    formData.wage_type === option.value ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                    formData.wage_type === option.value ? 'border-[#2272B4] bg-[#2272B4]' : 'border-gray-300'
                                                }`}>
                                                    {formData.wage_type === option.value && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-medium ${formData.wage_type === option.value ? 'text-[#2272B4]' : 'text-gray-900'}`}>
                                                        {option.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{option.description}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Wage Rate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                                    Wage Rate <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="number"
                                    name="wage_rate_input"
                                    placeholder="Enter wage rate"
                                    value={formData.wage_rate_input}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                            <button
                                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                onClick={closeDrawer}
                            >
                                {isPreview ? "Close" : "Cancel"}
                            </button>
                            {!isPreview && (
                                <button
                                    className="px-6 py-2 rounded bg-[#2272B4] text-white hover:bg-[#0E538B] disabled:opacity-50 font-medium transition-colors shadow-sm"
                                    onClick={handleSave}
                                    disabled={saveLoading}
                                >
                                    {saveLoading ? "Saving..." : editingWorker ? "Update Worker" : "Save Worker"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default WorkerPage;
