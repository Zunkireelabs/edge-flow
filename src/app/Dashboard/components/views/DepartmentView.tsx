"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Search, Building2 } from 'lucide-react';
import axios from 'axios';

interface Task {
  id: string;
  title: string;
  startDate: string;
  dueDate: string;
  batch: string;
  priority?: 'urgent' | 'at-risk';
  status: 'new-arrivals' | 'in-progress' | 'completed';
}

interface Department {
  id: number;
  name: string;
  description?: string;
  worker_count?: number;
  active_tasks?: number;
  status?: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const initialColumns: Column[] = [
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    tasks: []
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    tasks: []
  },
  {
    id: 'completed',
    title: 'Completed',
    tasks: []
  }
];

// Mock task data - replace with actual API data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Linen Sets',
    startDate: 'Aug 15, 2024',
    dueDate: 'Aug 29, 2024',
    batch: 'Batch 1',
    status: 'new-arrivals'
  },
  {
    id: '2',
    title: 'Linen Sets',
    startDate: 'Aug 15, 2024',
    dueDate: 'Aug 29, 2024',
    batch: 'Batch 1',
    priority: 'urgent',
    status: 'new-arrivals'
  },
  {
    id: '3',
    title: 'Linen Sets',
    startDate: 'Aug 15, 2024',
    dueDate: 'Aug 20, 2024',
    batch: 'Batch 1',
    priority: 'at-risk',
    status: 'new-arrivals'
  },
  {
    id: '4',
    title: 'Cotton Blend',
    startDate: 'Aug 10, 2024',
    dueDate: 'Aug 24, 2024',
    batch: 'Batch 2',
    status: 'in-progress'
  },
  {
    id: '5',
    title: 'Wool Cashmere',
    startDate: 'Aug 12, 2024',
    dueDate: 'Aug 26, 2024',
    batch: 'Batch 3',
    status: 'completed'
  }
];

export default function DepartmentWorkloadView() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/departments`);
        setDepartments(response.data);

        // Auto-select first department
        if (response.data.length > 0) {
          setSelectedDepartment(response.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [API]);

  // Load tasks for selected department
  useEffect(() => {
    if (selectedDepartment) {
      const fetchDepartmentTasks = async () => {
        try {
          // Get auth token from localStorage
          const token = localStorage.getItem("token");

          // Fetch sub-batches for this department
          const response = await axios.get(
            `${API}/departments/${selectedDepartment.id}/sub-batches`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Backend returns { success: true, data: { newArrival: [], inProgress: [], completed: [] } }
          const kanbanData = response.data.data;

          // Helper function to transform department_sub_batch to Task format
          const transformToTask = (dsb: any): Task => {
            const subBatch = dsb.sub_batch;

            // Determine priority based on due date
            let priority: 'urgent' | 'at-risk' | undefined = undefined;
            if (subBatch?.due_date) {
              const dueDate = new Date(subBatch.due_date);
              const today = new Date();
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              if (daysUntilDue < 0) {
                priority = 'urgent'; // Overdue
              } else if (daysUntilDue <= 3) {
                priority = 'at-risk'; // Due soon
              }
            }

            // Map stage to kanban status
            let status: 'new-arrivals' | 'in-progress' | 'completed' = 'new-arrivals';
            if (dsb.stage === 'COMPLETED') {
              status = 'completed';
            } else if (dsb.stage === 'IN_PROGRESS') {
              status = 'in-progress';
            } else if (dsb.stage === 'NEW_ARRIVAL') {
              status = 'new-arrivals';
            }

            return {
              id: dsb.id.toString(),
              title: subBatch?.name || 'Untitled Task',
              startDate: subBatch?.start_date ? new Date(subBatch.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
              dueDate: subBatch?.due_date ? new Date(subBatch.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
              batch: subBatch?.batch?.name || 'No Batch',
              priority,
              status
            };
          };

          // Transform each kanban column's data
          const newColumns: Column[] = [
            {
              id: 'new-arrivals',
              title: 'New Arrivals',
              tasks: (kanbanData.newArrival || []).map(transformToTask)
            },
            {
              id: 'in-progress',
              title: 'In Progress',
              tasks: (kanbanData.inProgress || []).map(transformToTask)
            },
            {
              id: 'completed',
              title: 'Completed',
              tasks: (kanbanData.completed || []).map(transformToTask)
            }
          ];

          setColumns(newColumns);
        } catch (error) {
          console.error("Failed to fetch department tasks:", error);
          // Fall back to empty columns on error
          setColumns(initialColumns);
        }
      };

      fetchDepartmentTasks();
    }
  }, [selectedDepartment, API]);

  const handleDragStart = (e: React.DragEvent, task: Task, columnId: string) => {
    setDraggedTask(task);
    setDraggedFrom(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();

    if (!draggedTask || !draggedFrom || draggedFrom === targetColumnId) {
      setDraggedTask(null);
      setDraggedFrom(null);
      return;
    }

    setColumns(prevColumns => {
      return prevColumns.map(column => {
        if (column.id === draggedFrom) {
          return {
            ...column,
            tasks: column.tasks.filter(task => task.id !== draggedTask.id)
          };
        } else if (column.id === targetColumnId) {
          return {
            ...column,
            tasks: [...column.tasks, { ...draggedTask, status: targetColumnId as any }]
          };
        }
        return column;
      });
    });

    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'at-risk':
        return 'bg-gray-500 text-white';
      default:
        return '';
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'URGENT';
      case 'at-risk':
        return 'At Risk';
      default:
        return '';
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get column status icon and color
  const getColumnIcon = (columnId: string) => {
    switch (columnId) {
      case 'new-arrivals':
        return { icon: '📥', color: 'text-gray-600', bgColor: 'bg-gray-100', dotColor: 'bg-gray-500' };
      case 'in-progress':
        return { icon: '▶️', color: 'text-blue-600', bgColor: 'bg-blue-100', dotColor: 'bg-blue-500' };
      case 'completed':
        return { icon: '✓', color: 'text-green-600', bgColor: 'bg-green-100', dotColor: 'bg-green-500' };
      default:
        return { icon: '●', color: 'text-gray-600', bgColor: 'bg-gray-100', dotColor: 'bg-gray-500' };
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Filter Sidebar */}
      <div
        className={`bg-white shadow flex-shrink-0 border-r border-gray-200 min-h-screen overflow-y-auto transition-all duration-300 ease-in-out ${
          filterSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'
        }`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="py-4 border-b border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-3" style={{ letterSpacing: '-0.01em' }}>
              Select Department
            </h4>
            <p className="text-xs text-gray-600">
              Choose a department to view its workload
            </p>
          </div>

          {/* Search */}
          <div className="py-4 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Departments</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Department List */}
          <div className="py-4">
            <div className="space-y-1.5">
              {loading ? (
                <div className="text-center text-gray-500 text-sm py-4">Loading...</div>
              ) : filteredDepartments.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-4">No departments found</div>
              ) : (
                filteredDepartments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`w-full flex items-center justify-between text-left py-2.5 px-4 rounded-xl transition-all ${
                      selectedDepartment?.id === dept.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={16} />
                      <span className="text-sm font-medium">{dept.name}</span>
                    </div>
                    {dept.active_tasks !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedDepartment?.id === dept.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {dept.active_tasks}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="py-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Department Stats</h4>
            {selectedDepartment && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Workers:</span>
                  <span className="font-medium text-gray-900">{selectedDepartment.worker_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Tasks:</span>
                  <span className="font-medium text-gray-900">{selectedDepartment.active_tasks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    selectedDepartment.status === 'active' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {selectedDepartment.status || 'active'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 py-6 px-6 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                title={filterSidebarOpen ? "Hide filters" : "Show filters"}
              >
                {filterSidebarOpen ? (
                  <ChevronLeft size={20} className="text-gray-600" />
                ) : (
                  <ChevronRight size={20} className="text-gray-600" />
                )}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                  Kanban Board
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDepartment
                    ? `${selectedDepartment.name} - Manage tasks with visual workflow`
                    : 'Select a department to view its workload'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="p-6 bg-gray-50">
          {!selectedDepartment ? (
            <div className="flex items-center justify-center h-96 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Building2 size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">No department selected</p>
                <p className="text-sm text-gray-500 mt-1">Select a department from the sidebar to view its workload</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {columns.map((column) => {
                const { icon, color, bgColor, dotColor } = getColumnIcon(column.id);

                return (
                  <div
                    key={column.id}
                    className="bg-gray-50 rounded-xl"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    {/* Column Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                        <span className="text-sm font-semibold text-gray-700">{column.title}</span>
                        <span className="text-xs text-gray-500 font-medium">{column.tasks.length}</span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                          <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                          <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>

                    {/* Cards Container */}
                    <div className="px-3 pb-3 space-y-3 min-h-[500px]">
                      {column.tasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task, column.id)}
                          className="bg-white rounded-lg p-4 cursor-move hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 group"
                        >
                          {/* Task Header */}
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">TASK-{task.id}</span>
                            {task.priority && (
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1 ${
                                task.priority === 'urgent'
                                  ? 'bg-red-50 text-red-600 border border-red-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}>
                                {task.priority === 'urgent' ? '↑' : '−'} {getPriorityText(task.priority)}
                              </span>
                            )}
                          </div>

                          {/* Task Title */}
                          <h4 className="font-semibold text-gray-900 mb-3 text-base leading-snug">{task.title}</h4>

                          {/* Task Meta Info */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Calendar size={13} className="text-gray-400" />
                              <span>{task.startDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar size={13} className="text-red-400" />
                              <span className="text-red-600 font-medium">{task.dueDate}</span>
                            </div>
                          </div>

                          {/* Batch Tag */}
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium border border-gray-200">
                              {task.batch}
                            </span>
                          </div>

                          {/* Footer - Avatar & Stats */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              {/* Avatar placeholder */}
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                                {task.title.charAt(0)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Attachment icon */}
                              <div className="flex items-center gap-1 text-gray-500">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                                  <path d="M14 10V12.5C14 13.88 12.88 15 11.5 15H4.5C3.12 15 2 13.88 2 12.5V3.5C2 2.12 3.12 1 4.5 1H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                  <path d="M14 1V6M14 1H9M14 1L8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span className="text-xs font-medium">1</span>
                              </div>
                              {/* Comment icon */}
                              <div className="flex items-center gap-1 text-gray-500">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                                  <path d="M14 10.5C14 11.3284 13.3284 12 12.5 12H4.5L2 14.5V3.5C2 2.67157 2.67157 2 3.5 2H12.5C13.3284 2 14 2.67157 14 3.5V10.5Z" stroke="currentColor" strokeWidth="1.5"/>
                                </svg>
                                <span className="text-xs font-medium">2</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Task Button */}
                      <button className="w-full p-3 text-sm text-gray-500 hover:text-gray-700 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors bg-white hover:bg-gray-50">
                        + Add task
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
