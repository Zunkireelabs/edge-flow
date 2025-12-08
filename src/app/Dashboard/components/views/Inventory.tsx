/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Eye,
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Check,
  Search,
  Settings,
  FileText,
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import NepaliDatePicker from "@/app/Components/NepaliDatePicker";
import { useToast } from "@/app/Components/ToastContext";

// ============== INTERFACES ==============
interface InventoryCategory {
  id: number;
  name: string;
  _count?: {
    inventory: number;
  };
}

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  date: string;
  quantity: number;
  price: number;
  vendor: string;
  phone: string;
  remarks: string;
  category_id: number | null;
  category: InventoryCategory | null;
  min_quantity: number | null;
}

interface FilterOption {
  value: string;
  label: string;
  description?: string;
}

// ============== CONSTANTS ==============
const SUBTRACTION_REASONS: FilterOption[] = [
  { value: "PRODUCTION_USE", label: "Production Use", description: "Used in production process" },
  { value: "DAMAGED", label: "Damaged", description: "Item was damaged" },
  { value: "SAMPLE", label: "Sample", description: "Given as sample" },
  { value: "RETURNED", label: "Returned to Vendor", description: "Returned to supplier" },
  { value: "EXPIRED", label: "Expired", description: "Item past expiry date" },
  { value: "OTHER", label: "Other", description: "Other reason" },
];

const UNIT_OPTIONS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "m", label: "Meter (m)" },
  { value: "cm", label: "Centimeter (cm)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "roll", label: "Roll" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "dozen", label: "Dozen" },
  { value: "ltr", label: "Liter (ltr)" },
];

const API = {
  create: process.env.NEXT_PUBLIC_CREATE_INVENTORY,
  getAll: process.env.NEXT_PUBLIC_GET_INVENTORY,
  update: (id: number) => `${process.env.NEXT_PUBLIC_UPDATE_INVENTORY}/${id}`,
  delete: (id: number) => `${process.env.NEXT_PUBLIC_DELETE_INVENTORY}/${id}`,
  // Categories
  getCategories: process.env.NEXT_PUBLIC_GET_INVENTORY_CATEGORIES,
  createCategory: process.env.NEXT_PUBLIC_CREATE_INVENTORY_CATEGORY,
  updateCategory: (id: number) => `${process.env.NEXT_PUBLIC_UPDATE_INVENTORY_CATEGORY}/${id}`,
  deleteCategory: (id: number) => `${process.env.NEXT_PUBLIC_DELETE_INVENTORY_CATEGORY}/${id}`,
  // Additions
  createAddition: process.env.NEXT_PUBLIC_CREATE_INVENTORY_ADDITION,
  getAdditionsByInventory: (id: number) => `${process.env.NEXT_PUBLIC_GET_INVENTORY_ADDITION_BY_INVENTORY}/${id}`,
  // Subtractions
  createSubtraction: process.env.NEXT_PUBLIC_CREATE_INVENTORY_SUBTRACTION,
  getSubtractionsByInventory: (id: number) => `${process.env.NEXT_PUBLIC_GET_INVENTORY_SUBTRACTION_BY_INVENTORY}/${id}`,
};

// ============== FILTER DROPDOWN COMPONENT ==============
interface FilterDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  searchable?: boolean;
  icon?: React.ReactNode;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  searchable = true,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : label;

  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = value !== "all" && value !== "";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
          isActive
            ? "border-[#2272B4] bg-blue-50 text-[#2272B4]"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" />

          {searchable && (
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2272B4] focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-2">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 ${
                  value === option.value ? "bg-blue-50" : ""
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    value === option.value ? "border-[#2272B4] bg-[#2272B4]" : "border-gray-300"
                  }`}
                >
                  {value === option.value && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 truncate">{option.description}</div>
                  )}
                </div>
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============== MAIN COMPONENT ==============
const Inventory = () => {
  const { showToast, showConfirm } = useToast();

  // Data states
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // UI states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | "adjust" | "preview">("add");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract" | null>(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Selection states
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Category modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Stock In/Out modal states
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalType, setStockModalType] = useState<"in" | "out">("in");
  const [stockSearchQuery, setStockSearchQuery] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    unit: "pcs",
    date: "",
    quantity: "",
    price: "",
    vendor: "",
    phone: "",
    remarks: "",
    category_id: "",
    min_quantity: "",
  });

  // Adjustment form
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: "",
    date: "",
    remarks: "",
    reason: "",
  });

  // ============== DATA FETCHING ==============
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(API.getAll!);
      setInventoryItems(res.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      showToast("error", "Failed to fetch inventory items");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(API.getCategories!);
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchAdjustmentHistory = async (inventoryId: number) => {
    try {
      setHistoryLoading(true);
      const [additionsRes, subtractionsRes] = await Promise.all([
        axios.get(API.getAdditionsByInventory(inventoryId)),
        axios.get(API.getSubtractionsByInventory(inventoryId)),
      ]);

      const additions = (additionsRes.data || []).map((item: any) => ({
        ...item,
        type: "addition",
      }));
      const subtractions = (subtractionsRes.data || []).map((item: any) => ({
        ...item,
        type: "subtraction",
      }));

      const combined = [...additions, ...subtractions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setAdjustmentHistory(combined);
    } catch (error) {
      console.error("Error fetching adjustment history:", error);
      setAdjustmentHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, [fetchInventory, fetchCategories]);

  // ============== FILTERING, SORTING, PAGINATION ==============
  const { paginatedItems, totalPages, totalFiltered, lowStockCount } = useMemo(() => {
    // Filter
    let filtered = inventoryItems.filter((item) => {
      if (selectedCategory !== "all") {
        if (selectedCategory === "uncategorized") {
          if (item.category_id !== null) return false;
        } else {
          if (item.category_id !== Number(selectedCategory)) return false;
        }
      }
      if (selectedUnit !== "all" && item.unit !== selectedUnit) return false;
      if (showLowStockOnly) {
        const minQty = item.min_quantity || 0;
        if (minQty <= 0 || item.quantity > minQty) return false;
      }
      return true;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortColumn as keyof InventoryItem];
      let bVal: any = b[sortColumn as keyof InventoryItem];

      if (sortColumn === "category") {
        aVal = a.category?.name || "";
        bVal = b.category?.name || "";
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Count low stock
    const lowStockCount = inventoryItems.filter((i) => {
      const minQty = i.min_quantity || 0;
      return minQty > 0 && i.quantity <= minQty;
    }).length;

    // Paginate
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { paginatedItems: paginated, totalPages, totalFiltered, lowStockCount };
  }, [
    inventoryItems,
    selectedCategory,
    selectedUnit,
    showLowStockOnly,
    sortColumn,
    sortDirection,
    currentPage,
    itemsPerPage,
  ]);

  // ============== HELPERS ==============
  const formatInventoryId = (id: number) => `I${String(id).padStart(3, "0")}`;

  const isLowStock = (item: InventoryItem) => {
    const minQty = item.min_quantity || 0;
    return minQty > 0 && item.quantity <= minQty;
  };

  const hasActiveFilters = selectedCategory !== "all" || selectedUnit !== "all" || showLowStockOnly;

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedUnit("all");
    setShowLowStockOnly(false);
    setCurrentPage(1);
  };

  const getUniqueUnits = () => {
    const units = new Set(inventoryItems.map((i) => i.unit));
    return Array.from(units);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      unit: "pcs",
      date: "",
      quantity: "",
      price: "",
      vendor: "",
      phone: "",
      remarks: "",
      category_id: "",
      min_quantity: "",
    });
    setAdjustmentData({
      quantity: "",
      date: "",
      remarks: "",
      reason: "",
    });
    setEditingItem(null);
    setIsPreview(false);
    setAdjustmentType(null);
    setAdjustmentHistory([]);
    setDrawerMode("add");
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    resetForm();
  };

  // ============== HANDLERS ==============
  const handleAddNew = () => {
    resetForm();
    setDrawerMode("add");
    setIsDrawerOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      date: item.date ? item.date.split("T")[0] : "",
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      vendor: item.vendor,
      phone: item.phone,
      remarks: item.remarks || "",
      category_id: item.category_id ? item.category_id.toString() : "",
      min_quantity: item.min_quantity ? item.min_quantity.toString() : "",
    });
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  const handleAdjust = (item: InventoryItem) => {
    setEditingItem(item);
    setAdjustmentData({
      quantity: "",
      date: "",
      remarks: "",
      reason: "",
    });
    setAdjustmentType(null);
    setDrawerMode("adjust");
    setIsDrawerOpen(true);
  };

  // Open Stock In/Out modal
  const handleOpenStockModal = (type: "in" | "out") => {
    setStockModalType(type);
    setStockSearchQuery("");
    setShowStockModal(true);
  };

  // Select item from Stock In/Out modal and open adjustment drawer
  const handleSelectItemForStock = (item: InventoryItem) => {
    setShowStockModal(false);
    setEditingItem(item);
    setAdjustmentData({
      quantity: "",
      date: "",
      remarks: "",
      reason: "",
    });
    setAdjustmentType(stockModalType === "in" ? "add" : "subtract");
    setDrawerMode("adjust");
    setIsDrawerOpen(true);
  };

  // Filter items for stock modal search
  const filteredStockItems = useMemo(() => {
    if (!stockSearchQuery.trim()) return inventoryItems;
    const query = stockSearchQuery.toLowerCase();
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.vendor.toLowerCase().includes(query) ||
        `I${String(item.id).padStart(3, "0")}`.toLowerCase().includes(query)
    );
  }, [inventoryItems, stockSearchQuery]);

  const handlePreview = (item: InventoryItem) => {
    setEditingItem(item);
    setDrawerMode("preview");
    setIsDrawerOpen(true);
    fetchAdjustmentHistory(item.id);
  };

  const handleSubmit = async () => {
    try {
      setSaveLoading(true);

      // Validation
      if (!formData.name.trim()) {
        showToast("warning", "Item name is required");
        return;
      }
      if (!formData.quantity || parseFloat(formData.quantity) < 0) {
        showToast("warning", "Please enter a valid quantity");
        return;
      }

      const payload = {
        name: formData.name.trim(),
        unit: formData.unit,
        quantity: parseFloat(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        vendor: formData.vendor.trim(),
        phone: formData.phone.trim(),
        remarks: formData.remarks.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        min_quantity: formData.min_quantity ? parseFloat(formData.min_quantity) : 0,
      };

      if (drawerMode === "edit" && editingItem) {
        await axios.put(API.update(editingItem.id), payload);
        showToast("success", "Item updated successfully!");
      } else {
        await axios.post(API.create!, payload);
        showToast("success", "Item added successfully!");
      }

      closeDrawer();
      fetchInventory();
    } catch (error: any) {
      console.error("Error saving item:", error);
      showToast("error", error.response?.data?.message || "Failed to save item");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAdjustmentSubmit = async () => {
    try {
      setSaveLoading(true);

      if (!adjustmentData.quantity || parseFloat(adjustmentData.quantity) <= 0) {
        showToast("warning", "Please enter a valid quantity");
        return;
      }
      if (!adjustmentData.date) {
        showToast("warning", "Please select a date");
        return;
      }
      if (adjustmentType === "subtract" && !adjustmentData.reason) {
        showToast("warning", "Please select a reason for subtraction");
        return;
      }

      const payload = {
        inventory_id: editingItem!.id,
        date: adjustmentData.date,
        quantity: parseFloat(adjustmentData.quantity),
        remarks: adjustmentData.remarks.trim(),
        ...(adjustmentType === "subtract" && { reason: adjustmentData.reason }),
      };

      if (adjustmentType === "add") {
        await axios.post(API.createAddition!, payload);
        showToast("success", "Stock added successfully!");
      } else {
        await axios.post(API.createSubtraction!, payload);
        showToast("success", "Stock subtracted successfully!");
      }

      closeDrawer();
      fetchInventory();
    } catch (error: any) {
      console.error("Error adjusting stock:", error);
      showToast("error", error.response?.data?.message || "Failed to adjust stock");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Item",
      message: "Are you sure you want to delete this inventory item? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      await axios.delete(API.delete(id));
      showToast("success", "Item deleted successfully!");
      fetchInventory();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      showToast("error", error.response?.data?.message || "Failed to delete item");
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm({
      title: "Delete Selected Items",
      message: `Are you sure you want to delete ${selectedRows.size} selected items? This action cannot be undone.`,
      confirmText: "Delete All",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedRows).map((id) =>
        axios.delete(API.delete(id))
      );
      await Promise.all(deletePromises);
      showToast("success", `${selectedRows.size} items deleted successfully!`);
      setSelectedRows(new Set());
      fetchInventory();
    } catch (error: any) {
      console.error("Error deleting items:", error);
      showToast("error", "Failed to delete some items");
    }
  };

  // ============== ROW SELECTION ==============
  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedItems.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedItems.map((i) => i.id)));
    }
  };

  // ============== SORTING ==============
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // ============== CATEGORY MANAGEMENT ==============
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast("warning", "Category name is required");
      return;
    }

    try {
      setCategoryLoading(true);
      await axios.post(API.createCategory!, { name: newCategoryName.trim() });
      showToast("success", "Category created successfully!");
      setNewCategoryName("");
      fetchCategories();
    } catch (error: any) {
      console.error("Error creating category:", error);
      showToast("error", error.response?.data?.message || "Failed to create category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      showToast("warning", "Category name is required");
      return;
    }

    try {
      setCategoryLoading(true);
      await axios.put(API.updateCategory(editingCategory.id), { name: newCategoryName.trim() });
      showToast("success", "Category updated successfully!");
      setNewCategoryName("");
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      console.error("Error updating category:", error);
      showToast("error", error.response?.data?.message || "Failed to update category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (category: InventoryCategory) => {
    const confirmed = await showConfirm({
      title: "Delete Category",
      message: `Are you sure you want to delete "${category.name}"? Items in this category will become uncategorized.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      await axios.delete(API.deleteCategory(category.id));
      showToast("success", "Category deleted successfully!");
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      showToast("error", error.response?.data?.message || "Failed to delete category");
    }
  };

  // ============== RENDER ==============
  return (
    <div className="p-8 bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Inventory</h2>
          <p className="text-gray-500 text-sm">Manage your inventory items and track stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <button
              onClick={() => {
                setShowLowStockOnly(!showLowStockOnly);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showLowStockOnly
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-amber-300 text-amber-600 hover:bg-amber-50"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {lowStockCount} Low Stock
            </button>
          )}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={() => handleOpenStockModal("in")}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-green-500 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4" />
            Stock In
          </button>
          <button
            onClick={() => handleOpenStockModal("out")}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-500 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all duration-200"
          >
            <TrendingDown className="w-4 h-4" />
            Stock Out
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-[#1a5a8a] hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <FilterDropdown
          label="All Categories"
          value={selectedCategory}
          onChange={(val) => {
            setSelectedCategory(val);
            setCurrentPage(1);
          }}
          options={[
            { value: "all", label: "All Categories", description: "Show all items" },
            { value: "uncategorized", label: "Uncategorized", description: "Items without category" },
            ...categories.map((cat) => ({
              value: String(cat.id),
              label: cat.name,
              description: `${cat._count?.inventory || 0} items`,
            })),
          ]}
        />
        <FilterDropdown
          label="All Units"
          value={selectedUnit}
          onChange={(val) => {
            setSelectedUnit(val);
            setCurrentPage(1);
          }}
          options={[
            { value: "all", label: "All Units", description: "Show all units" },
            ...getUniqueUnits().map((unit) => ({
              value: unit,
              label: unit,
            })),
          ]}
        />
        <FilterDropdown
          label="Sort"
          value={`${sortColumn}-${sortDirection}`}
          onChange={(val) => {
            const [col, dir] = val.split("-");
            setSortColumn(col);
            setSortDirection(dir as "asc" | "desc");
            setCurrentPage(1);
          }}
          searchable={false}
          icon={<ArrowUpDown className="w-4 h-4" />}
          options={[
            { value: "id-desc", label: "Newest first", description: "Most recently added" },
            { value: "id-asc", label: "Oldest first", description: "First added items" },
            { value: "name-asc", label: "Name A-Z", description: "Alphabetical order" },
            { value: "name-desc", label: "Name Z-A", description: "Reverse alphabetical" },
            { value: "quantity-asc", label: "Quantity (Low to High)", description: "Lowest stock first" },
            { value: "quantity-desc", label: "Quantity (High to Low)", description: "Highest stock first" },
          ]}
        />
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear all
          </button>
        )}
        <span className="text-sm text-gray-500 ml-auto">{totalFiltered} results</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8">
            <Loader loading={true} message="Loading Inventory..." />
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-900 mb-2 font-medium">No items found</p>
            <p className="text-gray-500 text-sm mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters or "
                : "Get started by "}
              adding your first item.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-[#2272B4] hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedItems.length && paginatedItems.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortColumn === "id" && (
                        sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Item Name
                      {sortColumn === "name" && (
                        sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center gap-1">
                      Quantity
                      {sortColumn === "quantity" && (
                        sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      {sortColumn === "category" && (
                        sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      selectedRows.has(item.id)
                        ? "bg-blue-50"
                        : isLowStock(item)
                        ? "bg-amber-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(item.id)}
                        onChange={() => toggleRowSelection(item.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#2272B4] focus:ring-[#2272B4]"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatInventoryId(item.id)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium text-[#2272B4] hover:underline cursor-pointer"
                          onClick={() => handlePreview(item)}
                        >
                          {item.name}
                        </span>
                        {isLowStock(item) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.quantity} {item.unit}
                      {item.min_quantity && item.min_quantity > 0 && (
                        <span className="text-xs text-gray-400 ml-1">(min: {item.min_quantity})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.category?.name || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.vendor || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePreview(item)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleAdjust(item)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-colors"
                          title="Adjust Stock"
                        >
                          <TrendingUp size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-white">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalFiltered)} of {totalFiltered}
              </div>
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
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-3 text-sm">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedRows.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-[#2272B4] text-white rounded-full shadow-2xl px-6 py-4 flex items-center gap-6 animate-slide-up">
            <span className="font-semibold text-sm">
              {selectedRows.size} {selectedRows.size === 1 ? "item" : "items"} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-4 py-2 bg-white text-[#2272B4] rounded-full font-medium hover:bg-gray-100 transition-colors text-sm"
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

      {/* Right Sliding Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-white/30 transition-opacity duration-300"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={closeDrawer}
          />
          <div
            className={`ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto transition-transform duration-300 ease-in-out ${
              isDrawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeDrawer}
            >
              <X size={20} />
            </button>

            {/* Drawer Header */}
            <div className="border-b border-gray-200 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <Package size={24} className="text-[#2272B4]" />
                <h3 className="text-xl font-bold text-gray-900">
                  {drawerMode === "add" && "Add New Item"}
                  {drawerMode === "edit" && "Edit Item"}
                  {drawerMode === "adjust" && `Adjust Stock - ${editingItem?.name}`}
                  {drawerMode === "preview" && "Item Details"}
                </h3>
              </div>
              {drawerMode === "adjust" && editingItem && (
                <p className="text-sm text-gray-500 mt-2">
                  Current Stock: {editingItem.quantity} {editingItem.unit}
                </p>
              )}
            </div>

            {/* Drawer Content */}
            {drawerMode === "preview" && editingItem ? (
              /* Preview Mode */
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-[#2272B4]" />
                    <h4 className="font-semibold">Item Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">ID</p>
                      <p className="text-sm font-medium">{formatInventoryId(editingItem.id)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium">{editingItem.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Current Stock</p>
                      <p className="text-sm font-medium">{editingItem.quantity} {editingItem.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Min Quantity</p>
                      <p className="text-sm font-medium">{editingItem.min_quantity || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium">{editingItem.category?.name || "Uncategorized"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="text-sm font-medium">{editingItem.price || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Vendor</p>
                      <p className="text-sm font-medium">{editingItem.vendor || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium">{editingItem.phone || "-"}</p>
                    </div>
                  </div>
                  {editingItem.remarks && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">Remarks</p>
                      <p className="text-sm">{editingItem.remarks}</p>
                    </div>
                  )}
                </div>

                {/* Adjustment History */}
                <div>
                  <h4 className="font-semibold mb-3">Adjustment History</h4>
                  {historyLoading ? (
                    <Loader loading={true} message="Loading history..." />
                  ) : adjustmentHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No adjustment history</p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {adjustmentHistory.map((adj, idx) => (
                        <div
                          key={idx}
                          className={`border-l-4 rounded-lg p-3 ${
                            adj.type === "addition"
                              ? "border-l-green-500 bg-green-50"
                              : "border-l-red-500 bg-red-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {adj.type === "addition" ? (
                                <TrendingUp size={16} className="text-green-600" />
                              ) : (
                                <TrendingDown size={16} className="text-red-600" />
                              )}
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  adj.type === "addition"
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                                }`}
                              >
                                {adj.type === "addition" ? "Added" : "Subtracted"}
                              </span>
                              {adj.reason && (
                                <span className="text-xs text-gray-500">
                                  ({SUBTRACTION_REASONS.find((r) => r.value === adj.reason)?.label || adj.reason})
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(adj.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            {adj.quantity} {editingItem.unit}
                          </p>
                          {adj.remarks && (
                            <p className="text-xs text-gray-600 mt-1">{adj.remarks}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : drawerMode === "adjust" && editingItem ? (
              /* Adjust Stock Mode */
              <div className="space-y-4">
                {adjustmentType === null ? (
                  /* Selection */
                  <div className="space-y-6 py-4">
                    <p className="text-center text-gray-600">Choose adjustment type:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setAdjustmentType("add")}
                        className="px-6 py-8 border-2 border-green-500 bg-white text-green-600 rounded-xl hover:bg-green-50 transition-colors flex flex-col items-center gap-2"
                      >
                        <TrendingUp size={32} />
                        <span className="font-medium">Add Stock</span>
                      </button>
                      <button
                        onClick={() => setAdjustmentType("subtract")}
                        className="px-6 py-8 border-2 border-red-500 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-colors flex flex-col items-center gap-2"
                      >
                        <TrendingDown size={32} />
                        <span className="font-medium">Subtract Stock</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Adjustment Form */
                  <div className="space-y-4">
                    <div
                      className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                        adjustmentType === "add"
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-red-100 text-red-700 border border-red-300"
                      }`}
                    >
                      {adjustmentType === "add" ? "Adding Stock" : "Subtracting Stock"}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <NepaliDatePicker
                          value={adjustmentData.date}
                          onChange={(value) =>
                            setAdjustmentData({ ...adjustmentData, date: value })
                          }
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={adjustmentData.quantity}
                          onChange={(e) =>
                            setAdjustmentData({ ...adjustmentData, quantity: e.target.value })
                          }
                          placeholder="Enter quantity"
                          min="0"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    {adjustmentType === "subtract" && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                          Reason <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={adjustmentData.reason}
                          onChange={(e) =>
                            setAdjustmentData({ ...adjustmentData, reason: e.target.value })
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Select reason...</option>
                          {SUBTRACTION_REASONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                        Remarks
                      </label>
                      <textarea
                        value={adjustmentData.remarks}
                        onChange={(e) =>
                          setAdjustmentData({ ...adjustmentData, remarks: e.target.value })
                        }
                        placeholder="Additional notes..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setAdjustmentType(null)}
                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleAdjustmentSubmit}
                        disabled={saveLoading}
                        className="px-6 py-2 rounded-lg bg-[#2272B4] text-white hover:bg-[#1a5a8a] disabled:opacity-50 font-medium transition-colors"
                      >
                        {saveLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Add/Edit Form */
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                      min="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">No Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Min Quantity
                      <span className="text-xs text-gray-400 ml-1">(Low stock alert)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                      placeholder="0"
                      min="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Price
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Vendor
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="Vendor name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Contact number"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                  <button
                    onClick={closeDrawer}
                    disabled={saveLoading}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saveLoading}
                    className="px-6 py-2 rounded-lg bg-[#2272B4] text-white hover:bg-[#1a5a8a] disabled:opacity-50 font-medium transition-colors shadow-sm"
                  >
                    {saveLoading ? "Saving..." : drawerMode === "edit" ? "Update Item" : "Save Item"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => {
              setShowCategoryModal(false);
              setNewCategoryName("");
              setEditingCategory(null);
            }}
          />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowCategoryModal(false);
                setNewCategoryName("");
                setEditingCategory(null);
              }}
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-semibold mb-4">Manage Categories</h3>

            {/* Add/Edit Form */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={editingCategory ? "Edit category name" : "New category name"}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    editingCategory ? handleUpdateCategory() : handleCreateCategory();
                  }
                }}
              />
              {editingCategory ? (
                <>
                  <button
                    onClick={handleUpdateCategory}
                    disabled={categoryLoading}
                    className="px-4 py-2 bg-[#2272B4] text-white rounded-lg text-sm font-medium hover:bg-[#1a5a8a] disabled:opacity-50"
                  >
                    {categoryLoading ? "..." : "Update"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCategoryName("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreateCategory}
                  disabled={categoryLoading}
                  className="px-4 py-2 bg-[#2272B4] text-white rounded-lg text-sm font-medium hover:bg-[#1a5a8a] disabled:opacity-50"
                >
                  {categoryLoading ? "..." : "Add"}
                </button>
              )}
            </div>

            {/* Categories List */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No categories yet</p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <div>
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({cat._count?.inventory || 0} items)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setNewCategoryName(cat.name);
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock In/Out Item Selection Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setShowStockModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    stockModalType === "in"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {stockModalType === "in" ? (
                    <TrendingUp size={20} />
                  ) : (
                    <TrendingDown size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {stockModalType === "in" ? "Stock In" : "Stock Out"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Select an item to {stockModalType === "in" ? "add" : "subtract"} stock
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  placeholder="Search by name, ID, or vendor..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Package size={40} className="text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No items found</p>
                </div>
              ) : (
                filteredStockItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItemForStock(item)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                        isLowStock(item)
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          I{String(item.id).padStart(3, "0")}
                        </span>
                        {isLowStock(item) && (
                          <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                            Low
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>
                          {item.quantity} {item.unit}
                        </span>
                        {item.category && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span>{item.category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-500 text-center">
                {filteredStockItems.length} item{filteredStockItems.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
