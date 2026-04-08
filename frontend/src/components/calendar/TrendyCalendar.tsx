"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarStore } from "@/store/useCalendarStore";
import styles from "./TrendyCalendar.module.css";

type CalendarFlipPhase = "idle" | "outNext" | "outPrev" | "inNext" | "inPrev";

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const SHELF_BOOKS: Array<[number, number, string]> = [
  [12, 50, "#8a2020"],
  [10, 42, "#1a4a8a"],
  [14, 55, "#2a6a2a"],
  [8,  38, "#8a6a20"],
  [11, 48, "#6a1a6a"],
  [9,  44, "#4a4a4a"],
  [13, 52, "#2a5a5a"],
];

const DUST_MOTES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left:     `${5 + (i * 6.1) % 88}%`,
  top:      `${10 + (i * 8.3) % 70}%`,
  size:     1 + (i % 3) * 0.6,
  duration: 10 + (i * 1.4) % 18,
  delay:    (i * 1.2) % 16,
}));

function getFlipAnimationClass(flipPhase: CalendarFlipPhase): string {
  if (flipPhase === "outNext") return styles.flipOutNext;
  if (flipPhase === "inNext")  return styles.flipInNext;
  if (flipPhase === "outPrev") return styles.flipOutPrev;
  if (flipPhase === "inPrev")  return styles.flipInPrev;
  return "";
}

function buildVisibleMonthDates(monthDate: Date): Date[] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd   = endOfMonth(monthDate);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 0 });
  const visibleDates: Date[] = [];
  let currentDate = gridStart;

  while (currentDate <= gridEnd) {
    visibleDates.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return visibleDates;
}

export function TrendyCalendar() {
  const {
    currentMonth: currentMonthIso,
    monthNotes,
    dayNotes,
    setCurrentMonth,
    setMonthNote,
    setFullDayNote,
  } = useCalendarStore();

  const [flipPhase, setFlipPhase]                   = useState<CalendarFlipPhase>("idle");
  const [isDayNotesModalOpen, setIsDayNotesModalOpen] = useState(false);
  const [selectedDateIsoKey, setSelectedDateIsoKey] = useState<string | null>(null);
  const [draftDayNotes, setDraftDayNotes]           = useState<string[]>(["", "", "", "", ""]);
  const [pullAngle, setPullAngle]             = useState(0);
  const [pullOffsetX, setPullOffsetX]         = useState(0);
  const [isPullActive, setIsPullActive]       = useState(false);
  const [isWobbling, setIsWobbling]           = useState(false);
  const [wobbleAmplitude, setWobbleAmplitude] = useState(0);

  const touchStartYRef = useRef(0);
  const mouseDownYRef  = useRef(0);
  const mouseDownXRef  = useRef(0);
  const isDraggingRef  = useRef(false);
  const livePullAngleRef = useRef(0);
  const livePullXRef     = useRef(0);
  const wobbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMonth = parseISO(currentMonthIso);
  const currentMonthKey = format(currentMonth, "yyyy-MM");
  const currentMonthNotes = (monthNotes[currentMonthKey] || Array(6).fill("")) as string[];
  const visibleDates = buildVisibleMonthDates(currentMonth);
  const today = new Date();

  const startMonthFlip = (direction: 1 | -1) => {
    if (flipPhase !== "idle") return;
    setFlipPhase(direction > 0 ? "outNext" : "outPrev");
  };

  const changeMonthImmediately = (direction: 1 | -1) => {
    setCurrentMonth(direction > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  const handleFlipAnimationEnd = () => {
    if (flipPhase === "outNext") {
      changeMonthImmediately(1);
      setFlipPhase("inNext");
      return;
    }

    if (flipPhase === "outPrev") {
      changeMonthImmediately(-1);
      setFlipPhase("inPrev");
      return;
    }

    if (flipPhase === "inNext" || flipPhase === "inPrev") {
      setFlipPhase("idle");
    }
  };

  const openDayNotesModal = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;

    const dateKey = format(date, "yyyy-MM-dd");
    setSelectedDateIsoKey(dateKey);
    setDraftDayNotes(dayNotes[dateKey] || ["", "", "", "", ""]);
    setIsDayNotesModalOpen(true);
  };

  const closeDayNotesModal = () => {
    setIsDayNotesModalOpen(false);
    setSelectedDateIsoKey(null);
  };

  const saveDayNotes = () => {
    if (!selectedDateIsoKey) return;

    setFullDayNote(selectedDateIsoKey, draftDayNotes);
    closeDayNotesModal();
  };

  const updatePullGesture = (pointerX: number) => {
    if (!isDraggingRef.current) return;

    const deltaX = pointerX - mouseDownXRef.current;
    const angle = Math.max(-8, Math.min(8, deltaX * 0.05));
    const horizontalShift = Math.max(-12, Math.min(12, deltaX * 0.25));

    livePullAngleRef.current = angle;
    livePullXRef.current = horizontalShift;

    setPullAngle(angle);
    setPullOffsetX(horizontalShift);
    setIsPullActive(true);
  };

  const releasePullGesture = () => {
    const releaseAmplitude = Math.min(8, Math.abs(livePullAngleRef.current));

    setPullAngle(0);
    setPullOffsetX(0);
    setIsPullActive(false);

    if (releaseAmplitude < 0.7) {
      livePullAngleRef.current = 0;
      livePullXRef.current = 0;
      return;
    }

    setWobbleAmplitude(releaseAmplitude);
    setIsWobbling(true);

    if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);

    wobbleTimerRef.current = setTimeout(() => {
      setIsWobbling(false);
      setWobbleAmplitude(0);
    }, 1800);

    livePullAngleRef.current = 0;
    livePullXRef.current = 0;
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => updatePullGesture(event.clientX);

    const handleMouseUp = (event: MouseEvent) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      releasePullGesture();

      const verticalDelta = mouseDownYRef.current - event.clientY;
      if (Math.abs(verticalDelta) <= 85) return;

      setFlipPhase((previousPhase) => {
        if (previousPhase !== "idle") return previousPhase;
        return verticalDelta > 0 ? "outNext" : "outPrev";
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
    };
  }, []);

  const selectedDate = selectedDateIsoKey ? parseISO(`${selectedDateIsoKey}T00:00:00`) : null;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-start overflow-x-hidden overflow-y-auto bg-[#1e0e06] px-4 pb-12 pt-6">
      <svg className={styles.brickBg} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">
        <defs>
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="4" seed="5" />
            <feDisplacementMap in="SourceGraphic" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <pattern id="bricks" x="0" y="0" width="90" height="38" patternUnits="userSpaceOnUse">
            <rect x="1"   y="1"  width="86" height="16" rx="1" fill="#3a1e10" stroke="#200e05" strokeWidth="0.8" filter="url(#rough)" />
            <rect x="-44" y="20" width="86" height="16" rx="1" fill="#371c0e" stroke="#200e05" strokeWidth="0.8" filter="url(#rough)" />
            <rect x="46"  y="20" width="86" height="16" rx="1" fill="#3c2012" stroke="#200e05" strokeWidth="0.8" filter="url(#rough)" />
            <line x1="0" y1="18.5" x2="90" y2="18.5" stroke="#180a04" strokeWidth="1.8" opacity="0.75" />
            <line x1="0" y1="37.5" x2="90" y2="37.5" stroke="#180a04" strokeWidth="1.8" opacity="0.75" />
            <line x1="0" y1="0"    x2="90" y2="0"    stroke="#180a04" strokeWidth="1.8" opacity="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bricks)" />
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.22)" />
      </svg>

      <div className={styles.wallpaper} aria-hidden="true" />
      <div className={styles.roomFloor} aria-hidden="true" />
      <div className={styles.baseboard} aria-hidden="true" />

      <div className={styles.roomWindow} aria-hidden="true">
        {[
          { top:"14%", left:"18%", s:2, d:0   },
          { top:"24%", left:"68%", s:1, d:0.6 },
          { top:"58%", left:"28%", s:2, d:1.1 },
          { top:"38%", left:"78%", s:1, d:1.6 },
          { top:"72%", left:"52%", s:2, d:0.9 },
          { top:"10%", left:"52%", s:1, d:2.1 },
        ].map((st, i) => (
          <div key={i} style={{
            position:"absolute", top:st.top, left:st.left,
            width:st.s, height:st.s,
            background:"#fff", borderRadius:"50%",
            animation:`twinkle 3s ${st.d}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>
      <div className={styles.windowMoon} aria-hidden="true" />
      <div className={styles.curtainRod}   aria-hidden="true" />
      <div className={styles.curtainLeft}  aria-hidden="true" />
      <div className={styles.curtainRight} aria-hidden="true" />

      <div className={styles.bookShelf} aria-hidden="true">
        <div style={{ display:"flex", alignItems:"flex-end", gap:3, padding:"0 5px", position:"absolute", bottom:12, left:0, right:0 }}>
          {SHELF_BOOKS.map(([w, h, color], i) => (
            <div key={i} style={{ width:w, height:h, background:color, borderRadius:"1px 2px 2px 1px", boxShadow:"1px 0 4px rgba(0,0,0,0.45)", flexShrink:0 }} />
          ))}
        </div>
        <div className={styles.shelfBoard} />
      </div>

      <div className={styles.candle} aria-hidden="true">
        <div className={styles.candleFlame} />
        <div className={styles.candleBody} />
      </div>
      <div className={styles.candleGlow} style={{ width:220, height:170, right:"calc(3% + 30px)", top:"calc(20% - 90px)" }} aria-hidden="true" />

      <div className={styles.plantPot} aria-hidden="true">
        <div style={{ position:"relative", height:44 }}>
          <div style={{ position:"absolute", bottom:0, left:9,  width:28, height:18, background:"#2a6a20", borderRadius:"50% 0 50% 0", transform:"rotate(-35deg)", transformOrigin:"bottom center" }} />
          <div style={{ position:"absolute", bottom:0, left:7,  width:32, height:20, background:"#3a8030", borderRadius:"50% 0 50% 0", transform:"rotate(25deg)",  transformOrigin:"bottom center" }} />
          <div style={{ position:"absolute", bottom:4, left:13, width:22, height:14, background:"#488040", borderRadius:"50% 0 50% 0", transform:"rotate(-10deg)", transformOrigin:"bottom center" }} />
        </div>
        <div className={styles.potRim} />
        <div className={styles.potBody} />
      </div>

      <style>{`
        @keyframes dustFloat {
          0%   { transform:translateY(0) translateX(0);     opacity:0; }
          8%   { opacity:0.7; }
          88%  { opacity:0.3; }
          100% { transform:translateY(-60vh) translateX(15px); opacity:0; }
        }
        @keyframes twinkle {
          0%   { opacity:0.2; }
          100% { opacity:0.9; }
        }
      `}</style>
      <div style={{ position:"fixed", inset:0, zIndex:4, pointerEvents:"none", overflow:"hidden" }} aria-hidden="true">
        {DUST_MOTES.map((m) => (
          <div key={m.id} style={{
            position:"absolute", left:m.left, top:m.top,
            width:m.size, height:m.size,
            background:"rgba(255,220,150,0.6)", borderRadius:"50%",
            animation:`dustFloat ${m.duration}s ${m.delay}s linear infinite`,
          }} />
        ))}
      </div>

      <div className={styles.wallVignette} aria-hidden="true" />

      <div className={styles.hanger} aria-hidden="true">
        <div className={styles.hook} />
        <div className={styles.wireRow}>
          {Array.from({ length: 42 }).map((_, idx) => (
            <div key={idx} className={styles.coil} />
          ))}
        </div>
      </div>

      <div
        className={`${styles.calStack} ${isPullActive ? styles.calStackPulled : ""} ${isWobbling ? styles.calStackWobble : ""}`}
        style={{
          "--pull-angle":   `${pullAngle}deg`,
          "--pull-x":       `${pullOffsetX}px`,
          "--wobble-angle": `${wobbleAmplitude}deg`,
        } as React.CSSProperties}
      >
        <div className={`${styles.pageBack} ${styles.pageBack1}`} />
        <div className={`${styles.pageBack} ${styles.pageBack2}`} />
        <div className={`${styles.pageBack} ${styles.pageBack3}`} />

        <div className={styles.flipPerspective}>
          <section
            className={`${styles.calPage} ${getFlipAnimationClass(flipPhase)}`}
            onAnimationEnd={handleFlipAnimationEnd}
            onTouchStart={(e) => {
              touchStartYRef.current = e.touches[0].clientY;
              mouseDownXRef.current = e.touches[0].clientX;
              setIsWobbling(false);
              if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
              isDraggingRef.current = true;
            }}
            onTouchMove={(e) => updatePullGesture(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              isDraggingRef.current = false;
              releasePullGesture();
              const verticalDelta = touchStartYRef.current - e.changedTouches[0].clientY;
              if (Math.abs(verticalDelta) <= 85) return;
              startMonthFlip(verticalDelta > 0 ? 1 : -1);
            }}
            onMouseDown={(e) => {
              mouseDownYRef.current = e.clientY;
              mouseDownXRef.current = e.clientX;
              isDraggingRef.current = true;
              setIsWobbling(false);
              if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") startMonthFlip(-1);
              if (e.key === "ArrowRight") startMonthFlip(1);
            }}
            tabIndex={0}
            aria-label="Monthly planner calendar"
          >
            <div className="relative h-[clamp(140px,32vw,200px)] overflow-hidden rounded-none border-b-[3px] border-b-[rgba(220,140,40,0.6)] bg-[#1c0f07]">
              <div className={styles.heroBgBlur} style={{ backgroundImage: "url('/portrait.png')" }} />
              <div className={styles.heroPattern} />
              <div className={styles.heroOverlay} />
              <div className="absolute inset-y-0 left-0 z-[10] flex max-w-[65%] flex-col justify-center px-5 py-4">
                <div className="mb-1 font-['Caveat_Brush'] text-[clamp(9px,2vw,12px)] uppercase tracking-[0.2em] text-[#df8c2c]">Monthly Planner</div>
                <div className="mb-1.5 font-['Caveat_Brush'] text-[clamp(28px,7vw,52px)] leading-none text-[#fdf6e3]">{format(currentMonth, "MMMM")}</div>
                <div className="font-['Caveat'] text-[clamp(13px,3vw,20px)] tracking-[0.15em] text-[rgba(253,246,227,0.55)]">{format(currentMonth, "yyyy")}</div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.1)] text-[#fdf6e3] transition-all duration-150 hover:scale-105 hover:bg-[rgba(255,255,255,0.22)] active:scale-95 active:bg-[rgba(255,255,255,0.3)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      startMonthFlip(-1);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.1)] text-[#fdf6e3] transition-all duration-150 hover:scale-105 hover:bg-[rgba(255,255,255,0.22)] active:scale-95 active:bg-[rgba(255,255,255,0.3)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      startMonthFlip(1);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    aria-label="Next month"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className={styles.heroCenterWord} aria-hidden="true">TUF</div>

              <img src="/portrait.png" alt="Portrait" className={styles.heroPortrait} />

              <div className={styles.heroSwipeHint}>
                Use left/right icons <span className="md:inline hidden">or drag</span>
                <span className="md:hidden block">or drag</span> to flip pages
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_2.2fr]">
              <aside className="flex flex-col border-b-[1.5px] border-b-[rgba(150,110,50,0.35)] border-dashed px-4 py-3.5 md:border-b-0 md:border-r-[1.5px] md:border-r-[rgba(150,110,50,0.35)]">
                <div className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#a07840]">Monthly notes</div>
                <div className="flex flex-1 flex-col">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 border-b border-b-[rgba(150,110,50,0.28)] px-0.5 py-1.5">
                      <div className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#df8c2c] opacity-70" />
                      <input
                        className="w-full bg-transparent font-[var(--font-geist-sans),Arial,sans-serif] text-[clamp(11px,2.4vw,13px)] text-[#3a2a10] outline-none placeholder:text-[#c0a870]"
                        type="text"
                        value={currentMonthNotes[idx] || ""}
                        placeholder={idx === 0 ? "Add a note..." : "..."}
                        onChange={(e) => setMonthNote(currentMonthKey, idx, e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        aria-label={`Monthly note line ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </aside>

              <div className="px-3 py-2.5 md:py-3">
                <div className="mb-1 grid grid-cols-7">
                  {DAY_NAMES.map((day, idx) => (
                    <div
                      key={day}
                      className={`py-0.5 text-center text-[clamp(9px,2.2vw,11px)] font-bold tracking-[0.04em] text-[#8a6a3a] ${idx === 0 ? "text-[#b83020]" : ""}`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {visibleDates.map((date, idx) => {
                    const dateKey = format(date, "yyyy-MM-dd");
                    const inMonth = isSameMonth(date, currentMonth);
                    const isToday = isSameDay(date, today);
                    const hasNote = (dayNotes[dateKey] || []).some((n) => n.trim().length > 0);
                    const col     = idx % 7;
                    return (
                      <div key={dateKey} className={`flex aspect-square items-center justify-center ${col === 0 ? styles.sunCol : ""}`}>
                        <button
                          className={`flex min-h-11 min-w-11 aspect-square w-[min(90%,48px)] items-center justify-center rounded-[5px] border-none bg-transparent font-sans text-[clamp(12px,3vw,16px)] font-semibold text-[#3a2a10] transition-all duration-[120ms] hover:bg-[rgba(223,140,44,0.18)] disabled:cursor-default ${!inMonth ? styles.other : ""} ${isToday ? styles.today : ""} ${hasNote ? styles.hasNote : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDayNotesModal(date);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                          onTouchEnd={(e) => e.stopPropagation()}
                          disabled={!inMonth}
                          aria-label={format(date, "EEEE, MMMM d, yyyy")}
                        >
                          {format(date, "d")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {isDayNotesModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(15,7,3,0.75)] p-4 backdrop-blur-[5px]" onClick={closeDayNotesModal}>
          <div
            className="relative w-full max-w-[min(360px,calc(100vw-32px))] rounded-[14px] border-2 border-[rgba(150,110,50,0.45)] bg-[#fdf6e3] p-[22px] shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute right-3.5 top-3 border-none bg-transparent text-[20px] leading-none text-[#8a6a3a]" onClick={closeDayNotesModal} aria-label="Close notes">×</button>
            <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#a07840]">Daily agenda</div>
            <div className="mb-4 font-['Caveat_Brush'] text-2xl text-[#3a2a10]">
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
            </div>
            <div className="flex flex-col">
              {["What's the plan?", "...", "...", "...", "..."].map((ph, idx) => (
                <input
                  key={idx}
                  className="w-full border-x-0 border-b-[1.2px] border-t-0 border-b-[rgba(150,110,50,0.3)] bg-transparent px-1 py-[9px] font-[var(--font-geist-sans),Arial,sans-serif] text-sm text-[#3a2a10] outline-none placeholder:text-[#c0a870]"
                  value={draftDayNotes[idx] || ""}
                  placeholder={ph}
                  onChange={(e) => {
                    const updatedDraftNotes = [...draftDayNotes];
                    updatedDraftNotes[idx] = e.target.value;
                    setDraftDayNotes(updatedDraftNotes);
                  }}
                  aria-label={`Daily note line ${idx + 1}`}
                />
              ))}
            </div>
            <div className="mt-[18px] flex justify-end gap-2">
              <button
                className="cursor-pointer rounded-[20px] border-[1.5px] border-[rgba(150,110,50,0.4)] bg-transparent px-4 py-2 font-['Caveat_Brush'] text-[15px] tracking-[0.05em] text-[#8a6a3a]"
                onClick={closeDayNotesModal}
              >
                Cancel
              </button>
              <button
                className="cursor-pointer rounded-[20px] border-none bg-[#df8c2c] px-[22px] py-2 font-['Caveat_Brush'] text-[15px] tracking-[0.05em] text-white shadow-[0_3px_14px_rgba(223,140,44,0.45)]"
                onClick={saveDayNotes}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}