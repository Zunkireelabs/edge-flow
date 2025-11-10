"use client";

import React from "react";

interface HeaderProps {
  activeView: string;
  navigationItems: unknown[];
}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-white shadow-sm h-10% px-5 py-4">
      <div className="flex items-center justify-around">
        {/* Empty header */}
      </div>
    </header>
  );
};

export default Header;