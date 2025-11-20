"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  MoreVertical,
  Building2,
  MapPin,
  Phone,
  FileText,
  Eye,
  CircleUser,
  NotebookTabs,
} from "lucide-react";
import Loader from "@/app/Components/Loader";

type Vendor = {
  id: number;
  name: string;
  vat_pan?: string;
  address?: string;
  phone?: string;
  comment?: string;
};

const VendorView = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    vat_pan: "",
    address: "",
    phone: "",
    comment: "",
  });

  const API = process.env.NEXT_PUBLIC_API_VENDOR;
  if (!API) throw new Error("NEXT_PUBLIC_API_VENDOR not defined");

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
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
      alert("Failed to fetch vendors.");
    } finally {
      setLoading(false);
    }
  }, [API]);

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
        alert("Vendor name is required");
        return;
      }

      if (editingVendor) {
        await axios.put(`${API}/${editingVendor.id}`, formData);
        alert("Vendor updated successfully!");
      } else {
        await axios.post(API, formData);
        alert("Vendor created successfully!");
      }

      setIsDrawerOpen(false);
      setEditingVendor(null);
      setIsPreview(false);
      resetForm();
      await fetchVendors();
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving vendor.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete Vendor
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      await fetchVendors();
      alert("Vendor deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete vendor.");
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
    setOpenMenuId(null);
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
    setOpenMenuId(null);
    setIsPreview(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingVendor(null);
    setIsPreview(false);
    setOpenMenuId(null);
    resetForm();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Vendors</h2>
          <p className="text-gray-500 text-l">Manage all vendors</p>
        </div>
        <button
          className="flex items-center gap-2 bg-[#6B98FF] text-white px-4 py-2 rounded-[10px] hover:bg-blue-700"
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
            setEditingVendor(null);
            setIsPreview(false);
            setOpenMenuId(null);
          }}
        >
          <Plus size={18} /> Add Vendor
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border-gray-200 p-6 flex flex-col gap-4 mb-8">
        {loading ? (
          <Loader loading={true} message="Loading Vendors..." />
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No vendors found</p>
            <p className="text-gray-500 mb-2 font-medium">
              Add your first vendor to get started.
            </p>
          </div>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">S.N.</th>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">VAT/PAN</th>
                <th className="p-2 text-left">Address</th>
                <th className="p-2 text-left">Phone</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor, index) => (
                <tr key={vendor.id} className="border-b border-gray-200">
                  <td className="p-2 bg-gray-50">{index + 1}</td>
                  <td className="p-2 bg-gray-50">VE{vendor.id}</td>
                  <td className="p-2 bg-gray-50">{vendor.name}</td>
                  <td className="p-2 bg-gray-50">{vendor.vat_pan || "-"}</td>
                  <td className="p-2 bg-gray-50">{vendor.address || "-"}</td>
                  <td className="p-2 bg-gray-50">{vendor.phone || "-"}</td>
                  <td className="p-2 flex justify-center relative">
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={() =>
                        setOpenMenuId(openMenuId === vendor.id ? null : vendor.id)
                      }
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openMenuId === vendor.id && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded shadow-lg z-50">
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => handlePreview(vendor)}
                        >
                          <Eye size={14} /> Preview
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => handleEdit(vendor)}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 flex items-center gap-2"
                          onClick={() => handleDelete(vendor.id)}
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
          <div className="absolute inset-0 bg-white/50" onClick={closeDrawer} />
          <div className="ml-auto w-full max-w-md bg-white shadow-lg p-6 relative rounded-[25px]">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeDrawer}
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-semibold mb-4 flex gap-2">
              <Building2 size={20} className="text-black" />
              {isPreview
                ? "Vendor Preview"
                : editingVendor
                ? "Edit Vendor"
                : "Add New Vendor"}
            </h3>

            <div className="space-y-4">
              {/* Vendor Name */}
              <div className="flex items-center gap-2">
                <CircleUser size={20} className="text-black" />
                <p className="text-black font-semibold">Name *</p>
              </div>
              <input
                type="text"
                name="name"
                placeholder="Vendor Name"
                value={formData.name}
                onChange={handleChange}
                readOnly={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
                required
              />

              {/* VAT/PAN */}
              <div className="flex items-center gap-2">
                <NotebookTabs size={20} className="text-black" />
                <p className="text-black font-semibold">VAT/PAN</p>
              </div>
              <input
                type="text"
                name="vat_pan"
                placeholder="VAT/PAN"
                value={formData.vat_pan}
                onChange={handleChange}
                readOnly={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
              />

              {/* Address */}
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-black" />
                <p className="text-black font-semibold">Address</p>
              </div>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                readOnly={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
              />

              {/* Phone */}
              <div className="flex items-center gap-2">
                <Phone size={20} className="text-black" />
                <p className="text-black font-semibold">Phone</p>
              </div>
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                readOnly={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
              />

              {/* Comment */}
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-black" />
                <p className="text-black font-semibold">Comment</p>
              </div>
              <textarea
                name="comment"
                placeholder="Optional comments"
                value={formData.comment}
                onChange={handleChange}
                readOnly={isPreview}
                className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
              />
            </div>

            <div className="flex justify-around gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-[10px] border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={closeDrawer}
                disabled={saveLoading}
              >
                {isPreview ? "Close" : "Cancel"}
              </button>
              {!isPreview && (
                <button
                  className="px-4 py-2 rounded-[10px] bg-blue-500 text-white hover:bg-blue-700 disabled:opacity-50"
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
