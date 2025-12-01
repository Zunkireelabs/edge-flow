"use client";

import React, { useState, useEffect } from "react";
import { PackageOpen, Clock, CheckCircle2, Users2 } from "lucide-react";
import axios from "axios";

const Dashboard = () => {
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
        const departmentId = localStorage.getItem("departmentId");

        if (!token || !departmentId) return;

        // Fetch kanban data for this department
        const kanbanResponse = await axios.get(
          `${API}/departments/${departmentId}/sub-batches`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const kanbanData = kanbanResponse.data.data;

        // Fetch workers for this department
        const workersResponse = await axios.get(
          `${API}/workers/department/${departmentId}`
        );

        setStats({
          newArrivals: kanbanData.newArrival?.length || 0,
          inProgress: kanbanData.inProgress?.length || 0,
          completed: kanbanData.completed?.length || 0,
          activeWorkers: workersResponse.data?.length || 0
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API]);

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-2">Monitor your department&apos;s production progress and team performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* New Arrivals */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <PackageOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">New Arrivals</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.newArrivals}
          </p>
          <p className="text-xs text-gray-500 mt-2">Tasks awaiting assignment</p>
        </div>

        {/* In Progress */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 rounded-lg group-hover:bg-yellow-100 transition-colors">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">In Progress</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.inProgress}
          </p>
          <p className="text-xs text-gray-500 mt-2">Currently being worked on</p>
        </div>

        {/* Completed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Completed</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.completed}
          </p>
          <p className="text-xs text-gray-500 mt-2">Tasks finished this week</p>
        </div>

        {/* Active Workers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <Users2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Workers</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.activeWorkers}
          </p>
          <p className="text-xs text-gray-500 mt-2">Workers in your department</p>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left">
            <PackageOpen className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">View Department Tasks</span>
          </button>
          <button className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left">
            <Users2 className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Manage Workers</span>
          </button>
          <button className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left">
            <CheckCircle2 className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
