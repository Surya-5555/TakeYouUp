import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, getDay } from "date-fns";

export function generateCalendarGrid(currentMonth: Date): Date[][] {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rows: Date[][] = [];
  let day = startDate;

  while (day <= endDate) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    rows.push(week);
  }
  return rows;
}

export const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
