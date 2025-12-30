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
  Trash2,
  Eye,
  Edit2,
  X,
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import { useToast } from "@/app/Components/ToastContext";
import { useDepartment } from "../../contexts/DepartmentContext";
import { formatNepaliDate } from "@/app/utils/dateUtils";

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
  total_quantity?: number;
  attachments?: Array<{
    id?: number;
    attachment_name?: string;
    name?: string;
    quantity?: number;
  }>;
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

// Workflow step for Send to Production
interface WorkflowStep {
  current: string;
  next?: string;
  departmentId?: number;
}

// Form data for edit modal
interface EditFormData {
  name: string;
  estimatedPieces: string;
  startDate: string;
  dueDate: string;
}

// Attachment type
interface Attachment {
  name: string;
  quantity: string;
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
  const [departmentWorkflow, setDepartmentWorkflow] = useState<WorkflowStep[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubBatch, setEditingSubBatch] = useState<SubBatch | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: "",
    estimatedPieces: "",
    startDate: "",
    dueDate: "",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
    } catch {
      // Error fetching departments
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
    } catch {
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
    setDepartmentWorkflow([{ current: "", departmentId: undefined }]);
    setShowSendModal(true);
  };

  // Open edit modal
  const handleEdit = (subBatch: SubBatch, preview: boolean = false) => {
    setEditingSubBatch(subBatch);

    // Map attachments from sub-batch
    const mappedAttachments = subBatch.attachments?.map((a: any) => ({
      name: a.attachment_name || a.name || "",
      quantity: a.quantity?.toString() || "",
    })) || [];

    setAttachments(mappedAttachments);

    setEditFormData({
      name: subBatch.name || "",
      estimatedPieces: subBatch.estimated_pieces?.toString() || "",
      startDate: subBatch.start_date ? subBatch.start_date.split("T")[0] : "",
      dueDate: subBatch.due_date ? subBatch.due_date.split("T")[0] : "",
    });

    setIsPreview(preview);
    setIsEditModalOpen(true);
  };

  // Add attachment row
  const handleAddAttachment = () => {
    setAttachments([...attachments, { name: "", quantity: "" }]);
  };

  // Update attachment
  const handleAttachmentChange = (index: number, field: "name" | "quantity", value: string) => {
    const newAttachments = [...attachments];
    newAttachments[index][field] = value;
    setAttachments(newAttachments);
  };

  // Delete attachment
  const handleDeleteAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Save edit (Super Supervisor can only edit attachments and dates)
  const handleSaveEdit = async () => {
    if (!editingSubBatch) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");

      // Super Supervisor can only update attachments and dates
      // Backend expects camelCase fields
      const payload: any = {
        startDate: editFormData.startDate ? `${editFormData.startDate}T00:00:00.000Z` : null,
        dueDate: editFormData.dueDate ? `${editFormData.dueDate}T00:00:00.000Z` : null,
        attachments: attachments.filter(a => a.name.trim()).map(a => ({
          attachmentName: a.name,
          quantity: parseInt(a.quantity) || 0,
        })),
      };

      await axios.put(`${API}/sub-batches/${editingSubBatch.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("success", "Sub-batch updated successfully!");
      setIsEditModalOpen(false);
      setEditingSubBatch(null);
      fetchSubBatches();
    } catch (error: any) {
      showToast("error", error.response?.data?.message || "Failed to update sub-batch");
    } finally {
      setIsSaving(false);
    }
  };

  // Send sub-batch to production with workflow
  const handleSendToProduction = async () => {
    if (!selectedSubBatch) {
      showToast("warning", "No sub-batch selected");
      return;
    }

    // Validate workflow - at least one department must be selected
    const validWorkflow = departmentWorkflow.filter(step => step.current && step.departmentId);
    if (validWorkflow.length === 0) {
      showToast("warning", "Please select at least one department for the workflow");
      return;
    }

    const confirmed = await showConfirm({
      title: "Send to Production",
      message: `Are you sure you want to send "${selectedSubBatch.name}" to production with ${validWorkflow.length} department(s) in the workflow?`,
      confirmText: "Confirm & Send",
      cancelText: "Cancel",
      type: "info",
    });

    if (!confirmed) return;

    try {
      setIsSending(true);
      const token = localStorage.getItem("token");

      const payload = {
        subBatchId: selectedSubBatch.id,
        manualDepartments: validWorkflow.map(step => step.departmentId),
        total_quantity: selectedSubBatch.total_quantity || selectedSubBatch.estimated_pieces || 0,
      };

      const response = await axios.post(
        `${API}/sub-batches/send-to-production`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const workflow = response.data.workflow;
        showToast(
          "success",
          `Sub-batch sent to production! Workflow ID: ${workflow.id}, Steps: ${workflow.steps.length} departments`
        );

        setShowSendModal(false);
        setSelectedSubBatch(null);
        setDepartmentWorkflow([]);
        fetchSubBatches();
      } else {
        showToast("error", "Failed to send sub-batch to production");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to send to production";
      showToast("error", errorMessage);
    } finally {
      setIsSending(false);
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
                      {formatNepaliDate(subBatch.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatNepaliDate(subBatch.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subBatch.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        {/* View Button */}
                        <button
                          onClick={() => handleEdit(subBatch, true)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(subBatch, false)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Send to Production Button */}
                        <button
                          onClick={() => handleOpenSendModal(subBatch)}
                          disabled={
                            subBatch.status === "COMPLETED" ||
                            subBatch.status === "IN_PRODUCTION"
                          }
                          className={`p-1.5 rounded transition-colors ${
                            subBatch.status === "COMPLETED" ||
                            subBatch.status === "IN_PRODUCTION"
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                          title={
                            subBatch.status === "IN_PRODUCTION"
                              ? "Already in production"
                              : subBatch.status === "COMPLETED"
                              ? "Already completed"
                              : "Send to production"
                          }
                        >
                          <Send size={16} />
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

      {/* Send to Production Modal - Workflow Builder */}
      {showSendModal && selectedSubBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowSendModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                Send Sub Batch to Production
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Define the department workflow for this sub batch
            </p>

            {/* Sub Batch Summary */}
            <div className="border border-gray-300 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900 mb-2">Sub Batch Summary</p>
              <div className="flex justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Name: {selectedSubBatch.name}
                </p>
                <p className="text-sm text-gray-600">
                  ID: B{selectedSubBatch.id.toString().padStart(4, "0")}
                </p>
              </div>
              <div className="flex justify-between gap-4 mt-1">
                <p className="text-sm text-gray-600">
                  Estimated Quantity: {selectedSubBatch.estimated_pieces || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedSubBatch.start_date && selectedSubBatch.due_date
                    ? `${new Date(selectedSubBatch.start_date).toLocaleDateString()} - ${new Date(selectedSubBatch.due_date).toLocaleDateString()}`
                    : "-"}
                </p>
              </div>
            </div>

            {/* Workflow Builder */}
            <div className="border border-gray-300 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900 mb-3">Workflow Builder</p>

              {/* Workflow Steps */}
              {departmentWorkflow.map((row, index) => (
                <div key={index} className="flex items-center gap-3 mb-2">
                  <select
                    value={row.current}
                    onChange={(e) => {
                      const selectedDept = allDepartments.find(d => d.name === e.target.value);
                      const newWorkflow = [...departmentWorkflow];
                      newWorkflow[index].current = e.target.value;
                      newWorkflow[index].departmentId = selectedDept?.id;
                      setDepartmentWorkflow(newWorkflow);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">
                      {index === 0 ? "Select Start Department" : "Select Next Department"}
                    </option>
                    {allDepartments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      const newWorkflow = [...departmentWorkflow];
                      newWorkflow.splice(index, 1);
                      setDepartmentWorkflow(newWorkflow);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Add Department Button */}
              <button
                onClick={() =>
                  setDepartmentWorkflow([...departmentWorkflow, { current: "", departmentId: undefined }])
                }
                className="mt-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
              >
                + {departmentWorkflow.length === 0 ? "Add Start Department" : "Add Next Department"}
              </button>
            </div>

            {/* Workflow Preview */}
            {departmentWorkflow.length > 0 && (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-4">
                <p className="font-medium text-gray-900 mb-2">Workflow Preview</p>
                <div className="flex flex-wrap items-center gap-2 text-gray-700">
                  {departmentWorkflow.map((row, index) => (
                    <React.Fragment key={index}>
                      <span className="px-3 py-1 bg-white border border-gray-300 rounded text-sm">
                        {row.current || "?"}
                      </span>
                      {index < departmentWorkflow.length - 1 && (
                        <span className="text-blue-500 font-bold">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendToProduction}
                disabled={isSending || departmentWorkflow.filter(step => step.current && step.departmentId).length === 0}
                className={`px-4 py-2 rounded-lg text-white transition ${
                  isSending || departmentWorkflow.filter(step => step.current && step.departmentId).length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSending ? "Sending..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Right Side Slide-out */}
      {isEditModalOpen && editingSubBatch && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-white/30 transition-opacity duration-300"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Modal Panel */}
          <div className="ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isPreview ? "View Sub Batch" : "Edit Sub Batch"}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {isPreview ? (
              // Preview Mode - Read Only Display
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">ID</span>
                  <span className="text-sm text-gray-600">
                    SB{editingSubBatch.id.toString().padStart(4, "0")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Name</span>
                  <span className="text-sm text-gray-600">{editFormData.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Batch</span>
                  <span className="text-sm text-gray-600">
                    {editingSubBatch.batch?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Pieces</span>
                  <span className="text-sm text-gray-600">{editFormData.estimatedPieces}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Start Date</span>
                  <span className="text-sm text-gray-600">
                    {editFormData.startDate || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Due Date</span>
                  <span className="text-sm text-gray-600">
                    {editFormData.dueDate || "-"}
                  </span>
                </div>

                {/* Attachments in Preview */}
                {attachments.length > 0 && (
                  <div className="py-2">
                    <p className="font-medium text-gray-900 mb-3">Attachments</p>
                    <table className="w-full border border-gray-200 rounded">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">
                            Name
                          </th>
                          <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {attachments.map((att, index) => (
                          <tr key={index}>
                            <td className="text-sm text-gray-600 px-3 py-2">{att.name}</td>
                            <td className="text-sm text-gray-600 px-3 py-2">{att.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Edit Mode - Limited Fields for Super Supervisor
              <div className="space-y-4">
                {/* Name - Read Only for Super Supervisor */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Sub Batch Name
                    <span className="text-xs text-gray-500 font-normal ml-2">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    disabled={true}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Batch - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Parent Batch
                    <span className="text-xs text-gray-500 font-normal ml-2">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={editingSubBatch.batch?.name || "-"}
                    disabled={true}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Pieces - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">
                    Estimated Pieces
                    <span className="text-xs text-gray-500 font-normal ml-2">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.estimatedPieces}
                    disabled={true}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Attachments - Editable */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-900">
                      Attachment
                    </label>
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Attachment
                    </button>
                  </div>

                  {attachments.map((att, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={att.name}
                        onChange={(e) => handleAttachmentChange(index, "name", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Attachment name"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={att.quantity}
                          onChange={(e) => handleAttachmentChange(index, "quantity", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Quantity"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(index)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dates - Editable */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, startDate: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.dueDate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, dueDate: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> As a Super Supervisor, you can only edit Attachments and Dates.
                    Other fields are managed by Admin.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {isSaving ? "Saving..." : "Update Sub Batch"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubBatchView;
