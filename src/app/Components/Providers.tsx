"use client";

import React, { ReactNode } from "react";
import { ToastProvider } from "./ToastContext";
import UserbackProvider from "./UserbackProvider";

interface ProvidersProps {
  children: ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <UserbackProvider />
      {children}
    </ToastProvider>
  );
};

export default Providers;
