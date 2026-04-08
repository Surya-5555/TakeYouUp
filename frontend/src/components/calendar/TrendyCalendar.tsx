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
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SHELF_BOOKS: Array<[number, number, string]> = [
  [12, 50, "#8a2020"],
  [10, 42, "#1a4a8a"],
  [14, 55, "#2a6a2a"],
  [8,  38, "#8a6a20"],
  [11, 48, "#6a1a6a"],
  [9,  44, "#4a4a4a"],
  [13, 52, "#2a5a5a"],
];

const MOTE_DATA = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left:     `${5 + (i * 6.1) % 88}%`,
  top:      `${10 + (i * 8.3) % 70}%`,
  size:     1 + (i % 3) * 0.6,
  duration: 10 + (i * 1.4) % 18,
  delay:    (i * 1.2) % 16,
}));

function getFlipClass(phase: FlipPhase): string {
  if (phase === "outNext") return styles.flipOutNext;
  if (phase === "inNext")  return styles.flipInNext;
  if (phase === "outPrev") return styles.flipOutPrev;
  if (phase === "inPrev")  return styles.flipInPrev;
  return "";
}

function buildMonthCells(currentMonth: Date): Date[] {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 0 });
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

  const [phase, setPhase]                     = useState<FlipPhase>("idle");
  const [overlayOpen, setOverlayOpen]         = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [draftNotes, setDraftNotes]           = useState<string[]>(["","","","",""]);
  const [pullAngle, setPullAngle]             = useState(0);
  const [pullX, setPullX]                     = useState(0);
  const [isPulled, setIsPulled]               = useState(false);
  const [isWobbling, setIsWobbling]           = useState(false);
  const [wobbleAmp, setWobbleAmp]             = useState(0);

  const touchStartY    = useRef(0);
  const mouseDownY     = useRef(0);
  const mouseDownX     = useRef(0);
  const dragging       = useRef(false);
  const livePullAngle  = useRef(0);
  const livePullX      = useRef(0);
  const wobbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMonth = parseISO(currentMonthIso);
  const monthKey     = format(currentMonth, "yyyy-MM");
  const monthMemo    = (monthNotes[monthKey] || Array(6).fill("")) as string[];
  const cells        = buildMonthCells(currentMonth);
  const today        = new Date();

  useEffect(() => {
    const now = new Date();
    const sameMonth =
      currentMonth.getFullYear() === now.getFullYear() &&
      currentMonth.getMonth() === now.getMonth();

    if (sameMonth) return;
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 15, 12, 0, 0, 0));
  }, [currentMonth, setCurrentMonth]);

  const beginFlip = (dir: 1 | -1) => {
    if (phase !== "idle") return;
    setPhase(dir > 0 ? "outNext" : "outPrev");
  };

  const changeMonthImmediate = (dir: 1 | -1) => {
    setCurrentMonth(dir > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  const handleAnimationEnd = () => {
    if (phase === "outNext") { changeMonthImmediate(1);  setPhase("inNext");  return; }
    if (phase === "outPrev") { changeMonthImmediate(-1); setPhase("inPrev");  return; }
    if (phase === "inNext" || phase === "inPrev") setPhase("idle");
  };

  const openDay = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;
    const dateKey = format(date, "yyyy-MM-dd");
    setSelectedDateKey(dateKey);
    setDraftNotes(dayNotes[dateKey] || ["","","","",""]);
    setOverlayOpen(true);
  };

  const closeDay    = () => { setOverlayOpen(false); setSelectedDateKey(null); };
  const saveDayNotes = () => {
    if (!selectedDateKey) return;
    setFullDayNote(selectedDateKey, draftNotes);
    closeDay();
  };

  const updatePull = (clientX: number) => {
    if (!dragging.current) return;
    const dx    = clientX - mouseDownX.current;
    const angle = Math.max(-8, Math.min(8, dx * 0.05));
    const shift = Math.max(-12, Math.min(12, dx * 0.25));
    livePullAngle.current = angle;
    livePullX.current     = shift;
    setPullAngle(angle);
    setPullX(shift);
    setIsPulled(true);
  };

  const releasePull = () => {
    const amp = Math.min(8, Math.abs(livePullAngle.current));
    setPullAngle(0); setPullX(0); setIsPulled(false);
    if (amp < 0.7) { livePullAngle.current = 0; livePullX.current = 0; return; }
    setWobbleAmp(amp);
    setIsWobbling(true);
    if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
    wobbleTimerRef.current = setTimeout(() => {
      setIsWobbling(false); setWobbleAmp(0);
    }, 1800);
    livePullAngle.current = 0; livePullX.current = 0;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => updatePull(e.clientX);
    const onMouseUp   = (e: MouseEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      releasePull();
      const dy = mouseDownY.current - e.clientY;
      if (Math.abs(dy) <= 70) return;
      setPhase((prev) => prev !== "idle" ? prev : dy > 0 ? "outNext" : "outPrev");
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

  return (
    <div className={styles.scene}>
      {/* ── z0: BRICK WALL ── */}
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

      {/* ── z1: ROOM DECOR ── */}
      <div className={styles.wallpaper} aria-hidden="true" />
      <div className={styles.roomFloor} aria-hidden="true" />
      <div className={styles.baseboard} aria-hidden="true" />

      {/* Window */}
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

      {/* Bookshelf */}
      <div className={styles.bookShelf} aria-hidden="true">
        <div style={{ display:"flex", alignItems:"flex-end", gap:3, padding:"0 5px", position:"absolute", bottom:12, left:0, right:0 }}>
          {SHELF_BOOKS.map(([w, h, color], i) => (
            <div key={i} style={{ width:w, height:h, background:color, borderRadius:"1px 2px 2px 1px", boxShadow:"1px 0 4px rgba(0,0,0,0.45)", flexShrink:0 }} />
          ))}
        </div>
        <div className={styles.shelfBoard} />
      </div>

      {/* Candle */}
      <div className={styles.candle} aria-hidden="true">
        <div className={styles.candleFlame} />
        <div className={styles.candleBody} />
      </div>
      <div className={styles.candleGlow} style={{ width:220, height:170, right:"calc(3% + 30px)", top:"calc(20% - 90px)" }} aria-hidden="true" />

      {/* Plant */}
      <div className={styles.plantPot} aria-hidden="true">
        <div style={{ position:"relative", height:44 }}>
          <div style={{ position:"absolute", bottom:0, left:9,  width:28, height:18, background:"#2a6a20", borderRadius:"50% 0 50% 0", transform:"rotate(-35deg)", transformOrigin:"bottom center" }} />
          <div style={{ position:"absolute", bottom:0, left:7,  width:32, height:20, background:"#3a8030", borderRadius:"50% 0 50% 0", transform:"rotate(25deg)",  transformOrigin:"bottom center" }} />
          <div style={{ position:"absolute", bottom:4, left:13, width:22, height:14, background:"#488040", borderRadius:"50% 0 50% 0", transform:"rotate(-10deg)", transformOrigin:"bottom center" }} />
        </div>
        <div className={styles.potRim} />
        <div className={styles.potBody} />
      </div>

      {/* Dust motes */}
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
        {MOTE_DATA.map((m) => (
          <div key={m.id} style={{
            position:"absolute", left:m.left, top:m.top,
            width:m.size, height:m.size,
            background:"rgba(255,220,150,0.6)", borderRadius:"50%",
            animation:`dustFloat ${m.duration}s ${m.delay}s linear infinite`,
          }} />
        ))}
      </div>

      {/* ── z5: VIGNETTE ── */}
      <div className={styles.wallVignette} aria-hidden="true" />

      {/* ════════════════════════════════════════
          z10: CALENDAR — always on top
          ════════════════════════════════════════ */}
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
          "--pull-angle":   `${pullAngle}deg`,
          "--pull-x":       `${pullX}px`,
          "--wobble-angle": `${wobbleAmp}deg`,
        } as React.CSSProperties}
      >
        <div className={`${styles.pageBack} ${styles.pageBack1}`} />
        <div className={`${styles.pageBack} ${styles.pageBack2}`} />
        <div className={`${styles.pageBack} ${styles.pageBack3}`} />

        <div className={styles.flipPerspective}>
          <section
            className={`${styles.calPage} ${getFlipClass(phase)}`}
            onAnimationEnd={handleAnimationEnd}
            onTouchStart={(e) => {
              touchStartY.current  = e.touches[0].clientY;
              mouseDownX.current   = e.touches[0].clientX;
              setIsWobbling(false);
              if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
              dragging.current = true;
            }}
            onTouchMove={(e) => updatePull(e.touches[0].clientX)}
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
              dragging.current   = true;
              setIsWobbling(false);
              if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft")  beginFlip(-1);
              if (e.key === "ArrowRight") beginFlip(1);
            }}
            tabIndex={0}
            aria-label="Monthly planner calendar"
          >
            {/* HERO */}
            <div className={styles.calHero}>
              <div className={styles.heroBgBlur} style={{ backgroundImage: "url('/portrait.png')" }} />
              <div className={styles.heroPattern} />
              <div className={styles.heroOverlay} />
              <div className={styles.heroLeft}>
                <div className={styles.heroEyebrow}>Monthly Planner</div>
                <div className={styles.heroMonth}>{format(currentMonth, "MMMM")}</div>
                <div className={styles.heroYear}>{format(currentMonth, "yyyy")}</div>
                <div className={styles.heroNav}>
                  <button className={styles.navBtn} onClick={() => beginFlip(-1)} aria-label="Previous month">
                    <ChevronLeft size={20} />
                  </button>
                  <button className={styles.navBtn} onClick={() => beginFlip(1)} aria-label="Next month">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className={styles.heroDeco} aria-hidden="true">
                {MONTH_ABBR[currentMonth.getMonth()]}
              </div>
              
              {/* Added fallback to ensure next.js can load standard imgs without error */}
              <img src="/portrait.png" alt="Portrait" className={styles.heroPortrait} />
              
              <div className={styles.heroSwipeHint}>swipe up/down or drag to flip pages</div>
            </div>

            {/* BODY */}
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
                    const col     = idx % 7;
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
      </div>

      {/* MODAL */}
      {overlayOpen && (
        <div className={styles.overlay} onClick={closeDay}>
          <div className={styles.notepadModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={closeDay} aria-label="Close notes">×</button>
            <div className={styles.modalSub}>Daily agenda</div>
            <div className={styles.modalDate}>
              {selectedDateObj ? format(selectedDateObj, "MMMM d, yyyy") : ""}
            </div>
            <div className={styles.modalLines}>
              {["What's the plan?", "...", "...", "...", "..."].map((ph, idx) => (
                <input
                  key={idx}
                  className={styles.modalInp}
                  value={draftNotes[idx] || ""}
                  placeholder={ph}
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