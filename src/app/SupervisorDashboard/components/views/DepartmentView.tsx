/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
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
  remarks?: string | null;
  quantity_remaining?: number | null;
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
    color: 'bg-blue-50',
    headerColor: 'text-gray-700',
    count: 0
  },
  {
    key: 'inProgress',
    title: 'In Progress',
    icon: Clock,
    color: 'bg-yellow-50',
    headerColor: 'text-gray-700',
    count: 0
  },
  {
    key: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    color: 'bg-green-50',
    headerColor: 'text-gray-700',
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

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Sort items based on selected option
  const sortItems = (items: WorkItem[]) => {
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
  };

  // Handle sort option change
  const handleSortChange = (option: 'name' | 'startDate' | 'dueDate') => {
    setSortBy(option);
    setShowSortMenu(false);
  };


  // Fetch kanban data for supervisor
  const fetchKanbanData = async () => {
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

      console.log("Fetching supervisor sub-batches with token:", token);
      console.log("Department ID from localStorage:", departmentId);

      // Set the current supervisor ID from localStorage
      if (departmentId) {
        setCurrentSupervisorId(parseInt(departmentId, 10));
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_GET_SUBBATCH_SUPERVISOR}`;
      console.log("======= API ENDPOINT =======");
      console.log("Fetching kanban data from API:", apiUrl);
      console.log("============================");

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
      console.log("======= SUPERVISOR KANBAN API RESPONSE =======");
      console.log("Full API Response:", result);
      console.log("Success:", result.success);
      console.log("Data:", result.data);

      if (result.success && result.data) {
        console.log("======= KANBAN DATA BREAKDOWN =======");
        console.log("New Arrival items:", result.data.newArrival);
        console.log("New Arrival count:", result.data.newArrival?.length || 0);
        console.log("In Progress items:", result.data.inProgress);
        console.log("In Progress count:", result.data.inProgress?.length || 0);
        console.log("Completed items:", result.data.completed);
        console.log("Completed count:", result.data.completed?.length || 0);

        setKanbanData(result.data);

        // Log department info from the first item if available
        const firstItem = result.data.newArrival[0] || result.data.inProgress[0] || result.data.completed[0];
        console.log("======= FIRST ITEM FOR DEPARTMENT =======");
        console.log("First item:", firstItem);
        console.log("Department:", firstItem?.department);
        console.log("Department name:", firstItem?.department?.name);
      } else {
        throw new Error(result.message || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching kanban data:', error);
      alert('Failed to fetch work items. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKanbanData();
  }, []);

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

  // Handle item click to open task details
  const handleItemClick = (item: WorkItem) => {
    console.log('======= ITEM CLICKED =======');
    console.log('Selected item:', item);
    console.log('Item ID:', item.id);
    console.log('Sub-batch:', item.sub_batch);
    console.log('Sub-batch ID:', item.sub_batch_id);
    console.log('Stage:', item.stage);
    console.log('Assigned worker:', item.assigned_worker);
    console.log('Assigned worker ID:', item.assigned_worker_id);
    console.log('Department:', item.department);
    console.log('Rejection source:', item.rejection_source);
    console.log('Alteration source:', item.alteration_source);
    console.log('Current supervisor ID:', currentSupervisorId);

    // Check if this is an altered task
    const isAltered = !!item.alteration_source || (item.remarks?.toLowerCase().includes('alter') ?? false);
    console.log('Is Altered Task:', isAltered);

    // Check if this is a rejected task
    const isRejected = !!item.rejection_source || (item.remarks?.toLowerCase().includes('reject') ?? false);
    console.log('Is Rejected Task:', isRejected);
    console.log('================================');

    setSelectedItem(item);
    setIsAlteredTask(isAltered);
    setIsRejectedTask(isRejected);
    setIsTaskDetailsOpen(true);
  };

  // Close task details modal
  const closeTaskDetails = () => {
    setIsTaskDetailsOpen(false);
    setSelectedItem(null);
    setIsAlteredTask(false);
    setIsRejectedTask(false);
  };

  // Update stages with current counts
  const updatedStages = STAGES.map(stage => ({
    ...stage,
    count: kanbanData[stage.key as keyof KanbanData]?.length || 0
  }));

  console.log('======= CURRENT KANBAN STATE =======');
  console.log('Updated stages:', updatedStages);
  console.log('Current kanban data:', kanbanData);
  console.log('====================================');

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="flex items-center justify-center py-12">
          <Loader loading={true} message="Loading Batches....."/>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-full">
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
          const items = sortItems(kanbanData[stage.key as keyof KanbanData] || []);

          console.log(`======= RENDERING STAGE: ${stage.title} =======`);
          console.log(`Stage key: ${stage.key}`);
          console.log(`Items count: ${items.length}`);
          console.log(`Items:`, items);
          console.log(`Sorted by: ${sortBy}`);
          console.log(`=====================================`);

          return (
            <div key={stage.key} className={`${stage.color} rounded-lg p-4`}>
              {/* Stage Header */}
              <div className={`${stage.headerColor} p-2 mb-4 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{stage.title}</h3>
                </div>
                <span className="text-gray-500 text-xs">
                  {stage.count} {stage.count === 1 ? 'item' : 'items'}
                </span>
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
                    const isRejected = item.remarks?.toLowerCase().includes('reject') || !!item.rejection_source;
                    const isAltered = item.remarks?.toLowerCase().includes('alter') || !!item.alteration_source;
                    const workQuantity = item.quantity_remaining ?? item.sub_batch.estimated_pieces;

                    console.log(`--- Rendering item ${item.id} in ${stage.title} ---`);
                    console.log('Item details:', {
                      id: item.id,
                      subBatchName: item.sub_batch.name,
                      stage: item.stage,
                      remarks: item.remarks,
                      quantityRemaining: item.quantity_remaining,
                      estimatedPieces: item.sub_batch.estimated_pieces,
                      dueDate: item.sub_batch.due_date,
                      isRejected,
                      isAltered,
                      workQuantity,
                      rejectionSource: item.rejection_source,
                      alterationSource: item.alteration_source,
                      assignedWorkerId: item.assigned_worker_id
                    });

                    return (
                      <div
                        key={item.id}
                        className={`relative rounded-lg p-4 border bg-gray-50 hover:shadow-md transition-shadow cursor-pointer ${
                          isRejected
                            ? 'border-red-500'
                            : isAltered
                            ? 'border-gray-500'
                            : 'border-gray-200'
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        {/* Status Badge - Top Right */}
                        {isRejected && (
                          <span className="absolute top-3 right-1 inline-block px-3 py-1 bg-[#D9796C] text-white text-xs rounded-md font-medium rounded-xl">
                            Rejected
                          </span>
                        )}
                        {isAltered && !isRejected && (
                          <span className="absolute top-3 right-1 inline-block px-3 py-1 bg-[#979797] text-white text-xs rounded-md font-medium rounded-xl">
                            Alteration
                          </span>
                        )}
                        {stage.key === 'completed' && (
                          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-md font-medium rounded-xl">
                            Send To <ChevronDown size={18} />
                          </span>
                        )}
                        {stage.key === 'newArrival' && !isRejected && !isAltered && (
                          <span className="absolute top-3 right-3 inline-block px-3 py-1 bg-gray-500 text-white text-xs rounded-md font-medium">
                            Closed
                          </span>
                        )}

                        {/* Material Name */}
                        <h4 className="font-semibold text-gray-900 mb-3 pr-20">
                          {item.sub_batch.name}
                        </h4>

                        {/* Start Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-xs">Start: {formatDate(item.sub_batch.start_date)}</span>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
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
          taskData={selectedItem ? {
            id: selectedItem.id,
            roll_name: selectedItem.sub_batch?.batch?.name || 'Roll 1',
            batch_name: selectedItem.sub_batch?.batch?.name || 'Batch B',
            sub_batch_name: selectedItem.sub_batch?.name || '-',
            total_quantity: selectedItem.quantity_remaining ?? selectedItem.sub_batch?.estimated_pieces ?? 0,
            estimated_start_date: selectedItem.sub_batch?.start_date || '',
            due_date: selectedItem.sub_batch?.due_date || '',
            status: selectedItem.stage || 'NEW_ARRIVAL',
            sent_from_department: selectedItem.alteration_source?.from_department_name || selectedItem.department?.name || 'Department 1',
            alteration_date: new Date().toISOString(),
            altered_by: selectedItem.alteration_source?.from_department_name || 'Department Worker',
            altered_quantity: selectedItem.alteration_source?.quantity ?? selectedItem.quantity_remaining ?? 0,
            alteration_reason: selectedItem.alteration_source?.reason || 'Alteration required',
            attachments: selectedItem.sub_batch?.attachments?.map((att: Attachment) => ({
              name: att.attachment_name,
              count: att.quantity
            })) || [],
            quantity_remaining: selectedItem.quantity_remaining
          } : {} as any}
          onStageChange={fetchKanbanData}
        />
      ) : isRejectedTask ? (
        <RejectedTaskDetailsModal
          isOpen={isTaskDetailsOpen}
          onClose={closeTaskDetails}
          taskData={selectedItem ? {
            id: selectedItem.id,
            roll_name: selectedItem.sub_batch?.batch?.name || 'Roll 1',
            batch_name: selectedItem.sub_batch?.batch?.name || 'Batch B',
            sub_batch_name: selectedItem.sub_batch?.name || '-',
            total_quantity: selectedItem.quantity_remaining ?? selectedItem.sub_batch?.estimated_pieces ?? 0,
            estimated_start_date: selectedItem.sub_batch?.start_date || '',
            due_date: selectedItem.sub_batch?.due_date || '',
            status: selectedItem.stage || 'NEW_ARRIVAL',
            sent_from_department: selectedItem.rejection_source?.from_department_name || selectedItem.department?.name || 'Department 1',
            rejection_date: new Date().toISOString(),
            rejected_by: selectedItem.rejection_source?.from_department_name || 'Department Worker',
            rejected_quantity: selectedItem.rejection_source?.quantity ?? selectedItem.quantity_remaining ?? 0,
            rejection_reason: selectedItem.rejection_source?.reason || 'Quality issue',
            attachments: selectedItem.sub_batch?.attachments?.map((att: Attachment) => ({
              name: att.attachment_name,
              count: att.quantity
            })) || [],
            quantity_remaining: selectedItem.quantity_remaining
          } : {} as any}
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