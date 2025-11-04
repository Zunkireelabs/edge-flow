"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, X, MoreVertical, Eye, Shell, Users, MapPin, Scale, CircleDollarSign, FileText } from "lucide-react";
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
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
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
        setOpenMenuId(null);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Workers</h2>
                    <p className="text-gray-500 text-sm">Manage workers, wages and details</p>
                </div>
                <button
                    className="flex items-center gap-2 bg-[#6B98FF] text-white px-4 py-2 rounded-[10px] hover:bg-blue-700"
                    onClick={() => { closeDrawer(); setIsDrawerOpen(true); }}
                >
                    <Plus size={16} /> Add Worker
                </button>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-lg shadow border-gray-200 p-6 flex flex-col gap-4 mb-8">
                {loading ? (
                   <Loader loading={true} message="Loading Workers..." />
                ) : workers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <FileText size={48} className="text-gray-300 mb-4" />
                        <p className="text-black mb-2 font-medium">No workers found</p>
                        <p className="text-gray-500 mb-2 font-medium">Click Add Worker to get started</p>
                    </div>
                ) : (
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 text-left">S.N.</th>
                                <th className="p-2 text-left">ID</th>
                                <th className="p-2 text-left">Name</th>
                                <th className="p-2 text-left">PAN</th>
                                <th className="p-2 text-left">Address</th>
                                <th className="p-2 text-left">Wage Type</th>
                                <th className="p-2 text-left">Wage Rate</th>
                                <th className="p-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workers.map((worker, index) => (
                                <tr key={worker.id} className="border-b border-gray-200 ">
                                    <td className="p-2 bg-gray-50">{index + 1}</td>
                                    <td className="p-2 bg-gray-50">WR{worker.id}</td>
                                    <td className="p-2 bg-gray-50">{worker.name}</td>
                                    <td className="p-2 bg-gray-50">{worker.pan}</td>
                                    <td className="p-2 bg-gray-50">{worker.address}</td>
                                    <td className="p-2 bg-gray-50">{worker.wage_type}</td>
                                    <td className="p-2 bg-gray-50">{worker.wage_rate}</td>
                                    <td className="p-2 flex justify-center relative">
                                        <button
                                            className="p-1 rounded hover:bg-gray-100"
                                            onClick={() => setOpenMenuId(openMenuId === worker.id ? null : worker.id)}
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        {openMenuId === worker.id && (
                                            <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded shadow-lg z-50">
                                                <button className="w-full px-4 py-2 hover:bg-gray-100 flex items-center gap-2" onClick={() => { setOpenMenuId(null); handlePreview(worker); }}>
                                                    <Eye size={14} /> Preview
                                                </button>
                                                <button className="w-full px-4 py-2 hover:bg-gray-100 flex items-center gap-2" onClick={() => { setOpenMenuId(null); handleEdit(worker); }}>
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                                <button className="w-full px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-500" onClick={() => { setOpenMenuId(null); handleDelete(worker.id); }}>
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
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
                    <div className="absolute inset-0 bg-black/30" onClick={closeDrawer} />

                    {/* Drawer */}
                    <div className="ml-auto w-full max-w-md bg-white shadow-lg p-6 relative rounded-[25px] max-h-[90vh] overflow-y-auto">
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            onClick={closeDrawer}
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-lg font-semibold mb-4 flex gap-2 items-center">
                            <Shell size={20} />
                            {isPreview ? "Worker Preview" : editingWorker ? "Edit Worker" : "Add New Worker"}
                        </h3>

                        {/* Worker ID */}
                        {editingWorker && (
                            <input
                                type="text"
                                value={`WR${editingWorker.id}`}
                                readOnly
                                className="w-full border border-gray-300 rounded-[10px] px-3 py-2 bg-gray-100 cursor-not-allowed mb-4"
                            />
                        )}

                        {/* Flex grid for inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="flex flex-col">
                                <label className="flex items-center gap-2 font-semibold">
                                    <Users size={16} /> Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="border rounded px-2 py-1"
                                />
                            </div>

                            {/* PAN */}
                            <div className="flex flex-col">
                                <label className="flex items-center gap-2 font-semibold">
                                    <FileText size={16} /> PAN *
                                </label>
                                <input
                                    type="text"
                                    name="pan"
                                    value={formData.pan}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="border rounded px-2 py-1"
                                />
                            </div>

                            {/* Address */}
                            <div className="flex flex-col sm:col-span-2">
                                <label className="flex items-center gap-2 font-semibold">
                                    <MapPin size={16} /> Address *
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="border rounded px-2 py-1"
                                />
                            </div>

                            {/* Wage Type */}
                            <div className="flex flex-col">
                                <label className="flex items-center gap-2 font-semibold">
                                    <Scale size={16} /> Wage Type
                                </label>
                                <select
                                    name="wage_type"
                                    value={formData.wage_type}
                                    onChange={handleChange}
                                    disabled={isPreview}
                                    className="border rounded px-2 py-1"
                                >
                                    <option value="HOURLY">HOURLY</option>
                                    <option value="SALARY">SALARY</option>
                                </select>
                            </div>

                            {/* Wage Rate */}
                            <div className="flex flex-col">
                                <label className="flex items-center gap-2 font-semibold">
                                    <CircleDollarSign size={16} /> Wage Rate
                                </label>
                                <input
                                    type="number"
                                    name="wage_rate_input"
                                    value={formData.wage_rate_input}
                                    onChange={handleChange}
                                    readOnly={isPreview}
                                    className="border rounded px-2 py-1"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-2 mt-6 sticky bottom-0 bg-white pt-4">
                            <button
                                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                                onClick={closeDrawer}
                            >
                                {isPreview ? "Close" : "Cancel"}
                            </button>
                            {!isPreview && (
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
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
