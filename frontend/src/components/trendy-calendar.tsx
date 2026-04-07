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
      <div className="relative w-full max-w-[340px] z-30 flex flex-col items-center justify-end h-[45px] -mb-[6px] pointer-events-none drop-shadow-xl">
        {/* Wall Hook */}
        <div className="w-[10px] h-[16px] bg-gradient-to-b from-[#e6c255] via-[#ca9e2e] to-[#735414] rounded-sm absolute top-[-8px] shadow-[0_4px_6px_rgba(0,0,0,0.4)] z-0" />

        {/* Main Hanger Wire */}
        <svg className="absolute top-[2px] w-[70px] h-[30px] z-10 overflow-visible" viewBox="0 0 80 36" fill="none">
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
        <div className="flex w-full justify-between items-end px-[20px] z-20 h-full">
          {Array.from({ length: 24 }).map((_, i) => {
            // Leave gap in center (index 11, 12) for the hanger
            if (i === 11 || i === 12) {
              return <div key={i} className="w-[8px]" />;
            }
            return (
              <div key={i} className="relative w-[8px] h-[18px] flex items-end justify-center">
                {/* Dark Hole */}
                <div className="absolute bottom-[2px] w-[6px] h-[8px] bg-[#1a1a1c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] rounded-full z-0" />
                {/* Golden Coil Arch */}
                <svg className="absolute bottom-[4px] w-[12px] h-[20px] z-10 overflow-visible drop-shadow-[0_2px_1px_rgba(0,0,0,0.5)]" viewBox="0 0 14 24" fill="none">
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

      <div className="w-full max-w-[340px] bg-[#313235] shadow-2xl relative font-sans select-none overflow-hidden pb-4">
        {/* Top Image Section - Clipped into a center V shape at the bottom */}
        <div 
          className="w-full h-[220px] bg-[#e0e0e0] relative z-20"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 24px), 50% 100%, 0 calc(100% - 24px))" }}
        >
          <img
            src="/portrait.png"
            alt="Calendar Feature"
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800&auto=format&fit=crop";
            }}
          />

          {/* Bottom fade mask connecting to calendar body */}
          <div className="absolute bottom-0 left-0 w-full h-[40px] bg-gradient-to-t from-[#232325]/80 to-transparent pointer-events-none" />
        </div>

        {/* Header - moved up with negative margin to sit seamlessly under the V-cut */}
        <div className="flex items-center justify-between p-5 px-6 pb-4 bg-[#232325] pt-10 -mt-[24px] relative z-10">
          <h2 className="text-[22px] font-semibold text-white tracking-wide">
            {format(currentMonth, "MMMM")}
          </h2>
          <div className="flex items-center gap-4">
            <button className="text-white hover:text-white/80 transition" aria-label="Search">
              <Search className="w-[18px] h-[18px] stroke-[2.5]" />
            </button>
            <button className="text-white hover:text-white/80 transition" aria-label="More">
              <MoreVertical className="w-[18px] h-[18px] stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 px-3 pt-3 pb-2">
          {dayNames.map((dayName, idx) => {
            const isSelectedDayOfWeek = selectedDate && getDay(selectedDate) === (idx === 6 ? 0 : idx + 1);
            return (
              <div
                key={dayName}
                className={cn(
                  "text-[10px] font-bold tracking-wider text-center",
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
                <div className="grid grid-cols-7 px-3 py-[2px] relative z-20 bg-[#313235]">
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
                            !isCurrentMonth ? "text-[#a0a0a0]" : "text-white",
                            (isSelected || isEventDay) && isCurrentMonth ? "text-[#df8c2c]" : ""
                          )}
                        >
                          {formattedDate}
                        </button>

                        {/* Selected Outline Container */}
                        {isSelected && (
                          <div className="absolute inset-0 m-auto flex flex-col items-center justify-center pointer-events-none z-0">
                            <motion.div
                              layoutId="selected-date-outline"
                              className="w-[28px] h-[28px] rounded-full border-[1.5px] border-white z-0"
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
                        {/* Triangle pointer */}
                        <motion.div
                          className="absolute top-[4px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-[#df8c2c] z-20"
                          style={{
                            left: `calc(${(100 / 7) * selectedDayIndexInWeek}% + ${(100 / 14)}% - 8px)`
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        />

                        <div className="bg-[#df8c2c] w-full px-4 py-4 flex items-center justify-between shadow-inner relative z-10">
                          <button className="w-7 h-7 rounded-full border-[1.5px] border-white flex items-center justify-center shrink-0 hover:bg-white/10 transition">
                            <ChevronLeft className="w-[16px] h-[16px] text-white stroke-[2.5] -ml-[2px]" />
                          </button>

                          <div className="flex-1 w-full pl-5 pr-2">
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

                          <button className="w-7 h-7 rounded-full border-[1.5px] border-white flex items-center justify-center shrink-0 hover:bg-white/10 transition">
                            <ChevronRight className="w-[16px] h-[16px] text-white stroke-[2.5] -mr-[2px]" />
                          </button>
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
  );
}
