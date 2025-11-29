"use client";

import React from "react";
import Navigation from "../navigation/Navigation";
import {
  LayoutDashboard,
  Eye,
  Package,
  Layers,
  Building2,
  Monitor,
  Archive,
  Settings,
  Truck,
  Users2,
  Building,
  UserPlus,
  Calculator,
} from "lucide-react";

import { NavigationItem } from "../../types/navigation";

interface LeftSidebarProps {
  activeView: string;
  onViewChange: (id: string) => void;
}

const navItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "rollview", label: "Roll View", icon: Eye },
  { id: "batchview", label: "Batch View", icon: Package },
  { id: "subbatchview", label: "Sub Batch View", icon: Layers },
  { id: "departmentview", label: "Department Kanban", icon: Building2 },
  { id: "productionview", label: "Production Overview", icon: Monitor },
  { id: "inventory", label: "Inventory", icon: Archive },
  { id: "wagecalculation", label: "Wage Calculation", icon: Calculator },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    children: [
      { id: "vendors", label: "Vendors", icon: Truck },
      { id: "workers", label: "Workers", icon: Users2 },
      { id: "departmentform", label: "Department", icon: Building },
      { id: "createsupervisor", label: "Supervisor", icon: UserPlus },
    ],
  },
];

const LeftSidebar: React.FC<LeftSidebarProps> = ({ activeView, onViewChange }) => (
  <Navigation activeView={activeView} onViewChange={onViewChange} items={navItems} />
);

export default LeftSidebar;
