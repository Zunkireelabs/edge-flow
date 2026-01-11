"use client";

import React, { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useDepartment } from "../contexts/DepartmentContext";

const DepartmentSelector = () => {
  const { departments, selectedDepartmentId, setSelectedDepartmentId, isSuperSupervisor } = useDepartment();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside - must be before any early returns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Don't render if not a super supervisor
  if (!isSuperSupervisor) {
    return null;
  }

  const selectedDepartment = selectedDepartmentId === "all"
    ? null
    : departments.find(d => d.id === selectedDepartmentId);

  const displayText = selectedDepartment
    ? selectedDepartment.name
    : "Select Department";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
          selectedDepartmentId === "all"
            ? "border-amber-400 bg-amber-50 text-amber-700"
            : "border-[#2272B4] bg-blue-50 text-[#2272B4]"
        }`}
      >
        <Building2 className="w-4 h-4" />
        <span className="font-medium text-sm">{displayText}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" />

          <div className="p-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
              Select Department
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {/* All Departments Option */}
            <button
              onClick={() => {
                setSelectedDepartmentId("all");
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                selectedDepartmentId === "all" ? "bg-amber-50" : ""
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedDepartmentId === "all" ? "border-amber-500 bg-amber-500" : "border-gray-300"
              }`}>
                {selectedDepartmentId === "all" && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-medium ${selectedDepartmentId === "all" ? "text-amber-700" : "text-gray-700"}`}>
                  All Departments
                </span>
                <p className="text-xs text-gray-500">View overview stats only</p>
              </div>
            </button>

            {/* Individual Departments */}
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => {
                  setSelectedDepartmentId(dept.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  selectedDepartmentId === dept.id ? "bg-blue-50" : ""
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedDepartmentId === dept.id ? "border-[#2272B4] bg-[#2272B4]" : "border-gray-300"
                }`}>
                  {selectedDepartmentId === dept.id && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${selectedDepartmentId === dept.id ? "text-[#2272B4]" : "text-gray-700"}`}>
                    {dept.name}
                  </span>
                  {dept.description && (
                    <p className="text-xs text-gray-500 truncate">{dept.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentSelector;
