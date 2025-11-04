"use client";

import React from "react";

const ProductionView = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h2 className="text-2xl font-bold mb-6">Production View</h2>

      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-gray-600 mb-2">Todays Production: 1200 units</p>
        <p className="text-gray-600 mb-2">Pending Orders: 350 units</p>
        <p className="text-gray-600 mb-2">Machine Status: All Running</p>
      </div>
    </div>
  );
};

export default ProductionView;
