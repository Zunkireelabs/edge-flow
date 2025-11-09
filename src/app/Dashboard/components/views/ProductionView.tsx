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
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "NEW_ARRIVAL":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
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

  // Toggle sub-batch visibility
  const toggleSubBatchVisibility = (id: number) => {
    setVisibleSubBatches((prev) => {
      if (prev.includes(id)) {
        // Remove from visible (hide the card)
        return prev.filter((sbId) => sbId !== id);
      } else {
        // Add to visible (show the card)
        return [...prev, id];
      }
    });
  };

  // Check if sub-batch should be visible
  const isSubBatchVisible = (subBatchId: number) => {
    return visibleSubBatches.includes(subBatchId);
  };

  // Get ordered sub-batches: visible ones first (in order of selection), then non-visible
  const getOrderedSubBatches = () => {
    const visible = data!.all_sub_batches.filter(sb => visibleSubBatches.includes(sb.id));
    const nonVisible = data!.all_sub_batches.filter(sb => !visibleSubBatches.includes(sb.id));
    return [...visible, ...nonVisible];
  };

  if (loading) return <Loader loading={true} message="Loading Production View..." />;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  return (
    <>
      {/* Inject custom styles */}
      <style>{customStyles}</style>

      <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Production Dashboard</h1>
        <p className="text-sm text-gray-500">Monitor and manage production tasks across departments</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - All Sub Batches */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">All Sub Batches</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {data.total_sub_batches}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Selected Sub-batches - shown first with row alignment */}
            {getOrderedSubBatches().map((sb, index) => {
              const isVisible = visibleSubBatches.includes(sb.id);
              const isFirstNonVisible = !isVisible && index === visibleSubBatches.length;

              return (
                <React.Fragment key={sb.id}>
                  {/* Divider before non-visible items */}
                  {isFirstNonVisible && visibleSubBatches.length > 0 && (
                    <div className="px-4 py-2 bg-gray-100">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Other Sub Batches
                      </div>
                    </div>
                  )}

                  <div
                    onClick={() => toggleSubBatchVisibility(sb.id)}
                    className={`px-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ease-in-out flex items-center justify-between group ${
                      isVisible
                        ? "h-[188px] bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500"
                        : "py-3 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isVisible && (
                        <div className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0"></div>
                      )}
                      <span className={`text-sm truncate ${
                        isVisible ? "text-gray-900 font-medium" : "text-gray-700"
                      }`}>
                        {sb.name}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                      isVisible
                        ? "text-blue-500 rotate-90"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`} />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Department Columns - Row-based Layout */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div className="inline-flex flex-col min-w-max h-auto">
            {/* Headers Row */}
            <div className="flex sticky top-0 z-10">
              {data.department_columns.map((dept) => (
                <div
                  key={`header-${dept.department_id}`}
                  className="w-72 flex-shrink-0 border-r border-gray-200 bg-white border-b p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{dept.department_name}</h3>
                    <span className="text-xs text-gray-500">
                      {dept.sub_batches.filter(sb => isSubBatchVisible(sb.id)).length} tasks
                    </span>
                  </div>
                </div>
              ))}
              {/* Completed Header */}
              <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white border-b p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Completed</h3>
                  <span className="text-xs text-gray-500">
                    {data.completed_sub_batches.length} tasks
                  </span>
                </div>
              </div>
            </div>

            {/* Content Area with two sections */}
            <div className="flex-1 bg-gray-50 flex">
              {/* Left section: Department columns with row-based layout */}
              <div className="flex-1 overflow-y-auto">
                {getOrderedSubBatches().map((subBatch) => {
                  // Only render row if this sub-batch is visible
                  if (!isSubBatchVisible(subBatch.id)) return null;

                  return (
                    <div key={`row-${subBatch.id}`} className="flex animate-fadeIn">
                      {/* Department Columns */}
                      {data.department_columns.map((dept) => {
                        // Find if this sub-batch exists in this department
                        const subBatchInDept = dept.sub_batches.find(sb => sb.id === subBatch.id);

                        return (
                          <div
                            key={`cell-${dept.department_id}-${subBatch.id}`}
                            className="w-72 flex-shrink-0 border-r border-b border-gray-200 p-4 bg-gray-50"
                          >
                            {subBatchInDept ? (
                              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                {/* Status Badge */}
                                <div className="mb-3">
                                  <span
                                    className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusColor(
                                      subBatchInDept.department_stage
                                    )}`}
                                  >
                                    {getStatusText(subBatchInDept.department_stage)}
                                  </span>
                                </div>

                                {/* Sub-batch Name */}
                                <h4 className="font-semibold text-gray-900 mb-3">{subBatchInDept.name}</h4>

                                {/* Details */}
                                <div className="space-y-2 text-xs text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    <span>Start: {formatDate(subBatchInDept.start_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    <span>Due: {formatDate(subBatchInDept.due_date)}</span>
                                  </div>
                                  {subBatchInDept.batch_name && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Batch:</span>
                                      <span>{subBatchInDept.batch_name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Empty cell if sub-batch not in this department
                              <div className="h-full"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Right section: Completed column - always shows all completed */}
              <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {data.completed_sub_batches.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      No completed sub-batches
                    </div>
                  ) : (
                    data.completed_sub_batches.map((sb) => (
                      <div
                        key={`completed-${sb.id}`}
                        className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        {/* Completed Badge */}
                        <div className="mb-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded border bg-green-100 text-green-700 border-green-300">
                            Completed
                          </span>
                        </div>

                        {/* Sub-batch Name */}
                        <h4 className="font-semibold text-gray-900 mb-3">{sb.name}</h4>

                        {/* Details */}
                        <div className="space-y-2 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>Start: {formatDate(sb.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>Due: {formatDate(sb.due_date)}</span>
                          </div>
                          {sb.batch_name && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Batch:</span>
                              <span>{sb.batch_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
