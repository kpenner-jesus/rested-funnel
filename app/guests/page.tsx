"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "0.4rem 0.7rem",
  background: disabled ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 8,
  fontSize: "0.8rem",
  fontWeight: 600,
  color: disabled ? "rgba(0,0,0,0.2)" : "var(--text-secondary)",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.15s ease",
  fontFamily: "var(--font-body)",
  lineHeight: 1,
  minWidth: "2.8rem",
  textAlign: "center" as const,
});

function Counter({ label, hint, value, min = 0, max = 999, onChange }: {
  label: string; hint: string; value: number; min?: number; max?: number;
  onChange: (n: number) => void;
}) {
  const adj = (d: number) => onChange(Math.min(max, Math.max(min, value + d)));
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.875rem" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
          {[-100, -10, -1].map((d) => {
            const dis = value + d < min;
            return (
              <button key={d} style={btnStyle(dis)} disabled={dis}
                onMouseEnter={(e) => { if (!dis) { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,0,0,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = dis ? "rgba(0,0,0,0.2)" : "var(--text-secondary)"; }}
                onClick={() => adj(d)}>{d}</button>
            );
          })}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 500, flex: 1, textAlign: "center", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
          {[1, 10, 100].map((d) => {
            const dis = value + d > max;
            return (
              <button key={d} style={btnStyle(dis)} disabled={dis}
                onMouseEnter={(e) => { if (!dis) { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,0,0,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = dis ? "rgba(0,0,0,0.2)" : "var(--text-secondary)"; }}
                onClick={() => adj(d)}>+{d}</button>
            );
          })}
        </div>
      </div>
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem", fontWeight: 300 }}>{hint}</div>
    </div>
  );
}

export default function GuestsPage() {
  const router = useRouter();
  const storedAdults      = useBookingStore((s) => s.adults);
  const storedChildren    = useBookingStore((s) => s.children);
  const storedChildrenAge = useBookingStore((s) => s.childrenAvgAge);
  const setAdults         = useBookingStore((s) => s.setAdults);
  const setChildren       = useBookingStore((s) => s.setChildren);
  const setChildrenAvgAge = useBookingStore((s) => s.setChildrenAvgAge);

  const [adults,   setLocalAdults]   = useState(storedAdults   || 0);
  const [children, setLocalChildren] = useState(storedChildren || 0);
  const [avgAge,   setLocalAvgAge]   = useState(storedChildrenAge > 0 ? Math.min(10, storedChildrenAge) : 8);
  const [error,    setError]         = useState("");

  const progress = Math.round((2 / 8) * 100);
  const isGroup  = adults >= SITE_CONFIG.groupMinimum;

  const handleContinue = () => {
    if (adults < 1) { setError("Please add at least 1 adult."); return; }
    setAdults(adults);
    setChildren(children);
    setChildrenAvgAge(children > 0 ? avgAge : 0);
    sessionStorage.setItem("isGroupBooking", String(adults >= SITE_CONFIG.groupMinimum));
    router.push("/dates");
  };

  return (
    <div className="tf-step">
      <div className="tf-progress">
        <div className="tf-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="tf-body">
        <div className="tf-step-label tf-animate">Step 2 of 8</div>
        <h1 className="tf-question tf-animate tf-animate-delay-1">
          How many <em>guests</em>?
        </h1>
        <p className="tf-subtext tf-animate tf-animate-delay-2">
          This determines your rooms, meals and meeting spaces.
        </p>

        <div className="tf-animate tf-animate-delay-2">
          <Counter label="Adults" hint="people 18+" value={adults} min={0} max={500}
            onChange={(n) => { setLocalAdults(n); setError(""); }} />
          <Counter label="Children (optional)" hint="under 18" value={children} min={0} max={200}
            onChange={setLocalChildren} />

          {children > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                Children&apos;s average age
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button className="tf-qty-btn"
                  onClick={() => setLocalAvgAge(Math.max(1, avgAge - 1))}
                  disabled={avgAge <= 1}>−</button>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 500, minWidth: "2.5rem", textAlign: "center", lineHeight: 1 }}>
                  {avgAge}
                </div>
                <button className="tf-qty-btn"
                  onClick={() => setLocalAvgAge(Math.min(10, avgAge + 1))}
                  disabled={avgAge >= 10}>+</button>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>years old (avg)</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ visibility: adults > 0 ? "visible" : "hidden", opacity: adults > 0 ? 1 : 0, transition: "opacity 0.35s ease", marginBottom: "1.5rem" }}>
          <div className="tf-callout">
            {isGroup
              ? <><strong>Group pricing applies.</strong> You&apos;ll select meeting rooms, catered meals and activities after your rooms.</>
              : <><strong>Small group booking.</strong> Groups of {SITE_CONFIG.groupMinimum}+ unlock catering and meeting rooms.</>
            }
          </div>
        </div>

        {error && <div className="tf-alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <button className="tf-ok" onClick={handleContinue}>
          OK
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="tf-hint"><kbd>Enter</kbd><span>to continue</span></div>
        <button className="tf-back" onClick={() => router.back()}>← Back</button>
      </div>
    </div>
  );
}
