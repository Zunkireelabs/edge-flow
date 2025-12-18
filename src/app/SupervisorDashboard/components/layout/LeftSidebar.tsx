"use client";

import React, { useMemo } from "react";
import Navigation from "../navigation/Navigation";
import {
  Building2,
  LayoutDashboard,
  Users2,
  Layers,
} from "lucide-react";

import { NavigationItem } from "../../types/navigation";
import { useDepartment } from "../../contexts/DepartmentContext";

interface LeftSidebarProps {
  activeView: string;
  onViewChange: (id: string) => void;
  onToggleSidebar?: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ activeView, onViewChange, onToggleSidebar }) => {
  const { isSuperSupervisor } = useDepartment();

  // Build navigation items - SubBatchView is available for all supervisors
  const navItems: NavigationItem[] = useMemo(() => {
    const items: NavigationItem[] = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "departmentview", label: "Task Management", icon: Building2 },
      { id: "subbatchview", label: "Sub-Batches", icon: Layers },
      { id: "workers", label: "Workers", icon: Users2 },
    ];
    return items;
  }, []);

  return (
    <Navigation activeView={activeView} onViewChange={onViewChange} items={navItems} onToggleSidebar={onToggleSidebar} />
  );
};

export default LeftSidebar;
