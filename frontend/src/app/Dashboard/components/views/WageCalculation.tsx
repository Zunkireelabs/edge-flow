"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";
import Loader from "@/app/Components/Loader";
import NepaliDatePicker from "@/app/Components/NepaliDatePicker";

interface Worker {
  id: number;
  name: string;
}

interface WageDetail {
  id: string;
  date: string;
  size: string;
  particulars: string;
  quantity_worked: number;
  unit_price: number;
  total: number;
  is_billable: boolean;
}

const WageCalculation = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [wageDetails, setWageDetails] = useState<WageDetail[]>([]);
  const [totalWage, setTotalWage] = useState<number>(0);

  // Fetch all workers on component mount
  const fetchWorkers = useCallback(async () => {
    try {
      const res = await axios.get(process.env.NEXT_PUBLIC_GET_WORKERS!);
      setWorkers(res.data);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
      alert("Failed to fetch workers.");
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Calculate total wage whenever wageDetails change (only billable)
  useEffect(() => {
    const total = wageDetails
      .filter(detail => detail.is_billable)
      .reduce((sum, detail) => sum + detail.total, 0);
    setTotalWage(total);
  }, [wageDetails]);

  // Handle submit - fetch wage data from API
  const handleSubmit = async () => {
    if (!selectedWorkerId) {
      alert("Please select a worker.");
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/wages/worker/${selectedWorkerId}?${params.toString()}`
      );

      const { detailed_logs } = response.data;

      interface DetailedLog {
        id: number;
        work_date?: string;
        particulars?: string;
        sub_batch_name?: string;
        quantity_worked?: number;
        unit_price?: number;
        amount?: number;
        is_billable?: boolean;
      }

      // Transform API data to table format (showing all logs)
      const transformedData: WageDetail[] = detailed_logs.map((log: DetailedLog) => ({
        id: log.id.toString(),
        date: log.work_date ? new Date(log.work_date).toLocaleDateString("en-US") : "",
        size: "XL", // Placeholder - adjust based on your actual data structure
        particulars: log.particulars || log.sub_batch_name || "",
        quantity_worked: log.quantity_worked || 0,
        unit_price: log.unit_price || 0,
        total: log.amount || 0,
        is_billable: log.is_billable ?? false,
      }));

      setWageDetails(transformedData);
    } catch (error) {
      console.error("Failed to fetch wage details:", error);
      alert("Failed to fetch wage details.");
    } finally {
      setLoading(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setSelectedWorkerId("");
    setStartDate("");
    setEndDate("");
    setWageDetails([]);
    setTotalWage(0);
  };

  // Add new row
  const handleAddRow = () => {
    const newRow: WageDetail = {
      id: `temp-${Date.now()}`,
      date: new Date().toLocaleDateString("en-US"),
      size: "",
      particulars: "",
      quantity_worked: 0,
      unit_price: 0,
      total: 0,
      is_billable: true,
    };
    setWageDetails([...wageDetails, newRow]);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setWageDetails(wageDetails.filter((detail) => detail.id !== id));
  };

  // Handle edit - inline editing
  const handleEdit = (id: string, field: keyof WageDetail, value: string | number) => {
    setWageDetails((prev) =>
      prev.map((detail) => {
        if (detail.id === id) {
          const updated = { ...detail, [field]: value };
          // Recalculate total when quantity_worked or unit_price changes
          if (field === "quantity_worked" || field === "unit_price") {
            updated.total = updated.quantity_worked * updated.unit_price;
          }
          return updated;
        }
        return detail;
      })
    );
  };

  return (
    <div className="p-6 bg-white min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wage Management</h1>
        <p className="text-sm text-gray-500">Manage worker wages and track payment records</p>
      </div>

      {/* Filter Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Worker Name Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Worker Name
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Worker</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <NepaliDatePicker
              value={startDate}
              onChange={(value) => setStartDate(value)}
              disabled={loading}
              placeholder="Select Start Date"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <NepaliDatePicker
              value={endDate}
              onChange={(value) => setEndDate(value)}
              disabled={loading}
              placeholder="Select End Date"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Wage Details Section */}
      <div className="bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Wage Details</h2>
          <button
            onClick={handleAddRow}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm font-bold border-1 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: '#4880FF', borderColor: '#4880FF' }}
          >
            + Add Row
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#374151' }}>
                  DATE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#374151' }}>
                  SIZE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#374151' }}>
                  PARTICULARS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#374151' }}>
                  QUANTITY WORKED
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#374151' }}>
                  UNIT PRICE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#374151' }}>
                  TOTAL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#374151' }}>
                  STATUS
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12">
                    <Loader />
                  </td>
                </tr>
              ) : wageDetails.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No wage details available. Select a worker and click Submit.
                  </td>
                </tr>
              ) : (
                wageDetails.map((detail) => (
                  <tr
                    key={detail.id}
                    className={`hover:bg-gray-50 ${!detail.is_billable ? 'bg-gray-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">{detail.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <input
                        type="text"
                        value={detail.size}
                        onChange={(e) => handleEdit(detail.id, "size", e.target.value)}
                        className="w-full px-2 py-1 bg-transparent focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <input
                        type="text"
                        value={detail.particulars}
                        onChange={(e) => handleEdit(detail.id, "particulars", e.target.value)}
                        className="w-full px-2 py-1 bg-transparent focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <input
                        type="number"
                        value={detail.quantity_worked}
                        onChange={(e) =>
                          handleEdit(detail.id, "quantity_worked", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 bg-transparent focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <input
                        type="number"
                        value={detail.unit_price}
                        onChange={(e) =>
                          handleEdit(detail.id, "unit_price", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 bg-transparent focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {detail.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          detail.is_billable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {detail.is_billable ? 'Billable' : 'Non-Billable'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteRow(detail.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total Wage */}
        {wageDetails.length > 0 && !loading && (
          <div className="mt-4 flex justify-end items-center gap-2 text-sm">
            <span className="text-gray-600">Total Wage:</span>
            <span className="text-blue-600 font-semibold text-lg">{totalWage.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WageCalculation;
