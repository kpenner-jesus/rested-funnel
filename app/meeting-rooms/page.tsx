"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

export default function MeetingRoomsPage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("isGroupBooking") !== "true") {
      router.replace("/");
    } else {
      setIsAllowed(true);
    }
  }, [router]);

  const storedCounts      = useBookingStore((s) => s.meetingRoomCounts);
  const setMeetingRoomCount = useBookingStore((s) => s.setMeetingRoomCount);
  const adults   = useBookingStore((s) => s.adults);
  const checkIn  = useBookingStore((s) => s.checkIn);
  const checkOut = useBookingStore((s) => s.checkOut);

  const [counts, setCounts] = useState<Record<string, number>>(storedCounts || {});
  const progress = Math.round((5 / 8) * 100);

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  })();

  const getCount = (sku: string) => counts[sku] ?? 0;

  const adjust = (sku: string, delta: number, max: number) => {
    const next = Math.min(max, Math.max(0, getCount(sku) + delta));
    const updated = { ...counts, [sku]: next };
    setCounts(updated);
    setMeetingRoomCount(sku, next);
  };

  const totalSelected = Object.values(counts).reduce((s, v) => s + v, 0);
  const subtotal = SITE_CONFIG.meetingRooms.reduce((s, r) =>
    s + r.pricePerDay * getCount(r.sku) * Math.max(1, nights), 0);

  if (!isAllowed) return (
    <div className="tf-step">
      <div className="tf-body" style={{ justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Checking access…</p>
      </div>
    </div>
  );

  return (
    <div className="tf-step" style={{ paddingBottom: totalSelected > 0 ? "5rem" : "0" }}>
      <div className="tf-progress">
        <div className="tf-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="tf-body" style={{ justifyContent: "flex-start", paddingTop: "3rem" }}>
        <div className="tf-step-label tf-animate">Step 5 of 8</div>

        <h1 className="tf-question tf-animate tf-animate-delay-1">
          Any <em>meeting rooms</em>?
        </h1>

        <p className="tf-subtext tf-animate tf-animate-delay-2">
          {adults} adults · Priced per day · All optional
        </p>

        <div className="tf-callout tf-animate tf-animate-delay-2" style={{ marginBottom: "1.5rem" }}>
          <strong>Meeting rooms are optional.</strong> Your coordinator will confirm layouts and AV setup when they follow up on your quote.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", width: "100%" }}>
          {SITE_CONFIG.meetingRooms.map((room, i) => {
            const qty = getCount(room.sku);
            const isSelected = qty > 0;
            return (
              <div key={room.sku}
                className={`tf-item-card tf-animate tf-animate-delay-${Math.min(i + 3, 8)} ${isSelected ? "selected" : ""}`}>
                <div className="tf-item-layout">
                  <div className="tf-item-photo">
                    <img src={room.imageUrl} alt={room.name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="tf-item-body">
                    <div className="tf-item-header">
                      <div className="tf-item-name">{room.name}</div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div className="tf-item-price">${room.pricePerDay.toLocaleString()}</div>
                        <div className="tf-item-price-unit">/ day</div>
                      </div>
                    </div>
                    <div className="tf-item-desc">{room.description}</div>
                    <div className="tf-item-tags">
                      {room.features.map((f, j) => <span key={j} className="tf-tag">{f}</span>)}
                    </div>
                    <div className="tf-item-footer">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                        <button className="tf-qty-btn" style={{ width: 34, height: 34, fontSize: "1.1rem" }}
                          onClick={() => adjust(room.sku, -1, room.maxQty)} disabled={qty === 0}>−</button>
                        <span style={{
                          fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 500,
                          minWidth: "1.5rem", textAlign: "center",
                          color: isSelected ? "var(--accent)" : "var(--text-muted)"
                        }}>{qty}</span>
                        <button className="tf-qty-btn" style={{ width: 34, height: 34, fontSize: "1.1rem" }}
                          onClick={() => adjust(room.sku, 1, room.maxQty)} disabled={qty >= room.maxQty}>+</button>
                      </div>
                      {isSelected && nights > 0 && (
                        <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
                          <div style={{ color: "var(--text-muted)" }}>${room.pricePerDay.toLocaleString()} × {nights} day{nights !== 1 ? "s" : ""}</div>
                          <div style={{ color: "var(--accent)", fontWeight: 600 }}>
                            ${(room.pricePerDay * nights).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="tf-ok" onClick={() => router.push("/meals")} style={{ marginTop: "2rem" }}>
          {totalSelected > 0 ? `Continue with ${totalSelected} room${totalSelected !== 1 ? "s" : ""}` : "Continue without meeting rooms"}
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <button className="tf-back" onClick={() => router.back()}>← Back</button>
      </div>

      {totalSelected > 0 && (
        <div className="tf-total-bar no-print">
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{totalSelected} meeting room{totalSelected !== 1 ? "s" : ""}</div>
            <div className="tf-total-label">{nights} day{nights !== 1 ? "s" : ""} · before tax</div>
          </div>
          <div className="tf-total-amount">${subtotal.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
