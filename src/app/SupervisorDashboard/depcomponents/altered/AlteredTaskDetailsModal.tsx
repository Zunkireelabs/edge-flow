import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, ChevronDown, CheckCircle, Clock, Inbox } from 'lucide-react';

interface AlteredTaskData {
    id: number;
    roll_name: string;
    batch_name: string;
    sub_batch_name: string;
    total_quantity: number;
    estimated_start_date: string;
    due_date: string;
    status: string;
    sent_from_department: string;
    alteration_date: string;
    altered_by: string;
    altered_quantity: number;
    alteration_reason: string;
    attachments?: { name: string; count: number }[];
    quantity_remaining?: number;
}

interface AlteredTaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskData: AlteredTaskData;
    onStageChange?: () => void;
}

interface WorkerRecord {
    id: number;
    worker_name: string;
    quantity: number;
    date: string;
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
    const [newWorkerName, setNewWorkerName] = useState('');
    const [newWorkerQuantity, setNewWorkerQuantity] = useState('');
    const [newWorkerDate, setNewWorkerDate] = useState('');
    const [sendToDepartment, setSendToDepartment] = useState('');
    const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');

    useEffect(() => {
        if (taskData) {
            setStatus(taskData.status || 'NEW_ARRIVAL');
            // Load assigned workers for this altered task
            fetchWorkerRecords();
            // Fetch departments
            fetchDepartments();
        }
    }, [taskData]);

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`);
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchWorkerRecords = async () => {
        // Fetch worker records from API
        // TODO: Replace with actual API call when backend is ready
        setWorkerRecords([]);
    };

    const handleAddWorker = () => {
        if (!newWorkerName || !newWorkerQuantity || !newWorkerDate) {
            alert('Please fill in all worker details');
            return;
        }

        const newRecord: WorkerRecord = {
            id: Date.now(),
            worker_name: newWorkerName,
            quantity: parseInt(newWorkerQuantity),
            date: newWorkerDate
        };

        setWorkerRecords([...workerRecords, newRecord]);
        setNewWorkerName('');
        setNewWorkerQuantity('');
        setNewWorkerDate('');
    };

    const handleDeleteWorker = (id: number) => {
        setWorkerRecords(workerRecords.filter(record => record.id !== id));
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

                const apiUrl = process.env.NEXT_PUBLIC_SEND_TO_ANOTHER_DEPARTMENT;
                const requestBody = {
                    departmentSubBatchId: taskData.id,
                    toDepartmentId: parseInt(sendToDepartment),
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                                                {taskData.total_quantity.toLocaleString()}
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
                                                        onChange={(e) => setSendToDepartment(e.target.value)}
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
                                </div>
                            </div>

                            {/* Alteration Log Section */}
                            <div className="mb-8 pb-8 border-b border-gray-200">
                                <h4 className="text-lg font-semibold mb-6 text-gray-900">Alteration Log</h4>
                                <div className="space-y-6">
                                    {/* Row 1: Date & Altered By */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Date</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 flex items-center justify-between">
                                                <span>{formatDate(taskData.alteration_date)}</span>
                                                <Calendar size={16} className="text-gray-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Altered By</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600">
                                                {taskData.altered_by}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Quantity (half width) */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-900 block mb-2">Quantity</label>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600">
                                                {taskData.altered_quantity.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: Alteration Note (full width) */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-900 block mb-2">Alteration Note</label>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600">
                                            {taskData.alteration_reason || '-'}
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

                            {/* Assign Workers Section */}
                            <div>
                                <h4 className="text-lg font-semibold mb-4 text-gray-900">Assign Workers</h4>

                                {/* Input Row */}
                                <div className="flex items-end gap-3 mb-4">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-900 block mb-2">Worker Name</label>
                                        <input
                                            type="text"
                                            value={newWorkerName}
                                            onChange={(e) => setNewWorkerName(e.target.value)}
                                            placeholder="Name"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-sm font-medium text-gray-900 block mb-2">Quantity</label>
                                        <input
                                            type="number"
                                            value={newWorkerQuantity}
                                            onChange={(e) => setNewWorkerQuantity(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        />
                                    </div>
                                    <div className="w-40">
                                        <label className="text-sm font-medium text-gray-900 block mb-2">Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={newWorkerDate}
                                                onChange={(e) => setNewWorkerDate(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-9"
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
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Worker Name</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantity</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {workerRecords.map((record) => (
                                                    <tr key={record.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">{record.worker_name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{record.quantity}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{record.date}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleDeleteWorker(record.id)}
                                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                                title="Delete worker"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Work History (Full Height Sidebar) */}
                        <div className="px-8 py-6">
                            <h4 className="text-lg font-semibold mb-6 text-gray-900">Work History</h4>
                            <div className="text-sm text-gray-400">
                                No work history available
                            </div>
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
