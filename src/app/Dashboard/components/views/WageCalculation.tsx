"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  DollarSign, Users, TrendingDown, Award,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowUpDown, Download,
  Check, Search, ArrowLeft, X
} from "lucide-react";
import Loader from "@/app/Components/Loader";
import NepaliDatePicker from "@/app/Components/NepaliDatePicker";
import { useToast } from "@/app/Components/ToastContext";

// Interfaces
interface FilterOption {
  value: string;
  label: string;
  description?: string;
}

interface WorkerWageSummary {
  worker_id: number;
  worker_name: string;
  total_billable_wages: number;
  total_non_billable_wages: number;
  total_quantity_worked: number;
  billable_quantity: number;
  non_billable_quantity: number;
  total_entries: number;
  billable_entries: number;
  non_billable_entries: number;
}

interface DetailedWageLog {
  id: number;
  work_date: string;
  sub_batch_name: string;
  quantity_worked: number;
  unit_price: number;
  amount: number;
  is_billable: boolean;
  activity_type: string | null;
  particulars: string | null;
}

interface Department {
  id: number;
  name: string;
}

// Custom Filter Dropdown Component
const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
  searchable = true,
  icon,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  icon?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || label;

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isActive = value !== "all";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-all duration-200 ${
          isActive
            ? "border-[#2272B4] bg-blue-50 text-[#2272B4]"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
        }`}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="max-w-[150px] truncate">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" />
          {searchable && (
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2272B4] focus:border-transparent"
                />
              </div>
            </div>
          )}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                    value === option.value ? "bg-blue-50" : ""
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    value === option.value ? "border-[#2272B4] bg-[#2272B4]" : "border-gray-300"
                  }`}>
                    {value === option.value && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${value === option.value ? "text-[#2272B4]" : "text-gray-900"}`}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const WageCalculation = () => {
  const { showToast } = useToast();

  // View state
  const [activeView, setActiveView] = useState<'all' | 'detail'>('all');
  const [selectedWorkerForDetail, setSelectedWorkerForDetail] = useState<WorkerWageSummary | null>(null);

  // Data states
  const [allWorkersWages, setAllWorkersWages] = useState<WorkerWageSummary[]>([]);
  const [workerDetailedLogs, setWorkerDetailedLogs] = useState<DetailedWageLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Dashboard summary
  const [dashboardStats, setDashboardStats] = useState({
    totalBillableWages: 0,
    totalNonBillableWages: 0,
    totalWorkers: 0,
    topEarner: null as WorkerWageSummary | null,
  });

  // Filter states (HubSpot-style)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>("total_billable_wages");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/departments`);
      setDepartments(res.data);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  }, [API]);

  // Helper to check if date is Nepali (year > 2050)
  const isNepaliDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const year = parseInt(dateStr.split('-')[0]);
    return year > 2050; // Nepali years are 2080+, Gregorian are 2024+
  };

  // Convert Nepali date to approximate Gregorian date for API filtering
  // Note: This is a rough conversion (-57 years) for filtering purposes
  // The backend now stores dates correctly, but old data may still have wrong dates
  const convertNepaliToGregorianForFilter = (nepaliDateStr: string): string => {
    if (!nepaliDateStr || !isNepaliDate(nepaliDateStr)) return nepaliDateStr;
    const [year, month, day] = nepaliDateStr.split('-');
    const gregorianYear = parseInt(year) - 57; // Approximate conversion
    return `${gregorianYear}-${month}-${day}`;
  };

  // Fetch all workers wages
  const fetchAllWorkersWages = useCallback(async (deptFilter?: string, start?: string, end?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const dept = deptFilter ?? selectedDepartment;
      const startD = start ?? startDate;
      const endD = end ?? endDate;

      // Convert Nepali dates to Gregorian for API filtering
      // Backend now stores dates correctly, but we convert here for filtering
      if (startD) {
        const convertedStart = convertNepaliToGregorianForFilter(startD);
        params.append('start_date', convertedStart);
      }
      if (endD) {
        const convertedEnd = convertNepaliToGregorianForFilter(endD);
        params.append('end_date', convertedEnd);
      }

      if (dept !== 'all') params.append('department_id', dept);

      const url = `${API}/wages/all?${params.toString()}`;
      console.log('Fetching wages from:', url);

      const response = await axios.get(url);
      console.log('Wages API response:', response.data);

      const data: WorkerWageSummary[] = response.data;
      setAllWorkersWages(data);

      // Calculate dashboard stats
      const totalBillable = data.reduce((sum, w) => sum + w.total_billable_wages, 0);
      const totalNonBillable = data.reduce((sum, w) => sum + w.total_non_billable_wages, 0);
      const topEarner = data.length > 0 ? data.reduce((max, w) =>
        w.total_billable_wages > max.total_billable_wages ? w : max
      , data[0]) : null;

      setDashboardStats({
        totalBillableWages: totalBillable,
        totalNonBillableWages: totalNonBillable,
        totalWorkers: data.length,
        topEarner,
      });
    } catch (error) {
      console.error("Failed to fetch wages:", error);
      showToast("error", "Failed to fetch wages data. Please try again.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, showToast]);

  // Fetch worker detailed logs
  const fetchWorkerDetails = useCallback(async (workerId: number) => {
    setDetailLoading(true);
    try {
      const params = new URLSearchParams();
      // Only send dates if they're valid Gregorian dates (not Nepali)
      if (startDate && !isNepaliDate(startDate)) params.append('start_date', startDate);
      if (endDate && !isNepaliDate(endDate)) params.append('end_date', endDate);

      const response = await axios.get(
        `${API}/wages/worker/${workerId}?${params.toString()}`
      );

      setWorkerDetailedLogs(response.data.detailed_logs || []);
    } catch (error) {
      console.error("Failed to fetch worker details:", error);
      showToast("error", "Failed to fetch worker details.");
    } finally {
      setDetailLoading(false);
    }
  }, [API, startDate, endDate, showToast]);

  // Initial load - fetch departments and wages (no filters)
  useEffect(() => {
    fetchDepartments();
    fetchAllWorkersWages('all', '', '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter, sort, and paginate data
  const { paginatedData, totalPages, totalFiltered } = useMemo(() => {
    // Step 1: Sort
    const sorted = [...allWorkersWages].sort((a, b) => {
      const aVal = a[sortColumn as keyof WorkerWageSummary];
      const bVal = b[sortColumn as keyof WorkerWageSummary];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === "asc" ? -1 : 1;
      if (bVal == null) return sortDirection === "asc" ? 1 : -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // Step 2: Paginate
    const totalFiltered = sorted.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

    return { paginatedData: paginated, totalPages, totalFiltered };
  }, [allWorkersWages, sortColumn, sortDirection, currentPage, itemsPerPage]);

  // Handle sort column click
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Handle row click
  const handleRowClick = (worker: WorkerWageSummary) => {
    setSelectedWorkerForDetail(worker);
    setActiveView('detail');
    fetchWorkerDetails(worker.worker_id);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedDepartment("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    // Fetch with no filters
    fetchAllWorkersWages('all', '', '');
  };

  // Check if any filters are active
  const hasActiveFilters = selectedDepartment !== "all" || startDate !== "" || endDate !== "";

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Worker ID', 'Worker Name', 'Billable Wages', 'Non-Billable Wages', 'Total Quantity', 'Billable Qty', 'Non-Billable Qty', 'Entries'];
    const csvContent = [
      headers.join(','),
      ...allWorkersWages.map(w => [
        w.worker_id,
        `"${w.worker_name}"`,
        w.total_billable_wages.toFixed(2),
        w.total_non_billable_wages.toFixed(2),
        w.total_quantity_worked,
        w.billable_quantity,
        w.non_billable_quantity,
        w.total_entries
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wage_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showToast("success", "Wage report exported successfully!");
  };

  // Apply filters
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchAllWorkersWages(selectedDepartment, startDate, endDate);
  };

  // Sort options
  const sortOptions: FilterOption[] = [
    { value: "total_billable_wages", label: "Billable Wages (High to Low)", description: "Sort by billable wages descending" },
    { value: "worker_name", label: "Worker Name (A-Z)", description: "Sort alphabetically by name" },
    { value: "total_quantity_worked", label: "Quantity Worked", description: "Sort by total quantity" },
    { value: "total_entries", label: "Number of Entries", description: "Sort by entry count" },
  ];

  // Department options
  const departmentOptions: FilterOption[] = [
    { value: "all", label: "All Departments", description: "Show all workers" },
    ...departments.map(d => ({ value: d.id.toString(), label: d.name }))
  ];

  return (
    <div className="p-6 bg-white min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wage Management</h1>
        <p className="text-sm text-gray-500">View and manage worker wages across all departments</p>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Total Billable Wages Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Billable Wages</p>
              <p className="text-xl font-bold text-gray-900">
                Rs. {dashboardStats.totalBillableWages.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Total Workers Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Workers</p>
              <p className="text-xl font-bold text-gray-900">
                {dashboardStats.totalWorkers}
              </p>
            </div>
          </div>
        </div>

        {/* Non-Billable Wages Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Non-Billable Wages</p>
              <p className="text-xl font-bold text-gray-900">
                Rs. {dashboardStats.totalNonBillableWages.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Top Earner Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Top Earner</p>
              <p className="text-lg font-bold text-gray-900 truncate max-w-[150px]">
                {dashboardStats.topEarner?.worker_name || '-'}
              </p>
              {dashboardStats.topEarner && (
                <p className="text-xs text-gray-500">
                  Rs. {dashboardStats.topEarner.total_billable_wages.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => { setActiveView('all'); setSelectedWorkerForDetail(null); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeView === 'all'
              ? 'text-[#2272B4] border-b-2 border-[#2272B4]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Workers
        </button>
        {selectedWorkerForDetail && (
          <button
            onClick={() => setActiveView('detail')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeView === 'detail'
                ? 'text-[#2272B4] border-b-2 border-[#2272B4]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {selectedWorkerForDetail.worker_name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedWorkerForDetail(null);
                setActiveView('all');
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </button>
        )}
      </div>

      {activeView === 'all' ? (
        <>
          {/* HubSpot-style Filter Bar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <FilterDropdown
              label="All Departments"
              options={departmentOptions}
              value={selectedDepartment}
              onChange={(val) => { setSelectedDepartment(val); setCurrentPage(1); }}
            />

            {/* Date Range - HubSpot style compact */}
            <div className="flex items-center gap-2">
              <NepaliDatePicker
                value={startDate}
                onChange={(value) => setStartDate(value)}
                placeholder="Start"
                className="w-[120px]"
              />
              <span className="text-gray-400 text-sm">to</span>
              <NepaliDatePicker
                value={endDate}
                onChange={(value) => setEndDate(value)}
                placeholder="End"
                className="w-[120px]"
              />
            </div>

            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm bg-[#2272B4] text-white rounded-md hover:bg-[#1b5a8a] transition-colors"
            >
              Apply
            </button>

            <FilterDropdown
              label="Sort By"
              icon={<ArrowUpDown className="w-4 h-4" />}
              options={sortOptions}
              value={sortColumn}
              onChange={(val) => { setSortColumn(val); setSortDirection("desc"); setCurrentPage(1); }}
              searchable={false}
            />

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            )}

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={loading || allWorkersWages.length === 0}
              className="ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-[#2272B4] text-white rounded-md hover:bg-[#1b5a8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <span className="text-sm text-gray-500">{totalFiltered} workers</span>
          </div>

          {/* Data Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('worker_name')}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Worker Name
                      {sortColumn === 'worker_name' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('total_billable_wages')}
                    className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Billable Wages
                      {sortColumn === 'total_billable_wages' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('total_non_billable_wages')}
                    className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Non-Billable
                      {sortColumn === 'total_non_billable_wages' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('total_quantity_worked')}
                    className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Qty Worked
                      {sortColumn === 'total_quantity_worked' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('total_entries')}
                    className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Entries
                      {sortColumn === 'total_entries' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12">
                      <Loader />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No wage data available. Try adjusting filters or date range.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((worker) => (
                    <tr
                      key={worker.worker_id}
                      onClick={() => handleRowClick(worker)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {worker.worker_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-green-600 font-medium">
                        Rs. {worker.total_billable_wages.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-red-500">
                        Rs. {worker.total_non_billable_wages.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">
                        {worker.total_quantity_worked.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-500">
                        {worker.total_entries}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && paginatedData.length > 0 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalFiltered)} of {totalFiltered}
              </span>

              <div className="flex items-center gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">per page</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2272B4]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Worker Detail View */
        <div>
          {/* Back button and worker info header */}
          <div className="mb-6">
            <button
              onClick={() => { setActiveView('all'); }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all workers
            </button>

            {selectedWorkerForDetail && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  {selectedWorkerForDetail.worker_name}
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Billable Wages</p>
                    <p className="text-lg font-bold text-green-600">
                      Rs. {selectedWorkerForDetail.total_billable_wages.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Non-Billable</p>
                    <p className="text-lg font-bold text-red-500">
                      Rs. {selectedWorkerForDetail.total_non_billable_wages.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Total Quantity</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedWorkerForDetail.total_quantity_worked.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Total Entries</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedWorkerForDetail.total_entries}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Logs Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Work Log Details</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Batch</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Particulars</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detailLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      <Loader />
                    </td>
                  </tr>
                ) : workerDetailedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No work logs found for this worker in the selected date range.
                    </td>
                  </tr>
                ) : (
                  workerDetailedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`${!log.is_billable ? 'bg-gray-50' : ''} hover:bg-gray-100`}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {log.work_date ? new Date(log.work_date).toLocaleDateString('en-US') : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{log.sub_batch_name || '-'}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.activity_type === 'NORMAL' ? 'bg-blue-100 text-blue-800' :
                          log.activity_type === 'ALTERED' ? 'bg-amber-100 text-amber-800' :
                          log.activity_type === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.activity_type || 'NORMAL'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{log.particulars || '-'}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">{log.quantity_worked}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">Rs. {log.unit_price}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                        Rs. {log.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.is_billable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.is_billable ? 'Billable' : 'Non-Billable'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WageCalculation;
