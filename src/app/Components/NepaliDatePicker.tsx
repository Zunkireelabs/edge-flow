"use client";
import React, { useMemo } from "react";
import { NepaliDatePicker as Calendar } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import { Calendar as CalendarIcon } from "lucide-react";
import NepaliDate from "nepali-date-converter";

interface NepaliDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

/**
 * Check if a date string is a Nepali date (year > 2050)
 */
const isNepaliDateString = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  if (parts.length < 1) return false;
  const year = parseInt(parts[0]);
  return year > 2050;
};

/**
 * Convert Gregorian date to Nepali string for calendar display
 */
const gregorianToNepali = (gregorianDate: string): string => {
  if (!gregorianDate) return "";

  try {
    // If already Nepali format, return as-is
    if (isNepaliDateString(gregorianDate)) {
      return gregorianDate;
    }

    // Parse Gregorian date
    const jsDate = new Date(gregorianDate);
    if (isNaN(jsDate.getTime())) return "";
    if (jsDate.getFullYear() === 1970 && jsDate.getMonth() === 0) return "";

    // Convert to Nepali
    const nepaliDate = new NepaliDate(jsDate);
    const year = nepaliDate.getYear();
    const month = String(nepaliDate.getMonth() + 1).padStart(2, "0");
    const day = String(nepaliDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

/**
 * Convert Nepali date string to Gregorian ISO for storage
 */
const nepaliToGregorianISO = (nepaliDateStr: string): string => {
  if (!nepaliDateStr) return "";

  try {
    if (isNepaliDateString(nepaliDateStr)) {
      // Parse Nepali date and convert to Gregorian
      const [year, month, day] = nepaliDateStr.split("-").map(Number);
      const nepaliDate = new NepaliDate(year, month - 1, day);
      const jsDate = nepaliDate.toJsDate();
      // Return just the date part (YYYY-MM-DD) for form state
      return jsDate.toISOString().split("T")[0];
    }
    // Already Gregorian
    return nepaliDateStr;
  } catch {
    return "";
  }
};

export default function NepaliDatePicker({
  value,
  onChange,
  className = "",
  placeholder = "Select date",
  disabled,
}: NepaliDatePickerProps) {
  // Convert input value (Gregorian) to Nepali for calendar display
  const nepaliValue = useMemo(() => {
    return gregorianToNepali(value);
  }, [value]);

  // Handle date change from Nepali calendar - convert to Gregorian for storage
  const handleDateChange = (nepaliDate: string) => {
    const gregorianDate = nepaliToGregorianISO(nepaliDate);
    onChange(gregorianDate);
  };

  return (
    <div className={`nepali-datepicker-compact relative ${className}`}>
      <style jsx global>{`
        /* HubSpot-style compact date picker */
        .nepali-datepicker-compact .nepali-date-picker {
          width: 100%;
        }
        .nepali-datepicker-compact .nepali-date-picker input {
          width: 100% !important;
          padding: 6px 10px 6px 32px !important;
          font-size: 13px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          background: white !important;
          color: #374151 !important;
          height: 34px !important;
          box-sizing: border-box !important;
          transition: all 0.15s ease !important;
        }
        .nepali-datepicker-compact .nepali-date-picker input:hover {
          border-color: #9ca3af !important;
        }
        .nepali-datepicker-compact .nepali-date-picker input:focus {
          outline: none !important;
          border-color: #2272B4 !important;
          box-shadow: 0 0 0 2px rgba(34, 114, 180, 0.15) !important;
        }
        .nepali-datepicker-compact .nepali-date-picker input::placeholder {
          color: #9ca3af !important;
          font-size: 13px !important;
        }
        /* Calendar dropdown styling */
        .nepali-datepicker-compact .calender {
          border-radius: 8px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
          border: 1px solid #e5e7eb !important;
          margin-top: 4px !important;
        }
        .nepali-datepicker-compact .calender .header {
          background: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        .nepali-datepicker-compact .calender .header button {
          color: #374151 !important;
        }
        .nepali-datepicker-compact .calender .header button:hover {
          background: #e5e7eb !important;
        }
        .nepali-datepicker-compact .calender .body .week .day:hover {
          background: #dbeafe !important;
        }
        .nepali-datepicker-compact .calender .body .week .day.active {
          background: #2272B4 !important;
          color: white !important;
        }
        /* Remove outer wrapper borders */
        .nepali-datepicker-compact > div {
          border: none !important;
          padding: 0 !important;
        }
      `}</style>
      <CalendarIcon
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10"
      />
      <Calendar
        onChange={handleDateChange}
        value={nepaliValue}
        options={{ calenderLocale: "en", valueLocale: "en" }}
        inputClassName="nepali-input"
      />
    </div>
  );
}
