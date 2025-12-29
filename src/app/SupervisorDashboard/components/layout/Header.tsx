"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, User, Building2, ChevronDown, Settings, LogOut } from "lucide-react";
import DepartmentSelector from "../DepartmentSelector";
import { useDepartment } from "../../contexts/DepartmentContext";

interface Department {
  id: number;
  name: string;
}

interface HeaderProps {
  activeView: string;
  navigationItems: unknown[];
}

const Header: React.FC<HeaderProps> = ({ activeView }) => {
  const router = useRouter();
  const { isSuperSupervisor, selectedDepartmentId, departments } = useDepartment();
  const [departmentName, setDepartmentName] = useState<string>("");
  const [supervisorName, setSupervisorName] = useState<string>("Supervisor");
  const [userRole, setUserRole] = useState<string>("Supervisor");
  const [userEmail, setUserEmail] = useState<string>("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  useEffect(() => {
    const fetchDepartmentName = async () => {
      try {
        const token = localStorage.getItem("token");
        const departmentId = localStorage.getItem("departmentId");
        const role = localStorage.getItem("role");

        // Set role label
        if (role === "SUPER_SUPERVISOR") {
          setUserRole("Super Supervisor");
        } else {
          setUserRole("Supervisor");
        }

        // For regular supervisors, fetch their department name
        if (!isSuperSupervisor && token && departmentId) {
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
        }

        // Get supervisor name and email from localStorage
        const storedName = localStorage.getItem("userName");
        const storedEmail = localStorage.getItem("userEmail");
        if (storedName) {
          setSupervisorName(storedName);
        }
        if (storedEmail) {
          setUserEmail(storedEmail);
        }
      } catch {
        // Error fetching department name
      }
    };

    fetchDepartmentName();
  }, [isSuperSupervisor]);

  const handleLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("departmentId");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    // Clear cookies for middleware authentication
    document.cookie = "token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = "role=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";

    // Redirect to login page
    router.push("/loginandsignup");
  };

  return (
    <header className="bg-[#f7f7f7] px-6 py-3 relative h-[60px] flex items-center justify-between gap-4 w-full">
      {/* Left Section - Department Badge or Selector */}
      <div className="flex items-center gap-3">
        {isSuperSupervisor ? (
          /* SUPER_SUPERVISOR: Show Department Selector */
          <DepartmentSelector />
        ) : (
          /* Regular SUPERVISOR: Show fixed department badge */
          departmentName && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <Building2 className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm font-medium text-gray-900">{departmentName}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right Section - Notifications & Client Dropdown */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group">
          <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          {/* Notification Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Client Dropdown - BlueShark */}
        <div className="relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center gap-2 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            <div className="w-6 h-6 bg-[#2272B4] rounded flex items-center justify-center">
              <span className="text-white font-semibold text-xs">B</span>
            </div>
            <span className="text-sm font-medium">BlueShark</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Account Dropdown */}
          {showAccountDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              {/* User Info Section */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSuperSupervisor ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{supervisorName}</p>
                    {userEmail && <p className="text-xs text-gray-500 truncate">{userEmail}</p>}
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${isSuperSupervisor ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Profile</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close account dropdown */}
      {showAccountDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAccountDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;