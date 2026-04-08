import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type InteractionMode = "range" | "notes";

export interface SavedRange {
  id: string;
  start: string;
  end: string;
}

export interface CalendarState {
  activeDisplayMonthIso: string;
  monthlyPlannerAgendas: Record<string, string[]>;
  dailyHabitNotes: Record<string, string[]>;
  rangeStart: string | null;
  rangeEnd: string | null;
  interactionMode: InteractionMode;
  savedRanges: SavedRange[];

  updateDisplayMonth: (date: Date) => void;
  updateMonthlyAgendaLine: (monthKey: string, index: number, content: string) => void;
  saveDailyChecklist: (dateKey: string, notes: string[]) => void;
  setRangeStart: (dateKey: string | null) => void;
  setRangeEnd: (dateKey: string | null) => void;
  clearTempRange: () => void;
  clearRange: () => void; 
  setInteractionMode: (mode: InteractionMode) => void;
  setFullDayNote: (dateKey: string, notes: string[]) => void;
  addSavedRange: (start: string, end: string) => void;
  removeSavedRange: (id: string) => void;
}

const LEGACY_DEFAULT_MONTH_ISO = new Date(2021, 0, 1).toISOString();

export function getCurrentMonthIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month, 15, 12, 0, 0, 0).toISOString();
}

function generateRangeId(): string {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      activeDisplayMonthIso: getCurrentMonthIso(),
      monthlyPlannerAgendas: {},
      dailyHabitNotes: {},
      rangeStart: null,
      rangeEnd: null,
      interactionMode: "notes" as InteractionMode,
      savedRanges: [],

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

      setRangeStart: (dateKey) => set({ rangeStart: dateKey }),
      setRangeEnd: (dateKey) => set({ rangeEnd: dateKey }),
      clearTempRange: () => set({ rangeStart: null, rangeEnd: null }),
      clearRange: () => set({ rangeStart: null, rangeEnd: null }),
      setInteractionMode: (mode) => set({ interactionMode: mode, rangeStart: null, rangeEnd: null }),
      setFullDayNote: (dateKey, notes) => {
        set((state) => ({
          dailyHabitNotes: {
            ...state.dailyHabitNotes,
            [dateKey]: notes,
          },
        }));
      },

      addSavedRange: (start, end) => {
        set((state) => ({
          savedRanges: [
            ...state.savedRanges,
            { id: generateRangeId(), start, end },
          ],
        }));
      },

      removeSavedRange: (id) => {
        set((state) => ({
          savedRanges: state.savedRanges.filter((r) => r.id !== id),
        }));
      },
    }),
    {
      name: "cal-physical-ux-data",
      storage: createJSONStorage(() => localStorage),
      version: 5,

      partialize: (state) => {
        const {
          activeDisplayMonthIso,
          rangeStart,
          rangeEnd,
          interactionMode,
          ...persistentData
        } = state;
        return persistentData;
      },

      migrate: (persistedState, version) => {
        const legacyState = (persistedState as any) || {};

        if (version < 4) {
          return {
            activeDisplayMonthIso: getCurrentMonthIso(),
            monthlyPlannerAgendas: legacyState.monthlyPlannerAgendas || legacyState.monthNotes || {},
            dailyHabitNotes: legacyState.dailyHabitNotes || legacyState.dayNotes || {},
            savedRanges: [],
          };
        }
        if (version < 5) {
          return {
            ...legacyState,
            savedRanges: legacyState.savedRanges || [],
          };
        }
        return legacyState;
      },
    }
  )
);
