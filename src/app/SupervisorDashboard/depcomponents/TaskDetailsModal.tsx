/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, X } from 'lucide-react';
import AddRecordModal from './AddRecordModal';
import WorkerAssignmentTable from './WorkerAssignmentTable';
import PreviewModal from './PreviewModal';

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskData: any;
    currentSupervisorId: number;
    onStageChange?: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, taskData, onStageChange }) => {
    const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [editRecord, setEditRecord] = useState<any | null>(null);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'preview'>('add');
    const [status, setStatus] = useState('NEW_ARRIVAL');
    const [workerRecords, setWorkerRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sendToDepartment, setSendToDepartment] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);

    const fetchWorkerLogs = useCallback(async () => {
        if (!taskData?.sub_batch?.id) return;

        const subBatchId = taskData.sub_batch.id;
        const apiUrl = `${process.env.NEXT_PUBLIC_GET_WORKER_LOGS}/${subBatchId}`;

        try {
            setLoading(true);
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
            console.log('======= RAW WORKER LOGS API RESPONSE =======');
            console.log('API Result:', result);
            console.log('Is Success:', result.success);
            console.log('Data Array:', result.data);
            console.log('==========================================');

            if (result.success && Array.isArray(result.data)) {
                const mappedRecords = result.data.map((r: any, idx: number) => {
                    console.log(`Mapping Record ${idx + 1}:`, r);

                    // Extract rejection data from rejected_entry array
                    const rejectedEntry = r.rejected_entry && r.rejected_entry.length > 0 ? r.rejected_entry[0] : null;
                    const rejectedQty = rejectedEntry?.quantity ?? 0;
                    const rejectionReason = rejectedEntry?.reason || '-';
                    const returnToDeptId = rejectedEntry?.sent_to_department_id || null;
                    const returnToDeptName = rejectedEntry?.sent_to_department_name || rejectedEntry?.sent_to_department?.name || null;

                    // Extract alteration data from altered_entry array
                    const alteredEntry = r.altered_entry && r.altered_entry.length > 0 ? r.altered_entry[0] : null;
                    const alteredQty = alteredEntry?.quantity ?? 0;
                    const alterationNote = alteredEntry?.reason || '-';
                    const alterReturnToDeptId = alteredEntry?.sent_to_department_id || null;
                    const alterReturnToDeptName = alteredEntry?.sent_to_department_name || alteredEntry?.sent_to_department?.name || null;

                    console.log(`  - Rejected Entry:`, rejectedEntry);
                    console.log(`  - Rejected Qty: ${rejectedQty}, Reason: ${rejectionReason}, Return To Dept: ${returnToDeptName || returnToDeptId}`);
                    console.log(`  - Altered Entry:`, alteredEntry);
                    console.log(`  - Altered Qty: ${alteredQty}, Note: ${alterationNote}, Return To Dept: ${alterReturnToDeptName || alterReturnToDeptId}`);

                    // Format department return display: show name if available, otherwise show "Dept ID"
                    let returnToDisplay = '-';
                    if (returnToDeptName) {
                        returnToDisplay = returnToDeptName;
                    } else if (returnToDeptId) {
                        returnToDisplay = `Dept ${returnToDeptId}`;
                    } else if (alterReturnToDeptName) {
                        returnToDisplay = alterReturnToDeptName;
                    } else if (alterReturnToDeptId) {
                        returnToDisplay = `Dept ${alterReturnToDeptId}`;
                    }

                    return {
                        id: r.id || idx + 1,
                        worker: r.worker_name || r.worker?.name || '-',
                        date: r.work_date ? new Date(r.work_date).toLocaleDateString('en-US') : '-',
                        realCategory: r.size_category || '-',
                        particulars: r.particulars || '-',
                        qtyReceived: r.quantity_received ?? 0,
                        qtyWorked: r.quantity_worked ?? 0,
                        unitPrice: r.unit_price ?? 0,
                        rejectReturn: rejectedQty,
                        returnTo: returnToDisplay,
                        rejectionReason: rejectionReason,
                        alteration: alteredQty,
                        alterationNote: alterationNote,
                        status: r.status || '-',
                    };
                });
                console.log('======= MAPPED WORKER RECORDS =======');
                console.log('Mapped Records:', mappedRecords);
                console.log('====================================');
                setWorkerRecords(mappedRecords);

            } else {
                setWorkerRecords([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setWorkerRecords([]);
        } finally {
            setLoading(false);
        }
    }, [taskData?.sub_batch?.id]);

    useEffect(() => {
        if (isOpen && taskData?.sub_batch?.id) fetchWorkerLogs();
    }, [isOpen, fetchWorkerLogs, taskData?.sub_batch?.id]);

    // Fetch departments when modal opens
    useEffect(() => {
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

        if (isOpen) {
            fetchDepartments();
        }
    }, [isOpen]);

    // Initialize status from taskData
    useEffect(() => {
        if (taskData?.stage) {
            setStatus(taskData.stage);
        }
    }, [taskData?.stage]);

    // Handle save - update stage via API or advance to next department
    const handleSave = async () => {
        console.log('=== SAVE BUTTON CLICKED ===');
        console.log('Full taskData:', taskData);
        console.log('taskData.id:', taskData?.id);
        console.log('taskData.sub_batch:', taskData?.sub_batch);
        console.log('taskData.sub_batch_id:', taskData?.sub_batch_id);
        console.log('taskData.stage:', taskData?.stage);
        console.log('sendToDepartment:', sendToDepartment);
        console.log('Is Rejected:', taskData?.remarks?.toLowerCase().includes('reject'));
        console.log('Is Altered:', taskData?.remarks?.toLowerCase().includes('alter'));

        if (!taskData?.id) {
            alert('Invalid task data - missing task ID');
            return;
        }

        // Get sub_batch_id from either sub_batch object or direct property
        const subBatchId = taskData.sub_batch?.id || taskData.sub_batch_id;

        if (!subBatchId) {
            console.error('Missing sub_batch_id!');
            console.error('taskData.sub_batch:', taskData.sub_batch);
            console.error('taskData.sub_batch_id:', taskData.sub_batch_id);
            alert('Cannot send to department: Sub-batch ID is missing');
            return;
        }

        console.log('Using subBatchId:', subBatchId);

        // Check the NEW status from dropdown, not the old taskData.stage
        // If NEW status is COMPLETED and sending to another department
        if (status === 'COMPLETED' && sendToDepartment) {
            console.log('✅ Advancing to next department...');
            console.log('Card type:', taskData.remarks || 'Regular');

            try {
                setSaving(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    alert('Authentication required. Please login again.');
                    return;
                }

                const apiUrl = process.env.NEXT_PUBLIC_SEND_TO_ANOTHER_DEPARTMENT;
                // Updated to use department_sub_batch_id instead of fromDepartmentId
                const requestBody = {
                    departmentSubBatchId: taskData.id,  // The department_sub_batches.id
                    toDepartmentId: parseInt(sendToDepartment),
                };

                console.log('API URL:', apiUrl);
                console.log('Request Body:', JSON.stringify(requestBody, null, 2));

                // Advance to next department
                const advanceResponse = await fetch(apiUrl!, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestBody),
                });

                console.log('Response Status:', advanceResponse.status);

                if (!advanceResponse.ok) {
                    const errorData = await advanceResponse.json();
                    console.error('Error Response:', errorData);
                    throw new Error(errorData.message || 'Failed to advance to next department');
                }

                const result = await advanceResponse.json();
                console.log('Success Response:', result);
                console.log('Next Department Data:', result.nextDept);

                if (result.success) {
                    console.log('✅ Successfully sent to department:', result.nextDept?.department_id);

                    // Close modal immediately
                    onClose();

                    // Show success alert
                    alert(`Successfully sent to department!`);

                    // Clear the selected department
                    setSendToDepartment('');

                    // Wait a bit for backend to process, then refresh Kanban board
                    console.log('Refreshing Kanban board in 500ms...');
                    setTimeout(() => {
                        if (onStageChange) {
                            console.log('Calling onStageChange() to refresh data...');
                            onStageChange();
                        } else {
                            console.warn('onStageChange callback not provided! Forcing page reload...');
                            window.location.reload();
                        }
                    }, 500);
                } else {
                    throw new Error(result.message || 'Failed to advance to next department');
                }
            } catch (error: any) {
                console.error('Error:', error);
                alert(`Failed to send to department: ${error.message}`);
            } finally {
                setSaving(false);
            }
        } else if (status === 'COMPLETED' && !sendToDepartment) {
            // NEW status is COMPLETED but no department selected - require selection
            alert('Please select a department to send this completed task to');
            return;
        } else {
            // Normal stage update (NEW status is not COMPLETED, or changing from COMPLETED to IN_PROGRESS/NEW_ARRIVAL)
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
                    alert('Stage updated successfully!');
                    onClose();
                    // Refresh the kanban board
                    if (onStageChange) {
                        onStageChange();
                    }
                } else {
                    throw new Error(result.message || 'Failed to update stage');
                }
            } catch (error: any) {
                console.error('Error updating stage:', error);
                alert(`Failed to update stage: ${error.message}`);
            } finally {
                setSaving(false);
            }
        }
    };

    if (!isOpen || !taskData) return null;

    // Calculate work progress from worker records
    const totalWorkDone = workerRecords.reduce((sum, record) => sum + (record.qtyWorked || 0), 0);
    const totalAltered = workerRecords.reduce((sum, record) => sum + (record.alteration || 0), 0);
    const totalRejected = workerRecords.reduce((sum, record) => sum + (record.rejectReturn || 0), 0);
    const totalProcessed = totalWorkDone + totalAltered + totalRejected;
    const quantityToWork = taskData.quantity_remaining ?? taskData.sub_batch?.estimated_pieces ?? 0;
    const remainingWork = quantityToWork - totalProcessed;

    // Extract rejection/alteration logs from worker records
    const rejectionLogs = workerRecords.filter(record => (record.rejectReturn ?? 0) > 0);
    const alterationLogs = workerRecords.filter(record => (record.alteration ?? 0) > 0);

    // Get the most recent rejection or alteration log
    const latestRejectionLog = rejectionLogs.length > 0 ? rejectionLogs[rejectionLogs.length - 1] : null;
    const latestAlterationLog = alterationLogs.length > 0 ? alterationLogs[alterationLogs.length - 1] : null;

    // Log task data for debugging
    console.log('======= TASK DETAILS MODAL - FULL DATA STRUCTURE =======');
    console.log('Full Task Data Object:', JSON.stringify(taskData, null, 2));
    console.log('Task Data Keys:', Object.keys(taskData));
    console.log('========================================================');
    console.log('======= TASK DETAILS MODAL DATA =======');
    console.log('Task Data:', taskData);
    console.log('ID (department_sub_batch_id):', taskData.id);
    console.log('Remarks:', taskData.remarks);
    console.log('Quantity Remaining:', taskData.quantity_remaining);
    console.log('Sub-batch Estimated Pieces:', taskData.sub_batch?.estimated_pieces);
    console.log('Is Rejected:', taskData.remarks?.toLowerCase().includes('reject'));
    console.log('Is Altered:', taskData.remarks?.toLowerCase().includes('alter'));
    console.log('Rejection Source:', taskData.rejection_source);
    console.log('Alteration Source:', taskData.alteration_source);

    // Check for any production summary fields from backend
    console.log('======= CHECKING FOR BACKEND PRODUCTION COUNTS =======');
    console.log('total_work_done:', taskData.total_work_done);
    console.log('total_worked:', taskData.total_worked);
    console.log('total_altered:', taskData.total_altered);
    console.log('total_rejected:', taskData.total_rejected);
    console.log('total_processed:', taskData.total_processed);
    console.log('quantity_worked:', taskData.quantity_worked);
    console.log('work_summary:', taskData.work_summary);
    console.log('production_summary:', taskData.production_summary);
    console.log('======================================================');

    if (taskData.rejection_source) {
        console.log('  - From Department:', taskData.rejection_source.from_department_name);
        console.log('  - Reason:', taskData.rejection_source.reason);
        console.log('  - Quantity:', taskData.rejection_source.quantity);
    }
    if (taskData.alteration_source) {
        console.log('  - From Department:', taskData.alteration_source.from_department_name);
        console.log('  - Reason:', taskData.alteration_source.reason);
        console.log('  - Quantity:', taskData.alteration_source.quantity);
    }
    console.log('======= WORK PROGRESS TRACKING (CALCULATED) =======');
    console.log('Worker Records:', workerRecords);
    console.log('Total Work Done (calculated from records):', totalWorkDone);
    console.log('Total Altered (calculated from records):', totalAltered);
    console.log('Total Rejected (calculated from records):', totalRejected);
    console.log('Total Processed (calculated):', totalProcessed);
    console.log('Quantity to Work:', quantityToWork);
    console.log('Remaining Work (calculated):', remainingWork);
    console.log('Progress Percentage:', quantityToWork > 0 ? Math.round((totalProcessed / quantityToWork) * 100) : 0, '%');
    console.log('======================================');

    const handleAddRecord = () => {
        setEditRecord(null);
        setModalMode('add');
        setIsAddRecordOpen(true);
    };

    const handleSaveRecord = async () => {
        // Close the modal
        setIsAddRecordOpen(false);

        // Refresh worker logs from backend to get the latest data
        await fetchWorkerLogs();
    };

    const handlePreviewRecord = (record: any) => {
        setSelectedRecord(record);
        setIsPreviewOpen(true);
    };

    const handleEditRecord = (record: any) => {
        console.log('======= EDIT RECORD CLICKED =======');
        console.log('Record to edit:', record);
        setEditRecord(record);
        setModalMode('edit');
        setIsAddRecordOpen(true);
    };

    const handleDeleteRecord = async (id: number) => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                alert('Authentication required. Please login again.');
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/worker-logs/logs/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete worker record');
            }

            // Refresh worker logs after successful deletion
            await fetchWorkerLogs();
            alert('Worker record deleted successfully!');
        } catch (error: any) {
            console.error('Error deleting worker record:', error);
            alert(`Failed to delete worker record: ${error.message}`);
        }
    };

    const formatDate = (dateString: string) =>
        dateString ? new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : '-';

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div className="bg-white rounded-lg w-[95vw] max-w-[650px] mx-4 relative shadow-xl max-h-[95vh] overflow-hidden flex flex-col">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-400 ">
                        <h3 className="text-lg font-bold">Task Details</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Rejection/Alteration Alert Banner */}
                    {taskData.remarks && (
                        <div className={`px-6 py-4  ${
                            taskData.remarks.toLowerCase().includes('reject')
                                ? 'bg-red-100 border-red-500'
                                : taskData.remarks.toLowerCase().includes('alter')
                                ? 'bg-orange-100 border-orange-500'
                                : 'bg-blue-100 border-blue-500'
                        }`}>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">
                                    {taskData.remarks.toLowerCase().includes('reject') ? '' : ''}
                                </span>
                                <div className="flex-1">
                                    <p className={`font-bold text-lg ${
                                        taskData.remarks.toLowerCase().includes('reject')
                                            ? 'text-red-900'
                                            : 'text-orange-900'
                                    }`}>
                                        {taskData.remarks.toUpperCase()}
                                    </p>
                                    <p className={`text-sm ${
                                        taskData.remarks.toLowerCase().includes('reject')
                                            ? 'text-red-700'
                                            : 'text-orange-700'
                                    }`}>
                                        This batch requires {taskData.remarks.toLowerCase()} work
                                    </p>
                                    {/* Show rejection/alteration reason and source */}
                                    {taskData.rejection_source && (
                                        <div className="mt-2 text-sm text-red-800">
                                            <p><strong>From:</strong> {taskData.rejection_source.from_department_name}</p>
                                            <p><strong>Reason:</strong> {taskData.rejection_source.reason}</p>
                                        </div>
                                    )}
                                    {taskData.alteration_source && (
                                        <div className="mt-2 text-sm text-orange-800">
                                            <p><strong>From:</strong> {taskData.alteration_source.from_department_name}</p>
                                            <p><strong>Reason:</strong> {taskData.alteration_source.reason}</p>
                                        </div>
                                    )}
                                </div>
                               
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="space-y-8">

                            {/* Task Info */}
                            <div className="p-6">
                                <h4 className="font-semibold mb-6">Task Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-medium font-semibold text-black">Batch Name</label>
                                        <p className="text-gray-900 border border-gray-200 rounded-lg min-w-[90px] max-w-[150px] px-6 py-2 mt-1">
                                            {taskData.sub_batch?.batch?.name || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-medium font-semibold text-black">Sub Batch Name</label>
                                        <p className="text-gray-900 border border-gray-200 rounded-lg min-w-[90px] max-w-[150px] px-6 py-2 mt-1">
                                            {taskData.sub_batch?.name || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-medium font-semibold text-black">Planned Start Date</label>
                                        <p className="text-gray-900 border border-gray-200 rounded-lg w-fit px-6 py-2 mt-1 flex gap-2">
                                            {formatDate(taskData.sub_batch?.start_date)}
                                            <Calendar size={20} />
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-medium font-semibold text-black">Due Date</label>
                                        <p className="text-gray-900 border border-gray-200 rounded-lg w-fit px-6 py-2 mt-1 flex gap-2">
                                            {formatDate(taskData.sub_batch?.due_date)}
                                            <Calendar size={20} />
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-medium font-semibold text-black mb-2">Status</h4>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="text-gray-900 bg-[#D8D8D8] border-gray-200 rounded-lg px-6 py-2 min-w-[90px] max-w-[150px]"
                                        >
                                            <option value="NEW_ARRIVAL">Not Started</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="COMPLETED">Completed</option>
                                        </select>
                                    </div>

                                    {/* Send to Department - Show when status is COMPLETED (either already completed or changed to completed) */}
                                    {status === 'COMPLETED' && (
                                        <div>
                                            <h4 className="text-medium font-semibold text-black mb-2">Send to Department</h4>
                                            <select
                                                value={sendToDepartment}
                                                onChange={(e) => setSendToDepartment(e.target.value)}
                                                className="text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-2 min-w-[150px] max-w-[200px]"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map((dept: any) => (
                                                    <option key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="text-medium font-semibold text-black mb-2">
                                            Original Pieces
                                        </h4>
                                        <div className={`rounded-lg px-6 py-2 mt-2 min-w-[150px] max-w-[200px] ${
                                            taskData.quantity_remaining
                                                ? 'bg-blue-100 border-2 border-blue-500'
                                                : 'border border-gray-200'
                                        }`}>
                                            <p className={`font-bold ${
                                                taskData.quantity_remaining ? 'text-blue-900 text-lg' : 'text-gray-900'
                                            }`}>
                                                {(taskData.quantity_remaining ?? taskData.sub_batch?.estimated_pieces)?.toLocaleString() || '-'}
                                            </p>
                                            {taskData.quantity_remaining && taskData.quantity_remaining !== taskData.sub_batch?.estimated_pieces && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                   Original Pieces: {taskData.sub_batch?.estimated_pieces?.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        {taskData.remarks && (
                                            <p className={`text-xs mt-2 font-semibold ${
                                                taskData.remarks.toLowerCase().includes('reject')
                                                    ? 'text-red-600'
                                                    : 'text-orange-600'
                                            }`}>
                                                {taskData.remarks}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Rejection/Alteration Log - Only show if this is a rejected or altered sub-batch */}
                                {(taskData.rejection_source || taskData.alteration_source || taskData.remarks?.toLowerCase().includes('reject') || taskData.remarks?.toLowerCase().includes('alter')) && (latestRejectionLog || latestAlterationLog) && (
                                    <div className="mt-8 p-6 border-t border-gray-300">
                                        <h4 className="font-semibold text-lg mb-4">
                                            {latestRejectionLog ? 'Rejection Log' : 'Alteration Log'}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Date */}
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Date</label>
                                                <p className="text-gray-900 border border-gray-200 rounded-lg px-4 py-2 mt-1">
                                                    {latestRejectionLog?.date || latestAlterationLog?.date || '-'}
                                                </p>
                                            </div>

                                            {/* Altered/Rejected By */}
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">
                                                    {latestRejectionLog ? 'Rejected By' : 'Altered By'}
                                                </label>
                                                <p className="text-gray-900 border border-gray-200 rounded-lg px-4 py-2 mt-1">
                                                    {latestRejectionLog?.worker || latestAlterationLog?.worker || '-'}
                                                </p>
                                            </div>

                                            {/* Quantity */}
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">
                                                    {latestRejectionLog ? 'Rejected Quantity' : 'Altered Quantity'}
                                                </label>
                                                <p className="text-gray-900 border border-gray-200 rounded-lg px-4 py-2 mt-1 font-semibold">
                                                    {latestRejectionLog
                                                        ? (latestRejectionLog.rejectReturn || 0).toLocaleString()
                                                        : (latestAlterationLog?.alteration || 0).toLocaleString()
                                                    }
                                                </p>
                                            </div>

                                            {/* Reason/Note */}
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">
                                                    {latestRejectionLog ? 'Rejection Reason' : 'Alteration Note'}
                                                </label>
                                                <p className="text-gray-900 border border-gray-200 rounded-lg px-4 py-2 mt-1">
                                                    {latestRejectionLog?.rejectionReason || latestAlterationLog?.alterationNote || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Attachments - Same styling as batch/sub-batch fields */}
                                {taskData.sub_batch?.attachments && taskData.sub_batch.attachments.length > 0 && (
                                    <div className="mt-8">
                                        <h4 className="font-semibold text-black mb-4">Attachments</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {taskData.sub_batch.attachments.map((attachment: any) => (
                                                <div key={attachment.id}>
                                                    <label className="text-medium font-semibold text-black">{attachment.attachment_name}</label>
                                                    <p className="text-gray-900 border border-gray-200 rounded-lg min-w-[90px] max-w-[150px] px-6 py-2 mt-1">
                                                        {attachment.quantity}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Work Progress Tracking Summary */}
                                <div className="mt-8 p-6 ">
                                    <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                  Production Summary
                                    </h4>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {/* Quantity to Work */}
                                        <div className="bg-white rounded-lg p-4 border-2 border-blue-500">
                                            <p className="text-xs text-gray-600 font-semibold mb-1">Quantity to Work</p>
                                            <p className="text-2xl font-bold text-blue-600">{quantityToWork.toLocaleString()}</p>
                                        </div>

                                        {/* Work Done - COMMENTED OUT */}
                                        {/* <div className="bg-white rounded-lg p-4 border border-gray-300">
                                            <p className="text-xs text-gray-600 font-semibold mb-1">Work Done</p>
                                            <p className="text-2xl font-bold text-gray-900">{totalWorkDone.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-1">Completed pieces</p>
                                        </div> */}

                                        {/* Altered */}
                                        <div className="bg-white rounded-lg p-4 border border-gray-300">
                                            <p className="text-xs text-gray-600 font-semibold mb-1">Altered</p>
                                            <p className="text-2xl font-bold text-gray-900">{totalAltered.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-1">Alteration pieces</p>
                                        </div>

                                        {/* Rejected */}
                                        <div className="bg-white rounded-lg p-4 border border-gray-300">
                                            <p className="text-xs text-gray-600 font-semibold mb-1">Rejected</p>
                                            <p className="text-2xl font-bold text-gray-900">{totalRejected.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-1">Rejected pieces</p>
                                        </div>

                                        {/* Total Processed - COMMENTED OUT */}
                                        {/* <div className="bg-white rounded-lg p-4 border border-gray-300">
                                            <p className="text-xs text-gray-600 font-semibold mb-1">Total Processed</p>
                                            <p className="text-2xl font-bold text-gray-900">{totalProcessed.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-1">Done + Altered + Rejected</p>
                                        </div> */}

                                        {/* Remaining - COMMENTED OUT */}
                                        {/* <div className="bg-white rounded-lg p-4 border-2 border-blue-500">
                                            <p className="text-xs text-gray-600 font-semibold mb-1">Remaining</p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {remainingWork.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {remainingWork > 0 ? 'Work pending' : 'All complete!'}
                                            </p>
                                        </div> */}
                                    </div>


                                </div>
                            </div>

                            {/* Worker Assignment & Records */}
                            <div>
                                <div className="border-t border-gray-400 flex items-center justify-between px-8 py-3 w-full">
                                    <h4 className="font-semibold">Worker Assignment & Records</h4>
                                    <button
                                        onClick={handleAddRecord}
                                        disabled={status === 'NEW_ARRIVAL' || taskData.stage === 'COMPLETED'}
                                        className={`border px-4 py-1 rounded-lg text-sm transition ${
                                            status === 'NEW_ARRIVAL' || taskData.stage === 'COMPLETED'
                                                ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100'
                                                : 'border-blue-600 text-blue-600 hover:bg-blue-700 hover:text-white'
                                        }`}
                                        title={
                                            status === 'NEW_ARRIVAL'
                                                ? 'Move to In Progress to assign workers'
                                                : taskData.stage === 'COMPLETED'
                                                ? 'Cannot add records to completed tasks'
                                                : 'Add worker record'
                                        }
                                    >
                                        + Add Record
                                    </button>
                                </div>

                                {status === 'NEW_ARRIVAL' && (
                                    <div className="px-8 py-2 text-sm text-orange-600 bg-orange-50 border-b">
                                        <strong>Note:</strong> Worker assignment is only available after moving to In Progress stage.
                                    </div>
                                )}

                                {taskData.stage === 'COMPLETED' && (
                                    <div className="px-8 py-2 text-sm text-green-800 bg-green-50 border-b">
                                        <strong>Note:</strong> This task is completed. You can only view records and send to another department.
                                    </div>
                                )}

                                {/* Show quantity info for rejected/altered items */}
                                {taskData.quantity_remaining && (
                                    <div className={`px-8 py-3 text-sm border-b ${
                                        taskData.remarks?.toLowerCase().includes('reject')
                                            ? 'text-red-800 bg-red-50'
                                            : 'text-orange-800 bg-orange-50'
                                    }`}>
                                        <div>
                                            <strong>Work on {taskData.remarks}:</strong> Assign workers for {taskData.quantity_remaining.toLocaleString()} pieces only
                                            {taskData.quantity_remaining !== taskData.sub_batch?.estimated_pieces && (
                                                <span className="text-xs ml-2">(Original batch: {taskData.sub_batch?.estimated_pieces?.toLocaleString()} pieces)</span>
                                            )}
                                        </div>
                                        {taskData.rejection_source?.reason && (
                                            <div className="text-xs mt-1">
                                                <strong>Reason:</strong> {taskData.rejection_source.reason} (from {taskData.rejection_source.from_department_name})
                                            </div>
                                        )}
                                        {taskData.alteration_source?.reason && (
                                            <div className="text-xs mt-1">
                                                <strong>Reason:</strong> {taskData.alteration_source.reason} (from {taskData.alteration_source.from_department_name})
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="px-8 py-2 text-sm text-gray-600 bg-gray-50 border-b flex justify-between">
                                    <div><strong>Records Found:</strong> {workerRecords.length}</div>
                                </div>

                                <div className="overflow-x-auto max-w-[700px]">
                                    <WorkerAssignmentTable
                                        records={workerRecords}
                                        onDelete={handleDeleteRecord}
                                        onEdit={handleEditRecord}
                                        onPreview={handlePreviewRecord}
                                        loading={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-400 bg-gray-50 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Record Modal */}
            <AddRecordModal
                isOpen={isAddRecordOpen}
                onClose={() => {
                    setIsAddRecordOpen(false);
                    setEditRecord(null);
                    setModalMode('add');
                }}
                onSave={handleSaveRecord}
                subBatch={{
                    ...taskData.sub_batch,
                    department_sub_batch_id: taskData.id,  // Pass the department_sub_batch_id
                    quantity_remaining: taskData.quantity_remaining,
                    remarks: taskData.remarks,
                    rejection_source: taskData.rejection_source,
                    alteration_source: taskData.alteration_source
                }}
                editRecord={editRecord}
                mode={modalMode}
                quantityToWork={quantityToWork}
                existingRecords={workerRecords}
            />

            {/* Preview Modal */}
            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                record={selectedRecord}
            />
        </>
    );
};

export default TaskDetailsModal;