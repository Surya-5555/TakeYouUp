"use client";

import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getDay } from "date-fns";
import { Search, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const MOCK_EVENTS: Record<string, { time: string; title: string; col: number }[]> = {
  "2021-01-20": [
    { time: "8:30", title: "School", col: 1 },
    { time: "10:00", title: "DailyUI #38", col: 1 },
    { time: "12:30", title: "School", col: 2 },
    { time: "17:00", title: "DailyUI #38", col: 2 },
  ],
};

const MOCK_HIGHLIGHTS = ["2021-01-03", "2021-01-05", "2021-01-15", "2021-01-20"];

export function TrendyCalendar() {
  // Use Jan 2021 to perfectly match the mockup's day-to-date alignment
  const [currentMonth, setCurrentMonth] = useState(new Date(2021, 0, 1));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2021, 0, 20));

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
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

  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="relative flex flex-col items-center">
      {/* 3D Spiral Binding Header */}
      <div className="relative w-full max-w-[95%] md:max-w-[700px] z-30 flex flex-col items-center justify-end h-[40px] md:h-[45px] -mb-[6px] pointer-events-none drop-shadow-xl">
        {/* Wall Hook */}
        <div className="w-[8px] md:w-[10px] h-[12px] md:h-[16px] bg-gradient-to-b from-[#e6c255] via-[#ca9e2e] to-[#735414] rounded-sm absolute top-[-6px] md:top-[-8px] shadow-[0_4px_6px_rgba(0,0,0,0.4)] z-0" />

        {/* Main Hanger Wire */}
        <svg className="absolute top-[2px] w-[60px] md:w-[70px] h-[25px] md:h-[30px] z-10 overflow-visible" viewBox="0 0 80 36" fill="none">
          <path d="M40 0 C 44 0, 45 4, 46 10 L 52 26 C 54 32, 56 36, 68 36 L 80 36" stroke="url(#wireGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 0 C 36 0, 35 4, 34 10 L 28 26 C 26 32, 24 36, 12 36 L 0 36" stroke="url(#wireGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="wireGrad" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f3d06a" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#8c6a18" />
            </linearGradient>
          </defs>
        </svg>

        {/* Coils Container */}
        <div className="flex w-full justify-between items-end px-[16px] md:px-[24px] z-20 h-full">
          {Array.from({ length: 32 }).map((_, i) => {
            // Leave gap in center (index 15, 16) for the hanger
            if (i === 15 || i === 16) {
              return <div key={i} className="w-[6px] md:w-[8px]" />;
            }
            // On very small screens we might want fewer, but 32 is a good compromise for mobile
            return (
              <div key={i} className="relative w-[6px] md:w-[8px] h-[14px] md:h-[18px] flex items-end justify-center">
                {/* Dark Hole */}
                <div className="absolute bottom-[2px] w-[4px] md:w-[6px] h-[6px] md:h-[8px] bg-[#1a1a1c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] rounded-full z-0" />
                {/* Golden Coil Arch */}
                <svg className="absolute bottom-[4px] w-[10px] md:w-[12px] h-[16px] md:h-[20px] z-10 overflow-visible drop-shadow-[0_2px_1px_rgba(0,0,0,0.5)]" viewBox="0 0 14 24" fill="none">
                  <path d="M 2 24 C -2 18, -2 4, 6 2 C 14 0, 16 10, 10 24" stroke="url(#coilGrad)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="coilGrad" x1="0" y1="0" x2="14" y2="24" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#fef0a5" />
                      <stop offset="30%" stopColor="#e3ba3c" />
                      <stop offset="80%" stopColor="#a37616" />
                      <stop offset="100%" stopColor="#573e04" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-[95%] max-w-[700px] bg-[#313235] shadow-2xl relative font-sans select-none overflow-hidden pb-6">
        {/* Top Image Section */}
        <div
          className="w-full h-[180px] md:h-[230px] bg-[#e0e0e0] relative z-20"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 30px), 50% 100%, 0 calc(100% - 30px))" }}
        >
          <img
            src="/portrait.png"
            alt="Calendar Feature"
            className="w-full h-full object-cover object-[center_45%]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800&auto=format&fit=crop";
            }}
          />

          {/* Bottom fade mask connecting to calendar body */}
          <div className="absolute bottom-0 left-0 w-full h-[60px] bg-gradient-to-t from-[#313235]/90 to-transparent pointer-events-none" />
        </div>

        {/* Main Content Area: Notes on top/left, Calendar on bottom/right */}
        <div className="flex flex-col md:flex-row w-full pt-6 md:pt-10 -mt-[30px] px-6 md:px-8 gap-6 md:gap-10 relative z-10">
          
          {/* LEFT/TOP: Notes Section */}
          <div className="md:flex-[0.35] flex flex-col mt-2 md:pr-8 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0">
            <h3 className="text-[10px] md:text-[12px] font-bold text-white/90 tracking-widest mb-4 uppercase">Notes</h3>
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="border-b border-white/10 h-3 md:h-4 w-full"></div>
              <div className="border-b border-white/10 h-3 md:h-4 w-full"></div>
              <div className="border-b border-white/10 h-3 md:h-4 w-full"></div>
              <div className="border-b border-white/10 h-3 md:h-4 w-full md:hidden lg:block"></div>
            </div>
          </div>

          {/* RIGHT/BOTTOM: Calendar Section */}
          <div className="md:flex-[0.65] flex flex-col md:pl-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 md:pb-4">
              <h2 className="text-[18px] md:text-[20px] font-semibold text-white tracking-wide uppercase">
                2021 {format(currentMonth, "MMMM")}
              </h2>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 px-0 pb-3">
              {dayNames.map((dayName, idx) => {
                const isSelectedDayOfWeek = selectedDate && getDay(selectedDate) === (idx === 6 ? 0 : idx + 1);
                return (
                  <div
                    key={dayName}
                    className={cn(
                      "text-[10px] sm:text-[11px] font-bold tracking-widest text-center",
                      isSelectedDayOfWeek ? "text-[#df8c2c]" : "text-[#e0e0e0]"
                    )}
                  >
                    {dayName}
                  </div>
                );
              })}
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-col">
              {rows.map((week, weekIndex) => {
                const isWeekSelected = week.some((d) => selectedDate && isSameDay(d, selectedDate));
                let selectedDayIndexInWeek = -1;
                if (isWeekSelected) {
                  selectedDayIndexInWeek = week.findIndex((d) => selectedDate && isSameDay(d, selectedDate));
                }

                return (
                  <React.Fragment key={weekIndex}>
                    <div className="grid grid-cols-7 px-1 py-0 relative z-20 bg-[#313235]">
                      {week.map((date, dayIndex) => {
                        const formattedDate = format(date, "d");
                        const isCurrentMonth = isSameMonth(date, currentMonth);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const dateKey = format(date, "yyyy-MM-dd");
                        const isEventDay = MOCK_HIGHLIGHTS.includes(dateKey);

                        return (
                          <div key={dayIndex} className="relative flex justify-center py-[2px]">
                            <button
                              onClick={() => setSelectedDate(date)}
                              className={cn(
                                "w-8 h-8 flex items-center justify-center rounded-full text-[13px] transition-colors relative z-10",
                                !isCurrentMonth ? "text-[#a0a0a0]/40" : "text-white font-medium",
                                (isSelected || isEventDay) && isCurrentMonth ? "text-[#df8c2c] font-bold" : ""
                              )}
                            >
                              {formattedDate}
                            </button>

                            {/* Selected Outline Container */}
                            {isSelected && (
                              <div className="absolute inset-0 m-auto flex flex-col items-center justify-center pointer-events-none z-0">
                                <motion.div
                                  layoutId="selected-date-outline"
                                  className="w-[28px] h-[28px] rounded-full border-[1.5px] border-[#df8c2c] z-0 opacity-40"
                                  initial={false}
                                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Expanded Event View inline */}
                    <AnimatePresence initial={false}>
                      {isWeekSelected && selectedDate && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          className="overflow-hidden relative z-10"
                        >
                          <div className="pt-[14px] relative bg-[#313235]">
                            <div className="bg-[#df8c2c] w-full px-4 py-4 flex items-center justify-between shadow-inner relative z-10 rounded-md mb-2">
                              <div className="flex-1 w-full pl-2 pr-2">
                                {MOCK_EVENTS[format(selectedDate, "yyyy-MM-dd")] ? (
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-[6px]">
                                    <div className="flex flex-col gap-[6px]">
                                      {MOCK_EVENTS[format(selectedDate, "yyyy-MM-dd")].filter(e => e.col === 1).map((ev, i) => (
                                        <div key={i} className="text-[12px] font-medium text-white tracking-wide">
                                          {ev.time} - {ev.title}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex flex-col gap-[6px]">
                                      {MOCK_EVENTS[format(selectedDate, "yyyy-MM-dd")].filter(e => e.col === 2).map((ev, i) => (
                                        <div key={i} className="text-[12px] font-medium text-white tracking-wide">
                                          {ev.time} - {ev.title}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-[13px] font-medium text-white/90">
                                    No events for this day
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
