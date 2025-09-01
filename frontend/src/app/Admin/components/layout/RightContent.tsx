"use client";

import React from "react";
import Header from "./Header";
import ContentRouter from "../ContentRouter";
import { NavigationItem } from "@/app/admin/types/navigation.d";
import {
  LayoutDashboard, Eye, Package, Layers, Building2, Monitor,
  Archive, Settings, Users, Truck, Users2, Building
} from "lucide-react";

interface RightContentProps {
  activeView: string;
}

const navItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "rollview", label: "Roll View", icon: Eye },
  { id: "batchview", label: "Batch View", icon: Package },
  { id: "subbatchview", label: "Sub Batch View", icon: Layers },
  { id: "departmentview", label: "Department View", icon: Building2 },
  { id: "productionview", label: "Production View", icon: Monitor },
  { id: "inventory", label: "Inventory", icon: Archive },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "clients", label: "Clients", icon: Users },
  { id: "vendors", label: "Vendors", icon: Truck },
  { id: "workers", label: "Workers", icon: Users2 },
  { id: "departments", label: "Departments", icon: Building },
];

const RightContent: React.FC<RightContentProps> = ({ activeView }) => (
  <div className="flex flex-col h-full">
    <Header activeView={activeView} navigationItems={navItems} />
    <main className="flex-1 overflow-auto">
      <ContentRouter activeView={activeView} />
    </main>
  </div>
);

export default RightContent;
