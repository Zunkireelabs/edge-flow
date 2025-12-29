"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown, Check, ArrowUpDown, Inbox } from 'lucide-react';
import axios from 'axios';
import { formatNepaliDate } from '@/app/utils/dateUtils';

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

interface FilterOption {
  value: string;
  label: string;
  description?: string;
}

// Custom Filter Dropdown Component
const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
  searchable = true,
  icon,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  icon?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || label;

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isActive = value !== "all";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-all duration-200 ${
          isActive
            ? "border-[#2272B4] bg-blue-50 text-[#2272B4]"
            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
        }`}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="max-w-[120px] truncate">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#2272B4] focus:border-transparent"
                />
              </div>
            </div>
          )}
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2.5 ${
                    value === option.value ? "bg-blue-50" : ""
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    value === option.value ? "border-[#2272B4] bg-[#2272B4]" : "border-gray-300"
                  }`}>
                    {value === option.value && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${value === option.value ? "text-[#2272B4]" : "text-gray-900"}`}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const initialColumns: Column[] = [
  { id: 'new-arrivals', title: 'New Arrivals', tasks: [] },
  { id: 'in-progress', title: 'In Progress', tasks: [] },
  { id: 'completed', title: 'Completed', tasks: [] }
];

export default function DepartmentWorkloadView() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | 'all'>('all');
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/departments`);
        setDepartments(response.data);
      } catch {
        // Departments fetch failed
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [API]);

  // Load tasks for selected department
  useEffect(() => {
    const fetchDepartmentTasks = async () => {
      if (selectedDepartmentId === 'all') {
        // Fetch tasks from all departments
        try {
          const token = localStorage.getItem("token");
          const allTasks: { newArrival: Task[], inProgress: Task[], completed: Task[] } = {
            newArrival: [],
            inProgress: [],
            completed: []
          };

          // Fetch from each department
          await Promise.all(departments.map(async (dept) => {
            try {
              const response = await axios.get(
                `${API}/departments/${dept.id}/sub-batches`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const kanbanData = response.data.data;

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const transformToTask = (dsb: any): Task => {
                const subBatch = dsb.sub_batch;
                let priority: 'urgent' | 'at-risk' | undefined = undefined;
                if (subBatch?.due_date) {
                  const dueDate = new Date(subBatch.due_date);
                  const today = new Date();
                  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  if (daysUntilDue < 0) priority = 'urgent';
                  else if (daysUntilDue <= 3) priority = 'at-risk';
                }

                let status: 'new-arrivals' | 'in-progress' | 'completed' = 'new-arrivals';
                if (dsb.stage === 'COMPLETED') status = 'completed';
                else if (dsb.stage === 'IN_PROGRESS') status = 'in-progress';

                return {
                  id: `${dept.id}-${dsb.id}`,
                  title: subBatch?.name || 'Untitled Task',
                  startDate: formatNepaliDate(subBatch?.start_date),
                  dueDate: formatNepaliDate(subBatch?.due_date),
                  batch: subBatch?.batch?.name || 'No Batch',
                  priority,
                  status
                };
              };

              (kanbanData.newArrival || []).forEach((dsb: any) => allTasks.newArrival.push(transformToTask(dsb)));
              (kanbanData.inProgress || []).forEach((dsb: any) => allTasks.inProgress.push(transformToTask(dsb)));
              (kanbanData.completed || []).forEach((dsb: any) => allTasks.completed.push(transformToTask(dsb)));
            } catch {
              // Failed to fetch tasks for this department
            }
          }));

          setColumns([
            { id: 'new-arrivals', title: 'New Arrivals', tasks: allTasks.newArrival },
            { id: 'in-progress', title: 'In Progress', tasks: allTasks.inProgress },
            { id: 'completed', title: 'Completed', tasks: allTasks.completed }
          ]);
        } catch {
          setColumns(initialColumns);
        }
      } else {
        // Fetch tasks for specific department
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${API}/departments/${selectedDepartmentId}/sub-batches`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const kanbanData = response.data.data;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transformToTask = (dsb: any): Task => {
            const subBatch = dsb.sub_batch;
            let priority: 'urgent' | 'at-risk' | undefined = undefined;
            if (subBatch?.due_date) {
              const dueDate = new Date(subBatch.due_date);
              const today = new Date();
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (daysUntilDue < 0) priority = 'urgent';
              else if (daysUntilDue <= 3) priority = 'at-risk';
            }

            let status: 'new-arrivals' | 'in-progress' | 'completed' = 'new-arrivals';
            if (dsb.stage === 'COMPLETED') status = 'completed';
            else if (dsb.stage === 'IN_PROGRESS') status = 'in-progress';

            return {
              id: dsb.id.toString(),
              title: subBatch?.name || 'Untitled Task',
              startDate: formatNepaliDate(subBatch?.start_date),
              dueDate: formatNepaliDate(subBatch?.due_date),
              batch: subBatch?.batch?.name || 'No Batch',
              priority,
              status
            };
          };

          setColumns([
            { id: 'new-arrivals', title: 'New Arrivals', tasks: (kanbanData.newArrival || []).map(transformToTask) },
            { id: 'in-progress', title: 'In Progress', tasks: (kanbanData.inProgress || []).map(transformToTask) },
            { id: 'completed', title: 'Completed', tasks: (kanbanData.completed || []).map(transformToTask) }
          ]);
        } catch {
          setColumns(initialColumns);
        }
      }
    };

    if (departments.length > 0 || selectedDepartmentId !== 'all') {
      fetchDepartmentTasks();
    }
  }, [selectedDepartmentId, departments, API]);

  // Calculate department task counts
  const departmentTaskCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    departments.forEach(dept => {
      counts[dept.id] = dept.active_tasks || 0;
    });
    return counts;
  }, [departments]);

  // Get total task count
  const totalTaskCount = useMemo(() => {
    return columns.reduce((sum, col) => sum + col.tasks.length, 0);
  }, [columns]);

  // Filter and sort tasks
  const filteredColumns = useMemo(() => {
    return columns.map(column => {
      let tasks = [...column.tasks];

      // Search filter
      if (searchQuery) {
        tasks = tasks.filter(task =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.batch.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        tasks = tasks.filter(task => {
          if (priorityFilter === 'urgent') return task.priority === 'urgent';
          if (priorityFilter === 'at-risk') return task.priority === 'at-risk';
          if (priorityFilter === 'normal') return !task.priority;
          return true;
        });
      }

      // Sort
      if (sortBy === 'newest') {
        // Keep original order (newest first from API)
      } else if (sortBy === 'oldest') {
        tasks = tasks.reverse();
      } else if (sortBy === 'name-asc') {
        tasks = tasks.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'name-desc') {
        tasks = tasks.sort((a, b) => b.title.localeCompare(a.title));
      }

      return { ...column, tasks };
    });
  }, [columns, searchQuery, priorityFilter, sortBy]);

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
          return { ...column, tasks: column.tasks.filter(task => task.id !== draggedTask.id) };
        } else if (column.id === targetColumnId) {
          return { ...column, tasks: [...column.tasks, { ...draggedTask, status: targetColumnId as Task['status'] }] };
        }
        return column;
      });
    });

    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const getColumnStyle = (columnId: string) => {
    switch (columnId) {
      case 'new-arrivals':
        return { dotColor: 'bg-gray-400', headerBg: 'bg-gray-50' };
      case 'in-progress':
        return { dotColor: 'bg-blue-500', headerBg: 'bg-blue-50' };
      case 'completed':
        return { dotColor: 'bg-green-500', headerBg: 'bg-green-50' };
      default:
        return { dotColor: 'bg-gray-400', headerBg: 'bg-gray-50' };
    }
  };

  // Filter options
  const priorityOptions: FilterOption[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent', description: 'Overdue tasks' },
    { value: 'at-risk', label: 'At Risk', description: 'Due within 3 days' },
    { value: 'normal', label: 'Normal', description: 'On track' },
  ];

  const sortOptions: FilterOption[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <h1 className="text-sm font-bold text-gray-900">Department Kanban</h1>
        </div>

        {/* Department Tabs - Jira Style */}
        <div className="px-6">
          <div className="flex items-center gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {/* All Departments Tab */}
            <button
              onClick={() => setSelectedDepartmentId('all')}
              className={`relative py-3 text-sm font-medium transition-all whitespace-nowrap ${
                selectedDepartmentId === 'all'
                  ? 'text-[#2272B4]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({totalTaskCount})
              {selectedDepartmentId === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2272B4] rounded-full" />
              )}
            </button>

            {/* Department Tabs */}
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartmentId(dept.id)}
                className={`relative py-3 text-sm font-medium transition-all whitespace-nowrap ${
                  selectedDepartmentId === dept.id
                    ? 'text-[#2272B4]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {dept.name} ({departmentTaskCounts[dept.id] || 0})
                {selectedDepartmentId === dept.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2272B4] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2272B4] focus:border-transparent"
            />
          </div>

          {/* Priority Filter */}
          <FilterDropdown
            label="All Priorities"
            options={priorityOptions}
            value={priorityFilter}
            onChange={setPriorityFilter}
            searchable={false}
          />

          {/* Sort */}
          <FilterDropdown
            label="Sort"
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
            searchable={false}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          />

          {/* Results count */}
          <div className="ml-auto text-sm text-gray-500">
            {filteredColumns.reduce((sum, col) => sum + col.tasks.length, 0)} tasks
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#2272B4] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500">Loading departments...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredColumns.map((column) => {
              const { dotColor, headerBg } = getColumnStyle(column.id);

              return (
                <div
                  key={column.id}
                  className="bg-gray-100 rounded-xl overflow-hidden"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column Header */}
                  <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg mx-3 mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></div>
                        <span className="text-sm font-semibold text-gray-800">{column.title}</span>
                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                          {column.tasks.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cards Container */}
                  <div className="p-3 space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto">
                    {column.tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Inbox className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No tasks</p>
                      </div>
                    ) : (
                      column.tasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task, column.id)}
                          className="bg-white rounded-lg p-4 cursor-move hover:shadow-md transition-all duration-200 border border-gray-200"
                        >
                          {/* Task Header */}
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-[#2272B4] text-sm leading-snug">
                              {task.title}
                            </h4>
                            {task.priority && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0 ml-2 ${
                                task.priority === 'urgent'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {task.priority === 'urgent' ? '!' : '⚠'} {task.priority === 'urgent' ? 'Overdue' : 'At Risk'}
                              </span>
                            )}
                          </div>

                          {/* Info Lines */}
                          <div className="space-y-1 text-xs text-gray-600">
                            <p>Batch: {task.batch}</p>
                            <p>Due date: {task.dueDate}</p>
                            <p>Start date: {task.startDate}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
