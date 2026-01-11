"use client";

import React, { useState, useEffect } from "react";
import { PackageOpen, Clock, CheckCircle2, Users2, Building2, Zap, ClipboardList, FileBarChart } from "lucide-react";
import axios from "axios";
import { useDepartment } from "../../contexts/DepartmentContext";

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, description, icon }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { selectedDepartmentId, isSuperSupervisor, departments } = useDepartment();
  const [stats, setStats] = useState({
    newArrivals: 0,
    inProgress: 0,
    completed: 0,
    activeWorkers: 0
  });
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedDepartmentId = localStorage.getItem("departmentId");

        if (!token) return;

        // Determine which department(s) to fetch
        const targetDeptId = isSuperSupervisor
          ? (typeof selectedDepartmentId === 'number' ? selectedDepartmentId : null)
          : storedDepartmentId;

        // For SUPER_SUPERVISOR with "all" selected - aggregate across all departments
        if (isSuperSupervisor && selectedDepartmentId === "all") {
          let totalNewArrivals = 0;
          let totalInProgress = 0;
          let totalCompleted = 0;
          let totalWorkers = 0;

          // Fetch stats from all departments
          const departmentPromises = departments.map(async (dept) => {
            try {
              const kanbanResponse = await axios.get(
                `${API}/departments/${dept.id}/sub-batches`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const kanbanData = kanbanResponse.data.data;

              const workersResponse = await axios.get(
                `${API}/workers/department/${dept.id}`
              );

              return {
                newArrivals: kanbanData?.newArrival?.length || 0,
                inProgress: kanbanData?.inProgress?.length || 0,
                completed: kanbanData?.completed?.length || 0,
                workers: workersResponse.data?.length || 0
              };
            } catch {
              return { newArrivals: 0, inProgress: 0, completed: 0, workers: 0 };
            }
          });

          const results = await Promise.all(departmentPromises);
          results.forEach(result => {
            totalNewArrivals += result.newArrivals;
            totalInProgress += result.inProgress;
            totalCompleted += result.completed;
            totalWorkers += result.workers;
          });

          setStats({
            newArrivals: totalNewArrivals,
            inProgress: totalInProgress,
            completed: totalCompleted,
            activeWorkers: totalWorkers
          });
        } else if (targetDeptId) {
          // Fetch kanban data for specific department
          const kanbanResponse = await axios.get(
            `${API}/departments/${targetDeptId}/sub-batches`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const kanbanData = kanbanResponse.data.data;

          // Fetch workers for this department
          const workersResponse = await axios.get(
            `${API}/workers/department/${targetDeptId}`
          );

          setStats({
            newArrivals: kanbanData?.newArrival?.length || 0,
            inProgress: kanbanData?.inProgress?.length || 0,
            completed: kanbanData?.completed?.length || 0,
            activeWorkers: workersResponse.data?.length || 0
          });
        }
      } catch {
        // Error fetching dashboard stats
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API, isSuperSupervisor, selectedDepartmentId, departments]);

  // Get department name for display
  const getDepartmentLabel = () => {
    if (isSuperSupervisor) {
      if (selectedDepartmentId === "all") {
        return "All Departments";
      }
      const dept = departments.find(d => d.id === selectedDepartmentId);
      return dept?.name || "Selected Department";
    }
    return "your department";
  };

  const statCards = [
    {
      title: "New Arrivals",
      value: loading ? "..." : stats.newArrivals,
      description: "Tasks awaiting assignment",
      icon: <PackageOpen className="w-6 h-6" />,
    },
    {
      title: "In Progress",
      value: loading ? "..." : stats.inProgress,
      description: "Currently being worked on",
      icon: <Clock className="w-6 h-6" />,
    },
    {
      title: "Completed",
      value: loading ? "..." : stats.completed,
      description: "Tasks finished this week",
      icon: <CheckCircle2 className="w-6 h-6" />,
    },
    {
      title: "Active Workers",
      value: loading ? "..." : stats.activeWorkers,
      description: isSuperSupervisor && selectedDepartmentId === "all"
        ? "Workers across all departments"
        : "Workers in your department",
      icon: <Users2 className="w-6 h-6" />,
    }
  ];

  const quickActions = [
    {
      title: "View Department Tasks",
      description: "Manage task assignments",
      icon: <ClipboardList className="w-6 h-6" />,
      gradient: "from-emerald-50 to-teal-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Manage Workers",
      description: "View and assign workers",
      icon: <Users2 className="w-6 h-6" />,
      gradient: "from-blue-50 to-indigo-100",
      iconColor: "text-blue-600",
    },
    {
      title: "View Sub-Batches",
      description: "Track production batches",
      icon: <PackageOpen className="w-6 h-6" />,
      gradient: "from-violet-50 to-purple-100",
      iconColor: "text-violet-600",
    },
    {
      title: "View Reports",
      description: "Production analytics",
      icon: <FileBarChart className="w-6 h-6" />,
      gradient: "from-amber-50 to-orange-100",
      iconColor: "text-amber-600",
    }
  ];

  return (
    <div className="p-6 bg-[#ffffff] min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">
          {isSuperSupervisor && selectedDepartmentId === "all"
            ? "Aggregated production stats across all departments"
            : `Monitor ${getDepartmentLabel()}'s production progress and team performance`
          }
        </p>
      </div>

      {/* All Departments Banner for SUPER_SUPERVISOR */}
      {isSuperSupervisor && selectedDepartmentId === "all" && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">Viewing All Departments</p>
            <p className="text-xs text-blue-700">Stats shown are aggregated across {departments.length} departments</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
          <Zap className="w-4 h-4 text-gray-400" />
        </div>

        {/* Actions Grid - 2x2 layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className={`bg-gradient-to-br ${action.gradient} rounded-lg p-4 text-left border border-gray-100 hover:border-gray-200 transition-all hover:shadow-sm`}
            >
              <div className={`mb-2 ${action.iconColor}`}>
                {action.icon}
              </div>
              <h4 className="font-medium text-sm text-gray-900 mb-0.5">{action.title}</h4>
              <p className="text-xs text-gray-500">{action.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
