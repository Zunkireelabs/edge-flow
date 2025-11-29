"use client";

import React from "react";
import Dashboard from "./views/Dashboard";
import RollView from "./views/RollView";
import BatchView from "./views/BatchView";
import SubBatchView from "./views/SubBatchView";
import DepartmentView from "./views/DepartmentView";
import GenericView from "./views/GenericView";
import Worker from "./views/Worker";
import DepartmentForm from "./views/DepartmentForm";
import CreateSupervisor from "./views/CreateSupervisor";
import WageCalculation from "./views/WageCalculation";
import ProductionView from "./views/ProductionView";
import Inventory from "./views/Inventory";

interface ContentRouterProps {
  activeView: string;
  onViewChange?: (view: string) => void;
}

const ContentRouter: React.FC<ContentRouterProps> = ({ activeView, onViewChange }) => {
  switch (activeView) {
    case "dashboard":
      return <Dashboard onViewChange={onViewChange} />;

    case "rollview":
      return <RollView />;

    case "batchview":
      return <BatchView />;

    case "subbatchview":
      return <SubBatchView />;

    case "departmentview":
      return <DepartmentView />;

    case "vendors":
      return <GenericView />;

    case "workers":
      return <Worker />;

    case "departments":
      return <DepartmentForm />;

    case "departmentform":
      return <DepartmentForm />;

    case "createsupervisor":
      return <CreateSupervisor />;

    case "wagecalculation":
      return <WageCalculation />;

    case "productionview":
      return <ProductionView />;

    case "inventory":
      return <Inventory />;

    default:
      return (
        <div className="p-8 bg-gray-50 min-h-full">
          <h2 className="text-xl text-gray-500">Select a view from the menu</h2>
        </div>
      );
  }
};

export default ContentRouter;
