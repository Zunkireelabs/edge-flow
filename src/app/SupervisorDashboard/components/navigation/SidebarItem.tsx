"use client";

import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface SidebarItemProps {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  hasChildren?: boolean;
  isOpen?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  icon: Icon,
  active,
  onClick,
  hasChildren = false,
  isOpen = false,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group ${
      active
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
        : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
    }`}
  >
    {/* Icon + Label */}
    <span className="flex items-center gap-3">
      <Icon className={`w-5 h-5 transition-transform ${active ? '' : 'group-hover:scale-110'}`} />
      <span className="font-medium text-sm">{label}</span>
    </span>

    {/* Expand/Collapse Arrow */}
    {hasChildren && (
      <span className="transition-transform">
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </span>
    )}
  </button>
);

export default SidebarItem;
