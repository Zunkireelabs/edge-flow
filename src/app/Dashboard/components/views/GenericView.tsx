"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  Phone,
  FileText,
  Eye,
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import { useToast } from "@/app/Components/ToastContext";

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
      showToast("error", "Failed to fetch vendors.");
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
    } catch (err) {
      console.error("Save error:", err);
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
    } catch (err) {
      console.error("Delete error:", err);
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
    <div className="p-8 bg-white min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Vendors</h2>
          <p className="text-gray-500 text-sm">Manage all vendors</p>
        </div>
        <button
          className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-semibold shadow-md hover:bg-[#0E538B] hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
            setEditingVendor(null);
            setIsPreview(false);
          }}
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Loader loading={true} message="Loading Vendors..." />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-900 mb-2 font-medium">No vendors found</p>
            <p className="text-gray-500 text-sm">
              Add your first vendor to get started.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500 w-16">S.N.</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">VAT/PAN</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Address</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Phone</th>
                <th className="px-4 py-3 text-right text-sm font-normal text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((vendor, index) => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">V{String(vendor.id).padStart(3, '0')}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-normal text-[#2272B4] hover:underline cursor-pointer">{vendor.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{vendor.vat_pan || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{vendor.address || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{vendor.phone || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-right">
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
          <div className="ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeDrawer}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={20} className="text-blue-600" />
                {isPreview
                  ? "Vendor Details"
                  : editingVendor
                  ? "Edit Vendor"
                  : "Add New Vendor"}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Vendor Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
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

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
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
