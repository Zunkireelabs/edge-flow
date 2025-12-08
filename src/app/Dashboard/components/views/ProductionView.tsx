"use client";

import React, { useState, useEffect } from "react";
import { Calendar, ChevronRight, CheckCircle, RefreshCw, XCircle } from "lucide-react";
import Loader from "@/app/Components/Loader";
import ProductionTaskDetailsModal from "./modals/ProductionTaskDetailsModal";

// Add custom styles for animations
const customStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;

interface SubBatch {
  id: number;
  name: string;
  start_date: string;
  due_date: string;
  estimated_pieces: number;
  expected_items: number;
  status: string;
  batch_name: string | null;
  batch_id: number | null;
  completed_at?: string | null;
}

interface Attachment {
  id: number;
  attachment_name: string;
  quantity: number;
}

interface SizeDetail {
  id: number;
  size_category: string;
  quantity: number;
}

interface SubBatchInDepartment extends SubBatch {
  id: number; // This is sub_batch.id from backend (NOT department_sub_batch_id)
  department_stage: string;
  quantity_remaining: number | null;
  quantity_received?: number | null; // For calculating worked pieces
  assigned_worker_id: number | null;
  assigned_worker_name: string | null;
  size_details: SizeDetail[];
  attachments: Attachment[];
  createdAt: string;
  remarks: string | null; // Values: "Main", "Assigned", "Rejected", "Altered"
  sub_batch_id?: number; // Reference to parent sub_batch (optional since id already IS sub_batch.id)
  department_id?: number; // Added when card is clicked - passed from parent DepartmentColumn
  // Alteration/Rejection tracking
  total_altered?: number;
  total_rejected?: number;
  alteration_source?: {
    from_department_id: number | null;
    from_department_name: string | null;
    quantity: number;
    reason: string | null;
  } | null;
}

interface DepartmentColumn {
  department_id: number;
  department_name: string;
  task_count: number;
  sub_batches: SubBatchInDepartment[];
}

interface ProductionViewData {
  all_sub_batches: SubBatch[];
  department_columns: DepartmentColumn[];
  completed_sub_batches: SubBatch[];
  total_departments: number;
  total_sub_batches: number;
  total_completed: number;
  total_in_production: number;
}

const ProductionView = () => {
  const [data, setData] = useState<ProductionViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleSubBatches, setVisibleSubBatches] = useState<number[]>([]);
  const [selectedTask, setSelectedTask] = useState<SubBatchInDepartment | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get status badge color
  const getStatusColor = (stage: string) => {
    switch (stage) {
      case "IN_PROGRESS":
        return "bg-[#FFAD60] text-white";
      case "NEW_ARRIVAL":
        return "bg-[#7698FB] text-white";
      case "COMPLETED":
        return "bg-[#6FB772] text-white";
      default:
        return "bg-[#979797] text-white";
    }
  };

  // Get status display text
  const getStatusText = (stage: string) => {
    switch (stage) {
      case "IN_PROGRESS":
        return "In Progress";
      case "NEW_ARRIVAL":
        return "In transit";
      case "COMPLETED":
        return "Completed";
      default:
        return stage;
    }
  };

  // Get card styling based on remarks field
  const getCardStyle = (remarks: string | null | undefined) => {
    switch (remarks) {
      case "Assigned":
        return "border-blue-500 bg-blue-50";
      case "Main":
      case null:
      case undefined:
        return "border-gray-300 bg-gray-50";
      case "Rejected":
        return "border-red-500 bg-red-50";
      case "Altered":
        return "border-yellow-500 bg-yellow-50";
      default:
        // Handle "reject" or "alter" (lowercase) from old data
        if (remarks?.toLowerCase().includes("reject")) {
          return "border-red-500 bg-red-50";
        }
        if (remarks?.toLowerCase().includes("alter")) {
          return "border-yellow-500 bg-yellow-50";
        }
        return "border-gray-300 bg-gray-50";
    }
  };

  // Get badge text based on remarks
  const getBadgeText = (remarks: string | null | undefined) => {
    if (remarks === "Assigned") return "Assigned";
    if (remarks === "Main") return "Unassigned";
    if (remarks === "Rejected" || remarks?.toLowerCase().includes("reject"))
      return "Rejected";
    if (remarks === "Altered" || remarks?.toLowerCase().includes("alter"))
      return "Altered";
    return "Unassigned";
  };

  // Get badge color based on remarks
  const getBadgeColor = (remarks: string | null | undefined) => {
    switch (remarks) {
      case "Assigned":
        return "bg-blue-500 text-white";
      case "Main":
      case null:
      case undefined:
        return "bg-gray-500 text-white";
      case "Rejected":
        return "bg-red-500 text-white";
      case "Altered":
        return "bg-yellow-500 text-white";
      default:
        if (remarks?.toLowerCase().includes("reject")) {
          return "bg-red-500 text-white";
        }
        if (remarks?.toLowerCase().includes("alter")) {
          return "bg-yellow-500 text-white";
        }
        return "bg-gray-500 text-white";
    }
  };

  // Fetch production view data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/production-view`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch production view data");
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);

          // By default, show only the first sub-batch
          if (result.data.all_sub_batches.length > 0) {
            setVisibleSubBatches([result.data.all_sub_batches[0].id]);
          }
        }
      } catch (error) {
        console.error("Error fetching production view:", error);
        alert("Failed to load production view data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle sub-batch visibility - only one at a time
  const toggleSubBatchVisibility = (id: number) => {
    setVisibleSubBatches((prev) => {
      if (prev.includes(id)) {
        // If already selected, deselect it
        return [];
      } else {
        // Select only this one, deselect all others
        return [id];
      }
    });
  };

  // Check if sub-batch should be visible
  const isSubBatchVisible = (subBatchId: number) => {
    return visibleSubBatches.includes(subBatchId);
  };

  // Handle card click - include department_id for the modal API call
  const handleCardClick = (task: SubBatchInDepartment, departmentId: number) => {
    // Add department_id to the task data so modal can use it for API calls
    setSelectedTask({ ...task, department_id: departmentId });
    setIsTaskModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  // Refresh data after modal actions
  const handleRefresh = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/production-view`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch production view data");
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error refreshing production view:", error);
    }
  };

  if (loading) return <Loader loading={true} message="Loading Production Overview..." />;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  // Get priority based on due date
  const getPriority = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return 'urgent';
    if (daysUntilDue <= 3) return 'at-risk';
    return null;
  };

  const getPriorityBadge = (priority: string | null) => {
    if (priority === 'urgent') {
      return (
        <span className="text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1 bg-red-50 text-red-600 border border-red-200">
          ↑ URGENT
        </span>
      );
    }
    if (priority === 'at-risk') {
      return (
        <span className="text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200">
          − At Risk
        </span>
      );
    }
    return null;
  };

  return (
    <>
      {/* Inject custom styles */}
      <style>{customStyles}</style>

      <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>Production Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor and manage production tasks across departments</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden pt-5 px-5 py-5 bg-gray-50">
        {/* Left Sidebar - Sub Batch Selector */}
        <div className="w-80 bg-white flex flex-col rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-900" style={{ letterSpacing: '-0.01em' }}>Sub Batch Selector</h3>
              <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full font-medium border border-gray-200">
                {data.total_sub_batches}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Select a sub-batch to track its progress</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-white" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}>
            <div className="space-y-2">
              {data.all_sub_batches.map((sb) => {
                const isVisible = visibleSubBatches.includes(sb.id);

                return (
                  <button
                    key={sb.id}
                    onClick={() => toggleSubBatchVisibility(sb.id)}
                    className={`w-full px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                      isVisible
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    <span className={`text-sm font-medium truncate ${
                      isVisible ? "text-white" : "text-gray-900"
                    }`}>
                      {sb.name}
                    </span>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform duration-200 ${
                      isVisible
                        ? "text-white transform translate-x-0.5"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Department Cards - Horizontal Layout */}
        <div className="flex-1 overflow-x-auto overflow-y-auto ml-4">
          {visibleSubBatches.length === 0 ? (
            // No sub-batch selected - show helpful message
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8 bg-white rounded-xl border-2 border-dashed border-gray-300 max-w-md">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sub-Batch Selected</h3>
                <p className="text-sm text-gray-500">Select a sub-batch from the left panel to track its progress across departments</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 h-full">
              {/* Department Cards - Show ALL departments (even if empty) */}
              {(() => {
                const departmentsWithData = data.department_columns
                  .map((dept) => {
                    // Get visible sub-batches for this department
                    // Filter by sb.id which is the sub_batch.id from backend
                    // NOTE: sb.id is set to dsb.sub_batch.id in the backend response
                    // Do NOT use batch_id as fallback - that's the parent batch, not the sub-batch
                    const visibleSubBatchesInDept = dept.sub_batches.filter(sb =>
                      isSubBatchVisible(sb.id)
                    );

                    return { dept, visibleSubBatchesInDept };
                  });
                  // ✅ REMOVED FILTER - Now shows all departments even if empty

                // Check if sub-batch has no data anywhere (not in any department and not completed)
                const hasAnyVisibleData = departmentsWithData.some(({ visibleSubBatchesInDept }) => visibleSubBatchesInDept.length > 0) ||
                                         data.completed_sub_batches.filter(sb => isSubBatchVisible(sb.id)).length > 0;

                if (!hasAnyVisibleData) {
                  return (
                    <div className="flex items-center justify-center h-full w-full">
                      <div className="text-center p-8 bg-white rounded-xl border-2 border-dashed border-gray-300 max-w-md">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Production Data</h3>
                        <p className="text-sm text-gray-500">This sub-batch has not entered production yet or has no active tasks in any department</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    {departmentsWithData.map(({ dept, visibleSubBatchesInDept }) => (
                      <div
                        key={dept.department_id}
                        className="w-80 flex-shrink-0 bg-gray-50 rounded-xl flex flex-col overflow-hidden"
                      >
                  {/* Department Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-semibold text-gray-700">{dept.department_name}</span>
                      <span className="text-xs text-gray-500 font-medium">{visibleSubBatchesInDept.length}</span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                        <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                        <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>

                  {/* Department Content */}
                  <div className="flex-1 overflow-y-auto px-3 pb-3 bg-gray-50">
                    {visibleSubBatchesInDept.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-8">
                        No tasks
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {visibleSubBatchesInDept.map((subBatchInDept, cardIndex) => {
                          const priority = getPriority(subBatchInDept.due_date);

                          // Check if this is a rework card for styling
                          const isReworkCard = !!subBatchInDept.alteration_source ||
                            subBatchInDept.remarks === 'Altered' ||
                            subBatchInDept.remarks?.toLowerCase().includes('alter');

                          return (
                            <div
                              key={`dept-${dept.department_id}-card-${subBatchInDept.id}-${subBatchInDept.remarks || 'main'}-${cardIndex}`}
                              onClick={() => handleCardClick(subBatchInDept, dept.department_id)}
                              className={`rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200 group border-l-4 ${
                                isReworkCard
                                  ? 'bg-amber-50 border-l-amber-500 border border-amber-200 hover:border-amber-300'
                                  : `${getCardStyle(subBatchInDept.remarks)} border hover:border-gray-300`
                              }`}
                            >
                              {/* Task Header */}
                              <div className="flex items-start justify-between mb-3">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">SUB-{subBatchInDept.id}</span>
                                {priority ? getPriorityBadge(priority) : (
                                  <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                                    isReworkCard ? 'bg-amber-500 text-white' : getBadgeColor(subBatchInDept.remarks)
                                  }`}>
                                    {isReworkCard ? 'Rework' : getBadgeText(subBatchInDept.remarks)}
                                  </span>
                                )}
                              </div>

                              {/* Task Title */}
                              <h4 className="font-semibold text-gray-900 mb-3 text-base leading-snug">{subBatchInDept.name}</h4>

                              {/* Worker Name - Only for Assigned cards */}
                              {subBatchInDept.remarks === "Assigned" && subBatchInDept.assigned_worker_name && (
                                <div className="mb-3">
                                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-medium border border-blue-200">
                                    👷 {subBatchInDept.assigned_worker_name}
                                  </span>
                                </div>
                              )}

                              {/* Quantity Display - Enhanced like DepartmentView */}
                              {(() => {
                                // Detect if this is a rework card (from alteration)
                                const isReworkCard = !!subBatchInDept.alteration_source ||
                                  subBatchInDept.remarks === 'Altered' ||
                                  subBatchInDept.remarks?.toLowerCase().includes('alter');

                                const received = subBatchInDept.quantity_received ?? subBatchInDept.estimated_pieces;
                                const remaining = subBatchInDept.quantity_remaining ?? subBatchInDept.estimated_pieces;
                                const altered = isReworkCard ? 0 : (subBatchInDept.total_altered ?? 0);
                                const rejected = isReworkCard ? 0 : (subBatchInDept.total_rejected ?? 0);
                                const processed = received - remaining - altered - rejected;

                                // For rework cards, show rework quantity
                                const reworkQuantity = isReworkCard ?
                                  (subBatchInDept.alteration_source?.quantity ?? subBatchInDept.quantity_received ?? 0) : 0;

                                return (
                                  <div className="space-y-1.5 mb-3">
                                    {/* Remaining */}
                                    {remaining !== null && remaining >= 0 && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="text-xs font-medium">
                                          Remaining: {remaining.toLocaleString()} pcs
                                        </span>
                                      </div>
                                    )}

                                    {/* Processed */}
                                    {processed > 0 && (
                                      <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle size={14} className="text-green-500" />
                                        <span className="text-xs font-medium">
                                          Processed: {processed.toLocaleString()} pcs
                                        </span>
                                      </div>
                                    )}

                                    {/* Rework indicator for altered cards */}
                                    {isReworkCard && reworkQuantity > 0 && (
                                      <div className="flex items-center gap-2 text-sm text-amber-600">
                                        <RefreshCw size={14} className="text-amber-500" />
                                        <span className="text-xs font-medium">
                                          Rework: {reworkQuantity.toLocaleString()} pcs
                                        </span>
                                      </div>
                                    )}

                                    {/* Altered - Only show if > 0 AND not a rework card */}
                                    {!isReworkCard && altered > 0 && (
                                      <div className="flex items-center gap-2 text-sm text-amber-600">
                                        <RefreshCw size={14} className="text-amber-500" />
                                        <span className="text-xs font-medium">
                                          Altered: {altered.toLocaleString()} pcs
                                        </span>
                                      </div>
                                    )}

                                    {/* Rejected - Only show if > 0 AND not a rework card */}
                                    {!isReworkCard && rejected > 0 && (
                                      <div className="flex items-center gap-2 text-sm text-red-600">
                                        <XCircle size={14} className="text-red-500" />
                                        <span className="text-xs font-medium">
                                          Rejected: {rejected.toLocaleString()} pcs
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Task Meta Info */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Calendar size={13} className="text-gray-400" />
                                  <span>{formatDate(subBatchInDept.start_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <Calendar size={13} className={priority ? "text-red-400" : "text-gray-400"} />
                                  <span className={priority ? "text-red-600 font-medium" : "text-gray-600"}>
                                    {formatDate(subBatchInDept.due_date)}
                                  </span>
                                </div>
                              </div>

                              {/* Batch Tag */}
                              {subBatchInDept.batch_name && (
                                <div className="flex items-center gap-2 mb-4">
                                  <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium border border-gray-200">
                                    {subBatchInDept.batch_name}
                                  </span>
                                </div>
                              )}

                              {/* Footer - Avatar & Stats */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                  {/* Avatar placeholder */}
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                                    {subBatchInDept.name.charAt(0)}
                                  </div>
                                  {/* Status badge */}
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatusColor(subBatchInDept.department_stage)}`}>
                                    {getStatusText(subBatchInDept.department_stage)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {/* Attachment icon */}
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                                      <path d="M14 10V12.5C14 13.88 12.88 15 11.5 15H4.5C3.12 15 2 13.88 2 12.5V3.5C2 2.12 3.12 1 4.5 1H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                      <path d="M14 1V6M14 1H9M14 1L8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                    <span className="text-xs font-medium">{subBatchInDept.attachments?.length || 0}</span>
                                  </div>
                                  {/* Size details icon */}
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                                      <path d="M14 10.5C14 11.3284 13.3284 12 12.5 12H4.5L2 14.5V3.5C2 2.67157 2.67157 2 3.5 2H12.5C13.3284 2 14 2.67157 14 3.5V10.5Z" stroke="currentColor" strokeWidth="1.5"/>
                                    </svg>
                                    <span className="text-xs font-medium">{subBatchInDept.size_details?.length || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                      </div>
                    </div>
                    ))}

                    {/* Completed Card - Always show */}
            <div className="w-80 flex-shrink-0 bg-gray-50 rounded-xl flex flex-col overflow-hidden">
              {/* Completed Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-semibold text-gray-700">Completed</span>
                  <span className="text-xs text-gray-500 font-medium">{data.completed_sub_batches.length}</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                    <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
                  </svg>
                </button>
              </div>

              {/* Completed Content */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 bg-gray-50">
                {data.completed_sub_batches.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-12 border-2 border-dashed border-gray-200 rounded-lg bg-white">
                    No completed sub-batches
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.completed_sub_batches.map((sb) => (
                      <div
                        key={`completed-${sb.id}`}
                        className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-gray-300"
                      >
                        {/* Task Header */}
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">SUB-{sb.id}</span>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-green-50 text-green-600 border border-green-200">
                            ✓ Completed
                          </span>
                        </div>

                        {/* Task Title */}
                        <h4 className="font-semibold text-gray-900 mb-3 text-base leading-snug">{sb.name}</h4>

                        {/* Task Meta Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar size={13} className="text-gray-400" />
                            <span>{formatDate(sb.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar size={13} className="text-gray-400" />
                            <span>{formatDate(sb.due_date)}</span>
                          </div>
                        </div>

                        {/* Batch Tag */}
                        {sb.batch_name && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium border border-gray-200">
                              {sb.batch_name}
                            </span>
                          </div>
                        )}

                        {/* Footer - Avatar */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-semibold">
                              {sb.name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-gray-500">
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                                <path d="M14 10V12.5C14 13.88 12.88 15 11.5 15H4.5C3.12 15 2 13.88 2 12.5V3.5C2 2.12 3.12 1 4.5 1H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M14 1V6M14 1H9M14 1L8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              <span className="text-xs font-medium">0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Task Details Modal */}
      {isTaskModalOpen && selectedTask && (
        <ProductionTaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={handleModalClose}
          taskData={selectedTask}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
};

export default ProductionView;
