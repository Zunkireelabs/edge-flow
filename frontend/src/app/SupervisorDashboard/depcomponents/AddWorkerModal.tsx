import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface Department {
  id: number;
  name: string;
}

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

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [, setSelectedDepartmentId] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supervisorDepartmentId, setSupervisorDepartmentId] = useState<number | null>(null);

  // Get supervisor's department ID from localStorage
  useEffect(() => {
    const departmentId = localStorage.getItem("departmentId");
    if (departmentId) {
      const deptId = parseInt(departmentId, 10);
      setSupervisorDepartmentId(deptId);
      setSelectedDepartmentId(departmentId);
    }
  }, []);

  // Load workers and departments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWorkers();
      fetchDepartments();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedWorkerId('');
      // Keep the supervisor's department selected
      const departmentId = localStorage.getItem("departmentId");
      if (departmentId) {
        setSelectedDepartmentId(departmentId);
      }
    }
  }, [isOpen]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers`);
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      } else {
        alert('Failed to fetch workers');
      }
    } catch (e) {
      console.error(e);
      alert('Error fetching workers');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        alert('Failed to fetch departments');
      }
    } catch (e) {
      console.error(e);
      alert('Error fetching departments');
    }
  };

  const getSelectedWorker = () => {
    return workers.find(w => w.id === parseInt(selectedWorkerId));
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedWorkerId) {
      alert('Please select a worker');
      return;
    }

    if (!supervisorDepartmentId) {
      alert('Unable to determine your department. Please try again.');
      return;
    }

    const worker = getSelectedWorker();
    if (!worker) {
      alert('Invalid worker selection');
      return;
    }

    // Check if worker is already assigned to any department (including this one)
    if (worker.department_id) {
      if (worker.department_id === supervisorDepartmentId) {
        alert(`${worker.name} is already assigned to your department`);
      } else {
        const currentDept = departments.find(d => d.id === worker.department_id);
        alert(`Cannot add worker. ${worker.name} is already assigned to ${currentDept?.name || 'another department'}`);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        department_id: supervisorDepartmentId,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/${worker.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const selectedDept = departments.find(d => d.id === supervisorDepartmentId);
        alert(`Worker "${worker.name}" has been assigned to ${selectedDept?.name || 'your department'} successfully!`);
        onSuccess();
        onClose();
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Failed to assign worker: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error assigning worker to department');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedWorker = getSelectedWorker();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-lg w-full max-w-md mx-4 relative shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">Assign Worker to Department</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Worker Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Select Worker <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{loading ? 'Loading workers...' : 'Select a worker'}</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} {worker.department_id ? `(Currently in ${worker.department?.name || 'a department'})` : '(Unassigned)'}
                </option>
              ))}
            </select>
          </div>

          {/* Show current assignment if worker is selected */}
          {selectedWorker && selectedWorker.department_id && (
            <div className={`${
              selectedWorker.department_id === supervisorDepartmentId
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            } border rounded-lg p-4 flex items-start gap-3`}>
              <AlertCircle className={`${
                selectedWorker.department_id === supervisorDepartmentId
                  ? 'text-green-600'
                  : 'text-yellow-600'
              } flex-shrink-0 mt-0.5`} size={20} />
              <div className="text-sm">
                {selectedWorker.department_id === supervisorDepartmentId ? (
                  <>
                    <p className="font-semibold text-green-900">Already in Your Department</p>
                    <p className="text-green-800 mt-1">
                      {selectedWorker.name} is already assigned to your department ({selectedWorker.department?.name}).
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-yellow-900">Worker Already Assigned</p>
                    <p className="text-yellow-800 mt-1">
                      {selectedWorker.name} is currently assigned to <strong>{selectedWorker.department?.name || 'another department'}</strong>.
                      You cannot add workers from other departments.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Show unassigned status if worker is selected and not assigned */}
          {selectedWorker && !selectedWorker.department_id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-blue-900">Worker Available</p>
                <p className="text-blue-800 mt-1">
                  {selectedWorker.name} is currently unassigned and can be added to your department.
                </p>
              </div>
            </div>
          )}

          {/* Worker Details */}
          {selectedWorker && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Worker Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">PAN:</div>
                <div className="text-gray-900 font-medium">{selectedWorker.pan}</div>
                <div className="text-gray-600">Wage Type:</div>
                <div className="text-gray-900 font-medium capitalize">{selectedWorker.wage_type}</div>
                <div className="text-gray-600">Wage Rate:</div>
                <div className="text-gray-900 font-medium">₹{selectedWorker.wage_rate.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Department Selection - Only showing supervisor's own department */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Assign to Department
            </label>
            <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 font-medium">
              {supervisorDepartmentId
                ? departments.find(d => d.id === supervisorDepartmentId)?.name || 'Your Department'
                : 'Loading...'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You can only assign workers to your own department
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || loading || !selectedWorkerId || !supervisorDepartmentId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Assigning...' : 'Assign Worker'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWorkerModal;
