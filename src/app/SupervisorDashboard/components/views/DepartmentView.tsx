/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  XCircle,
  Building2,
} from "lucide-react";
import TaskDetailsModal from "../../depcomponents/TaskDetailsModal";
import AlteredTaskDetailsModal from "../../depcomponents/altered/AlteredTaskDetailsModal";
import RejectedTaskDetailsModal from "../../depcomponents/rejected/RejectedTaskDetailsModal";
import Loader from "@/app/Components/Loader";
import { useToast } from "@/app/Components/ToastContext";
import { useDepartment } from "../../contexts/DepartmentContext";
import { formatNepaliDate } from "@/app/utils/dateUtils";

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
  created_at?: string;
}

interface AlterationSource {
  quantity: number;
  reason: string;
  from_department_id: number;
  from_department_name: string;
  created_at?: string;
}

interface WorkerLogRejectedEntry {
  quantity: number;
  reason?: string;
}

interface WorkerLog {
  id: number;
  worker_id: number;
  quantity_worked: number;
  work_date?: string;
  worker?: { id: number; name: string };
  rejected_entry?: WorkerLogRejectedEntry[];
  altered_entry?: { quantity: number; reason?: string }[];
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
  sent_from_department_name?: string | null;
  alter_reason?: string | null;
  reject_reason?: string | null;
  rejection_source?: RejectionSource | null;
  alteration_source?: AlterationSource | null;
  worker_logs?: WorkerLog[]; // Worker logs with rejection data
  // ✅ NEW: Totals for Kanban card display
  total_altered?: number;
  total_rejected?: number;
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
    color: 'bg-gray-100',
    headerColor: 'text-gray-800 font-semibold',
    badgeColor: 'bg-gray-100 text-gray-600 border border-gray-200',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    dotColor: 'bg-gray-400',
    count: 0
  },
  {
    key: 'inProgress',
    title: 'In Progress',
    icon: Clock,
    color: 'bg-gray-100',
    headerColor: 'text-gray-800 font-semibold',
    badgeColor: 'bg-gray-100 text-gray-600 border border-gray-200',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    dotColor: 'bg-blue-500',
    count: 0
  },
  {
    key: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    color: 'bg-gray-100',
    headerColor: 'text-gray-800 font-semibold',
    badgeColor: 'bg-gray-100 text-gray-600 border border-gray-200',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    dotColor: 'bg-green-500',
    count: 0
  }
];

const SupervisorKanban = () => {
  const { showToast } = useToast();
  const { selectedDepartmentId, isSuperSupervisor, departments } = useDepartment();
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
        showToast("error", "Authentication required. Please login again.");
        window.location.href = "/login";
        return;
      }

      // Allow both SUPERVISOR and SUPER_SUPERVISOR roles
      if (role !== "SUPERVISOR" && role !== "SUPER_SUPERVISOR") {
        showToast("error", "Access denied. This page is for supervisors only.");
        return;
      }

      // For SUPER_SUPERVISOR, check if a specific department is selected
      if (isSuperSupervisor && selectedDepartmentId === "all") {
        // Don't fetch - will show "select department" message
        setKanbanData({ newArrival: [], inProgress: [], completed: [] });
        setLoading(false);
        return;
      }

      // Set the current supervisor ID from localStorage or selected department
      const targetDeptId = isSuperSupervisor && typeof selectedDepartmentId === 'number'
        ? selectedDepartmentId
        : departmentId ? parseInt(departmentId, 10) : null;

      if (targetDeptId) {
        setCurrentSupervisorId(targetDeptId);
      }

      // Build API URL with departmentId query param for SUPER_SUPERVISOR
      let apiUrl = `${process.env.NEXT_PUBLIC_GET_SUBBATCH_SUPERVISOR}`;
      if (isSuperSupervisor && typeof selectedDepartmentId === 'number') {
        apiUrl += `?departmentId=${selectedDepartmentId}`;
      }

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
          showToast("error", "Session expired. Please login again.");
          localStorage.clear();
          window.location.href = "/login";
          return;
        }
        throw new Error(`Failed to fetch kanban data: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Handle requiresDepartmentSelection response from backend
        if (result.requiresDepartmentSelection) {
          setKanbanData({ newArrival: [], inProgress: [], completed: [] });
        } else {
          setKanbanData(result.data);
        }
      } else {
        throw new Error(result.message || 'API returned unsuccessful response');
      }
    } catch {
      showToast("error", "Failed to fetch work items. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperSupervisor, selectedDepartmentId]);

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
    // Check if this is an altered task - use alteration_source which persists
    // (remarks field changes to "Assigned" after worker assignment, but alteration_source stays)
    const isAltered = item.alteration_source !== null && item.alteration_source !== undefined;

    // Check if this is a rejected task - use rejection_source which persists
    // (remarks field changes to "Assigned" after worker assignment, but rejection_source stays)
    const isRejected = item.rejection_source !== null && item.rejection_source !== undefined;

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
      // ✅ Use alteration_source from backend for accurate department names
      sent_from_department: selectedItem.alteration_source?.from_department_name ||
                           selectedItem.sent_from_department_name ||
                           selectedItem.sent_from_department ||
                           'Unknown',
      // ✅ NEW: Pass source department ID for filtering "Send to Department" dropdown
      sent_from_department_id: selectedItem.alteration_source?.from_department_id || selectedItem.sent_from_department,
      alteration_date: selectedItem.alteration_source?.created_at || selectedItem.createdAt || new Date().toISOString(),
      // ✅ Use alteration_source for source department (where alteration happened)
      altered_by: selectedItem.alteration_source?.from_department_name || 'Unknown Department',
      altered_quantity: selectedItem.alteration_source?.quantity || selectedItem.quantity_received || 0,
      alter_reason: selectedItem.alteration_source?.reason || selectedItem.alter_reason || selectedItem.remarks || '',
      attachments: selectedItem.sub_batch?.attachments?.map((att: Attachment) => ({
        name: att.attachment_name,
        count: att.quantity
      })) || [],
      quantity_remaining: selectedItem.quantity_remaining,
      // ✅ NEW: Pass quantity_received (constant, doesn't change with work) for Production Summary
      quantity_received: selectedItem.quantity_received,
      sub_batch: selectedItem.sub_batch,
      original_quantity: selectedItem.sub_batch?.estimated_pieces,
      // ✅ Pass through alteration_source for enhanced UI
      alteration_source: selectedItem.alteration_source || null,
      // ✅ NEW: Pass current department info
      department: selectedItem.department,
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
      // ✅ Use rejection_source from backend for accurate department names
      sent_from_department: selectedItem.rejection_source?.from_department_name ||
                           selectedItem.sent_from_department_name ||
                           selectedItem.sent_from_department ||
                           'Unknown',
      rejection_date: selectedItem.rejection_source?.created_at || selectedItem.createdAt || new Date().toISOString(),
      // ✅ Use rejection_source for source department (where rejection happened)
      rejected_by: selectedItem.rejection_source?.from_department_name || 'Unknown Department',
      rejected_quantity: selectedItem.rejection_source?.quantity || selectedItem.quantity_remaining || 0,
      reject_reason: selectedItem.rejection_source?.reason || selectedItem.reject_reason || '',
      attachments: selectedItem.sub_batch?.attachments?.map((att: Attachment) => ({
        name: att.attachment_name,
        count: att.quantity
      })) || [],
      quantity_remaining: selectedItem.quantity_remaining,
      sub_batch: selectedItem.sub_batch,
      original_quantity: selectedItem.sub_batch?.estimated_pieces,
      // ✅ Pass through rejection_source for enhanced UI
      rejection_source: selectedItem.rejection_source || null,
    };
  }, [selectedItem]);

  // Memoize sorted kanban data for better performance
  const sortedKanbanData = useMemo(() => ({
    newArrival: sortItems(kanbanData.newArrival || []),
    inProgress: sortItems(kanbanData.inProgress || []),
    completed: sortItems(kanbanData.completed || [])
  }), [kanbanData, sortItems]);

  // Calculate total task count - must be before conditional returns
  const totalTaskCount = useMemo(() => {
    return (kanbanData.newArrival?.length || 0) + (kanbanData.inProgress?.length || 0) + (kanbanData.completed?.length || 0);
  }, [kanbanData]);

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

  // SUPER_SUPERVISOR with "All Departments" selected - show message to select a department
  if (isSuperSupervisor && selectedDepartmentId === "all") {
    return (
      <div className="p-8 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Department View</h2>
            <p className="text-gray-600 mt-2">Manage tasks across departments</p>
          </div>
        </div>

        {/* Select Department Message */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <Building2 className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Select a Department
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Please select a specific department from the dropdown above to view and manage tasks in the Kanban board.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {departments.map((dept) => (
                <span
                  key={dept.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {dept.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 relative">
      {/* Overlay loader for refreshing data */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader loading={true} message="Refreshing data..."/>
        </div>
      )}

      {/* Header - Admin Style */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Department View</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tasks across departments</p>
        </div>
      </div>

      {/* Filter Bar - Admin Style */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-end gap-3 relative sort-menu-container">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:border-gray-400 bg-white text-gray-600 transition-colors"
          >
            <span>↑↓</span> Sort by
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Sort Dropdown Menu */}
          {showSortMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={() => handleSortChange('name')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg transition-colors ${
                  sortBy === 'name' ? 'bg-blue-50 text-[#2272B4] font-medium' : 'text-gray-700'
                }`}
              >
                Name
              </button>
              <button
                onClick={() => handleSortChange('startDate')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  sortBy === 'startDate' ? 'bg-blue-50 text-[#2272B4] font-medium' : 'text-gray-700'
                }`}
              >
                Start Date
              </button>
              <button
                onClick={() => handleSortChange('dueDate')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg transition-colors ${
                  sortBy === 'dueDate' ? 'bg-blue-50 text-[#2272B4] font-medium' : 'text-gray-700'
                }`}
              >
                Due Date
              </button>
            </div>
          )}

          {/* Task count */}
          <span className="text-sm text-gray-500">{totalTaskCount} tasks</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {updatedStages.map((stage) => {
            const items = sortedKanbanData[stage.key as keyof KanbanData] || [];
            const Icon = stage.icon;

            return (
              <div key={stage.key} className={`${stage.color} rounded-xl overflow-hidden flex flex-col h-full`}>
                {/* Column Header - Admin Style */}
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg mx-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`}></div>
                      <div className={`p-1.5 rounded-lg ${stage.iconBg}`}>
                        <Icon className={`w-4 h-4 ${stage.iconColor}`} />
                      </div>
                      <h3 className={`${stage.headerColor} text-sm`}>{stage.title}</h3>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.badgeColor}`}>
                      {stage.count}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-3 space-y-2 flex-1 overflow-y-auto min-h-[400px] max-h-[600px]">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Package size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">No tasks</p>
                    </div>
                  ) : (
                  items.map((item) => {
                    // Determine if item is rejected or altered based on remarks
                    const isRejected = item.remarks?.toLowerCase().includes('reject') ?? false;
                    const isAlteredByRemarks = item.remarks?.toLowerCase().includes('alter') ?? false;
                    const isAssigned = item.remarks === 'Assigned';
                    const isNewArrival = stage.key === 'newArrival' && !isRejected && !isAlteredByRemarks && !isAssigned;

                    // Check if this is a rework card using alteration_source (persists even after worker assignment)
                    // This is more reliable than remarks which changes to "Assigned" after worker assignment
                    const isReworkCard = item.alteration_source !== null && item.alteration_source !== undefined;
                    const reworkQuantity = item.alteration_source?.quantity ?? 0;

                    // Get left border color based on stage and remarks
                    const getLeftBorderColor = () => {
                      if (isReworkCard) return 'border-l-amber-400';
                      if (isRejected) return 'border-l-red-400';
                      if (isAlteredByRemarks) return 'border-l-yellow-400';
                      if (stage.key === 'inProgress') return 'border-l-blue-400';
                      if (stage.key === 'completed') return 'border-l-green-400';
                      return 'border-l-gray-300';
                    };

                    return (
                      <div
                        key={item.id}
                        className={`relative rounded-lg p-4 border-l-4 border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer ${getLeftBorderColor()} ${
                          // Rework cards maintain amber styling even after assignment
                          isReworkCard && isAssigned
                            ? 'bg-amber-50'
                            : stage.key === 'inProgress' && !isRejected && !isAlteredByRemarks
                            ? 'bg-blue-50'
                            : stage.key === 'completed' && !isRejected && !isAlteredByRemarks && !isReworkCard
                            ? 'bg-green-50'
                            : getCardStyle(item.remarks)
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        {/* Status Badge - Top Right */}
                        <span className={`absolute top-3 right-3 inline-block px-3 py-1 text-xs rounded-md font-medium ${
                          // Rework cards show amber "Rework" badge even after assignment
                          isReworkCard && isAssigned
                            ? 'bg-amber-500 text-white'
                            : getBadgeColor(item.remarks)
                        }`}>
                          {isReworkCard && isAssigned ? 'Rework' : getBadgeText(item.remarks, isNewArrival)}
                        </span>

                        {/* Send To Badge - Bottom Right for Completed - Hide if sub-batch is finalized */}
                        {stage.key === 'completed' && item.sub_batch?.status !== 'COMPLETED' && (
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

                        {/* Quantity Display - Enterprise Style */}
                        <div className="mb-2 space-y-1">
                          {/* Remaining */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package size={14} className="text-gray-400" />
                            <span className="text-xs font-medium">
                              Remaining: {(item.quantity_remaining ?? item.sub_batch.estimated_pieces).toLocaleString()} pcs
                            </span>
                          </div>

                          {/* Processed - calculated from received - remaining - altered - rejected */}
                          {/* Note: For rework cards, total_altered/rejected don't apply - they track work from THIS card */}
                          {(() => {
                            const received = item.quantity_received ?? item.sub_batch.estimated_pieces;
                            const remaining = item.quantity_remaining ?? item.sub_batch.estimated_pieces;
                            // Rework cards don't have their own altered/rejected counts from THIS card
                            // total_altered/rejected only apply to source/main cards
                            const altered = isReworkCard ? 0 : (item.total_altered ?? 0);
                            const rejected = isReworkCard ? 0 : (item.total_rejected ?? 0);
                            // Processed = actual good work completed (excludes altered/rejected)
                            const processed = received - remaining - altered - rejected;
                            return processed > 0 ? (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle size={14} className="text-green-500" />
                                <span className="text-xs font-medium">
                                  Processed: {processed.toLocaleString()} pcs
                                </span>
                              </div>
                            ) : null;
                          })()}

                          {/* Altered - Only show if > 0 AND not a rework card */}
                          {/* Rework cards don't show altered count since they originated from alteration */}
                          {!isReworkCard && (item.total_altered ?? 0) > 0 && (
                            <div className="flex items-center gap-2 text-sm text-amber-600">
                              <RefreshCw size={14} className="text-amber-500" />
                              <span className="text-xs font-medium">
                                Altered: {item.total_altered?.toLocaleString()} pcs
                              </span>
                            </div>
                          )}

                          {/* Rejected - Only show if > 0 AND not a rework card */}
                          {/* Rework cards don't show rejected count since they weren't the source of rejection */}
                          {!isReworkCard && (item.total_rejected ?? 0) > 0 && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <XCircle size={14} className="text-red-500" />
                              <span className="text-xs font-medium">
                                Rejected: {item.total_rejected?.toLocaleString()} pcs
                              </span>
                            </div>
                          )}

                          {/* Rework Indicator - Show if this card originated from alteration */}
                          {isReworkCard && reworkQuantity > 0 && (
                            <div className="flex items-center gap-2 text-sm text-amber-600">
                              <RefreshCw size={14} className="text-amber-500" />
                              <span className="text-xs font-medium">
                                Rework: {reworkQuantity.toLocaleString()} pcs
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Start Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-xs">Start: {formatNepaliDate(item.sub_batch.start_date)}</span>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-xs">Due: {formatNepaliDate(item.sub_batch.due_date)}</span>
                        </div>

                        {/* Batch Info */}
                        {item.sub_batch.batch && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <Package size={12} className="text-gray-400" />
                            <span>Batch: {item.sub_batch.batch.name}</span>
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