"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, X, Edit2, Trash2, MoreVertical, BrickWall, Package, Palette, Scale, Shell, Truck, Eye, Filter, ChevronLeft } from "lucide-react";
import Loader from "@/app/Components/Loader";
import Select from "react-select";

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
  const [batches, setBatches] = useState<Batch[]>([]);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(true);
  const [selectedView, setSelectedView] = useState("all");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

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

  // Toggle all rows
  const toggleAllRows = () => {
    if (selectedRows.size === filteredBatches.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredBatches.map(b => b.id)));
    }
  };

  // Filter batches based on selected filters
  const filteredBatches = batches.filter(batch => {
    // Apply saved view filters
    if (selectedView === "high-quantity" && batch.quantity <= 500) return false;
    if (selectedView === "low-stock" && batch.quantity >= 100) return false;

    // Apply unit filters
    if (selectedUnits.length > 0 && !selectedUnits.includes(batch.unit)) return false;

    // Apply color filters
    if (selectedColors.length > 0 && !selectedColors.includes(batch.color)) return false;

    return true;
  });

  // Get unique values for filters
  const uniqueUnits = Array.from(new Set(batches.map(b => b.unit)));
  const uniqueColors = Array.from(new Set(batches.map(b => b.color).filter(Boolean)));

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedView("all");
    setSelectedUnits([]);
    setSelectedColors([]);
  };

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
      alert("Failed to fetch batches. Please try again.");
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
      alert("Failed to fetch rolls.");
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
      alert("Failed to fetch vendors.");
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
        alert("Batch name is required");
        return;
      }
      if (!formData.quantity || formData.quantity <= 0) {
        alert("Valid quantity is required");
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
        alert("Batch updated successfully!");
      } else {
        console.log("➕ Creating new batch");
        await axios.post(`${API}/batches`, payload);
        alert("Batch created successfully!");
      }

      // Reset and close
      setIsDrawerOpen(false);
      setEditingBatch(null);
      setIsPreview(false);
      resetFormData();
      await fetchBatches();

    } catch (err) {
      console.error("Save error:", err);
      alert(`Error ${editingBatch ? 'updating' : 'creating'} batch. Please try again.`);
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
    if (!confirm("Are you sure you want to delete this batch?")) {
      return;
    }

    try {
      await axios.delete(`${API}/batches/${id}`);
      await fetchBatches();
      alert("Batch deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete batch. Please try again.");
    }
  };

  // Bulk Delete Functions
  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      alert("Please select batches to delete");
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
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleContinueDelete = () => {
    setShowDeleteWarning(false);
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") {
      alert("Please type 'delete' to confirm");
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

      alert(`Successfully deleted ${selectedBatchIds.length} batch(es)`);
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete some batches. Please try again.");
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
    <div className="pr-8 bg-gray-50 min-h-screen">
      {/* Main Layout: Filter Sidebar + Content */}
      <div className="flex min-h-screen">
        {/* Filters Sidebar */}
        <div
          className={`bg-white shadow flex-shrink-0 border-r border-gray-200 min-h-screen overflow-y-auto transition-all duration-300 ease-in-out ${
            filterSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'
          }`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}
        >
            {/* Filters Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setFilterSidebarOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Collapse filters"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="px-6">
              {/* Saved Views */}
              <div className="py-4 border-b border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-3" style={{ letterSpacing: '-0.01em' }}>Saved Views</h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedView("all")}
                    className={`w-full flex items-center justify-between text-left py-1.5 px-4 rounded-xl transition-all ${
                      selectedView === "all"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className={`text-[15px] font-medium ${selectedView === "all" ? "text-white" : "text-gray-800"}`} style={{ letterSpacing: '-0.01em' }}>
                      All Batches
                    </span>
                    <span className={`text-[15px] font-semibold ${selectedView === "all" ? "text-white" : "text-gray-500"}`}>
                      {batches.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedView("high-quantity")}
                    className={`w-full flex items-center justify-between text-left py-1.5 px-4 rounded-xl transition-all ${
                      selectedView === "high-quantity"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className={`text-[15px] font-medium ${selectedView === "high-quantity" ? "text-white" : "text-gray-800"}`} style={{ letterSpacing: '-0.01em' }}>
                      High Quantity
                    </span>
                    <span className={`text-[15px] font-semibold ${selectedView === "high-quantity" ? "text-white" : "text-gray-500"}`}>
                      {batches.filter(b => b.quantity > 500).length}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedView("low-stock")}
                    className={`w-full flex items-center justify-between text-left py-1.5 px-4 rounded-xl transition-all ${
                      selectedView === "low-stock"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className={`text-[15px] font-medium ${selectedView === "low-stock" ? "text-white" : "text-gray-800"}`} style={{ letterSpacing: '-0.01em' }}>
                      Low Stock
                    </span>
                    <span className={`text-[15px] font-semibold ${selectedView === "low-stock" ? "text-white" : "text-gray-500"}`}>
                      {batches.filter(b => b.quantity < 100).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Unit Filter */}
              <div className="py-4 border-b border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-3" style={{ letterSpacing: '-0.01em' }}>Unit</h4>
                <div className="space-y-2">
                  {uniqueUnits.map(unit => (
                    <label key={unit} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedUnits.includes(unit)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUnits([...selectedUnits, unit]);
                          } else {
                            setSelectedUnits(selectedUnits.filter(u => u !== unit));
                          }
                        }}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-[15px] text-gray-800 group-hover:text-gray-900" style={{ letterSpacing: '-0.01em' }}>{unit}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="py-4 border-b border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-3" style={{ letterSpacing: '-0.01em' }}>Color</h4>
                <div className="space-y-2">
                  {uniqueColors.map(color => (
                    <label key={color} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColors([...selectedColors, color]);
                          } else {
                            setSelectedColors(selectedColors.filter(c => c !== color));
                          }
                        }}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-[15px] text-gray-800 capitalize group-hover:text-gray-900" style={{ letterSpacing: '-0.01em' }}>{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedUnits.length > 0 || selectedColors.length > 0 || selectedView !== "all") && (
                <div className="py-4">
                  <button
                    onClick={clearAllFilters}
                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

        {/* Main Content Area */}
        <div className="flex-1 pl-6 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-6">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-0.5"
                title={filterSidebarOpen ? "Hide filters" : "Show filters"}
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold">Batch View</h2>
                <p className="text-gray-500 text-l font-regular">
                  Manage production batches and track progress
                </p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 hover:scale-105"
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

          {/* Table Container */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            {loading ? (
              <Loader loading={true} message="Loading Batches..." />
            ) : filteredBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Package size={48} className="text-gray-300 mb-4" />
                <p className="text-black mb-2 font-medium">No batches found</p>
                <p className="text-gray-500 mb-2 font-medium">
                  Get started by creating your first batch. Click the Add Batch button to begin tracking your production.
                </p>
              </div>
            ) : (
              <table className="w-max min-w-full table-auto border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === filteredBatches.length}
                        onChange={toggleAllRows}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">BATCH</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">QUANTITY</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">UNIT</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">COLOR</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ROLL</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">VENDOR</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className={selectedRows.has(batch.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(batch.id)}
                          onChange={() => toggleRowSelection(batch.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 font-medium">BA00{batch.id}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-900">{batch.name}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-900">{batch.quantity}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-900">{batch.unit}</td>
                      <td className="px-4 py-2.5 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {batch.color}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900">{batch.roll?.name || "-"}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-900">
                        {batch.vendor ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${getAvatarColor(batch.vendor.name)} flex items-center justify-center text-white text-xs font-semibold`}>
                              {getVendorInitials(batch.vendor.name)}
                            </div>
                            <span>{batch.vendor.name}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreview(batch)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(batch)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(batch.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
            )}
          </div>
        </div>
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
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
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