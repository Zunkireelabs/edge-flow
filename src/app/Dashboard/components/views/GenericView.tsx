"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Building2,
  Eye,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
  Check,
} from "lucide-react";
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

type Vendor = {
  id: number;
  name: string;
  vat_pan?: string;
  address?: string;
  phone?: string;
  comment?: string;
};

const VendorView = () => {
  const { showToast, showConfirm } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isPreview, setIsPreview] = useState(false);

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
    vat_pan: "",
    address: "",
    phone: "",
    comment: "",
  });

  const API = process.env.NEXT_PUBLIC_API_VENDOR;
  if (!API) throw new Error("NEXT_PUBLIC_API_VENDOR not defined");

  // Filter, sort, and paginate vendors using useMemo
  const { paginatedVendors, totalPages, totalFiltered } = useMemo(() => {
    // Step 1: Filter
    let filtered = vendors.filter(vendor => {
      // Search filter
      if (tableSearchQuery.trim()) {
        const query = tableSearchQuery.toLowerCase();
        const searchFields = [
          vendor.name,
          `V${String(vendor.id).padStart(3, '0')}`,
          vendor.address,
          vendor.vat_pan,
          vendor.phone,
        ].filter(Boolean).map(f => String(f).toLowerCase());

        if (!searchFields.some(field => field.includes(query))) {
          return false;
        }
      }
      return true;
    });

    // Step 2: Sort
    filtered = filtered.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let aVal: any = a[sortColumn as keyof Vendor];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bVal: any = b[sortColumn as keyof Vendor];
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

    return { paginatedVendors: paginated, totalPages, totalFiltered };
  }, [vendors, tableSearchQuery, sortColumn, sortDirection, currentPage, itemsPerPage]);

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
  const resetForm = () => {
    setFormData({
      name: "",
      vat_pan: "",
      address: "",
      phone: "",
      comment: "",
    });
  };

  // Fetch Vendors
  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setVendors(res.data);
    } catch {
      showToast("error", "Failed to fetch vendors.");
    } finally {
      setLoading(false);
    }
  }, [API, showToast]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Handle Change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save Vendor
  const handleSaveVendor = async () => {
    try {
      setSaveLoading(true);

      if (!formData.name.trim()) {
        showToast("warning", "Vendor name is required");
        return;
      }

      if (editingVendor) {
        await axios.put(`${API}/${editingVendor.id}`, formData);
        showToast("success", "Vendor updated successfully!");
      } else {
        await axios.post(API, formData);
        showToast("success", "Vendor created successfully!");
      }

      setIsDrawerOpen(false);
      setEditingVendor(null);
      setIsPreview(false);
      resetForm();
      await fetchVendors();
    } catch {
      showToast("error", "Error saving vendor.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete Vendor
  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Vendor",
      message: "Are you sure you want to delete this vendor? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      await axios.delete(`${API}/${id}`);
      await fetchVendors();
      showToast("success", "Vendor deleted successfully!");
    } catch {
      showToast("error", "Failed to delete vendor.");
    }
  };

  // Drawer handlers
  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      vat_pan: vendor.vat_pan || "",
      address: vendor.address || "",
      phone: vendor.phone || "",
      comment: vendor.comment || "",
    });
    setIsDrawerOpen(true);
    setIsPreview(false);
  };

  const handlePreview = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      vat_pan: vendor.vat_pan || "",
      address: vendor.address || "",
      phone: vendor.phone || "",
      comment: vendor.comment || "",
    });
    setIsDrawerOpen(true);
    setIsPreview(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingVendor(null);
    setIsPreview(false);
    resetForm();
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Vendors</h2>
          <p className="text-gray-500 text-sm">Manage all vendors</p>
        </div>
        <button
          className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-medium hover:bg-[#1a5a8a]"
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
            setEditingVendor(null);
            setIsPreview(false);
          }}
        >
          <Plus size={18} /> Add Vendor
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
            { value: "id-asc", label: "Oldest first", description: "First created vendors" },
            { value: "name-asc", label: "Name A-Z", description: "Alphabetical order" },
            { value: "name-desc", label: "Name Z-A", description: "Reverse alphabetical" },
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
          <Loader loading={true} message="Loading Vendors..." />
        ) : totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No vendors found</p>
            <p className="text-gray-500 mb-2 font-medium">
              Get started by creating your first vendor.
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
                      <div className="flex items-center gap-1">Name {sortColumn === "name" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAT/PAN</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-500">V{String(vendor.id).padStart(3, '0')}</td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-medium text-[#2272B4] hover:underline cursor-pointer">{vendor.name}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{vendor.vat_pan || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{vendor.address || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{vendor.phone || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePreview(vendor)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id)}
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
          <div className="ml-auto w-full max-w-xl bg-white shadow-2xl h-screen flex flex-col relative z-10">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-600" />
                  {isPreview
                    ? "Vendor Details"
                    : editingVendor
                    ? "Edit Vendor"
                    : "Add New Vendor"}
                </h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeDrawer}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Vendor Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter vendor name"
                    value={formData.name}
                    onChange={handleChange}
                    readOnly={isPreview}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* VAT/PAN */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    VAT/PAN
                  </label>
                  <input
                    type="text"
                    name="vat_pan"
                    placeholder="Enter VAT/PAN number"
                    value={formData.vat_pan}
                    onChange={handleChange}
                    readOnly={isPreview}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={handleChange}
                    readOnly={isPreview}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    readOnly={isPreview}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Comment
                  </label>
                  <textarea
                    name="comment"
                    placeholder="Optional comments"
                    value={formData.comment}
                    onChange={handleChange}
                    readOnly={isPreview}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
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
                  onClick={handleSaveVendor}
                  disabled={saveLoading}
                >
                  {saveLoading
                    ? "Saving..."
                    : editingVendor
                    ? "Update Vendor"
                    : "Save Vendor"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorView;
