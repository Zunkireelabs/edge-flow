/* eslint-disable @typescript-eslint/no-explicit-any */


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
  department_sub_batch_id?: number;  // The ID from department_sub_batches table - required for reject/alter operations
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
  isBillable?: boolean;
}

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: WorkerRecord) => void;
  subBatch: SubBatch | null;
  editRecord?: WorkerRecord | null;
  mode?: 'add' | 'edit' | 'preview';
  quantityToWork?: number;
  existingRecords?: any[];
}

const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subBatch,
  editRecord = null,
  mode = 'add',
  quantityToWork = 0,
  existingRecords = [],
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
    selectedAttachments: [] as number[], // Store selected attachment IDs
    isBillable: true, // Default to true (billable)
  });

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPreviewMode = mode === 'preview';

  // Calculate remaining quantity balance
  const calculateRemainingQuantity = () => {
    // Calculate total quantity worked from all existing records
    const totalWorked = existingRecords.reduce((sum, record) => {
      // If we're editing, exclude the current record from the calculation
      if (mode === 'edit' && editRecord && record.id === editRecord.id) {
        return sum;
      }
      return sum + (record.qtyWorked || 0);
    }, 0);

    const remaining = quantityToWork - totalWorked;

    console.log('======= QUANTITY BALANCE CALCULATION =======');
    console.log('Quantity to Work (Original):', quantityToWork);
    console.log('Total Already Worked:', totalWorked);
    console.log('Remaining Available:', remaining);
    console.log('Mode:', mode);
    if (mode === 'edit' && editRecord) {
      console.log('Editing Record - Current Qty Worked:', editRecord.qtyWorked);
    }
    console.log('==========================================');

    return {
      totalWorked,
      remaining,
      originalQuantity: quantityToWork
    };
  };

  const quantityBalance = calculateRemainingQuantity();

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
      // Helper function to clean values (treat 0, "-", and empty as empty)
      const cleanValue = (value: any, isNumber = false) => {
        if (!value || value === '-' || value === 0) return '';
        if (isNumber && parseInt(value) === 0) return '';
        return value.toString();
      };

      setFormData({
        workerId: '', // will be set after workers load
        workerName: editRecord.worker,
        date: formatDate(editRecord.date),
        sizeCategory: editRecord.realCategory || '',
        particulars: editRecord.particulars || '',
        qtyReceived: cleanValue(editRecord.qtyReceived, true),
        qtyWorked: cleanValue(editRecord.qtyWorked, true),
        unitPrice: cleanValue(editRecord.unitPrice, true),
        rejectReturn: cleanValue(editRecord.rejectReturn, true),
        returnTo: cleanValue(editRecord.returnTo),
        rejectionReason: cleanValue(editRecord.rejectionReason),
        alteration: cleanValue(editRecord.alteration, true),
        alterationReturnTo: '',
        alterationNote: cleanValue(editRecord.alterationNote),
        selectedAttachments: [],
        isBillable: editRecord.isBillable ?? true, // Default to true if not set
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
        selectedAttachments: [],
        isBillable: true, // Default to true (billable)
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
      console.log('Fetching workers from:', `${process.env.NEXT_PUBLIC_API_URL}/workers`);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers`);
      if (res.ok) {
        const data = await res.json();
        console.log('Workers data received:', data);
        console.log('Number of workers:', data?.length);
        setWorkers(data);
      } else {
        console.error('Failed to fetch workers. Status:', res.status);
        alert('Failed to fetch workers');
      }
    } catch (e) {
      console.error('Error fetching workers:', e);
      alert('Error fetching workers');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_GET_DEPARTMENTS}`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        console.error('Failed to fetch departments');
      }
    } catch (e) {
      console.error('Error fetching departments:', e);
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
    // Only require worker and date
    if (!formData.workerId || !formData.date) {
      alert('Worker and date are required');
      return;
    }

    // Validate: quantity_worked cannot be more than quantity_received
    const qtyReceived = formData.qtyReceived ? parseInt(formData.qtyReceived) : 0;
    const qtyWorked = formData.qtyWorked ? parseInt(formData.qtyWorked) : 0;

    if (qtyReceived > 0 && qtyWorked > qtyReceived) {
      alert('Quantity worked cannot be more than quantity received!');
      return;
    }

    // Validate: quantity_worked cannot exceed available balance
    if (quantityToWork > 0 && qtyWorked > quantityBalance.remaining) {
      alert(
        `Quantity worked (${qtyWorked}) cannot exceed available balance (${quantityBalance.remaining})!\n\n` +
        `Original Quantity: ${quantityBalance.originalQuantity}\n` +
        `Already Worked: ${quantityBalance.totalWorked}\n` +
        `Available Balance: ${quantityBalance.remaining}`
      );
      return;
    }

    // Validate rejected data - all fields must be filled if any is filled
    // Treat "0", "-", and empty as "not filled"
    const rejectQty = formData.rejectReturn ? parseInt(formData.rejectReturn) : 0;
    const hasRejectQty = rejectQty > 0;
    const hasRejectReturn = formData.returnTo && formData.returnTo.trim() && formData.returnTo !== '-';
    const hasRejectReason = formData.rejectionReason && formData.rejectionReason.trim() && formData.rejectionReason !== '-';

    const hasAnyRejectData = hasRejectQty || hasRejectReturn || hasRejectReason;

    if (hasAnyRejectData) {
      // If any rejection field has real data, all must be filled
      if (!hasRejectQty || !hasRejectReturn || !hasRejectReason) {
        alert('Please fill all rejection fields (Reject & Return, Return To, and Reason) or leave them all empty');
        return;
      }
    }

    // Validate alteration data - all fields must be filled if any is filled
    // Treat "0", "-", and empty as "not filled"
    const alterQty = formData.alteration ? parseInt(formData.alteration) : 0;
    const hasAlterQty = alterQty > 0;
    const hasAlterReturn = formData.alterationReturnTo && formData.alterationReturnTo.trim() && formData.alterationReturnTo !== '-';
    const hasAlterNote = formData.alterationNote && formData.alterationNote.trim() && formData.alterationNote !== '-';

    const hasAnyAlterationData = hasAlterQty || hasAlterReturn || hasAlterNote;

    if (hasAnyAlterationData) {
      // If any alteration field has real data, all must be filled
      if (!hasAlterQty || !hasAlterReturn || !hasAlterNote) {
        alert('Please fill all alteration fields (Alteration, Alteration Return To, and Alteration Note) or leave them all empty');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Build payload
      const payload: any = {
        worker_id: parseInt(formData.workerId),
        worker_name: formData.workerName,
        work_date: formData.date,
        activity_type: 'NORMAL', // Default activity type
      };

      // Add optional fields only if they have values
      if (formData.sizeCategory && formData.sizeCategory.trim()) {
        payload.size_category = formData.sizeCategory.trim();
      }
      if (formData.particulars && formData.particulars.trim()) {
        payload.particulars = formData.particulars.trim();
      }
      if (formData.qtyReceived && formData.qtyReceived.trim()) {
        payload.quantity_received = parseInt(formData.qtyReceived);
      }
      if (formData.qtyWorked && formData.qtyWorked.trim()) {
        payload.quantity_worked = parseInt(formData.qtyWorked);
      }
      if (formData.unitPrice && formData.unitPrice.trim()) {
        payload.unit_price = parseFloat(formData.unitPrice);
      }

      // Add selected attachments if any
      if (formData.selectedAttachments && formData.selectedAttachments.length > 0) {
        payload.attachment_ids = formData.selectedAttachments;
        console.log('Adding attachment IDs:', payload.attachment_ids);
      }

      // Add is_billable field
      payload.is_billable = formData.isBillable;
      console.log('Is Billable:', payload.is_billable);

      // Add rejected array if ALL rejection data exists and is valid
      if (formData.rejectReturn && formData.rejectReturn.trim() &&
          formData.returnTo && formData.returnTo.trim() &&
          formData.rejectionReason && formData.rejectionReason.trim()) {
        const rejectQty = parseInt(formData.rejectReturn);
        const returnToDeptId = parseInt(formData.returnTo);

        if (!isNaN(rejectQty) && rejectQty > 0 && !isNaN(returnToDeptId)) {
          // Validate that department_sub_batch_id exists
          if (!subBatch?.department_sub_batch_id) {
            alert('Error: Missing department sub-batch ID. Cannot process rejection.');
            setIsSubmitting(false);
            return;
          }

          payload.rejected = [{
            quantity: rejectQty,
            sent_to_department_id: returnToDeptId,
            source_department_sub_batch_id: subBatch.department_sub_batch_id,  // Updated to use specific entry ID
            reason: formData.rejectionReason.trim(),
          }];
          console.log('Adding rejected data:', payload.rejected);
        }
      }

      // Add altered array if ALL alteration data exists and is valid
      if (formData.alteration && formData.alteration.trim() &&
          formData.alterationReturnTo && formData.alterationReturnTo.trim() &&
          formData.alterationNote && formData.alterationNote.trim()) {
        const alterQty = parseInt(formData.alteration);
        const alterReturnToDeptId = parseInt(formData.alterationReturnTo);

        if (!isNaN(alterQty) && alterQty > 0 && !isNaN(alterReturnToDeptId)) {
          // Validate that department_sub_batch_id exists
          if (!subBatch?.department_sub_batch_id) {
            alert('Error: Missing department sub-batch ID. Cannot process alteration.');
            setIsSubmitting(false);
            return;
          }

          payload.altered = [{
            quantity: alterQty,
            sent_to_department_id: alterReturnToDeptId,
            source_department_sub_batch_id: subBatch.department_sub_batch_id,  // Updated to use specific entry ID
            reason: formData.alterationNote.trim(),
          }];
          console.log('Adding altered data:', payload.altered);
        }
      }

      let response;
      if (mode === 'edit' && editRecord) {
        console.log('Updating worker log ID:', editRecord.id);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        response = await fetch(`${process.env.NEXT_PUBLIC_CREATE_WORKER_LOGS}/${editRecord.id}`, {
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
        console.log('Creating worker log with payload:');
        console.log(JSON.stringify(payload, null, 2));
        response = await fetch(`${process.env.NEXT_PUBLIC_CREATE_WORKER_LOGS}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);

        // Find department name for display
        const returnToDept = departments.find(d => d.id === parseInt(formData.returnTo));

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
          returnTo: returnToDept?.name || formData.returnTo,
          rejectionReason: formData.rejectionReason,
          alteration: Number(formData.alteration) || 0,
          alterationNote: formData.alterationNote,
          particulars: formData.particulars,
        };
        onSave(record);
        alert(`Record ${mode === 'edit' ? 'updated' : 'saved'} successfully!`);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorMessage = 'Unknown error';
        try {
          const err = JSON.parse(errorText);
          errorMessage = err.message || err.error || errorText;
        } catch {
          errorMessage = errorText;
        }
        alert(`Failed to save: ${errorMessage}`);
      }
    } catch (e) {
      console.error('Exception while saving:', e);
      alert(`Error saving record: ${e instanceof Error ? e.message : 'Unknown error'}`);
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

          {/* Show quantity_remaining and remarks for rejected/altered items */}
          {subBatch && (subBatch as any).quantity_remaining && (subBatch as any).remarks && (
            <div className={`border-2 rounded-lg p-4 ${
              (subBatch as any).remarks.toLowerCase().includes('reject')
                ? 'bg-red-50 border-red-400'
                : 'bg-orange-50 border-orange-400'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold text-lg ${
                  (subBatch as any).remarks.toLowerCase().includes('reject')
                    ? 'text-red-900'
                    : 'text-orange-900'
                }`}>
                  {(subBatch as any).remarks.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-md font-bold text-white ${
                  (subBatch as any).remarks.toLowerCase().includes('reject')
                    ? 'bg-red-600'
                    : 'bg-orange-600'
                }`}>
                  {(subBatch as any).quantity_remaining.toLocaleString()} PCS
                </span>
              </div>
              <p className={`text-sm ${
                (subBatch as any).remarks.toLowerCase().includes('reject')
                  ? 'text-red-800'
                  : 'text-orange-800'
              }`}>
                Work on this {(subBatch as any).remarks.toLowerCase()} quantity only.
              </p>
              {/* Show rejection/alteration reason and source department */}
              {(subBatch as any).rejection_source && (
                <div className="mt-2 text-sm text-red-900 bg-red-100 p-2 rounded">
                  <p className="font-semibold">From: {(subBatch as any).rejection_source.from_department_name}</p>
                  <p className="text-xs mt-1"><strong>Reason:</strong> {(subBatch as any).rejection_source.reason}</p>
                </div>
              )}
              {(subBatch as any).alteration_source && (
                <div className="mt-2 text-sm text-orange-900 bg-orange-100 p-2 rounded">
                  <p className="font-semibold">From: {(subBatch as any).alteration_source.from_department_name}</p>
                  <p className="text-xs mt-1"><strong>Reason:</strong> {(subBatch as any).alteration_source.reason}</p>
                </div>
              )}
              {(subBatch as any).quantity_remaining !== subBatch.estimated_pieces && (
                <p className="text-xs text-gray-600 mt-2">
                  Original batch: {subBatch.estimated_pieces.toLocaleString()} pieces
                </p>
              )}
            </div>
          )}

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

          {/* Quantity Balance Info */}
          {quantityToWork > 0 && (
            <div className=" rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Original Quantity</p>
                  <p className="text-lg font-bold text-gray-900">{quantityBalance.originalQuantity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Already Worked</p>
                  <p className="text-lg font-bold text-gray-900">{quantityBalance.totalWorked.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Available Balance</p>
                  <p className={`text-lg font-bold ${quantityBalance.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {quantityBalance.remaining.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-blue-800 mt-2">
                 Quantity worked cannot exceed the available balance
              </p>
            </div>
          )}

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
                max={quantityBalance.remaining}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {quantityBalance.remaining > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Max: {quantityBalance.remaining.toLocaleString()} pieces
                </p>
              )}
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

          {/* Attachments Display */}
          {(subBatch as any)?.attachments && (subBatch as any).attachments.length > 0 && (
            <div className="  rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 text-blue-900">Attachments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(subBatch as any).attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 bg-white p-2 rounded border border-blue-100 cursor-pointer hover:bg-blue-50"
                    onClick={() => {
                      if (isPreviewMode) return;
                      const isSelected = formData.selectedAttachments.includes(attachment.id);
                      setFormData(prev => ({
                        ...prev,
                        selectedAttachments: isSelected
                          ? prev.selectedAttachments.filter(id => id !== attachment.id)
                          : [...prev.selectedAttachments, attachment.id]
                      }));
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedAttachments.includes(attachment.id)}
                      disabled={isPreviewMode}
                      onChange={() => {}} // Handled by div onClick
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{attachment.attachment_name}</span>
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        Qty: {attachment.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    <option key={d.id} value={d.id}>
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
                    <option key={d.id} value={d.id}>
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

          {/* Is Billable Checkbox */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isBillable"
                checked={formData.isBillable}
                onChange={(e) => setFormData(prev => ({ ...prev, isBillable: e.target.checked }))}
                disabled={isPreviewMode}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm font-semibold text-gray-900">
                Is Billable
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-8">
              {formData.isBillable
                ? '✓ This work will be included in payment calculations'
                : '✗ This work will NOT be included in payment calculations'}
            </p>
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
