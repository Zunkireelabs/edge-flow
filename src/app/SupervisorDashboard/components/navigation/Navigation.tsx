"use client";

import React, { useState } from "react";
import SidebarItem from "./SidebarItem";
import { LogOut } from "lucide-react";
import { NavigationItem } from "../../types/navigation";

interface NavigationProps {
  activeView: string;
  onViewChange: (id: string) => void;
  items: NavigationItem[];
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange, items }) => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const handleClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      setOpenItem(openItem === item.id ? null : item.id);
    } else {
      onViewChange(item.id);
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-6">
        <h2 className="text-xl font-extrabold text-[#4880FF]">Navigation</h2>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2 min-h-full">
          {items.map((item: NavigationItem) => (
            <li key={item.id}>
              <SidebarItem
                label={item.label}
                icon={item.icon}
                active={
                  activeView === item.id ||
                  !!item.children?.some((c: NavigationItem) => c.id === activeView)
                }
                onClick={() => handleClick(item)}
                hasChildren={!!item.children}
                isOpen={openItem === item.id}
              />

              {/* Children */}
              {item.children && openItem === item.id && (
                <ul className="ml-6 mt-2 space-y-2">
                  {item.children.map((child: NavigationItem) => (
                    <li key={child.id}>
                      <SidebarItem
                        label={child.label}
                        icon={child.icon}
                        active={activeView === child.id}
                        onClick={() => onViewChange(child.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;
