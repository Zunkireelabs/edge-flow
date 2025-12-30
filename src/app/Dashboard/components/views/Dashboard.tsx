"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Package, FileText, Building2, Users, CheckCircle, AlertTriangle, Clock, Plus, UserPlus, Zap } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

interface DashboardProps {
  onViewChange?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [statsData, setStatsData] = useState({
    batches: 0,
    rolls: 0,
    departments: 0,
    workers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    user: string;
    time: string;
    status: string;
    statusColor: string;
  }>>([]);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Fetch all stats data and recent activities
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batchesRes, rollsRes, departmentsRes, workersRes, subBatchesRes] = await Promise.all([
          axios.get(`${API}/batches`),
          axios.get(`${API}/rolls`),
          axios.get(`${API}/departments`),
          axios.get(`${API}/workers`),
          axios.get(`${API}/sub-batches`),
        ]);

        setStatsData({
          batches: batchesRes.data.length,
          rolls: rollsRes.data.length,
          departments: departmentsRes.data.length,
          workers: workersRes.data.length,
        });

        // Generate recent activities from latest items
        const activities: Array<{
          id: string;
          icon: React.ReactNode;
          iconBg: string;
          title: string;
          description: string;
          user: string;
          time: string;
          status: string;
          statusColor: string;
          timestamp: string;
        }> = [];

        // Add recent batches
        batchesRes.data.slice(-3).forEach((batch: { id: number; name: string; quantity: number; unit: string; color: string; created_at?: string }) => {
          activities.push({
            id: `batch-${batch.id}`,
            icon: <Package className="w-5 h-5 text-blue-600" />,
            iconBg: "bg-blue-100",
            title: "New Batch Created",
            description: `Batch "${batch.name}" created with ${batch.quantity} ${batch.unit}${batch.color ? ` of ${batch.color} fabric` : ''}.`,
            user: "Admin User",
            time: batch.created_at ? getTimeAgo(batch.created_at) : "Recently",
            status: "completed",
            statusColor: "text-green-600",
            timestamp: batch.created_at || new Date().toISOString(),
          });
        });

        // Add recent sub-batches
        subBatchesRes.data.slice(-2).forEach((sb: { id: number; name: string; estimated_pieces?: number; created_at?: string }) => {
          activities.push({
            id: `subbatch-${sb.id}`,
            icon: <FileText className="w-5 h-5 text-purple-600" />,
            iconBg: "bg-purple-100",
            title: "Sub-Batch Created",
            description: `Sub-Batch "${sb.name}" created${sb.estimated_pieces ? ` with ${sb.estimated_pieces} estimated pieces` : ''}.`,
            user: "Admin User",
            time: sb.created_at ? getTimeAgo(sb.created_at) : "Recently",
            status: "in progress",
            statusColor: "text-blue-600",
            timestamp: sb.created_at || new Date().toISOString(),
          });
        });

        // Add recent rolls
        rollsRes.data.slice(-2).forEach((roll: { id: number; name: string; quantity: number; unit: string; color?: string; created_at?: string }) => {
          activities.push({
            id: `roll-${roll.id}`,
            icon: <FileText className="w-5 h-5 text-green-600" />,
            iconBg: "bg-green-100",
            title: "Roll Received",
            description: `Roll "${roll.name}" (${roll.quantity} ${roll.unit}${roll.color ? `, ${roll.color}` : ''}) added to inventory.`,
            user: "Vendor Manager",
            time: roll.created_at ? getTimeAgo(roll.created_at) : "Recently",
            status: "completed",
            statusColor: "text-green-600",
            timestamp: roll.created_at || new Date().toISOString(),
          });
        });

        // Add recent workers
        workersRes.data.slice(-1).forEach((worker: { id: number; name: string; position?: string; created_at?: string }) => {
          activities.push({
            id: `worker-${worker.id}`,
            icon: <Users className="w-5 h-5 text-purple-600" />,
            iconBg: "bg-purple-100",
            title: "Worker Added",
            description: `New worker "${worker.name}" added${worker.position ? ` as ${worker.position}` : ''}.`,
            user: "HR Manager",
            time: worker.created_at ? getTimeAgo(worker.created_at) : "Recently",
            status: "completed",
            statusColor: "text-green-600",
            timestamp: worker.created_at || new Date().toISOString(),
          });
        });

        // Sort by timestamp (most recent first) and limit to 5
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(activities.slice(0, 5));

      } catch {
        // Dashboard data fetch failed
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API]);

  // Helper function to calculate time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const stats = [
    {
      title: "Total Batches",
      value: loading ? "..." : statsData.batches,
      icon: <Package className="w-6 h-6" />,
    },
    {
      title: "Active Rolls",
      value: loading ? "..." : statsData.rolls,
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: "Departments",
      value: loading ? "..." : statsData.departments,
      icon: <Building2 className="w-6 h-6" />,
    },
    {
      title: "Workers",
      value: loading ? "..." : statsData.workers,
      icon: <Users className="w-6 h-6" />,
    }
  ];

  const quickActions = [
    {
      title: "Create Sub-Batch",
      description: "Add new sub-batch",
      icon: <Plus className="w-6 h-6" />,
      gradient: "from-emerald-50 to-teal-100",
      iconColor: "text-emerald-600",
      view: "subbatchview"
    },
    {
      title: "Create Worker",
      description: "Add new worker",
      icon: <UserPlus className="w-6 h-6" />,
      gradient: "from-blue-50 to-indigo-100",
      iconColor: "text-blue-600",
      view: "workers"
    },
    {
      title: "Create Department",
      description: "Add new department",
      icon: <Building2 className="w-6 h-6" />,
      gradient: "from-violet-50 to-purple-100",
      iconColor: "text-violet-600",
      view: "departments"
    },
    {
      title: "View Production",
      description: "Monitor production",
      icon: <FileText className="w-6 h-6" />,
      gradient: "from-amber-50 to-orange-100",
      iconColor: "text-amber-600",
      view: "productionview"
    }
  ];

  return (
    <div className="p-6 bg-[#ffffff] min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Welcome back! Here&apos;s what&apos;s happening with your production today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Two Column Layout - Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Activity - 60% (3/5 columns) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-emerald-600 font-medium">Live</span>
              </div>
            </div>

            {/* Activity List */}
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="text-gray-400 mt-0.5">
                      {activity.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h4 className="font-medium text-gray-900 text-sm">{activity.title}</h4>
                        <span className={`text-xs font-medium ${activity.statusColor}`}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1 line-clamp-1">{activity.description}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span>by {activity.user}</span>
                        <span>•</span>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Link */}
            <div className="px-5 py-2.5 border-t border-gray-100">
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
                View All
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions - 40% (2/5 columns) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
              <Zap className="w-4 h-4 text-gray-400" />
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onViewChange && onViewChange(action.view)}
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
      </div>
    </div>
  );
};

export default Dashboard;
