"use client";

import React, { useState, useEffect } from "react";

interface Department {
  id: number;
  name: string;
}

interface HeaderProps {
  activeView: string;
  navigationItems: unknown[];
}

const Header: React.FC<HeaderProps> = () => {
  const [departmentName, setDepartmentName] = useState<string>("");

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
      } catch (error) {
        console.error("Error fetching department name:", error);
      }
    };

    fetchDepartmentName();
  }, []);

  return (
    <header className="bg-white shadow-sm h-10% px-6 py-5">
      <div className="flex items-center">
        {departmentName && (
          <div className="bg-blue-50 rounded-full px-4 py-2 text-base">
            <span className="text-blue-900">Department:</span>{" "}
            <span className="text-blue-900">{departmentName}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;