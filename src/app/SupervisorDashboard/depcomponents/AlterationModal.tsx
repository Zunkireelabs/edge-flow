'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/app/Components/ToastContext';

interface AlterationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subBatchId: number | null;
  departmentId: number | null;
  availableQuantity: number;
  subBatchName: string;
  departmentFlow: string | null;
  currentDepartmentName: string | null;
  workerRecords: Array<{
    id: number;
    worker_id: number;
    worker: string;
    qtyWorked: number;
  }>;
}

interface Department {
  id: number;
  name: string;
}

const AlterationModal: React.FC<AlterationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subBatchId,
  departmentId,
  availableQuantity,
  subBatchName,
  departmentFlow,
  currentDepartmentName,
  workerRecords,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    workerId: '',
    quantity: '',
    note: '',
    returnToDepartmentId: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [validDepartments, setValidDepartments] = useState<Department[]>([]);

  // Fetch departments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      // Reset form when opening
      setFormData({
        workerId: '',
        quantity: '',
        note: '',
        returnToDepartmentId: '',
      });
      setMaxQuantity(0);
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
        filterDepartments(data);
      }
    } catch {
      // Department fetch failed
    }
  };

  // Filter departments to show only PREVIOUS departments in flow
  const filterDepartments = (allDepartments: Department[]) => {
    if (!departmentFlow || !currentDepartmentName) {
      setValidDepartments([]);
      return;
    }

    // Parse flow: "Dep-X → Dep-Y → Dep-Z"
    const flow = departmentFlow.split('→').map(d => d.trim());
    const currentIndex = flow.findIndex(d => d === currentDepartmentName);

    if (currentIndex === -1 || currentIndex === 0) {
      // Not in flow OR first department (no previous departments)
      setValidDepartments([]);
      return;
    }

    // Get all departments BEFORE current position
    const previousDeptNames = flow.slice(0, currentIndex);

    // Filter to show only those departments
    const filtered = allDepartments.filter(dept =>
      previousDeptNames.includes(dept.name)
    );

    setValidDepartments(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.workerId) {
      showToast('warning', 'Please select a worker');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      showToast('warning', 'Please enter a valid quantity greater than 0');
      return;
    }

    if (quantity > maxQuantity) {
      showToast('warning', `Cannot send ${quantity} pieces for alteration! Only ${maxQuantity} pieces available for this worker.`);
      return;
    }

    if (!formData.note.trim()) {
      showToast('warning', 'Please enter a reason for alteration');
      return;
    }

    if (!formData.returnToDepartmentId) {
      showToast('warning', 'Please select a department to send items to');
      return;
    }

    if (parseInt(formData.returnToDepartmentId) === departmentId) {
      showToast('warning', 'Cannot send to the same department. Please select a different department.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/production/alteration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sub_batch_id: subBatchId,
          from_department_id: departmentId,
          return_to_department_id: parseInt(formData.returnToDepartmentId),
          quantity: quantity,
          note: formData.note.trim(),
          worker_log_id: parseInt(formData.workerId), // Worker log ID to track accountability
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast('success', `Successfully sent ${quantity} pieces for alteration!`);
        onSuccess();
        onClose();
      } else {
        showToast('error', `Failed to send for alteration: ${result.message || 'Unknown error'}`);
      }
    } catch (error: unknown) {
      showToast('error', `Error: ${error instanceof Error ? error.message : 'Failed to send for alteration'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/30 transition-opacity duration-300"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-4 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Send for Alteration</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Subtitle */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>{subBatchName}</strong>
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Available: <strong>{availableQuantity} pieces</strong>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Worker Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Worker <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.workerId}
              onChange={(e) => {
                const selectedWorkerLogId = e.target.value;
                const selectedWorkerLog = workerRecords.find(r => r.id.toString() === selectedWorkerLogId);
                setFormData({ ...formData, workerId: selectedWorkerLogId, quantity: '' });
                setMaxQuantity(selectedWorkerLog?.qtyWorked || 0);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              required
            >
              <option value="">Select worker whose work needs alteration...</option>
              {workerRecords.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.worker} ({record.qtyWorked} pieces assigned)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the worker whose completed work needs alteration
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity for Alteration <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder={maxQuantity > 0 ? `Max: ${maxQuantity}` : 'Select worker first'}
              min="1"
              max={maxQuantity}
              disabled={!formData.workerId}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {maxQuantity > 0
                ? `Enter number of pieces from this worker's assignment (max: ${maxQuantity})`
                : 'Select a worker to enable quantity input'}
            </p>
          </div>

          {/* Alteration Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Alteration Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="E.g., Collar too loose - needs adjustment"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe what needs to be altered
            </p>
          </div>

          {/* Send to Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Send Back to Department <span className="text-red-500">*</span>
            </label>
            {validDepartments.length > 0 ? (
              <>
                <select
                  value={formData.returnToDepartmentId}
                  onChange={(e) => setFormData({ ...formData, returnToDepartmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="">Select previous department...</option>
                  {validDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Previous department that will fix the issue
                </p>
              </>
            ) : (
              <div className="w-full border border-gray-200 rounded-lg px-3 py-3 bg-gray-50 text-sm text-gray-500">
                No previous departments available. Cannot send for alteration from first department.
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || validDepartments.length === 0}
              className="px-6 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
            >
              {loading ? 'Sending...' : 'Send for Alteration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlterationModal;
