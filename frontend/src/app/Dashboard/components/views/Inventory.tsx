/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, X, Package, TrendingUp, TrendingDown, FileText } from "lucide-react";
import Loader from "@/app/Components/Loader";
import NepaliDatePicker from "@/app/Components/NepaliDatePicker";

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
}

const API = {
  create: process.env.NEXT_PUBLIC_CREATE_INVENTORY,
  getAll: process.env.NEXT_PUBLIC_GET_INVENTORY,
  update: (id: number) => `${process.env.NEXT_PUBLIC_UPDATE_INVENTORY}/${id}`,
  delete: (id: number) => `${process.env.NEXT_PUBLIC_DELETE_INVENTORY}/${id}`,
};

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract" | null>(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    date: "",
    quantity: "",
    price: "",
    vendor: "",
    phone: "",
    remarks: "",
  });

  // Fetch inventory items
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API.getAll!);
      setInventoryItems(res.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      alert("Failed to fetch inventory items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenuId]);

  // Format ID as I001, I002, etc.
  const formatInventoryId = (id: number) => {
    return `I${String(id).padStart(3, "0")}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchAdjustmentHistory = async (inventoryId: number) => {
    try {
      setHistoryLoading(true);

      // Fetch additions
      const additionsUrl = `${process.env.NEXT_PUBLIC_GET_INVENTORY_ADDITION_BY_INVENTORY}/${inventoryId}`;
      const additionsRes = await axios.get(additionsUrl);
      const additions = (additionsRes.data || []).map((item: any) => ({
        ...item,
        type: 'addition',
      }));

      // Fetch subtractions
      const subtractionsUrl = `${process.env.NEXT_PUBLIC_GET_INVENTORY_SUBTRACTION_BY_INVENTORY}/${inventoryId}`;
      const subtractionsRes = await axios.get(subtractionsUrl);
      const subtractions = (subtractionsRes.data || []).map((item: any) => ({
        ...item,
        type: 'subtraction',
      }));

      // Combine and sort by date (newest first)
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

  const handlePreview = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      date: item.date,
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      vendor: item.vendor,
      phone: item.phone,
      remarks: item.remarks,
    });
    setIsPreview(true);
    setIsModalOpen(true);
    setOpenMenuId(null);

    // Fetch adjustment history for this item
    fetchAdjustmentHistory(item.id);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      date: new Date().toISOString().split('T')[0],  // Set today's date
      quantity: "",  // Reset quantity for adjustment
      price: item.price.toString(),
      vendor: item.vendor,
      phone: item.phone,
      remarks: "",  // Reset remarks for adjustment
    });
    setIsPreview(false);
    setAdjustmentType(null);  // Show adjustment options first
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async () => {
    try {
      setSaveLoading(true);

      // Handle stock adjustment (add/subtract)
      if (editingItem && adjustmentType) {
        // Validation
        if (!formData.quantity || parseInt(formData.quantity) <= 0) {
          alert("Please enter a valid quantity");
          setSaveLoading(false);
          return;
        }

        if (!formData.date) {
          alert("Please select a date");
          setSaveLoading(false);
          return;
        }

        const adjustmentPayload = {
          inventory_id: editingItem.id,
          date: formData.date,
          quantity: parseInt(formData.quantity),
          remarks: formData.remarks || "",
        };

        console.log("Adjustment Type:", adjustmentType);
        console.log("Adjustment Payload:", adjustmentPayload);

        if (adjustmentType === "add") {
          // Call addition API
          const addUrl = process.env.NEXT_PUBLIC_CREATE_INVENTORY_ADDITION;
          console.log("Addition API URL:", addUrl);

          try {
            const response = await axios.post(addUrl!, adjustmentPayload);
            console.log("Addition Response:", response.data);
            alert("Stock added successfully!");
            setIsModalOpen(false);
            resetForm();
            fetchInventory();
          } catch (err: any) {
            console.error("Addition Error:", err);
            console.error("Addition Error Response:", err.response?.data);
            throw err;
          }
        } else if (adjustmentType === "subtract") {
          // Call subtraction API
          const subtractUrl = process.env.NEXT_PUBLIC_CREATE_INVENTORY_SUBTRACTION;
          console.log("Subtraction API URL:", subtractUrl);

          try {
            const response = await axios.post(subtractUrl!, adjustmentPayload);
            console.log("Subtraction Response:", response.data);
            alert("Stock subtracted successfully!");
            setIsModalOpen(false);
            resetForm();
            fetchInventory();
          } catch (err: any) {
            console.error("Subtraction Error:", err);
            console.error("Subtraction Error Response:", err.response?.data);
            throw err;
          }
        }
        return;
      }

      // Handle regular create/update
      const payload = {
        name: formData.name,
        unit: formData.unit,
        quantity: parseInt(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        vendor: formData.vendor,
        phone: formData.phone,
        remarks: formData.remarks,
      };

      if (editingItem && !adjustmentType) {
        await axios.put(API.update(editingItem.id), payload);
        alert("Inventory item updated successfully!");
      } else {
        await axios.post(API.create!, payload);
        alert("Inventory item added successfully!");
      }

      setIsModalOpen(false);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      console.error("Error saving inventory item:", error);
      console.error("Error response:", error.response?.data);
      alert(`Failed to save inventory item: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setOpenMenuId(null);
    try {
      await axios.delete(API.delete(id));
      alert("Item deleted successfully!");
      fetchInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      unit: "",
      date: "",
      quantity: "",
      price: "",
      vendor: "",
      phone: "",
      remarks: "",
    });
    setEditingItem(null);
    setIsPreview(false);
    setAdjustmentType(null);
    setAdjustmentHistory([]);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-gray-500 text-l font-regular">
            Manage your inventory items and track stock levels
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#6B98FF] text-white px-4 py-2 rounded-[10px] hover:bg-blue-700"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4 mb-8 min-h-[50vh]">
        {loading ? (
          <Loader loading={true} message="Loading Inventory..." />
        ) : inventoryItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              className="w-12 h-12 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-black mb-2 font-medium">No items found</p>
            <p className="text-gray-500 mb-2 font-medium">
              Get started by adding your first item. Click the Add Item button to begin managing inventory items.
            </p>
          </div>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-[#E5E7EB]">
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">SN</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">ITEM NAME</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">QUANTITY</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">UNIT</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm">{index + 1}</td>
                  <td className="px-4 py-4 text-sm">{formatInventoryId(item.id)}</td>
                  <td className="px-4 py-4 text-sm">{item.name}</td>
                  <td className="px-4 py-4 text-sm">{item.quantity}</td>
                  <td className="px-4 py-4 text-sm">{item.unit}</td>
                  <td className="px-4 py-4 text-sm relative">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === item.id ? null : item.id
                              );
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>

                          {openMenuId === item.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                            >
                              <button
                                onClick={() => handlePreview(item)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                Preview
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Adjust
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Side Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-white/50"
            onClick={handleCancel}
          ></div>

          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white shadow-lg p-8 rounded-[25px] overflow-y-auto mx-4">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={handleCancel}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              {editingItem && !isPreview ? (
                <h2 className="text-2xl font-semibold text-gray-900">
                  Adjust Stock - {editingItem.name}
                </h2>
              ) : (
                <div className="flex items-center gap-3">
                  <Package size={24} className="text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isPreview ? "Item Details" : "Add New Item"}
                  </h2>
                </div>
              )}
            </div>

            {/* ID and Current Quantity for Adjust Stock */}
            {editingItem && !isPreview && (
              <div className="mb-6 flex items-center justify-start gap-20 text-sm text-gray-500">
                <span>ID: {formatInventoryId(editingItem.id)}</span>
                <span>Current Quantity: {editingItem.quantity} {editingItem.unit}</span>
              </div>
            )}

            {/* Modal Body */}
            <div>
              {editingItem && !isPreview && adjustmentType === null ? (
                /* Adjustment Type Selection */
                <div className="space-y-6 py-4">
                  <div className="text-center">
                    <p className="text-gray-600 text-base mb-6">Choose adjustment type:</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
                    <button
                      onClick={() => setAdjustmentType("add")}
                      className="px-8 py-6 border-2 border-green-500 bg-white text-green-600 rounded-xl hover:bg-green-50 transition-colors flex flex-col items-center gap-2"
                    >
                      <span className="text-2xl font-light">+</span>
                      <span className="font-medium text-base">Add Stock</span>
                    </button>
                    <button
                      onClick={() => setAdjustmentType("subtract")}
                      className="px-8 py-6 border-2 border-red-500 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-colors flex flex-col items-center gap-2"
                    >
                      <span className="text-2xl font-light">−</span>
                      <span className="font-medium text-base">Subtract Stock</span>
                    </button>
                  </div>
                </div>
              ) : adjustmentType !== null && editingItem && !isPreview ? (
                /* Adjustment Form */
                <div className="space-y-6">
                  {/* Badge */}
                  <div>
                    {adjustmentType === "add" ? (
                      <span className="inline-block px-5 py-2 border-2 border-green-500 text-green-600 rounded-full text-sm font-medium">
                        Adding Stock
                      </span>
                    ) : (
                      <span className="inline-block px-5 py-2 border-2 border-red-500 text-red-600 rounded-full text-sm font-medium">
                        Subtracting Stock
                      </span>
                    )}
                  </div>

                  <form className="space-y-5">
                    {/* Date and Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <NepaliDatePicker
                          value={formData.date}
                          onChange={(value) => handleInputChange({ target: { name: 'date', value } } as any)}
                          placeholder="Select Date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="50"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remarks
                      </label>
                      <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        placeholder="Additional notes..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setAdjustmentType(null)}
                        className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saveLoading}
                        className="px-8 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saveLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : isPreview && editingItem ? (
                /* Preview Mode - Item Details with History */
                <div className="space-y-6">
                  {/* Item Details Card */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText size={20} className="text-blue-500" />
                      <h3 className="text-lg font-semibold">Item Details</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Item ID</p>
                        <p className="text-base font-medium">{formatInventoryId(editingItem.id)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Item Name</p>
                        <p className="text-base font-medium">{editingItem.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Current Stock</p>
                        <p className="text-base font-medium">{editingItem.quantity} {editingItem.unit}</p>
                      </div>
                    </div>
                  </div>

                  {/* Adjustment History Section */}
                  <div>
                    <h3 className="text-xl font-bold mb-4">Adjustment History</h3>

                    {historyLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader loading={true} message="Loading history..." />
                      </div>
                    ) : adjustmentHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No adjustment history found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {adjustmentHistory.map((adjustment, index) => (
                          <div
                            key={index}
                            className={`border-2 rounded-lg p-4 ${
                              adjustment.type === 'addition'
                                ? 'border-green-500'
                                : 'border-red-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {adjustment.type === 'addition' ? (
                                  <>
                                    <TrendingUp size={18} className="text-green-600" />
                                    <span className="inline-block px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                                      Added
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown size={18} className="text-red-600" />
                                    <span className="inline-block px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
                                      Subtracted
                                    </span>
                                  </>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(adjustment.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-500">Quantity</p>
                                <p className="text-base font-medium">{adjustment.quantity} {editingItem.unit}</p>
                              </div>
                              {adjustment.type === 'addition' && adjustment.price && (
                                <div>
                                  <p className="text-sm text-gray-500">Price</p>
                                  <p className="text-base font-medium">{adjustment.price}</p>
                                </div>
                              )}
                              {adjustment.type === 'addition' && adjustment.phone && (
                                <div>
                                  <p className="text-sm text-gray-500">Phone</p>
                                  <p className="text-base font-medium">{adjustment.phone}</p>
                                </div>
                              )}
                              {adjustment.type === 'addition' && adjustment.vendor && (
                                <div>
                                  <p className="text-sm text-gray-500">Vendor</p>
                                  <p className="text-base font-medium">{adjustment.vendor}</p>
                                </div>
                              )}
                            </div>

                            {adjustment.remarks && (
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Remarks</p>
                                <p className="text-base">{adjustment.remarks}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
              <form className="space-y-5">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter item name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select unit</option>
                    <option value="kg">kilogram (kg)</option>
                    <option value="m">meters (m)</option>
                  </select>
                </div>

                {/* Date and Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <NepaliDatePicker
                      value={formData.date}
                      onChange={(value) => handleInputChange({ target: { name: 'date', value } } as any)}
                      placeholder="Select Date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="200"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Vendor and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor
                    </label>
                    <input
                      type="text"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleInputChange}
                      placeholder="Vendor name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Contact number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Additional notes..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
              </form>
              )}
            </div>

            {/* Modal Footer */}
            {editingItem && !isPreview ? null : (
            <div className="mt-6 border-t border-gray-200 pt-6">
              {isPreview ? (
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Close
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={saveLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saveLoading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saveLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save Item"
                    )}
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
