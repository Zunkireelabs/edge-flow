/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SIMPLIFIED Worker Assignment Modal
 *
 * Purpose: Assign work to workers (normal production work only)
 * Fields: Worker, Date, Quantity Worked, Unit Price, Billable, Particulars (optional)
 *
 * Alteration and Rejection workflows are handled by separate buttons/modals
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import NepaliDatePicker from '@/app/Components/NepaliDatePicker';

interface Worker {
  id: number;
  name: string;
  pan: string;
  address: string;
  department_id: number | null;
  wage_type: string;
  wage_rate: number;
}

interface SubBatch {
  id: number;
  name: string;
  department_id: number | null;
  remaining_work?: number;
}

interface AddWorkerRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: any) => void;
  subBatch: SubBatch | null;
  mode?: 'add' | 'edit' | 'preview';
  editRecord?: any;
}

const AddWorkerRecordModal: React.FC<AddWorkerRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subBatch,
  mode = 'add',
}) => {

  // Calculate remaining work from subBatch (passed from TaskDetailsModal)
  const remainingWork = subBatch?.remaining_work || 0;
  const [formData, setFormData] = useState({
    workerId: '',
    date: '',
    quantityWorked: '',
    unitPrice: '',
    isBillable: true,
    particulars: '',
  });

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        workerId: '',
        date: '',
        quantityWorked: '',
        unitPrice: '',
        isBillable: true,
        particulars: '',
      });
      fetchWorkers();
    }
  }, [isOpen]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const departmentId = localStorage.getItem("departmentId");
      if (!departmentId) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/department/${departmentId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      }
    } catch (e) {
      console.error('Error fetching workers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.workerId) {
      alert('Please select a worker');
      return;
    }

    if (!formData.date) {
      alert('Please select a date');
      return;
    }

    if (!formData.quantityWorked || formData.quantityWorked.trim() === '') {
      alert('Please enter quantity worked');
      return;
    }

    const quantity = parseInt(formData.quantityWorked);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    // Validate against remaining work
    if (quantity > remainingWork) {
      alert(
        `Cannot assign ${quantity.toLocaleString()} pieces!\n\n` +
        `Only ${remainingWork.toLocaleString()} pieces remaining to assign.\n\n` +
        `Please enter a quantity between 1 and ${remainingWork.toLocaleString()}.`
      );
      return;
    }

    // Unit price is optional - can be filled by admin later
    let unitPrice = null;
    if (formData.unitPrice && formData.unitPrice.trim() !== '') {
      unitPrice = parseFloat(formData.unitPrice);
      if (isNaN(unitPrice) || unitPrice <= 0) {
        alert('Please enter a valid unit price greater than 0 (or leave blank)');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        sub_batch_id: subBatch?.id,
        worker_id: parseInt(formData.workerId),
        work_date: formData.date,
        quantity_worked: quantity,
        is_billable: formData.isBillable,
        activity_type: 'NORMAL',
        department_id: subBatch?.department_id,
      };

      // Add optional fields if provided
      if (formData.particulars && formData.particulars.trim()) {
        (payload as any).particulars = formData.particulars.trim();
      }
      if (unitPrice !== null) {
        (payload as any).unit_price = unitPrice;
      }

      console.log('📤 Creating worker assignment:', payload);

      const response = await fetch(`${process.env.NEXT_PUBLIC_CREATE_WORKER_LOGS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Worker assigned successfully!');
        // Call onSave to trigger parent refresh
        onSave({} as any); // Parent will refresh data from API
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to assign worker: ${errorData.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Error:', e);
      alert('Error assigning worker. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedWorker = workers.find(w => w.id === parseInt(formData.workerId));
  const calculatedWage = formData.quantityWorked && formData.unitPrice
    ? (parseInt(formData.quantityWorked) * parseFloat(formData.unitPrice)).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur Backdrop */}
      <div
        className="absolute inset-0 bg-white/30 transition-opacity duration-300"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="bg-white rounded-lg w-full max-w-md mx-4 relative shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300">
          <h3 className="text-base font-semibold text-gray-900">Assign Worker to Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Sub Batch Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <p className="text-xs text-blue-600 font-medium">Working on: {subBatch?.name}</p>
            <p className="text-xs text-blue-800 mt-1">
              Remaining to assign: <strong>{remainingWork.toLocaleString()} pieces</strong>
            </p>
          </div>

          {/* Worker Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Worker <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.workerId}
              onChange={(e) => handleChange('workerId', e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">{loading ? 'Loading workers...' : 'Select Worker'}</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Worked */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Quantity Worked <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.quantityWorked}
              onChange={(e) => handleChange('quantityWorked', e.target.value)}
              placeholder="Enter quantity"
              min="1"
              max={remainingWork}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {remainingWork.toLocaleString()} pieces
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Work Date <span className="text-red-500">*</span>
            </label>
            <NepaliDatePicker
              value={formData.date}
              onChange={(date) => handleChange('date', date)}
              className="rounded-lg text-sm"
              required
            />
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Unit Price (₹/piece) <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="number"
              value={formData.unitPrice}
              onChange={(e) => handleChange('unitPrice', e.target.value)}
              placeholder="Enter price per piece"
              step="0.01"
              min="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Can be filled by admin later in wage calculation
            </p>
          </div>

          {/* Calculated Wage */}
          {formData.quantityWorked && formData.unitPrice && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <p className="text-xs text-green-600">Calculated Wage</p>
              <p className="text-sm font-bold text-green-900">₹{calculatedWage}</p>
              <p className="text-xs text-green-700 mt-0.5">
                {formData.quantityWorked} pieces × ₹{formData.unitPrice} = ₹{calculatedWage}
              </p>
            </div>
          )}

          {/* Billable Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={formData.isBillable}
              onChange={(e) => handleChange('isBillable', e.target.checked)}
              className="w-4 h-4 accent-blue-500 rounded"
            />
            <label htmlFor="billable" className="text-xs text-gray-700">
              <strong>Billable Work</strong>
              <span className="text-gray-500 ml-1">(Uncheck if rework/internal)</span>
            </label>
          </div>

          {/* Particulars (Optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Task Description <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.particulars}
              onChange={(e) => handleChange('particulars', e.target.value)}
              placeholder="e.g., Stitching sleeves, Cutting fabric"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Worker Details (if selected) */}
          {selectedWorker && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-gray-700 mb-1.5">Worker Details</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">PAN:</span>
                  <span className="font-medium">{selectedWorker.pan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wage Type:</span>
                  <span className="font-medium capitalize">{selectedWorker.wage_type}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-300">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Assigning...' : 'Assign Worker'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWorkerRecordModal;
