"use client";

import React from "react";
import SidebarItem from "./SidebarItem";
import { LogOut, Search } from "lucide-react";
import { NavigationItem } from "@/app/admin/types/navigation.d";

interface NavigationProps {
  activeView: string;
  onViewChange: (id: string) => void;
  items: NavigationItem[];
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange, items }) => (
  <div className="w-64 bg-white shadow-lg flex flex-col h-full">
    {/* Header */}
    <div className="p-6 border-b">
      <h2 className="text-xl font-bold text-blue-600">Navigation</h2>
    </div>

    {/* Search */}
    <div className="p-4 border-b">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search batches, orders..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    {/* Menu Items */}
    <nav className="flex-1 p-4">
      <ul className="space-y-2">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            active={activeView === item.id}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </ul>
    </nav>

    {/* Logout */}
    <div className="p-4 border-t">
      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  </div>
);

export default Navigation;
