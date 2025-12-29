/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';

interface AlterationModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskData: any;
    onSuccess?: () => void;
}

const AlterationModal: React.FC<AlterationModalProps> = ({ isOpen, onClose, taskData, onSuccess }) => {
    const [quantityToAlter, setQuantityToAlter] = useState('');
    const [returnToDepartment, setReturnToDepartment] = useState('');
    const [alterationNote, setAlterationNote] = useState('');
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
        if (!quantityToAlter || parseInt(quantityToAlter) <= 0) {
            alert('Please enter a valid quantity to alter');
            return;
        }

        if (!returnToDepartment) {
            alert('Please select a department to return to');
            return;
        }

        if (!alterationNote.trim()) {
            alert('Please provide an alteration note');
            return;
        }

        // Check if quantity exceeds remaining
        const available = taskData.remaining || taskData.quantity_remaining || 0;
        if (parseInt(quantityToAlter) > available) {
            alert(`Cannot alter ${quantityToAlter} pieces!\n\nOnly ${available} pieces available.`);
            return;
        }

        try {
            setSubmitting(true);

            // Use new alteration API
            const requestBody = {
                sub_batch_id: taskData.sub_batch_id,
                from_department_id: taskData.department_id,
                return_to_department_id: parseInt(returnToDepartment),
                quantity: parseInt(quantityToAlter),
                note: alterationNote,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sub-batches/alteration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add alteration');
            }

            alert('Alteration added successfully!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to add alteration');
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
                        <Edit3 className="w-5 h-5 text-yellow-600" />
                        <h2 className="text-xl font-bold text-gray-900">Add Alteration</h2>
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
                        Record alteration for{' '}
                        <span className="font-semibold">{taskData.name || taskData.sub_batch?.name || 'this batch'}</span>
                    </p>

                    {/* Quantity to Alter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity To Alter
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={taskData.remaining || taskData.quantity_remaining || 0}
                            value={quantityToAlter}
                            onChange={(e) => setQuantityToAlter(e.target.value)}
                            placeholder="Enter quantity"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

                    {/* Alteration Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alteration Note
                        </label>
                        <textarea
                            value={alterationNote}
                            onChange={(e) => setAlterationNote(e.target.value)}
                            placeholder="Describe the alteration needed..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
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
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Adding...' : 'Add Alteration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlterationModal;
