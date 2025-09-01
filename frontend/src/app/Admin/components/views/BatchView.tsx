"use client";

import React from "react";

const BatchView = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h2 className="text-2xl font-bold mb-6">Batch View</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5].map((batch) => (
          <div key={batch} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg mb-2">Batch {batch}</h3>
            <p className="text-sm text-gray-500">Status: Active</p>
            <p className="text-sm text-gray-500">Created: 2025-08-31</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchView;
