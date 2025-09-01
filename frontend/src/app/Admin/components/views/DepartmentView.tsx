"use client";

import React from "react";

const DepartmentView = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h2 className="text-2xl font-bold mb-6">Department View</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {["Production", "Packaging", "Logistics"].map((dept) => (
          <div key={dept} className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold">{dept}</h3>
            <p className="text-sm text-gray-500">Employees: {Math.floor(Math.random() * 50 + 10)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentView;
