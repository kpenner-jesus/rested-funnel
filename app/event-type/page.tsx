"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

const KEYS = ["A","B","C","D","E","F","G","H","I","J"];

export default function EventTypePage() {
  const router = useRouter();
  const segment      = useBookingStore((s) => s.segment);
  const storedType   = useBookingStore((s) => s.eventType);
  const setEventType = useBookingStore((s) => s.setEventType);

  const [selected, setSelected] = useState(storedType || "");
  const [error, setError] = useState("");

  const segmentConfig = SITE_CONFIG.eventSegments.find((s) => s.name === segment);
  const eventTypes = segmentConfig?.types ?? [];

  const handleSelect = (type: string) => {
    setSelected(type);
    setError("");
    setEventType(type);
    setTimeout(() => router.push("/guests"), 220);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const idx = KEYS.indexOf(e.key.toUpperCase());
      if (idx >= 0 && idx < eventTypes.length) handleSelect(eventTypes[idx]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [eventTypes]);

  if (!segment) {
    return (
      <div className="tf-step">
        <div className="tf-body" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Please start from the beginning.</p>
          <button className="tf-ok" onClick={() => router.push("/")}>Start over</button>
        </div>
      </div>
    );
  }

  const progress = Math.round((1 / 8) * 100);

  return (
    <div className="tf-step">
      <div className="tf-progress">
        <div className="tf-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="tf-body">
        <div className="tf-step-label tf-animate">Step 1b of 8</div>

        <h1 className="tf-question tf-animate tf-animate-delay-1">
          What type of <em>{segment.toLowerCase()}</em>?
        </h1>

        <p className="tf-subtext tf-animate tf-animate-delay-2">
          This helps us tailor your quote and assign the right coordinator.
        </p>

        <div className="tf-choices">
          {eventTypes.map((type, i) => (
            <button
              key={type}
              className={`tf-choice tf-animate tf-animate-delay-${Math.min(i + 3, 8)} ${selected === type ? "selected" : ""}`}
              onClick={() => handleSelect(type)}
            >
              <span className="tf-choice-key">{KEYS[i]}</span>
              <span className="tf-choice-text">
                <span className="tf-choice-name">{type}</span>
              </span>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>

        {error && <div className="tf-alert-error tf-animate" style={{ marginTop: "1rem" }}>{error}</div>}

        <div className="tf-hint tf-animate" style={{ animationDelay: "0.55s" }}>
          <kbd>A</kbd><kbd>B</kbd><kbd>C</kbd>
          <span>— press a key to select</span>
        </div>

        <button className="tf-back" onClick={() => router.back()}>
          ← Back
        </button>
      </div>
    </div>
  );
}
