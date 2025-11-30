"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  X,
  Trash2,
  Edit2,
  Truck,
  Package,
  BrickWall,
  Scale,
  Palette,
  Shell,
  MoreVertical,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import { useToast } from "@/app/Components/ToastContext";

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
  unit: string;
  color: string;
  vendor: Vendor | null;
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
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(true);
  const [selectedView, setSelectedView] = useState("all");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    quantity: "",
    unit: "Kilogram",
    color: "",
    vendorId: "",
  });

  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);

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

  // Toggle all rows
  const toggleAllRows = () => {
    if (selectedRows.size === rolls.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rolls.map(r => r.id)));
    }
  };

  // Filter rolls based on selected filters
  const filteredRolls = rolls.filter(roll => {
    // Apply saved view filters
    if (selectedView === "high-quantity" && roll.quantity <= 500) return false;
    if (selectedView === "low-stock" && roll.quantity >= 100) return false;

    // Apply unit filters
    if (selectedUnits.length > 0 && !selectedUnits.includes(roll.unit)) return false;

    // Apply color filters
    if (selectedColors.length > 0 && !selectedColors.includes(roll.color)) return false;

    // Apply vendor filters
    if (selectedVendors.length > 0 && roll.vendor && !selectedVendors.includes(roll.vendor.id.toString())) return false;

    return true;
  });

  // Get unique values for filters
  const uniqueUnits = Array.from(new Set(rolls.map(r => r.unit)));
  const uniqueColors = Array.from(new Set(rolls.map(r => r.color).filter(Boolean)));
  const uniqueVendors = Array.from(new Set(rolls.map(r => r.vendor).filter(Boolean)));

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedView("all");
    setSelectedUnits([]);
    setSelectedColors([]);
    setSelectedVendors([]);
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      id: "",
      name: "",
      quantity: "",
      unit: "Kilogram",
      color: "",
      vendorId: "",
    });
  };

  // Fetch rolls
  const fetchRolls = async () => {
    try {
      setLoading(true);
      const res = await fetch(GET_ROLLS!);
      if (!res.ok) throw new Error("Failed to fetch rolls");
      const data = await res.json();
      setRolls(data);
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("error", "Failed to fetch rolls. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const res = await fetch(GET_VENDORS!);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error("Fetch vendors error:", err);
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
      const payload = {
        name: formData.name.trim(),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        color: formData.color.trim(),
        vendor_id: formData.vendorId ? Number(formData.vendorId) : null,
      };

      console.log("🔥 Payload going to backend:", payload);

      let response;

      if (editingRoll) {
        console.log("🔄 Updating roll with ID:", editingRoll.id);
        response = await fetch(`${UPDATE_ROLL}/${editingRoll.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
        });
      } else {
        console.log("➕ Creating new roll");
        response = await fetch(CREATE_ROLLS!, {
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
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to ${editingRoll ? 'update' : 'create'} roll: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Success response:", result);

      // Refresh the rolls list
      await fetchRolls();

      // Show success message
      showToast("success", `Roll ${editingRoll ? 'updated' : 'created'} successfully!`);

    } catch (err) {
      console.error("Save error:", err);
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
    console.log("🔧 Editing roll:", roll);
    setEditingRoll(roll);
    setFormData({
      id: roll.id.toString(),
      name: roll.name,
      quantity: String(roll.quantity),
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
      const res = await fetch(`${DELETE_ROLL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete roll");
      await fetchRolls();
      showToast("success", "Roll deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
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

  return (
    <div className="pr-8 bg-white min-h-screen">
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setFilterSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Collapse filters"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-3">
              {/* Saved Views */}
              <div className="py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Saved Views</h4>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setSelectedView("all")}
                    className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-sm transition-all ${
                      selectedView === "all"
                        ? "bg-blue-50 border-l-2 border-blue-600"
                        : "hover:bg-gray-50 border-l-2 border-transparent"
                    }`}
                  >
                    <span className={`text-sm ${selectedView === "all" ? "font-medium text-gray-900" : "text-gray-600"}`}>
                      All Rolls
                    </span>
                    <span className={`text-sm ${selectedView === "all" ? "font-medium text-gray-900" : "text-gray-400"}`}>
                      {rolls.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedView("high-quantity")}
                    className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-sm transition-all ${
                      selectedView === "high-quantity"
                        ? "bg-blue-50 border-l-2 border-blue-600"
                        : "hover:bg-gray-50 border-l-2 border-transparent"
                    }`}
                  >
                    <span className={`text-sm ${selectedView === "high-quantity" ? "font-medium text-gray-900" : "text-gray-600"}`}>
                      High Quantity
                    </span>
                    <span className={`text-sm ${selectedView === "high-quantity" ? "font-medium text-gray-900" : "text-gray-400"}`}>
                      {rolls.filter(r => r.quantity > 500).length}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedView("low-stock")}
                    className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-sm transition-all ${
                      selectedView === "low-stock"
                        ? "bg-blue-50 border-l-2 border-blue-600"
                        : "hover:bg-gray-50 border-l-2 border-transparent"
                    }`}
                  >
                    <span className={`text-sm ${selectedView === "low-stock" ? "font-medium text-gray-900" : "text-gray-600"}`}>
                      Low Stock
                    </span>
                    <span className={`text-sm ${selectedView === "low-stock" ? "font-medium text-gray-900" : "text-gray-400"}`}>
                      {rolls.filter(r => r.quantity < 100).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Unit Filter */}
              <div className="py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Unit</h4>
                <div className="space-y-1">
                  {uniqueUnits.map(unit => (
                    <label key={unit} className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-1 rounded-sm hover:bg-gray-50 transition-colors">
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
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">{unit}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Color</h4>
                <div className="space-y-1">
                  {uniqueColors.map(color => (
                    <label key={color} className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-1 rounded-sm hover:bg-gray-50 transition-colors">
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
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 capitalize group-hover:text-gray-900">{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vendor Filter */}
              <div className="py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Vendor</h4>
                <div className="space-y-1">
                  {uniqueVendors.map(vendor => vendor && (
                    <label key={vendor.id} className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-1 rounded-sm hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id.toString())}
                        onChange={(e) => {
                          const vendorId = vendor.id.toString();
                          if (e.target.checked) {
                            setSelectedVendors([...selectedVendors, vendorId]);
                          } else {
                            setSelectedVendors(selectedVendors.filter(v => v !== vendorId));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">{vendor.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedUnits.length > 0 || selectedColors.length > 0 || selectedVendors.length > 0 || selectedView !== "all") && (
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
          <div className="flex items-center justify-between mb-4 pt-6">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-0.5"
                title={filterSidebarOpen ? "Hide filters" : "Show filters"}
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Roll View</h2>
                <p className="text-gray-500 text-sm">
                  Manage production rolls and track progress
                </p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-semibold shadow-md hover:bg-[#0E538B] hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => {
                resetFormData();
                setIsDrawerOpen(true);
                setOpenMenuId(null);
                setIsPreview(false);
              }}
            >
              <Plus size={18} /> Add Roll
            </button>
          </div>

          {/* Table Container - Databricks style: clean, borderless */}
          <div className="bg-white overflow-x-auto">
        {loading ? (
          <div className="p-6">
            <Loader loading={true} message="Loading Rolls.." />
          </div>

        ) : filteredRolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <FileText size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No rolls found</p>
            <p className="text-gray-500 mb-2 font-medium">
              Get started by creating your first roll. Click the Add Roll button to begin tracking your production.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredRolls.length && filteredRolls.length > 0}
                    onChange={toggleAllRows}
                    className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Unit</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Color</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Vendor</th>
                <th className="px-4 py-3 text-right text-sm font-normal text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRolls.map((roll, index) => (
                <tr
                  key={roll.id}
                  className={`transition-colors ${
                    selectedRows.has(roll.id)
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(roll.id)}
                      onChange={() => toggleRowSelection(roll.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">R{String(roll.id).padStart(3, '0')}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-normal text-[#2272B4] hover:underline cursor-pointer">{roll.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{roll.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{roll.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{roll.color}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {roll.vendor ? roll.vendor.name : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handlePreview(roll)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(roll)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(roll.id)}
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
                  Roll Details
                </h3>

                <div className="space-y-4">
                  {/* ID */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-black">ID</span>
                    <span className="text-sm text-gray-500">R00{formData.id}</span>
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
                    <span className="text-sm text-gray-500">
                      {vendors.find(v => v.id.toString() === formData.vendorId)?.name || "-"}
                    </span>
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
                      {editingRoll ? "Edit Roll" : "Add New Roll"}
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
              {/* ID field - Show only for existing rolls */}
              {editingRoll && (
                <>
                  <p className="text-black font-semibold mb-1"># ID</p>
                  <input
                    type="text"
                    name="id"
                    value={`BO${formData.id}`}
                    readOnly
                    className="w-full border border-gray-300 rounded-[10px] px-3 py-2 bg-gray-100 cursor-not-allowed"
                  />
                </>
              )}

              {/* Roll Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                  </select>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Vendor
                </label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleChange}
                  disabled={isPreview}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
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
    </div>
  );
};


export default RollView;