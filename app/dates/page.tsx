"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function buildDays(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const days: (string | null)[] = Array(first).fill(null);
  for (let d = 1; d <= total; d++) {
    days.push(`${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  }
  return days;
}

function DateRangePicker({ checkIn, checkOut, onChange }: {
  checkIn: string; checkOut: string;
  onChange: (start: string, end: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const initDate = checkIn ? new Date(checkIn + "T00:00:00") : new Date();
  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [hover,     setHover]     = useState("");
  const [phase,     setPhase]     = useState<"start"|"end">(checkIn && !checkOut ? "end" : "start");

  const days = buildDays(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDay = (day: string) => {
    if (day < today) return;
    if (phase === "start" || (checkIn && checkOut)) {
      onChange(day, "");
      setPhase("end");
    } else {
      if (day <= checkIn) {
        onChange(day, "");
        setPhase("end");
      } else {
        onChange(checkIn, day);
        setPhase("start");
      }
    }
  };

  const rangeEnd = checkOut || hover;
  const isStart  = (d: string) => d === checkIn;
  const isEnd    = (d: string) => d === checkOut;
  const inRange  = (d: string) => !!(checkIn && rangeEnd && d > checkIn && d < rangeEnd);
  const isPast   = (d: string) => d < today;
  const isToday  = (d: string) => d === today;

  const accentBg      = "var(--accent)";
  const rangeBg       = "rgba(232,121,58,0.12)";
  const hoverBg       = "rgba(232,121,58,0.18)";

  const fmtShort = (d: string) => d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })
    : "";

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0;

  return (
    <div>
      {/* Instruction */}
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 300 }}>
        {!checkIn
          ? "Click your arrival date"
          : !checkOut
          ? "Now click your departure date"
          : `${fmtShort(checkIn)} → ${fmtShort(checkOut)} · ${nights} night${nights !== 1 ? "s" : ""} — click any date to change`}
      </div>

      {/* Calendar */}
      <div style={{
        background: "rgba(255,255,255,0.72)",
        border: "1.5px solid rgba(0,0,0,0.09)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        maxWidth: 380,
      }}>
        {/* Month header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem 0.75rem" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-secondary)", padding: "0.25rem 0.5rem", borderRadius: 8 }}>‹</button>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>
            {MONTHS[viewMonth]} {viewYear}
          </div>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-secondary)", padding: "0.25rem 0.5rem", borderRadius: 8 }}>›</button>
        </div>

        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 0.75rem" }}>
          {DAY_LABELS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", padding: "0.25rem 0", letterSpacing: "0.05em" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0.25rem 0.75rem 1rem", gap: "2px" }}>
          {days.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const start   = isStart(day);
            const end     = isEnd(day);
            const range   = inRange(day);
            const past    = isPast(day);
            const tod     = isToday(day);
            const hov     = hover === day && !past;
            const cap     = start || end;

            return (
              <div
                key={day}
                onClick={() => !past && handleDay(day)}
                onMouseEnter={() => !past && phase === "end" && checkIn && !checkOut && setHover(day)}
                onMouseLeave={() => setHover("")}
                style={{
                  textAlign: "center",
                  padding: "0.4rem 0",
                  borderRadius: cap ? 8 : range || hov ? 0 : 8,
                  background: cap ? accentBg : range ? rangeBg : hov ? hoverBg : "transparent",
                  color: cap ? "white" : past ? "rgba(0,0,0,0.2)" : "var(--text-primary)",
                  cursor: past ? "default" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: cap ? 700 : tod ? 600 : 400,
                  position: "relative",
                  transition: "background 0.1s ease",
                  borderTopLeftRadius: start || (range && new Date(day).getDay() === 0) ? 8 : 0,
                  borderBottomLeftRadius: start || (range && new Date(day).getDay() === 0) ? 8 : 0,
                  borderTopRightRadius: end || (range && new Date(day).getDay() === 6) ? 8 : 0,
                  borderBottomRightRadius: end || (range && new Date(day).getDay() === 6) ? 8 : 0,
                }}
              >
                {new Date(day + "T00:00:00").getDate()}
                {tod && !cap && (
                  <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {checkIn && checkOut && nights > 0 && (
        <div className="tf-callout" style={{ marginTop: "1rem" }}>
          <strong>{nights} night{nights !== 1 ? "s" : ""}</strong>
          {" — "}
          {new Date(checkIn + "T00:00:00").toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
          {" to "}
          {new Date(checkOut + "T00:00:00").toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      )}
    </div>
  );
}

export default function DatesPage() {
  const router    = useRouter();
  const storedIn  = useBookingStore((s) => s.checkIn);
  const storedOut = useBookingStore((s) => s.checkOut);
  const setCheckIn  = useBookingStore((s) => s.setCheckIn);
  const setCheckOut = useBookingStore((s) => s.setCheckOut);
  const adults    = useBookingStore((s) => s.adults);
  const children  = useBookingStore((s) => s.children);

  const [checkIn,  setLocalIn]  = useState(storedIn  || "");
  const [checkOut, setLocalOut] = useState(storedOut || "");
  const [error, setError] = useState("");

  const progress = Math.round((3 / 8) * 100);

  const handleChange = (start: string, end: string) => {
    setLocalIn(start);
    setLocalOut(end);
    setError("");
  };

  const handleContinue = () => {
    if (!checkIn)  { setError("Please select your arrival date."); return; }
    if (!checkOut) { setError("Please select your departure date."); return; }
    setCheckIn(checkIn);
    setCheckOut(checkOut);
    router.push("/rooms");
  };

  return (
    <div className="tf-step">
      <div className="tf-progress">
        <div className="tf-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="tf-body" style={{ justifyContent: "flex-start", paddingTop: "3rem" }}>
        <div className="tf-step-label tf-animate">Step 3 of 8</div>
        <h1 className="tf-question tf-animate tf-animate-delay-1">
          When are you <em>arriving</em>?
        </h1>
        <p className="tf-subtext tf-animate tf-animate-delay-2">
          {adults} adult{adults !== 1 ? "s" : ""}{children > 0 ? ` + ${children} children` : ""}
        </p>

        <div className="tf-animate tf-animate-delay-2">
          <DateRangePicker checkIn={checkIn} checkOut={checkOut} onChange={handleChange} />
        </div>

        {error && <div className="tf-alert-error" style={{ marginTop: "1rem" }}>{error}</div>}

        <button className="tf-ok" onClick={handleContinue} style={{ marginTop: "1.5rem" }}>
          OK
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="tf-hint"><kbd>Enter</kbd><span>to continue</span></div>
        <button className="tf-back" onClick={() => router.back()}>← Back</button>
      </div>
    </div>
  );
}
