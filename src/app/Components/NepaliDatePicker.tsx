"use client";
import React from "react";
import { NepaliDatePicker as Calendar } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";

interface NepaliDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

export default function NepaliDatePicker({
  value,
  onChange,
  className = "",
  placeholder,
  disabled,
  required,
  name,
}: NepaliDatePickerProps) {
  // Handle date change from Nepali calendar
  const handleDateChange = (nepaliDate: string) => {
    onChange(nepaliDate);
  };

  return (
    <div className="nepali-datepicker-wrapper">
      <Calendar
        onChange={handleDateChange}
        value={value}
        className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        inputClassName={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      />
    </div>
  );
}
