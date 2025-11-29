/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Trash2, Edit2, Users, Mail, KeyRound, MoreVertical } from "lucide-react";
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
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

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
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Supervisor
        </button>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Supervisors</h3>

        {loading ? (
          <Loader loading={true} message="Loading Supervisors..." />
        ) : supervisors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No Supervisor Found</p>
            <p className="text-gray-500 mb-2 font-medium">
              Get started by creating your first Supervisor. Click the Add Supervisor button to begin.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {supervisors.map((sup) => (
                <tr key={sup.id}>
                  <td className="p-2">{sup.id}</td>
                  <td className="p-2">{sup.name}</td>
                  <td className="p-2">{sup.email}</td>
                  <td className="p-2 relative">
                    <button
                      className="p-2 rounded hover:bg-gray-200"
                      onClick={() => setMenuOpenId(menuOpenId === sup.id ? null : sup.id)}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {menuOpenId === sup.id && (
                      <div className="absolute right-0 mt-2 w-36 bg-white border rounded shadow-md z-10">

                        <button
                          onClick={() => { handleEdit(sup); setMenuOpenId(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100"
                        >
                          <Edit2 size={16} /> Edit
                        </button>
                        <button
                          onClick={() => { handleDelete(sup.id); setMenuOpenId(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-red-100 text-red-600"
                        >
                          <Trash2 size={16} /> Delete
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
            <h3 className="text-lg font-semibold mb-3">
              {editingId ? "Edit Supervisor" : "Add New Supervisor"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-2 font-semibold">
                  <Users size={16} /> Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 font-semibold">
                  <Mail size={16} /> Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 font-semibold">
                  <KeyRound size={16} /> Password {editingId && "(Leave blank to keep current password)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
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
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
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
