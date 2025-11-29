/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Plus, ChevronDown, ChevronRight, CheckCircle, Clock, Inbox, Pencil, Trash2, MoreVertical, Edit3, AlertTriangle } from 'lucide-react';
import NepaliDatePicker from '@/app/Components/NepaliDatePicker';

interface AlteredTaskData {
    id: number;
    roll_name: string;
    batch_name: string;
    sub_batch_name: string;
    total_quantity: number;
    original_quantity?: number;  // Original sub-batch quantity
    estimated_start_date: string;
    due_date: string;
    status: string;
    sent_from_department: string;
    alteration_date: string;
    altered_by: string;
    altered_quantity: number;
    alter_reason?: string;  // Alteration reason from database
    attachments?: { name: string; count: number }[];
    quantity_remaining?: number;
    sub_batch?: any;  // Add sub_batch object for accessing estimated_pieces
    // ✅ Add alteration_source from backend
    alteration_source?: {
        from_department_id: number;
        from_department_name: string;
        quantity: number;
        reason: string;
        created_at: string;
    } | null;
}

interface AlteredTaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskData: AlteredTaskData;
    onStageChange?: () => void;
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

interface WorkerRecord {
    id: number;
    worker_name: string;
    quantity: number;
    date: string;
    is_billable: boolean;
}

const AlteredTaskDetailsModal: React.FC<AlteredTaskDetailsModalProps> = ({
    isOpen,
    onClose,
    taskData,
    onStageChange
}) => {
    const [status, setStatus] = useState(taskData.status || 'NEW_ARRIVAL');
    const [saving, setSaving] = useState(false);
    const [workerRecords, setWorkerRecords] = useState<WorkerRecord[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loadingWorkers, setLoadingWorkers] = useState(false);
    const [newWorkerId, setNewWorkerId] = useState('');
    const [newWorkerQuantity, setNewWorkerQuantity] = useState('');
    const [newWorkerDate, setNewWorkerDate] = useState('');
    const [sendToDepartment, setSendToDepartment] = useState('');
    const [quantityBeingSent, setQuantityBeingSent] = useState('');
    const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [subBatchHistory, setSubBatchHistory] = useState<any>(null);
    const [expandedDepartments, setExpandedDepartments] = useState<number[]>([]);
    const [editingWorkerId, setEditingWorkerId] = useState<number | null>(null);
    const [editQuantity, setEditQuantity] = useState('');
    const [editDate, setEditDate] = useState('');
    const [isBillable, setIsBillable] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    // Fetch sub-batch history (department flow and worker logs)
    const fetchSubBatchHistory = useCallback(async () => {
        // For altered tasks, we need to get the actual sub_batch_id, not the department_sub_batch_id
        const subBatchId = taskData?.sub_batch?.id;

        if (!subBatchId) {
            console.error('Sub-batch ID not found in taskData');
            console.log('Available taskData:', taskData);
            return;
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_SUB_BATCH_HISTORY}/${subBatchId}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error('Error fetching sub-batch history:', response.status);
                return;
            }

            const result = await response.json();
            console.log('======= SUB-BATCH HISTORY API RESPONSE (ALTERED) =======');
            console.log('API Result:', result);
            console.log('========================================================');

            if (result.success) {
                setSubBatchHistory(result);
            }
        } catch (error) {
            console.error('Error fetching sub-batch history:', error);
        }
    }, [taskData]);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`);
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    }, []);

    const fetchWorkers = useCallback(async () => {
        try {
            setLoadingWorkers(true);
            const departmentId = localStorage.getItem("departmentId");

            if (!departmentId) {
                console.error('No department ID found in localStorage');
                setWorkers([]);
                setLoadingWorkers(false);
                return;
            }

            console.log('Fetching workers for department:', departmentId);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/department/${departmentId}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Workers data received:', data);
                setWorkers(data);
            } else {
                console.error('Failed to fetch workers. Status:', res.status);
            }
        } catch (e) {
            console.error('Error fetching workers:', e);
        } finally {
            setLoadingWorkers(false);
        }
    }, []);

    const fetchWorkerRecords = useCallback(async () => {
        if (!taskData?.sub_batch?.id) return;

        const subBatchId = taskData.sub_batch.id;
        const apiUrl = `${process.env.NEXT_PUBLIC_GET_WORKER_LOGS}/${subBatchId}`;

        try {
            setLoadingWorkers(true);
            const response = await fetch(apiUrl);
            const contentType = response.headers.get('content-type');

            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Backend returned non-JSON:', text);
                return;
            }

            if (!response.ok) {
                const text = await response.text();
                console.error('Error fetching worker logs:', response.status, text);
                setWorkerRecords([]);
                return;
            }

            const result = await response.json();
            console.log('Worker Logs API Response:', result);

            // Get current department ID
            const currentDepartmentId = localStorage.getItem("departmentId");
            console.log('Current Department ID:', currentDepartmentId);

            if (result.success && Array.isArray(result.data)) {
                // Filter to show ONLY workers assigned to this altered sub-batch in the CURRENT department
                const filteredData = result.data.filter((r: any) => {
                    const isAltered = r.activity_type === 'ALTERED';
                    const isCurrentDepartment = r.department_id && currentDepartmentId &&
                                               r.department_id.toString() === currentDepartmentId.toString();
                    return isAltered && isCurrentDepartment;
                });

                console.log('Filtered ALTERED workers for current department:', filteredData);

                const mappedRecords = filteredData.map((r: any) => ({
                    id: r.id,
                    worker_name: r.worker_name || r.worker?.name || '-',
                    quantity: r.quantity_worked ?? 0,
                    date: r.work_date ? new Date(r.work_date).toLocaleDateString('en-US') : '-',
                    is_billable: r.is_billable ?? true,
                }));
                setWorkerRecords(mappedRecords);
            } else {
                setWorkerRecords([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setWorkerRecords([]);
        } finally {
            setLoadingWorkers(false);
        }
    }, [taskData]);

    useEffect(() => {
        if (taskData) {
            console.log('======= ALTERED TASK DATA =======');
            console.log('Full Task Data:', JSON.stringify(taskData, null, 2));
            console.log('ID:', taskData.id);
            console.log('Sent from Department:', taskData.sent_from_department);
            console.log('Altered Quantity:', taskData.altered_quantity);
            console.log('Altered By:', taskData.altered_by);
            console.log('Alteration Date:', taskData.alteration_date);
            console.log('Alteration Reason:', taskData.alter_reason);
            console.log('Sub-batch:', taskData.sub_batch);
            console.log('================================');

            setStatus(taskData.status || 'NEW_ARRIVAL');
            // Load assigned workers for this altered task
            fetchWorkerRecords();
            // Fetch departments
            fetchDepartments();
            // Fetch workers for department
            fetchWorkers();
            // Fetch sub-batch history
            fetchSubBatchHistory();
        }
    }, [taskData, fetchSubBatchHistory, fetchWorkerRecords, fetchDepartments, fetchWorkers]);

    const handleAddWorker = async () => {
        // Calculate remaining work from production summary
        const receivedQuantity = taskData.quantity_remaining ?? taskData.altered_quantity;
        const workedQuantity = workerRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);
        const remainingWork = receivedQuantity - workedQuantity;

        // Check if there's remaining work
        if (remainingWork <= 0) {
            alert('Cannot add worker!\n\nThere is no remaining work. All received quantity has been assigned to workers.');
            return;
        }

        // Require worker, quantity, and date (quantity is now REQUIRED)
        if (!newWorkerId || !newWorkerDate || !newWorkerQuantity || !newWorkerQuantity.trim()) {
            alert('Please select worker, enter quantity, and select date');
            return;
        }

        // Validate quantity is a positive number
        const quantity = parseInt(newWorkerQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity greater than 0');
            return;
        }

        // Check if the entered quantity exceeds remaining work
        if (quantity > remainingWork) {
            alert(`Cannot assign ${quantity} units!\n\nOnly ${remainingWork} units remaining from the altered quantity of ${receivedQuantity}.\n\nAlready assigned: ${workedQuantity} units`);
            return;
        }

        const selectedWorker = workers.find(w => w.id === parseInt(newWorkerId));

        if (!selectedWorker) {
            alert('Selected worker not found');
            return;
        }

        if (!taskData?.sub_batch?.id) {
            alert('Sub-batch ID is missing');
            console.error('taskData.sub_batch:', taskData?.sub_batch);
            return;
        }

        setSaving(true);

        try {
            // Get department ID - ensure it's an integer
            const departmentId = taskData.sub_batch?.department_id || localStorage.getItem("departmentId");
            const parsedDepartmentId = typeof departmentId === 'string' ? parseInt(departmentId) : departmentId;

            console.log('======= WORKER ASSIGNMENT DEBUG =======');
            console.log('Selected Worker:', selectedWorker);
            console.log('Quantity:', newWorkerQuantity);
            console.log('Date:', newWorkerDate);
            console.log('Sub-batch ID:', taskData.sub_batch?.id);
            console.log('Department ID (raw):', departmentId);
            console.log('Department ID (parsed):', parsedDepartmentId);

            if (!parsedDepartmentId) {
                alert('Error: Department ID is missing!');
                setSaving(false);
                return;
            }

            // Build payload with required quantity
            const payload: any = {
                worker_id: parseInt(newWorkerId),
                worker_name: selectedWorker.name,
                work_date: newWorkerDate,
                activity_type: 'ALTERED',  // For altered cards
                is_billable: isBillable,  // Use billable state
                department_id: parsedDepartmentId,
                quantity_received: quantity,  // Required field
                quantity_worked: quantity,    // Required field
                sub_batch_id: taskData.sub_batch.id
            };

            console.log('Final Payload:', JSON.stringify(payload, null, 2));
            console.log('API URL:', process.env.NEXT_PUBLIC_CREATE_WORKER_LOGS);
            console.log('======================================');

            const response = await fetch(`${process.env.NEXT_PUBLIC_CREATE_WORKER_LOGS}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            console.log('Response status:', response.status);
            console.log('Response OK:', response.ok);

            if (response.ok) {
                const result = await response.json();
                console.log('======= SUCCESS RESPONSE =======');
                console.log('Result:', JSON.stringify(result, null, 2));
                console.log('================================');

                // Refresh worker records
                await fetchWorkerRecords();

                alert('Worker assigned successfully!');
                setNewWorkerId('');
                setNewWorkerQuantity('');
                setNewWorkerDate('');
                setIsBillable(true);
            } else {
                const errorText = await response.text();
                console.error('======= ERROR RESPONSE =======');
                console.error('Status:', response.status);
                console.error('Status Text:', response.statusText);
                console.error('Error Body:', errorText);
                console.error('==============================');

                let errorMessage = 'Unknown error';
                try {
                    const err = JSON.parse(errorText);
                    errorMessage = err.message || err.error || errorText;
                } catch {
                    errorMessage = errorText;
                }
                alert(`Failed to save worker!\n\nError: ${errorMessage}\n\nCheck console for full details.`);
            }
        } catch (e) {
            console.error('======= EXCEPTION =======');
            console.error('Exception while saving:', e);
            console.error('Stack:', e instanceof Error ? e.stack : 'No stack trace');
            console.error('=========================');
            alert(`Error saving record!\n\n${e instanceof Error ? e.message : 'Unknown error'}\n\nCheck console for details.`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWorker = async (workerId: number) => {
        if (!confirm('Are you sure you want to delete this worker assignment?')) {
            return;
        }

        try {
            setSaving(true);
            const apiUrl = `${process.env.NEXT_PUBLIC_DELETE_WORKER_LOG}/${workerId}`;

            console.log('Deleting worker log:', workerId);
            console.log('API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Worker assignment deleted successfully!');
                await fetchWorkerRecords();
            } else {
                const errorText = await response.text();
                console.error('Error deleting worker:', errorText);
                alert(`Failed to delete worker: ${errorText}`);
            }
        } catch (error) {
            console.error('Error deleting worker:', error);
            alert('Error deleting worker. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditWorker = (record: WorkerRecord) => {
        setEditingWorkerId(record.id);
        setEditQuantity(record.quantity.toString());
        // Convert the date from MM/DD/YYYY to YYYY-MM-DD for the input field
        const dateParts = record.date.split('/');
        if (dateParts.length === 3) {
            const formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
            setEditDate(formattedDate);
        }
    };

    const handleCancelEdit = () => {
        setEditingWorkerId(null);
        setEditQuantity('');
        setEditDate('');
    };

    const handleSaveEdit = async (workerId: number) => {
        // Validate quantity
        if (!editQuantity || !editQuantity.trim()) {
            alert('Please enter quantity');
            return;
        }

        const quantity = parseInt(editQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity greater than 0');
            return;
        }

        // Validate date
        if (!editDate) {
            alert('Please select a date');
            return;
        }

        // Calculate remaining work (excluding the current worker being edited)
        const receivedQuantity = taskData.quantity_remaining ?? taskData.altered_quantity;
        const otherWorkersQuantity = workerRecords
            .filter(record => record.id !== workerId)
            .reduce((sum, record) => sum + (record.quantity || 0), 0);
        const remainingWork = receivedQuantity - otherWorkersQuantity;

        // Check if the new quantity exceeds remaining work
        if (quantity > remainingWork) {
            alert(`Cannot assign ${quantity} units!\n\nOnly ${remainingWork} units available (excluding current assignment).\n\nTotal altered quantity: ${receivedQuantity}\nOther workers: ${otherWorkersQuantity} units`);
            return;
        }

        try {
            setSaving(true);
            const apiUrl = `${process.env.NEXT_PUBLIC_UPDATE_WORKER_LOG}/${workerId}`;

            const payload = {
                quantity_worked: quantity,
                quantity_received: quantity,
                work_date: editDate,
            };

            console.log('Updating worker log:', workerId);
            console.log('Payload:', payload);
            console.log('API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert('Worker assignment updated successfully!');
                await fetchWorkerRecords();
                handleCancelEdit();
            } else {
                const errorText = await response.text();
                console.error('Error updating worker:', errorText);
                alert(`Failed to update worker: ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating worker:', error);
            alert('Error updating worker. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const handleSave = async () => {
        if (!taskData?.id) {
            alert('Task data is missing');
            return;
        }

        // If the task is ALREADY in COMPLETED stage, status is still COMPLETED, and user selects a department to send to
        if (taskData.status === 'COMPLETED' && status === 'COMPLETED' && sendToDepartment) {
            try {
                setSaving(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    alert('Authentication required. Please login again.');
                    return;
                }

                // Validate quantityBeingSent
                if (!quantityBeingSent || !quantityBeingSent.trim()) {
                    alert('Please enter the quantity you want to send to the next department');
                    setSaving(false);
                    return;
                }

                const quantity = parseInt(quantityBeingSent);
                const availableQuantity = taskData.quantity_remaining ?? taskData.altered_quantity;

                if (isNaN(quantity) || quantity <= 0) {
                    alert('Please enter a valid quantity greater than 0');
                    setSaving(false);
                    return;
                }

                if (quantity > availableQuantity) {
                    alert(`Cannot send ${quantity} pieces!\n\nOnly ${availableQuantity} pieces are available.\n\nPlease enter a quantity between 1 and ${availableQuantity}.`);
                    setSaving(false);
                    return;
                }

                const apiUrl = process.env.NEXT_PUBLIC_SEND_TO_ANOTHER_DEPARTMENT;
                const requestBody = {
                    departmentSubBatchId: taskData.id,
                    toDepartmentId: parseInt(sendToDepartment),
                    quantityBeingSent: quantity,
                };

                console.log('Sending altered task to another department:', requestBody);

                const response = await fetch(apiUrl!, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to send to department');
                }

                const result = await response.json();

                if (result.success) {
                    alert('Successfully sent to department!');
                    onClose();
                    setSendToDepartment('');
                    setQuantityBeingSent('');

                    setTimeout(() => {
                        if (onStageChange) {
                            onStageChange();
                        } else {
                            window.location.reload();
                        }
                    }, 500);
                } else {
                    throw new Error(result.message || 'Failed to send to department');
                }
            } catch (error) {
                console.error('Error sending to department:', error);
                alert(`Failed to send to department: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setSaving(false);
            }
        } else if (taskData.status === 'COMPLETED' && status === 'COMPLETED' && !sendToDepartment) {
            // Task is already completed, status is still completed, but no department selected
            alert('Please select a department to send this completed task to');
            return;
        } else {
            // Normal stage update (including moving to COMPLETED for the first time OR changing status from COMPLETED to something else)
            try {
                setSaving(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    alert('Authentication required. Please login again.');
                    return;
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/sub-batches/move-stage`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            departmentSubBatchId: taskData.id,
                            toStage: status,
                        }),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to update stage');
                }

                const result = await response.json();

                if (result.success) {
                    alert('Status updated successfully!');
                    onClose();
                    // Refresh the kanban board
                    if (onStageChange) {
                        onStageChange();
                    }
                } else {
                    throw new Error(result.message || 'Failed to update stage');
                }
            } catch (error) {
                console.error('Error updating stage:', error);
                alert(error instanceof Error ? error.message : 'Failed to update status. Please try again.');
            } finally {
                setSaving(false);
            }
        }
    };

    // Handle marking sub-batch as completed
    const handleMarkAsCompleted = async () => {
        if (confirmationText.toLowerCase() !== 'yes') {
            alert('Please type "yes" to confirm marking this sub-batch as completed');
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token');

            if (!token) {
                alert('Authentication required. Please login again.');
                return;
            }

            const subBatchId = taskData.id;

            if (!subBatchId) {
                alert('Cannot mark as completed: Sub-batch ID is missing');
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/sub-batches/mark-completed`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        subBatchId: Number(subBatchId),
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to mark sub-batch as completed');
            }

            const result = await response.json();

            if (result.success) {
                alert('Sub-batch has been marked as COMPLETED! It can no longer be moved.');
                setShowCompletionDialog(false);
                setConfirmationText('');
                onClose();

                // Refresh the Kanban board
                setTimeout(() => {
                    if (onStageChange) {
                        onStageChange();
                    } else {
                        window.location.reload();
                    }
                }, 500);
            } else {
                throw new Error(result.message || 'Failed to mark sub-batch as completed');
            }
        } catch (error: any) {
            console.error('Error marking as completed:', error);
            alert(`Failed to mark as completed: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !taskData) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div className="bg-white rounded-lg w-[95vw] max-w-[800px] mx-4 relative shadow-xl max-h-[95vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
                        <h3 className="text-2xl font-bold text-gray-900">Task Details</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content - Two Column Layout */}
                    <div className="overflow-y-auto flex-1 grid grid-cols-[2fr_1fr]">
                        {/* Left Column - All content */}
                        <div className="px-8 py-6 border-r border-gray-200">
                            {/* ⚠️ ALTERATION ALERT BANNER - Prominent context */}
                            <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="text-white" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-yellow-900 mb-1.5 flex items-center gap-2">
                                            <Edit3 size={16} />
                                            Alteration Card - Rework Required
                                        </h4>
                                        <p className="text-xs text-yellow-800 leading-relaxed">
                                            This card contains <span className="font-semibold">{taskData.altered_quantity} pieces</span> that were sent back from{' '}
                                            <span className="font-semibold">{taskData.altered_by}</span>{' '}
                                            for rework due to: <span className="font-semibold italic">&quot;{taskData.alter_reason || 'quality issues'}&quot;</span>
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                                <Clock size={12} />
                                                Received: {formatDate(taskData.alteration_date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Task Information */}
                            <div className="mb-8">
                                <h4 className="text-lg font-semibold mb-6 text-gray-900">Task Information</h4>
                                <div className="space-y-6">
                                    {/* Row 1: Roll Name & Batch Name */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Roll Name</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600">
                                                {taskData.roll_name}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Batch Name</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600">
                                                {taskData.batch_name}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Sub Batch Name & Total Quantity */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Sub Batch Name</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600">
                                                {taskData.sub_batch_name}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Total Quantity</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600">
                                                {(taskData.original_quantity || taskData.sub_batch?.estimated_pieces || taskData.total_quantity).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: Estimated Start Date & Due Date */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Estimated Start Date</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 flex items-center justify-between">
                                                <span>{formatDate(taskData.estimated_start_date)}</span>
                                                <Calendar size={16} className="text-gray-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Due Date</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 flex items-center justify-between">
                                                <span>{formatDate(taskData.due_date)}</span>
                                                <Calendar size={16} className="text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 4: Sent from Department (full width, only when COMPLETED) */}
                                    {taskData.status === 'COMPLETED' && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Sent from Department</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 w-fit">
                                                {taskData.sent_from_department}
                                            </div>
                                        </div>
                                    )}

                                    {/* Row 5: Status and Sent from Department / Send to Department */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Status</label>
                                            <div className="relative">
                                                <select
                                                    value={status}
                                                    onChange={(e) => setStatus(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="NEW_ARRIVAL">Not Started</option>
                                                    <option value="IN_PROGRESS">In Progress</option>
                                                    <option value="COMPLETED">Completed</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Show Sent from Department when NOT completed (side by side with Status) */}
                                        {taskData.status !== 'COMPLETED' && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-900 block mb-2">Sent from Department</label>
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600">
                                                    {taskData.sent_from_department}
                                                </div>
                                            </div>
                                        )}

                                        {/* Show Send to Department ONLY when task is ALREADY COMPLETED in DB AND dropdown is still COMPLETED */}
                                        {taskData.status === 'COMPLETED' && status === 'COMPLETED' && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-900 block mb-2">Send to Department</label>
                                                <div className="relative">
                                                    <select
                                                        value={sendToDepartment}
                                                        onChange={(e) => {
                                                            setSendToDepartment(e.target.value);
                                                            // Auto-fill quantity with available quantity when department is selected
                                                            if (e.target.value && !quantityBeingSent) {
                                                                setQuantityBeingSent((taskData.quantity_remaining ?? taskData.altered_quantity).toString());
                                                            }
                                                        }}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Department</option>
                                                        {departments.map((dept) => (
                                                            <option key={dept.id} value={dept.id}>
                                                                {dept.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Row 6: Quantity to Send (only when sending to another department) */}
                                    {taskData.status === 'COMPLETED' && status === 'COMPLETED' && sendToDepartment && (
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-gray-900 block mb-2">
                                                    Quantity to Send <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={quantityBeingSent}
                                                    onChange={(e) => setQuantityBeingSent(e.target.value)}
                                                    placeholder="Enter quantity"
                                                    min="1"
                                                    max={taskData.quantity_remaining ?? taskData.altered_quantity}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Available: {(taskData.quantity_remaining ?? taskData.altered_quantity).toLocaleString()} pieces
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Alteration Details Section - Enhanced Design */}
                            <div className="mb-8 border border-yellow-200 rounded-lg overflow-hidden shadow-sm">
                                {/* Section Header */}
                                <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 px-4 py-3 border-b border-yellow-200">
                                    <h4 className="font-bold text-base text-yellow-900 flex items-center gap-2">
                                        <Edit3 size={18} className="text-yellow-700" />
                                        Alteration Details
                                    </h4>
                                </div>

                                {/* Alteration Data Grid */}
                                <div className="bg-white p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Date Received */}
                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Date Received</label>
                                            <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                                                <Calendar size={16} className="text-gray-500" />
                                                <span>{formatDate(taskData.alteration_date)}</span>
                                            </div>
                                        </div>

                                        {/* Source Department */}
                                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                            <label className="text-xs font-semibold text-yellow-800 uppercase tracking-wide block mb-1.5">Source Department</label>
                                            <div className="text-sm text-yellow-900 font-bold">
                                                {taskData.altered_by}
                                            </div>
                                        </div>

                                        {/* Quantity Altered */}
                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                            <label className="text-xs font-semibold text-blue-800 uppercase tracking-wide block mb-1.5">Quantity Altered</label>
                                            <div className="text-lg text-blue-900 font-bold">
                                                {taskData.altered_quantity.toLocaleString()} pcs
                                            </div>
                                        </div>

                                        {/* Alteration Reason */}
                                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                            <label className="text-xs font-semibold text-orange-800 uppercase tracking-wide block mb-1.5">Reason for Alteration</label>
                                            <div className="text-sm text-orange-900 font-medium italic">
                                                &quot;{taskData.alter_reason || '-'}&quot;
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Attachments */}
                            {taskData.attachments && taskData.attachments.length > 0 && (
                                <div className="mb-8 pb-8 border-b border-gray-200">
                                    <h4 className="text-lg font-semibold mb-4 text-gray-900">Attachments</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {taskData.attachments.map((attachment, index) => (
                                            <div
                                                key={index}
                                                className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg text-sm border border-gray-200"
                                            >
                                                <span className="text-gray-700">{attachment.name}</span>
                                                <span className="text-gray-500">:</span>
                                                <span className="font-medium text-gray-900">{attachment.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Production Summary */}
                            <div className="mb-8">
                                <h4 className="text-lg font-semibold mb-6 text-gray-900">Production Summary</h4>
                                <div className="flex items-start gap-12">
                                    {/* Received */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Inbox className="text-blue-500" size={18} />
                                            <span className="text-sm text-gray-600">Received</span>
                                        </div>
                                        <p className="text-[16px] text-center font-semibold text-gray-900">
                                            {(taskData.quantity_remaining ?? taskData.altered_quantity).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Worked */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="text-green-500" size={18} />
                                            <span className="text-sm text-gray-600">Worked</span>
                                        </div>
                                        <p className="text-[16px] text-center font-semibold text-gray-900">

                                            {workerRecords.reduce((sum, record) => sum + (record.quantity || 0), 0).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Remaining */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="text-blue-500" size={18} />
                                            <span className="text-sm text-gray-600">Remaining</span>
                                        </div>
                                        <p className="text-[16px] text-center font-semibold text-gray-900">

                                            {((taskData.quantity_remaining ?? taskData.altered_quantity) - workerRecords.reduce((sum, record) => sum + (record.quantity || 0), 0)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Completed Departments */}
                            {subBatchHistory && subBatchHistory.department_details && subBatchHistory.department_details.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-lg font-semibold mb-4 text-gray-900">Completed Departments</h4>
                                    <div className="space-y-2">
                                        {subBatchHistory.department_details
                                            .filter((dept: any) => dept.worker_logs && dept.worker_logs.length > 0)
                                            .map((dept: any) => {
                                                const isExpanded = expandedDepartments.includes(dept.department_entry_id);
                                                return (
                                                    <div key={dept.department_entry_id} className="border border-gray-300 rounded-lg w-[450px]">
                                                        <button
                                                            onClick={() => {
                                                                if (isExpanded) {
                                                                    setExpandedDepartments(expandedDepartments.filter(id => id !== dept.department_entry_id));
                                                                } else {
                                                                    setExpandedDepartments([...expandedDepartments, dept.department_entry_id]);
                                                                }
                                                            }}
                                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-t-lg"
                                                        >
                                                            <span className="text-sm font-medium text-gray-900">{dept.department_name}</span>
                                                            <ChevronRight
                                                                size={16}
                                                                className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                            />
                                                        </button>

                                                        {isExpanded && dept.worker_logs && dept.worker_logs.length > 0 && (
                                                            <div className="border-t border-gray-200 bg-gray-50">
                                                                <div className="overflow-x-auto ">
                                                                    <table className="border-collapse w-auto">
                                                                        <thead className="bg-gray-100">
                                                                            <tr>
                                                                                <th className="p-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Worker</th>
                                                                                <th className="p-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Date</th>
                                                                                <th className="p-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Size/Category</th>
                                                                                <th className="p-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Particulars</th>
                                                                                <th className="p-3 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Qty Received</th>
                                                                                <th className="p-3 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Qty Worked</th>
                                                                                <th className="p-3 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Unit Price</th>
                                                                                <th className="p-3 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Rejected</th>
                                                                                <th className="p-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Returned Dept</th>
                                                                                <th className="p-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Rejection Reason</th>
                                                                                <th className="p-3 text-right text-xs font-medium text-gray-700 whitespace-nowrap">Alteration</th>
                                                                                <th className="p-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">Alteration Note</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-200">
                                                                            {dept.worker_logs.map((log: any, index: number) => {
                                                                                // Extract rejection data from rejected array
                                                                                const rejectedData = log.rejected && log.rejected.length > 0 ? log.rejected[0] : null;
                                                                                const rejectedQty = rejectedData?.quantity ?? 0;
                                                                                const rejectedDept = rejectedData?.sent_to_department_name || '-';
                                                                                const rejectionReason = rejectedData?.reason || '-';

                                                                                // Extract alteration data from altered array
                                                                                const alteredData = log.altered && log.altered.length > 0 ? log.altered[0] : null;
                                                                                const alteredQty = alteredData?.quantity ?? 0;
                                                                                const alterationNote = alteredData?.reason || '-';

                                                                                return (
                                                                                    <tr key={index} className="hover:bg-gray-100">
                                                                                        <td className="p-3 text-xs text-gray-900 whitespace-nowrap">{log.worker_name || 'Unknown'}</td>
                                                                                        <td className="p-3 text-xs text-gray-600 whitespace-nowrap">
                                                                                            {log.work_date ? new Date(log.work_date).toLocaleDateString('en-US') : '-'}
                                                                                        </td>
                                                                                        <td className="p-3 text-xs text-gray-600">{log.size_category || '-'}</td>
                                                                                        <td className="p-3 text-xs text-gray-600">{log.particulars || '-'}</td>
                                                                                        <td className="p-3 text-xs text-gray-600 text-right">{log.quantity_received ?? 0}</td>
                                                                                        <td className="p-3 text-xs text-gray-600 text-right">{log.quantity_worked ?? 0}</td>
                                                                                        <td className="p-3 text-xs text-gray-600 text-right">${log.unit_price ?? 0}</td>
                                                                                        <td className={`p-3 text-xs text-right font-semibold ${rejectedQty > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                                                            {rejectedQty}
                                                                                        </td>
                                                                                        <td className="p-3 text-xs text-gray-600">{rejectedDept}</td>
                                                                                        <td className="p-3 text-xs text-gray-600">{rejectionReason}</td>
                                                                                        <td className={`p-3 text-xs text-right font-semibold ${alteredQty > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                                                                                            {alteredQty}
                                                                                        </td>
                                                                                        <td className="p-3 text-xs text-gray-600">{alterationNote}</td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Assign Workers Section */}
                            <div>
                                <h4 className="text-lg font-semibold mb-4 text-gray-900">Assign Workers</h4>

                                {/* Input Row */}
                                <div className="flex items-end gap-3 mb-4">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-900 block mb-2">Worker Name</label>
                                        <select
                                            value={newWorkerId}
                                            onChange={(e) => setNewWorkerId(e.target.value)}
                                            disabled={loadingWorkers || workers.length === 0}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">
                                                {loadingWorkers
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
                                        {!loadingWorkers && workers.length === 0 && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                No workers assigned to your department.
                                            </p>
                                        )}

                                        {/* Billable Checkbox - Only shown when worker is selected */}
                                        {newWorkerId && (
                                            <div className="flex items-center gap-2 mt-3">
                                                <input
                                                    type="checkbox"
                                                    id="billable-checkbox"
                                                    checked={isBillable}
                                                    onChange={(e) => setIsBillable(e.target.checked)}
                                                    className="w-4 h-4 text-blue-500 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500 accent-blue-500 cursor-pointer"
                                                />
                                                <label htmlFor="billable-checkbox" className="text-sm text-gray-700 cursor-pointer select-none">
                                                    Billable
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-32">
                                        <label className="text-sm font-medium text-gray-900 block mb-2">
                                            Quantity <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={newWorkerQuantity}
                                            onChange={(e) => setNewWorkerQuantity(e.target.value)}
                                            placeholder="Required"
                                            min="1"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            required
                                        />
                                    </div>
                                    <div className="w-40">
                                        <label className="text-sm font-medium text-gray-900 block mb-2">Date</label>
                                        <div className="relative">
                                            <NepaliDatePicker
                                                value={newWorkerDate}
                                                onChange={(value) => setNewWorkerDate(value)}
                                                placeholder="Select Date"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddWorker}
                                        className="inline-flex items-center justify-center w-9 h-9 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0"
                                        title="Add worker"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>

                                {/* Workers Table */}
                                {workerRecords.length > 0 && (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                                            <h5 className="text-sm font-semibold text-gray-900">Assigned Workers</h5>
                                        </div>
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Worker Name</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantity</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {workerRecords.map((record) => (
                                                    <tr key={record.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">{record.worker_name}</td>
                                                        {editingWorkerId === record.id ? (
                                                            <>
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="number"
                                                                        value={editQuantity}
                                                                        onChange={(e) => setEditQuantity(e.target.value)}
                                                                        min="1"
                                                                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <NepaliDatePicker
                                                                        value={editDate}
                                                                        onChange={(value) => setEditDate(value)}
                                                                        className="w-36"
                                                                        placeholder="Select Date"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                        record.is_billable
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {record.is_billable ? 'Billable' : 'Not Billable'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => handleSaveEdit(record.id)}
                                                                            disabled={saving}
                                                                            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={handleCancelEdit}
                                                                            disabled={saving}
                                                                            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{record.quantity.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{record.date}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                        record.is_billable
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {record.is_billable ? 'Billable' : 'Not Billable'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center justify-center relative">
                                                                        <button
                                                                            onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
                                                                            disabled={saving || editingWorkerId !== null}
                                                                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            title="Actions"
                                                                        >
                                                                            <MoreVertical size={18} />
                                                                        </button>

                                                                        {/* Dropdown Menu */}
                                                                        {openMenuId === record.id && (
                                                                            <>
                                                                                {/* Backdrop to close menu when clicking outside */}
                                                                                <div
                                                                                    className="fixed inset-0 z-10"
                                                                                    onClick={() => setOpenMenuId(null)}
                                                                                />

                                                                                <div className="absolute right-0 top-8 z-20 w-32 bg-white border border-gray-200 rounded-lg shadow-lg">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            handleEditWorker(record);
                                                                                            setOpenMenuId(null);
                                                                                        }}
                                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                                                                                    >
                                                                                        <Pencil size={14} />
                                                                                        Edit
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            handleDeleteWorker(record.id);
                                                                                            setOpenMenuId(null);
                                                                                        }}
                                                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                        Delete
                                                                                    </button>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Route Details (Full Height Sidebar) */}
                        <div className="px-8 py-6">
                            <h4 className="text-lg font-semibold mb-6 text-gray-900">Route Details</h4>

                            {/* Product Name and Batch ID */}
                            <div className="mb-6">
                                <p className="text-base font-normal text-gray-900">{taskData.batch_name || 'Linen Silk'}</p>
                                <p className="text-sm text-gray-400">{taskData.sub_batch_name || 'B001.1'}</p>
                            </div>

                            {/* Department Flow with connecting line */}
                            {subBatchHistory && subBatchHistory.department_flow ? (
                                <div className="relative">
                                    {/* Vertical line connecting dots */}
                                    <div className="absolute left-[5px] top-[8px] bottom-[8px] w-[2px] bg-gray-200" />

                                    <div className="space-y-4 relative">
                                        {subBatchHistory.department_flow.split('→').map((deptName: string, index: number) => {
                                            const trimmedName = deptName.trim();

                                            // Find department details for this department
                                            const deptDetail = subBatchHistory.department_details?.find(
                                                (dept: any) => dept.department_name === trimmedName
                                            );

                                            // Check if this department has altered sub-batches
                                            const hasAlteredSubBatch = deptDetail?.worker_logs?.some(
                                                (log: any) => log.altered && log.altered.length > 0
                                            );

                                            // Check if this department has rejected sub-batches
                                            const hasRejectedSubBatch = deptDetail?.worker_logs?.some(
                                                (log: any) => log.rejected && log.rejected.length > 0
                                            );

                                            // Check if this is the current department (where altered sub-batch currently is)
                                            const isAlteredCurrentDepartment = trimmedName === taskData.sent_from_department;

                                            // Check if this is where the main/parent sub-batch is currently at
                                            const departmentIndex = subBatchHistory.department_details?.findIndex(
                                                (dept: any) => dept.department_name === trimmedName
                                            );
                                            const nextDeptIndex = departmentIndex + 1;
                                            const nextDept = subBatchHistory.department_details?.[nextDeptIndex];

                                            // Main sub-batch location: Check for NORMAL logs (not altered, not rejected)
                                            // Filter to only count normal/main production logs
                                            const hasNormalLogs = deptDetail?.worker_logs?.some(
                                                (log: any) => {
                                                    const hasAltered = log.altered && log.altered.length > 0;
                                                    const hasRejected = log.rejected && log.rejected.length > 0;
                                                    // Has logs that are NOT altered or rejected (normal main production)
                                                    return !hasAltered && !hasRejected;
                                                }
                                            );

                                            const nextHasNormalLogs = nextDept?.worker_logs?.some(
                                                (log: any) => {
                                                    const hasAltered = log.altered && log.altered.length > 0;
                                                    const hasRejected = log.rejected && log.rejected.length > 0;
                                                    return !hasAltered && !hasRejected;
                                                }
                                            );

                                            // Main sub-batch is at the last department with normal logs
                                            const isMainSubBatchHere = hasNormalLogs && !nextHasNormalLogs;

                                            // Determine dot color and style
                                            let dotClasses = 'bg-gray-300 border-gray-300'; // Default (not yet reached)

                                            if (isAlteredCurrentDepartment) {
                                                // Current department - show as active (yellow for altered task)
                                                dotClasses = 'bg-yellow-500 border-yellow-500';
                                            } else if (hasRejectedSubBatch) {
                                                // Has rejected sub-batch - red
                                                dotClasses = 'bg-red-500 border-red-500';
                                            } else if (hasAlteredSubBatch) {
                                                // Has altered sub-batch - yellow
                                                dotClasses = 'bg-yellow-500 border-yellow-500';
                                            } else if (deptDetail) {
                                                // Completed department (parent flow) - green
                                                dotClasses = 'bg-green-500 border-green-500';
                                            }

                                            return (
                                                <div key={index} className="flex items-center gap-3 relative">
                                                    <div className={`w-[10px] h-[10px] rounded-full border-2 z-10 ${dotClasses}`} />
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm ${
                                                            isAlteredCurrentDepartment || deptDetail
                                                                ? 'font-medium text-gray-900'
                                                                : 'text-gray-600'
                                                        }`}>
                                                            {trimmedName}
                                                            {isMainSubBatchHere && !isAlteredCurrentDepartment && (
                                                                <span className="ml-1 text-xs text-green-600 font-semibold">(Main sub-batch)</span>
                                                            )}
                                                            {hasRejectedSubBatch && !isMainSubBatchHere && <span className="ml-1 text-xs text-red-600">(Rejected)</span>}
                                                            {hasAlteredSubBatch && !isAlteredCurrentDepartment && !isMainSubBatchHere && <span className="ml-1 text-xs text-yellow-600">(Altered)</span>}
                                                            {isAlteredCurrentDepartment && <span className="ml-1 text-xs text-yellow-600">(Current - Altered)</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400">
                                    Loading route details...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-gray-200 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="px-8 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
                            >
                                Cancel
                            </button>
                            <div className="flex gap-3">
                                {/* Show Mark as Completed button only when stage is COMPLETED */}
                                {taskData.status === 'COMPLETED' && (
                                    <button
                                        onClick={() => setShowCompletionDialog(true)}
                                        disabled={saving}
                                        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Mark Sub-batch as Completed
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-8 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Completion Confirmation Dialog */}
            {showCompletionDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowCompletionDialog(false)} />
                    <div className="bg-white rounded-lg w-[500px] mx-4 relative shadow-2xl">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-300">
                            <h3 className="text-lg font-bold text-gray-900">Confirm Sub-batch Completion</h3>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-gray-700 mb-2">
                                    Are you sure you want to mark this sub-batch as <strong>COMPLETED</strong>?
                                </p>
                                <p className="text-sm text-red-600 font-semibold mb-4">
                                    Once completed, this sub-batch can NO LONGER be moved to other departments or stages.
                                </p>
                                <p className="text-sm text-gray-600 mb-4">
                                    Sub-batch: <strong>{taskData.sub_batch_name}</strong>
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type <strong className="text-red-600">&quot;yes&quot;</strong> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    placeholder="Type yes"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-300 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCompletionDialog(false);
                                    setConfirmationText('');
                                }}
                                disabled={saving}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkAsCompleted}
                                disabled={saving || confirmationText.toLowerCase() !== 'yes'}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Processing...' : 'Mark as Completed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AlteredTaskDetailsModal;
