"use client";
import React from "react";

interface GenericViewProps {
  title: string;
  icon: React.ElementType;
}

const GenericView: React.FC<GenericViewProps> = ({ title, icon: Icon }) => (
  <div className="p-8 bg-gray-50 min-h-full">
    <div className="flex items-center gap-3 mb-6">
      <Icon className="w-6 h-6 text-blue-600" />
      <h2 className="text-2xl font-semibold">{title}</h2>
    </div>
    <p>Content for {title} goes here.</p>
  </div>
);

export default GenericView;
