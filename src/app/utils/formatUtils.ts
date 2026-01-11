/**
 * Frontend Formatting Utilities for Gaamma
 *
 * Contains helper functions for formatting display values
 */

/**
 * Convert full unit names to abbreviated versions for table display
 * @param unit - Full unit name (e.g., "Kilogram", "Meter", "Piece")
 * @returns Abbreviated unit (e.g., "Kg", "m", "pcs")
 */
export const formatUnitShort = (unit: string | null | undefined): string => {
  if (!unit) return "-";

  const unitLower = unit.toLowerCase().trim();

  const unitMap: Record<string, string> = {
    kilogram: "Kg",
    kg: "Kg",
    meter: "m",
    metre: "m",
    m: "m",
    piece: "pcs",
    pieces: "pcs",
    pcs: "pcs",
    liter: "L",
    litre: "L",
    l: "L",
    gram: "g",
    g: "g",
    centimeter: "cm",
    cm: "cm",
    millimeter: "mm",
    mm: "mm",
    yard: "yd",
    yd: "yd",
    foot: "ft",
    feet: "ft",
    ft: "ft",
    inch: "in",
    inches: "in",
    in: "in",
  };

  return unitMap[unitLower] || unit;
};
