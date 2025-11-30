"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, X, Eye, Shell, Users, MapPin, Scale, CircleDollarSign, FileText } from "lucide-react";
import Loader from "@/app/Components/Loader";

interface Worker {
    id: number;
    name: string;
    pan: string;
    address: string;
    wage_type: string;
    wage_rate: number;
}

const API = {
    create: process.env.NEXT_PUBLIC_CREATE_WORKER,
    getAll: process.env.NEXT_PUBLIC_GET_WORKERS,
    update: (id: number) => `${process.env.NEXT_PUBLIC_UPDATE_WORKER}/${id}`,
    delete: (id: number) => `${process.env.NEXT_PUBLIC_DELETE_WORKER}/${id}`,
};

const WorkerPage = () => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        pan: "",
        address: "",
        wage_type: "HOURLY",
        wage_rate_input: "",
    });

    // Fetch workers
    const fetchWorkers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(API.getAll!);
            setWorkers(res.data);
        } catch (error) {
            console.error(error);
            alert("Failed to fetch workers.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    // Form change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Add / Edit / Preview
    const handleEdit = (worker: Worker) => {
        setEditingWorker(worker);
        setFormData({
            name: worker.name,
            pan: worker.pan,
            address: worker.address,
            wage_type: worker.wage_type,
            wage_rate_input: worker.wage_rate.toString(),
        });
        setIsPreview(false);
        setIsDrawerOpen(true);
    };

    const handlePreview = (worker: Worker) => {
        setEditingWorker(worker);
        setFormData({
            name: worker.name,
            pan: worker.pan,
            address: worker.address,
            wage_type: worker.wage_type,
            wage_rate_input: worker.wage_rate.toString(),
        });
        setIsPreview(true);
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this worker?")) return;
        try {
            await axios.delete(API.delete(id));
            fetchWorkers();
            alert("Worker deleted successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to delete worker.");
        }
    };

    const handleSave = async () => {
        try {
            setSaveLoading(true);

            // Validation
            if (!formData.name.trim()) return alert("Name required");
            if (!formData.pan.trim()) return alert("PAN required");
            if (!formData.address.trim()) return alert("Address required");
            if (!formData.wage_rate_input || Number(formData.wage_rate_input) <= 0) return alert("Valid wage rate required");

            const payload = {
                name: formData.name.trim(),
                pan: formData.pan.trim(),
                address: formData.address.trim(),
                wage_type: formData.wage_type,
                wage_rate: Number(formData.wage_rate_input),
            };

            if (editingWorker) {
                await axios.put(API.update(editingWorker.id), payload);
                alert("Worker updated successfully!");
            } else {
                await axios.post(API.create!, payload);
                alert("Worker created successfully!");
            }

            fetchWorkers();
            closeDrawer();
        } catch (error) {
            console.error(error);
            alert("Failed to save worker.");
        } finally {
            setSaveLoading(false);
        }
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setEditingWorker(null);
        setIsPreview(false);
        setFormData({
            name: "",
            pan: "",
            address: "",
            wage_type: "HOURLY",
            wage_rate_input: "",
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Workers</h1>
                    <p className="text-sm text-gray-600">Manage workers, wages and details</p>
                </div>
                <button
                    className="flex items-center gap-2 bg-[#2272B4] text-white px-5 py-2.5 rounded font-semibold shadow-md hover:bg-[#0E538B] hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => { closeDrawer(); setIsDrawerOpen(true); }}
                >
                    <Plus className="w-4 h-4" /> Add Worker
                </button>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                   <div className="p-6">
                     <Loader loading={true} message="Loading Workers..." />
                   </div>
                ) : workers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <FileText size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-900 mb-2 font-medium">No workers found</p>
                        <p className="text-gray-500 text-sm">Click Add Worker to get started</p>
                    </div>
                ) : (
                    <table className="w-full min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-16">S.N.</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">PAN</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Address</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Wage Type</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Wage Rate</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {workers.map((worker, index) => (
                                <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3.5 text-sm text-gray-400">{index + 1}</td>
                                    <td className="px-4 py-3.5 text-sm text-gray-500">W{String(worker.id).padStart(3, '0')}</td>
                                    <td className="px-4 py-3.5">
                                      <span className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">{worker.name}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-sm text-gray-600">{worker.pan}</td>
                                    <td className="px-4 py-3.5 text-sm text-gray-600">{worker.address}</td>
                                    <td className="px-4 py-3.5 text-sm text-gray-600">{worker.wage_type}</td>
                                    <td className="px-4 py-3.5 text-sm text-gray-600">{worker.wage_rate}</td>
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handlePreview(worker)}
                                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                title="Preview"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(worker)}
                                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(worker.id)}
                                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-white/30 transition-opacity duration-300"
                        style={{ backdropFilter: 'blur(4px)' }}
                        onClick={closeDrawer}
                    />

                    {/* Drawer */}
                    <div className="ml-auto w-full max-w-xl bg-white shadow-lg p-4 relative h-screen overflow-y-auto">
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                            onClick={closeDrawer}
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="border-b border-gray-200 pb-3 mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex gap-2 items-center">
                                <Shell size={20} className="text-blue-600" />
                                {isPreview ? "Worker Details" : editingWorker ? "Edit Worker" : "Add New Worker"}
                            </h3>
                        </div>

                        {/* Worker ID */}
                        {editingWorker && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Worker ID
                                </label>
                                <input
                                    type="text"
                                    value={`WR${editingWorker.id}`}
                                    readOnly
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 cursor-not-allowed text-sm text-gray-600"
                                />
                            </div>
                        )}

                        {/* Flex grid for inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter worker name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* PAN */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    PAN <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="pan"
                                    placeholder="Enter PAN number"
                                    value={formData.pan}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Address */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Enter address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Wage Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Wage Type
                                </label>
                                <select
                                    name="wage_type"
                                    value={formData.wage_type}
                                    onChange={handleChange}
                                    disabled={isPreview}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="HOURLY">HOURLY</option>
                                    <option value="SALARY">SALARY</option>
                                </select>
                            </div>

                            {/* Wage Rate */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Wage Rate <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="wage_rate_input"
                                    placeholder="Enter wage rate"
                                    value={formData.wage_rate_input}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                            <button
                                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                onClick={closeDrawer}
                            >
                                {isPreview ? "Close" : "Cancel"}
                            </button>
                            {!isPreview && (
                                <button
                                    className="px-6 py-2 rounded bg-[#2272B4] text-white hover:bg-[#0E538B] disabled:opacity-50 font-medium transition-colors shadow-sm"
                                    onClick={handleSave}
                                    disabled={saveLoading}
                                >
                                    {saveLoading ? "Saving..." : editingWorker ? "Update Worker" : "Save Worker"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default WorkerPage;
