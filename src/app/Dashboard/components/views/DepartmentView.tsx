import React, { useState } from 'react';
import { Calendar, Filter, ChevronDown } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  startDate: string;
  dueDate: string;
  batch: string;
  priority?: 'urgent' | 'at-risk';
  sentToDepartment?: string;  // Department name where this was sent
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const initialData: Column[] = [
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    tasks: [
      {
        id: '1',
        title: 'Linen Sets',
        startDate: 'Aug 15, 2024',
        dueDate: 'Aug 29, 2024',
        batch: 'Batch Batch 1'
      },
      {
        id: '2',
        title: 'Linen Sets',
        startDate: 'Aug 15, 2024',
        dueDate: 'Aug 29, 2024',
        batch: 'Batch Batch 1',
        priority: 'urgent'
      },
      {
        id: '3',
        title: 'Linen Sets',
        startDate: 'Aug 15, 2024',
        dueDate: 'Aug 20, 2024',
        batch: 'Batch Batch 1',
        priority: 'at-risk'
      }
    ]
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    tasks: [
      {
        id: '4',
        title: 'Cotton Blend',
        startDate: 'Aug 10, 2024',
        dueDate: 'Aug 24, 2024',
        batch: 'Batch Batch 2'
      }
    ]
  },
  {
    id: 'completed',
    title: 'Completed',
    tasks: [
      {
        id: '5',
        title: 'Wool Cashmere',
        startDate: 'Aug 12, 2024',
        dueDate: 'Aug 26, 2024',
        batch: 'Batch Batch 3',
        sentToDepartment: 'Stitching Department'  // Example: Shows which department this was sent to
      }
    ]
  }
];

const departments = [
  { id: 1, name: 'Department 1', count: 8 },
  { id: 2, name: 'Department 2', count: 12 },
  { id: 3, name: 'Department 3', count: 5 },
  { id: 4, name: 'Department 4', count: 3 }
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialData);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Department 1');

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
          // Remove task from source column
          return {
            ...column,
            tasks: column.tasks.filter(task => task.id !== draggedTask.id)
          };
        } else if (column.id === targetColumnId) {
          // Add task to target column
          return {
            ...column,
            tasks: [...column.tasks, draggedTask]
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex gap-6">
        {/* Main Kanban Board */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Department View</h1>
            <p className="text-sm text-gray-600 mb-4">Manage tasks across departments</p>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50">
                <Filter size={16} />
                Sort By
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <div
                key={column.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{column.title}</h3>
                    <span className="text-sm text-gray-500">{column.tasks.length} items</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 min-h-[400px]">
                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task, column.id)}
                      className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow relative"
                    >
                      {task.priority && (
                        <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityText(task.priority)}
                        </div>
                      )}

                      <h4 className="font-medium text-gray-900 mb-2">
                        {task.title}
                        {task.sentToDepartment && (
                          <span className="block text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded mt-1 w-fit">
                            → Sent to: {task.sentToDepartment}
                          </span>
                        )}
                      </h4>

                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Start: {task.startDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Due: {task.dueDate}</span>
                        </div>
                        <div className="text-gray-500 mt-2">
                          {task.batch}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {column.tasks.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Sidebar */}
        <div className="w-64">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Sort By</h3>
            <div className="space-y-2 mb-6">
              <label className="flex items-center text-sm">
                <input type="radio" name="sort" className="mr-2" />
                Start Date
              </label>
              <label className="flex items-center text-sm">
                <input type="radio" name="sort" className="mr-2" defaultChecked />
                Due Date
              </label>
            </div>

            <h3 className="font-medium text-gray-900 mb-4">Department</h3>
            <div className="space-y-2">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.name)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedDepartment === dept.name
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{dept.name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {dept.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}