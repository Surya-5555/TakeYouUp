import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CalendarState {
  currentMonth: string; // ISO String
  selectedDate: string; // ISO String
  dayNotes: Record<string, string[]>; // yyyy-MM-dd -> array of 5 lines
  setCurrentMonth: (date: Date) => void;
  setSelectedDate: (date: Date) => void;
  setDayNote: (dateKey: string, lineIndex: number, content: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      currentMonth: new Date(2021, 0, 1).toISOString(),
      selectedDate: new Date(2021, 0, 20).toISOString(),
      dayNotes: {},
      setCurrentMonth: (date: Date) => set({ currentMonth: date.toISOString() }),
      setSelectedDate: (date: Date) => set({ selectedDate: date.toISOString() }),
      setDayNote: (dateKey: string, lineIndex: number, content: string) =>
        set((state) => {
          const notes = state.dayNotes[dateKey] || ["", "", "", "", ""];
          const newNotes = [...notes];
          newNotes[lineIndex] = content;
          return {
            dayNotes: {
              ...state.dayNotes,
              [dateKey]: newNotes,
            },
          };
        }),
    }),
    {
      name: "calendar-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
