"use client";

import React from "react";
import { format, isSameMonth, isSameDay, getDay, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/store/useCalendarStore";
import { generateCalendarGrid, dayNames } from "@/lib/dateUtils";

export function TrendyCalendar() {
  const { currentMonth: currentMonthStr, selectedDate: selectedDateStr, dayNotes, setCurrentMonth, setSelectedDate, setDayNote } = useCalendarStore();
  
  const currentMonth = parseISO(currentMonthStr);
  const selectedDate = parseISO(selectedDateStr);
  const rows = generateCalendarGrid(currentMonth);

  return (
    <div className="relative flex flex-col items-center">
      {/* 3D Spiral Binding Header */}
      <div className="relative w-full max-w-[95%] md:max-w-[1000px] z-30 flex flex-col items-center justify-end h-[40px] md:h-[45px] -mb-[6px] pointer-events-none drop-shadow-xl">
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
        <div className="flex w-full justify-between items-end px-[16px] md:px-[32px] z-20 h-full">
          {Array.from({ length: 50 }).map((_, i) => {
            if (i === 24 || i === 25) return <div key={i} className="w-[6px] md:w-[8px]" />;
            return (
              <div key={i} className="relative w-[5px] md:w-[7px] h-[14px] md:h-[18px] flex items-end justify-center">
                <div className="absolute bottom-[2px] w-[3px] md:w-[5px] h-[6px] md:h-[8px] bg-[#1a1a1c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] rounded-full z-0" />
                <svg className="absolute bottom-[4px] w-[9px] md:w-[11px] h-[16px] md:h-[20px] z-10 overflow-visible drop-shadow-[0_2px_1px_rgba(0,0,0,0.5)]" viewBox="0 0 14 24" fill="none">
                  <path d="M 2 24 C -2 18, -2 4, 6 2 C 14 0, 16 10, 10 24" stroke="url(#coilGrad)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="coilGrad" x1="0" y1="0" x2="14" y2="24" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#fef0a5" /><stop offset="30%" stopColor="#e3ba3c" /><stop offset="80%" stopColor="#a37616" /><stop offset="100%" stopColor="#573e04" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-[95%] max-w-[1000px] bg-[#313235] shadow-2xl relative font-sans select-none overflow-hidden pb-4">
        {/* Top Image Section */}
        <div
          className="w-full h-[200px] md:h-[320px] bg-[#e0e0e0] relative z-20"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 30px), 50% 100%, 0 calc(100% - 30px))" }}
        >
          <img
            src="/portrait.png"
            alt="Calendar Feature"
            className="w-full h-full object-cover object-[center_35%]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800&auto=format&fit=crop";
            }}
          />
          <div className="absolute bottom-0 left-0 w-full h-[60px] bg-gradient-to-t from-[#313235]/90 to-transparent pointer-events-none" />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row w-full pt-2 md:pt-4 px-6 md:px-12 gap-4 md:gap-16 relative z-10">
          
          {/* LEFT/TOP: Notes Section */}
          <div className="md:flex-[0.25] flex flex-col mt-1 md:pr-10 border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0">
            <h3 className="text-[10px] md:text-[11px] font-bold text-white/90 tracking-widest mb-2 uppercase">General Notes</h3>
            <div className="flex flex-col gap-2">
              <div className="border-b border-white/10 h-3 w-full"></div>
              <div className="border-b border-white/10 h-3 w-full"></div>
            </div>
          </div>

          {/* RIGHT/BOTTOM: Calendar Section */}
          <div className="md:flex-[0.75] flex flex-col md:pl-6">
            <div className="flex items-center justify-between pb-2 md:pb-4">
              <h2 className="text-[16px] md:text-[22px] font-semibold text-white tracking-[0.2em] uppercase">
                {format(currentMonth, "yyyy MMMM")}
              </h2>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 px-0 pb-2">
              {dayNames.map((dayName, idx) => {
                const isSelectedDayOfWeek = getDay(selectedDate) === (idx === 6 ? 0 : idx + 1);
                return (
                  <div key={dayName} className={cn("text-[10px] md:text-[12px] font-bold tracking-widest text-center", isSelectedDayOfWeek ? "text-[#df8c2c]" : "text-[#e0e0e0]")}>
                    {dayName}
                  </div>
                );
              })}
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-col">
              {rows.map((week, weekIndex) => {
                const isWeekSelected = week.some((d) => isSameDay(d, selectedDate));
                return (
                  <React.Fragment key={weekIndex}>
                    <div className="grid grid-cols-7 px-1 py-0 relative z-20 bg-[#313235]">
                      {week.map((date, dayIndex) => {
                        const formattedDate = format(date, "d");
                        const isCurrMonth = isSameMonth(date, currentMonth);
                        const isSelected = isSameDay(date, selectedDate);
                        const dateKey = format(date, "yyyy-MM-dd");
                        const hasNote = dayNotes[dateKey]?.some(n => n.trim().length > 0);

                        return (
                          <div key={dayIndex} className="relative flex justify-center py-[2px]">
                            <button
                              onClick={() => setSelectedDate(date)}
                              className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-full text-[14px] transition-colors relative z-10",
                                !isCurrMonth ? "text-[#a0a0a0]/40" : "text-white font-medium",
                                isSelected ? "text-[#313235] font-bold bg-[#df8c2c] shadow-lg shadow-[#df8c2c]/20" : "",
                                hasNote && !isSelected ? "border border-[#df8c2c]/40" : ""
                              )}
                            >
                              {formattedDate}
                            </button>
                            {isSelected && (
                              <motion.div layoutId="sel-bg" className="absolute inset-0 m-auto w-[36px] h-[36px] rounded-full bg-[#df8c2c] z-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Lined Note Pad View */}
                    <AnimatePresence>
                      {isWeekSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden relative z-10 py-4"
                        >
                          <div className="bg-[#f5f5f5] rounded-lg p-6 shadow-2xl relative overflow-hidden">
                            {/* Blue left-vertical line (notebook style) */}
                            <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-red-200/50" />
                            <div className="relative pl-8">
                              <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                                Notes for {format(selectedDate, "do MMMM")}
                              </h4>
                              <div className="flex flex-col">
                                {Array.from({ length: 5 }).map((_, i) => {
                                  const dateKey = format(selectedDate, "yyyy-MM-dd");
                                  const lines = dayNotes[dateKey] || ["", "", "", "", ""];
                                  return (
                                    <input
                                      key={i}
                                      value={lines[i] || ""}
                                      onChange={(e) => setDayNote(dateKey, i, e.target.value)}
                                      placeholder={`Line ${i + 1}...`}
                                      className="w-full bg-transparent border-b border-blue-100 h-10 text-gray-800 focus:outline-none focus:border-blue-300 placeholder:text-gray-300 font-medium text-[15px]"
                                    />
                                  );
                                })}
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
