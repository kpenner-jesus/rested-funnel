"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

export default function RoomsPage() {
  const router = useRouter();
  const storedCounts = useBookingStore((s) => s.roomCounts);
  const setRoomCount = useBookingStore((s) => s.setRoomCount);
  const adults   = useBookingStore((s) => s.adults);
  const children = useBookingStore((s) => s.children);
  const checkIn  = useBookingStore((s) => s.checkIn);
  const checkOut = useBookingStore((s) => s.checkOut);

  const [counts, setCounts] = useState<Record<string, number>>(storedCounts || {});
  const progress = Math.round((4 / 8) * 100);

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  })();

  const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : "";

  const getCount = (sku: string) => counts[sku] ?? 0;

  const adjust = (sku: string, delta: number, max: number) => {
    const next = Math.min(max, Math.max(0, getCount(sku) + delta));
    const updated = { ...counts, [sku]: next };
    setCounts(updated);
    setRoomCount(sku, next);
  };

  const totalRooms = Object.values(counts).reduce((s, v) => s + v, 0);
  const subtotal   = SITE_CONFIG.rooms.reduce((s, r) => s + r.pricePerNight * getCount(r.sku) * Math.max(1, nights), 0);

  const handleContinue = () => {
  const isGroup = sessionStorage.getItem("isGroupBooking") === "true";
  router.push(isGroup ? "/meeting-rooms" : "/contact");
  };

  return (
    <div className="tf-step" style={{ paddingBottom: totalRooms > 0 ? "5rem" : "0" }}>
      <div className="tf-progress">
        <div className="tf-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="tf-body" style={{ justifyContent: "flex-start", paddingTop: "3rem" }}>
        <div className="tf-step-label tf-animate">Step 4 of 8</div>

        <h1 className="tf-question tf-animate tf-animate-delay-1">
          Choose your <em>rooms</em>
        </h1>

        <p className="tf-subtext tf-animate tf-animate-delay-2">
          {adults} adult{adults !== 1 ? "s" : ""}{children > 0 ? ` + ${children} children` : ""}
          {checkIn && checkOut && nights > 0 && (
            <> · {fmtDate(checkIn)} → {fmtDate(checkOut)} ({nights} night{nights !== 1 ? "s" : ""})</>
          )}
          {" · "}Prices per room per night
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", width: "100%" }}>
          {SITE_CONFIG.rooms.map((room, i) => {
            const qty = getCount(room.sku);
            const isSelected = qty > 0;
            return (
              <div key={room.sku}
                className={`tf-item-card tf-animate tf-animate-delay-${Math.min(i + 2, 8)} ${isSelected ? "selected" : ""}`}>
                <div className="tf-item-layout">
                  <div className="tf-item-photo">
                    <img src={room.imageUrl} alt={room.name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="tf-item-body">
                    <div className="tf-item-header">
                      <div className="tf-item-name">{room.name}</div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div className="tf-item-price">${room.pricePerNight}</div>
                        <div className="tf-item-price-unit">/ night</div>
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
                          <div style={{ color: "var(--text-muted)" }}>{qty} × ${room.pricePerNight} × {nights}n</div>
                          <div style={{ color: "var(--accent)", fontWeight: 600 }}>
                            ${(room.pricePerNight * qty * nights).toLocaleString()}
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

        <button className="tf-ok" onClick={handleContinue} style={{ marginTop: "2rem" }}>
          {totalRooms > 0 ? `Continue with ${totalRooms} room${totalRooms !== 1 ? "s" : ""}` : "Continue"}
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <button className="tf-back" onClick={() => router.back()}>← Back</button>
      </div>

      {totalRooms > 0 && (
        <div className="tf-total-bar no-print">
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{totalRooms} room{totalRooms !== 1 ? "s" : ""}</div>
            <div className="tf-total-label">{nights > 0 ? `${nights} nights · before tax` : "before tax"}</div>
          </div>
          <div className="tf-total-amount">${subtotal.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
