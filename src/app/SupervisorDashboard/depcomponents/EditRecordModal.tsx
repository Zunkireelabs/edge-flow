import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import NepaliDatePicker from '@/app/Components/NepaliDatePicker';

interface WorkerRecord {
  id: number;
  worker: string;
  realCategory: string;
  particulars?: string;
  date: string;
  status: string;
  qtyReceived?: number;
  qtyWorked?: number;
  unitPrice?: number;
  rejectReturn?: number;
  returnTo?: string;
  rejectionReason?: string;
  alteration?: number;
  alterationNote?: string;
}

interface Worker {
  id: number;
  name: string;
  pan: string;
  address: string;
  department_id: number | null;
  wage_type: string;
  wage_rate: number;
}

interface Department {
  id: number;
  name: string;
}

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: WorkerRecord | null;
  onSave: (record: WorkerRecord) => void;
}

const EditRecordModal: React.FC<EditRecordModalProps> = ({ isOpen, onClose, record, onSave }) => {
  const [formData, setFormData] = useState({
    workerId: '',
    workerName: '',
    date: '',
    sizeCategory: '',
    particulars: '',
    qtyReceived: '',
    qtyWorked: '',
    unitPrice: '',
    rejectReturn: '',
    returnTo: '',
    rejectionReason: '',
    alteration: '',
    alterationNote: ''
  });

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when record changes
  useEffect(() => {
    if (record && isOpen) {
      // Convert date format from "MM/DD/YYYY" to "YYYY-MM-DD" for input
      const formatDateForInput = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        workerId: '', // Will be set after workers are loaded
        workerName: record.worker,
        date: formatDateForInput(record.date),
        sizeCategory: record.realCategory || '',
        particulars: record.particulars || '',
        qtyReceived: record.qtyReceived?.toString() || '',
        qtyWorked: record.qtyWorked?.toString() || '',
        unitPrice: record.unitPrice?.toString() || '',
        rejectReturn: record.rejectReturn?.toString() || '',
        returnTo: record.returnTo || '',
        rejectionReason: record.rejectionReason || '',
        alteration: record.alteration?.toString() || '',
        alterationNote: record.alterationNote || ''
      });
    }
  }, [record, isOpen]);

  // Fetch workers and departments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWorkers();
      fetchDepartments();
    }
  }, [isOpen]);

  // Set workerId after workers are loaded
  useEffect(() => {
    if (workers.length > 0 && record) {
      const worker = workers.find(w => w.name === record.worker);
      if (worker) {
        setFormData(prev => ({
          ...prev,
          workerId: worker.id.toString()
        }));
      }
    }
  }, [workers, record]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers`);
      if (response.ok) {
        const workersData = await response.json();
        setWorkers(workersData);
      } else {
        console.error('Failed to fetch workers');
        alert('Failed to load workers. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      alert('Error loading workers. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`);
      if (response.ok) {
        const departmentsData = await response.json();
        setDepartments(departmentsData);
      } else {
        console.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  if (!isOpen || !record) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If worker is selected, update both workerId and workerName
    if (name === 'workerId') {
      const selectedWorker = workers.find(worker => worker.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        workerId: value,
        workerName: selectedWorker ? selectedWorker.name : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.workerId || !formData.date) {
      alert('Worker and date are required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload for API update
      const payload = {
        worker_id: parseInt(formData.workerId),
        worker_name: formData.workerName,
        work_date: formData.date,
        size_category: formData.sizeCategory || undefined,
        particulars: formData.particulars || undefined,
        quantity_received: formData.qtyReceived ? parseInt(formData.qtyReceived) : undefined,
        quantity_worked: formData.qtyWorked ? parseInt(formData.qtyWorked) : undefined,
        unit_price: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
        reject_return: formData.rejectReturn ? parseInt(formData.rejectReturn) : undefined,
        return_to: formData.returnTo || undefined,
        rejection_reason: formData.rejectionReason || undefined,
        alteration: formData.alteration ? parseInt(formData.alteration) : undefined,
        alteration_note: formData.alterationNote || undefined
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/worker-logs/logs/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await response.json(); // Parse response

        // Transform data for the parent component
        const updatedRecord: WorkerRecord = {
          id: record.id,
          worker: formData.workerName,
          realCategory: formData.sizeCategory || 'General',
          date: new Date(formData.date).toLocaleDateString('en-US'),
          status: record.status, // Keep existing status
          qtyReceived: Number(formData.qtyReceived) || 0,
          qtyWorked: Number(formData.qtyWorked) || 0,
          unitPrice: Number(formData.unitPrice) || 0,
          rejectReturn: Number(formData.rejectReturn) || 0,
          returnTo: formData.returnTo,
          rejectionReason: formData.rejectionReason,
          alteration: Number(formData.alteration) || 0,
          alterationNote: formData.alterationNote,
          particulars: formData.particulars
        };

        onSave(updatedRecord);
        alert('Worker log updated successfully!');
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to update worker log: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating worker log:', error);
      alert('Error updating worker log. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white h-full w-full max-w-md shadow-xl relative overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-50">
          <h3 className="text-lg font-semibold">Edit Worker Record</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Worker Name & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Worker Name</label>
              <select
                name="workerId"
                value={formData.workerId}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">
                  {loading ? 'Loading workers...' : 'Select Worker'}
                </option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Date</label>
              <NepaliDatePicker
                value={formData.date}
                onChange={(value) => handleInputChange({ target: { name: 'date', value } } as any)}
                placeholder="Select Date"
              />
            </div>
          </div>

          {/* Size/Category & Particulars */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Size/Category</label>
              <input
                type="text"
                name="sizeCategory"
                value={formData.sizeCategory}
                onChange={handleInputChange}
                placeholder="e.g., Medium, Large"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Particulars</label>
              <input
                type="text"
                name="particulars"
                value={formData.particulars}
                onChange={handleInputChange}
                placeholder="e.g., Cutting, Sewing"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Qty Received & Qty Worked */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Qty Received</label>
              <input
                type="number"
                name="qtyReceived"
                value={formData.qtyReceived}
                onChange={handleInputChange}
                placeholder="Enter quantity"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Qty Worked</label>
              <input
                type="number"
                name="qtyWorked"
                value={formData.qtyWorked}
                onChange={handleInputChange}
                placeholder="Enter quantity"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-sm font-semibold mb-2">Unit Price</label>
            <input
              type="number"
              step="0.01"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleInputChange}
              placeholder="Enter unit price"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Additional Fields */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-700">Additional Tracking</h4>
            
            {/* Reject & Return */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Reject & Return</label>
                <input
                  type="number"
                  name="rejectReturn"
                  value={formData.rejectReturn}
                  onChange={handleInputChange}
                  placeholder="Enter quantity"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Return To</label>
                <select
                  name="returnTo"
                  value={formData.returnTo}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason for Rejection */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Reason for Rejection</label>
              <textarea
                name="rejectionReason"
                value={formData.rejectionReason}
                onChange={handleInputChange}
                placeholder="Enter rejection reason..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Alteration */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Alteration</label>
              <input
                type="number"
                name="alteration"
                value={formData.alteration}
                onChange={handleInputChange}
                placeholder="Enter quantity"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Alteration Note */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Alteration Note</label>
              <textarea
                name="alterationNote"
                value={formData.alterationNote}
                onChange={handleInputChange}
                placeholder="Describe the alteration needed..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRecordModal;