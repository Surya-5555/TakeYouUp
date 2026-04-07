import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format
} from 'date-fns';

/**
 * Generates an array of Date objects representing the grid of a calendar month.
 * It pads the beginning and end of the grid with days from the previous and next
 * months to ensure the grid always starts on a Sunday and ends on a Saturday,
 * creating a perfect matrix (usually 5 or 6 weeks).
 */
export function getMonthGrid(currentDate: Date): Date[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // We want the calendar grid to start on the Sunday of the first week of the month
  const startDate = startOfWeek(monthStart);
  
  // And end on the Saturday of the last week of the month
  const endDate = endOfWeek(monthEnd);

  // Generate all days in between
  return eachDayOfInterval({
    start: startDate,
    end: endDate
  });
}

/**
 * Checks if a given date is in the provided target month.
 */
export function isDateInMonth(date: Date, targetMonth: Date): boolean {
  return isSameMonth(date, targetMonth);
}

/**
 * Formats a date to just the day number (e.g. "1" - "31")
 */
export function formatDayNumber(date: Date): string {
  return format(date, 'd');
}

/**
 * Check if the given date is today
 */
export function checkIsToday(date: Date): boolean {
  return isToday(date);
}
