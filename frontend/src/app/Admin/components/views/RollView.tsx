"use client";

import React from "react";

const RollView = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h2 className="text-2xl font-bold mb-6">Roll View</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left">Roll ID</th>
              <th className="py-2 px-4 text-left">Batch</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((roll) => (
              <tr key={roll} className="border-t">
                <td className="py-2 px-4">R-{roll}</td>
                <td className="py-2 px-4">B-{roll}</td>
                <td className="py-2 px-4">Active</td>
                <td className="py-2 px-4">2025-08-31</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RollView;
