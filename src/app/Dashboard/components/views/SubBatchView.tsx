/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, X, FileX, Layers, Package, Volleyball, PackageMinus, ClockAlert, Clock, MoreVertical, Eye } from "lucide-react";
import Loader from "@/app/Components/Loader";
import NepaliDatePicker from "@/app/Components/NepaliDatePicker";

const API = process.env.NEXT_PUBLIC_API_URL ;

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
  status?: 'DRAFT' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED';
  total_quantity?: number;
}

interface Roll {
  id: number;
  name: string;
}

interface Batch {
  id: number;
  name: string;
  roll_id?: number | null;
}

interface Department {
  id: number;
  name: string;
}

interface SubBatchForm {
  name: string;
  roll_id: string;
  batch_id: string;
  estimatedPieces: string;
  expectedItems: string;
  startDate: string;
  dueDate: string;
  attachmentName: string;
  quantity: string;
}

interface WorkflowStep {
  current: string;
  next?: string;
  departmentId?: number;
}

const SubBatchView = () => {
  const [subBatches, setSubBatches] = useState<SubBatch[]>([]);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [editingSubBatch, setEditingSubBatch] = useState<SubBatch | null>(null);
  const [attachments, setAttachments] = useState<{ name: string; quantity: string }[]>([]);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedSubBatch, setSelectedSubBatch] = useState<SubBatch | null>(null);
  const [departmentWorkflow, setDepartmentWorkflow] = useState<WorkflowStep[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // Updated loading states
  const [loading, setLoading] = useState(true);
  const [, setSaveLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<SubBatchForm>({
    name: "",
    roll_id: "",
    batch_id: "",
    estimatedPieces: "",
    expectedItems: "",
    startDate: "",
    dueDate: "",
    attachmentName: "",
    quantity: "",
  });

  // Categories & Sizes
  const [, setCustomCategories] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [sizesList, setSizesList] = useState<{ size: string; number_of_pieces: string }[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().split("T")[0];
  };

  // Helper function to get status badge styling
  const getStatusBadge = (status?: 'DRAFT' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED') => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
            Draft
          </span>
        );
      case 'IN_PRODUCTION':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            In Production
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
            Draft
          </span>
        );
    }
  };

  // Fetch data with proper loading states
  const fetchSubBatches = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/sub-batches`);
      setSubBatches(res.data);
    } catch (error) {
      console.error("Error fetching subbatches:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolls = async () => {
    try {
      const res = await axios.get(`${API}/rolls`);
      setRolls(res.data);
    } catch (error) {
      console.error("Error fetching rolls:", error);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get(`${API}/batches`);
      setBatches(res.data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);

      let options: string[] = [];

      if (Array.isArray(res.data)) {
        options = res.data.map((c: any) =>
          typeof c === "string" ? c : c.category_name || c.name || c.category || JSON.stringify(c)
        );
      } else if (res.data && Array.isArray(res.data.categories)) {
        options = res.data.categories.map((c: any) =>
          typeof c === "string" ? c : c.category_name || c.name || c.category || JSON.stringify(c)
        );
      } else {
        console.warn("Unexpected categories response format:", res.data);
      }

      setCategoryOptions(options);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategoryOptions([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/departments`);
      setDepartments(res.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Save new category
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    const trimmedCategoryName = newCategoryName.trim();
    const categoryExists = categoryOptions.some(
      category => category.toLowerCase() === trimmedCategoryName.toLowerCase()
    );

    if (categoryExists) {
      alert("Category already exists");
      return;
    }

    setIsSavingCategory(true);

    try {
      const payload = { category_name: trimmedCategoryName };
      await axios.post(`${API}/categories`, payload);

      // Refresh categories list
      await fetchCategories();

      // Clear the input
      setNewCategoryName("");
      alert("Category saved successfully!");
    } catch (err: unknown) {
      // Type guard for Axios error
      if (axios.isAxiosError(err)) {
        const axiosError = err;
        if (axiosError.response?.status === 409 || axiosError.response?.data?.message?.includes("already exists")) {
          alert("Category already exists");
        } else {
          alert("Failed to save category. Please try again.");
        }
      } else {
        // Generic fallback for unknown errors
        console.error("Unknown error:", err);
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSavingCategory(false);
    }
  };

  useEffect(() => {
    fetchSubBatches();
    fetchRolls();
    fetchBatches();
    fetchCategories();
    fetchDepartments();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const target = event.target as HTMLElement;
        // Check if click is outside the dropdown menu
        if (!target.closest('.relative')) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Send to production function
  const handleSendToProduction = async () => {
    if (!selectedSubBatch) {
      alert("No sub-batch selected");
      return;
    }

    // Validate workflow
    const validWorkflow = departmentWorkflow.filter(step => step.current && step.departmentId);
    if (validWorkflow.length === 0) {
      alert("Please select at least one department for the workflow");
      return;
    }

    setIsSending(true);

    try {
      const payload = {
        subBatchId: selectedSubBatch.id,
        manualDepartments: validWorkflow.map(step => step.departmentId),
        total_quantity: selectedSubBatch.total_quantity || selectedSubBatch.estimated_pieces || 0
      };

      console.log("Sending payload:", payload);

      const response = await axios.post(`${API}/sub-batches/send-to-production`, payload);

      if (response.data.success) {
        const workflow = response.data.workflow;
        alert(`Sub-batch sent to production successfully!\nWorkflow ID: ${workflow.id}\nSteps: ${workflow.steps.length} departments\nCurrent Step: ${workflow.current_step_index + 1}`);
        
        console.log("Workflow created:", workflow);
        console.log("Department workflow steps:", workflow.steps);
        
        setIsSendModalOpen(false);
        setSelectedSubBatch(null);
        setDepartmentWorkflow([]);
        
        // Optionally refresh the sub-batches list
        await fetchSubBatches();
      } else {
        alert("Failed to send sub-batch to production");
      }
    } catch (error) {
      console.error("Error sending sub-batch to production:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
        alert(`Failed to send sub-batch to production: ${errorMessage}`);
      } else {
        alert("Failed to send sub-batch to production. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  // Save subbatch with loading state
  const handleSaveSubBatch = async () => {
    try {
      setSaveLoading(true);
      
      const payload = {
        rollId: formData.roll_id ? Number(formData.roll_id) : null,
        batchId: formData.batch_id ? Number(formData.batch_id) : null,
        name: formData.name || "",
        estimatedPieces: Number(formData.estimatedPieces) || 0,
        expectedItems: Number(formData.expectedItems) || 100,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        sizeDetails: sizesList
          .filter((s) => s.size !== "" && s.number_of_pieces !== "")
          .map((s) => ({
            category: s.size,
            pieces: Number(s.number_of_pieces),
          })),
        attachments: attachments
          .filter((a) => a.name !== "" && a.quantity !== "")
          .map((a) => ({
            attachmentName: a.name,
            quantity: Number(a.quantity),
          })),
      };

      console.log(payload);

      if (editingSubBatch) {
        await axios.put(`${API}/sub-batches/${editingSubBatch.id}`, payload);
      } else {
        await axios.post(`${API}/sub-batches`, payload);
      }

      setIsModalOpen(false);
      setEditingSubBatch(null);
      setIsPreview(false);
      setFormData({
        name: "",
        roll_id: "",
        batch_id: "",
        estimatedPieces: "",
        expectedItems: "",
        startDate: "",
        dueDate: "",
        attachmentName: "",
        quantity: "",
      });
      setCustomCategories([]);
      setSizesList([]);
      setAttachments([]);
      fetchSubBatches();
    } catch (error) {
      console.error("Error saving subbatch:", error);
      alert("Failed to save subbatch. Check console for details.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this subbatch?");
    if (!confirmed) return;

    setDeletingId(id);
    setOpenMenuId(null); // Close the dropdown menu

    try {
      await axios.delete(`${API}/sub-batches/${id}`);
      alert("Subbatch deleted successfully!");
      await fetchSubBatches();
    } catch (error) {
      console.error("Error deleting subbatch:", error);
      if (axios.isAxiosError(error)) {
        // Log the full error response for debugging
        console.error("Error response data:", error.response?.data);
        console.error("Error status:", error.response?.status);

        const errorData = error.response?.data;
        const errorMessage =
          errorData?.message ||
          errorData?.error ||
          (typeof errorData === 'string' ? errorData : null) ||
          error.message ||
          "Unknown error occurred";

        alert(`Failed to delete subbatch: ${errorMessage}`);
      } else {
        alert("Failed to delete subbatch. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Edit
  const handleEdit = (subBatch: any, preview: boolean = false) => {
    setEditingSubBatch(subBatch);

    // Map sizes
    const mappedSizes = subBatch.size_details?.map((s: any) => ({
      size: s.category || "",
      number_of_pieces: s.pieces || "",
    })) || [];

    // Map attachments
    const mappedAttachments = subBatch.attachments?.map((a: any) => ({
      name: a.attachment_name || "",
      quantity: a.quantity || "",
    })) || [];

    // Map categories from sizes list
    const mappedCategories =
      subBatch.size_details?.map((s: any) =>
        typeof s.category === "string" ? s.category : s.category?.name || ""
      ) || [];

    setCustomCategories(mappedCategories);
    setSizesList(mappedSizes);
    setAttachments(mappedAttachments);

    setFormData({
      name: subBatch.name || "",
      roll_id: subBatch.roll_id ? String(subBatch.roll_id) : "",
      batch_id: subBatch.batch_id ? String(subBatch.batch_id) : "",
      estimatedPieces: subBatch.estimated_pieces ? String(subBatch.estimated_pieces) : "",
      expectedItems: subBatch.expected_items ? String(subBatch.expected_items) : "",
      startDate: subBatch.start_date ? subBatch.start_date.split("T")[0] : "",
      dueDate: subBatch.due_date ? subBatch.due_date.split("T")[0] : "",
      attachmentName: "",
      quantity: "",
    });

    setIsPreview(preview);
    setIsModalOpen(true);
  };

  // Function to fetch a single sub-batch by ID
  const fetchSubBatchById = async (id: number) => {
    try {
      const res = await axios.get(`${API}/sub-batches/${id}`);
      return res.data; // returns the sub-batch data
    } catch (error) {
      console.error("Error fetching sub-batch by ID:", error);
      return null;
    }
  };

  // Preview handler
  const handlePreview = async (id: number) => {
    const subBatch = await fetchSubBatchById(id);
    if (subBatch) {
      handleEdit(subBatch); // populate your modal/form with data
      setIsPreview(true);  // open the preview modal
    }
  };

  // Preview / Send to production
  const handleSend = (subBatch: SubBatch) => {
    setSelectedSubBatch(subBatch);
    setDepartmentWorkflow([{ current: "", departmentId: undefined }]);
    setIsSendModalOpen(true);
  };

  // Helpers
  const getRollName = (roll_id: number | null | undefined): string => {
    if (!roll_id) return "-";
    const roll = rolls.find((r) => r.id === roll_id);
    return roll ? roll.name : "Unknown Roll";
  };

  const getBatchName = (batch_id: number | null | undefined): string => {
    if (!batch_id) return "-";
    const batch = batches.find((b) => b.id === batch_id);
    return batch ? batch.name : "Unknown Batch";
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Categories & Sizes & Attachments handlers
  const handleAddSizeRow = () => setSizesList([...sizesList, { size: "", number_of_pieces: "" }]);
  const handleSizeChange = (index: number, field: "size" | "number_of_pieces", value: string) => {
    const updated = [...sizesList];
    updated[index][field] = value;
    setSizesList(updated);
  };
  const handleDeleteSizeRow = (index: number) => {
    const updated = [...sizesList];
    updated.splice(index, 1);
    setSizesList(updated);
  };
  const handleAddAttachment = () => setAttachments([...attachments, { name: "", quantity: "" }]);
  const handleAttachmentChange = (index: number, field: "name" | "quantity", value: string) => {
    const updated = [...attachments];
    updated[index][field] = value;
    setAttachments(updated);
  };
  const handleDeleteAttachment = (index: number) => {
    const updated = [...attachments];
    updated.splice(index, 1);
    setAttachments(updated);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sub Batch View</h2>
          <p className="text-gray-600 text-sm">Manage sub batches and track progress</p>
        </div>
        <button
          onClick={() => {
            setEditingSubBatch(null);
            setFormData({
              name: "",
              roll_id: "",
              batch_id: "",
              estimatedPieces: "",
              expectedItems: "",
              startDate: "",
              dueDate: "",
              attachmentName: "",
              quantity: "",
            });
            setCustomCategories([]);
            setSizesList([]);
            setIsPreview(false);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#6B98FF] text-white rounded-[10px] hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4 text-extrabold " />
          Add Sub Batch
        </button>
      </div>

      {/* Status Legend */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-gray-700">Status Legend:</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
              Draft
            </span>
            <span className="text-xs text-gray-600">- Not yet sent to production</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              In Production
            </span>
            <span className="text-xs text-gray-600">- Currently in departments</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Completed
            </span>
            <span className="text-xs text-gray-600">- All departments finished</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <Loader loading={true} message="Loading Sub Batches..." />
        ) : subBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="rounded-[10px] p-6 m-4 flex flex-col items-center">
              <div className="bg-gray-100 mb-4 w-20 aspect-square rounded-full flex items-center justify-center">
                <FileX size={48} className="text-gray-300" />
              </div>
              <h3 className="text-black mb-2 font-bold">No sub batches found</h3>
              <p className="text-gray-500 font-medium">
                Get started by creating your first sub batch.
              </p>
              <p className="text-gray-500 mb-2 font-medium">
                Click the Add Sub Batch button to begin tracking your production.
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-fit max-h-screen">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-[#E5E7EB]">
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">SN</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">NAME</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">PARENT ROLL</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">PARENT BATCH</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">STATUS</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">PIECES</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">START DATE</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">DUE DATE</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subBatches.map((sb, index) => (
                  <tr key={sb.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm">{index + 1}</td>
                    <td className="px-4 py-4 text-sm">{`B00${sb.id.toString().padStart(2, "0")}`}</td>
                    <td className="px-4 py-4 text-sm">{sb.name}</td>
                    <td className="px-4 py-4 text-sm">{getRollName(sb.roll_id)}</td>
                    <td className="px-4 py-4 text-sm">{getBatchName(sb.batch_id)}</td>
                    <td className="px-4 py-4 text-sm">{getStatusBadge(sb.status)}</td>
                    <td className="px-4 py-4 text-sm">{sb.estimated_pieces}</td>
                    <td className="px-4 py-4 text-sm">{formatDate(sb.start_date)}</td>
                    <td className="px-4 py-4 text-sm">{formatDate(sb.due_date)}</td>
                    <td className="px-4 py-4 text-sm relative">
                      <div className="relative">
                        <button
                          onClick={() => toggleMenu(sb.id)}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <MoreVertical size={18} className="text-gray-600" />
                        </button>
                        {openMenuId === sb.id && (
                          <div className="absolute right-0 mt-2 w-44 bg-white rounded shadow-lg z-50 border border-gray-200">
                            <button
                              onClick={() => handlePreview(sb.id)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-black flex items-center gap-2 text-sm"
                              title="View"
                            >
                              <Eye size={14} />Preview
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleEdit(sb);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-black flex items-center gap-2 text-sm"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(sb.id)}
                              disabled={deletingId === sb.id}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm ${
                                deletingId === sb.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'
                              }`}
                            >
                              <Trash2 size={14} /> {deletingId === sb.id ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleSend(sb);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-green-600 flex items-center gap-2 text-sm"
                            >
                              <Package size={14} /> Send to Production
                            </button>
                          </div>
                        )}
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
      {isSendModalOpen && selectedSubBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsSendModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white w-full max-w-[600px] h-auto rounded-[10px] shadow-lg p-6 overflow-y-auto transition-transform">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Send Sub Batch to Production</h3>
              <button
                onClick={() => setIsSendModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-400 mb-2">Define the department workflow for this sub batch</p>

            {/* Sub Batch Summary */}
            <div className="border border-gray-400 rounded p-4 mb-4">
              <p className="font-medium">Sub Batch Summary</p>

              <div className="flex justify-between w-[300px] gap-10 mt-4 my-2">
                <p className="text-gray-500">Name: {selectedSubBatch.name || "Linen Batch"}</p>
                <p className="text-gray-500">ID: B{selectedSubBatch.id.toString().padStart(4, "0")}</p>
              </div>
              <div className="flex justify-between w-fit gap-10">
                <p className="text-gray-500">
                  Estimated Quantity: {selectedSubBatch.estimated_pieces || 0}
                </p>
                <p className="text-gray-500">
                  {selectedSubBatch.start_date && selectedSubBatch.due_date
                    ? `${new Date(selectedSubBatch.start_date).toLocaleDateString()} - ${new Date(selectedSubBatch.due_date).toLocaleDateString()}`
                    : "-"}
                </p>
              </div>
            </div>

            {/* Workflow Builder */}
            <div>
              {/* Builder Box */}
              <div className="border border-gray-400 rounded p-4 mb-4">
                <p className="font-medium mb-2">Workflow Builder</p>

                {departmentWorkflow.map((row, index) => (
                  <div key={index} className="flex items-center w-fit gap-4 mb-2">
                    <select
                      value={row.current}
                      onChange={(e) => {
                        const selectedDept = departments.find(d => d.name === e.target.value);
                        const newWorkflow = [...departmentWorkflow];
                        newWorkflow[index].current = e.target.value;
                        newWorkflow[index].departmentId = selectedDept?.id;
                        setDepartmentWorkflow(newWorkflow);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 flex-1"
                    >
                      <option value="">
                        {index === 0 ? "Select Start Department" : "Select Next Department"}
                      </option>
                      {departments.map((dept) => (
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
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() =>
                    setDepartmentWorkflow([...departmentWorkflow, { current: "", departmentId: undefined }])
                  }
                  className="mt-2 px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                >
                  + {departmentWorkflow.length === 0 ? "Add Start Department" : "Add Next Department"}
                </button>
              </div>

              {/* Flow Preview */}
              {departmentWorkflow.length > 0 && (
                <div className="border border-gray-300 rounded p-4 bg-gray-50">
                  <p className="font-medium mb-2">Workflow Preview</p>
                  <div className="flex flex-wrap items-center gap-2 text-gray-700">
                    {departmentWorkflow.map((row, index) => (
                      <React.Fragment key={index}>
                        <span className="px-3 py-1 bg-white border border-gray-300 rounded">
                          {row.current || "?"}
                        </span>
                        {index < departmentWorkflow.length - 1 && (
                          <span className="text-blue-500 font-bold">➝</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsSendModalOpen(false)}
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendToProduction}
                disabled={isSending || departmentWorkflow.filter(step => step.current && step.departmentId).length === 0}
                className={`px-4 py-2 rounded text-white ${
                  isSending || departmentWorkflow.filter(step => step.current && step.departmentId).length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSending ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className=" min-h-full p-4 sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-white/50 bg-opacity-25 transition-opacity" onClick={() => setIsModalOpen(false)} />

            <div className="fixed right-0 top-0 h-full w-full max-w-md transform overflow-hidden bg-white shadow-xl transition-all">

              <div className="bg-white px-6 pt-6 pb-4 h-full overflow-y-auto">

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Layers size={28} className="text-blue-600" />
                    <h3 className="text-lg font-extrabold text-gray-900">
                      {isPreview ? "Sub Batch Item Details" : editingSubBatch ? "Edit Sub Batch" : "Add Sub Batch"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {isPreview ? (
                  // Preview Layout
                  <div className="space-y-4">
                    {/* ID */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className=" font-semibold text-black">ID</span>
                      <span className="text-sm text-gray-500">B{editingSubBatch?.id.toString().padStart(4, "0")}</span>
                    </div>

                    {/* Parent Roll */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className=" font-semibold text-black">Parent Roll</span>
                      <span className="text-sm text-gray-500">{getRollName(editingSubBatch?.roll_id)}</span>
                    </div>

                    {/* Parent Batch */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className=" font-semibold text-black">Parent Batch</span>
                      <span className="text-sm text-gray-500">{getBatchName(editingSubBatch?.batch_id)}</span>
                    </div>

                    {/* Sub Batch Name */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-black">Sub Batch Name</span>
                      <span className="text-sm text-gray-500">{formData.name}</span>
                    </div>

                    {/* Estimated Pieces */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className=" font-semibold text-black">Pieces</span>
                      <span className="text-sm text-gray-500">{formData.estimatedPieces} </span>
                    </div>

                    {/* Expected Items */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className=" font-semibold text-black">Expected Items</span>
                      <span className="text-sm text-gray-500">{formData.expectedItems || editingSubBatch?.expected_items}</span>
                    </div>

                    {/* Size Details */}
                    {sizesList.length > 0 && (
                      <div className="py-2">
                        <p className="font-semibold text-black mb-3">Size Details</p>
                        <table className="w-full border border-gray-400">
                          <thead>
                            <tr className="bg-gray-50 ">
                              <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">Size</th>
                              <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">Number of Pieces</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sizesList.map((size, index) => (
                              <tr key={index} className=" border-gray-100">
                                <td className="text-sm text-gray-500 px-3 py-2">{size.size}</td>
                                <td className="text-sm text-gray-500 px-3 py-2">{size.number_of_pieces}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Attachment */}
                    {attachments.length > 0 && (
                      <div className="py-2">
                        <p className="font-semibold text-black mb-3">Attachment</p>
                        <table className="w-full  border border-gray-400">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">Attachment Name</th>
                              <th className="text-left text-xs font-medium text-gray-600 px-3 py-2 border-b">Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attachments.map((att, index) => (
                              <tr key={index} className=" ">
                                <td className="text-sm text-gray-500 px-3 py-2">{att.name}</td>
                                <td className="text-sm text-gray-500 px-3 py-2">{att.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Start Date */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-black">Start Date</span>
                      <span className="text-sm text-gray-500">{formatDate(formData.startDate)}</span>
                    </div>

                    {/* End Date */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-black">End Date</span>
                      <span className="text-sm text-gray-500">{formatDate(formData.dueDate)}</span>
                    </div>

                    
                  </div>
                ) : (
                  // Edit/Add Layout
                  <div className="space-y-4">
                  {/* ID */}
                  <div className="flex flex-col">
                    <label className="text-xxl font-semibold  text-gray-700 mb-1"># ID</label>
                    <input
                      type="text"
                      value="B0011"
                      className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled
                    />
                  </div>


                  {/* Name */}
                  <div className="flex items-center gap-2">
                    <Package size={20} className="text-black" />
                    <p className="text-black font-semibold">Subbatch Name </p>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isPreview}
                  />



                  {/* Roll */}
                  <div className="flex items-center gap-2">
                    <Volleyball size={20} className="text-black" />
                    <p className="text-black font-semibold ">Roll Name </p>
                  </div>
                  <select
                    value={formData.roll_id}
                    onChange={(e) => setFormData({ ...formData, roll_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isPreview}
                  >
                    <option value="">Select roll</option>
                    {rolls.map((roll) => <option key={roll.id} value={roll.id}>{roll.name}</option>)}
                  </select>

                  {/* Batch */}
                  <div className="flex items-center gap-2">
                    <PackageMinus size={20} className="text-black" />
                    <p className="text-black font-semibold ">Select Batch </p>
                  </div>

                  <select
                    value={formData.batch_id}
                    onChange={(e) => {
                      const selectedBatchId = e.target.value;
                      const selectedBatch = batches.find(b => b.id === Number(selectedBatchId));

                      setFormData({
                        ...formData,
                        batch_id: selectedBatchId,
                        roll_id: selectedBatch?.roll_id ? String(selectedBatch.roll_id) : formData.roll_id
                      });
                    }}
                    className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isPreview}
                  >
                    <option value="">Select batch...</option>
                    {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                  </select>

                  {/* Estimated Pieces */}
                  <div className="flex items-center gap-2">
                    <PackageMinus size={20} className="text-black" />
                    <p className="text-black font-semibold ">Estimated Pieces </p>
                  </div>
                  <input
                    type="number"
                    placeholder="Estimated pieces...."
                    value={formData.estimatedPieces}
                    onChange={(e) => setFormData({ ...formData, estimatedPieces: e.target.value })}
                    className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isPreview}
                  />

                  {/* Categories */}
                  <div className="border border-gray-200 rounded-[10px] px-5 pt-4">
                    {/* Add New Category Section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-black font-semibold">Add New Category</p>
                      </div>
                      
                      {!isPreview && (
                        <div className="flex gap-2 items-center mb-4">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter new category name"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveCategory();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleSaveCategory}
                            disabled={!newCategoryName.trim() || isSavingCategory}
                            className={`px-3 py-2 rounded-[10px] flex items-center gap-2 ${
                              !newCategoryName.trim() || isSavingCategory
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {isSavingCategory ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-black font-semibold">Items</p>
                      {!isPreview && (
                        <button
                          type="button"
                          onClick={handleAddSizeRow}
                          className="px-3 py-1 text-sm text-[#7698FB] border border-blue-200 rounded hover:bg-blue-50 text-extrabold rounded-[10px]"
                        >
                          + Add Items
                        </button>
                      )}
                    </div>

                    {sizesList.map((row, index) => {
                      return (
                        <div key={index} className="flex gap-2 items-center mb-2">
                          <select
                            value={row.size}
                            onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                            className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={isPreview}
                          >
                            <option value="">Select items</option>
                            {categoryOptions.map((option, i) => (
                              <option key={i} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            placeholder="Pieces...."
                            value={row.number_of_pieces}
                            onChange={(e) => handleSizeChange(index, "number_of_pieces", e.target.value)}
                            className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={isPreview}
                          />

                          {!isPreview && (
                            <button
                              type="button"
                              className="text-black hover:text-red-500"
                              onClick={() => handleDeleteSizeRow(index)}
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Display current sizes for preview */}
                    {isPreview && sizesList.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {sizesList.map((s, idx) => (
                          <div key={idx} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                            {s.size}: {s.number_of_pieces} pieces
                          </div>
                        ))}
                      </div>
                    )}
                  </div>


                  {/* Attachment Section */}
                  <div className="border border-gray-200  rounded-[10px] px-5 pt-4">

                    <div className="flex items-center justify-between mb-3">
                      <p className="text-black font-semibold ">Attachment</p>
                      {!isPreview && (
                        <button
                          type="button"
                          onClick={handleAddAttachment}
                          className="px-3 py-1 text-sm text-[#7698FB] border border-blue-200 rounded hover:bg-blue-50 text-extrabold rounded-[10px]"
                        >
                          + Add Attachment
                        </button>
                      )}
                    </div>

                    {attachments.map((att, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Attachment Name</label>
                          <input
                            type="text"
                            value={att.name}
                            onChange={(e) => handleAttachmentChange(index, "name", e.target.value)}
                            className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={isPreview}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Pieces...."
                              value={att.quantity}
                              onChange={(e) => handleAttachmentChange(index, "quantity", e.target.value)}
                              className="w-full border border-gray-300 rounded-[10px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={isPreview}
                            />
                            {!isPreview && (
                              <button
                                type="button"
                                className="text-black hover:text-red-500 "
                                onClick={() => handleDeleteAttachment(index)}
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>


                  <div className="flex gap-4">
                    {/* Start Date */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={20} className="text-black" />
                        <p className="text-black font-semibold">Start Date</p>
                      </div>
                      <NepaliDatePicker
                        value={formatDate(formData.startDate)}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            startDate: value ? `${value}T00:00:00.000Z` : "",
                          })
                        }
                        className="rounded-[10px]"
                        disabled={isPreview}
                        placeholder="Select Start Date"
                      />
                    </div>

                    {/* Due Date */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ClockAlert size={20} className="text-black" />
                        <p className="text-black font-semibold">Due Date</p>
                      </div>
                      <NepaliDatePicker
                        value={formatDate(formData.dueDate)}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            dueDate: value ? `${value}T00:00:00.000Z` : "",
                          })
                        }
                        className="rounded-[10px]"
                        disabled={isPreview}
                        placeholder="Select Due Date"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="mt-6 flex justify-between ">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-[10px] rounded hover:bg-gray-200 font-extrabold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to save this subbatch?")) {
                          handleSaveSubBatch();
                        }
                      }}
                      className="px-4 py-2 bg-[#6B98FF] rounded-[10px] text-white hover:bg-blue-600 font-extrabold"
                    >
                      Save
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubBatchView;