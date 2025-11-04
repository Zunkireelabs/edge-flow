import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

interface SubBatch {
  id: number;
  roll_id: number;
  batch_id: number | null;
  name: string;
  estimated_pieces: number;
  expected_items: number;
  start_date: string;
  due_date: string;
  department_id: number | null;
}

export interface WorkerRecord {
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

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: WorkerRecord) => void;
  subBatch: SubBatch | null;
  editRecord?: WorkerRecord | null;
  mode?: 'add' | 'edit' | 'preview';
}

const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subBatch,
  editRecord = null,
  mode = 'add',
}) => {
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
    alterationReturnTo: '',
    alterationNote: '',
  });

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPreviewMode = mode === 'preview';

  // Load workers and departments when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetchWorkers();
    fetchDepartments();
  }, [isOpen]);

  // Initialize form when opening modal in edit/preview mode
  useEffect(() => {
    if (!isOpen) return;

    if (editRecord && (mode === 'edit' || mode === 'preview')) {
      const formatDate = (d: string) => {
        try {
          return new Date(d).toISOString().split('T')[0];
        } catch {
          return d;
        }
      };
      setFormData({
        workerId: '', // will be set after workers load
        workerName: editRecord.worker,
        date: formatDate(editRecord.date),
        sizeCategory: editRecord.realCategory || '',
        particulars: editRecord.particulars || '',
        qtyReceived: editRecord.qtyReceived?.toString() || '',
        qtyWorked: editRecord.qtyWorked?.toString() || '',
        unitPrice: editRecord.unitPrice?.toString() || '',
        rejectReturn: editRecord.rejectReturn?.toString() || '',
        returnTo: editRecord.returnTo || '',
        rejectionReason: editRecord.rejectionReason || '',
        alteration: editRecord.alteration?.toString() || '',
        alterationReturnTo: '',
        alterationNote: editRecord.alterationNote || '',
      });
    } else if (mode === 'add') {
      setFormData({
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
        alterationReturnTo: '',
        alterationNote: '',
      });
    }
  }, [isOpen, editRecord, mode]);

  // Set workerId when workers are loaded in edit/preview mode
  useEffect(() => {
    if (workers.length > 0 && editRecord && (mode === 'edit' || mode === 'preview')) {
      const w = workers.find(worker => worker.name === editRecord.worker);
      if (w) setFormData(prev => ({ ...prev, workerId: w.id.toString() }));
    }
  }, [workers, editRecord, mode]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers`);
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      } else alert('Failed to fetch workers');
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
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'workerId') {
      const w = workers.find(w => w.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        workerId: value,
        workerName: w ? w.name : '',
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.workerId || !formData.date) {
      alert('Worker and date are required');
      return;
    }

    setIsSubmitting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
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
        alteration_note: formData.alterationNote || undefined,
      };

      let response;
      if (mode === 'edit' && editRecord) {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/worker-logs/logs/${editRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        if (!subBatch) {
          alert('Sub-batch is missing');
          return;
        }
        payload.sub_batch_id = subBatch.id;
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/worker-logs/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const result = await response.json();
        const record: WorkerRecord = {
          id: result.id,
          worker: formData.workerName,
          realCategory: formData.sizeCategory || 'General',
          date: new Date(formData.date).toLocaleDateString('en-US'),
          status: mode === 'add' ? 'Pending' : editRecord?.status || 'Pending',
          qtyReceived: Number(formData.qtyReceived) || 0,
          qtyWorked: Number(formData.qtyWorked) || 0,
          unitPrice: Number(formData.unitPrice) || 0,
          rejectReturn: Number(formData.rejectReturn) || 0,
          returnTo: formData.returnTo,
          rejectionReason: formData.rejectionReason,
          alteration: Number(formData.alteration) || 0,
          alterationNote: formData.alterationNote,
          particulars: formData.particulars,
        };
        onSave(record);
        alert(`Record ${mode === 'edit' ? 'updated' : 'saved'} successfully!`);
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Failed to save: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error saving record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white h-full w-full max-w-md shadow-xl relative overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-50">
          <h3 className="text-lg font-semibold">
            {mode === 'edit'
              ? 'Edit Worker Assignment'
              : mode === 'preview'
              ? 'Preview Worker Assignment'
              : 'Add Worker Assignment'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Worker & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Worker Name</label>
              <select
                name="workerId"
                value={formData.workerId}
                onChange={handleChange}
                disabled={loading || isPreviewMode}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isPreviewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">{loading ? 'Loading...' : 'Select Worker'}</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={isPreviewMode}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isPreviewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* SubBatch */}
          <div>
            <label className="block text-sm font-semibold mb-2">Sub Batch</label>
            <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700">
              {subBatch ? subBatch.name : editRecord ? `Sub Batch ID: ${editRecord.id}` : 'No sub-batch selected'}
            </div>
          </div>

          {/* Size/Particulars */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Size/Category</label>
              <input
                type="text"
                name="sizeCategory"
                value={formData.sizeCategory}
                onChange={handleChange}
                disabled={isPreviewMode}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isPreviewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Particulars</label>
              <input
                type="text"
                name="particulars"
                value={formData.particulars}
                onChange={handleChange}
                disabled={isPreviewMode}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isPreviewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Qty & Unit Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Qty Received</label>
              <input
                type="number"
                name="qtyReceived"
                value={formData.qtyReceived}
                onChange={handleChange}
                disabled={isPreviewMode}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Qty Worked</label>
              <input
                type="number"
                name="qtyWorked"
                value={formData.qtyWorked}
                onChange={handleChange}
                disabled={isPreviewMode}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Unit Price</label>
            <input
              type="number"
              step="0.01"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              disabled={isPreviewMode}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Additional Tracking */}
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
                  onChange={handleChange}
                  disabled={isPreviewMode}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Return To</label>
                <select
                  name="returnTo"
                  value={formData.returnTo}
                  onChange={handleChange}
                  disabled={isPreviewMode}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rejection Reason */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Reason for Rejection</label>
              <textarea
                name="rejectionReason"
                value={formData.rejectionReason}
                onChange={handleChange}
                rows={3}
                disabled={isPreviewMode}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Alteration */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Alteration</label>
                <input
                  type="number"
                  name="alteration"
                  value={formData.alteration}
                  onChange={handleChange}
                  disabled={isPreviewMode}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Alteration Return To</label>
                <select
                  name="alterationReturnTo"
                  value={formData.alterationReturnTo}
                  onChange={handleChange}
                  disabled={isPreviewMode}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alteration Note */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Alteration Note</label>
              <textarea
                name="alterationNote"
                value={formData.alterationNote}
                onChange={handleChange}
                rows={3}
                disabled={isPreviewMode}
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
            {isPreviewMode ? 'Close' : 'Cancel'}
          </button>
          {!isPreviewMode && (
            <button
              onClick={handleSave}
              disabled={isSubmitting || loading || (mode === 'add' && !subBatch)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Saving...') : mode === 'edit' ? 'Update Record' : 'Save Record'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddRecordModal;
