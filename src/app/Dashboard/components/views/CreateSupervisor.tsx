/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Trash2, Edit2, Users, Mail, KeyRound } from "lucide-react";
import Loader from "@/app/Components/Loader";

// Supervisor interface
interface Supervisor {
  id: number;
  name: string;
  email: string;
}

interface SupervisorFormData {
  name: string;
  email: string;
  password: string;
}

const CREATE_SUPERVISOR = process.env.NEXT_PUBLIC_CREATE_SUPERVISOR!;
const GET_SUPERVISORS = process.env.NEXT_PUBLIC_GET_SUPERVISOR!;

const CreateSupervisor = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<SupervisorFormData>({
    name: "",
    email: "",
    password: "",
  });

  // Fetch supervisors
  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(GET_SUPERVISORS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch supervisors");
      const data = await res.json();
      const supervisorsArray = Array.isArray(data)
        ? data
        : data?.data || data?.supervisors || [];
      setSupervisors(supervisorsArray);
    } catch (err) {
      console.error(err);
      alert("Error fetching supervisors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "" });
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Admin not logged in!");
        window.location.href = "/login";
        return;
      }

      if (!editingId && (!formData.name || !formData.email || !formData.password)) {
        alert("Name, email, and password are required for new supervisor");
        return;
      }

      const payload: any = {};
      if (formData.name?.trim()) payload.name = formData.name.trim();
      if (formData.email?.trim()) payload.email = formData.email.trim();
      if (formData.password?.trim()) {
        if (editingId) {
          payload.newPassword = formData.password.trim();
        } else {
          payload.password = formData.password.trim();
        }
      }

      const url = editingId
        ? `${CREATE_SUPERVISOR}/${editingId}`
        : CREATE_SUPERVISOR;

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save supervisor");
      }

      await fetchSupervisors();
      alert(`Supervisor ${editingId ? "updated" : "created"} successfully!`);
      resetForm();
      setIsDrawerOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error saving supervisor.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this supervisor?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Admin not logged in!");
        window.location.href = "/login";
        return;
      }

      const res = await fetch(`${CREATE_SUPERVISOR}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to delete supervisor");
      }

      await fetchSupervisors();
      alert("Supervisor deleted successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error deleting supervisor.");
    }
  };

  const handleEdit = (sup: Supervisor) => {
    setFormData({
      name: sup.name,
      email: sup.email,
      password: "",
    });
    setEditingId(sup.id);
    setIsDrawerOpen(true);
  };


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Supervisor View</h2>
          <p className="text-gray-500 text-l font-regular">
            Manage Supervisor and look after it.
          </p>
        </div>

        <button
          className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-semibold shadow-md hover:bg-[#0E538B] hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Supervisor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Loader loading={true} message="Loading Supervisors..." />
          </div>
        ) : supervisors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-900 mb-2 font-medium">No Supervisor Found</p>
            <p className="text-gray-500 text-sm">
              Get started by creating your first supervisor.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {supervisors.map((sup) => (
                <tr key={sup.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm text-gray-500">S{String(sup.id).padStart(3, '0')}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">{sup.name}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{sup.email}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(sup)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(sup.id)}
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
        <div className="fixed inset-0 z-50 flex ">
          <div
            className="absolute inset-0 bg-white/30 transition-opacity duration-300"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setIsDrawerOpen(false)}
            >
              <X size={20} />
            </button>
            {/* Header */}
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                {editingId ? "Edit Supervisor" : "Add New Supervisor"}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter supervisor name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Password {editingId ? <span className="text-gray-500 font-normal">(Leave blank to keep current)</span> : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder={editingId ? "Enter new password to change" : "Enter password"}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                onClick={() => setIsDrawerOpen(false)}
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded bg-[#2272B4] text-white hover:bg-[#0E538B] disabled:opacity-50 font-medium transition-colors shadow-sm"
                onClick={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? "Saving..." : editingId ? "Update Supervisor" : "Save Supervisor"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default CreateSupervisor;
