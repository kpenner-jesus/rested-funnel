// ============================================================
//  app/contact/page.tsx — FINAL STEP: CONTACT DETAILS
// ============================================================
//
//  This is the last step before the guest sees their quote.
//  It collects their name, email, phone and any notes, then
//  sends a notification email to the venue using EmailJS.
//
//  WHAT THIS PAGE DOES
//  ────────────────────
//  1. Collects contact information from the guest
//  2. Sends two emails via EmailJS:
//       a) A notification to the venue with full booking details
//       b) A confirmation to the guest with their quote summary
//  3. Saves contact details to the Zustand store
//  4. Redirects to /quote so the guest can see and print their invoice
//
//  EMAILJS SETUP — YOU MUST DO THIS BEFORE EMAILS WILL SEND
//  ──────────────────────────────────────────────────────────
//  EmailJS lets you send emails from a browser without a backend
//  server. It's free for up to 200 emails/month.
//
//  Steps to set it up:
//  1. Go to https://emailjs.com and create a free account
//  2. Add an Email Service (Gmail, Outlook, etc.)
//     → copy your SERVICE ID
//  3. Create an Email Template for venue notifications
//     → use the variable names listed in the TEMPLATE VARIABLES
//       section below
//     → copy your TEMPLATE ID
//  4. Create a second Email Template for guest confirmations
//     → copy that TEMPLATE ID too
//  5. Find your PUBLIC KEY in Account → API Keys
//  6. Create a file called .env.local in the root of your project
//     and add these lines:
//
//       NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
//       NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_venue_template_id
//       NEXT_PUBLIC_EMAILJS_GUEST_TEMPLATE_ID=your_guest_template_id
//       NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
//
//  7. In Vercel, add these same 4 variables under:
//     Project → Settings → Environment Variables
//
//  TEMPLATE VARIABLES (use these in your EmailJS template)
//  ─────────────────────────────────────────────────────────
//  {{contact_name}}      — Guest's full name
//  {{contact_email}}     — Guest's email address
//  {{contact_phone}}     — Guest's phone number
//  {{contact_notes}}     — Any additional notes from the guest
//  {{event_type}}        — e.g. "Group Retreat — Church / Faith-based"
//  {{check_in}}          — Check-in date
//  {{check_out}}         — Check-out date
//  {{nights}}            — Number of nights
//  {{adults}}            — Number of adults
//  {{children}}          — Number of children
//  {{rooms_summary}}     — Text summary of selected rooms
//  {{meeting_rooms_summary}} — Text summary of meeting rooms
//  {{meals_summary}}     — Text summary of selected meals
//  {{activities_summary}} — Text summary of selected activities
//  {{subtotal}}          — Pre-tax total
//  {{taxes}}             — Tax amount
//  {{grand_total}}       — Final total including tax
//  {{venue_name}}        — Your venue name (from siteConfig)
//
//  WHAT TO CHANGE FOR YOUR VENUE
//  ───────────────────────────────
//  • Email credentials: update the .env.local variables above
//  • Required fields: phone is currently optional — to make it
//    required, remove the "(optional)" label and add validation
//  • Redirect after send: currently goes to /quote — change the
//    router.push() in handleSubmit if you want a different page
//  • Success message timing: currently waits 2 seconds before
//    redirecting — change the setTimeout delay if needed
//
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import emailjs from "@emailjs/browser";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

// ── EMAILJS CREDENTIALS ──────────────────────────────────────
// These are read from environment variables so your keys are
// never hardcoded in the source code. Set them in .env.local
// for local development and in Vercel for production.
// See the EMAILJS SETUP section above for full instructions.
const EMAILJS_SERVICE_ID  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID  ?? "";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "";
const EMAILJS_GUEST_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_GUEST_TEMPLATE_ID ?? "";
const EMAILJS_PUBLIC_KEY  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  ?? "";

// ── HELPER: FORMAT CURRENCY ──────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── HELPER: FORMAT DATE ──────────────────────────────────────
const fmtDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });
};

export default function ContactPage() {
  const router = useRouter();

  // ── READ FROM STORE ──────────────────────────────────────
  const adults            = useBookingStore((s) => s.adults);
  const children          = useBookingStore((s) => s.children);
  const childrenAvgAge    = useBookingStore((s) => s.childrenAvgAge);
  const checkIn           = useBookingStore((s) => s.checkIn);
  const checkOut          = useBookingStore((s) => s.checkOut);
  const segment           = useBookingStore((s) => s.segment);
  const eventType         = useBookingStore((s) => s.eventType);
  const roomCounts        = useBookingStore((s) => s.roomCounts);
  const meetingRoomCounts = useBookingStore((s) => s.meetingRoomCounts);
  const selectedMeals     = useBookingStore((s) => s.selectedMeals);
  const activityCounts    = useBookingStore((s) => s.activityCounts);

  // Store setters for contact fields
  const setContactName    = useBookingStore((s) => s.setContactName);
  const setContactEmail   = useBookingStore((s) => s.setContactEmail);
  const setContactPhone   = useBookingStore((s) => s.setContactPhone);
  const setContactNotes   = useBookingStore((s) => s.setContactNotes);

  // Pre-fill from store in case guest came back to edit
  const storedName  = useBookingStore((s) => s.contactName);
  const storedEmail = useBookingStore((s) => s.contactEmail);
  const storedPhone = useBookingStore((s) => s.contactPhone);
  const storedNotes = useBookingStore((s) => s.contactNotes);

  // ── LOCAL FORM STATE ──────────────────────────────────────
  const [name,  setName]  = useState(storedName  || "");
  const [email, setEmail] = useState(storedEmail || "");
  const [phone, setPhone] = useState(storedPhone || "");
  const [notes, setNotes] = useState(storedNotes || "");
  const [error,   setError]   = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  // ── CALCULATE NIGHTS ─────────────────────────────────────
  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  })();

  // ── BUILD QUOTE SUMMARIES FOR EMAIL ──────────────────────
  // These convert the store data into human-readable text
  // strings that go into the EmailJS template variables.

  const roomsSummary = SITE_CONFIG.rooms
    .filter((r) => (roomCounts[r.sku] ?? 0) > 0)
    .map((r) => {
      const qty = roomCounts[r.sku];
      const total = r.pricePerNight * qty * nights;
      return `${r.name} × ${qty} (${nights} nights) = $${fmt(total)}`;
    })
    .join("\n") || "None selected";

  const meetingRoomsSummary = SITE_CONFIG.meetingRooms
    .filter((r) => (meetingRoomCounts[r.sku] ?? 0) > 0)
    .map((r) => {
      const qty = meetingRoomCounts[r.sku];
      const total = r.pricePerDay * qty * nights;
      return `${r.name} × ${qty} (${nights} days) = $${fmt(total)}`;
    })
    .join("\n") || "None selected";

  const mealsSummary = (() => {
    const mealDayCounts: Record<string, number> = {};
    for (const [key, selected] of Object.entries(selectedMeals)) {
      if (!selected) continue;
      const mealKey = key.split("_")[1];
      mealDayCounts[mealKey] = (mealDayCounts[mealKey] ?? 0) + 1;
    }
    const MEAL_LABELS: Record<string, { label: string; adultPrice: number }> = {
      breakfast:      { label: "Breakfast",      adultPrice: SITE_CONFIG.meals.adultBreakfastPrice },
      lunch:          { label: "Lunch",           adultPrice: SITE_CONFIG.meals.adultLunchPrice },
      supper:         { label: "Supper",          adultPrice: SITE_CONFIG.meals.adultSupperPrice },
      nightsnack:     { label: "Night Snack",     adultPrice: SITE_CONFIG.meals.nightSnackPrice },
      nutritionbreak: { label: "Nutrition Break", adultPrice: SITE_CONFIG.meals.nutritionBreakPrice },
    };
    const lines = Object.entries(mealDayCounts).map(([key, days]) => {
      const config = MEAL_LABELS[key];
      if (!config) return null;
      const adultCost = config.adultPrice * adults * days;
      const kidsCost = children > 0 && childrenAvgAge > 0
        ? (key === "nightsnack"
            ? SITE_CONFIG.meals.childNightSnackRate
            : SITE_CONFIG.meals.childMealRatePerYear)
          * childrenAvgAge * children * days
        : 0;
      return `${config.label} × ${days} days = $${fmt(adultCost + kidsCost)}`;
    }).filter(Boolean);
    return lines.join("\n") || "None selected";
  })();

  const activitiesSummary = SITE_CONFIG.activities
    .filter((a) => (activityCounts[a.sku] ?? 0) > 0)
    .map((a) => {
      const qty = activityCounts[a.sku];
      const total = a.price * qty;
      return `${a.name} — ${qty} participants = $${fmt(total)}`;
    })
    .join("\n") || "None selected";

  // ── CALCULATE TOTALS FOR EMAIL ────────────────────────────
  const roomSubtotal = SITE_CONFIG.rooms.reduce((s, r) =>
    s + r.pricePerNight * (roomCounts[r.sku] ?? 0) * nights, 0);

  const meetingRoomSubtotal = SITE_CONFIG.meetingRooms.reduce((s, r) =>
    s + r.pricePerDay * (meetingRoomCounts[r.sku] ?? 0) * nights, 0);

  const mealSubtotal = (() => {
    let total = 0;
    for (const [key, selected] of Object.entries(selectedMeals)) {
      if (!selected) continue;
      const mealKey = key.split("_")[1];
      const prices: Record<string, number> = {
        breakfast:      SITE_CONFIG.meals.adultBreakfastPrice,
        lunch:          SITE_CONFIG.meals.adultLunchPrice,
        supper:         SITE_CONFIG.meals.adultSupperPrice,
        nightsnack:     SITE_CONFIG.meals.nightSnackPrice,
        nutritionbreak: SITE_CONFIG.meals.nutritionBreakPrice,
      };
      const adultRate = prices[mealKey] ?? 0;
      const kidsRate = mealKey === "nightsnack"
        ? SITE_CONFIG.meals.childNightSnackRate
        : SITE_CONFIG.meals.childMealRatePerYear;
      total += adultRate * adults;
      if (children > 0 && childrenAvgAge > 0) {
        total += kidsRate * childrenAvgAge * children;
      }
    }
    return total;
  })();

  const activitySubtotal = SITE_CONFIG.activities.reduce((s, a) =>
    s + a.price * (activityCounts[a.sku] ?? 0), 0);

  const pretaxTotal = roomSubtotal + meetingRoomSubtotal + mealSubtotal + activitySubtotal;
  const totalTax = SITE_CONFIG.taxes.reduce((s, t) => s + pretaxTotal * t.rate, 0);
  const grandTotal = pretaxTotal + totalTax;
  const taxesBreakdown = SITE_CONFIG.taxes
    .map((t) => `${t.name} (${(t.rate * 100).toFixed(0)}%): $${fmt(pretaxTotal * t.rate)}`)
    .join(", ");

  // ── FORM SUBMISSION ───────────────────────────────────────
  const handleSubmit = async () => {
    // ── VALIDATION ────────────────────────────────────────
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    // ── SAVE TO STORE ─────────────────────────────────────
    setContactName(name.trim());
    setContactEmail(email.trim());
    setContactPhone(phone.trim());
    setContactNotes(notes.trim());
    setError("");
    setSending(true);

    // ── BUILD EMAILJS TEMPLATE PARAMS ────────────────────
    // These match the {{variable}} names in your EmailJS templates.
    const templateParams = {
      contact_name:           name.trim(),
      contact_email:          email.trim(),
      contact_phone:          phone.trim() || "Not provided",
      contact_notes:          notes.trim() || "None",
      event_type:             eventType
                                ? `${segment} — ${eventType}`
                                : segment || "Not specified",
      check_in:               fmtDate(checkIn),
      check_out:              fmtDate(checkOut),
      nights:                 String(nights),
      adults:                 String(adults),
      children:               children > 0
                                ? `${children} (avg age ${childrenAvgAge})`
                                : "None",
      rooms_summary:          roomsSummary,
      meeting_rooms_summary:  meetingRoomsSummary,
      meals_summary:          mealsSummary,
      activities_summary:     activitiesSummary,
      subtotal:               `$${fmt(pretaxTotal)}`,
      taxes:                  taxesBreakdown,
      grand_total:            `$${fmt(grandTotal)}`,
      venue_name:             SITE_CONFIG.venueName,
      venue_email:            SITE_CONFIG.venueEmail,
      venue_phone:            SITE_CONFIG.venuePhone,
    };

    try {
      // ── SEND VENUE NOTIFICATION ─────────────────────────
      // Only attempt email send if credentials are configured.
      // If not configured, we still allow proceeding to the quote.
      if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        );

        // ── SEND GUEST CONFIRMATION ──────────────────────
        // Only send guest confirmation if that template is configured.
        if (EMAILJS_GUEST_TEMPLATE_ID) {
          await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_GUEST_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
          );
        }
      }

      // ── SUCCESS ─────────────────────────────────────────
      setSent(true);

      // Brief pause to show success message, then go to quote
      setTimeout(() => {
        router.push("/quote");
      }, 2000);

    } catch (err: any) {
      setSending(false);
      // Show a user-friendly error but still allow proceeding.
      // The guest can still view their quote even if email failed.
      setError(
        "There was a problem sending your enquiry. " +
        "You can still view your quote — please contact us directly at " +
        SITE_CONFIG.venueEmail + " if needed."
      );
      // Log the full error for debugging
      console.error("EmailJS error:", err?.text ?? err);
    }
  };

  // ── SUCCESS STATE ─────────────────────────────────────────
  // Show a confirmation screen while the redirect loads.
  if (sent) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center
                      justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-stone-100 mb-2">
            Enquiry received!
          </h2>
          <p className="text-stone-400 text-sm">
            Thanks, {name.split(" ")[0]}. We've sent your quote to{" "}
            <span className="text-emerald-400">{email}</span> and notified
            our team. A coordinator will be in touch within 1–2 business days.
          </p>
          <p className="text-stone-600 text-xs mt-4">
            Taking you to your quote summary…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="bg-stone-900 border-b border-stone-800 px-6 py-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-emerald-500 mb-1">
            Final Step
          </p>
          <h1 className="text-2xl font-bold text-stone-100">
            Your contact details
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            We'll send your quote to this email and follow up within
            1–2 business days.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10 space-y-5">

        {/* ── BOOKING SUMMARY REMINDER ─────────────────────────
            Shows a compact recap so the guest knows what they're
            about to submit before they fill in their details.
        ─────────────────────────────────────────────────────── */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl
                        px-5 py-4 text-sm text-stone-400 space-y-1">
          <div className="text-stone-300 font-medium mb-2">Quote summary</div>
          {segment && (
            <div>
              {eventType ? `${segment} — ${eventType}` : segment}
            </div>
          )}
          <div>
            {adults} adult{adults !== 1 ? "s" : ""}
            {children > 0 && ` + ${children} children`}
            {checkIn && checkOut && (
              <> · {fmtDate(checkIn)} → {fmtDate(checkOut)} ({nights} nights)</>
            )}
          </div>
          <div className="text-emerald-400 font-semibold pt-1">
            Estimated total: ${fmt(grandTotal)} CAD (incl. tax)
          </div>
        </div>

        {/* ── NAME ─────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-300">
            Full name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Sarah Penner"
            className="w-full bg-stone-800 border border-stone-700 rounded-lg
                       px-4 py-3 text-stone-100 placeholder-stone-500
                       focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* ── EMAIL ─────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-300">
            Email address <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-stone-500">
            Your quote will be sent here.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="e.g. sarah@example.com"
            className="w-full bg-stone-800 border border-stone-700 rounded-lg
                       px-4 py-3 text-stone-100 placeholder-stone-500
                       focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* ── PHONE ─────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-300">
            Phone number
            <span className="text-stone-500 font-normal ml-1">(optional)</span>
          </label>
          <p className="text-xs text-stone-500">
            Helpful if our coordinator needs to reach you quickly.
          </p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. (204) 555-0123"
            className="w-full bg-stone-800 border border-stone-700 rounded-lg
                       px-4 py-3 text-stone-100 placeholder-stone-500
                       focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* ── NOTES ─────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-300">
            Additional notes
            <span className="text-stone-500 font-normal ml-1">(optional)</span>
          </label>
          <p className="text-xs text-stone-500">
            Anything else we should know — dietary needs, accessibility
            requirements, flexible dates, special requests, etc.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. We have 3 guests with gluten-free dietary needs..."
            rows={4}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg
                       px-4 py-3 text-stone-100 placeholder-stone-500
                       focus:outline-none focus:ring-2 focus:ring-emerald-500
                       resize-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="text-red-400 text-sm bg-red-950 border border-red-800
                          rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* ── NAVIGATION ───────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            disabled={sending}
            className="flex-1 px-6 py-3 rounded-lg border border-stone-700
                       text-stone-300 hover:bg-stone-800 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="flex-1 px-6 py-3 rounded-lg bg-emerald-600
                       hover:bg-emerald-500 text-white font-semibold
                       transition-colors disabled:opacity-60
                       disabled:cursor-not-allowed"
          >
            {sending ? "Sending…" : "Send & View Quote →"}
          </button>
        </div>

        {/* Privacy note */}
        <p className="text-center text-stone-600 text-xs pb-4">
          Your information is only used to follow up on this enquiry.
          We do not share it with third parties.
        </p>

      </div>
    </div>
  );
}
