"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import emailjs from "@emailjs/browser";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";
import { EMAIL_KEYS } from "../emailKeys";

const fmt = (n: number) => n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => d
  ? new Date(d + "T00:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
  : "—";

export default function ContactPage() {
  const router = useRouter();

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
  const setContactName    = useBookingStore((s) => s.setContactName);
  const setContactEmail   = useBookingStore((s) => s.setContactEmail);
  const setContactPhone   = useBookingStore((s) => s.setContactPhone);
  const setContactNotes   = useBookingStore((s) => s.setContactNotes);
  const storedName        = useBookingStore((s) => s.contactName);
  const storedEmail       = useBookingStore((s) => s.contactEmail);
  const storedPhone       = useBookingStore((s) => s.contactPhone);
  const storedNotes       = useBookingStore((s) => s.contactNotes);

  const [name,    setName]    = useState(storedName    || "");
  const [email,   setEmail]   = useState(storedEmail   || "");
  const [phone,   setPhone]   = useState(storedPhone   || "");
  const [notes,   setNotes]   = useState(storedNotes   || "");
  const [error,   setError]   = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const progress = 100;

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  })();

  const roomSubtotal = SITE_CONFIG.rooms.reduce((s, r) =>
    s + r.pricePerNight * (roomCounts[r.sku] ?? 0) * nights, 0);
  const meetingSubtotal = SITE_CONFIG.meetingRooms.reduce((s, r) =>
    s + r.pricePerDay * (meetingRoomCounts[r.sku] ?? 0) * nights, 0);
  const mealSubtotal = (() => {
    let t = 0;
    for (const [key, sel] of Object.entries(selectedMeals)) {
      if (!sel) continue;
      const mk = key.split("_")[1];
      const prices: Record<string, number> = {
        breakfast:      SITE_CONFIG.meals.adultBreakfastPrice,
        lunch:          SITE_CONFIG.meals.adultLunchPrice,
        supper:         SITE_CONFIG.meals.adultSupperPrice,
        nightsnack:     SITE_CONFIG.meals.nightSnackPrice,
        nutritionbreak: SITE_CONFIG.meals.nutritionBreakPrice,
      };
      t += (prices[mk] ?? 0) * adults;
      if (children > 0 && childrenAvgAge > 0) {
        const kr = mk === "nightsnack"
          ? SITE_CONFIG.meals.childNightSnackRate
          : SITE_CONFIG.meals.childMealRatePerYear;
        t += kr * childrenAvgAge * children;
      }
    }
    return t;
  })();
  const activitySubtotal = SITE_CONFIG.activities.reduce((s, a) =>
    s + a.price * (activityCounts[a.sku] ?? 0), 0);
  const pretax = roomSubtotal + meetingSubtotal + mealSubtotal + activitySubtotal;
  const tax    = SITE_CONFIG.taxes.reduce((s, t) => s + pretax * t.rate, 0);
  const grand  = pretax + tax;

  const roomsSummary = SITE_CONFIG.rooms
    .filter((r) => (roomCounts[r.sku] ?? 0) > 0)
    .map((r) => `${r.name} x${roomCounts[r.sku]} (${nights} nights) = $${fmt(r.pricePerNight * roomCounts[r.sku] * nights)}`)
    .join("\n") || "None selected";

  const meetingSummary = SITE_CONFIG.meetingRooms
    .filter((r) => (meetingRoomCounts[r.sku] ?? 0) > 0)
    .map((r) => `${r.name} x${meetingRoomCounts[r.sku]} (${nights} days) = $${fmt(r.pricePerDay * meetingRoomCounts[r.sku] * nights)}`)
    .join("\n") || "None selected";

  const mealsSummary = (() => {
    const mc: Record<string, number> = {};
    for (const [k, s] of Object.entries(selectedMeals)) {
      if (s) { const mk = k.split("_")[1]; mc[mk] = (mc[mk] ?? 0) + 1; }
    }
    const labels: Record<string, string> = {
      breakfast: "Breakfast", lunch: "Lunch", supper: "Supper",
      nightsnack: "Night Snack", nutritionbreak: "Nutrition Break",
    };
    return Object.entries(mc)
      .map(([k, d]) => `${labels[k] ?? k} x ${d} days`)
      .join("\n") || "None selected";
  })();

  const activitiesSummary = SITE_CONFIG.activities
    .filter((a) => (activityCounts[a.sku] ?? 0) > 0)
    .map((a) => `${a.name} - ${activityCounts[a.sku]} participants = $${fmt(a.price * activityCounts[a.sku])}`)
    .join("\n") || "None selected";

  const taxBreakdown = SITE_CONFIG.taxes
    .map((t) => `${t.name} (${(t.rate * 100).toFixed(0)}%): $${fmt(pretax * t.rate)}`)
    .join(", ");

  const handleSubmit = async () => {
    if (!name.trim())                           { setError("Please enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email."); return; }

    setContactName(name.trim());
    setContactEmail(email.trim());
    setContactPhone(phone.trim());
    setContactNotes(notes.trim());
    setError("");
    setSending(true);

    const params = {
      contact_name:          name.trim(),
      contact_email:         email.trim(),
      contact_phone:         phone.trim() || "Not provided",
      contact_notes:         notes.trim() || "None",
      event_type:            eventType ? `${segment} — ${eventType}` : segment || "Not specified",
      check_in:              fmtDate(checkIn),
      check_out:             fmtDate(checkOut),
      nights:                String(nights),
      adults:                String(adults),
      children:              children > 0 ? `${children} (avg age ${childrenAvgAge})` : "None",
      rooms_summary:         roomsSummary,
      meeting_rooms_summary: meetingSummary,
      meals_summary:         mealsSummary,
      activities_summary:    activitiesSummary,
      subtotal:              `$${fmt(pretax)}`,
      taxes:                 taxBreakdown,
      grand_total:           `$${fmt(grand)}`,
      venue_name:            SITE_CONFIG.venueName,
      venue_email:           SITE_CONFIG.venueEmail,
      venue_phone:           SITE_CONFIG.venuePhone,
      date:                  new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }),
      quote_ref:             `WE-${new Date().toISOString().split("T")[0].replace(/-/g,"")}-${String(adults).padStart(3,"0")}`,
      to_email:              SITE_CONFIG.venueEmail,
      reply_to:              email.trim(),
    };

    try {
      // Initialize EmailJS right before sending
      emailjs.init({ publicKey: EMAIL_KEYS.PUBLIC_KEY });

      // Send 1 — venue notification
      await emailjs.send(
        EMAIL_KEYS.SERVICE_ID,
        EMAIL_KEYS.TEMPLATE_ID,
        params
      );

      // Send 2 — guest confirmation
      if (EMAIL_KEYS.GUEST_TEMPLATE_ID && EMAIL_KEYS.GUEST_TEMPLATE_ID.length > 0) {
        await emailjs.send(
          EMAIL_KEYS.SERVICE_ID,
          EMAIL_KEYS.GUEST_TEMPLATE_ID,
          { ...params, to_email: email.trim() }
        );
      }

      setSent(true);
      setTimeout(() => router.push("/quote"), 1800);

    } catch (err: any) {
      setSending(false);
      console.error("EmailJS error:", err);
      const reason = err?.text || err?.message || "unknown error";
      setError(`Email failed to send: ${reason}. Please contact us directly at ${SITE_CONFIG.venueEmail}`);
    }
  };

  if (sent) return (
    <div className="tf-step">
      <div className="tf-body" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 500, marginBottom: "0.75rem" }}>
          Enquiry received!
        </h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: "340px", lineHeight: 1.6 }}>
          Thanks, {name.split(" ")[0]}. We sent your quote to{" "}
          <strong>{email}</strong> and notified our team.
          A coordinator will follow up within 1–2 business days.
        </p>
      </div>
    </div>
  );

  return (
    <div className="tf-step">
      <div className="tf-progress">
        <div className="tf-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="tf-body">
        <div className="tf-step-label tf-animate">Final step</div>
        <h1 className="tf-question tf-animate tf-animate-delay-1">
          Almost done — <em>who are you?</em>
        </h1>
        <p className="tf-subtext tf-animate tf-animate-delay-2">
          We will send your quote here and follow up within 1–2 business days.
        </p>

        <div className="tf-callout tf-animate tf-animate-delay-2" style={{ marginBottom: "2rem" }}>
          {segment && (
            <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>
              {eventType ? `${segment} — ${eventType}` : segment}
            </div>
          )}
          <div style={{ fontWeight: 300, fontSize: "0.85rem" }}>
            {adults} adult{adults !== 1 ? "s" : ""}
            {children > 0 ? ` + ${children} children` : ""}
            {checkIn && checkOut && <> · {fmtDate(checkIn)} → {fmtDate(checkOut)}</>}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 500, color: "var(--accent)", marginTop: "0.5rem" }}>
            Estimated total: ${fmt(grand)} CAD
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {[
            { id: "name",  label: "Full name",     type: "text",  val: name,  set: setName,  ph: "Sarah Penner",      req: true  },
            { id: "email", label: "Email address", type: "email", val: email, set: setEmail, ph: "sarah@example.com", req: true  },
            { id: "phone", label: "Phone",          type: "tel",   val: phone, set: setPhone, ph: "(204) 555-0123",     req: false },
          ].map(({ id, label, type, val, set, ph, req }, i) => (
            <div key={id} className={`tf-animate tf-animate-delay-${i + 3}`}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                {label} {!req && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>}
              </label>
              <input type={type} value={val}
                onChange={(e) => { (set as any)(e.target.value); setError(""); }}
                placeholder={ph}
                className="tf-input-box" />
            </div>
          ))}

          <div className="tf-animate tf-animate-delay-6">
            <label style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
              Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Dietary needs, accessibility requirements, flexible dates…"
              rows={3} className="tf-input-box" />
          </div>
        </div>

        {error && <div className="tf-alert-error" style={{ marginTop: "1rem" }}>{error}</div>}

        <button className="tf-ok" onClick={handleSubmit} disabled={sending} style={{ marginTop: "1.5rem" }}>
          {sending ? "Sending…" : "Send & View Quote"}
          {!sending && <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>

        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.875rem", fontWeight: 300 }}>
          Your information is only used to follow up on this enquiry.
        </p>
        <button className="tf-back" onClick={() => router.back()}>← Back</button>
      </div>
    </div>
  );
}
