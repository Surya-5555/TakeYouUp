import React from 'react';
import NotesPlaceholder from '../notes/NotesPlaceholder';

export default function CalendarPlaceholder() {
  return (
    <div className="w-full min-h-[500px] bg-zinc-100 dark:bg-zinc-800 rounded-xl flex flex-col border border-zinc-200 dark:border-zinc-700 p-6">
      {/* Calendar Grid Area */}
      <div className="flex-grow flex items-center justify-center">
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Calendar Grid Placeholder</p>
      </div>
      
      {/* Divider */}
      <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700 my-4" />

      {/* Integrated Notes Area */}
      <NotesPlaceholder />
    </div>
  );
}
