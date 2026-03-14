"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "./store";
import { SITE_CONFIG } from "./siteConfig";

const KEYS = ["A","B","C","D","E","F","G","H"];

export default function HomePage() {
  const router = useRouter();
  const setSegment   = useBookingStore((s) => s.setSegment);
  const setEventType = useBookingStore((s) => s.setEventType);

  const handleSelect = (segmentName: string) => {
    setSegment(segmentName);
    setEventType("");
    const seg = SITE_CONFIG.eventSegments.find((s) => s.name === segmentName);
    setTimeout(() => {
      router.push(seg && seg.types.length > 0 ? "/event-type" : "/guests");
    }, 180);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const idx = KEYS.indexOf(e.key.toUpperCase());
      if (idx >= 0 && idx < SITE_CONFIG.eventSegments.length) {
        handleSelect(SITE_CONFIG.eventSegments[idx].name);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="tf-step">
      <div className="tf-progress">
        <div className="tf-progress-fill" style={{ width: "0%" }} />
      </div>

      <div className="tf-body">

        {/* Logo */}
        <div className="tf-animate" style={{ marginBottom: "2.5rem" }}>
          <img
            src={SITE_CONFIG.venueLogo}
            alt={SITE_CONFIG.venueName}
            style={{ height: "40px", width: "auto", objectFit: "contain", opacity: 0.85 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        <div className="tf-step-label tf-animate tf-animate-delay-1">
          Let&apos;s get started
        </div>

        <h1 className="tf-question tf-animate tf-animate-delay-1">
          What brings you to <em>{SITE_CONFIG.venueName.split(" ")[0]}</em>?
        </h1>

        <p className="tf-subtext tf-animate tf-animate-delay-2">
          We&apos;ll tailor your quote based on your answer.
        </p>

        <div className="tf-choices">
          {SITE_CONFIG.eventSegments.map((seg, i) => (
            <button
              key={seg.name}
              className={`tf-choice tf-animate tf-animate-delay-${Math.min(i + 3, 8)}`}
              onClick={() => handleSelect(seg.name)}
            >
              <span className="tf-choice-key">{KEYS[i]}</span>
              <span className="tf-choice-text">
                <span className="tf-choice-name">{seg.name}</span>
                {seg.desc && (
                  <span className="tf-choice-desc">{seg.desc}</span>
                )}
              </span>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>

        <div className="tf-hint tf-animate" style={{ animationDelay: "0.55s" }}>
          <kbd>A</kbd><kbd>B</kbd><kbd>C</kbd>
          <span>— press a key to select</span>
        </div>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: "1.25rem", fontSize: "0.78rem", color: "var(--text-muted)" }}
             className="tf-animate" >
          <a href={`tel:${SITE_CONFIG.venuePhone}`}
             style={{ color: "var(--text-muted)", textDecoration: "none" }}
             onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
             onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
            {SITE_CONFIG.venuePhone}
          </a>
          <span style={{ opacity: 0.4 }}>·</span>
          <a href={`mailto:${SITE_CONFIG.venueEmail}`}
             style={{ color: "var(--text-muted)", textDecoration: "none" }}
             onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
             onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
            {SITE_CONFIG.venueEmail}
          </a>
        </div>
      </div>
    </div>
  );
}
