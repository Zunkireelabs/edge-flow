"use client";

import React from "react";
import { Bell } from "lucide-react";
import { NavigationItem } from "@/app/admin/types/navigation.d";

interface HeaderProps {
  activeView: string;
  navigationItems: NavigationItem[];
}

const Header: React.FC<HeaderProps> = ({ activeView, navigationItems }) => (
  <header className="bg-white shadow-sm border-b px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {navigationItems.find((item) => item.id === activeView)?.label || "Dashboard"}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            JD
          </div>
          <span className="text-sm font-medium text-gray-700">John Doe</span>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
