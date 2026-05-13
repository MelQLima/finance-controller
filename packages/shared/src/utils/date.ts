import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";

export function getMonthBounds(month?: string) {
  const base = month ? new Date(`${month}-01T00:00:00`) : new Date();
  return {
    start: format(startOfMonth(base), "yyyy-MM-dd"),
    end: format(endOfMonth(base), "yyyy-MM-dd"),
  };
}

export function getFutureMonths(total = 6) {
  return Array.from({ length: total }).map((_, index) => format(addMonths(new Date(), index), "yyyy-MM"));
}
