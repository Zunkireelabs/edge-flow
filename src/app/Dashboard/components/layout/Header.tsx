"use client";

import React, { useState } from "react";
import { Bell, Search } from "lucide-react";
import { NavigationItem } from "../../types/navigation";

interface HeaderProps {
  activeView: string;
  navigationItems: NavigationItem[];
}

const Header: React.FC<HeaderProps> = ({  }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // You can pass this value to filter content in RightContent if needed
  };

  return (
    <header className="bg-white shadow-sm h-10% px-5 py-4">
      <div className="flex items-center justify-around">
        {/* Left Section: Title + Search */}
        <div className="flex items-center gap-4 w-full max-w-xl">
         

          {/* Search Input */}
          <div className="flex items-center bg-gray-200 rounded-xl px-3 py-1 flex-1">
            <Search className="w-4 h-8 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search batch,orders...."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent w-full text-sm outline-none"
            />
          </div>
        </div>

        {/* Right Section: Notifications + User */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
         
        </div>
      </div>
    </header>
  );
};

export default Header;