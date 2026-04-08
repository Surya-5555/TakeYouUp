import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CalendarState {
  currentMonth: string; // ISO String
  rangeStart: string | null;
  rangeEnd: string | null;
  monthNotes: Record<string, string[]>; // yyyy-MM -> 5 lines
  dayNotes: Record<string, string[]>; // yyyy-MM-dd -> 5 lines
  setCurrentMonth: (date: Date) => void;
  setRangeStart: (date: Date | null) => void;
  setRangeEnd: (date: Date | null) => void;
  setMonthNote: (monthKey: string, index: number, content: string) => void;
  setDayNote: (dateKey: string, lineIndex: number, content: string) => void;
  setFullDayNote: (dateKey: string, notes: string[]) => void;
}

type PersistedCalendarState = Partial<Pick<CalendarState, "currentMonth" | "rangeStart" | "rangeEnd" | "monthNotes" | "dayNotes">>;

const LEGACY_DEFAULT_MONTH = new Date(2021, 0, 1).toISOString();

function getCurrentMonthIso(): string {
  const now = new Date();
  // Use mid-month noon to avoid timezone edge cases crossing month boundaries.
  return new Date(now.getFullYear(), now.getMonth(), 15, 12, 0, 0, 0).toISOString();
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      currentMonth: getCurrentMonthIso(),
      rangeStart: null,
      rangeEnd: null,
      monthNotes: {},
      dayNotes: {},
      setCurrentMonth: (date: Date) => set({ currentMonth: date.toISOString() }),
      setRangeStart: (date: Date | null) => set({ rangeStart: date ? date.toISOString() : null }),
      setRangeEnd: (date: Date | null) => set({ rangeEnd: date ? date.toISOString() : null }),
      setMonthNote: (monthKey: string, index: number, content: string) =>
        set((state) => {
          const notes = state.monthNotes[monthKey] || ["", "", "", ""];
          const newNotes = [...notes];
          newNotes[index] = content;
          return {
            monthNotes: {
              ...state.monthNotes,
              [monthKey]: newNotes,
            },
          };
        }),
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
      setFullDayNote: (dateKey: string, notes: string[]) =>
        set((state) => ({
          dayNotes: {
            ...state.dayNotes,
            [dateKey]: notes,
          },
        })),
    }),
    {
      name: "calendar-store",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState, _version) => {
        const state = (persistedState as PersistedCalendarState) || {};
        const currentMonth =
          !state.currentMonth || state.currentMonth === LEGACY_DEFAULT_MONTH
            ? getCurrentMonthIso()
            : state.currentMonth;

        return {
          currentMonth,
          rangeStart: state.rangeStart ?? null,
          rangeEnd: state.rangeEnd ?? null,
          monthNotes: state.monthNotes ?? {},
          dayNotes: state.dayNotes ?? {},
        };
      },
    }
  )
);
