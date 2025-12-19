/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Layers,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Building2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import { useToast } from "@/app/Components/ToastContext";
import { useDepartment } from "../../contexts/DepartmentContext";

const API = process.env.NEXT_PUBLIC_API_URL;

interface SubBatch {
  id: number;
  name: string;
  estimated_pieces: number;
  expected_items: string;
  start_date: string;
  due_date: string;
  produced_quantity: number;
  roll_id?: number | null;
  batch_id?: number | null;
  department_id?: number | null;
  status?: "DRAFT" | "IN_PRODUCTION" | "COMPLETED" | "CANCELLED";
  batch?: {
    id: number;
    name: string;
    color?: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

interface Department {
  id: number;
  name: string;
}

const SubBatchView = () => {
  const { showToast, showConfirm } = useToast();
  const { selectedDepartmentId, isSuperSupervisor, departments } = useDepartment();

  const [subBatches, setSubBatches] = useState<SubBatch[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<number | null>(null);

  // Modal state for send to production
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedSubBatch, setSelectedSubBatch] = useState<SubBatch | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch departments for send-to-production dropdown
  const fetchDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  // Fetch sub-batches based on department selection
  const fetchSubBatches = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const storedDepartmentId = localStorage.getItem("departmentId");

      // Determine target department(s)
      const targetDeptId = isSuperSupervisor
        ? (typeof selectedDepartmentId === "number" ? selectedDepartmentId : null)
        : storedDepartmentId ? parseInt(storedDepartmentId) : null;

      // For SUPER_SUPERVISOR with "all" - fetch all sub-batches
      if (isSuperSupervisor && selectedDepartmentId === "all") {
        const response = await axios.get(`${API}/sub-batches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubBatches(response.data || []);
      } else if (targetDeptId) {
        // Fetch sub-batches for specific department via department_sub_batches
        const response = await axios.get(
          `${API}/departments/${targetDeptId}/sub-batches`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Extract sub-batches from kanban data structure
        const kanbanData = response.data.data;
        const allSubBatches: SubBatch[] = [];

        // Combine all stages
        ["newArrival", "inProgress", "completed"].forEach(stage => {
          if (kanbanData[stage]) {
            kanbanData[stage].forEach((item: any) => {
              if (item.sub_batch) {
                allSubBatches.push({
                  ...item.sub_batch,
                  status: stage === "completed" ? "COMPLETED" :
                          stage === "inProgress" ? "IN_PRODUCTION" : "DRAFT"
                });
              }
            });
          }
        });

        // Remove duplicates by id
        const uniqueSubBatches = allSubBatches.filter(
          (sb, index, self) => index === self.findIndex((t) => t.id === sb.id)
        );

        setSubBatches(uniqueSubBatches);
      }
    } catch (error) {
      console.error("Error fetching sub-batches:", error);
      showToast("error", "Failed to fetch sub-batches");
    } finally {
      setLoading(false);
    }
  }, [isSuperSupervisor, selectedDepartmentId, showToast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchSubBatches();
  }, [fetchSubBatches]);

  // Sorted sub-batches
  const sortedSubBatches = useMemo(() => {
    const sorted = [...subBatches].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortColumn) {
        case "id":
          aVal = a.id;
          bVal = b.id;
          break;
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "estimated_pieces":
          aVal = a.estimated_pieces;
          bVal = b.estimated_pieces;
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [subBatches, sortColumn, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // Open send to production modal
  const handleOpenSendModal = (subBatch: SubBatch) => {
    setSelectedSubBatch(subBatch);
    setSelectedDepartment("");
    setShowSendModal(true);
  };

  // Send sub-batch to production
  const handleSendToProduction = async () => {
    if (!selectedSubBatch || !selectedDepartment) {
      showToast("warning", "Please select a department");
      return;
    }

    const confirmed = await showConfirm({
      title: "Send to Production",
      message: `Are you sure you want to send "${selectedSubBatch.name}" to production in the selected department?`,
      confirmText: "Send",
      cancelText: "Cancel",
      type: "info",
    });

    if (!confirmed) return;

    try {
      setSendingId(selectedSubBatch.id);
      const token = localStorage.getItem("token");

      await axios.post(
        `${API}/sub-batches/send-to-production`,
        {
          subBatchId: selectedSubBatch.id,
          departmentId: parseInt(selectedDepartment),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showToast("success", `"${selectedSubBatch.name}" sent to production successfully!`);
      setShowSendModal(false);
      setSelectedSubBatch(null);
      fetchSubBatches();
    } catch (error: any) {
      console.error("Error sending to production:", error);
      showToast(
        "error",
        error.response?.data?.message || "Failed to send to production"
      );
    } finally {
      setSendingId(null);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "IN_PRODUCTION":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            <Clock className="w-3 h-3" />
            In Production
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            <AlertCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            <Package className="w-3 h-3" />
            Draft
          </span>
        );
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get department label for display
  const getDepartmentLabel = () => {
    if (isSuperSupervisor) {
      if (selectedDepartmentId === "all") {
        return "all departments";
      }
      const dept = departments.find((d) => d.id === selectedDepartmentId);
      return dept?.name || "selected department";
    }
    return "your department";
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="flex items-center justify-center py-12">
          <Loader loading={true} message="Loading sub-batches..." />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Layers className="text-blue-600" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sub-Batches</h1>
            <p className="text-sm text-gray-500">
              View and manage sub-batches in {getDepartmentLabel()}
            </p>
          </div>
        </div>
        <button
          onClick={fetchSubBatches}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* All Departments Banner for SUPER_SUPERVISOR */}
      {isSuperSupervisor && selectedDepartmentId === "all" && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-purple-900">
              Viewing All Departments
            </p>
            <p className="text-xs text-purple-700">
              Showing {subBatches.length} sub-batches across{" "}
              {departments.length} departments
            </p>
          </div>
        </div>
      )}

      {/* Sub-Batches Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {subBatches.length === 0 ? (
          <div className="p-12 text-center">
            <Layers size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No sub-batches found</p>
            <p className="text-sm text-gray-400 mt-2">
              Sub-batches will appear here when created by admin
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-1">
                      ID {getSortIcon("id")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name {getSortIcon("name")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Batch
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("estimated_pieces")}
                  >
                    <div className="flex items-center gap-1">
                      Pieces {getSortIcon("estimated_pieces")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status {getSortIcon("status")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedSubBatches.map((subBatch) => (
                  <tr key={subBatch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      SB{String(subBatch.id).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subBatch.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {subBatch.batch?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {subBatch.estimated_pieces?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(subBatch.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(subBatch.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subBatch.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenSendModal(subBatch)}
                          disabled={
                            subBatch.status === "COMPLETED" ||
                            subBatch.status === "IN_PRODUCTION"
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            subBatch.status === "COMPLETED" ||
                            subBatch.status === "IN_PRODUCTION"
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                          title={
                            subBatch.status === "IN_PRODUCTION"
                              ? "Already in production"
                              : subBatch.status === "COMPLETED"
                              ? "Already completed"
                              : "Send to production"
                          }
                        >
                          <Send size={14} />
                          Send to Dept
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send to Production Modal */}
      {showSendModal && selectedSubBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowSendModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send to Production
            </h3>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Sub-Batch:</span>{" "}
                {selectedSubBatch.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Pieces:</span>{" "}
                {selectedSubBatch.estimated_pieces?.toLocaleString()}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a department...</option>
                {allDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToProduction}
                disabled={!selectedDepartment || sendingId === selectedSubBatch.id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {sendingId === selectedSubBatch.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to Production
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubBatchView;
