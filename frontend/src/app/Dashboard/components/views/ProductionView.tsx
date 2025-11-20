"use client";

import React, { useState, useEffect } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import Loader from "@/app/Components/Loader";

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
  department_stage: string;
  quantity_remaining: number | null;
  assigned_worker_id: number | null;
  assigned_worker_name: string | null;
  size_details: SizeDetail[];
  attachments: Attachment[];
  createdAt: string;
  remarks: string | null;
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

  if (loading) return <Loader loading={true} message="Loading Production View..." />;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  return (
    <>
      {/* Inject custom styles */}
      <style>{customStyles}</style>

      <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Production Dashboard</h1>
        <p className="text-sm text-gray-500">Monitor and manage production tasks across departments</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden pt-4 px-4 py-4 bg-gray-50 ">
        {/* Left Sidebar - Sub Batch Selector */}
        <div className="w-80 bg-white flex flex-col rounded-lg border border-gray-300 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sub Batch Selector</h3>
              <span className="text-sm text-gray-500 bg-white px-2.5 py-1 rounded-full font-medium border border-gray-300">
                {data.total_sub_batches}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            <div className="space-y-3">
              {data.all_sub_batches.map((sb) => {
                const isVisible = visibleSubBatches.includes(sb.id);

                return (
                  <div
                    key={sb.id}
                    onClick={() => toggleSubBatchVisibility(sb.id)}
                    className={` px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out flex items-center justify-between group border-2 ${
                      isVisible
                        ? "bg-blue-50 border-blue-500"
                        : "bg-[#C4C4C4] border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span className={`text-base font-medium truncate ${
                      isVisible ? "text-gray-900" : "text-gray-700"
                    }`}>
                      {sb.name}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                      isVisible
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-400 bg-white group-hover:border-gray-500"
                    }`}>
                      <ChevronRight className={`w-3.5 h-3.5 transition-all duration-200 ${
                        isVisible
                          ? "text-white"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Department Cards - Horizontal Layout */}
        <div className="flex-1 overflow-x-auto overflow-y-auto ml-4">
          <div className="flex gap-4 h-full">
            {/* Department Cards */}
            {data.department_columns.map((dept) => {
              // Get visible sub-batches for this department
              const visibleSubBatchesInDept = dept.sub_batches.filter(sb => isSubBatchVisible(sb.id));

              return (
                <div
                  key={dept.department_id}
                  className="w-80 flex-shrink-0 bg-white rounded-lg border border-gray-300 shadow-sm flex flex-col overflow-hidden"
                >
                  {/* Department Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{dept.department_name}</h3>
                      <span className="text-sm text-gray-500 bg-white px-2.5 py-1 rounded-full font-medium border border-gray-300">
                        {visibleSubBatchesInDept.length}
                      </span>
                    </div>
                  </div>

                  {/* Department Content */}
                  <div className="flex-1 overflow-y-auto p-4 bg-white">
                    {visibleSubBatchesInDept.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-8">
                        No tasks
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {visibleSubBatchesInDept.map((subBatchInDept) => (
                          <div
                            key={subBatchInDept.id}
                            className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 "
                          >
                            {/* Top section with product name and badge */}
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="text-base font-semibold text-gray-900 flex-1">{subBatchInDept.name}</h4>
                              {/* Type Badge - Show if altered or rejected */}
                              {subBatchInDept.remarks && (
                                <span className="ml-2 text-xs font-medium px-2.5 py-1 rounded-md bg-gray-500 text-white">
                                  Altered
                                </span>
                              )}
                            </div>

                            {/* Dates */}
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>Start: {formatDate(subBatchInDept.start_date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>Due: {formatDate(subBatchInDept.due_date)}</span>
                              </div>
                            </div>

                            {/* Batch and Status */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              {subBatchInDept.batch_name && (
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">Batch:</span>
                                  <span className="ml-1">{subBatchInDept.batch_name}</span>
                                </div>
                              )}
                              <span
                                className={`text-xs font-semibold px-3 py-1.5 rounded-md ${getStatusColor(
                                  subBatchInDept.department_stage
                                )}`}
                              >
                                {getStatusText(subBatchInDept.department_stage)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Completed Card */}
            <div className="w-80 flex-shrink-0 bg-white rounded-lg border border-gray-300 shadow-sm flex flex-col overflow-hidden">
              {/* Completed Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
                  <span className="text-sm text-gray-500 bg-white px-2.5 py-1 rounded-full font-medium border border-gray-300">
                    {data.completed_sub_batches.length}
                  </span>
                </div>
              </div>

              {/* Completed Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-white">
                {data.completed_sub_batches.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">
                    No completed sub-batches
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.completed_sub_batches.map((sb) => (
                      <div
                        key={`completed-${sb.id}`}
                        className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4  "
                      >
                        {/* Sub-batch Name */}
                        <h4 className="text-base font-semibold text-gray-900 mb-3">{sb.name}</h4>

                        {/* Dates */}
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Start: {formatDate(sb.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Due: {formatDate(sb.due_date)}</span>
                          </div>
                        </div>

                        {/* Batch and Status */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          {sb.batch_name && (
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Batch:</span>
                              <span className="ml-1">{sb.batch_name}</span>
                            </div>
                          )}
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-md bg-green-500 text-white">
                            Completed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProductionView;
