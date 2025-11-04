"use client";

import React from "react";

const Dashboard = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-full ">
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Batches</h3>
          <p className="text-xl font-bold mt-2">120</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Rolls</h3>
          <p className="text-xl font-bold mt-2">85</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Departments</h3>
          <p className="text-xl font-bold mt-2">12</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Workers</h3>
          <p className="text-xl font-bold mt-2">56</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
