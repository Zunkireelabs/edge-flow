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
} from "lucide-react";
import Loader from "@/app/Components/Loader";

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
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRoll, setEditingRoll] = useState<Roll | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [saveLoading, setSaveLoading] = useState(false); // Add loading state for save

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    quantity: "",
    unit: "Kilogram", // Set default value
    color: "",
    vendorId: "",
  });

  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);

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
      alert("Failed to fetch rolls. Please try again.");
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
      alert("Failed to fetch vendors.");
    }
  };

  useEffect(() => {
    fetchRolls();
    fetchVendors();
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
        alert("Roll name is required");
        return;
      }
      if (!formData.quantity || Number(formData.quantity) <= 0) {
        alert("Valid quantity is required");
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
      alert(`Roll ${editingRoll ? 'updated' : 'created'} successfully!`);

    } catch (err) {
      console.error("Save error:", err);
      alert(`Error ${editingRoll ? 'updating' : 'creating'} roll: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    if (!confirm("Are you sure you want to delete this roll?")) {
      return;
    }

    try {
      const res = await fetch(`${DELETE_ROLL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete roll");
      await fetchRolls();
      alert("Roll deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete roll. Please try again.");
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
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Roll View</h2>
          <p className="text-gray-500 text-l font-regular">
            Manage production rolls and track progress
          </p>
        </div>
        <button
          className="flex items-center gap-2 bg-[#6B98FF] text-white px-4 py-2 rounded-[10px] hover:bg-blue-700"
          onClick={() => {
            resetFormData();
            setIsDrawerOpen(true);
            setOpenMenuId(null);
            setIsPreview(false);
          }}
        >
          <Plus size={16} /> Add Roll
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4 mb-8">
        {loading ? (
          <Loader loading={true} message="Loading Rolls.." />

        ) : rolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No rolls found</p>
            <p className="text-gray-500 mb-2 font-medium">
              Get started by creating your first roll. Click the Add Roll button to begin tracking your production.
            </p>
          </div>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-[#E5E7EB]">
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">SN</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">ROLL</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">QUANTITY</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">UNIT</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">COLOR</th>
                <th className="px-4 py-3 text-left text-sm font-medium  uppercase tracking-wider">VENDOR</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rolls.map((roll, index) => (
                <tr key={roll.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-900">{index + 1}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">B00{roll.id}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{roll.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{roll.quantity}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{roll.unit}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{roll.color}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{roll.vendor?.name || "-"}</td>
                  <td className="px-4 py-4 text-sm relative">
                    {/* 3-dot button */}
                    <button
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      onClick={() =>
                        setOpenMenuId(openMenuId === roll.id ? null : roll.id)
                      }
                    >
                      <MoreVertical size={18} className="" />
                    </button>

                    {/* Dropdown menu */}
                    {openMenuId === roll.id && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded shadow-lg z-50 border border-gray-200">
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                          onClick={() => { setOpenMenuId(null); handlePreview(roll); }}
                        >
                          <Eye size={14} /> Preview
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                          onClick={() => { setOpenMenuId(null); handleEdit(roll); }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-red-500"
                          onClick={() => { setOpenMenuId(null); handleDelete(roll.id); }}
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
                <h3 className="text-lg font-semibold mb-4 flex gap-2">
                  <Shell size={20} className="text-black" />
                  {editingRoll ? "Edit Roll" : "Add New Roll"}
                </h3>

                <div className="space-y-4">
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
              <div className="flex items-center gap-2">
                <Package size={20} className="text-black" />
                <p className="text-black font-semibold ">Roll Name *</p>
              </div>
              <input
                type="text"
                name="name"
                placeholder="Roll Name"
                value={formData.name}
                onChange={handleChange}
                readOnly={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />

              {/* Quantity + Unit */}
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <BrickWall size={20} className="text-black" />
                    <p className="text-black font-semibold">Quantity *</p>
                  </div>
                  <input
                    type="number"
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
                  </select>
                </div>
              </div>

              {/* Color */}
              <div className="flex items-center gap-2">
                <Palette size={20} className="text-black" />
                <p className="text-black font-semibold ">Color</p>
              </div>
              <input
                type="text"
                name="color"
                placeholder="Color"
                value={formData.color}
                onChange={handleChange}
                readOnly={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {/* Vendor */}
              <div className="flex items-center gap-2">
                <Truck size={20} className="text-black" />
                <p className="text-black font-semibold ">Vendor</p>
              </div>
              <select
                name="vendorId"
                value={formData.vendorId}
                onChange={handleChange}
                disabled={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
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