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
    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
      active
        ? "bg-[#4880FF] text-white"
        : "text-black hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    {/* Icon + Label */}
    <span className="flex items-center gap-3">
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </span>

    {/* Expand/Collapse Arrow */}
    {hasChildren && (
      <span>
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
