import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import NepaliDatePicker from '@/app/Components/NepaliDatePicker';
import { useToast } from '@/app/Components/ToastContext';

interface Worker {
    id: number;
    name: string;
}

interface WorkerData {
    workerId: number;
    workerName: string | undefined;
    quantity: number;
    date: string;
    taskId: number;
}

interface AssignAlteredWorkerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workerData: WorkerData) => void;
    alteredQuantity: number;
    taskId: number;
}

const AssignAlteredWorkerModal: React.FC<AssignAlteredWorkerModalProps> = ({
    isOpen,
    onClose,
    onSave,
    alteredQuantity,
    taskId
}) => {
    const { showToast } = useToast();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<number>(0);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchWorkers();
        }
    }, [isOpen]);

    const fetchWorkers = async () => {
        setLoading(true);
        try {
            // API call to fetch available workers
            // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workers`);
            // const data = await response.json();
            // setWorkers(data);

            // Mock data for now
            setWorkers([
                { id: 1, name: 'Ram' },
                { id: 2, name: 'Shyam' },
                { id: 3, name: 'Hari' }
            ]);
        } catch (error) {
            console.error('Error fetching workers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (!selectedWorkerId || !quantity || quantity <= 0) {
            showToast('warning', 'Please select a worker and enter a valid quantity');
            return;
        }

        if (quantity > alteredQuantity) {
            showToast('error', `Quantity cannot exceed altered quantity (${alteredQuantity})`);
            return;
        }

        const selectedWorker = workers.find(w => w.id === selectedWorkerId);

        onSave({
            workerId: selectedWorkerId,
            workerName: selectedWorker?.name,
            quantity,
            date,
            taskId
        });

        // Reset form
        setSelectedWorkerId(null);
        setQuantity(0);
        setDate(new Date().toISOString().split('T')[0]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold">Assign Worker to Altered Batch</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Info Banner */}
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
                            <strong>Altered Quantity:</strong> {alteredQuantity.toLocaleString()} pieces
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                            Assign workers to rework this altered batch
                        </p>
                    </div>

                    {/* Worker Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Worker <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedWorkerId || ''}
                            onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            <option value="">Select a worker</option>
                            {workers.map(worker => (
                                <option key={worker.id} value={worker.id}>
                                    {worker.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Quantity to Assign <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            min={1}
                            max={alteredQuantity}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter quantity"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum: {alteredQuantity.toLocaleString()} pieces
                        </p>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Assignment Date <span className="text-red-500">*</span>
                        </label>
                        <NepaliDatePicker
                            value={date}
                            onChange={(value) => setDate(value)}
                            placeholder="Select Date"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedWorkerId || !quantity || quantity <= 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Assign Worker
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignAlteredWorkerModal;
