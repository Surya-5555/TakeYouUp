"use client";

import React, { useState } from "react";
import { format, isSameMonth, isSameDay, getDay, parseISO, isAfter, isBefore, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/store/useCalendarStore";
import { generateCalendarGrid, dayNames } from "@/lib/dateUtils";

export function TrendyCalendar() {
  const {
    currentMonth: curMonthStr,
    rangeStart: startStr,
    rangeEnd: endStr,
    monthNotes,
    dayNotes,
    setCurrentMonth,
    setRangeStart,
    setRangeEnd,
    setMonthNote,
    setDayNote
  } = useCalendarStore();

  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const [direction, setDirection] = useState(0);

  const changeMonth = (dir: number) => {
    setDirection(dir);
    setCurrentMonth(dir > 0 ? addMonths(parseISO(curMonthStr), 1) : subMonths(parseISO(curMonthStr), 1));
  };

  const currentMonth = parseISO(curMonthStr);
  const rangeStart = startStr ? parseISO(startStr) : null;
  const rangeEnd = endStr ? parseISO(endStr) : null;

  const rows = generateCalendarGrid(currentMonth);

  const handleDateClick = (date: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
    } else if (rangeStart && !rangeEnd) {
      if (isBefore(date, rangeStart)) {
        setRangeStart(date);
      } else {
        setRangeEnd(date);
      }
    }
  };

  const isInRange = (date: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    return isAfter(date, rangeStart) && isBefore(date, rangeEnd);
  };

  const isSelected = (date: Date) => {
    return (rangeStart && isSameDay(date, rangeStart)) || (rangeEnd && isSameDay(date, rangeEnd));
  };

  if (!hasMounted) return null;

  const flipVariants = {
    enter: (direction: number) => ({
      rotateX: direction > 0 ? -90 : 90,
      opacity: 0,
      y: direction > 0 ? 50 : -50,
      scale: 0.95
    }),
    center: {
      rotateX: 0,
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 220, damping: 25 }
    },
    exit: (direction: number) => ({
      rotateX: direction < 0 ? -90 : 90,
      opacity: 0,
      y: direction < 0 ? 50 : -50,
      scale: 0.95,
      transition: { type: "spring" as const, stiffness: 220, damping: 25 }
    })
  };

  return (
    <div className="relative flex flex-col items-center w-full">
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
              <stop offset="0%" stopColor="#f3d06a" /><stop offset="50%" stopColor="#d4af37" /><stop offset="100%" stopColor="#8c6a18" />
            </linearGradient>
          </defs>
        </svg>

        {/* Coils */}
        <div className="flex w-full justify-between items-end px-[16px] md:px-[32px] z-20 h-full">
          {Array.from({ length: 50 }).map((_, i) => {
            if (i === 24 || i === 25) return <div key={i} className="w-[6px] md:w-[8px]" />;
            return (
              <div key={i} className="relative w-[5px] md:w-[7px] h-[14px] md:h-[18px] flex items-end justify-center">
                <div className="absolute bottom-[2px] w-[3px] md:w-[5px] h-[6px] md:h-[8px] bg-[#1a1a1c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] rounded-full z-0" />
                <svg className="absolute bottom-[4px] w-[9px] md:w-[11px] h-[16px] md:h-[20px] z-10 overflow-visible drop-shadow-[0_2px_1px_rgba(0,0,0,0.5)]" viewBox="0 0 14 24" fill="none"><path d="M 2 24 C -2 18, -2 4, 6 2 C 14 0, 16 10, 10 24" stroke="url(#coilGrad)" strokeWidth="3" strokeLinecap="round" /><defs><linearGradient id="coilGrad" x1="0" y1="0" x2="14" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#fef0a5" /><stop offset="30%" stopColor="#e3ba3c" /><stop offset="80%" stopColor="#a37616" /><stop offset="100%" stopColor="#573e04" /></linearGradient></defs></svg>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-[95%] max-w-[1000px] relative font-sans select-none" style={{ perspective: "1500px" }}>
        {/* Invisible Ghost layer to maintain height during 3D absolute flips */}
        <div className="invisible pointer-events-none opacity-0 pb-4 h-[740px] md:h-[510px] w-full" aria-hidden="true"></div>

        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={currentMonth.toISOString()}
            custom={direction}
            variants={flipVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y < -100 || velocity.y < -400) {
                changeMonth(1); // Swipe UP (flip page away) -> Next Month
              } else if (offset.y > 100 || velocity.y > 400) {
                changeMonth(-1); // Swipe DOWN (flip back) -> Prev Month
              }
            }}
            className="absolute top-0 left-0 w-full bg-[#313235] shadow-2xl overflow-hidden pb-4 cursor-grab active:cursor-grabbing origin-top z-20"
          >
            {/* Hero Section Container */}
            <div className="relative w-full h-[180px] md:h-[280px] z-20 pointer-events-none">
              <div className="w-full h-full bg-[#1a1a1c] relative overflow-hidden" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 15px), 50% 100%, 0 calc(100% - 15px))" }}>
                {/* Branded Title */}
                <div className="absolute top-4 left-6 z-30 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <h1 className="text-white text-[14px] md:text-[20px] font-black tracking-[0.4em] uppercase opacity-95">TAKE YOU UP</h1>
                  <div className="w-12 h-[2px] bg-[#df8c2c] mt-1 shadow-lg" />
                </div>

                {/* Cinematic Blurred Background */}
                <img src="/portrait.png" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-125" />
                <div className="absolute inset-0 bg-black/10" />

                {/* Main Uncropped Portrait */}
                <img src="/portrait.png" className="absolute inset-0 w-full h-[120%] -top-[10%] object-contain object-center z-10 drop-shadow-2xl" />
                
                <div className="absolute bottom-0 left-0 w-full h-[80px] bg-gradient-to-t from-[#3a3b40] via-[#3a3b40]/80 to-transparent z-20 pointer-events-none" />
              </div>

              {/* V-Notch White Separator Line */}
              <svg viewBox="0 0 1000 15" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[15px] z-30 pointer-events-none opacity-40">
                <polyline points="0,0 500,14.5 1000,0" stroke="white" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>

            <div className="flex flex-col md:flex-row w-full pt-1 md:pt-2 px-6 md:px-12 gap-8 md:gap-16 relative z-10">

              {/* LEFT: 月份备注 Section (5 Lines) */}
              <div className="md:flex-[0.25] flex flex-col mt-1 md:pr-10 border-b md:border-b-0 md:border-r border-white/30 pb-2 md:pb-0">
                <h3 className="text-[10px] md:text-[11px] font-bold text-white/90 tracking-widest mb-2 uppercase">Monthly Schedule</h3>
                <div className="flex flex-col gap-[1px]">
                  {monthNotes.map((note, i) => (
                    <input
                      key={i}
                      value={note}
                      onChange={(e) => setMonthNote(i, e.target.value)}
                      placeholder={`Memo line ${i + 1}`}
                      className="w-full bg-transparent border-b border-white/40 h-6 text-white/90 placeholder:text-white/30 italic text-[12px] md:text-[13px] focus:outline-none focus:border-[#df8c2c] transition-all font-serif cursor-text"
                      onPointerDownCapture={(e) => e.stopPropagation()} // Prevent drag conflict
                    />
                  ))}
                </div>
              </div>

              {/* RIGHT: Calendar Grid */}
              <div className="md:flex-[0.75] flex flex-col md:pl-6">
                <div className="flex items-center justify-between pb-1 md:pb-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => changeMonth(-1)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="p-1 rounded-full text-[#a0a0a0] hover:text-white hover:bg-white/10 transition-colors z-30"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-[16px] md:text-[20px] font-semibold text-white tracking-[0.2em] uppercase">{format(currentMonth, "yyyy MMMM")}</h2>
                    <button
                      onClick={() => changeMonth(1)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="p-1 rounded-full text-[#a0a0a0] hover:text-white hover:bg-white/10 transition-colors z-30"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 px-0 pb-2 border-b border-white/20 mb-2">
                  {dayNames.map((name) => <div key={name} className="text-[10px] md:text-[11px] font-bold tracking-widest text-center text-[#e0e0e0] opacity-80">{name}</div>)}
                </div>

                <div className="flex flex-col">
                  {rows.map((week, weekIndex) => {
                    const isWeekSelected = week.some(d => (rangeStart && isSameDay(d, rangeStart)) || (rangeEnd && isSameDay(d, rangeEnd)));
                    const currentOpenDate = (rangeEnd && isWeekSelected) ? rangeEnd : (rangeStart && isWeekSelected ? rangeStart : null);

                    return (
                      <React.Fragment key={weekIndex}>
                        <div className="grid grid-cols-7 px-1 py-0 relative z-20 bg-[#313235]">
                          {week.map((date, dayIndex) => {
                            const isSelectedDate = isSelected(date);
                            const isDayInRange = isInRange(date);
                            const isCurrMonth = isSameMonth(date, currentMonth);
                            const dateKey = format(date, "yyyy-MM-dd");
                            const hasNote = dayNotes[dateKey]?.some(n => n.trim().length > 0);

                            return (
                              <div key={dayIndex} className="relative flex justify-center py-[1px]">
                                <button
                                  onClick={() => handleDateClick(date)}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  suppressHydrationWarning
                                  className={cn(
                                    "w-8 h-8 flex items-center justify-center rounded-full text-[13px] transition-all relative z-10",
                                    !isCurrMonth ? "text-[#a0a0a0]/40" : "text-white font-medium",
                                    isSelectedDate ? "text-[#313235] font-bold" : "",
                                    isDayInRange ? "bg-[#df8c2c]/20 text-white rounded-none" : ""
                                  )}
                                >
                                  {format(date, "d")}
                                </button>
                                {isSelectedDate && (
                                  <motion.div layoutId="sel" className="absolute inset-0 m-auto w-[28px] h-[28px] rounded-full bg-[#df8c2c] z-0 shadow-lg shadow-[#df8c2c]/30" />
                                )}
                                {hasNote && !isSelectedDate && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#df8c2c]/50" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Inline Expansion removed in favor of Popup */}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Daily Agenda Popup */}
      <AnimatePresence>
        {rangeStart && !rangeEnd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRangeStart(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Notepad Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#fcfaf2] w-full max-w-[400px] rounded-2xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border border-black/5 overflow-hidden"
            >
              {/* Pink notebook line */}
              <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-red-100/60" />

              <div className="relative pl-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today's Agenda</h4>
                    <p className="text-[18px] font-serif font-bold text-gray-800">{format(rangeStart, "MMMM do, yyyy")}</p>
                  </div>
                  <button
                    onClick={() => setRangeStart(null)}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const key = format(rangeStart, "yyyy-MM-dd");
                    return (
                      <input
                        key={i}
                        defaultValue={dayNotes[key]?.[i] || ""}
                        onBlur={(e) => setDayNote(key, i, e.target.value)}
                        placeholder={i === 0 ? "What's the plan?" : "..."}
                        className="w-full bg-transparent border-b border-blue-100/50 h-10 text-gray-700 focus:outline-none focus:border-blue-400/30 placeholder:text-gray-300 font-serif text-[16px]"
                      />
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setRangeStart(null)}
                    className="bg-[#df8c2c] text-white px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest shadow-lg shadow-[#df8c2c]/30 hover:scale-105 transition-transform"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
