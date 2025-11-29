"use client";

import React from "react";
import Navigation from "../navigation/Navigation";
import {

  Building2,
  LayoutDashboard,
  Users2,

} from "lucide-react";

import { NavigationItem } from "../../types/navigation";

interface LeftSidebarProps {
  activeView: string;
  onViewChange: (id: string) => void;
}

const navItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  // { id: "rollview", label: "Roll View", icon: Eye },
  // { id: "batchview", label: "Batch View", icon: Package },
  // { id: "subbatchview", label: "Sub Batch View", icon: Layers },
  { id: "departmentview", label: "Task Management", icon: Building2 },
  { id: "workers", label: "Workers", icon: Users2 },
  // { id: "productionview", label: "Production View", icon: Monitor },
  // { id: "inventory", label: "Inventory", icon: Archive },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   icon: Settings,
  //   children: [
  //     { id: "clients", label: "Clients", icon: Users },
  //     { id: "vendors", label: "Vendors", icon: Truck },
  //     { id: "departmentform", label: "Department", icon: Building },
  //     { id: "createsupervisor", label: "Supervisor", icon: UserPlus },
  //   ],
  // },
];


const LeftSidebar: React.FC<LeftSidebarProps> = ({ activeView, onViewChange }) => (
  <Navigation activeView={activeView} onViewChange={onViewChange} items={navItems} />
);

export default LeftSidebar;
