"use client";

import React from "react";
import {
  LayoutDashboard, Eye, Package, Layers, Building2, Monitor,
  Archive, Settings, Users, Truck, Users2, Building
} from "lucide-react";

import Dashboard from "./views/Dashboard";
import RollView from "./views/RollView";
import BatchView from "./views/BatchView";
import SubBatchView from "./views/SubBatchView";
import DepartmentView from "./views/DepartmentView";
import ProductionView from "./views/ProductionView";
import Inventory from "./views/Inventory";
import SettingsView from "./views/SettingsView";
import GenericView from "./views/GenericView";

interface ContentRouterProps {
  activeView: string;
}

const ContentRouter: React.FC<ContentRouterProps> = ({ activeView }) => {
  switch (activeView) {
    case "dashboard": return <Dashboard />;
    case "rollview": return <RollView />;
    case "batchview": return <BatchView />;
    case "subbatchview": return <SubBatchView />;
    case "departmentview": return <DepartmentView />;
    case "productionview": return <ProductionView />;
    case "inventory": return <Inventory />;
    case "settings": return <SettingsView />;
    case "clients": return <GenericView title="Clients" icon={Users} />;
    case "vendors": return <GenericView title="Vendors" icon={Truck} />;
    case "workers": return <GenericView title="Workers" icon={Users2} />;
    case "departments": return <GenericView title="Departments" icon={Building} />;
    default: return <Dashboard />;
  }
};

export default ContentRouter;
