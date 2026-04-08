"use client";

import { useState } from "react";
import { TrendyCalendar } from "@/components/calendar/TrendyCalendar";
import { CalendarIntro } from "@/components/calendar/CalendarIntro";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [introFinished, setIntroFinished] = useState(false);
  const [revealCalendar, setRevealCalendar] = useState(false);

  return (
    <main className="min-h-[100dvh] relative w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#e6d5b8] to-[#c5ac8e] bg-fixed py-8 px-4 shadow-inner overflow-hidden">

      <AnimatePresence>
        {!introFinished && (
          <motion.div
            key="intro"
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <CalendarIntro
              onComplete={() => setIntroFinished(true)}
              onReveal={() => setRevealCalendar(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealCalendar && (
          <motion.div
            key="calendar"
            initial={{ scale: 0.04, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
            className="w-full flex justify-center z-10"
          >
            <TrendyCalendar />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
