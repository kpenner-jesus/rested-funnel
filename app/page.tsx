"use client";
import { useRouter } from "next/navigation";
import { useBookingStore } from "./store";
import { SITE_CONFIG } from "./siteConfig";

export default function HomePage() {
  const router = useRouter();
  const setSegment   = useBookingStore((s) => s.setSegment);
  const setEventType = useBookingStore((s) => s.setEventType);

  const handleSegmentSelect = (segmentName: string) => {
    setSegment(segmentName);
    setEventType("");
    const seg = SITE_CONFIG.eventSegments.find((s) => s.name === segmentName);
    router.push(seg && seg.types.length > 0 ? "/event-type" : "/guests");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>

      {/* ── HERO ── */}
      <div style={{
        position: "relative",
        height: "340px",
        overflow: "hidden",
        backgroundColor: "var(--bg-elevated)",
      }}>
        {/* Background image */}
        <img
          src={SITE_CONFIG.heroImageUrl}
          alt=""
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center 40%",
            opacity: 0.45,
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />

        {/* Gradient vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(8,13,8,0.3) 0%, rgba(8,13,8,0.85) 100%)",
        }} />

        {/* Decorative topographic lines */}
        <svg
          viewBox="0 0 800 340" preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}
        >
          <ellipse cx="600" cy="120" rx="320" ry="160" fill="none" stroke="#6abf6a" strokeWidth="1"/>
          <ellipse cx="600" cy="120" rx="240" ry="120" fill="none" stroke="#6abf6a" strokeWidth="1"/>
          <ellipse cx="600" cy="120" rx="160" ry="80"  fill="none" stroke="#6abf6a" strokeWidth="1"/>
          <ellipse cx="600" cy="120" rx="80"  ry="40"  fill="none" stroke="#6abf6a" strokeWidth="1"/>
        </svg>

        {/* Hero content */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "0 1.5rem",
          gap: "0.75rem",
          animation: "fadeUp 0.6s ease both",
        }}>
          <img
            src={SITE_CONFIG.venueLogo}
            alt={SITE_CONFIG.venueName}
            style={{ height: "52px", width: "auto", objectFit: "contain", filter: "brightness(1.1)" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
            fontWeight: 500,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            margin: 0,
          }}>
            {SITE_CONFIG.venueName}
          </h1>
          <p style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "1rem",
            color: "var(--text-secondary)",
            margin: 0,
          }}>
            {SITE_CONFIG.venueTagline}
          </p>
        </div>

        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "80px",
          background: "linear-gradient(to bottom, transparent, var(--bg-base))",
        }} />
      </div>

      {/* ── SEGMENT SELECTION ── */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem 1.5rem 3rem" }}>

        <div style={{ textAlign: "center", marginBottom: "2rem", animation: "fadeUp 0.5s 0.1s ease both", opacity: 0 }}>
          <div style={{
            display: "inline-block",
            fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase", color: "var(--accent-green)",
            marginBottom: "0.6rem",
          }}>
            Begin your booking
          </div>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
            fontWeight: 500,
            color: "var(--text-primary)",
            margin: "0 0 0.5rem",
          }}>
            What brings you to {SITE_CONFIG.venueName.split(" ")[0]}?
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
            Select the option that best describes your visit.
          </p>
        </div>

        {/* Segment cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
             className="stagger">
          {SITE_CONFIG.eventSegments.map((segment, i) => (
            <button
              key={segment.name}
              onClick={() => handleSegmentSelect(segment.name)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.1rem 1.4rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                transition: "border-color 0.2s ease, background 0.2s ease, transform 0.15s ease",
                textAlign: "left",
                boxShadow: "var(--shadow-card)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--accent-green)";
                el.style.background = "var(--bg-elevated)";
                el.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--border-subtle)";
                el.style.background = "var(--bg-surface)";
                el.style.transform = "translateX(0)";
              }}
            >
              <div>
                <div style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: "var(--text-primary)",
                  marginBottom: "0.2rem",
                }}>
                  {segment.name}
                </div>
                {segment.desc && (
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}>
                    {segment.desc}
                  </div>
                )}
              </div>
              <span style={{
                color: "var(--accent-green)",
                fontSize: "1.1rem",
                opacity: 0.7,
                flexShrink: 0,
                marginLeft: "1rem",
              }}>
                →
              </span>
            </button>
          ))}
        </div>

        {/* Footer contact */}
        <div style={{
          marginTop: "2.5rem",
          textAlign: "center",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          lineHeight: 1.8,
        }}>
          <div style={{ marginBottom: "0.2rem" }}>Questions? We are happy to help.</div>
          <div>
            <a href={`tel:${SITE_CONFIG.venuePhone}`}
               style={{ color: "var(--text-muted)", textDecoration: "none" }}
               onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-green)")}
               onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
              {SITE_CONFIG.venuePhone}
            </a>
            <span style={{ margin: "0 0.5rem" }}>·</span>
            <a href={`mailto:${SITE_CONFIG.venueEmail}`}
               style={{ color: "var(--text-muted)", textDecoration: "none" }}
               onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-green)")}
               onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
              {SITE_CONFIG.venueEmail}
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
