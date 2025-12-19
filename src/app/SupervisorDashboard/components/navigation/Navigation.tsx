"use client";

import React, { useState } from "react";
import SidebarItem from "./SidebarItem";
import { Menu } from "lucide-react";
import { NavigationItem } from "../../types/navigation";

interface NavigationProps {
  activeView: string;
  onViewChange: (id: string) => void;
  items: NavigationItem[];
  onToggleSidebar?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange, items, onToggleSidebar }) => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const handleClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      setOpenItem(openItem === item.id ? null : item.id);
    } else {
      onViewChange(item.id);
    }
  };

  return (
    <div className="w-60 bg-[#f7f7f7] flex flex-col h-full">
      {/* Header with Product Name */}
      <div className="px-4 py-3 border-b border-gray-100 h-[60px] flex items-center gap-3">
        {/* Hamburger Menu */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            title="Collapse sidebar"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
        )}
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">Gaamma</span>
          <span className="text-xs text-gray-400 font-medium">Enterprise - Edition</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5 min-h-full">
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
                <ul className="ml-6 mt-0.5 space-y-0.5 pl-3 border-l border-gray-200">
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

      {/* Footer - Zunkireelabs Branding */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">A Product of</span>
          <img
            src="/zunkireelabs-logo.png"
            alt="Zunkireelabs"
            className="h-7 w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Navigation;
