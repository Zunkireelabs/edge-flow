/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  X,
  Trash2,
  Edit2,
  Eye,
  Users,
  User,
  MessageSquare,
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import NepaliDatePicker from "@/app/Components/NepaliDatePicker";
import { useToast } from "@/app/Components/ToastContext";

interface WorkerAssignment {
  id: string | number;
  date: string;
  name?: string; // Add name for display
}

interface Department {
  id: number | string;
  name: string;
  supervisor: {
    id: number;
    name: string;
    email: string;
  } | string; // Handle both object and string formats
  workers: WorkerAssignment[];
  dept_workers?: any[]; // Backend might return this
  remarks?: string;
}

// Added interface for supervisor
interface Supervisor {
  id: string | number;
  name: string;
  email: string;
}

// Updated interface for workers
interface Worker {
  id: string | number;
  name: string;
}

const CREATE_DEPARTMENTS = process.env.NEXT_PUBLIC_CREATE_DEPARTMENTS;
const GET_DEPARTMENTS = process.env.NEXT_PUBLIC_GET_DEPARTMENTS;
const UPDATE_DEPARTMENTS = process.env.NEXT_PUBLIC_UPDATE_DEPARTMENTS;
const DELETE_DEPARTMENTS = process.env.NEXT_PUBLIC_DELETE_DEPARTMENTS;
const GET_WORKERS = process.env.NEXT_PUBLIC_GET_WORKERS;
const GET_SUPERVISOR = process.env.NEXT_PUBLIC_GET_SUPERVISOR;

const DepartmentForm = () => {
  const { showToast, showConfirm } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    supervisor: "",
    workers: [] as WorkerAssignment[],
    remarks: "",
  });

  const [, setWorkerInput] = useState("");
  const [, setWorkerDate] = useState("");

  // Helper function to get supervisor name
  const getSupervisorName = (supervisor: Department['supervisor']) => {
    if (typeof supervisor === 'string') {
      return supervisor;
    }
    return supervisor?.name || 'Unknown';
  };

  // Helper function to get supervisor ID
  const getSupervisorId = (supervisor: Department['supervisor']) => {
    if (typeof supervisor === 'string') {
      // Try to find supervisor by name
      const found = supervisors.find(s => s.name === supervisor);
      return found?.id?.toString() || '';
    }
    return supervisor?.id?.toString() || '';
  };

  // Helper function to process workers data
  const processWorkersData = (dept: any) => {
    // Check if dept_workers exists and has data
    if (dept.dept_workers && dept.dept_workers.length > 0) {
      return dept.dept_workers.map((dw: any) => ({
        id: dw.worker?.id || dw.workerId || '',
        name: dw.worker?.name || 'Unknown',
        date: dw.assigned_date ? new Date(dw.assigned_date).toISOString().split('T')[0] : ''
      }));
    }
    // Fallback to workers array
    return dept.workers || [];
  };

  // Reset form
  const resetFormData = () => {
    setFormData({
      id: "",
      name: "",
      supervisor: "",
      workers: [],
      remarks: "",
    });
    setWorkerInput("");
    setWorkerDate("");
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch(GET_DEPARTMENTS!);
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();

      // Process the data to normalize the structure
      const normalizedData = data.map((dept: any) => ({
        ...dept,
        workers: processWorkersData(dept)
      }));

      setDepartments(normalizedData);
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("error", "Failed to fetch departments.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch supervisors from the correct API
  const fetchSupervisors = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token used to fetch supervisors:", token);

      const res = await fetch(GET_SUPERVISOR!, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch supervisors");

      const data = await res.json();
      console.log("Supervisors API response:", data);

      // Normalize supervisors into an array
      const supervisorsArray = Array.isArray(data)
        ? data
        : data?.data || data?.supervisors || [];

      setSupervisors(supervisorsArray);
    } catch (err) {
      console.error("Fetch supervisors error:", err);
      showToast("error", "Failed to fetch supervisors.");
    }
  };

  // Fetch workers for worker assignments
  const fetchWorkers = async () => {
    try {
      const res = await fetch(GET_WORKERS!);
      if (!res.ok) throw new Error("Failed to fetch workers");
      const data: Worker[] = await res.json();
      setWorkers(data);
      console.log(data)
    } catch (err) {
      console.error("Fetch workers error:", err);
      showToast("error", "Failed to fetch workers.");
    }
  };
  useEffect(() => {
    fetchDepartments();
    fetchSupervisors();
    fetchWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save
  const handleSave = async () => {
    try {
      setSaveLoading(true);

      if (!formData.name.trim()) {
        showToast("warning", "Department name is required");
        return;
      }
      if (!formData.supervisor.trim()) {
        showToast("warning", "Supervisor is required");
        return;
      }

      // Fixed payload for Prisma
      const payload = {
        name: formData.name.trim(),
        remarks: formData.remarks.trim(),
        supervisorId: Number(formData.supervisor), 
        workers: formData.workers?.map((w) => ({
          id: Number(w.id),
          assignedDate: w.date ? new Date(w.date).toISOString() : undefined,
        })) || [],
      };

      console.log("Payload sent to backend:", payload);

      let response;
      if (editingDept) {
        response = await fetch(`${UPDATE_DEPARTMENTS}/${editingDept.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(CREATE_DEPARTMENTS!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error("Failed to save department");

      await fetchDepartments();
      showToast("success", `Department ${editingDept ? "updated" : "created"} successfully`);
    } catch (err) {
      console.error("Save error:", err);
      showToast("error", "Error saving department.");
    } finally {
      setSaveLoading(false);
      resetFormData();
      setEditingDept(null);
      setIsDrawerOpen(false);
      setIsPreview(false);
    }
  };

  // Edit
  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      id: dept.id.toString(),
      name: dept.name,
      supervisor: getSupervisorId(dept.supervisor),
      workers: dept.workers,
      remarks: dept.remarks || "",
    });
    setIsPreview(false);
    setIsDrawerOpen(true);
  };

  // Preview
  const handlePreview = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      id: dept.id.toString(),
      name: dept.name,
      supervisor: getSupervisorId(dept.supervisor),
      workers: dept.workers,
      remarks: dept.remarks || "",
    });
    setIsPreview(true);
    setIsDrawerOpen(true);
  };

  // Delete
  const handleDelete = async (id: number | string) => {
    const confirmed = await showConfirm({
      title: "Delete Department",
      message: "Are you sure you want to delete this department? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`${DELETE_DEPARTMENTS}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete department");
      await fetchDepartments();
      showToast("success", "Department deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("error", "Failed to delete department");
    }
  };

  // Close drawer
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingDept(null);
    setIsPreview(false);
    resetFormData();
  };

  return (
    <div className="p-8 bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Department Management</h2>
          <p className="text-gray-500 text-sm">Manage departments, supervisors, and workers</p>
        </div>
        <button
          className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-semibold shadow-md hover:bg-[#0E538B] hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            resetFormData();
            setIsDrawerOpen(true);
            setIsPreview(false);
          }}
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* Table - Databricks style */}
      <div className="bg-white overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Loader loading={true} message="Loading Departments..." />
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-900 mb-2 font-medium">No Departments found</p>
            <p className="text-gray-500 text-sm">
              Get started by creating your first department.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500 w-16">S.N.</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Department Name</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Supervisor</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Workers</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-gray-500">Remarks</th>
                <th className="px-4 py-3 text-right text-sm font-normal text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {departments.map((dept, index) => (
                <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">D{String(dept.id).padStart(3, '0')}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-normal text-[#2272B4] hover:underline cursor-pointer">{dept.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getSupervisorName(dept.supervisor)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{dept.workers?.length || 0} workers</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{dept.remarks || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handlePreview(dept)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(dept)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
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
                <Users size={20} className="text-blue-600" />
                {isPreview
                  ? "Department Details"
                  : editingDept
                    ? "Edit Department"
                    : "Add New Department"}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Department Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter department name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  readOnly={isPreview}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Supervisor */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Supervisor <span className="text-red-500">*</span>
                </label>
                <select
                  name="supervisor"
                  value={formData.supervisor}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, supervisor: e.target.value }))
                  }
                  disabled={isPreview}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Workers */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Assign Workers
                </label>

                {!isPreview && (
                  <div className="space-y-2">
                    {formData.workers.map((w, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={w.id}
                          onChange={(e) => {
                            const newWorkers = [...formData.workers];
                            const workerId = Number(e.target.value);
                            const workerName = workers.find(worker => worker.id == workerId)?.name || '';
                            newWorkers[index] = { ...newWorkers[index], id: workerId, name: workerName };
                            setFormData((p) => ({ ...p, workers: newWorkers }));
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                        >
                          <option value="">Select Worker</option>
                          {workers.map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name}
                            </option>
                          ))}
                        </select>

                        <NepaliDatePicker
                          value={w.date}
                          onChange={(value) => {
                            const newWorkers = [...formData.workers];
                            newWorkers[index].date = value;
                            setFormData((p) => ({ ...p, workers: newWorkers }));
                          }}
                          className="rounded-lg"
                          placeholder="Select Date"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const newWorkers = [...formData.workers];
                            newWorkers.splice(index, 1);
                            setFormData((p) => ({ ...p, workers: newWorkers }));
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          -
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          workers: [...p.workers, { id: "", date: "", name: "" }],
                        }))
                      }
                      className="px-4 py-2 bg-[#2272B4] text-white rounded hover:bg-[#0E538B] transition-colors text-sm font-medium"
                    >
                      + Add Worker
                    </button>
                  </div>
                )}

                {/* Preview Mode */}
                {isPreview && (
                  <ul className="space-y-2 mt-2">
                    {formData.workers.length > 0 ? (
                      formData.workers.map((w, index) => {
                        const workerName = w.name || workers.find((worker) => worker.id == w.id)?.name || "Unknown";
                        return (
                          <li key={index} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <span className="text-sm text-gray-900">{workerName}</span>
                            <span className="text-xs text-gray-500">{w.date}</span>
                          </li>
                        );
                      })
                    ) : (
                      <li className="text-sm text-gray-500">No workers assigned</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  placeholder="Add remarks (optional)"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, remarks: e.target.value }))
                  }
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
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? "Saving..." : "Save Department"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentForm;