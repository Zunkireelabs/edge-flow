/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskData: any;
    onSuccess?: () => void;
}

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, taskData, onSuccess }) => {
    const [quantityToReject, setQuantityToReject] = useState('');
    const [returnToDepartment, setReturnToDepartment] = useState('');
    const [reason, setReason] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Use departments from taskData (passed from task details API)
    useEffect(() => {
        if (isOpen && taskData?.available_departments) {
            setDepartments(taskData.available_departments);
        }
    }, [isOpen, taskData]);

    // Handle submit
    const handleSubmit = async () => {
        // Validation
        if (!quantityToReject || parseInt(quantityToReject) <= 0) {
            alert('Please enter a valid quantity to reject');
            return;
        }

        if (!returnToDepartment) {
            alert('Please select a department to return to');
            return;
        }

        if (!reason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        // Check if quantity exceeds remaining
        const available = taskData.remaining || taskData.quantity_remaining || 0;
        if (parseInt(quantityToReject) > available) {
            alert(`Cannot reject ${quantityToReject} pieces!\n\nOnly ${available} pieces available.`);
            return;
        }

        try {
            setSubmitting(true);

            // Use new rejection API
            const requestBody = {
                sub_batch_id: taskData.sub_batch_id,
                from_department_id: taskData.department_id,
                return_to_department_id: parseInt(returnToDepartment),
                quantity: parseInt(quantityToReject),
                reason: reason,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sub-batches/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reject pieces');
            }

            alert('Pieces rejected successfully!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to reject pieces');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="text-xl font-bold text-gray-900">Confirm Rejection</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        You are about to reject pieces of{' '}
                        <span className="font-semibold">{taskData.name || taskData.sub_batch?.name || 'this batch'}</span>{' '}
                        and return them to another department.
                    </p>

                    {/* Quantity to Reject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity To Reject
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={taskData.remaining || taskData.quantity_remaining || 0}
                            value={quantityToReject}
                            onChange={(e) => setQuantityToReject(e.target.value)}
                            placeholder="Enter quantity"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Available: {taskData.remaining || taskData.quantity_remaining || 0} pieces
                        </p>
                    </div>

                    {/* Return To Department */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Return To Department
                        </label>
                        {loading ? (
                            <div className="text-sm text-gray-500">Loading departments...</div>
                        ) : (
                            <select
                                value={returnToDepartment}
                                onChange={(e) => setReturnToDepartment(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept: any) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Reason for Rejection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Rejection
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Rejection Reason..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Rejecting...' : 'Reject & Return'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectModal;
