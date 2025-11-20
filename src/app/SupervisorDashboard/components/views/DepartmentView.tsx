/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import TaskDetailsModal from "../../depcomponents/TaskDetailsModal";
import AlteredTaskDetailsModal from "../../depcomponents/altered/AlteredTaskDetailsModal";
import RejectedTaskDetailsModal from "../../depcomponents/rejected/RejectedTaskDetailsModal";
import Loader from "@/app/Components/Loader";

interface SizeDetail {
  id: number;
  sub_batch_id: number;
  category: string;
  pieces: number;
}

interface Attachment {
  id: number;
  sub_batch_id: number;
  attachment_name: string;
  quantity: number;
}

interface Batch {
  id: number;
  roll_id: number;
  name: string;
  quantity: number;
  unit: string;
  color: string;
  vendor_id: number;
}

interface SubBatch {
  id: number;
  roll_id: number;
  batch_id: number | null;
  name: string;
  estimated_pieces: number;
  expected_items: number;
  start_date: string;
  due_date: string;
  department_id: number | null;
  status?: string; // DRAFT, IN_PRODUCTION, COMPLETED, CANCELLED
  completed_at?: string | null;
  size_details?: SizeDetail[];
  attachments?: Attachment[];
  batch?: Batch;
}

interface Department {
  id: number;
  name: string;
  remarks: string;
}

interface RejectionSource {
  quantity: number;
  reason: string;
  from_department_id: number;
  from_department_name: string;
}

interface AlterationSource {
  quantity: number;
  reason: string;
  from_department_id: number;
  from_department_name: string;
}

interface WorkItem {
  id: number; // department_sub_batch_id - Primary key from department_sub_batches table
                // This ID is required for advance/reject/alter operations
  department_id: number;
  sub_batch_id: number;
  stage: string;
  is_current: boolean;
  createdAt: string;
  updatedAt: string;
  assigned_worker_id: number | null;
  sub_batch: SubBatch;
  assigned_worker: any | null;
  department: Department;
  remarks?: string | null; // Values: "Main", "Assigned", "Rejected", "Altered"
  quantity_remaining?: number | null;
  quantity_received?: number | null;
  quantity_assigned?: number | null; // NEW: For "Assigned" cards
  sent_from_department?: number | null;
  alter_reason?: string | null;
  reject_reason?: string | null;
  rejection_source?: RejectionSource | null;
  alteration_source?: AlterationSource | null;
}

interface KanbanData {
  newArrival: WorkItem[];
  inProgress: WorkItem[];
  completed: WorkItem[];
}

const STAGES = [
  {
    key: 'newArrival',
    title: 'New Arrivals',
    icon: AlertCircle,
    color: 'bg-[#DBEAFE]',
    headerColor: 'text-black font-medium ',
    count: 0
  },
  {
    key: 'inProgress',
    title: 'In Progress',
    icon: Clock,
    color: 'bg-[#FDF3CE]',
    headerColor: 'text-black font-medium',
    count: 0
  },
  {
    key: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    color: 'bg-[#DCFCE7]',
    headerColor: 'text-black font-medium',
    count: 0
  }
];

const SupervisorKanban = () => {
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    newArrival: [],
    inProgress: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [isAlteredTask, setIsAlteredTask] = useState(false);
  const [isRejectedTask, setIsRejectedTask] = useState(false);
  const [currentSupervisorId, setCurrentSupervisorId] = useState<number>(0);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'startDate' | 'dueDate'>('name');

  // Format date helper - Memoized
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Get card styling based on remarks field - Memoized
  const getCardStyle = useCallback((remarks: string | null | undefined) => {
    switch (remarks) {
      case 'Assigned':
        return 'border-blue-500 bg-blue-50';
      case 'Main':
      case null:
      case undefined:
        return 'border-gray-200 bg-white';
      case 'Rejected':
        return 'border-red-500 bg-red-50';
      case 'Altered':
        return 'border-yellow-500 bg-yellow-50';
      default:
        // Handle "reject" or "alter" (lowercase) from old data
        if (remarks?.toLowerCase().includes('reject')) {
          return 'border-red-500 bg-red-50';
        }
        if (remarks?.toLowerCase().includes('alter')) {
          return 'border-yellow-500 bg-yellow-50';
        }
        return 'border-gray-200 bg-white';
    }
  }, []);

  // Get badge text based on remarks - Memoized
  const getBadgeText = useCallback((remarks: string | null | undefined, isNew: boolean) => {
    if (remarks === 'Assigned') return 'Assigned';
    if (remarks === 'Main') return 'Unassigned';
    if (remarks === 'Rejected' || remarks?.toLowerCase().includes('reject')) return 'Rejected';
    if (remarks === 'Altered' || remarks?.toLowerCase().includes('alter')) return 'Alteration';
    if (isNew && !remarks) return 'New Subbatch';
    return 'Unassigned';
  }, []);

  // Get badge color based on remarks - Memoized
  const getBadgeColor = useCallback((remarks: string | null | undefined) => {
    switch (remarks) {
      case 'Assigned':
        return 'bg-blue-500 text-white';
      case 'Main':
      case null:
      case undefined:
        return 'bg-gray-500 text-white';
      case 'Rejected':
        return 'bg-[#D9796C] text-white';
      case 'Altered':
        return 'bg-[#979797] text-white';
      default:
        if (remarks?.toLowerCase().includes('reject')) {
          return 'bg-[#D9796C] text-white';
        }
        if (remarks?.toLowerCase().includes('alter')) {
          return 'bg-[#979797] text-white';
        }
        return 'bg-gray-500 text-white';
    }
  }, []);

  // Sort items based on selected option - Memoized
  const sortItems = useCallback((items: WorkItem[]) => {
    const sortedItems = [...items];
    switch (sortBy) {
      case 'name':
        return sortedItems.sort((a, b) =>
          a.sub_batch.name.localeCompare(b.sub_batch.name)
        );
      case 'startDate':
        return sortedItems.sort((a, b) =>
          new Date(a.sub_batch.start_date).getTime() - new Date(b.sub_batch.start_date).getTime()
        );
      case 'dueDate':
        return sortedItems.sort((a, b) =>
          new Date(a.sub_batch.due_date).getTime() - new Date(b.sub_batch.due_date).getTime()
        );
      default:
        return sortedItems;
    }
  }, [sortBy]);

  // Handle sort option change - Memoized
  const handleSortChange = useCallback((option: 'name' | 'startDate' | 'dueDate') => {
    setSortBy(option);
    setShowSortMenu(false);
  }, []);


  // Fetch kanban data for supervisor
  const fetchKanbanData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const departmentId = localStorage.getItem("departmentId");

      // Check if user is supervisor and has valid token
      if (!token) {
        alert("Authentication required. Please login again.");
        window.location.href = "/login";
        return;
      }

      if (role !== "SUPERVISOR") {
        alert("Access denied. This page is for supervisors only.");
        return;
      }

      // Set the current supervisor ID from localStorage
      if (departmentId) {
        setCurrentSupervisorId(parseInt(departmentId, 10));
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_GET_SUBBATCH_SUPERVISOR}`;

      const response = await fetch(
        apiUrl,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          alert("Session expired. Please login again.");
          localStorage.clear();
          window.location.href = "/login";
          return;
        }
        throw new Error(`Failed to fetch kanban data: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setKanbanData(result.data);
      } else {
        throw new Error(result.message || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching kanban data:', error);
      alert('Failed to fetch work items. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKanbanData();
  }, [fetchKanbanData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSortMenu && !target.closest('.sort-menu-container')) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortMenu]);

  // Handle item click to open task details - Memoized
  const handleItemClick = useCallback((item: WorkItem) => {
    // Check if this is an altered task
    const isAltered = item.remarks?.toLowerCase().includes('alter') ?? false;

    // Check if this is a rejected task
    const isRejected = item.remarks?.toLowerCase().includes('reject') ?? false;

    setSelectedItem(item);
    setIsAlteredTask(isAltered);
    setIsRejectedTask(isRejected);
    setIsTaskDetailsOpen(true);
  }, []);

  // Close task details modal - Memoized
  const closeTaskDetails = useCallback(() => {
    setIsTaskDetailsOpen(false);
    setSelectedItem(null);
    setIsAlteredTask(false);
    setIsRejectedTask(false);
  }, []);

  // Update stages with current counts - Memoized
  const updatedStages = useMemo(() => STAGES.map(stage => ({
    ...stage,
    count: kanbanData[stage.key as keyof KanbanData]?.length || 0
  })), [kanbanData]);

  // Memoize altered task modal data
  const alteredTaskData = useMemo(() => {
    if (!selectedItem) return {} as any;
    return {
      id: selectedItem.id,
      roll_name: selectedItem.sub_batch?.batch?.name,
      batch_name: selectedItem.sub_batch?.batch?.name,
      sub_batch_name: selectedItem.sub_batch?.name,
      total_quantity: selectedItem.quantity_remaining ?? selectedItem.sub_batch?.estimated_pieces ?? 0,
      estimated_start_date: selectedItem.sub_batch?.start_date,
      due_date: selectedItem.sub_batch?.due_date,
      status: selectedItem.stage || 'NEW_ARRIVAL',
      sent_from_department: selectedItem.sent_from_department || selectedItem.department?.name || 'Unknown',
      alteration_date: new Date().toISOString(),
      altered_by: selectedItem.department?.name || 'Department Worker',
      altered_quantity: selectedItem.quantity_remaining ?? 0,
      alter_reason: selectedItem.alter_reason || selectedItem.remarks || '',
      attachments: selectedItem.sub_batch?.attachments?.map((att: Attachment) => ({
        name: att.attachment_name,
        count: att.quantity
      })) || [],
      quantity_remaining: selectedItem.quantity_remaining,
      sub_batch: selectedItem.sub_batch,
      original_quantity: selectedItem.sub_batch?.estimated_pieces
    };
  }, [selectedItem]);

  // Memoize rejected task modal data
  const rejectedTaskData = useMemo(() => {
    if (!selectedItem) return {} as any;
    return {
      id: selectedItem.id,
      roll_name: selectedItem.sub_batch?.batch?.name || 'Roll 1',
      batch_name: selectedItem.sub_batch?.batch?.name || 'Batch B',
      sub_batch_name: selectedItem.sub_batch?.name || '-',
      total_quantity: selectedItem.quantity_remaining ?? selectedItem.sub_batch?.estimated_pieces ?? 0,
      estimated_start_date: selectedItem.sub_batch?.start_date || '',
      due_date: selectedItem.sub_batch?.due_date || '',
      status: selectedItem.stage || 'NEW_ARRIVAL',
      sent_from_department: selectedItem.sent_from_department || selectedItem.department?.name || 'Unknown',
      rejection_date: new Date().toISOString(),
      rejected_by: selectedItem.department?.name || 'Department Worker',
      rejected_quantity: selectedItem.quantity_remaining ?? 0,
      reject_reason: selectedItem.reject_reason || '',
      attachments: selectedItem.sub_batch?.attachments?.map((att: Attachment) => ({
        name: att.attachment_name,
        count: att.quantity
      })) || [],
      quantity_remaining: selectedItem.quantity_remaining,
      sub_batch: selectedItem.sub_batch,
      original_quantity: selectedItem.sub_batch?.estimated_pieces
    };
  }, [selectedItem]);

  // Memoize sorted kanban data for better performance
  const sortedKanbanData = useMemo(() => ({
    newArrival: sortItems(kanbanData.newArrival || []),
    inProgress: sortItems(kanbanData.inProgress || []),
    completed: sortItems(kanbanData.completed || [])
  }), [kanbanData, sortItems]);

  if (loading && kanbanData.newArrival.length === 0 && kanbanData.inProgress.length === 0 && kanbanData.completed.length === 0) {
    // Initial loading - show full page loader
    return (
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="flex items-center justify-center py-12">
          <Loader loading={true} message="Loading Batches....."/>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-full relative">
      {/* Overlay loader for refreshing data */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader loading={true} message="Refreshing data..."/>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department View</h2>
          <p className="text-sm text-gray-500">Manage task across departments</p>
        </div>
        <div className="flex items-center gap-3 relative sort-menu-container">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="text-sm text-gray-600 flex items-center gap-1 hover:text-gray-900"
          >
            <span>⬆⬇</span> Sort by
          </button>

          {/* Sort Dropdown Menu */}
          {showSortMenu && (
            <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={() => handleSortChange('name')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-t-lg ${
                  sortBy === 'name' ? 'bg-gray-50 font-semibold' : ''
                }`}
              >
                Name
              </button>
              <button
                onClick={() => handleSortChange('startDate')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  sortBy === 'startDate' ? 'bg-gray-50 font-semibold' : ''
                }`}
              >
                Start Date
              </button>
              <button
                onClick={() => handleSortChange('dueDate')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-b-lg ${
                  sortBy === 'dueDate' ? 'bg-gray-50 font-semibold' : ''
                }`}
              >
                Due Date
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {updatedStages.map((stage) => {
          const items = sortedKanbanData[stage.key as keyof KanbanData] || [];

          return (
            <div key={stage.key} className={`${stage.color} rounded-lg p-4`}>
              {/* Stage Header */}
              <div className={`${stage.headerColor} p-2 mb-4 flex items-center justify-between`}>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-medium">{stage.title}</h3>
                  <span className="text-sm ">
                  {stage.count} {stage.count === 1 ? 'Item' : 'Items'}
                </span>
                </div>
                
              </div>

              {/* Items */}
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items in this stage</p>
                  </div>
                ) : (
                  items.map((item) => {
                    // Determine if item is rejected or altered based on remarks
                    const isRejected = item.remarks?.toLowerCase().includes('reject') ?? false;
                    const isAltered = item.remarks?.toLowerCase().includes('alter') ?? false;
                    const isAssigned = item.remarks === 'Assigned';
                    const isNewArrival = stage.key === 'newArrival' && !isRejected && !isAltered && !isAssigned;

                    return (
                      <div
                        key={item.id}
                        className={`relative rounded-lg p-4 border hover:shadow-md transition-shadow cursor-pointer ${getCardStyle(item.remarks)}`}
                        onClick={() => handleItemClick(item)}
                      >
                        {/* Status Badge - Top Right */}
                        <span className={`absolute top-3 right-3 inline-block px-3 py-1 text-xs rounded-md font-medium ${getBadgeColor(item.remarks)}`}>
                          {getBadgeText(item.remarks, isNewArrival)}
                        </span>

                        {/* Send To Badge - Bottom Right for Completed */}
                        {stage.key === 'completed' && (
                          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-md font-medium rounded-xl">
                            Send To <ChevronDown size={18} />
                          </span>
                        )}

                        {/* Material Name */}
                        <h4 className="font-semibold text-gray-900 mb-3 pr-20">
                          {item.sub_batch.name}
                        </h4>

                        {/* Worker Name - Only for Assigned cards */}
                        {isAssigned && item.assigned_worker && (
                          <div className="flex items-center gap-2 text-sm text-blue-700 mb-2 font-medium">
                            <span className="text-xs">👷 Worker: {item.assigned_worker.name}</span>
                          </div>
                        )}

                        {/* Quantity Display */}
                        <div className="mb-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package size={14} className="text-gray-400" />
                            <span className="text-xs font-medium">
                              Remaining: {(item.quantity_remaining ?? item.sub_batch.estimated_pieces).toLocaleString()} pcs
                            </span>
                          </div>
                          {/* Show Assigned Quantity for Assigned cards */}
                          {isAssigned && item.quantity_assigned && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                              <Package size={14} className="text-blue-400" />
                              <span className="text-xs font-medium">
                                Assigned: {item.quantity_assigned.toLocaleString()} pcs
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Start Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-xs">Start: {formatDate(item.sub_batch.start_date)}</span>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-xs">Due: {formatDate(item.sub_batch.due_date)}</span>
                        </div>

                        {/* Batch Info */}
                        {item.sub_batch.batch && (
                          <div className="text-xs text-gray-500">
                            Batch: {item.sub_batch.batch.name}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal - Conditional rendering based on altered/rejected status */}
      {isAlteredTask ? (
        <AlteredTaskDetailsModal
          isOpen={isTaskDetailsOpen}
          onClose={closeTaskDetails}
          taskData={alteredTaskData}
          onStageChange={fetchKanbanData}
        />
      ) : isRejectedTask ? (
        <RejectedTaskDetailsModal
          isOpen={isTaskDetailsOpen}
          onClose={closeTaskDetails}
          taskData={rejectedTaskData}
          onStageChange={fetchKanbanData}
        />
      ) : (
        <TaskDetailsModal
          isOpen={isTaskDetailsOpen}
          onClose={closeTaskDetails}
          taskData={selectedItem}
          currentSupervisorId={currentSupervisorId}
          onStageChange={fetchKanbanData}
        />
      )}
    </div>
  );
};

export default SupervisorKanban;