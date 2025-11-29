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
    <div className="w-64 bg-gradient-to-br from-gray-50 to-white shadow-xl flex flex-col h-full border-r border-gray-200">
      {/* Header with Logo - Height matches main header (72px) */}
      <div className="px-6 py-4 border-b border-gray-200 h-[72px] flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              BlueShark
            </h2>
            <p className="text-xs text-gray-500">Production</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1 min-h-full">
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
                <ul className="ml-4 mt-1 space-y-1 pl-4 border-l-2 border-blue-200">
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
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;
