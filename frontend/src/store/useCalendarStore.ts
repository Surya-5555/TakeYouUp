import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Global state management for the physical 3D calendar.
 * Handles month navigation and persistent notes for both monthly and daily views.
 */
export interface CalendarState {
  activeDisplayMonthIso: string;
  monthlyPlannerAgendas: Record<string, string[]>;
  dailyHabitNotes: Record<string, string[]>;

  updateDisplayMonth: (date: Date) => void;
  updateMonthlyAgendaLine: (monthKey: string, index: number, content: string) => void;
  saveDailyChecklist: (dateKey: string, notes: string[]) => void;
}

type PersistedCalendarState = Partial<
  Pick<CalendarState, "activeDisplayMonthIso" | "monthlyPlannerAgendas" | "dailyHabitNotes">
>;

const LEGACY_DEFAULT_MONTH_ISO = new Date(2021, 0, 1).toISOString();

/**
 * Returns a standardized ISO string for the 15th of the current month at noon.
 * This prevents timezone offsets from shifting the month during cross-boundary loads.
 */
export function getCurrentMonthIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month, 15, 12, 0, 0, 0).toISOString();
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      activeDisplayMonthIso: getCurrentMonthIso(),
      monthlyPlannerAgendas: {},
      dailyHabitNotes: {},

      updateDisplayMonth: (date: Date) => {
        const standardMonthIso = new Date(
          date.getFullYear(),
          date.getMonth(),
          15,
          12,
          0,
          0,
          0
        ).toISOString();
        set({ activeDisplayMonthIso: standardMonthIso });
      },

      updateMonthlyAgendaLine: (monthKey, index, content) => {
        set((state) => {
          const currentAgendas = [...(state.monthlyPlannerAgendas[monthKey] || Array(6).fill(""))];
          currentAgendas[index] = content;
          return {
            monthlyPlannerAgendas: {
              ...state.monthlyPlannerAgendas,
              [monthKey]: currentAgendas,
            },
          };
        });
      },

      saveDailyChecklist: (dateKey, notes) => {
        set((state) => ({
          dailyHabitNotes: {
            ...state.dailyHabitNotes,
            [dateKey]: notes,
          },
        }));
      },
    }),
    {
      name: "cal-physical-ux-data",
      storage: createJSONStorage(() => localStorage),
      version: 4,

      // Month navigation is transient (always starts on today), while notes are persistent.
      partialize: (state) => {
        const { activeDisplayMonthIso, ...persistentNotes } = state;
        return persistentNotes;
      },

      migrate: (persistedState, version) => {
        const legacyState = (persistedState as any) || {};

        if (version < 4) {
          return {
            activeDisplayMonthIso: getCurrentMonthIso(),
            monthlyPlannerAgendas: legacyState.monthlyPlannerAgendas || legacyState.monthNotes || {},
            dailyHabitNotes: legacyState.dailyHabitNotes || legacyState.dayNotes || {},
          };
        }
        return legacyState;
      },
    }
  )
);
