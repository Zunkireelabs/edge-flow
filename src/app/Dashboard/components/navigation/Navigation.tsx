"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      setOpenItem(openItem === item.id ? null : item.id);
    } else {
      onViewChange(item.id);
    }
  };

  const handleLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("departmentId");

    // Redirect to login page
    router.push("/loginandsignup");
  };

  return (
    <div className="w-60 bg-[#f7f7f7] flex flex-col h-full">
      {/* Header with Logo */}
      <div className="px-5 py-4 border-b border-gray-100 h-[60px] flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-semibold text-base">B</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">BlueShark</span>
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

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;
