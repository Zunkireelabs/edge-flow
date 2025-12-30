"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Building2 } from 'lucide-react';
import AddWorkerModal from '../../depcomponents/AddWorkerModal';
import { useToast } from '@/app/Components/ToastContext';
import { useDepartment } from '../../contexts/DepartmentContext';

interface Worker {
  id: number;
  name: string;
  pan: string;
  address: string;
  department_id: number | null;
  wage_type: string;
  wage_rate: number;
  department?: {
    id: number;
    name: string;
  };
}

const Worker = () => {
  const { showToast, showConfirm } = useToast();
  const { selectedDepartmentId, isSuperSupervisor, departments } = useDepartment();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [supervisorDepartmentId, setSupervisorDepartmentId] = useState<number | null>(null);

  // Get supervisor's department ID from localStorage
  useEffect(() => {
    const departmentId = localStorage.getItem("departmentId");
    if (departmentId) {
      setSupervisorDepartmentId(parseInt(departmentId, 10));
    }
  }, []);

  const fetchWorkers = useCallback(async () => {
    // Determine target department ID
    const targetDeptId = isSuperSupervisor
      ? (typeof selectedDepartmentId === 'number' ? selectedDepartmentId : null)
      : supervisorDepartmentId;

    // For SUPER_SUPERVISOR with "all" selected - fetch workers from all departments
    if (isSuperSupervisor && selectedDepartmentId === "all") {
      try {
        setLoading(true);
        // Fetch workers from all departments in parallel
        const departmentPromises = departments.map(async (dept) => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/department/${dept.id}`);
            if (res.ok) {
              return await res.json();
            }
            return [];
          } catch {
            return [];
          }
        });

        const results = await Promise.all(departmentPromises);
        const allWorkers = results.flat();
        setWorkers(allWorkers);
      } catch {
        showToast('error', 'Error fetching workers');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fetch workers for a specific department
    if (!targetDeptId) {
      return;
    }

    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/workers/department/${targetDeptId}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      } else {
        showToast('error', 'Failed to fetch workers for this department');
      }
    } catch {
      showToast('error', 'Error fetching workers');
    } finally {
      setLoading(false);
    }
  }, [isSuperSupervisor, selectedDepartmentId, supervisorDepartmentId, departments, showToast]);

  // Fetch workers when department ID is available or selection changes
  useEffect(() => {
    if (isSuperSupervisor) {
      // For SUPER_SUPERVISOR, always fetch based on selection
      fetchWorkers();
    } else if (supervisorDepartmentId) {
      // For regular SUPERVISOR, fetch when department ID is set
      fetchWorkers();
    }
  }, [isSuperSupervisor, selectedDepartmentId, supervisorDepartmentId, fetchWorkers]);

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Delete Worker',
      message: 'Are you sure you want to delete this worker? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('success', 'Worker deleted successfully');
        fetchWorkers();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', `Failed to delete worker: ${err.message || 'Unknown error'}`);
      }
    } catch {
      showToast('error', 'Error deleting worker');
    }
  };

  const handleWorkerAdded = () => {
    fetchWorkers();
  };

  // Get department label for display
  const getDepartmentLabel = () => {
    if (isSuperSupervisor) {
      if (selectedDepartmentId === "all") {
        return "all departments";
      }
      const dept = departments.find(d => d.id === selectedDepartmentId);
      return dept?.name || "selected department";
    }
    return "your department";
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-blue-600" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Worker Management</h1>
            <p className="text-sm text-gray-500">Manage workers in {getDepartmentLabel()}</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Worker
        </button>
      </div>

      {/* All Departments Banner for SUPER_SUPERVISOR */}
      {isSuperSupervisor && selectedDepartmentId === "all" && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-purple-900">Viewing All Departments</p>
            <p className="text-xs text-purple-700">Showing workers across {departments.length} departments ({workers.length} total workers)</p>
          </div>
        </div>
      )}

      

      {/* Workers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading workers...</div>
        ) : workers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No workers assigned to your department yet.</p>
            <p className="text-sm mt-2">Click &quot;Add Worker&quot; to assign workers to your department.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    PAN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Wage Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Wage Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {worker.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {worker.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {worker.pan}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {worker.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {worker.department ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {worker.department.name}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {worker.wage_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ₹{worker.wage_rate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit worker"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(worker.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete worker"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Worker Modal */}
      <AddWorkerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleWorkerAdded}
      />
    </div>
  );
};

export default Worker;
