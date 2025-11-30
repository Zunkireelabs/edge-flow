"use client";

import React, { useState } from "react";
import LeftSidebar from "./components/layout/LeftSidebar";
import RightContent from "./components/layout/RightContent";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AdminPage = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-60 bg-[#f7f7f7] relative">
          {/* Collapse button inside sidebar - ChevronLeft when open */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-5 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-50 group"
            title="Collapse sidebar"
          >
            <ChevronLeft
              size={20}
              className="text-gray-600 group-hover:text-gray-900"
            />
          </button>
          <LeftSidebar activeView={activeView} onViewChange={setActiveView} />
        </div>
      )}

      {/* Expand button on left edge when closed - ChevronRight */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-5 left-2 p-1.5 bg-white shadow-lg rounded-lg hover:bg-gray-100 transition-all z-50 group"
          title="Expand sidebar"
        >
          <ChevronRight
            size={20}
            className="text-gray-600 group-hover:text-gray-900"
          />
        </button>
      )}

      {/* Right content always flex-1 */}
      <div className="flex-1 overflow-auto">
        <RightContent activeView={activeView} onViewChange={setActiveView} />
      </div>
    </div>
  );
};

export default AdminPage;