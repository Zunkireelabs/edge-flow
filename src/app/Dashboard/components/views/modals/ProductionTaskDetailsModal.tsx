/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, X, AlertTriangle, Edit3, Plus, Trash2 } from 'lucide-react';
import RejectModal from './RejectModal';
import AlterationModal from './AlterationModal';

interface ProductionTaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskData: any;
    onRefresh?: () => void;
}

const ProductionTaskDetailsModal: React.FC<ProductionTaskDetailsModalProps> = ({
    isOpen,
    onClose,
    taskData,
    onRefresh
}) => {
    const [taskDetails, setTaskDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isAlterationModalOpen, setIsAlterationModalOpen] = useState(false);

    // Worker assignment states
    const [selectedWorker, setSelectedWorker] = useState('');
    const [workerQuantity, setWorkerQuantity] = useState('');
    const [workerDate, setWorkerDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);

    // Format date helper
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    // Fetch task details from new API
    const fetchTaskDetails = useCallback(async () => {
        if (!taskData?.id && !taskData?.sub_batch_id) return;

        const subBatchId = taskData.sub_batch_id || taskData.id;
        const departmentId = taskData.department_id;
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/production/task-details/${subBatchId}?department_id=${departmentId}`;

        try {
            setLoading(true);
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('Failed to fetch task details');
            }

            const result = await response.json();
            console.log('Task Details Response:', result);

            if (result.success) {
                setTaskDetails(result.data);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Failed to load task details');
        } finally {
            setLoading(false);
        }
    }, [taskData]);

    // Fetch available workers
    const fetchAvailableWorkers = useCallback(async () => {
        if (!taskData?.department_id) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers/department/${taskData.department_id}`);
            if (response.ok) {
                const workers = await response.json();
                setAvailableWorkers(workers);
            }
        } catch (error) {
            console.error('Error fetching workers:', error);
        }
    }, [taskData?.department_id]);

    useEffect(() => {
        if (isOpen && taskData) {
            fetchTaskDetails();
            fetchAvailableWorkers();
        }
    }, [isOpen, taskData, fetchTaskDetails, fetchAvailableWorkers]);

    // Handle status change
    const handleStatusChange = async (newStatus: string) => {
        if (!taskDetails) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/production/update-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    department_sub_batch_id: taskDetails.department_sub_batch_id,
                    status: newStatus,
                }),
            });

            if (!response.ok) throw new Error('Failed to update status');

            alert('Status updated successfully');
            fetchTaskDetails();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    // Handle worker assignment
    const handleAssignWorker = async () => {
        if (!selectedWorker || !workerQuantity) {
            alert('Please select a worker and enter quantity');
            return;
        }

        const quantity = parseInt(workerQuantity);
        if (quantity <= 0 || quantity > (taskDetails?.remaining || 0)) {
            alert(`Invalid quantity. Available: ${taskDetails?.remaining || 0} pieces`);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CREATE_WORKER_LOGS}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    worker_id: parseInt(selectedWorker),
                    sub_batch_id: taskDetails.sub_batch_id,
                    department_id: taskData.department_id,
                    department_sub_batch_id: taskDetails.department_sub_batch_id,
                    work_date: workerDate,
                    quantity_worked: quantity,
                    activity_type: 'NORMAL',
                    is_billable: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to assign worker');
            }

            alert('Worker assigned successfully!');
            setSelectedWorker('');
            setWorkerQuantity('');
            setWorkerDate(new Date().toISOString().split('T')[0]);
            fetchTaskDetails();
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error('Error assigning worker:', error);
            alert(error.message || 'Failed to assign worker');
        }
    };

    // Handle delete worker
    const handleDeleteWorker = async (workerId: number) => {
        if (!confirm('Are you sure you want to delete this worker assignment?')) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_DELETE_WORKER_LOG}/${workerId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete worker assignment');

            alert('Worker assignment deleted successfully');
            fetchTaskDetails();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting worker:', error);
            alert('Failed to delete worker assignment');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Modal Backdrop - Transparent overlay */}
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-gray-500">Loading task details...</div>
                        </div>
                    ) : taskDetails ? (
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-3 divide-x divide-gray-200 h-full">
                                {/* LEFT COLUMN - Task Information */}
                                <div className="p-8 space-y-6 overflow-y-auto">
                                    <h3 className="text-base font-semibold text-gray-900 mb-4">Task Information</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Department */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">Department</label>
                                            <input
                                                type="text"
                                                value={taskDetails.department_name || ''}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700"
                                            />
                                        </div>

                                        {/* Roll Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">Roll Name</label>
                                            <input
                                                type="text"
                                                value={taskDetails.roll_name || ''}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700"
                                            />
                                        </div>

                                        {/* Batch Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">Batch Name</label>
                                            <input
                                                type="text"
                                                value={taskDetails.batch_name || ''}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700"
                                            />
                                        </div>

                                        {/* Sub Batch Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">Sub Batch Name</label>
                                            <input
                                                type="text"
                                                value={taskDetails.sub_batch_name || ''}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700"
                                            />
                                        </div>

                                        {/* Estimated Start Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">Estimated Start Date</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={formatDate(taskDetails.estimated_start_date)}
                                                    disabled
                                                    className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700"
                                                />
                                                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                        {/* Due Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">Due Date</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={formatDate(taskDetails.due_date)}
                                                    disabled
                                                    className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700"
                                                />
                                                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                        {/* Total Quantity */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">Total Quantity</label>
                                            <input
                                                type="text"
                                                value={taskDetails.total_quantity || ''}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700"
                                            />
                                        </div>

                                        {/* Sent from Department */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">Sent from Department</label>
                                            <input
                                                type="text"
                                                value={taskDetails.sent_from_department || ''}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
                                        <select
                                            value={taskDetails.status || 'NEW_ARRIVAL'}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="NEW_ARRIVAL">Not Started</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="COMPLETED">Completed</option>
                                        </select>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsRejectModalOpen(true)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            Reject and Return
                                        </button>
                                        <button
                                            onClick={() => setIsAlterationModalOpen(true)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Add Alteration
                                        </button>
                                    </div>

                                    {/* Send To Department */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">Send To Department</label>
                                        <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">Select Department</option>
                                            {taskDetails.available_departments?.map((dept: any) => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Attachments */}
                                    {taskDetails.attachments && taskDetails.attachments.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Attachments</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {taskDetails.attachments.map((att: any, idx: number) => (
                                                    <span key={idx} className="px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded border border-gray-200">
                                                        {att.name} : {att.quantity}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Production Summary */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Production Summary</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                    <span className="text-green-600 text-xs">✓</span>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-600">Worked</div>
                                                    <div className="text-base font-semibold">{taskDetails.worked || 0}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                                                    <Edit3 className="w-3 h-3 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-600">Altered</div>
                                                    <div className="text-base font-semibold">{taskDetails.altered || 0}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                                    <span className="text-red-600 text-xs">✕</span>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-600">Rejected</div>
                                                    <div className="text-base font-semibold">{taskDetails.rejected || 0}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <span className="text-gray-600 text-xs">⏱</span>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-600">Remaining</div>
                                                    <div className="text-base font-semibold">{taskDetails.remaining || 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assign Workers */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Assign Workers</h4>

                                        {/* Input Row */}
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            <select
                                                value={selectedWorker}
                                                onChange={(e) => setSelectedWorker(e.target.value)}
                                                className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Name</option>
                                                {availableWorkers.map((worker: any) => (
                                                    <option key={worker.id} value={worker.id}>{worker.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                value={workerQuantity}
                                                onChange={(e) => setWorkerQuantity(e.target.value)}
                                                placeholder="Quantity"
                                                className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={workerDate}
                                                    onChange={(e) => setWorkerDate(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    onClick={handleAssignWorker}
                                                    className="absolute -right-10 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Worker Table */}
                                        {taskDetails.assigned_workers && taskDetails.assigned_workers.length > 0 && (
                                            <div className="border border-gray-200 rounded overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-medium text-gray-700">Worker Name</th>
                                                            <th className="px-3 py-2 text-left font-medium text-gray-700">Quantity</th>
                                                            <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                                                            <th className="px-3 py-2 text-center font-medium text-gray-700 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white">
                                                        {taskDetails.assigned_workers.map((worker: any) => (
                                                            <tr key={worker.id} className="border-t border-gray-200">
                                                                <td className="px-3 py-2 text-gray-900">{worker.worker_name}</td>
                                                                <td className="px-3 py-2 text-gray-900">{worker.quantity}</td>
                                                                <td className="px-3 py-2 text-gray-900">{formatDate(worker.date)}</td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <button
                                                                        onClick={() => handleDeleteWorker(worker.id)}
                                                                        className="p-1 hover:bg-red-50 rounded transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
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

                                {/* MIDDLE COLUMN - Work History */}
                                <div className="p-8 overflow-y-auto">
                                    <h3 className="text-base font-semibold text-gray-900 mb-4">Work History</h3>
                                    <div className="space-y-4">
                                        {!taskDetails.work_history || taskDetails.work_history.length === 0 ? (
                                            <div className="text-center text-gray-400 py-8 text-sm">No work history</div>
                                        ) : (
                                            taskDetails.work_history.map((record: any, idx: number) => (
                                                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-900">{record.worker_name}</h4>
                                                        <span className="text-xs text-gray-500">{formatDate(record.date)}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-3">
                                                        Assigned Quantity: {record.assigned_quantity || 0}
                                                    </div>

                                                    {/* Produced */}
                                                    <div className="bg-blue-100 rounded p-3 mb-2">
                                                        <div className="text-sm font-medium text-blue-900">
                                                            Produced: {record.produced || 0}
                                                        </div>
                                                    </div>

                                                    {/* Rejected */}
                                                    {record.rejected > 0 && (
                                                        <div className="bg-red-100 rounded p-3 mb-2">
                                                            <div className="text-sm font-medium text-red-900">
                                                                Rejected: {record.rejected}
                                                            </div>
                                                            <div className="text-xs text-red-700 mt-1">
                                                                {record.rejection_reason || 'No reason provided'}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Altered */}
                                                    {record.altered > 0 && (
                                                        <div className="bg-yellow-100 rounded p-3">
                                                            <div className="text-sm font-medium text-yellow-900">
                                                                Altered: {record.altered}
                                                            </div>
                                                            <div className="text-xs text-yellow-700 mt-1">
                                                                {record.alteration_note || 'No note provided'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN - Route Details */}
                                <div className="p-8 overflow-y-auto">
                                    <h3 className="text-base font-semibold text-gray-900 mb-4">Route Details</h3>

                                    {/* Linen Info */}
                                    {taskDetails.linen_name && (
                                        <div className="mb-6">
                                            <div className="font-semibold text-gray-900">{taskDetails.linen_name}</div>
                                            <div className="text-sm text-gray-500">{taskDetails.linen_code}</div>
                                        </div>
                                    )}

                                    {/* Department Route */}
                                    {taskDetails.route_steps && taskDetails.route_steps.length > 0 ? (
                                        <div className="space-y-3">
                                            {taskDetails.route_steps.map((step: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        step.completed ? 'bg-green-500' : 'bg-gray-300'
                                                    }`} />
                                                    <span className="text-sm text-gray-900">
                                                        {step.department_name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 py-8 text-sm">No route information</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-gray-500">No task details available</div>
                        </div>
                    )}

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                alert('Save functionality');
                            }}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isRejectModalOpen && taskDetails && (
                <RejectModal
                    isOpen={isRejectModalOpen}
                    onClose={() => setIsRejectModalOpen(false)}
                    taskData={{
                        ...taskData,
                        sub_batch_id: taskDetails.sub_batch_id,
                        department_sub_batch_id: taskDetails.department_sub_batch_id,
                        available_departments: taskDetails.available_departments,
                        remaining: taskDetails.remaining,
                    }}
                    onSuccess={() => {
                        setIsRejectModalOpen(false);
                        fetchTaskDetails();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}

            {isAlterationModalOpen && taskDetails && (
                <AlterationModal
                    isOpen={isAlterationModalOpen}
                    onClose={() => setIsAlterationModalOpen(false)}
                    taskData={{
                        ...taskData,
                        sub_batch_id: taskDetails.sub_batch_id,
                        department_sub_batch_id: taskDetails.department_sub_batch_id,
                        available_departments: taskDetails.available_departments,
                        remaining: taskDetails.remaining,
                    }}
                    onSuccess={() => {
                        setIsAlterationModalOpen(false);
                        fetchTaskDetails();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </>
    );
};

export default ProductionTaskDetailsModal;
