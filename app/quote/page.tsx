"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

const fmt = (n: number) => n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : "—";

interface Line { label: string; detail?: string; amount: number; }

export default function QuotePage() {
  const router = useRouter();
  const adults            = useBookingStore((s) => s.adults);
  const children          = useBookingStore((s) => s.children);
  const childrenAvgAge    = useBookingStore((s) => s.childrenAvgAge);
  const checkIn           = useBookingStore((s) => s.checkIn);
  const checkOut          = useBookingStore((s) => s.checkOut);
  const roomCounts        = useBookingStore((s) => s.roomCounts);
  const meetingRoomCounts = useBookingStore((s) => s.meetingRoomCounts);
  const selectedMeals     = useBookingStore((s) => s.selectedMeals);
  const activityCounts    = useBookingStore((s) => s.activityCounts);
  const contactName       = useBookingStore((s) => s.contactName);
  const contactEmail      = useBookingStore((s) => s.contactEmail);
  const contactPhone      = useBookingStore((s) => s.contactPhone);
  const segment           = useBookingStore((s) => s.segment);
  const eventType         = useBookingStore((s) => s.eventType);
  const resetBooking      = useBookingStore((s) => s.resetBooking);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  }, [checkIn, checkOut]);

  const roomLines = useMemo<Line[]>(() =>
    SITE_CONFIG.rooms.filter((r) => (roomCounts[r.sku] ?? 0) > 0).map((r) => {
      const q = roomCounts[r.sku];
      return { label: `${r.name} × ${q}`, detail: `${q} room${q!==1?"s":""} × ${nights} night${nights!==1?"s":""} × $${r.pricePerNight}/night`, amount: r.pricePerNight * q * nights };
    }), [roomCounts, nights]);

  const meetingLines = useMemo<Line[]>(() =>
    SITE_CONFIG.meetingRooms.filter((r) => (meetingRoomCounts[r.sku] ?? 0) > 0).map((r) => {
      const q = meetingRoomCounts[r.sku];
      return { label: `${r.name} × ${q}`, detail: `${nights} day${nights!==1?"s":""} × $${r.pricePerDay.toLocaleString()}/day`, amount: r.pricePerDay * q * nights };
    }), [meetingRoomCounts, nights]);

  const mealLines = useMemo<Line[]>(() => {
    const mc: Record<string,number> = {};
    for (const [k, s] of Object.entries(selectedMeals)) { if (s) { const mk = k.split("_")[1]; mc[mk] = (mc[mk]??0)+1; } }
    const MLABELS: Record<string,{label:string;adultPrice:number}> = {
      breakfast:      { label: "Breakfast",      adultPrice: SITE_CONFIG.meals.adultBreakfastPrice },
      lunch:          { label: "Lunch",           adultPrice: SITE_CONFIG.meals.adultLunchPrice },
      supper:         { label: "Supper",          adultPrice: SITE_CONFIG.meals.adultSupperPrice },
      nightsnack:     { label: "Night Snack",     adultPrice: SITE_CONFIG.meals.nightSnackPrice },
      nutritionbreak: { label: "Nutrition Break", adultPrice: SITE_CONFIG.meals.nutritionBreakPrice },
    };
    return Object.entries(mc).map(([mk, days]) => {
      const c = MLABELS[mk]; if (!c) return null;
      const adultCost = c.adultPrice * adults * days;
      const kidsCost  = children > 0 && childrenAvgAge > 0
        ? (mk==="nightsnack" ? SITE_CONFIG.meals.childNightSnackRate : SITE_CONFIG.meals.childMealRatePerYear) * childrenAvgAge * children * days : 0;
      return { label: `${c.label} × ${days} day${days!==1?"s":""}`, detail: `${adults} adults × $${c.adultPrice.toFixed(2)}${children>0?" + children":""} × ${days} day${days!==1?"s":""}`, amount: adultCost + kidsCost };
    }).filter(Boolean) as Line[];
  }, [selectedMeals, adults, children, childrenAvgAge]);

  const activityLines = useMemo<Line[]>(() =>
    SITE_CONFIG.activities.filter((a) => (activityCounts[a.sku] ?? 0) > 0).map((a) => {
      const q = activityCounts[a.sku];
      return { label: a.name, detail: `${q} participant${q!==1?"s":""} × $${a.price % 1===0?a.price:a.price.toFixed(2)}`, amount: a.price * q };
    }), [activityCounts]);

  const roomSub     = roomLines.reduce((s,l) => s+l.amount, 0);
  const meetingSub  = meetingLines.reduce((s,l) => s+l.amount, 0);
  const mealSub     = mealLines.reduce((s,l) => s+l.amount, 0);
  const activitySub = activityLines.reduce((s,l) => s+l.amount, 0);
  const pretax      = roomSub + meetingSub + mealSub + activitySub;
  const taxLines    = SITE_CONFIG.taxes.map((t) => ({ name: t.name, rate: t.rate, amount: pretax * t.rate }));
  const totalTax    = taxLines.reduce((s,t) => s+t.amount, 0);
  const grand       = pretax + totalTax;

  const quoteRef = useMemo(() => {
    const d = new Date().toISOString().split("T")[0].replace(/-/g,"");
    return `WE-${d}-${String(adults).padStart(3,"0")}`;
  }, [adults]);

  const handleReset = () => {
    resetBooking();
    sessionStorage.removeItem("isGroupBooking");
    router.push("/");
  };

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .tf-invoice-total-row { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", padding: "2rem 1.5rem 6rem", maxWidth: "680px", margin: "0 auto" }}>

        {/* Screen action bar */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <button className="tf-back" onClick={handleReset} style={{ margin: 0 }}>← Start over</button>
          <button className="tf-ok" style={{ marginTop: 0, padding: "0.6rem 1.2rem" }} onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
        </div>

        {/* Invoice header */}
        <div className="tf-invoice-header" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {SITE_CONFIG.venueLogo && (
                <img src={SITE_CONFIG.venueLogo} alt={SITE_CONFIG.venueName}
                  style={{ height: "44px", width: "auto", objectFit: "contain" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>{SITE_CONFIG.venueName}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{SITE_CONFIG.venueAddress}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{SITE_CONFIG.venuePhone} · {SITE_CONFIG.venueEmail}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 500 }}>Quote</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Ref: {quoteRef}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                {new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.875rem" }}>
            {[
              contactName && { label: "Contact", value: contactName },
              contactEmail && { label: "Email", value: contactEmail },
              contactPhone && { label: "Phone", value: contactPhone },
              segment && { label: "Event", value: eventType ? `${segment} — ${eventType}` : segment },
              checkIn && { label: "Check-in", value: fmtDate(checkIn) },
              checkOut && { label: "Check-out", value: fmtDate(checkOut) },
              { label: "Nights", value: String(nights) },
              { label: "Guests", value: `${adults} adults${children > 0 ? ` + ${children} children` : ""}` },
            ].filter(Boolean).map((item: any, i) => (
              <div key={i}>
                <div style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{item.label}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Line item sections */}
        {roomLines.length > 0     && <InvoiceSection title="Accommodation"  lines={roomLines}     subtotal={roomSub} />}
        {meetingLines.length > 0  && <InvoiceSection title="Meeting Rooms"  lines={meetingLines}  subtotal={meetingSub} />}
        {mealLines.length > 0     && <InvoiceSection title="Catered Meals"  lines={mealLines}     subtotal={mealSub} />}
        {activityLines.length > 0 && <InvoiceSection title="Activities"     lines={activityLines} subtotal={activitySub} />}

        {/* Totals */}
        <div className="tf-invoice-grand">
          <div className="tf-invoice-tax-row" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600 }}>${fmt(pretax)}</span>
          </div>
          {taxLines.map((t) => (
            <div key={t.name} className="tf-invoice-tax-row">
              <span>{t.name} ({(t.rate * 100).toFixed(0)}%)</span>
              <span>${fmt(t.amount)}</span>
            </div>
          ))}
          <div className="tf-invoice-total-row">
            <div>
              <div className="tf-invoice-total-label">Total (CAD)</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.6, marginTop: "0.15rem" }}>All taxes included</div>
            </div>
            <div className="tf-invoice-total-amount">${fmt(grand)}</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: "1.25rem", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.7, fontWeight: 300 }}>
          <strong style={{ fontWeight: 500, color: "var(--text-secondary)" }}>This is an estimate only.</strong>{" "}
          A coordinator will follow up within 1–2 business days to confirm availability and final pricing.
          Questions? {SITE_CONFIG.venueEmail} · {SITE_CONFIG.venuePhone}
        </div>

        {/* Bottom action buttons */}
        <div className="no-print" style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
          <button className="tf-back" style={{ margin: 0 }} onClick={handleReset}>← Start over</button>
          <button className="tf-ok" style={{ marginTop: 0 }} onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>
    </>
  );
}

function InvoiceSection({ title, lines, subtotal }: { title: string; lines: Line[]; subtotal: number }) {
  return (
    <div className="tf-invoice-section" style={{ marginBottom: "0.75rem" }}>
      <div className="tf-invoice-section-header">{title}</div>
      {lines.map((line, i) => (
        <div key={i} className="tf-invoice-row">
          <div style={{ flex: 1 }}>
            <div className="tf-invoice-label">{line.label}</div>
            {line.detail && <div className="tf-invoice-detail">{line.detail}</div>}
          </div>
          <div className="tf-invoice-amount">${fmt(line.amount)}</div>
        </div>
      ))}
      <div className="tf-invoice-subtotal">
        <span>{title} subtotal</span>
        <span>${fmt(subtotal)}</span>
      </div>
    </div>
  );
}
