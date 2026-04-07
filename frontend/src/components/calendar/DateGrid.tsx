"use client";

import React, { useState } from 'react';
import { getMonthGrid, isDateInMonth, formatDayNumber, checkIsToday } from '../../lib/dateUtils';
import { addMonths, subMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function DateGrid() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const days = getMonthGrid(currentMonth);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-zinc-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1 flex-grow">
        {days.map((date, idx) => {
          const isCurrentMonth = isDateInMonth(date, currentMonth);
          const isToday = checkIsToday(date);
          
          return (
            <button
              key={idx}
              className={twMerge(
                clsx(
                  "flex items-center justify-center p-2 text-sm rounded-lg transition-colors min-h-[44px]",
                  "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                  !isCurrentMonth ? "text-zinc-400 dark:text-zinc-600 font-light" : "text-zinc-900 dark:text-zinc-100 font-medium",
                  isToday && "bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                )
              )}
            >
              {formatDayNumber(date)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
