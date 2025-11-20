"use client";

import React from "react";

const SettingsView = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-700 mb-4">You can configure application settings here.</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
