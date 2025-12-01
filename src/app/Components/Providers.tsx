"use client";

import React, { ReactNode } from "react";
import { ToastProvider } from "./ToastContext";

interface ProvidersProps {
  children: ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return <ToastProvider>{children}</ToastProvider>;
};

export default Providers;
