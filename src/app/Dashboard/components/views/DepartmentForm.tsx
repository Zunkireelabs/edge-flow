/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  X,
  Trash2,
  Edit2,
  MoreVertical,
  Eye,
  Users,
  User,
  MessageSquare,
} from "lucide-react";
import Loader from "@/app/Components/Loader";

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);

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
      alert("Failed to fetch departments.");
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
      alert("Failed to fetch supervisors.");
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
      alert("Failed to fetch workers.");
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
        alert("Department name is required");
        return;
      }
      if (!formData.supervisor.trim()) {
        alert("Supervisor is required");
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
      alert(`Department ${editingDept ? "updated" : "created"} successfully`);
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving department.");
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
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await fetch(`${DELETE_DEPARTMENTS}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete department");
      await fetchDepartments();
      alert("Department deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete department");
    }
  };

  // Close drawer
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingDept(null);
    setOpenMenuId(null);
    setIsPreview(false);
    resetFormData();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Department Management</h2>
          <p className="text-gray-500">Manage departments, supervisors, and workers</p>
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
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border-gray-200 p-6 flex flex-col gap-4 mb-8">
        {loading ? (
          <Loader loading={true} message="Loading Departments..." />
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText size={48} className="text-gray-300 mb-4" />
            <p className="text-black mb-2 font-medium">No Departments found</p>
            <p className="text-gray-500 mb-2 font-medium">
              Get started by creating your first Department. Click the Add Department button to begin make your Department.
            </p>
          </div>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">S.N.</th>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Department Name</th>
                <th className="p-2 text-left">Supervisor</th>
                <th className="p-2 text-left">Workers Assigned</th>
                <th className="p-2 text-left">Remarks</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, index) => (
                <tr key={dept.id} className="border-b border-gray-200">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">D00{dept.id}</td>
                  <td className="p-2">{dept.name}</td>
                  <td className="p-2">{getSupervisorName(dept.supervisor)}</td>
                  <td className="p-2">{dept.workers?.length || 0} Workers</td>
                  <td className="p-2">{dept.remarks || 'N/A'}</td>
                  <td className="p-2 flex justify-center relative">
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={() =>
                        setOpenMenuId(openMenuId === dept.id ? null : dept.id)
                      }
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openMenuId === dept.id && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded shadow-lg z-50">
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenuId(null);
                            handlePreview(dept);
                          }}
                        >
                          <Eye size={14} /> Preview
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenuId(null);
                            handleEdit(dept);
                          }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-500"
                          onClick={() => {
                            setOpenMenuId(null);
                            handleDelete(dept.id);
                          }}
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
            <h3 className="text-lg font-semibold mb-4">
              {isPreview
                ? "Department Preview"
                : editingDept
                  ? "Edit Department"
                  : "Add New Department"}
            </h3>

            <div className="space-y-4">
              {/* Department Name */}
              <div>
                <label className="flex items-center gap-2 font-semibold">
                  <Users size={18} /> Department Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Department Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  readOnly={isPreview}
                  className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
                />
              </div>

              {/* Supervisor */}
              <div>
                <label className="flex items-center gap-2 font-semibold">
                  <User size={18} /> Supervisor
                </label>
                <select
                  name="supervisor"
                  value={formData.supervisor}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, supervisor: e.target.value }))
                  }
                  disabled={isPreview}
                  className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
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
                <label className="flex items-center gap-2 font-semibold">
                  <Users size={18} /> Assign Workers
                </label>

                {!isPreview && (
                  <div className="space-y-2">
                    {formData.workers.map((w, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={w.id}
                          onChange={(e) => {
                            const newWorkers = [...formData.workers];
                            // Convert the value to number and find worker name
                            const workerId = Number(e.target.value);
                            const workerName = workers.find(worker => worker.id == workerId)?.name || '';
                            newWorkers[index] = { ...newWorkers[index], id: workerId, name: workerName };
                            setFormData((p) => ({ ...p, workers: newWorkers }));
                          }}
                          className="flex-1 border border-gray-300 rounded-[10px] px-3 py-2"
                        >
                          <option value="">Select Worker</option>
                          {workers.map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="date"
                          value={w.date}
                          onChange={(e) => {
                            const newWorkers = [...formData.workers];
                            newWorkers[index].date = e.target.value;
                            setFormData((p) => ({ ...p, workers: newWorkers }));
                          }}
                          className="border border-gray-300 rounded-[10px] px-3 py-2"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const newWorkers = [...formData.workers];
                            newWorkers.splice(index, 1);
                            setFormData((p) => ({ ...p, workers: newWorkers }));
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-[10px]"
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
                      className="px-3 py-2 bg-blue-500 text-white rounded-[10px]"
                    >
                      + Add Worker
                    </button>
                  </div>
                )}

                {/* Preview Mode */}
                {isPreview && (
                  <ul className="space-y-2">
                    {formData.workers.length > 0 ? (
                      formData.workers.map((w, index) => {
                        const workerName = w.name || workers.find((worker) => worker.id == w.id)?.name || "Unknown";
                        return (
                          <li key={index} className="flex items-center justify-between border border-gray-200 rounded-lg p-2">
                            <span>{workerName} - <span className="text-gray-500">{w.date}</span></span>
                          </li>
                        );
                      })
                    ) : (
                      <li className="text-gray-500">No workers assigned</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="flex items-center gap-2 font-semibold">
                  <MessageSquare size={18} /> Remarks
                </label>
                <textarea
                  name="remarks"
                  placeholder="Add remarks"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, remarks: e.target.value }))
                  }
                  readOnly={isPreview}
                  className="w-full border border-gray-300 rounded-[10px] px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 rounded-[10px] border border-gray-300"
                onClick={closeDrawer}
                disabled={saveLoading}
              >
                {isPreview ? "Close" : "Cancel"}
              </button>
              {!isPreview && (
                <button
                  className="px-4 py-2 rounded-[10px] bg-blue-500 text-white"
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