"use client";

import React, { useState, useEffect } from "react";
import { Bell, User, Building2 } from "lucide-react";

interface Department {
  id: number;
  name: string;
}

interface HeaderProps {
  activeView: string;
  navigationItems: unknown[];
}

const Header: React.FC<HeaderProps> = ({ activeView }) => {
  const [departmentName, setDepartmentName] = useState<string>("");
  const [supervisorName, setSupervisorName] = useState<string>("Supervisor");

  useEffect(() => {
    const fetchDepartmentName = async () => {
      try {
        const token = localStorage.getItem("token");
        const departmentId = localStorage.getItem("departmentId");

        if (!token || !departmentId) return;

        // Fetch department details
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_GET_DEPARTMENTS}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const departments: Department[] = await response.json();
          const currentDept = departments.find(
            (dept) => dept.id === parseInt(departmentId)
          );
          if (currentDept) {
            setDepartmentName(currentDept.name);
          }
        }

        // Get supervisor name from token or localStorage
        const storedName = localStorage.getItem("userName");
        if (storedName) {
          setSupervisorName(storedName);
        }
      } catch (error) {
        console.error("Error fetching department name:", error);
      }
    };

    fetchDepartmentName();
  }, []);

  return (
    <header className="bg-white shadow-sm px-6 py-4 relative border-b border-gray-200 h-[72px] flex items-center justify-between gap-4 w-full">
      {/* Left Section - Department Badge */}
      <div className="flex items-center gap-3">
        {departmentName && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-4 py-2.5 border border-blue-200 shadow-sm">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Department</p>
              <p className="text-sm font-bold text-blue-900">{departmentName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right Section - Notifications & User Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group">
          <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          {/* Notification Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{supervisorName}</p>
            <p className="text-xs text-gray-500">Supervisor</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;