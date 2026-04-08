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

type FlipPhase = "idle" | "outNext" | "outPrev" | "inNext" | "inPrev";

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getFlipClass(phase: FlipPhase): string {
  if (phase === "outNext") return styles.flipOutNext;
  if (phase === "inNext") return styles.flipInNext;
  if (phase === "outPrev") return styles.flipOutPrev;
  if (phase === "inPrev") return styles.flipInPrev;
  return "";
}

function buildMonthCells(currentMonth: Date): Date[] {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const cells: Date[] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    cells.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return cells;
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

  const [phase, setPhase] = useState<FlipPhase>("idle");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<string[]>(["", "", "", "", ""]);
  const [pullAngle, setPullAngle] = useState(0);
  const [pullX, setPullX] = useState(0);
  const [isPulled, setIsPulled] = useState(false);
  const [isWobbling, setIsWobbling] = useState(false);
  const [wobbleAmp, setWobbleAmp] = useState(0);

  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const mouseDownY = useRef(0);
  const mouseDownX = useRef(0);
  const dragging = useRef(false);
  const livePullAngle = useRef(0);
  const livePullX = useRef(0);
  const wobbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMonth = parseISO(currentMonthIso);
  const monthKey = format(currentMonth, "yyyy-MM");
  const monthMemo = (monthNotes[monthKey] || Array(6).fill("")) as string[];
  const cells = buildMonthCells(currentMonth);

  const beginFlip = (dir: 1 | -1) => {
    if (phase !== "idle") return;
    setPhase(dir > 0 ? "outNext" : "outPrev");
  };

  const changeMonthImmediate = (dir: 1 | -1) => {
    setCurrentMonth(dir > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  const handleAnimationEnd = () => {
    if (phase === "outNext") {
      changeMonthImmediate(1);
      setPhase("inNext");
      return;
    }
    if (phase === "outPrev") {
      changeMonthImmediate(-1);
      setPhase("inPrev");
      return;
    }
    if (phase === "inNext" || phase === "inPrev") {
      setPhase("idle");
    }
  };

  const openDay = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;
    const dateKey = format(date, "yyyy-MM-dd");
    setSelectedDateKey(dateKey);
    setDraftNotes(dayNotes[dateKey] || ["", "", "", "", ""]);
    setOverlayOpen(true);
  };

  const closeDay = () => {
    setOverlayOpen(false);
    setSelectedDateKey(null);
  };

  const saveDayNotes = () => {
    if (!selectedDateKey) return;
    setFullDayNote(selectedDateKey, draftNotes);
    closeDay();
  };

  const updatePull = (clientX: number) => {
    if (!dragging.current) return;

    const dx = clientX - mouseDownX.current;
    const angle = Math.max(-8, Math.min(8, dx * 0.05));
    const shift = Math.max(-12, Math.min(12, dx * 0.25));

    livePullAngle.current = angle;
    livePullX.current = shift;
    setPullAngle(angle);
    setPullX(shift);
    setIsPulled(true);
  };

  const releasePull = () => {
    const amp = Math.min(8, Math.abs(livePullAngle.current));
    setPullAngle(0);
    setPullX(0);
    setIsPulled(false);

    if (amp < 0.7) {
      livePullAngle.current = 0;
      livePullX.current = 0;
      return;
    }

    setWobbleAmp(amp);
    setIsWobbling(true);
    if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
    wobbleTimerRef.current = setTimeout(() => {
      setIsWobbling(false);
      setWobbleAmp(0);
    }, 1800);

    livePullAngle.current = 0;
    livePullX.current = 0;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      updatePull(e.clientX);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      releasePull();

      const dy = mouseDownY.current - e.clientY;
      if (Math.abs(dy) <= 70) return;
      setPhase((prev) => {
        if (prev !== "idle") return prev;
        return dy > 0 ? "outNext" : "outPrev";
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
    };
  }, []);

  const selectedDateObj = selectedDateKey ? parseISO(`${selectedDateKey}T00:00:00`) : null;
  const today = new Date();

  return (
    <div className={styles.scene}>
      <svg className={styles.brickBg} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">
        <defs>
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="4" seed="5" />
            <feDisplacementMap in="SourceGraphic" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <pattern id="bricks" x="0" y="0" width="90" height="38" patternUnits="userSpaceOnUse">
            <rect x="1" y="1" width="86" height="16" rx="1" fill="#3a1e10" stroke="#200e05" strokeWidth="0.8" filter="url(#rough)" />
            <rect x="-44" y="20" width="86" height="16" rx="1" fill="#371c0e" stroke="#200e05" strokeWidth="0.8" filter="url(#rough)" />
            <rect x="46" y="20" width="86" height="16" rx="1" fill="#3c2012" stroke="#200e05" strokeWidth="0.8" filter="url(#rough)" />
            <line x1="0" y1="18.5" x2="90" y2="18.5" stroke="#180a04" strokeWidth="1.8" opacity="0.75" />
            <line x1="0" y1="37.5" x2="90" y2="37.5" stroke="#180a04" strokeWidth="1.8" opacity="0.75" />
            <line x1="0" y1="0" x2="90" y2="0" stroke="#180a04" strokeWidth="1.8" opacity="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bricks)" />
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.22)" />
      </svg>

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
        className={`${styles.calStack} ${isPulled ? styles.calStackPulled : ""} ${isWobbling ? styles.calStackWobble : ""}`}
        style={{
          "--pull-angle": `${pullAngle}deg`,
          "--pull-x": `${pullX}px`,
          "--wobble-angle": `${wobbleAmp}deg`,
        } as React.CSSProperties}
      >
        <div className={`${styles.pageBack} ${styles.pageBack1}`} />
        <div className={`${styles.pageBack} ${styles.pageBack2}`} />
        <div className={`${styles.pageBack} ${styles.pageBack3}`} />

        <section
          className={`${styles.calPage} ${getFlipClass(phase)}`}
          onAnimationEnd={handleAnimationEnd}
          onTouchStart={(e) => {
            touchStartY.current = e.touches[0].clientY;
            touchStartX.current = e.touches[0].clientX;
            mouseDownX.current = e.touches[0].clientX;
            setIsWobbling(false);
            if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
            dragging.current = true;
          }}
          onTouchMove={(e) => {
            updatePull(e.touches[0].clientX);
          }}
          onTouchEnd={(e) => {
            dragging.current = false;
            releasePull();

            const dy = touchStartY.current - e.changedTouches[0].clientY;
            if (Math.abs(dy) <= 55) return;
            beginFlip(dy > 0 ? 1 : -1);
          }}
          onMouseDown={(e) => {
            mouseDownY.current = e.clientY;
            mouseDownX.current = e.clientX;
            dragging.current = true;
            setIsWobbling(false);
            if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") beginFlip(-1);
            if (e.key === "ArrowRight") beginFlip(1);
          }}
          tabIndex={0}
          aria-label="Monthly planner calendar"
        >
          <div className={styles.calHero}>
            <div className={styles.heroBgBlur} style={{ backgroundImage: "url('/portrait.png')" }} />
            <div className={styles.heroOverlay} />

            <div className={styles.heroLeft}>
              <div className={styles.heroEyebrow}>Monthly Planner</div>
              <div className={styles.heroMonth}>{format(currentMonth, "MMMM")}</div>
              <div className={styles.heroYear}>{format(currentMonth, "yyyy")}</div>
              <div className={styles.heroNav}>
                <button
                  className={styles.navBtn}
                  onClick={() => beginFlip(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className={styles.navBtn}
                  onClick={() => beginFlip(1)}
                  aria-label="Next month"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <img src="/portrait.png" alt="Portrait" className={styles.heroPortrait} />
            <div className={styles.heroSwipeHint}>swipe up/down or drag to flip pages</div>
          </div>

          <div className={styles.calBody}>
            <aside className={styles.notesCol}>
              <div className={styles.notesLabel}>Monthly notes</div>
              <div className={styles.noteLinesList}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className={styles.noteLineItem}>
                    <div className={styles.noteBullet} />
                    <input
                      className={styles.noteInp}
                      type="text"
                      value={monthMemo[idx] || ""}
                      placeholder={idx === 0 ? "Add a note..." : "..."}
                      onChange={(e) => setMonthNote(monthKey, idx, e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      aria-label={`Monthly note line ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </aside>

            <div className={styles.gridCol}>
              <div className={styles.dayNames}>
                {DAY_NAMES.map((day, idx) => (
                  <div key={day} className={`${styles.dayName} ${idx === 0 ? styles.sun : ""}`}>
                    {day}
                  </div>
                ))}
              </div>

              <div className={styles.calGrid}>
                {cells.map((date, idx) => {
                  const dateKey = format(date, "yyyy-MM-dd");
                  const inMonth = isSameMonth(date, currentMonth);
                  const isToday = isSameDay(date, today);
                  const hasNote = (dayNotes[dateKey] || []).some((n) => n.trim().length > 0);
                  const col = idx % 7;

                  return (
                    <div key={dateKey} className={`${styles.dayCell} ${col === 0 ? styles.sunCol : ""}`}>
                      <button
                        className={`${styles.dayBtn} ${!inMonth ? styles.other : ""} ${isToday ? styles.today : ""} ${hasNote ? styles.hasNote : ""}`}
                        onClick={() => openDay(date)}
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

      {overlayOpen && (
        <div className={styles.overlay} onClick={closeDay}>
          <div className={styles.notepadModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={closeDay} aria-label="Close notes">
              x
            </button>
            <div className={styles.modalSub}>Daily agenda</div>
            <div className={styles.modalDate}>
              {selectedDateObj ? format(selectedDateObj, "MMMM d, yyyy") : ""}
            </div>

            <div className={styles.modalLines}>
              {["What's the plan?", "...", "...", "...", "..."].map((placeholder, idx) => (
                <input
                  key={idx}
                  className={styles.modalInp}
                  value={draftNotes[idx] || ""}
                  placeholder={placeholder}
                  onChange={(e) => {
                    const next = [...draftNotes];
                    next[idx] = e.target.value;
                    setDraftNotes(next);
                  }}
                  aria-label={`Daily note line ${idx + 1}`}
                />
              ))}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={closeDay}>Cancel</button>
              <button className={styles.btnSave} onClick={saveDayNotes}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
