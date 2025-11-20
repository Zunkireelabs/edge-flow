"use client";

import React, { useState } from "react";
import LeftSidebar from "./components/layout/LeftSidebar";
import RightContent from "./components/layout/RightContent";
import { Menu, PanelRight } from "lucide-react";

const AdminPage = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 bg-white shadow-lg relative">
          {/* Close button inside sidebar */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-2 right-2 p-2 rounded "
          >
            <PanelRight
              size={24}
              className="absolute top-2 right-2 cursor-pointer "
              onClick={() => setSidebarOpen(false)}
            />
          </button>
          <LeftSidebar activeView={activeView} onViewChange={setActiveView} />
        </div>
      )}

      {/* Toggle button on left edge when closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 m-2 bg-white shadow rounded hover:bg-gray-200"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Right content always flex-1 */}
      <div className="flex-1 overflow-auto">
        <RightContent activeView={activeView} />
      </div>
    </div>
  );
};

export default AdminPage;