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
import { useCalendarStore, getCurrentMonthIso } from "@/store/useCalendarStore";
import styles from "./TrendyCalendar.module.css";

type TransitionPhase = "idle" | "flippingOutNext" | "flippingOutPrev" | "flippingInNext" | "flippingInPrev";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DECORATIVE_BOOKS = [
  { width: 12, height: 50, color: "#8a2020" },
  { width: 10, height: 42, color: "#1a4a8a" },
  { width: 14, height: 55, color: "#2a6a2a" },
  { width: 8,  height: 38, color: "#8a6a20" },
  { width: 11, height: 48, color: "#6a1a6a" },
  { width: 9,  height: 44, color: "#4a4a4a" },
  { width: 13, height: 52, color: "#2a5a5a" },
];

const LIGHT_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 6.1) % 88}%`,
  top: `${10 + (i * 8.3) % 70}%`,
  size: 1 + (i % 3) * 0.6,
  duration: 10 + (i * 1.4) % 18,
  delay: (i * 1.2) % 16,
}));

/**
 * Maps the transition phase to its corresponding CSS module animation class.
 */
function getActiveAnimationClass(phase: TransitionPhase): string {
  switch (phase) {
    case "flippingOutNext": return styles.flipOutNext;
    case "flippingInNext":  return styles.flipInNext;
    case "flippingOutPrev": return styles.flipOutPrev;
    case "flippingInPrev":  return styles.flipInPrev;
    default: return "";
  }
}

/**
 * Calculates a 42-day grid to ensure the layout remains stable during month transitions.
 */
function calculateCalendarGridDates(baseDate: Date): Date[] {
  const monthStart = startOfMonth(baseDate);
  const monthEnd   = endOfMonth(baseDate);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 0 });
  const gridDates: Date[] = [];
  
  let current = gridStart;
  while (current <= gridEnd) {
    gridDates.push(current);
    current = addDays(current, 1);
  }

  return gridDates;
}

export function TrendyCalendar() {
  const {
    activeDisplayMonthIso,
    monthlyPlannerAgendas,
    dailyHabitNotes,
    updateDisplayMonth,
    updateMonthlyAgendaLine,
    saveDailyChecklist,
  } = useCalendarStore();

  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");
  const [isAgendaPopupOpen, setIsAgendaPopupOpen] = useState(false);
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
  const [draftHabitNotes, setDraftHabitNotes] = useState<string[]>(Array(5).fill(""));
  
  // Physics & Interaction State
  const [pullRotation, setPullRotation] = useState(0);
  const [pullShiftX, setPullShiftX] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const [vibrationIntensity, setVibrationIntensity] = useState(0);

  // Interaction References
  const dragStartYRef = useRef(0);
  const interactionStartRefX = useRef(0);
  const interactionStartRefY = useRef(0);
  const isInteractionBoundRef = useRef(false);
  const livePullStateRef = useRef({ angle: 0, x: 0 });
  const vibrationCooldownRef = useRef<NodeJS.Timeout | null>(null);

  const activeDate = parseISO(activeDisplayMonthIso);
  const activeMonthKey = format(activeDate, "yyyy-MM");
  const activeMonthAgendas = (monthlyPlannerAgendas[activeMonthKey] || Array(6).fill("")) as string[];
  const calendarDates = calculateCalendarGridDates(activeDate);
  const today = new Date();

  // Reset view to actual current time on mount.
  useEffect(() => {
    const currentRealMonth = getCurrentMonthIso();
    if (activeDisplayMonthIso !== currentRealMonth) {
      updateDisplayMonth(new Date());
    }
  }, []);

  const triggerMonthFlip = (direction: 1 | -1) => {
    if (transitionPhase !== "idle") return;
    setTransitionPhase(direction > 0 ? "flippingOutNext" : "flippingOutPrev");
  };

  const finalizeMonthTransition = (direction: 1 | -1) => {
    const nextMonth = direction > 0 ? addMonths(activeDate, 1) : subMonths(activeDate, 1);
    updateDisplayMonth(nextMonth);
  };

  const onFlipAnimationSequenceEnd = () => {
    if (transitionPhase === "flippingOutNext") {
      finalizeMonthTransition(1);
      setTransitionPhase("flippingInNext");
      return;
    }
    if (transitionPhase === "flippingOutPrev") {
      finalizeMonthTransition(-1);
      setTransitionPhase("flippingInPrev");
      return;
    }
    if (transitionPhase === "flippingInNext" || transitionPhase === "flippingInPrev") {
      setTransitionPhase("idle");
    }
  };

  const openDailyAgendaPopup = (date: Date) => {
    if (!isSameMonth(date, activeDate)) return;

    const dateKey = format(date, "yyyy-MM-dd");
    setActiveDateKey(dateKey);
    setDraftHabitNotes(dailyHabitNotes[dateKey] || Array(5).fill(""));
    setIsAgendaPopupOpen(true);
  };

  const handlePullInteraction = (pointerX: number) => {
    if (!isInteractionBoundRef.current) return;

    const deltaX = pointerX - interactionStartRefX.current;
    const computedAngle = Math.max(-8, Math.min(8, deltaX * 0.05));
    const computedShift = Math.max(-12, Math.min(12, deltaX * 0.25));

    livePullStateRef.current = { angle: computedAngle, x: computedShift };
    
    setPullRotation(computedAngle);
    setPullShiftX(computedShift);
    setIsPulling(true);
  };

  const resolvePullRelease = () => {
    const intensity = Math.min(8, Math.abs(livePullStateRef.current.angle));

    setPullRotation(0);
    setPullShiftX(0);
    setIsPulling(false);

    if (intensity < 0.7) {
      livePullStateRef.current = { angle: 0, x: 0 };
      return;
    }

    setVibrationIntensity(intensity);
    setIsVibrating(true);

    if (vibrationCooldownRef.current) clearTimeout(vibrationCooldownRef.current);
    vibrationCooldownRef.current = setTimeout(() => {
      setIsVibrating(false);
      setVibrationIntensity(0);
    }, 1800);

    livePullStateRef.current = { angle: 0, x: 0 };
  };

  useEffect(() => {
    const onGlobalMouseMove = (e: MouseEvent) => handlePullInteraction(e.clientX);
    const onGlobalMouseUp = (e: MouseEvent) => {
      if (!isInteractionBoundRef.current) return;

      isInteractionBoundRef.current = false;
      resolvePullRelease();

      const dragDistanceY = interactionStartRefY.current - e.clientY;
      if (Math.abs(dragDistanceY) > 75) {
        triggerMonthFlip(dragDistanceY > 0 ? 1 : -1);
      }
    };

    window.addEventListener("mousemove", onGlobalMouseMove);
    window.addEventListener("mouseup", onGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      window.removeEventListener("mouseup", onGlobalMouseUp);
      if (vibrationCooldownRef.current) clearTimeout(vibrationCooldownRef.current);
    };
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-start overflow-x-hidden overflow-y-auto bg-[#1e0e06] px-4 pb-12 pt-6">
      <BackgroundEnvironment />

      <RoomWallpaper />
      <FloorLevel />

      <WindowFeature />
      <FurnitureDecor />

      <PhysicalHanger />

      <div
        className={`${styles.calStack} ${isPulling ? styles.calStackPulled : ""} ${isVibrating ? styles.calStackWobble : ""}`}
        style={{
          "--pull-angle": `${pullRotation}deg`,
          "--pull-x": `${pullShiftX}px`,
          "--wobble-angle": `${vibrationIntensity}deg`,
        } as React.CSSProperties}
      >
        <StackBackgroundPages />

        <div className={styles.flipPerspective}>
          <section
            className={`${styles.calPage} ${getActiveAnimationClass(transitionPhase)}`}
            onAnimationEnd={onFlipAnimationSequenceEnd}
            onTouchStart={(e) => {
              dragStartYRef.current = e.touches[0].clientY;
              interactionStartRefX.current = e.touches[0].clientX;
              setIsVibrating(false);
              isInteractionBoundRef.current = true;
            }}
            onTouchMove={(e) => handlePullInteraction(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              isInteractionBoundRef.current = false;
              resolvePullRelease();
              const distY = dragStartYRef.current - e.changedTouches[0].clientY;
              if (Math.abs(distY) > 75) triggerMonthFlip(distY > 0 ? 1 : -1);
            }}
            onMouseDown={(e) => {
              interactionStartRefY.current = e.clientY;
              interactionStartRefX.current = e.clientX;
              isInteractionBoundRef.current = true;
              setIsVibrating(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") triggerMonthFlip(-1);
              if (e.key === "ArrowRight") triggerMonthFlip(1);
            }}
            tabIndex={0}
            aria-label="Interactive physical calendar"
          >
            <CalendarHeroSection 
              activeDate={activeDate} 
              onPrev={() => triggerMonthFlip(-1)} 
              onNext={() => triggerMonthFlip(1)} 
            />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_2.2fr]">
              <MonthlyPlannerColumn 
                notes={activeMonthAgendas} 
                monthKey={activeMonthKey} 
                onUpdate={updateMonthlyAgendaLine} 
              />
              
              <div className="px-3 py-2.5 md:py-3">
                <WeekdayHeader />
                <CalendarDatesGrid 
                  dates={calendarDates} 
                  activeMonth={activeDate} 
                  dailyNotes={dailyHabitNotes} 
                  today={today}
                  onDateClick={openDailyAgendaPopup} 
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <AgendaPopup 
        isOpen={isAgendaPopupOpen} 
        onClose={() => setIsAgendaPopupOpen(false)} 
        dateKey={activeDateKey}
        habitNotes={draftHabitNotes}
        onHabitChange={setDraftHabitNotes}
        onSave={() => {
          if (activeDateKey) {
            saveDailyChecklist(activeDateKey, draftHabitNotes);
            setIsAgendaPopupOpen(false);
          }
        }}
      />
    </div>
  );
}

/* ─── HELPER COMPONENTS (Refactored for Readability) ─── */

function BackgroundEnvironment() {
  return (
    <svg className={styles.brickBg} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">
      <defs>
        <filter id="brick-roughness">
          <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="4" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <pattern id="brick-pattern" x="0" y="0" width="90" height="38" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="86" height="16" rx="1" fill="#3a1e10" stroke="#200e05" strokeWidth="0.8" filter="url(#brick-roughness)" />
          <rect x="-44" y="20" width="86" height="16" rx="1" fill="#371c0e" stroke="#200e05" strokeWidth="0.8" filter="url(#brick-roughness)" />
          <rect x="46" y="20" width="86" height="16" rx="1" fill="#3c2012" stroke="#200e05" strokeWidth="0.8" filter="url(#brick-roughness)" />
          <line x1="0" y1="18.5" x2="90" y2="18.5" stroke="#180a04" strokeWidth="1.8" opacity="0.75" />
          <line x1="0" y1="37.5" x2="90" y2="37.5" stroke="#180a04" strokeWidth="1.8" opacity="0.75" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#brick-pattern)" />
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.22)" />
    </svg>
  );
}

function RoomWallpaper() {
  return <div className={styles.wallpaper} aria-hidden="true" />;
}

function FloorLevel() {
  return (
    <>
      <div className={styles.roomFloor} aria-hidden="true" />
      <div className={styles.baseboard} aria-hidden="true" />
      <div className="fixed inset-0 z-[4] pointer-events-none overflow-hidden">
        {LIGHT_PARTICLES.map((particle) => (
          <div key={particle.id} style={{
            position: "absolute", left: particle.left, top: particle.top,
            width: particle.size, height: particle.size,
            background: "rgba(255,220,150,0.6)", borderRadius: "50%",
            animation: `dustFloat ${particle.duration}s ${particle.delay}s linear infinite`,
          }} />
        ))}
      </div>
    </>
  );
}

function WindowFeature() {
  const stars = [
    { top:"14%", left:"18%", s:2, d:0 }, { top:"24%", left:"68%", s:1, d:0.6 },
    { top:"58%", left:"28%", s:2, d:1.1 }, { top:"38%", left:"78%", s:1, d:1.6 },
    { top:"72%", left:"52%", s:2, d:0.9 }, { top:"10%", left:"52%", s:1, d:2.1 },
  ];

  return (
    <>
      <div className={styles.roomWindow} aria-hidden="true">
        {stars.map((star, i) => (
          <div key={i} style={{
            position: "absolute", top: star.top, left: star.left,
            width: star.s, height: star.s, background: "#fff", borderRadius: "50%",
            animation: `twinkle 3s ${star.d}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>
      <div className={styles.windowMoon} aria-hidden="true" />
      <div className={styles.curtainRod} aria-hidden="true" />
      <div className={styles.curtainLeft} aria-hidden="true" />
      <div className={styles.curtainRight} aria-hidden="true" />
    </>
  );
}

function FurnitureDecor() {
  return (
    <>
      <div className={styles.bookShelf} aria-hidden="true">
        <div className="flex items-end gap-[3px] px-[5px] absolute bottom-3 left-0 right-0">
          {DECORATIVE_BOOKS.map((book, i) => (
            <div key={i} style={{
              width: book.width, height: book.height, background: book.color,
              borderRadius: "1px 2px 2px 1px", boxShadow: "1px 0 4px rgba(0,0,0,0.45)", flexShrink: 0
            }} />
          ))}
        </div>
        <div className={styles.shelfBoard} />
      </div>
      <div className={styles.candle} aria-hidden="true">
        <div className={styles.candleFlame} />
        <div className={styles.candleBody} />
      </div>
      <div className={styles.candleGlow} style={{ width: 220, height: 170, right: "calc(3% + 30px)", top: "calc(20% - 90px)" }} aria-hidden="true" />
      <div className={styles.plantPot} aria-hidden="true">
        <div className="relative h-11">
          <div className="absolute bottom-0 left-[9px] w-7 h-[18px] bg-[#2a6a20] rounded-[50%_0_50%_0] -rotate-[35deg] origin-bottom" />
          <div className="absolute bottom-0 left-[7px] w-8 h-5 bg-[#3a8030] rounded-[50%_0_50%_0] rotate-[25deg] origin-bottom" />
          <div className="absolute bottom-1 left-[13px] w-[22px] h-[14px] bg-[#488040] rounded-[50%_0_50%_0] -rotate-[10deg] origin-bottom" />
        </div>
        <div className={styles.potRim} />
        <div className={styles.potBody} />
      </div>
    </>
  );
}

function PhysicalHanger() {
  return (
    <div className={styles.hanger} aria-hidden="true">
      <div className={styles.hook} />
      <div className={styles.wireRow}>
        {Array.from({ length: 42 }).map((_, idx) => (
          <div key={idx} className={styles.coil} />
        ))}
      </div>
    </div>
  );
}

function StackBackgroundPages() {
  return (
    <>
      <div className={`${styles.pageBack} ${styles.pageBack1}`} />
      <div className={`${styles.pageBack} ${styles.pageBack2}`} />
      <div className={`${styles.pageBack} ${styles.pageBack3}`} />
    </>
  );
}

interface HeroProps {
  activeDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

function CalendarHeroSection({ activeDate, onPrev, onNext }: HeroProps) {
  return (
    <div className="relative h-[clamp(140px,32vw,200px)] overflow-hidden rounded-none border-b-[3px] border-b-[rgba(220,140,40,0.6)] bg-[#1c0f07]">
      <div className={styles.heroBgBlur} style={{ backgroundImage: "url('/portrait.png')" }} />
      <div className={styles.heroPattern} />
      <div className={styles.heroOverlay} />
      <div className="absolute inset-y-0 left-0 z-10 flex max-w-[65%] flex-col justify-center px-5 py-4">
        <div className="mb-1 font-['Caveat_Brush'] text-[clamp(9px,2vw,12px)] uppercase tracking-[0.2em] text-[#df8c2c]">Monthly Planner</div>
        <div className="mb-1.5 font-['Caveat_Brush'] text-[clamp(28px,7vw,52px)] leading-none text-[#fdf6e3]">{format(activeDate, "MMMM")}</div>
        <div className="font-['Caveat'] text-[clamp(13px,3vw,20px)] tracking-[0.15em] text-[rgba(253,246,227,0.55)]">{format(activeDate, "yyyy")}</div>
        <div className="mt-2.5 flex gap-2">
          <NavButton direction="prev" onClick={onPrev} />
          <NavButton direction="next" onClick={onNext} />
        </div>
      </div>
      <div className={styles.heroCenterWord} aria-hidden="true">TUF</div>
      <img src="/portrait.png" alt="Hero Portrait" className={styles.heroPortrait} />
      <div className={styles.heroSwipeHint}>
        Use arrows <span className="md:inline hidden">or swipe</span>
        <span className="md:hidden block">or swipe</span> to flip
      </div>
    </div>
  );
}

function NavButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const isPrev = direction === "prev";
  return (
    <button
      className="flex h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.1)] text-[#fdf6e3] transition-all hover:scale-105 hover:bg-[rgba(255,255,255,0.22)] active:scale-95 active:bg-[rgba(255,255,255,0.3)]"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      aria-label={`${isPrev ? 'Previous' : 'Next'} Month`}
    >
      {isPrev ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
  );
}

interface PlannerColumnProps {
  notes: string[];
  monthKey: string;
  onUpdate: (key: string, idx: number, val: string) => void;
}

function MonthlyPlannerColumn({ notes, monthKey, onUpdate }: PlannerColumnProps) {
  return (
    <aside className="flex flex-col border-b-[1.5px] border-b-[rgba(150,110,50,0.35)] border-dashed px-4 py-3.5 md:border-b-0 md:border-r-[1.5px] md:border-r-[rgba(150,110,50,0.35)]">
      <div className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#a07840]">Monthly focus</div>
      <div className="flex flex-1 flex-col">
        {notes.map((content, idx) => (
          <div key={idx} className="flex items-center gap-1.5 border-b border-b-[rgba(150,110,50,0.28)] px-0.5 py-1.5">
            <div className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#df8c2c] opacity-70" />
            <input
              className="w-full bg-transparent font-sans text-[clamp(11px,2.4vw,13px)] text-[#3a2a10] outline-none placeholder:text-[#c0a870]"
              type="text"
              value={content}
              placeholder={idx === 0 ? "Key objective..." : "..."}
              onChange={(e) => onUpdate(monthKey, idx, e.target.value)}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}

function WeekdayHeader() {
  return (
    <div className="mb-1 grid grid-cols-7">
      {DAY_LABELS.map((day, idx) => (
        <div key={day} className={`py-0.5 text-center text-[clamp(9px,2.2vw,11px)] font-bold tracking-[0.04em] text-[#8a6a3a] ${idx === 0 ? "text-[#b83020]" : ""}`}>
          {day}
        </div>
      ))}
    </div>
  );
}

interface GridGridProps {
  dates: Date[];
  activeMonth: Date;
  dailyNotes: Record<string, string[]>;
  today: Date;
  onDateClick: (d: Date) => void;
}

function CalendarDatesGrid({ dates, activeMonth, dailyNotes, today, onDateClick }: GridGridProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {dates.map((date, idx) => {
        const dateKey = format(date, "yyyy-MM-dd");
        const isInMonth = isSameMonth(date, activeMonth);
        const isCurrentDay = isSameDay(date, today);
        const hasChecklist = (dailyNotes[dateKey] || []).some(n => n.trim().length > 0);
        const isSunday = idx % 7 === 0;

        return (
          <div key={dateKey} className={`flex aspect-square items-center justify-center ${isSunday ? styles.sunCol : ""}`}>
            <button
              className={`
                flex min-h-[clamp(36px,9vw,44px)] min-w-[clamp(36px,9vw,44px)] aspect-square w-[min(90%,48px)] 
                items-center justify-center rounded-[5px] border-none bg-transparent font-sans text-[clamp(12px,3vw,16px)] 
                font-semibold text-[#3a2a10] transition-all duration-120 hover:bg-[rgba(223,140,44,0.18)]
                ${!isInMonth ? styles.other : ""} 
                ${isCurrentDay ? styles.today : ""} 
                ${hasChecklist ? styles.hasNote : ""}
              `}
              onClick={(e) => { e.stopPropagation(); onDateClick(date); }}
              disabled={!isInMonth}
              aria-label={format(date, "PPPP")}
            >
              {format(date, "d")}
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string | null;
  habitNotes: string[];
  onHabitChange: (notes: string[]) => void;
  onSave: () => void;
}

function AgendaPopup({ isOpen, onClose, dateKey, habitNotes, onHabitChange, onSave }: PopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(15,7,3,0.75)] p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="relative w-full max-w-[min(360px,calc(100vw-32px))] rounded-[14px] border-2 border-[rgba(150,110,50,0.45)] bg-[#fdf6e3] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute right-4 top-4 border-none bg-transparent text-2xl text-[#8a6a3a]" onClick={onClose}>×</button>
        <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#a07840]">Daily agenda</div>
        <div className="mb-5 font-['Caveat_Brush'] text-2xl text-[#3a2a10]">
          {dateKey ? format(parseISO(dateKey), "MMMM d, yyyy") : ""}
        </div>
        <div className="flex flex-col space-y-1">
          {habitNotes.map((text, idx) => (
            <input
              key={idx}
              className="w-full border-b-[1.2px] border-b-[rgba(150,110,50,0.3)] bg-transparent py-2.5 font-sans text-sm text-[#3a2a10] outline-none placeholder:text-[#c0a870]"
              value={text}
              placeholder={idx === 0 ? "What's the plan?" : "..."}
              onChange={(e) => {
                const draft = [...habitNotes];
                draft[idx] = e.target.value;
                onHabitChange(draft);
              }}
            />
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-5 py-2 font-['Caveat_Brush'] text-base text-[#8a6a3a]" onClick={onClose}>Cancel</button>
          <button className="px-6 py-2 bg-[#df8c2c] rounded-full text-white font-['Caveat_Brush'] shadow-lg" onClick={onSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}