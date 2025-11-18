/* eslint-disable @typescript-eslint/no-explicit-any */


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
  remaining_work?: number;  // Remaining work from production summary
  quantity_remaining?: number | null;  // Remaining quantity for this card
  quantity_assigned?: number | null;  // Assigned quantity for "Assigned" cards
  remarks?: string | null;  // Card type: "Main", "Assigned", "Rejected", "Altered"
  assigned_worker_id?: number | null;  // For "Assigned" cards - the worker assigned to this card
  assigned_worker?: any | null;  // Worker details for "Assigned" cards
  sent_from_department?: string | null;  // Name of department that sent this card
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
    isBillable: true, // Default checked
    rejectReturn: '',
    returnTo: '',
    rejectionReason: '',
    alteration: '',
    alterationReturnTo: '',
    alterationNote: '',
    selectedAttachments: [] as number[], // Store selected attachment IDs
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Helper function to convert numeric values - only show if > 0
      const formatNumericValue = (val: number | undefined | null) => {
        if (val === null || val === undefined || val === 0) return '';
        return val.toString();
      };

      // Helper function to clean text values - don't show "-"
      const formatTextValue = (val: string | undefined | null) => {
        if (!val || val === '-') return '';
        return val;
      };

      setFormData({
        workerId: '', // will be set after workers load
        workerName: editRecord.worker,
        date: formatDate(editRecord.date),
        sizeCategory: editRecord.realCategory || '',
        particulars: formatTextValue(editRecord.particulars),
        qtyReceived: formatNumericValue(editRecord.qtyReceived),
        qtyWorked: formatNumericValue(editRecord.qtyWorked),
        unitPrice: formatNumericValue(editRecord.unitPrice),
        isBillable: true,
        rejectReturn: formatNumericValue(editRecord.rejectReturn),
        returnTo: formatTextValue(editRecord.returnTo),
        rejectionReason: formatTextValue(editRecord.rejectionReason),
        alteration: formatNumericValue(editRecord.alteration),
        alterationReturnTo: '',
        alterationNote: formatTextValue(editRecord.alterationNote),
        selectedAttachments: [],
      });
    } else if (mode === 'add') {
      // For "Assigned" cards, pre-select the assigned worker ONLY if from current department
      const departmentId = localStorage.getItem("departmentId");
      const currentDeptId = departmentId ? parseInt(departmentId) : null;
      const assignedWorkerDeptId = subBatch?.assigned_worker?.department_id;

      const shouldPreSelectWorker =
        subBatch?.remarks === 'Assigned' &&
        subBatch?.assigned_worker &&
        assignedWorkerDeptId === currentDeptId;

      if (shouldPreSelectWorker) {
        setFormData({
          workerId: subBatch.assigned_worker.id.toString(),
          workerName: subBatch.assigned_worker.name,
          date: '',
          sizeCategory: '',
          particulars: '',
          qtyReceived: '',
          qtyWorked: '',
          unitPrice: '',
          isBillable: true,
          rejectReturn: '',
          returnTo: '',
          rejectionReason: '',
          alteration: '',
          alterationReturnTo: '',
          alterationNote: '',
          selectedAttachments: [],
        });
      } else {
        setFormData({
          workerId: '',
          workerName: '',
          date: '',
          sizeCategory: '',
          particulars: '',
          qtyReceived: '',
          qtyWorked: '',
          unitPrice: '',
          isBillable: true,
          rejectReturn: '',
          returnTo: '',
          rejectionReason: '',
          alteration: '',
          alterationReturnTo: '',
          alterationNote: '',
          selectedAttachments: [],
        });
      }
    }
  }, [isOpen, editRecord, mode, subBatch]);

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

      // Get supervisor's department ID from localStorage
      const departmentId = localStorage.getItem("departmentId");

      if (!departmentId) {
        console.error('No department ID found in localStorage');
        setWorkers([]);
        setLoading(false);
        return;
      }

      // For "Assigned" cards, check if the assigned worker belongs to the CURRENT department
      if (subBatch?.remarks === 'Assigned' && subBatch?.assigned_worker) {
        const assignedWorkerDeptId = subBatch.assigned_worker.department_id;
        const currentDeptId = parseInt(departmentId);

        // If assigned worker is from THIS department, lock to that worker only
        if (assignedWorkerDeptId === currentDeptId) {
          console.log('Assigned card - worker from current department. Locking to assigned worker:', subBatch.assigned_worker);
          setWorkers([subBatch.assigned_worker]);
          setLoading(false);
          return;
        } else {
          // If assigned worker is from ANOTHER department, allow selecting any worker from current department
          console.log('Assigned card - worker from different department. Allowing worker selection for current department.');
        }
      }

      console.log('Fetching workers for department:', departmentId);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/department/${departmentId}`);
      if (res.ok) {
        const data = await res.json();
        console.log('Workers data received:', data);
        console.log('Number of workers:', data?.length);
        setWorkers(data);
      } else {
        console.error('Failed to fetch workers. Status:', res.status);
        alert('Failed to fetch workers for your department');
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
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'workerId') {
      const w = workers.find(w => w.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        workerId: value,
        workerName: w ? w.name : '',
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    // Check if workers are available
    if (workers.length === 0) {
      alert('No workers available in your department. Please assign workers from Worker Management first.');
      return;
    }

    // Only require worker and date
    if (!formData.workerId || !formData.date) {
      alert('Worker and date are required');
      return;
    }

    // Validate: quantity_received cannot exceed remaining work from production summary
    const qtyReceived = formData.qtyReceived ? parseInt(formData.qtyReceived) : 0;
    const qtyWorked = formData.qtyWorked ? parseInt(formData.qtyWorked) : 0;
    const remainingWork = subBatch?.remaining_work ?? 0;

    if (qtyReceived > 0 && remainingWork > 0 && qtyReceived > remainingWork) {
      alert(`Quantity received cannot exceed the remaining work!\nRemaining work: ${remainingWork.toLocaleString()} pieces\nYou entered: ${qtyReceived.toLocaleString()} pieces`);
      return;
    }

    // Validate: quantity_worked cannot be more than quantity_received
    if (qtyReceived > 0 && qtyWorked > qtyReceived) {
      alert('Quantity worked cannot be more than quantity received!');
      return;
    }

    // Validate: quantity_received should be equal or less than the sum of quantity_worked + reject & return + alteration
    const rejectReturnQty = formData.rejectReturn ? parseInt(formData.rejectReturn) : 0;
    const alterationQty = formData.alteration ? parseInt(formData.alteration) : 0;
    const totalAccountedFor = qtyWorked + rejectReturnQty + alterationQty;

    if (qtyReceived > 0 && totalAccountedFor > qtyReceived) {
      alert(
        `Total quantities cannot exceed quantity received!\n\n` +
        `Quantity Received: ${qtyReceived.toLocaleString()}\n` +
        `Quantity Worked: ${qtyWorked.toLocaleString()}\n` +
        `Reject & Return: ${rejectReturnQty.toLocaleString()}\n` +
        `Alteration: ${alterationQty.toLocaleString()}\n\n` +
        `Total (Worked + Rejected + Altered): ${totalAccountedFor.toLocaleString()}\n\n` +
        `Please ensure the sum of Worked, Rejected, and Altered does not exceed Quantity Received.`
      );
      return;
    }

    // Skip rejection/alteration validation for cards that are already alteration/rejection cards
    const isAlterationOrRejectionCard = (subBatch as any)?.alteration_source || (subBatch as any)?.rejection_source;

    if (!isAlterationOrRejectionCard) {
      // Validate rejected data - all fields must be filled if any is filled
      const hasRejectData = formData.rejectReturn || formData.returnTo || formData.rejectionReason;
      if (hasRejectData) {
        if (!formData.rejectReturn || !formData.returnTo || !formData.rejectionReason) {
          alert('Please fill all rejection fields (Reject & Return, Return To, and Reason) or leave them all empty');
          return;
        }
        const rejectQty = parseInt(formData.rejectReturn);
        if (isNaN(rejectQty) || rejectQty <= 0) {
          alert('Reject & Return quantity must be a positive number');
          return;
        }
      }

      // Validate alteration data - all fields must be filled if any is filled
      const hasAlterationData = formData.alteration || formData.alterationReturnTo || formData.alterationNote;
      if (hasAlterationData) {
        if (!formData.alteration || !formData.alterationReturnTo || !formData.alterationNote) {
          alert('Please fill all alteration fields (Alteration, Alteration Return To, and Alteration Note) or leave them all empty');
          return;
        }
        const alterQty = parseInt(formData.alteration);
        if (isNaN(alterQty) || alterQty <= 0) {
          alert('Alteration quantity must be a positive number');
          return;
        }
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
        is_billable: formData.isBillable, // Add billable status
        department_id: subBatch?.department_id, // Add department ID
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
                disabled={loading || isPreviewMode || workers.length === 0 || (workers.length === 1 && subBatch?.remarks === 'Assigned')}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isPreviewMode || workers.length === 0 || (workers.length === 1 && subBatch?.remarks === 'Assigned') ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">
                  {loading
                    ? 'Loading...'
                    : workers.length === 0
                    ? 'No workers available'
                    : 'Select Worker'}
                </option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {!loading && workers.length === 0 && !subBatch?.assigned_worker && (
                <p className="text-xs text-orange-600 mt-1">
                  No workers assigned to your department.
                </p>
              )}
              {/* Only show locked message if there's exactly 1 worker (locked to assigned worker from current department) */}
              {!loading && workers.length === 1 && subBatch?.remarks === 'Assigned' && subBatch?.assigned_worker && (
                <p className="text-xs text-blue-600 mt-1">
                  This card is assigned to {subBatch.assigned_worker.name}. Worker cannot be changed.
                </p>
              )}
              {/* Show helpful message for cross-department assigned cards */}
              {!loading && workers.length > 1 && subBatch?.remarks === 'Assigned' && subBatch?.assigned_worker && (
                <p className="text-xs text-green-600 mt-1">
                  Card from {subBatch.assigned_worker.name} ({subBatch.sent_from_department || 'previous department'}). You can assign any worker from your department.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Date</label>
              <NepaliDatePicker
                value={formData.date}
                onChange={(value) => handleChange({ target: { name: 'date', value } } as any)}
                disabled={isPreviewMode}
                placeholder="Select Date"
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

          {/* Show info for Main/Unassigned cards */}
          {subBatch && (!subBatch.remarks || subBatch.remarks === 'Main') && (
            <div className="border-2 rounded-lg p-4 bg-gray-50 border-gray-400">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg text-gray-900">
                  MAIN CARD (Unassigned)
                </span>
                <span className="px-3 py-1 rounded-md font-bold text-white bg-gray-600">
                  {(subBatch.quantity_remaining || subBatch.estimated_pieces)?.toLocaleString()} PCS
                </span>
              </div>
              <p className="text-sm text-gray-800">
                This is the main card. Assigning work with quantity will create a new assigned card for that worker.
              </p>
            </div>
          )}

          {/* Show info for Assigned cards */}
          {subBatch?.remarks === 'Assigned' && (
            <div className="border-2 rounded-lg p-4 bg-blue-50 border-blue-400">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg text-blue-900">
                  ASSIGNED CARD
                </span>
                <span className="px-3 py-1 rounded-md font-bold text-white bg-blue-600">
                  {(subBatch.quantity_assigned || subBatch.quantity_remaining)?.toLocaleString()} PCS
                </span>
              </div>
              <p className="text-sm text-blue-800">
                This is an assigned card. Adding records will update this card only (no splitting).
              </p>
              {subBatch.assigned_worker && (
                <p className="text-xs text-blue-700 mt-1">
                  <strong>Current Assignment:</strong> {subBatch.assigned_worker.name}
                </p>
              )}
            </div>
          )}

          {/* Show quantity_remaining and remarks for rejected/altered items */}
          {subBatch && (subBatch as any).quantity_remaining && (subBatch as any).remarks &&
           (subBatch as any).remarks !== 'Assigned' && (subBatch as any).remarks !== 'Main' && (
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
              {subBatch?.remaining_work !== undefined && subBatch.remaining_work >= 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Remaining: <span className="font-semibold text-blue-600">{subBatch.remaining_work.toLocaleString()}</span> pieces
                </p>
              )}
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

          {/* Billable Work Checkbox - Only show in add mode */}
          {mode === 'add' && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <input
                type="checkbox"
                id="isBillable"
                name="isBillable"
                checked={formData.isBillable}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isBillable" className="text-sm font-medium text-gray-900 cursor-pointer">
                Billable Work
              </label>
              <span className="text-xs text-gray-600 ml-auto">
                (Uncheck if this is rework on rejected pieces)
              </span>
            </div>
          )}

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

          {/* Additional Tracking - Only show for regular cards, not for alteration/rejection cards */}
          {!(subBatch as any)?.alteration_source && !(subBatch as any)?.rejection_source && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-700">Additional Tracking</h4>

            {/* Alteration */}
            <div className="grid grid-cols-2 gap-4">
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
          )}
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
              disabled={isSubmitting || loading || (mode === 'add' && !subBatch) || workers.length === 0}
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
