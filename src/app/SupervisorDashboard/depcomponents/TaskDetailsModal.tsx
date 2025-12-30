/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, X, CheckCircle, Edit3, XCircle, Clock, ChevronDown, ChevronRight, Inbox, MoreVertical, History, User, ArrowRight } from 'lucide-react';
import AddRecordModal from './AddRecordModal';
import WorkerAssignmentTable from './WorkerAssignmentTable';
import PreviewModal from './PreviewModal';
import AlterationModal from './AlterationModal';
import RejectionModal from './RejectionModal';
import { useToast } from '@/app/Components/ToastContext';
import { formatNepaliDate } from '@/app/utils/dateUtils';

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskData: any;
    currentSupervisorId: number;
    onStageChange?: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, taskData, onStageChange }) => {
    const { showToast } = useToast();

    const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [recordToEdit, setRecordToEdit] = useState<any | null>(null);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [status, setStatus] = useState('NEW_ARRIVAL');
    const [workerRecords, setWorkerRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sendToDepartment, setSendToDepartment] = useState('');
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);
    const [subBatchHistory, setSubBatchHistory] = useState<any>(null);
    const [expandedDepartments, setExpandedDepartments] = useState<number[]>([]);
    const [mainCardData, setMainCardData] = useState<any>(null);
    const [isAlterationModalOpen, setIsAlterationModalOpen] = useState(false);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [showActionsDropdown, setShowActionsDropdown] = useState(false);

    const fetchWorkerLogs = useCallback(async () => {
        if (!taskData?.sub_batch?.id) return;

        const subBatchId = taskData.sub_batch.id;
        const departmentSubBatchId = taskData.id; // The ID of the specific portion being viewed
        const apiUrl = `${process.env.NEXT_PUBLIC_GET_WORKER_LOGS}/${subBatchId}?department_sub_batch_id=${departmentSubBatchId}`;

        try {
            setLoading(true);
            const response = await fetch(apiUrl);
            const contentType = response.headers.get('content-type');

            if (!contentType || !contentType.includes('application/json')) {
                return;
            }

            if (!response.ok) {
                setWorkerRecords([]);
                return;
            }

            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                const mappedRecords = result.data.map((r: any, idx: number) => {

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
                        worker_id: r.worker_id, // Store worker_id for filtering by assigned worker
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
                        department_id: r.department_id, // Store department_id for filtering
                        department_sub_batch_id: r.department_sub_batch_id, // Store specific card ID for filtering
                        activity_type: r.activity_type || 'NORMAL', // Store activity_type for filtering
                    };
                });
                setWorkerRecords(mappedRecords);

            } else {
                setWorkerRecords([]);
            }
        } catch {
            setWorkerRecords([]);
        } finally {
            setLoading(false);
        }
    }, [taskData?.sub_batch?.id, taskData?.id]);

    // Fetch departments
    const fetchDepartments = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`);
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            }
        } catch {
            // Department fetch failed
        }
    }, []);

    // Fetch sub-batch history (department flow and worker logs)
    const fetchSubBatchHistory = useCallback(async () => {
        if (!taskData?.sub_batch?.id) return;

        const subBatchId = taskData.sub_batch.id;
        const apiUrl = `${process.env.NEXT_PUBLIC_SUB_BATCH_HISTORY}/${subBatchId}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                return;
            }

            const result = await response.json();

            if (result.success) {
                setSubBatchHistory(result);
            }
        } catch {
            // Sub-batch history fetch failed
        }
    }, [taskData?.sub_batch?.id]);

    // Fetch Main card data for Assigned cards
    const fetchMainCardData = useCallback(async () => {
        // Only fetch if this is an Assigned card
        if (taskData?.remarks !== 'Assigned') {
            setMainCardData(null);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch all cards for this supervisor to find the Main card
            const apiUrl = `${process.env.NEXT_PUBLIC_GET_SUBBATCH_SUPERVISOR}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                return;
            }

            const result = await response.json();

            if (result.success && result.data) {
                // Combine all cards from all statuses
                const allCards = [
                    ...(result.data.newArrival || []),
                    ...(result.data.inProgress || []),
                    ...(result.data.completed || [])
                ];

                // Find the Main card with the same sub_batch_id and department_id
                // Can be either "Main" (after split) or "Main in this Department" (fresh arrival)
                const mainCard = allCards.find(card =>
                    card.sub_batch_id === taskData.sub_batch_id &&
                    card.department_id === taskData.department_id &&
                    (card.remarks === 'Main' || card.remarks === 'Main in this Department' || !card.remarks)
                );

                if (mainCard) {
                    setMainCardData(mainCard);
                }
            }
        } catch {
            // Main card data fetch failed
        }
    }, [taskData?.remarks, taskData?.sub_batch_id, taskData?.department_id]);

    useEffect(() => {
        if (isOpen && taskData?.sub_batch?.id) {
            fetchWorkerLogs();
            fetchDepartments();
            fetchSubBatchHistory();
            fetchMainCardData();
        }
    }, [isOpen, fetchWorkerLogs, fetchDepartments, fetchSubBatchHistory, fetchMainCardData, taskData?.sub_batch?.id]);

    // Initialize status from taskData and reset sendToDepartment
    useEffect(() => {
        if (taskData?.stage) {
            setStatus(taskData.stage);
        }
        // Reset sendToDepartment when modal opens with new task
        setSendToDepartment('');
    }, [taskData?.id, taskData?.stage]);

    // Handle save - update stage via API or advance to next department
    const handleSave = async () => {
        // Check if sub-batch is already marked as COMPLETED (status level)
        if (taskData?.sub_batch?.status === 'COMPLETED') {
            showToast('error', 'This sub-batch has been marked as COMPLETED and can no longer be moved or modified.');
            return;
        }

        if (!taskData?.id) {
            showToast('error', 'Invalid task data - missing task ID');
            return;
        }

        // Get sub_batch_id from either sub_batch object or direct property
        const subBatchId = taskData.sub_batch?.id || taskData.sub_batch_id;

        if (!subBatchId) {
            showToast('error', 'Cannot send to department: Sub-batch ID is missing');
            return;
        }

        // If sending to another department (works for any stage)
        if (sendToDepartment) {

            // Calculate remaining work before allowing department transfer
            let currentDeptRecords;

            if (taskData.remarks === 'Assigned') {
                // For Assigned cards, filter by specific card ID
                currentDeptRecords = workerRecords.filter(record =>
                    record.department_sub_batch_id === taskData.id
                );
            } else {
                // For Main cards, filter by department ID
                currentDeptRecords = workerRecords.filter(record =>
                    record.department_id === taskData.department_id
                );
            }

            const totalWorkDone = currentDeptRecords.reduce((sum, record) => sum + (record.qtyWorked || 0), 0);
            const totalAltered = currentDeptRecords.reduce((sum, record) => sum + (record.alteration || 0), 0);
            const totalRejected = currentDeptRecords.reduce((sum, record) => sum + (record.rejectReturn || 0), 0);
            const totalProcessed = totalWorkDone + totalAltered + totalRejected;

            // For "Assigned" cards, use quantity_assigned; for Main cards, use quantity_remaining
            const quantityToWork = (taskData.remarks === 'Assigned' && taskData.quantity_assigned)
                ? taskData.quantity_assigned
                : (taskData.quantity_remaining ?? 0);
            const remainingWork = quantityToWork - totalProcessed;

            // Prevent moving if there's remaining work
            if (remainingWork > 0) {
                showToast('warning', 'Cannot send to another department. You must complete all work first');
                return;
            }

            try {
                setSaving(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    showToast('error', 'Authentication required. Please login again.');
                    return;
                }

                const apiUrl = process.env.NEXT_PUBLIC_SEND_TO_ANOTHER_DEPARTMENT;
                // Updated to use department_sub_batch_id instead of fromDepartmentId
                const requestBody = {
                    departmentSubBatchId: taskData.id,  // The department_sub_batches.id
                    toDepartmentId: parseInt(sendToDepartment),
                    quantityBeingSent: totalWorkDone, // The total quantity completed in current department
                };

                // Advance to next department
                const advanceResponse = await fetch(apiUrl!, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!advanceResponse.ok) {
                    const errorData = await advanceResponse.json();
                    throw new Error(errorData.message || 'Failed to advance to next department');
                }

                const result = await advanceResponse.json();

                if (result.success) {

                    // Close modal immediately
                    onClose();

                    // Show success toast
                    showToast('success', 'Successfully sent to department!');

                    // Clear the selected department
                    setSendToDepartment('');

                    // Wait a bit for backend to process, then refresh Kanban board
                    setTimeout(() => {
                        if (onStageChange) {
                            onStageChange();
                        } else {
                            window.location.reload();
                        }
                    }, 500);
                } else {
                    throw new Error(result.message || 'Failed to advance to next department');
                }
            } catch (error: any) {
                showToast('error', `Failed to send to department: ${error.message}`);
            } finally {
                setSaving(false);
            }
        } else {
            // Normal stage update (no department selected)
            try {
                setSaving(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    showToast('error', 'Authentication required. Please login again.');
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
                    showToast('success', 'Stage updated successfully!');
                    onClose();
                    // Refresh the kanban board
                    if (onStageChange) {
                        onStageChange();
                    }
                } else {
                    throw new Error(result.message || 'Failed to update stage');
                }
            } catch (error: any) {
                showToast('error', `Failed to update stage: ${error.message}`);
            } finally {
                setSaving(false);
            }
        }
    };

    // Handle marking sub-batch as completed
    const handleMarkAsCompleted = async () => {
        if (confirmationText.toLowerCase() !== 'yes') {
            showToast('warning', 'Please type "yes" to confirm marking this sub-batch as completed');
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token');

            if (!token) {
                showToast('error', 'Authentication required. Please login again.');
                return;
            }

            const subBatchId = taskData.sub_batch?.id || taskData.sub_batch_id;

            if (!subBatchId) {
                showToast('error', 'Cannot mark as completed: Sub-batch ID is missing');
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
                showToast('success', 'Sub-batch has been marked as COMPLETED! It can no longer be moved.');
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
            showToast('error', `Failed to mark as completed: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Memoize filtered worker records based on card type
    const currentDepartmentRecords = useMemo(() => {
        if (taskData?.remarks === 'Assigned') {
            // For "Assigned" cards, show only worker logs for this specific card
            return workerRecords.filter(record =>
                record.department_sub_batch_id === taskData.id
            );
        } else {
            // For Main/Unassigned cards, show all worker records for this department
            return workerRecords.filter(record =>
                record.department_id === taskData?.department_id
            );
        }
    }, [workerRecords, taskData?.remarks, taskData?.id, taskData?.department_id]);

    // Memoize work progress calculations
    const workProgress = useMemo(() => {
        const totalWorkDone = currentDepartmentRecords.reduce((sum, record) => sum + (record.qtyWorked || 0), 0);
        const totalAltered = currentDepartmentRecords.reduce((sum, record) => sum + (record.alteration || 0), 0);
        const totalRejected = currentDepartmentRecords.reduce((sum, record) => sum + (record.rejectReturn || 0), 0);
        const totalQuantity = taskData?.sub_batch?.estimated_pieces ?? 0;

        // Quantity to work depends on card type
        // This represents the "Received" quantity in Production Summary
        let quantityToWork;

        // ✅ FIXED: Always prefer quantity_received (actual received quantity)
        // This fixes the issue where "Received" showed wrong value after removing splitting logic
        if (taskData?.quantity_received !== null && taskData?.quantity_received !== undefined) {
            // Use the actual received quantity from database
            quantityToWork = taskData.quantity_received;
        } else if (taskData?.remarks === 'Main') {
            // Fallback for Main cards without quantity_received
            quantityToWork = taskData.quantity_remaining ?? totalQuantity;
        } else {
            // Final fallback to total quantity from sub-batch
            quantityToWork = totalQuantity;
        }

        const remainingWork = quantityToWork - totalWorkDone - totalRejected - totalAltered;

        return {
            totalWorkDone,
            totalAltered,
            totalRejected,
            totalQuantity,
            quantityToWork,
            remainingWork
        };
    }, [currentDepartmentRecords, taskData?.sub_batch?.estimated_pieces, taskData?.remarks,
        taskData?.quantity_assigned, taskData?.quantity_remaining, taskData?.quantity_received]);

    // Memoize parent remaining work calculation
    const parentRemainingWork = useMemo(() => {
        if (taskData?.remarks === 'Assigned' && mainCardData) {
            return mainCardData.quantity_remaining ?? 0;
        } else if (taskData?.remarks === 'Main') {
            return taskData.quantity_remaining ?? 0;
        } else {
            const allDepartmentRecords = workerRecords.filter(record =>
                record.department_id === taskData?.department_id
            );
            const totalWorkedAll = allDepartmentRecords.reduce((sum, record) => sum + (record.qtyWorked || 0), 0);
            const totalAlteredAll = allDepartmentRecords.reduce((sum, record) => sum + (record.alteration || 0), 0);
            const totalRejectedAll = allDepartmentRecords.reduce((sum, record) => sum + (record.rejectReturn || 0), 0);

            const parentTotalQuantity = taskData?.quantity_received ?? taskData?.sub_batch?.estimated_pieces ?? workProgress.totalQuantity;
            return parentTotalQuantity - totalWorkedAll - totalRejectedAll - totalAlteredAll;
        }
    }, [taskData?.remarks, taskData?.quantity_remaining, taskData?.quantity_received,
        taskData?.department_id, taskData?.sub_batch?.estimated_pieces,
        mainCardData, workerRecords, workProgress.totalQuantity]);

    // Memoize rejection and alteration logs
    const logs = useMemo(() => {
        const rejectionLogs = currentDepartmentRecords.filter(record => (record.rejectReturn ?? 0) > 0);
        const alterationLogs = currentDepartmentRecords.filter(record => (record.alteration ?? 0) > 0);

        return {
            rejectionLogs,
            alterationLogs,
            latestRejectionLog: rejectionLogs.length > 0 ? rejectionLogs[rejectionLogs.length - 1] : null,
            latestAlterationLog: alterationLogs.length > 0 ? alterationLogs[alterationLogs.length - 1] : null
        };
    }, [currentDepartmentRecords]);

    // Check if current department is the LAST department in the workflow
    // This is used to determine if "Mark Sub-batch as Completed" button should be shown
    const isLastDepartment = useMemo(() => {
        const departmentFlow = subBatchHistory?.department_flow;
        const currentDeptName = taskData?.department?.name;

        if (!departmentFlow || !currentDeptName) return false;

        // Parse flow: "Dep-1 → Dep-2 → Dep-3"
        const flow = departmentFlow.split('→').map((d: string) => d.trim());
        const lastDepartment = flow[flow.length - 1];

        return currentDeptName === lastDepartment;
    }, [subBatchHistory?.department_flow, taskData?.department?.name]);

    // Memoize event handlers
    const handleAddRecord = useCallback(() => {
        setModalMode('add');
        setRecordToEdit(null);
        setIsAddRecordOpen(true);
    }, []);

    const handleEditRecord = useCallback((record: any) => {
        setModalMode('edit');
        setRecordToEdit(record);
        setIsAddRecordOpen(true);
    }, []);

    const handleSaveRecord = useCallback(async () => {
        // Close the modal
        setIsAddRecordOpen(false);
        setRecordToEdit(null);

        // Refresh worker logs from backend to get the latest data
        await fetchWorkerLogs();
    }, [fetchWorkerLogs]);

    const handlePreviewRecord = useCallback((record: any) => {
        setSelectedRecord(record);
        setIsPreviewOpen(true);
    }, []);

    const handleDeleteRecord = useCallback(async (id: number) => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                showToast('error', 'Authentication required. Please login again.');
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
            showToast('success', 'Worker record deleted successfully!');
        } catch (error: any) {
            showToast('error', `Failed to delete worker record: ${error.message}`);
        }
    }, [fetchWorkerLogs, showToast]);

    if (!isOpen || !taskData) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-white/30 transition-opacity duration-300"
                    style={{ backdropFilter: 'blur(4px)' }}
                    onClick={onClose}
                />
                <div className="bg-white rounded-lg w-[95vw] max-w-[900px] mx-4 relative shadow-xl max-h-[95vh] overflow-hidden flex flex-col">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300">
                        <h3 className="text-base font-semibold text-gray-900">Task Details</h3>

                        <div className="flex items-center gap-3">
                            {/* Actions Dropdown */}
                            {workProgress.totalWorkDone > 0 && taskData.stage === 'IN_PROGRESS' && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Actions
                                        <ChevronDown size={16} />
                                    </button>

                                    {showActionsDropdown && (
                                        <>
                                            {/* Backdrop to close dropdown */}
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowActionsDropdown(false)}
                                            />
                                            {/* Dropdown Menu */}
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                                <button
                                                    onClick={() => {
                                                        setIsAlterationModalOpen(true);
                                                        setShowActionsDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                                                >
                                                    🔧 Send for Alteration
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsRejectionModalOpen(true);
                                                        setShowActionsDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                >
                                                    ❌ Reject Items
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto flex-1">
                        <div className="space-y-4">

                            {/* Alteration Alert Banner - Prominent context for altered items */}
                            {taskData.alteration_source && (
                                <div className="mx-4 mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <Edit3 className="text-white" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-yellow-900 mb-1">⚠️ Alteration Card</h4>
                                            <p className="text-xs text-yellow-800 leading-relaxed">
                                                This card contains <span className="font-semibold">{taskData.alteration_source.quantity || 0} pieces</span> that were sent back from{' '}
                                                <span className="font-semibold">{taskData.alteration_source.from_department_name || 'another department'}</span>{' '}
                                                for rework due to: <span className="font-semibold italic">&quot;{taskData.alteration_source.reason || 'quality issues'}&quot;</span>
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                                    <Clock size={12} />
                                                    Received: {formatNepaliDate(taskData.alteration_source.created_at || taskData.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rejection Alert Banner - Prominent context for rejected items */}
                            {taskData.rejection_source && (
                                <div className="mx-4 mt-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                                            <XCircle className="text-white" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-red-900 mb-1">🚫 Rejection Card</h4>
                                            <p className="text-xs text-red-800 leading-relaxed">
                                                This card contains <span className="font-semibold">{taskData.rejection_source.quantity || 0} pieces</span> that were rejected from{' '}
                                                <span className="font-semibold">{taskData.rejection_source.from_department_name || 'another department'}</span>{' '}
                                                due to: <span className="font-semibold italic">&quot;{taskData.rejection_source.reason || 'quality issues'}&quot;</span>
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                                                    <Clock size={12} />
                                                    Received: {formatNepaliDate(taskData.rejection_source.created_at || taskData.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top Section: Task Information (Left) + Route Details (Right) */}
                            <div className="grid grid-cols-2 gap-4 px-4 py-3">
                                {/* Left: Task Information */}
                                <div>
                                    <h4 className="font-semibold mb-3 text-sm">Task Information</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    {/* Row 1: Roll Name and Batch Name */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Roll Name</label>
                                        <div className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900">
                                            {taskData.sub_batch?.batch?.name || 'Roll 1'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Batch Name</label>
                                        <div className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900">
                                            {taskData.sub_batch?.batch?.name || 'Batch B'}
                                        </div>
                                    </div>

                                    {/* Row 2: Sub Batch Name and Total Quantity */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Sub Batch Name</label>
                                        <div className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900">
                                            {taskData.sub_batch?.name || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Total Quantity</label>
                                        <div className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900">
                                            {taskData.sub_batch?.estimated_pieces?.toLocaleString() || '-'}
                                        </div>
                                    </div>

                                    {/* Row 3: Estimated Start Date and Due Date */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Estimated Start Date</label>
                                        <div className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 flex items-center justify-between">
                                            <span>{formatNepaliDate(taskData.sub_batch?.start_date)}</span>
                                            <Calendar size={14} className="text-gray-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Due Date</label>
                                        <div className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 flex items-center justify-between">
                                            <span>{formatNepaliDate(taskData.sub_batch?.due_date)}</span>
                                            <Calendar size={14} className="text-gray-500" />
                                        </div>
                                    </div>

                                    {/* Row 4: Status and Send to Department */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            disabled={taskData.sub_batch?.status === 'COMPLETED'}
                                            className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="NEW_ARRIVAL">Not Started</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="COMPLETED">Completed</option>
                                        </select>
                                    </div>
                                    {taskData.stage === 'COMPLETED' && (() => {
                                        // Filter to show only NEXT departments in the flow (forward progression)
                                        const departmentFlow = subBatchHistory?.department_flow;
                                        const currentDeptName = taskData.department?.name;

                                        let nextDepartments: any[] = [];

                                        if (departmentFlow && currentDeptName) {
                                            // Parse flow: "Dep-X → Dep-Y → Dep-Z"
                                            const flow = departmentFlow.split('→').map((d: string) => d.trim());
                                            const currentIndex = flow.findIndex((d: string) => d === currentDeptName);

                                            if (currentIndex !== -1 && currentIndex < flow.length - 1) {
                                                // Get ONLY the immediate next department (sequential workflow)
                                                const nextDeptName = flow[currentIndex + 1];

                                                // Filter to show only the immediate next department
                                                nextDepartments = departments.filter(dept =>
                                                    dept.name === nextDeptName
                                                );
                                            }
                                        }

                                        return (
                                            <div>
                                                <label className="text-xs font-medium text-gray-700 block mb-1">Send to Department</label>
                                                {nextDepartments.length > 0 ? (
                                                    <div className="relative">
                                                        <select
                                                            value={sendToDepartment}
                                                            onChange={(e) => setSendToDepartment(e.target.value)}
                                                            disabled={taskData.sub_batch?.status === 'COMPLETED'}
                                                            className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
                                                        >
                                                            <option value="">Select next department...</option>
                                                            {nextDepartments.map((dept) => (
                                                                <option key={dept.id} value={dept.id}>
                                                                    {dept.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-500">
                                                        Last department - no next department available
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Row 5: Sent from Department (full width) */}
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Sent from Department</label>
                                        <div className="w-fit bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900">
                                            {taskData.rejection_source?.from_department_name ||
                                             taskData.alteration_source?.from_department_name ||
                                             taskData.sent_from_department_name ||
                                             '-'}
                                        </div>
                                    </div>
                                </div>
                                </div>

                                {/* Right: Route Details */}
                                <div>
                                    <h4 className="font-semibold mb-3 text-sm text-gray-900">Route Details</h4>

                                    {/* Product Name and Batch ID */}
                                    <div className="mb-3">
                                        <p className="text-sm font-normal text-gray-900">{taskData.sub_batch?.batch?.category || 'Linen Silk'}</p>
                                        <p className="text-xs text-gray-400">{taskData.sub_batch?.name || 'B001.1'}</p>
                                    </div>

                                    {/* Department Flow with connecting line */}
                                    {subBatchHistory && subBatchHistory.department_flow && (
                                        <div className="relative">
                                            {/* Vertical line connecting dots */}
                                            <div className="absolute left-[5px] top-[6px] bottom-[6px] w-[2px] bg-gray-200" />

                                            <div className="space-y-2 relative">
                                                {subBatchHistory.department_flow.split('→').map((deptName: string, index: number) => {
                                                    const trimmedName = deptName.trim();
                                                    // Check if this department is the current one
                                                    // Match by department name with taskData.department?.name OR by department_id
                                                    const isCurrentDepartment =
                                                        trimmedName === taskData.department?.name ||
                                                        subBatchHistory.department_details?.some(
                                                            (dept: any) => dept.department_name === trimmedName && dept.department_id === taskData.department_id
                                                        );
                                                    return (
                                                        <div key={index} className="flex items-center gap-2 relative">
                                                            <div className={`w-[8px] h-[8px] rounded-full border-2 z-10 ${
                                                                isCurrentDepartment
                                                                    ? 'bg-green-500 border-green-500'
                                                                    : 'bg-gray-300 border-gray-300'
                                                            }`} />
                                                            <span className={`text-xs ${isCurrentDepartment ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                                                {trimmedName}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Attachments */}
                            {taskData.sub_batch?.attachments && taskData.sub_batch.attachments.length > 0 && (
                                <div className="px-4">
                                    <h4 className="font-semibold mb-2 text-sm">Attachments</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {taskData.sub_batch.attachments.map((attachment: any) => (
                                                <div
                                                    key={attachment.id}
                                                    className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-xs border border-gray-300"
                                                >
                                                    <span className="font-medium text-gray-700">{attachment.attachment_name}</span>
                                                    <span className="text-gray-600">:</span>
                                                    <span className="font-semibold text-gray-700">{attachment.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                </div>
                            )}

                            {/* Production Summary */}
                            <div className="px-4">
                                <h4 className="font-semibold text-sm mb-3">Production Summary</h4>

                                <div className="flex items-start gap-6">
                                    {/* Received */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <Inbox className="text-blue-500" size={16} />
                                            <span className="text-xs text-gray-600">Received</span>
                                        </div>
                                        <p className="text-sm text-center font-semibold text-gray-900">{workProgress.quantityToWork.toLocaleString()}</p>
                                    </div>

                                    {/* Worked */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <CheckCircle className="text-green-500" size={16} />
                                            <span className="text-xs text-gray-600">Worked</span>
                                        </div>
                                        <p className="text-sm text-center font-semibold text-gray-900">{workProgress.totalWorkDone.toLocaleString()}</p>
                                    </div>

                                    {/* Altered */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <Edit3 className="text-yellow-500" size={16} />
                                            <span className="text-xs text-gray-600">Altered</span>
                                        </div>
                                        <p className="text-sm text-center font-semibold text-gray-900">{workProgress.totalAltered.toLocaleString()}</p>
                                    </div>

                                    {/* Rejected */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <XCircle className="text-red-500" size={16} />
                                            <span className="text-xs text-gray-600">Rejected</span>
                                        </div>
                                        <p className="text-sm text-center font-semibold text-gray-900">{workProgress.totalRejected.toLocaleString()}</p>
                                    </div>


                                    {/* Remaining */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <Clock className="text-orange-500" size={16} />
                                            <span className="text-xs text-gray-600">Remaining</span>
                                        </div>
                                        <p className="text-sm text-center font-semibold text-gray-900">{workProgress.remainingWork.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Alteration Details Section - Enhanced design for alteration cards */}
                            {taskData.alteration_source && (
                                <div className="mx-4 my-4 border border-yellow-200 rounded-lg overflow-hidden shadow-sm">
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
                                                    <span>{formatNepaliDate(taskData.alteration_source.created_at || taskData.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Source Department */}
                                            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                                <label className="text-xs font-semibold text-yellow-800 uppercase tracking-wide block mb-1.5">Source Department</label>
                                                <div className="text-sm text-yellow-900 font-bold">
                                                    {taskData.alteration_source?.from_department_name || '-'}
                                                </div>
                                            </div>

                                            {/* Quantity Altered */}
                                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                <label className="text-xs font-semibold text-blue-800 uppercase tracking-wide block mb-1.5">Quantity Altered</label>
                                                <div className="text-lg text-blue-900 font-bold">
                                                    {taskData.alteration_source.quantity || taskData.quantity_remaining || '0'} pcs
                                                </div>
                                            </div>

                                            {/* Alteration Reason */}
                                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                                <label className="text-xs font-semibold text-orange-800 uppercase tracking-wide block mb-1.5">Reason for Alteration</label>
                                                <div className="text-sm text-orange-900 font-medium italic">
                                                    &quot;{taskData.alteration_source.reason || logs.latestAlterationLog?.alterationNote || '-'}&quot;
                                                </div>
                                            </div>
                                        </div>

                                        {/* Attachments for Alteration */}
                                        {taskData.sub_batch?.attachments && taskData.sub_batch.attachments.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">Reference Attachments</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {taskData.sub_batch.attachments.map((attachment: any) => (
                                                        <div
                                                            key={attachment.id}
                                                            className="inline-flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-md text-sm border border-blue-200"
                                                        >
                                                            <span className="font-medium text-blue-900">{attachment.attachment_name}</span>
                                                            <span className="text-blue-700">×</span>
                                                            <span className="font-bold text-blue-900">{attachment.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Rejection Details Section - Enhanced design for rejection cards */}
                            {taskData.rejection_source && (
                                <div className="mx-4 my-4 border border-red-200 rounded-lg overflow-hidden shadow-sm">
                                    {/* Section Header */}
                                    <div className="bg-gradient-to-r from-red-100 to-red-50 px-4 py-3 border-b border-red-200">
                                        <h4 className="font-bold text-base text-red-900 flex items-center gap-2">
                                            <XCircle size={18} className="text-red-700" />
                                            Rejection Details
                                        </h4>
                                    </div>

                                    {/* Rejection Data Grid */}
                                    <div className="bg-white p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Date Received */}
                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Date Received</label>
                                                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                                                    <Calendar size={16} className="text-gray-500" />
                                                    <span>{formatNepaliDate(taskData.rejection_source.created_at || taskData.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Source Department */}
                                            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                                <label className="text-xs font-semibold text-red-800 uppercase tracking-wide block mb-1.5">Source Department</label>
                                                <div className="text-sm text-red-900 font-bold">
                                                    {taskData.rejection_source?.from_department_name || '-'}
                                                </div>
                                            </div>

                                            {/* Quantity Rejected */}
                                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                <label className="text-xs font-semibold text-blue-800 uppercase tracking-wide block mb-1.5">Quantity Rejected</label>
                                                <div className="text-lg text-blue-900 font-bold">
                                                    {taskData.rejection_source.quantity || taskData.quantity_remaining || '0'} pcs
                                                </div>
                                            </div>

                                            {/* Rejection Reason */}
                                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                                <label className="text-xs font-semibold text-orange-800 uppercase tracking-wide block mb-1.5">Reason for Rejection</label>
                                                <div className="text-sm text-orange-900 font-medium italic">
                                                    &quot;{taskData.rejection_source.reason || '-'}&quot;
                                                </div>
                                            </div>
                                        </div>

                                        {/* Attachments for Rejection */}
                                        {taskData.sub_batch?.attachments && taskData.sub_batch.attachments.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">Reference Attachments</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {taskData.sub_batch.attachments.map((attachment: any) => (
                                                        <div
                                                            key={attachment.id}
                                                            className="inline-flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-md text-sm border border-blue-200"
                                                        >
                                                            <span className="font-medium text-blue-900">{attachment.attachment_name}</span>
                                                            <span className="text-blue-700">×</span>
                                                            <span className="font-bold text-blue-900">{attachment.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Completed Departments */}
                            {subBatchHistory && subBatchHistory.department_details && subBatchHistory.department_details.length > 0 && (
                                <div className="px-6 py-4">
                                    <h4 className="font-semibold text-base mb-4">Completed Departments</h4>
                                    <div className="space-y-2">
                                        {subBatchHistory.department_details
                                            .filter((dept: any) => dept.worker_logs && dept.worker_logs.length > 0)
                                            .map((dept: any) => {
                                                const isExpanded = expandedDepartments.includes(dept.department_entry_id);
                                                return (
                                                    <div key={dept.department_entry_id} className="border border-gray-300 rounded-lg">
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
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900">{dept.department_name}</span>
                                                                {dept.entry_type === 'REWORK' && (
                                                                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Rework</span>
                                                                )}
                                                            </div>
                                                            <ChevronRight
                                                                size={16}
                                                                className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                            />
                                                        </button>

                                                        {isExpanded && dept.worker_logs && dept.worker_logs.length > 0 && (
                                                            <div className="border-t border-gray-200 bg-gray-50">
                                                                <div className="overflow-x-auto">
                                                                    <table className="min-w-full border-collapse">
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

                            {/* Current Assignment */}
                            <div>
                                <div className="border-t border-gray-300 flex items-center justify-between px-4 py-3 w-full">
                                    <h4 className="font-semibold text-sm">Current Assignment</h4>
                                    <button
                                        onClick={handleAddRecord}
                                        disabled={taskData.stage !== 'IN_PROGRESS' || workProgress.remainingWork <= 0}
                                        className={`px-3 py-1 rounded text-xs transition ${
                                            taskData.stage !== 'IN_PROGRESS' || workProgress.remainingWork <= 0
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'border-blue-500 border text-blue-500 hover:bg-blue-700 hover:text-white'
                                        }`}
                                        title={
                                            taskData.stage !== 'IN_PROGRESS'
                                                ? 'Save the status as In Progress first to add records'
                                                : workProgress.remainingWork <= 0
                                                ? 'All work has been completed. No more records can be added.'
                                                : 'Add worker record'
                                        }
                                    >
                                        + Add Record
                                    </button>
                                </div>

                                {taskData.stage !== 'IN_PROGRESS' && (
                                    <div className="px-4 py-1.5 text-xs text-orange-600 bg-orange-50 border-b">
                                        <strong>Note:</strong> Worker assignment is only available after saving the status as In Progress.
                                    </div>
                                )}

                                {taskData.stage === 'COMPLETED' && (
                                    <div className="px-4 py-1.5 text-xs text-green-800 bg-green-50 border-b">
                                        <strong>Note:</strong> This task is completed. You can only view records and send to another department.
                                    </div>
                                )}

                                {workProgress.remainingWork <= 0 && taskData.stage !== 'COMPLETED' && (
                                    <div className="px-4 py-1.5 text-xs text-green-800 bg-green-50 border-b">
                                        <strong>Work Complete!</strong> All {workProgress.quantityToWork.toLocaleString()} pieces have been processed. You can now move this sub-batch to another department.
                                    </div>
                                )}

                                {/* Show quantity info for rejected items only (not for alteration cards) */}
                                {taskData.quantity_remaining && !taskData.alteration_source && (
                                    <div className={`px-4 py-2 text-xs border-b ${
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
                                    </div>
                                )}

                                <div className="px-4 py-1.5 text-xs text-gray-600 bg-gray-50 border-b flex justify-between">
                                    <div><strong>Records Found:</strong> {currentDepartmentRecords.length}</div>
                                </div>

                                <div className="overflow-x-auto">
                                    {taskData.alteration_source ? (
                                        /* Simplified table for alteration cards */
                                        <table className="min-w-full border-collapse">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Worker Name</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Quantity</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Date</th>
                                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {currentDepartmentRecords.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                                                            No worker assignments yet. Click + Add Record to assign workers.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    currentDepartmentRecords.map((record) => (
                                                        <tr key={record.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900">{record.worker}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{record.qtyWorked ?? 0}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 flex items-center gap-2">
                                                                {record.date}
                                                                <Calendar size={14} className="text-gray-400" />
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    onClick={() => handleDeleteRecord(record.id)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                    title="Delete record"
                                                                >
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        /* Full table for regular cards */
                                        <WorkerAssignmentTable
                                            records={currentDepartmentRecords}
                                            onDelete={handleDeleteRecord}
                                            onEdit={handleEditRecord}
                                            onPreview={handlePreviewRecord}
                                            loading={loading}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Section - Collapsible */}
                    <div className="px-4 pb-2">
                        <button
                            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 py-2 w-full"
                        >
                            {isHistoryExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <History size={16} />
                            <span className="font-medium">Activity History</span>
                            <span className="text-xs text-gray-400 ml-1">
                                ({(currentDepartmentRecords?.length || 0) + (currentDepartmentRecords?.filter((r: any) => (r.rejectReturn || 0) > 0).length || 0) + (currentDepartmentRecords?.filter((r: any) => (r.alteration || 0) > 0).length || 0) + 1} events)
                            </span>
                        </button>

                        {isHistoryExpanded && (
                            <div className="mt-2 pl-6 border-l-2 border-gray-200 space-y-3 pb-3">
                                {/* Department Arrival Event */}
                                <div className="relative">
                                    <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                                    <div className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <ArrowRight size={14} className="text-blue-500" />
                                            <span className="font-medium text-gray-800">
                                                Arrived at {taskData.department?.name || 'Department'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {taskData.createdAt
                                                ? new Date(taskData.createdAt).toLocaleString('en-US', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                })
                                                : 'Date not available'}
                                            {taskData.sent_from_department_name && (
                                                <span className="ml-2 text-gray-400">
                                                    from {taskData.sent_from_department_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Worker Assignment Events */}
                                {currentDepartmentRecords && currentDepartmentRecords.length > 0 ? (
                                    currentDepartmentRecords.map((record: any, index: number) => (
                                        <div key={record.id || index} className="relative">
                                            <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-green-500" />
                                                    <span className="font-medium text-gray-800">
                                                        {record.worker || 'Worker'} assigned
                                                    </span>
                                                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                        {record.qtyWorked || 0} pcs
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {record.date && record.date !== '-' ? record.date : 'Date not available'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="relative">
                                        <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-gray-300 border-2 border-white"></div>
                                        <div className="text-sm text-gray-500 italic">
                                            No workers assigned yet
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Events */}
                                {currentDepartmentRecords && currentDepartmentRecords
                                    .filter((record: any) => (record.rejectReturn || 0) > 0)
                                    .map((record: any, index: number) => (
                                        <div key={`reject-${record.id || index}`} className="relative">
                                            <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2">
                                                    <XCircle size={14} className="text-red-500" />
                                                    <span className="font-medium text-gray-800">
                                                        {record.worker || 'Worker'} rejected
                                                    </span>
                                                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                                        {record.rejectReturn} pcs
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {record.date && record.date !== '-' ? record.date : 'Date not available'}
                                                    {record.rejectionReason && record.rejectionReason !== '-' && (
                                                        <span className="ml-2 text-red-600">
                                                            Reason: {record.rejectionReason}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }

                                {/* Alteration Events */}
                                {currentDepartmentRecords && currentDepartmentRecords
                                    .filter((record: any) => (record.alteration || 0) > 0)
                                    .map((record: any, index: number) => (
                                        <div key={`alter-${record.id || index}`} className="relative">
                                            <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-yellow-500 border-2 border-white"></div>
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Edit3 size={14} className="text-yellow-500" />
                                                    <span className="font-medium text-gray-800">
                                                        {record.worker || 'Worker'} sent for alteration
                                                    </span>
                                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                                        {record.alteration} pcs
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {record.date && record.date !== '-' ? record.date : 'Date not available'}
                                                    {record.alterationNote && record.alterationNote !== '-' && (
                                                        <span className="ml-2 text-yellow-600">
                                                            Note: {record.alterationNote}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }

                                {/* Current Status Indicator */}
                                <div className="relative">
                                    <div className={`absolute -left-[25px] w-3 h-3 rounded-full border-2 border-white ${
                                        taskData.stage === 'COMPLETED' ? 'bg-purple-500' :
                                        taskData.stage === 'IN_PROGRESS' ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                    }`}></div>
                                    <div className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className={
                                                taskData.stage === 'COMPLETED' ? 'text-purple-500' :
                                                taskData.stage === 'IN_PROGRESS' ? 'text-yellow-500' :
                                                'text-gray-400'
                                            } />
                                            <span className="font-medium text-gray-800">
                                                Current Status: {taskData.stage?.replace('_', ' ') || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {workProgress.remainingWork > 0
                                                ? `${workProgress.remainingWork} pcs remaining`
                                                : 'All work completed'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-300 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <div className="flex gap-2">
                                {/* Show Mark as Completed button only when:
                                    1. Stage is COMPLETED
                                    2. Sub-batch is not already marked as COMPLETED
                                    3. Current department is the LAST department in workflow */}
                                {taskData.stage === 'COMPLETED' && taskData.sub_batch?.status !== 'COMPLETED' && isLastDepartment && (
                                    <button
                                        onClick={() => setShowCompletionDialog(true)}
                                        disabled={saving}
                                        className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Mark Sub-batch as Completed
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={saving || taskData.sub_batch?.status === 'COMPLETED'}
                                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={taskData.sub_batch?.status === 'COMPLETED' ? 'Cannot modify - Sub-batch is completed' : ''}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : taskData.sub_batch?.status === 'COMPLETED'
                                        ? 'Completed'
                                        : sendToDepartment
                                        ? 'Send to Department'
                                        : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Record Modal */}
            <AddRecordModal
                isOpen={isAddRecordOpen}
                onClose={() => {
                    setIsAddRecordOpen(false);
                    setRecordToEdit(null);
                }}
                onSave={handleSaveRecord}
                mode={modalMode}
                editRecord={recordToEdit}
                subBatch={{
                    ...taskData.sub_batch,
                    department_sub_batch_id: taskData.id,  // Pass the department_sub_batch_id
                    department_id: taskData.department_id,  // Pass the current department_id
                    quantity_remaining: taskData.quantity_remaining,
                    quantity_assigned: taskData.quantity_assigned,  // Pass assigned quantity for Assigned cards
                    remaining_work: workProgress.remainingWork,  // Pass the calculated remaining work from production summary
                    parent_remaining_work: parentRemainingWork,  // Pass parent/total remaining work for validation
                    remarks: taskData.remarks,
                    rejection_source: taskData.rejection_source,
                    alteration_source: taskData.alteration_source,
                    assigned_worker_id: taskData.assigned_worker_id,  // Pass assigned worker ID for Assigned cards
                    assigned_worker: taskData.assigned_worker  // Pass assigned worker details for Assigned cards
                }}
            />

            {/* Preview Modal */}
            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                record={selectedRecord}
            />

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
                                    Sub-batch: <strong>{taskData.sub_batch?.name}</strong>
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

            {/* Alteration Modal */}
            <AlterationModal
                isOpen={isAlterationModalOpen}
                onClose={() => setIsAlterationModalOpen(false)}
                onSuccess={() => {
                    fetchWorkerLogs();
                    if (onStageChange) onStageChange();
                }}
                subBatchId={taskData?.sub_batch?.id || null}
                departmentId={taskData?.department_id || null}
                availableQuantity={workProgress.totalWorkDone || 0}
                subBatchName={taskData?.sub_batch?.name || 'Unknown'}
                departmentFlow={subBatchHistory?.department_flow || null}
                currentDepartmentName={taskData?.department?.name || null}
                workerRecords={currentDepartmentRecords}
            />

            {/* Rejection Modal */}
            <RejectionModal
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                onSuccess={() => {
                    fetchWorkerLogs();
                    if (onStageChange) onStageChange();
                }}
                subBatchId={taskData?.sub_batch?.id || null}
                departmentId={taskData?.department_id || null}
                availableQuantity={workProgress.totalWorkDone || 0}
                subBatchName={taskData?.sub_batch?.name || 'Unknown'}
                workerRecords={currentDepartmentRecords}
            />
        </>
    );
};

export default TaskDetailsModal;