"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Department {
  id: number;
  name: string;
  description?: string;
}

interface DepartmentContextType {
  departments: Department[];
  selectedDepartmentId: number | "all" | null;
  setSelectedDepartmentId: (id: number | "all" | null) => void;
  isLoading: boolean;
  isSuperSupervisor: boolean;
  userDepartmentId: number | null;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export const DepartmentProvider = ({ children }: { children: ReactNode }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "all" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperSupervisor, setIsSuperSupervisor] = useState(false);
  const [userDepartmentId, setUserDepartmentId] = useState<number | null>(null);

  useEffect(() => {
    const initializeContext = async () => {
      try {
        // Check user role from localStorage
        const role = localStorage.getItem("role");
        const storedDeptId = localStorage.getItem("departmentId");

        const isSuperSup = role === "SUPER_SUPERVISOR";
        setIsSuperSupervisor(isSuperSup);

        if (isSuperSup) {
          // SUPER_SUPERVISOR: Fetch all departments
          const API = process.env.NEXT_PUBLIC_API_URL;
          const response = await fetch(`${API}/departments`);
          if (response.ok) {
            const data = await response.json();
            setDepartments(data);
          }
          // Default to "all" for super supervisor (will prompt to select)
          setSelectedDepartmentId("all");
        } else {
          // Regular SUPERVISOR: Use their assigned department
          const deptId = storedDeptId ? parseInt(storedDeptId, 10) : null;
          setUserDepartmentId(deptId);
          setSelectedDepartmentId(deptId);
        }
      } catch (error) {
        console.error("Error initializing department context:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeContext();
  }, []);

  return (
    <DepartmentContext.Provider
      value={{
        departments,
        selectedDepartmentId,
        setSelectedDepartmentId,
        isLoading,
        isSuperSupervisor,
        userDepartmentId,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
};

export const useDepartment = () => {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error("useDepartment must be used within a DepartmentProvider");
  }
  return context;
};

export default DepartmentContext;
