'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subBatchId: number | null;
  departmentId: number | null;
  availableQuantity: number;
  subBatchName: string;
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

const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subBatchId,
  departmentId,
  availableQuantity,
  subBatchName,
  workerRecords,
}) => {
  const [formData, setFormData] = useState({
    workerId: '',
    quantity: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        workerId: '',
        quantity: '',
        reason: '',
      });
      setMaxQuantity(0);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.workerId) {
      alert('Please select a worker');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    if (quantity > maxQuantity) {
      alert(`Cannot reject ${quantity} pieces!\n\nOnly ${maxQuantity} pieces available for this worker.`);
      return;
    }

    if (!formData.reason.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/production/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sub_batch_id: subBatchId,
          from_department_id: departmentId,
          quantity: quantity,
          reason: formData.reason.trim(),
          worker_log_id: parseInt(formData.workerId), // Worker log ID to track accountability
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Successfully rejected ${quantity} pieces!`);
        onSuccess();
        onClose();
      } else {
        alert(`Failed to reject items: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error rejecting items:', error);
      alert(`Error: ${error.message || 'Failed to reject items'}`);
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
          <h3 className="text-lg font-semibold text-gray-900">Reject Items</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Subtitle */}
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>{subBatchName}</strong>
          </p>
          <p className="text-xs text-red-700 mt-1">
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
              <option value="">Select worker whose work needs rejection...</option>
              {workerRecords.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.worker} ({record.qtyWorked} pieces assigned)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the worker whose completed work has defects
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity to Reject <span className="text-red-500">*</span>
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

          {/* Rejection Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="E.g., Poor stitching quality - needs rework"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe the quality issue or defect
            </p>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ These items will be marked as waste/scrap
            </p>
            <p className="text-xs text-red-700 mt-1">
              Rejected items cannot be reworked and will be logged as loss. This action reduces inventory permanently.
            </p>
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
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
            >
              {loading ? 'Rejecting...' : 'Reject Items'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectionModal;
