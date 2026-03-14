// ============================================================
//  app/quote/page.tsx — THE INVOICE / QUOTE SUMMARY
// ============================================================
//
//  This is the final summary page of the booking funnel.
//  It reads everything the guest has selected from the Zustand
//  store and assembles a complete itemized quote.
//
//  WHAT THIS PAGE DOES
//  ────────────────────
//  • Builds a full line-item invoice from the store data
//  • Calculates subtotals for each category (rooms, meeting
//    rooms, meals, activities)
//  • Applies taxes from siteConfig.taxes
//  • Shows a grand total
//  • Provides a Print / Save as PDF button
//  • Provides a Start Over button to reset the funnel
//
//  TWO DISPLAY MODES
//  ──────────────────
//  On screen:  Dark forest premium design (stone-950 background,
//              emerald accents, card-based layout)
//  When printed: Clean white professional invoice layout,
//              print-specific CSS hides buttons and dark UI,
//              replaces everything with black text on white.
//              Guests can use browser "Save as PDF" to get a
//              PDF they can email or keep for their records.
//
//  HOW TAXES WORK
//  ───────────────
//  Taxes are applied to every line item category.
//  The tax rates and labels come from siteConfig.taxes.
//  Each tax is shown as its own line item on the invoice
//  (e.g. "GST 5%" and "PST 7%" appear separately).
//  This makes the invoice accurate for Canadian venues where
//  GST and PST must be shown separately.
//
//  SHORT VS FULL FUNNEL
//  ─────────────────────
//  This page works for both group and individual bookings.
//  It reads sessionStorage "isGroupBooking" to decide whether
//  to show the meeting rooms and meals sections.
//  If a section has no selections, it's hidden automatically.
//
//  CUSTOMIZATION TIPS
//  ───────────────────
//  • To change the invoice logo: update venueLogo in siteConfig.ts
//  • To change tax display: update siteConfig.taxes
//  • To add a deposit line: add a depositRate field to siteConfig
//    and compute it from the grand total below
//  • To add terms & conditions: add a venueTerms field to siteConfig
//    and render it in the print footer section below
//  • To send the quote by email: connect the contact page's
//    EmailJS integration — it already sends the full quote data
//
// ============================================================

"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

// ── HELPER: FORMAT CURRENCY ──────────────────────────────────
// Formats a number as a dollar amount with 2 decimal places.
// e.g. 1234.5 → "$1,234.50"
const fmt = (n: number) =>
  n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── HELPER: FORMAT DATE ──────────────────────────────────────
// Converts a YYYY-MM-DD string to a readable date like "Jun 14, 2025"
const fmtDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ── TYPE: LINE ITEM ──────────────────────────────────────────
// A single row on the invoice. Every billable item is
// reduced to this shape before rendering.
interface LineItem {
  label: string;       // What the guest sees: "Standard Room – 1 Queen × 3"
  detail?: string;     // Optional sub-label: "3 nights × $120/night"
  amount: number;      // Dollar amount for this line
}

export default function QuotePage() {
  const router = useRouter();

  // ── READ FROM STORE ──────────────────────────────────────
  const adults          = useBookingStore((s) => s.adults);
  const children        = useBookingStore((s) => s.children);
  const childrenAvgAge  = useBookingStore((s) => s.childrenAvgAge);
  const checkIn         = useBookingStore((s) => s.checkIn);
  const checkOut        = useBookingStore((s) => s.checkOut);
  const roomCounts      = useBookingStore((s) => s.roomCounts);
  const meetingRoomCounts = useBookingStore((s) => s.meetingRoomCounts);
  const selectedMeals   = useBookingStore((s) => s.selectedMeals);
  const activityCounts  = useBookingStore((s) => s.activityCounts);
  const contactName     = useBookingStore((s) => s.contactName);
  const contactEmail    = useBookingStore((s) => s.contactEmail);
  const contactPhone    = useBookingStore((s) => s.contactPhone);
  const segment         = useBookingStore((s) => s.segment);
  const eventType       = useBookingStore((s) => s.eventType);
  const resetBooking    = useBookingStore((s) => s.resetBooking);

  // ── DERIVED: NIGHTS ──────────────────────────────────────
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  // ── BUILD ROOM LINE ITEMS ────────────────────────────────
  // For each room type with qty > 0, create a line item.
  const roomLines = useMemo<LineItem[]>(() => {
    return SITE_CONFIG.rooms
      .filter((room) => (roomCounts[room.sku] ?? 0) > 0)
      .map((room) => {
        const qty = roomCounts[room.sku];
        const amount = room.pricePerNight * qty * nights;
        return {
          label: `${room.name} × ${qty}`,
          detail: `${qty} room${qty !== 1 ? "s" : ""} × ${nights} night${nights !== 1 ? "s" : ""} × $${room.pricePerNight}/night`,
          amount,
        };
      });
  }, [roomCounts, nights]);

  const roomSubtotal = roomLines.reduce((s, l) => s + l.amount, 0);

  // ── BUILD MEETING ROOM LINE ITEMS ────────────────────────
  const meetingRoomLines = useMemo<LineItem[]>(() => {
    return SITE_CONFIG.meetingRooms
      .filter((room) => (meetingRoomCounts[room.sku] ?? 0) > 0)
      .map((room) => {
        const qty = meetingRoomCounts[room.sku];
        const amount = room.pricePerDay * qty * nights;
        return {
          label: `${room.name} × ${qty}`,
          detail: `${qty} room${qty !== 1 ? "s" : ""} × ${nights} day${nights !== 1 ? "s" : ""} × $${room.pricePerDay.toLocaleString()}/day`,
          amount,
        };
      });
  }, [meetingRoomCounts, nights]);

  const meetingRoomSubtotal = meetingRoomLines.reduce((s, l) => s + l.amount, 0);

  // ── BUILD MEAL LINE ITEMS ────────────────────────────────
  // selectedMeals is a flat map: "YYYY-MM-DD_mealkey" → boolean
  // We group by meal type across all days for a cleaner invoice
  // (rather than one line per day per meal).
  const mealLines = useMemo<LineItem[]>(() => {
    // Count how many days each meal type was selected
    const mealDayCounts: Record<string, number> = {};
    for (const [key, selected] of Object.entries(selectedMeals)) {
      if (!selected) continue;
      const mealKey = key.split("_")[1]; // "2025-06-14_supper" → "supper"
      mealDayCounts[mealKey] = (mealDayCounts[mealKey] ?? 0) + 1;
    }

    const MEAL_LABELS: Record<string, { label: string; adultPrice: number }> = {
      breakfast:     { label: "Breakfast",       adultPrice: SITE_CONFIG.meals.adultBreakfastPrice },
      lunch:         { label: "Lunch",            adultPrice: SITE_CONFIG.meals.adultLunchPrice },
      supper:        { label: "Supper",           adultPrice: SITE_CONFIG.meals.adultSupperPrice },
      nightsnack:    { label: "Night Snack",      adultPrice: SITE_CONFIG.meals.nightSnackPrice },
      nutritionbreak:{ label: "Nutrition Break",  adultPrice: SITE_CONFIG.meals.nutritionBreakPrice },
    };

    return Object.entries(mealDayCounts).map(([mealKey, dayCount]) => {
      const config = MEAL_LABELS[mealKey];
      if (!config) return null;

      // Adult portion of this meal
      const adultCost = config.adultPrice * adults * dayCount;

      // Kids portion (age-based)
      let kidsCost = 0;
      if (children > 0 && childrenAvgAge > 0) {
        const kidsRate =
          mealKey === "nightsnack"
            ? SITE_CONFIG.meals.childNightSnackRate
            : SITE_CONFIG.meals.childMealRatePerYear;
        kidsCost = kidsRate * childrenAvgAge * children * dayCount;
      }

      const amount = adultCost + kidsCost;

      return {
        label: `${config.label} × ${dayCount} day${dayCount !== 1 ? "s" : ""}`,
        detail: `${adults} adults × $${config.adultPrice.toFixed(2)}` +
          (children > 0 ? ` + ${children} children (age-based)` : "") +
          ` × ${dayCount} day${dayCount !== 1 ? "s" : ""}`,
        amount,
      } as LineItem;
    }).filter(Boolean) as LineItem[];
  }, [selectedMeals, adults, children, childrenAvgAge]);

  const mealSubtotal = mealLines.reduce((s, l) => s + l.amount, 0);

  // ── BUILD ACTIVITY LINE ITEMS ────────────────────────────
  const activityLines = useMemo<LineItem[]>(() => {
    return SITE_CONFIG.activities
      .filter((a) => (activityCounts[a.sku] ?? 0) > 0)
      .map((activity) => {
        const qty = activityCounts[activity.sku];
        const amount = activity.price * qty;
        return {
          label: activity.name,
          detail: `${qty} participant${qty !== 1 ? "s" : ""} × $${activity.price % 1 === 0 ? activity.price : activity.price.toFixed(2)}/${activity.unit.replace("per ", "")}`,
          amount,
        };
      });
  }, [activityCounts]);

  const activitySubtotal = activityLines.reduce((s, l) => s + l.amount, 0);

  // ── CALCULATE TAXES ──────────────────────────────────────
  // Apply each tax rate from siteConfig.taxes to the full pretax total.
  // Each tax becomes its own line item on the invoice.
  const pretaxTotal =
    roomSubtotal + meetingRoomSubtotal + mealSubtotal + activitySubtotal;

  const taxLines = SITE_CONFIG.taxes.map((tax) => ({
    name: tax.name,
    rate: tax.rate,
    amount: pretaxTotal * tax.rate,
  }));

  const totalTax = taxLines.reduce((s, t) => s + t.amount, 0);
  const grandTotal = pretaxTotal + totalTax;

  // ── QUOTE REFERENCE NUMBER ───────────────────────────────
  // A simple reference number built from today's date + group size.
  // This gives the venue and guest something to reference in emails.
  // Format: WE-YYYYMMDD-NNN (e.g. WE-20250614-035)
  const quoteRef = useMemo(() => {
    const today = new Date();
    const datePart = today.toISOString().split("T")[0].replace(/-/g, "");
    const numPart = String(adults).padStart(3, "0");
    return `WE-${datePart}-${numPart}`;
  }, [adults]);

  // ── HANDLE RESET ─────────────────────────────────────────
  const handleStartOver = () => {
    resetBooking();
    sessionStorage.removeItem("isGroupBooking");
    router.push("/");
  };

  return (
    <>
      {/* ── PRINT STYLES ───────────────────────────────────────
          These styles only apply when the guest clicks Print.
          They override the dark theme with a clean white invoice.
          @media print rules are injected via a <style> tag rather
          than Tailwind because Tailwind's print: variants don't
          cover all the overrides we need (backgrounds, colors, etc.)
      ─────────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-page {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-card {
            background: white !important;
            border: 1px solid #e5e7eb !important;
            color: black !important;
            break-inside: avoid;
          }
          .print-header {
            background: white !important;
            border-bottom: 2px solid #111 !important;
          }
          .print-text-dark { color: #111 !important; }
          .print-text-mid  { color: #444 !important; }
          .print-text-soft { color: #666 !important; }
          .print-accent    { color: #065f46 !important; }
          .print-divider   { border-color: #e5e7eb !important; }
          .print-total-row {
            background: #f0fdf4 !important;
            border-top: 2px solid #065f46 !important;
          }
          @page {
            margin: 1.5cm;
            size: A4 portrait;
          }
        }
      `}</style>

      <div className="min-h-screen bg-stone-950 text-stone-100 print-page">

        {/* ── SCREEN HEADER (hidden when printing) ────────────── */}
        <div className="no-print bg-stone-900 border-b border-stone-800 px-6 py-5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-500 mb-1">
                Your Quote
              </p>
              <h1 className="text-2xl font-bold text-stone-100">
                Booking Summary
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500
                           text-white text-sm font-semibold transition-colors"
              >
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* ── INVOICE HEADER ─────────────────────────────────────
              Shows the venue logo, name, and quote reference.
              This section renders on both screen and print.
          ─────────────────────────────────────────────────────── */}
          <div className="print-card bg-stone-900 border border-stone-800
                          rounded-xl p-6 print-header">
            <div className="flex items-start justify-between flex-wrap gap-4">
              {/* Venue identity */}
              <div className="flex items-center gap-4">
                {SITE_CONFIG.venueLogo && (
                  <img
                    src={SITE_CONFIG.venueLogo}
                    alt={SITE_CONFIG.venueName}
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div>
                  <div className="print-text-dark font-bold text-lg text-stone-100">
                    {SITE_CONFIG.venueName}
                  </div>
                  <div className="print-text-soft text-stone-400 text-sm">
                    {SITE_CONFIG.venueAddress}
                  </div>
                  <div className="print-text-soft text-stone-400 text-sm">
                    {SITE_CONFIG.venuePhone} · {SITE_CONFIG.venueEmail}
                  </div>
                </div>
              </div>

              {/* Quote meta */}
              <div className="text-right">
                <div className="print-text-dark text-stone-100 font-bold text-lg">
                  Quote
                </div>
                <div className="print-text-soft text-stone-400 text-sm">
                  Ref: {quoteRef}
                </div>
                <div className="print-text-soft text-stone-500 text-xs mt-1">
                  Prepared {new Date().toLocaleDateString("en-CA", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── BOOKING DETAILS ────────────────────────────────────
              Summary of who, when, and what type of event.
          ─────────────────────────────────────────────────────── */}
          <div className="print-card bg-stone-900 border border-stone-800
                          rounded-xl p-5">
            <h2 className="print-text-dark text-stone-100 font-semibold
                           text-sm uppercase tracking-wider mb-4">
              Booking Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {contactName && (
                <div>
                  <div className="print-text-soft text-stone-500 text-xs mb-0.5">
                    Contact
                  </div>
                  <div className="print-text-dark text-stone-200">
                    {contactName}
                  </div>
                </div>
              )}
              {contactEmail && (
                <div>
                  <div className="print-text-soft text-stone-500 text-xs mb-0.5">
                    Email
                  </div>
                  <div className="print-text-dark text-stone-200">
                    {contactEmail}
                  </div>
                </div>
              )}
              {contactPhone && (
                <div>
                  <div className="print-text-soft text-stone-500 text-xs mb-0.5">
                    Phone
                  </div>
                  <div className="print-text-dark text-stone-200">
                    {contactPhone}
                  </div>
                </div>
              )}
              {segment && (
                <div>
                  <div className="print-text-soft text-stone-500 text-xs mb-0.5">
                    Event Type
                  </div>
                  <div className="print-text-dark text-stone-200">
                    {eventType ? `${segment} — ${eventType}` : segment}
                  </div>
                </div>
              )}
              <div>
                <div className="print-text-soft text-stone-500 text-xs mb-0.5">
                  Check-in
                </div>
                <div className="print-text-dark text-stone-200">
                  {fmtDate(checkIn)}
                </div>
              </div>
              <div>
                <div className="print-text-soft text-stone-500 text-xs mb-0.5">
                  Check-out
                </div>
                <div className="print-text-dark text-stone-200">
                  {fmtDate(checkOut)}
                </div>
              </div>
              <div>
                <div className="print-text-soft text-stone-500 text-xs mb-0.5">
                  Nights
                </div>
                <div className="print-text-dark text-stone-200">
                  {nights}
                </div>
              </div>
              <div>
                <div className="print-text-soft text-stone-500 text-xs mb-0.5">
                  Guests
                </div>
                <div className="print-text-dark text-stone-200">
                  {adults} adult{adults !== 1 ? "s" : ""}
                  {children > 0 &&
                    ` + ${children} child${children !== 1 ? "ren" : ""}`}
                </div>
              </div>
            </div>
          </div>

          {/* ── ACCOMMODATION ──────────────────────────────────────
              Only shown if at least one room was selected.
          ─────────────────────────────────────────────────────── */}
          {roomLines.length > 0 && (
            <InvoiceSection
              title="Accommodation"
              lines={roomLines}
              subtotal={roomSubtotal}
            />
          )}

          {/* ── MEETING ROOMS ──────────────────────────────────────
              Only shown if at least one meeting room was selected.
          ─────────────────────────────────────────────────────── */}
          {meetingRoomLines.length > 0 && (
            <InvoiceSection
              title="Meeting Rooms"
              lines={meetingRoomLines}
              subtotal={meetingRoomSubtotal}
            />
          )}

          {/* ── MEALS ──────────────────────────────────────────────
              Only shown if at least one meal was selected.
          ─────────────────────────────────────────────────────── */}
          {mealLines.length > 0 && (
            <InvoiceSection
              title="Catered Meals"
              lines={mealLines}
              subtotal={mealSubtotal}
            />
          )}

          {/* ── ACTIVITIES ─────────────────────────────────────────
              Only shown if at least one activity was selected.
          ─────────────────────────────────────────────────────── */}
          {activityLines.length > 0 && (
            <InvoiceSection
              title="Activities"
              lines={activityLines}
              subtotal={activitySubtotal}
            />
          )}

          {/* ── TOTALS BLOCK ───────────────────────────────────────
              Subtotal → each tax line → grand total.
              This is the bottom of the invoice.
          ─────────────────────────────────────────────────────── */}
          <div className="print-card bg-stone-900 border border-stone-800 rounded-xl
                          overflow-hidden">
            <div className="px-6 py-4 space-y-2 print-divider
                            border-b border-stone-800">

              {/* Subtotal row */}
              <div className="flex justify-between text-sm">
                <span className="print-text-mid text-stone-400">Subtotal</span>
                <span className="print-text-dark text-stone-200 font-medium">
                  ${fmt(pretaxTotal)}
                </span>
              </div>

              {/* One row per tax from siteConfig.taxes */}
              {taxLines.map((tax) => (
                <div key={tax.name} className="flex justify-between text-sm">
                  <span className="print-text-mid text-stone-400">
                    {tax.name} ({(tax.rate * 100).toFixed(0)}%)
                  </span>
                  <span className="print-text-dark text-stone-200">
                    ${fmt(tax.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Grand total — bold, prominent */}
            <div className="print-total-row flex justify-between items-center
                            px-6 py-5 bg-stone-950">
              <div>
                <div className="print-accent text-emerald-400 font-bold text-lg">
                  Total (CAD)
                </div>
                <div className="print-text-soft text-stone-500 text-xs mt-0.5">
                  All taxes included
                </div>
              </div>
              <div className="print-accent text-emerald-400 font-bold text-3xl">
                ${fmt(grandTotal)}
              </div>
            </div>
          </div>

          {/* ── DISCLAIMER ─────────────────────────────────────────
              Sets expectations that this is an estimate.
              Important for the venue — prices can vary.
          ─────────────────────────────────────────────────────── */}
          <div className="print-card bg-stone-900 border border-stone-800
                          rounded-xl px-5 py-4 text-xs text-stone-500">
            <p className="print-text-soft">
              <span className="font-semibold text-stone-400 print-text-mid">
                This is an estimate only.
              </span>{" "}
              Prices are subject to availability and confirmation by{" "}
              {SITE_CONFIG.venueName}. A coordinator will follow up within
              1–2 business days to confirm your booking details, room
              assignments, and final pricing. Rates shown are in Canadian
              dollars before any applicable discounts or deposits.
            </p>
            {/* Print footer with venue contact */}
            <p className="print-text-soft mt-2">
              Questions? Contact us at{" "}
              <span className="print-accent text-emerald-600">
                {SITE_CONFIG.venueEmail}
              </span>{" "}
              or call {SITE_CONFIG.venuePhone}.
            </p>
          </div>

          {/* ── ACTION BUTTONS (hidden when printing) ──────────────
              Print/PDF and Start Over are screen-only controls.
          ─────────────────────────────────────────────────────── */}
          <div className="no-print flex gap-3 pb-8">
            <button
              onClick={handleStartOver}
              className="flex-1 px-6 py-3 rounded-lg border border-stone-700
                         text-stone-300 hover:bg-stone-800 transition-colors"
            >
              ← Start Over
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 px-6 py-3 rounded-lg bg-emerald-600
                         hover:bg-emerald-500 text-white font-semibold
                         transition-colors"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ============================================================
//  INVOICE SECTION COMPONENT
//  A reusable section block used for Accommodation, Meeting
//  Rooms, Meals, and Activities. Each renders as a card with
//  a title, line items, and a subtotal row.
//
//  Props:
//    title    — Section heading (e.g. "Accommodation")
//    lines    — Array of LineItem objects to render
//    subtotal — Pre-calculated sum for this section
// ============================================================
function InvoiceSection({
  title,
  lines,
  subtotal,
}: {
  title: string;
  lines: { label: string; detail?: string; amount: number }[];
  subtotal: number;
}) {
  return (
    <div className="print-card bg-stone-900 border border-stone-800
                    rounded-xl overflow-hidden">
      {/* Section title */}
      <div className="px-6 py-3 border-b border-stone-800 bg-stone-950/50">
        <h2 className="print-text-dark text-stone-300 font-semibold
                       text-xs uppercase tracking-wider">
          {title}
        </h2>
      </div>

      {/* Line items */}
      <div className="divide-y divide-stone-800 print-divider">
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex items-start justify-between px-6 py-3.5 gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="print-text-dark text-stone-200 text-sm font-medium">
                {line.label}
              </div>
              {line.detail && (
                <div className="print-text-soft text-stone-500 text-xs mt-0.5">
                  {line.detail}
                </div>
              )}
            </div>
            <div className="print-text-dark text-stone-200 font-medium
                            text-sm flex-shrink-0">
              ${fmt(line.amount)}
            </div>
          </div>
        ))}
      </div>

      {/* Section subtotal */}
      <div className="flex justify-between items-center px-6 py-3
                      border-t border-stone-700 bg-stone-950/30">
        <span className="print-text-mid text-stone-400 text-sm">
          {title} subtotal
        </span>
        <span className="print-accent text-emerald-400 font-semibold text-sm">
          ${fmt(subtotal)}
        </span>
      </div>
    </div>
  );
}
