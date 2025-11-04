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

interface ContentRouterProps {
  activeView: string;
}

const ContentRouter: React.FC<ContentRouterProps> = ({ activeView }) => {
  switch (activeView) {
    case "dashboard":
      return <Dashboard />;

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

    case "departmentform":
      return <DepartmentForm />;

    case "createsupervisor": // 👈 new case
      return <CreateSupervisor />;

    default:
      return (
        <div className="p-8 bg-gray-50 min-h-full">
          <h2 className="text-xl text-gray-500">Select a view from the menu</h2>
        </div>
      );
  }
};

export default ContentRouter;
