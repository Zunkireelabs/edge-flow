"use client";

import React from "react";

const Inventory = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h2 className="text-2xl font-bold mb-6">Inventory</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left">Item</th>
              <th className="py-2 px-4 text-left">Category</th>
              <th className="py-2 px-4 text-left">Stock</th>
              <th className="py-2 px-4 text-left">Reorder Level</th>
            </tr>
          </thead>
          <tbody>
            {["Paper", "Ink", "Boxes"].map((item, i) => (
              <tr key={i} className="border-t">
                <td className="py-2 px-4">{item}</td>
                <td className="py-2 px-4">Raw Material</td>
                <td className="py-2 px-4">{Math.floor(Math.random() * 500)}</td>
                <td className="py-2 px-4">50</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
