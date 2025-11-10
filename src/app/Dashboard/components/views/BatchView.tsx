"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, X, Edit2, Trash2, MoreVertical, BrickWall, Package, Palette, Scale, Shell, Truck, Eye } from "lucide-react";
import Loader from "@/app/Components/Loader";

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

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingBatch(null);
    setOpenMenuId(null);
    setIsPreview(false);
    resetFormData();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Batch View</h2>
          <p className="text-gray-500 text-l font-regular">
            Manage production batches and track progress
          </p>
        </div>
        <button
          className="flex items-center gap-2 bg-[#6B98FF] text-white px-4 py-2 rounded-[10px] hover:bg-blue-700"
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4 mb-8">
        {loading ? (
         <Loader loading={true} message="Loading Batches..." />
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No batches found</p>
            <p className="text-gray-500 mb-2 font-medium">
              Get started by creating your first batch. Click the Add Batch button to begin tracking your production.
            </p>
          </div>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-[#E5E7EB]">
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">SN</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">BATCH</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">QUANTITY</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">UNIT</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">COLOR</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">ROLL</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">VENDOR</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.map((batch, index) => (
                <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm ">{index + 1}</td>
                  <td className="px-4 py-4 text-sm ">BA00{batch.id}</td>
                  <td className="px-4 py-4 text-sm ">{batch.name}</td>
                  <td className="px-4 py-4 text-sm ">{batch.quantity}</td>
                  <td className="px-4 py-4 text-sm ">{batch.unit}</td>
                  <td className="px-4 py-4 text-sm ">{batch.color}</td>
                  <td className="px-4 py-4 text-sm ">{batch.roll?.name || "-"}</td>
                  <td className="px-4 py-4 text-sm ">{batch.vendor?.name || "-"}</td>
                  <td className="px-4 py-4 text-sm relative">
                    {/* 3-dot menu */}
                    <button
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      onClick={() => setOpenMenuId(openMenuId === batch.id ? null : batch.id)}
                    >
                      <MoreVertical size={18} className="" />
                    </button>
                    {openMenuId === batch.id && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded shadow-lg z-50 border border-gray-200">
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                          onClick={() => { handlePreview(batch); setOpenMenuId(null); }}
                        >
                          <Eye size={14} /> Preview
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                          onClick={() => { handleEdit(batch); setOpenMenuId(null); }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 flex items-center gap-2 text-sm"
                          onClick={() => { handleDelete(batch.id); setOpenMenuId(null); }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-white/50"
            onClick={closeDrawer}
          />

          <div className="ml-auto w-full max-w-md bg-white shadow-lg p-6 relative rounded-[25px]">
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
                <h3 className="text-lg font-semibold mb-4 flex gap-2">
                  <Shell size={20} className="text-black" />
                  {editingBatch ? "Edit Batch" : "Add New Batch"}
                </h3>

                <div className="space-y-4">
              {/* Batch Name */}
              <div className="flex items-center gap-2">
                <Package size={20} className="text-black" />
                <p className="text-black font-semibold">Batch Name *</p>
              </div>
              <input
                type="text"
                name="name"
                placeholder="Batch Name"
                value={formData.name}
                onChange={handleChange}
                readOnly={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />

              {/* Roll - Moved up for better auto-fill UX */}
              <div className="flex items-center gap-2">
                <Package size={20} className="text-black" />
                <p className="text-black font-semibold">Roll</p>
              </div>
              <select
                name="roll_id"
                value={formData.roll_id ?? ""}
                onChange={handleChange}
                disabled={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Roll</option>
                {rolls.map((roll) => (
                  <option key={roll.id} value={roll.id}>
                    {roll.name}
                  </option>
                ))}
              </select>

              {/* Quantity + Unit */}
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <BrickWall size={20} className="text-black" />
                    <p className="text-black font-semibold">Quantity *</p>
                  </div>
                  <input
                    type="string"
                    name="quantity"
                    placeholder="Quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    readOnly={isPreview}
                    min="0"
                    step="0.01"
                    className="border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <Scale size={20} className="text-black" />
                    <p className="text-black font-semibold">Unit</p>
                  </div>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    disabled={isPreview}
                    className="border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Kilogram">Kilogram</option>
                    <option value="Meter">Meter</option>
                    <option value="Piece">Piece</option>
                  </select>
                </div>
              </div>

              {/* Color - Auto-filled from Roll */}
              <div className="flex items-center gap-2">
                <Palette size={20} className="text-black" />
                <p className="text-black font-semibold">Color</p>
                {formData.roll_id && <span className="text-xs text-gray-500">(Auto-filled from Roll)</span>}
              </div>
              <input
                type="text"
                name="color"
                placeholder="Color"
                value={formData.color}
                onChange={handleChange}
                readOnly={isPreview}
                className={`w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${formData.roll_id ? 'bg-blue-50' : ''}`}
              />

              {/* Vendor */}
              <div className="flex items-center gap-2">
                <Truck size={20} className="text-black" />
                <p className="text-black font-semibold">Vendor</p>
                {formData.roll_id && <span className="text-xs text-gray-500">(Auto-filled from Roll)</span>}
              </div>
              <select
                name="vendor_id"
                value={formData.vendor_id ?? ""}
                onChange={handleChange}
                disabled={isPreview}
                className={`w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${formData.roll_id ? 'bg-blue-50' : ''}`}
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-around gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-[10px] border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={closeDrawer}
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-[10px] bg-blue-500 text-white hover:bg-blue-700 disabled:opacity-50"
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
    </div>
  );
};

export default BatchView;