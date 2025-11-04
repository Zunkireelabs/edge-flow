/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
} from "lucide-react";
import TaskDetailsModal from "../../depcomponents/TaskDetailsModal";
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
  size_details?: SizeDetail[];
  attachments?: Attachment[];
  batch?: Batch;
}

interface Department {
  id: number;
  name: string;
  remarks: string;
}

interface WorkItem {
  id: number;
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
}

interface KanbanData {
  newArrival: WorkItem[];
  inProgress: WorkItem[];
  completed: WorkItem[];
}

const STAGES = [
  {
    key: 'newArrival',
    title: 'New Arrival',
    icon: AlertCircle,
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100 text-blue-800',
    count: 0
  },
  {
    key: 'inProgress',
    title: 'In Progress',
    icon: Clock,
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-100 text-yellow-800',
    count: 0
  },
  {
    key: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-100 text-green-800',
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
  const [supervisorDepartment, setSupervisorDepartment] = useState<string>('');
  const [currentSupervisorId, setCurrentSupervisorId] = useState<number>(0);

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status color based on days remaining
  const getStatusColor = (dueDate: string) => {
    const days = getDaysRemaining(dueDate);
    if (days < 0) return 'text-red-600 bg-red-100';
    if (days <= 2) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GET_SUBBATCH_SUPERVISOR}`,
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
      console.log("Supervisor kanban API response:", result);

      if (result.success && result.data) {
        setKanbanData(result.data);

        // Set supervisor department name from the first item if available
        const firstItem = result.data.newArrival[0] || result.data.inProgress[0] || result.data.completed[0];
        if (firstItem?.department?.name) {
          setSupervisorDepartment(firstItem.department.name);
        }
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

  // Handle item click to open task details
  const handleItemClick = (item: WorkItem) => {
    console.log('Selected item:', item);
    console.log('Current supervisor ID:', currentSupervisorId);
    setSelectedItem(item);
    setIsTaskDetailsOpen(true);
  };

  // Close task details modal
  const closeTaskDetails = () => {
    setIsTaskDetailsOpen(false);
    setSelectedItem(null);
  };

  // Update stages with current counts
  const updatedStages = STAGES.map(stage => ({
    ...stage,
    count: kanbanData[stage.key as keyof KanbanData]?.length || 0
  }));

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
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Production Dashboard</h2>
          <p className="text-gray-500">Track sub-batches through production stages</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow ">
            <span className="text-sm text-gray-500">Department:</span>
            <span className="ml-2 font-semibold">
              {supervisorDepartment || `D00${localStorage.getItem("departmentId")}`}
            </span>
          </div>
          <button
            onClick={fetchKanbanData}
            className=" text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {updatedStages.map((stage) => {
          const StageIcon = stage.icon;
          const items = kanbanData[stage.key as keyof KanbanData] || [];

          return (
            <div key={stage.key} className={`${stage.color} rounded-lg border-2 p-4`}>
              {/* Stage Header */}
              <div className={`${stage.headerColor} rounded-lg p-3 mb-4 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <StageIcon size={20} />
                  <h3 className="font-semibold">{stage.title}</h3>
                </div>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                  {stage.count}
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
                    const daysRemaining = getDaysRemaining(item.sub_batch.due_date);
                    const statusColor = getStatusColor(item.sub_batch.due_date);

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleItemClick(item)}
                      >
                        {/* Item Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 truncate">
                            {item.sub_batch.name}
                          </h4>
                          {item.assigned_worker_id && (
                            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              <User size={12} />
                              <span>Assigned</span>
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Package size={14} />
                            <span>{item.sub_batch.estimated_pieces.toLocaleString()} pieces</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span>{item.sub_batch.expected_items} items expected</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>Due: {formatDate(item.sub_batch.due_date)}</span>
                          </div>
                          {item.sub_batch.batch && (
                            <div className="flex items-center gap-2">
                              <Package size={14} />
                              <span>Batch: {item.sub_batch.batch.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {daysRemaining < 0
                              ? `${Math.abs(daysRemaining)} days overdue`
                              : daysRemaining === 0
                                ? 'Due today'
                                : `${daysRemaining} days remaining`
                            }
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={isTaskDetailsOpen}
        onClose={closeTaskDetails}
        taskData={selectedItem}
        currentSupervisorId={currentSupervisorId}
      />
    </div>
  );
};

export default SupervisorKanban;