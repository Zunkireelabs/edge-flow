"use client";

import React, { useState } from "react";

// Import all views
import Dashboard from "./views/Dashboard";
import RollView from "./views/RollView";
import BatchView from "./views/BatchView";
import SubBatchView from "./views/SubBatchView";
import DepartmentView from "./views/DepartmentView";
import ProductionView from "./views/ProductionView";
import Inventory from "./views/Inventory";
import SettingsView from "./views/SettingsView";

const AdminPage = () => {
  const [activeView, setActiveView] = useState("Dashboard");

  const menuItems = [
    "Dashboard",
    "Roll View",
    "Batch View",
    "Sub Batch View",
    "Department View",
    "Production View",
    "Inventory",
    "Settings",
  ];

  const renderView = () => {
    switch (activeView) {
      case "Dashboard":
        return <Dashboard />;
      case "Roll View":
        return <RollView />;
      case "Batch View":
        return <BatchView />;
      case "Sub Batch View":
        return <SubBatchView />;
      case "Department View":
        return <DepartmentView />;
      case "Production View":
        return <ProductionView />;
      case "Inventory":
        return <Inventory />;
      case "Settings":
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex-shrink-0">
        <div className="p-6 font-bold text-xl border-b border-gray-700">Admin Panel</div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveView(item)}
              className={`block w-full text-left px-6 py-3 hover:bg-gray-700 ${
                activeView === item ? "bg-gray-700 font-semibold" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50">{renderView()}</main>
    </div>
  );
};

export default AdminPage;
