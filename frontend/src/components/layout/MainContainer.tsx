import React from 'react';
import Image from 'next/image';
import CalendarPlaceholder from '../calendar/CalendarPlaceholder';
import NotesPlaceholder from '../notes/NotesPlaceholder';

export default function MainContainer() {
  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen p-4 md:p-8 flex flex-col justify-center">
      <div className="flex flex-col lg:flex-row gap-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        {/* Left Side: Image (Desktop) / Top (Mobile) */}
        <div className="w-full lg:w-1/2 relative min-h-[300px] lg:min-h-[600px] bg-zinc-100 dark:bg-zinc-800">
          {/* Using next/image for optimized images. Replace src with actual image */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            {/* We'll use the referenced image here later, for now we will assume it's set as an object fit or custom content */}
            <div className="w-full h-full relative rounded-xl overflow-hidden">
               <Image 
                 src="/expected/calenderMentioned.png" 
                 alt="Hero Calendar Interface" 
                 fill
                 sizes="(max-width: 1024px) 100vw, 50vw"
                 className="object-contain"
                 priority
               />
            </div>
          </div>
        </div>

        {/* Right Side: Calendar & Notes (Desktop) / Bottom (Mobile) */}
        <div className="w-full lg:w-1/2 p-6 md:p-10 flex flex-col">
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-zinc-50">Select Dates</h1>
            
            <div className="flex-grow flex flex-col justify-between">
              <CalendarPlaceholder />
              <NotesPlaceholder />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
