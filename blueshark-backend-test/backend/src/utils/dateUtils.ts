// src/utils/dateUtils.ts
import NepaliDate from 'nepali-date-converter';

/**
 * Check if a date string is a Nepali date (year > 2050)
 * Nepali years are in the 2080s, Gregorian years are in the 2020s
 */
export const isNepaliDateString = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length < 1) return false;
  const year = parseInt(parts[0]);
  return year > 2050; // Nepali years are 2080+, Gregorian are 2024+
};

/**
 * Convert a Nepali date string (YYYY-MM-DD) to a JavaScript Date object
 * If the date is already Gregorian, it returns it as-is
 *
 * @param dateStr - Date string in format "YYYY-MM-DD" (can be Nepali or Gregorian)
 * @returns JavaScript Date object in Gregorian calendar
 */
export const convertToGregorianDate = (dateStr: string): Date => {
  if (!dateStr) {
    return new Date();
  }

  // Check if it's a Nepali date (year > 2050)
  if (isNepaliDateString(dateStr)) {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);

      // NepaliDate uses 0-indexed months (0-11), but our input is 1-indexed (1-12)
      const nepaliDate = new NepaliDate(year, month - 1, day);

      // Convert to JavaScript Date (Gregorian)
      const gregorianDate = nepaliDate.toJsDate();

      return gregorianDate;
    } catch {
      // Fallback to current date if conversion fails
      return new Date();
    }
  }

  // It's already a Gregorian date, parse normally
  return new Date(dateStr);
};

/**
 * Convert a Gregorian Date to Nepali date string (YYYY-MM-DD)
 * Useful for displaying dates in Nepali format
 *
 * @param date - JavaScript Date object
 * @returns Nepali date string in format "YYYY-MM-DD"
 */
export const convertToNepaliDateString = (date: Date): string => {
  try {
    const nepaliDate = new NepaliDate(date);
    const year = nepaliDate.getYear();
    const month = String(nepaliDate.getMonth() + 1).padStart(2, '0'); // 0-indexed to 1-indexed
    const day = String(nepaliDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().split('T')[0];
  }
};

/**
 * Parse a date string that could be either Nepali or Gregorian
 * and return a proper Date object for database storage
 *
 * This is the main function to use when storing work_date
 */
export const parseWorkDate = (dateStr: string | undefined | null): Date | undefined => {
  if (!dateStr) return undefined;
  return convertToGregorianDate(dateStr);
};
