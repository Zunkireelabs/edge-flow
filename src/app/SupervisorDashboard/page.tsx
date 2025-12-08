"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LeftSidebar from "./components/layout/LeftSidebar";
import RightContent from "./components/layout/RightContent";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SupervisorPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial view from URL query param, default to "dashboard"
  const viewFromUrl = searchParams.get("view") || "dashboard";
  const [activeView, setActiveView] = useState(viewFromUrl);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sync state with URL when URL changes (browser back/forward)
  useEffect(() => {
    const viewParam = searchParams.get("view") || "dashboard";
    if (viewParam !== activeView) {
      setActiveView(viewParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when view changes
  const handleViewChange = (view: string) => {
    setActiveView(view);
    // Update URL without full page reload
    const newUrl = view === "dashboard" ? "/SupervisorDashboard" : `/SupervisorDashboard?view=${view}`;
    router.push(newUrl, { scroll: false });
  };

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
          <LeftSidebar activeView={activeView} onViewChange={handleViewChange} />
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
        <RightContent activeView={activeView} onViewChange={handleViewChange} />
      </div>
    </div>
  );
};

export default SupervisorPage;