"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import AddWorkerModal from '../../depcomponents/AddWorkerModal';

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

  const fetchWorkers = async () => {
    if (!supervisorDepartmentId) {
      console.log('❌ Worker View: No supervisorDepartmentId found');
      return;
    }

    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/workers/department/${supervisorDepartmentId}`;
      console.log('🔍 Worker View: Fetching workers from:', url);
      console.log('📋 Worker View: Department ID:', supervisorDepartmentId);

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Worker View: Received workers:', data);
        console.log('📊 Worker View: Number of workers:', data.length);
        setWorkers(data);
      } else {
        console.error('❌ Worker View: API returned error status:', res.status);
        const errorText = await res.text();
        console.error('❌ Worker View: Error response:', errorText);
        alert('Failed to fetch workers for your department');
      }
    } catch (e) {
      console.error('❌ Worker View: Exception:', e);
      alert('Error fetching workers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch workers when department ID is available
  useEffect(() => {
    if (supervisorDepartmentId) {
      fetchWorkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supervisorDepartmentId]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this worker?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Worker deleted successfully');
        fetchWorkers();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to delete worker: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting worker');
    }
  };

  const handleWorkerAdded = () => {
    fetchWorkers();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-blue-600" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Worker Management</h1>
            <p className="text-sm text-gray-500">Manage workers in your department</p>
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
