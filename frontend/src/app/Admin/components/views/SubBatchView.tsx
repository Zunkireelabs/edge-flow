"use client";

import React from "react";

const SubBatchView = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h2 className="text-2xl font-bold mb-6">Sub Batch View</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left">SubBatch ID</th>
              <th className="py-2 px-4 text-left">Batch</th>
              <th className="py-2 px-4 text-left">Quantity</th>
              <th className="py-2 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((sub) => (
              <tr key={sub} className="border-t">
                <td className="py-2 px-4">SB-{sub}</td>
                <td className="py-2 px-4">B-{sub}</td>
                <td className="py-2 px-4">50</td>
                <td className="py-2 px-4">In Progress</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubBatchView;
