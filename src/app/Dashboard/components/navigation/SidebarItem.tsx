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
    className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors group ${
      active
        ? "bg-blue-50 text-blue-600"
        : "text-gray-600 hover:bg-blue-50 hover:text-gray-900"
    }`}
  >
    {/* Icon + Label */}
    <span className="flex items-center gap-2.5">
      <Icon className="w-[18px] h-[18px]" />
      <span className={`text-sm ${active ? "font-medium" : "font-normal"}`}>{label}</span>
    </span>

    {/* Expand/Collapse Arrow */}
    {hasChildren && (
      <span className="text-gray-400">
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
