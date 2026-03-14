"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

export default function GuestsPage() {
  const router = useRouter();
  const storedAdults       = useBookingStore((s) => s.adults);
  const storedChildren     = useBookingStore((s) => s.children);
  const storedChildrenAge  = useBookingStore((s) => s.childrenAvgAge);
  const setAdults          = useBookingStore((s) => s.setAdults);
  const setChildren        = useBookingStore((s) => s.setChildren);
  const setChildrenAvgAge  = useBookingStore((s) => s.setChildrenAvgAge);

  const [adults,   setLocalAdults]   = useState(storedAdults   || 0);
  const [children, setLocalChildren] = useState(storedChildren || 0);
  const [avgAge,   setLocalAvgAge]   = useState(storedChildrenAge || 8);
  const [error,    setError]         = useState("");

  const progress = Math.round((2 / 8) * 100);
  const isGroup  = adults >= SITE_CONFIG.groupMinimum;

  const handleContinue = () => {
    if (adults < 1) { setError("Please add at least 1 adult."); return; }
    if (adults > 500) { setError("For groups over 500, please contact us directly."); return; }
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

        {/* Adults */}
        <div className="tf-animate tf-animate-delay-2" style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Adults
          </div>
          <div className="tf-number-row">
            <button className="tf-qty-btn" onClick={() => setLocalAdults(Math.max(0, adults - 1))} disabled={adults === 0}>−</button>
            <div className="tf-qty-value">{adults}</div>
            <button className="tf-qty-btn" onClick={() => setLocalAdults(Math.min(500, adults + 1))}>+</button>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>people 18+</span>
          </div>
        </div>

        {/* Children */}
        <div className="tf-animate tf-animate-delay-3" style={{ marginBottom: children > 0 ? "2.5rem" : "0" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Children <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </div>
          <div className="tf-number-row">
            <button className="tf-qty-btn" onClick={() => setLocalChildren(Math.max(0, children - 1))} disabled={children === 0}>−</button>
            <div className="tf-qty-value">{children}</div>
            <button className="tf-qty-btn" onClick={() => setLocalChildren(children + 1)}>+</button>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>under 18</span>
          </div>
        </div>

        {/* Avg age — only when children > 0 */}
        {children > 0 && (
          <div className="tf-animate" style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Children&apos;s average age
            </div>
            <div className="tf-number-row">
              <button className="tf-qty-btn" onClick={() => setLocalAvgAge(Math.max(1, avgAge - 1))} disabled={avgAge <= 1}>−</button>
              <div className="tf-qty-value">{avgAge}</div>
              <button className="tf-qty-btn" onClick={() => setLocalAvgAge(Math.min(17, avgAge + 1))} disabled={avgAge >= 17}>+</button>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>years old (avg)</span>
            </div>
          </div>
        )}

        {/* Group hint */}
        {adults > 0 && (
          <div className="tf-callout tf-animate" style={{ marginBottom: "1.5rem" }}>
            {isGroup ? (
              <><strong>Group pricing applies.</strong> You&apos;ll select meeting rooms, catered meals and activities after your rooms.</>
            ) : (
              <><strong>Small group booking.</strong> Groups of {SITE_CONFIG.groupMinimum}+ unlock catering and meeting rooms.</>
            )}
          </div>
        )}

        {error && <div className="tf-alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <button className="tf-ok" onClick={handleContinue}>
          OK
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div className="tf-hint">
          <kbd>Enter</kbd><span>to continue</span>
        </div>

        <button className="tf-back" onClick={() => router.back()}>← Back</button>
      </div>
    </div>
  );
}
