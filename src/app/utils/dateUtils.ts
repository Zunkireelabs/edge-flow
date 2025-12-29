/**
 * Frontend Date Utility for BlueShark
 *
 * Handles conversion between:
 * - Gregorian/ISO dates (for storage)
 * - Nepali dates (for display) in format: 2082-09-07
 */

import NepaliDate from "nepali-date-converter";

/**
 * Check if a date string is a Nepali date (year > 2050)
 */
export const isNepaliDateString = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  if (parts.length < 1) return false;
  const year = parseInt(parts[0]);
  return year > 2050;
};

/**
 * Convert Gregorian/ISO date to Nepali date string for DISPLAY
 * @param date - ISO date string, Date object, or null/undefined
 * @returns Nepali date string "2082-09-07" or "-" if invalid
 */
export const formatNepaliDate = (
  date: string | Date | null | undefined
): string => {
  if (!date) return "-";

  try {
    // If it's a string, check if it might already be a Nepali date (year > 2050)
    if (typeof date === "string") {
      const yearMatch = date.match(/^(\d{4})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        // If year is in Nepali range (2050-2100), assume it's already Nepali
        if (year > 2050 && year < 2150) {
          // Already a Nepali date - format it properly
          const parts = date.split(/[-T]/);
          if (parts.length >= 3) {
            const y = parts[0];
            const m = parts[1].padStart(2, "0");
            const d = parts[2].substring(0, 2).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }
        }
      }
    }

    const jsDate = typeof date === "string" ? new Date(date) : date;

    // Validate the date
    if (isNaN(jsDate.getTime())) return "-";

    // Check for 1970 epoch bug (invalid dates default to Jan 1, 1970)
    if (jsDate.getFullYear() === 1970 && jsDate.getMonth() === 0) return "-";

    // Convert to Nepali
    const nepaliDate = new NepaliDate(jsDate);
    const year = nepaliDate.getYear();
    const month = String(nepaliDate.getMonth() + 1).padStart(2, "0");
    const day = String(nepaliDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return "-";
  }
};

/**
 * Convert Nepali date string to ISO/Gregorian for API storage
 * @param nepaliDateStr - Nepali date string "2082-09-07" or Gregorian "2024-12-22"
 * @returns ISO date string or null
 */
export const nepaliToGregorian = (
  nepaliDateStr: string | null | undefined
): string | null => {
  if (!nepaliDateStr) return null;

  try {
    if (isNepaliDateString(nepaliDateStr)) {
      // Nepali date - convert to Gregorian
      const [year, month, day] = nepaliDateStr.split("-").map(Number);
      const nepaliDate = new NepaliDate(year, month - 1, day);
      return nepaliDate.toJsDate().toISOString();
    }
    // Already Gregorian - just convert to ISO
    return new Date(nepaliDateStr).toISOString();
  } catch {
    return null;
  }
};

/**
 * Convert ISO/Gregorian date to Nepali date string (for input fields)
 * @param isoDate - ISO date string or Date object
 * @returns Nepali date string "2082-09-07" or empty string
 */
export const gregorianToNepaliString = (
  isoDate: string | Date | null | undefined
): string => {
  if (!isoDate) return "";

  try {
    const jsDate = typeof isoDate === "string" ? new Date(isoDate) : isoDate;

    if (isNaN(jsDate.getTime())) return "";
    if (jsDate.getFullYear() === 1970 && jsDate.getMonth() === 0) return "";

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
 * Check if a date is valid (not 1970 epoch, not Invalid Date)
 */
export const isValidDate = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;
  if (d.getFullYear() === 1970 && d.getMonth() === 0 && d.getDate() === 1) {
    return false;
  }
  return true;
};

/**
 * Get today's date in Nepali format
 * @returns Nepali date string "2082-09-07"
 */
export const getTodayNepali = (): string => {
  const today = new Date();
  const nepaliDate = new NepaliDate(today);
  const year = nepaliDate.getYear();
  const month = String(nepaliDate.getMonth() + 1).padStart(2, "0");
  const day = String(nepaliDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
