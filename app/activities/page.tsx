"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

const CAT_META: Record<string, { label: string; icon: string }> = {
  water:        { label: "Water",         icon: "🚣" },
  nature:       { label: "Nature",        icon: "🌲" },
  teambuilding: { label: "Team Building", icon: "🤝" },
  creative:     { label: "Creative",      icon: "🎨" },
  recreation:   { label: "Recreation",    icon: "🎱" },
  winter:       { label: "Winter",        icon: "⛷️" },
};

export default function ActivitiesPage() {
  const router = useRouter();
  const storedCounts   = useBookingStore((s) => s.activityCounts);
  const setActivityCount = useBookingStore((s) => s.setActivityCount);
  const adults   = useBookingStore((s) => s.adults);
  const children = useBookingStore((s) => s.children);
  const total    = adults + children;

  const [counts, setCounts]   = useState<Record<string,number>>(storedCounts || {});
  const [activeTab, setActiveTab] = useState(() => SITE_CONFIG.activities[0]?.category ?? "");
  const progress = Math.round((7 / 8) * 100);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    return SITE_CONFIG.activities.filter((a) => !seen.has(a.category) && seen.add(a.category)).map((a) => a.category);
  }, []);

  const visible = SITE_CONFIG.activities.filter((a) => a.category === activeTab);
  const getCount = (sku: string) => counts[sku] ?? 0;

  const setCount = (sku: string, val: number) => {
    const clamped = Math.max(0, Math.min(isNaN(val) ? 0 : val, total > 0 ? total * 2 : 999));
    const updated = { ...counts, [sku]: clamped };
    setCounts(updated);
    setActivityCount(sku, clamped);
  };

  const totalSelected = Object.values(counts).filter((v) => v > 0).length;
  const subtotal = SITE_CONFIG.activities.reduce((s, a) => s + a.price * getCount(a.sku), 0);

  return (
    <div className="tf-step" style={{ paddingBottom: totalSelected > 0 ? "5rem" : "0" }}>
      <div className="tf-progress">
        <div className="tf-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="tf-body" style={{ justifyContent: "flex-start", paddingTop: "3rem" }}>
        <div className="tf-step-label tf-animate">Step 7 of 8</div>

        <h1 className="tf-question tf-animate tf-animate-delay-1">
          Add <em>activities</em>
        </h1>

        <p className="tf-subtext tf-animate tf-animate-delay-2">
          {total > 0 ? `${total} guests · ` : ""}Prices are per person · All optional
        </p>

        {/* Category tabs */}
        <div className="tf-tabs tf-animate tf-animate-delay-2">
          {categories.map((cat) => {
            const meta = CAT_META[cat] ?? { label: cat, icon: "✦" };
            const hasSelections = SITE_CONFIG.activities
              .filter((a) => a.category === cat)
              .some((a) => getCount(a.sku) > 0);
            return (
              <button key={cat}
                className={`tf-tab ${activeTab === cat ? "active" : ""}`}
                onClick={() => setActiveTab(cat)}>
                <span style={{ fontSize: "0.85rem" }}>{meta.icon}</span>
                {meta.label}
                {hasSelections && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: activeTab === cat ? "white" : "var(--accent)",
                    flexShrink: 0, display: "inline-block",
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Activity cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", width: "100%" }}>
          {visible.map((activity, i) => {
            const qty = getCount(activity.sku);
            const isSelected = qty > 0;
            const lineTotal = activity.price * qty;
            return (
              <div key={activity.sku}
                className={`tf-item-card tf-animate tf-animate-delay-${Math.min(i + 2, 8)} ${isSelected ? "selected" : ""}`}>
                <div className="tf-item-layout">
                  <div className="tf-item-photo">
                    <img src={activity.imageUrl} alt={activity.name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="tf-item-body">
                    <div className="tf-item-header">
                      <div className="tf-item-name">{activity.name}</div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div className="tf-item-price">
                          ${activity.price % 1 === 0 ? activity.price : activity.price.toFixed(2)}
                        </div>
                        <div className="tf-item-price-unit">{activity.unit}</div>
                      </div>
                    </div>
                    <div className="tf-item-desc">{activity.description}</div>
                    <div className="tf-item-footer">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <button className="tf-qty-btn" style={{ width: 32, height: 32, fontSize: "1rem" }}
                          onClick={() => setCount(activity.sku, qty - 1)} disabled={qty === 0}>−</button>
                        <input
                          type="number" min={0} value={qty === 0 ? "" : qty}
                          onChange={(e) => setCount(activity.sku, parseInt(e.target.value, 10))}
                          placeholder="0"
                          style={{
                            width: "3.5rem", textAlign: "center",
                            background: "rgba(255,255,255,0.7)",
                            border: "1px solid rgba(0,0,0,0.12)",
                            borderRadius: 8, padding: "0.35rem 0.5rem",
                            fontSize: "0.875rem", fontFamily: "var(--font-body)",
                            color: "var(--text-primary)", outline: "none",
                          }}
                        />
                        <button className="tf-qty-btn" style={{ width: 32, height: 32, fontSize: "1rem" }}
                          onClick={() => setCount(activity.sku, qty + 1)}>+</button>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>people</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
                        {isSelected ? (
                          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--accent)" }}>
                            ${lineTotal % 1 === 0 ? lineTotal.toLocaleString() : lineTotal.toFixed(2)}
                          </span>
                        ) : total > 0 ? (
                          <button
                            onClick={() => setCount(activity.sku, total)}
                            style={{ fontSize: "0.72rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                            All {total}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="tf-ok" onClick={() => router.push("/contact")} style={{ marginTop: "2rem" }}>
          {totalSelected > 0 ? `Continue with ${totalSelected} activit${totalSelected !== 1 ? "ies" : "y"}` : "Continue without activities"}
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <button className="tf-back" onClick={() => router.back()}>← Back</button>
      </div>

      {totalSelected > 0 && (
        <div className="tf-total-bar no-print">
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{totalSelected} activit{totalSelected !== 1 ? "ies" : "y"}</div>
            <div className="tf-total-label">before tax</div>
          </div>
          <div className="tf-total-amount">
            ${subtotal % 1 === 0 ? subtotal.toLocaleString() : subtotal.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
