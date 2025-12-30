"use client";
import React, { useMemo, useRef, useCallback } from "react";
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
  // Remove any time portion first
  const datePart = dateStr.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length < 1) return false;
  const year = parseInt(parts[0]);
  return year > 2050;
};

/**
 * Convert Gregorian date to Nepali string for calendar display
 * Handles timezone issues by parsing date parts directly
 */
const gregorianToNepali = (gregorianDate: string): string => {
  if (!gregorianDate) return "";

  try {
    // If already Nepali format, return as-is
    if (isNepaliDateString(gregorianDate)) {
      // Clean up any time portion
      return gregorianDate.split("T")[0];
    }

    // Extract just the date part to avoid timezone issues
    const datePart = gregorianDate.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);

    // Validate the parsed values
    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
      return "";
    }

    // Skip epoch date
    if (year === 1970 && month === 1 && day === 1) return "";

    // Create JS Date using local timezone (not UTC) to avoid day shifting
    const jsDate = new Date(year, month - 1, day);
    if (isNaN(jsDate.getTime())) return "";

    // Convert to Nepali
    const nepaliDate = new NepaliDate(jsDate);
    const nepYear = nepaliDate.getYear();
    const nepMonth = String(nepaliDate.getMonth() + 1).padStart(2, "0");
    const nepDay = String(nepaliDate.getDate()).padStart(2, "0");

    return `${nepYear}-${nepMonth}-${nepDay}`;
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
    // Clean up any time portion
    const cleanDateStr = nepaliDateStr.split("T")[0];

    if (isNepaliDateString(cleanDateStr)) {
      // Parse Nepali date and convert to Gregorian
      const [year, month, day] = cleanDateStr.split("-").map(Number);

      // Validate
      if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
        return "";
      }

      const nepaliDate = new NepaliDate(year, month - 1, day);
      const jsDate = nepaliDate.toJsDate();

      // Return YYYY-MM-DD format (no timezone suffix to avoid issues)
      const gYear = jsDate.getFullYear();
      const gMonth = String(jsDate.getMonth() + 1).padStart(2, "0");
      const gDay = String(jsDate.getDate()).padStart(2, "0");

      return `${gYear}-${gMonth}-${gDay}`;
    }
    // Already Gregorian - clean it up
    return cleanDateStr;
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
  // Track last emitted value to prevent infinite loops
  const lastEmittedValue = useRef<string>("");

  // Convert input value (Gregorian) to Nepali for calendar display
  const nepaliValue = useMemo(() => {
    return gregorianToNepali(value);
  }, [value]);

  // Handle date change from Nepali calendar - convert to Gregorian for storage
  const handleDateChange = useCallback((nepaliDate: string) => {
    const gregorianDate = nepaliToGregorianISO(nepaliDate);

    // Prevent firing onChange if the value hasn't actually changed
    // This stops the infinite loop / haywire behavior
    if (gregorianDate === lastEmittedValue.current) {
      return;
    }

    // Also check if it matches the current value (accounting for format differences)
    const currentClean = value ? value.split("T")[0] : "";
    if (gregorianDate === currentClean) {
      return;
    }

    lastEmittedValue.current = gregorianDate;
    onChange(gregorianDate);
  }, [onChange, value]);

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
