"use client";

import { useState } from "react";
import { CalendarIntro } from "@/components/calendar/CalendarIntro";
import { TrendyCalendar } from "@/components/calendar/InteractiveCalendar";

export default function Home() {
  const [introFinished, setIntroFinished] = useState(false);
  const [revealCalendar, setRevealCalendar] = useState(false);

  return (
    <main className="min-h-[100dvh] w-full relative overflow-hidden">
      {revealCalendar && <TrendyCalendar />}

      {!introFinished && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <CalendarIntro
            onReveal={() => setRevealCalendar(true)}
            onComplete={() => setIntroFinished(true)}
          />
        </div>
      )}
    </main>
  );
}
