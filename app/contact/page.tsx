"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFunnelStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";
import emailjs from "@emailjs/browser";
import { EMAIL_KEYS } from "../../emailConfig";

export default function ContactStep() {
  const router = useRouter();
  const { data, reset } = useFunnelStore();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  useEffect(() => {
    setIsLoaded(true);
    if (EMAIL_KEYS.PUBLIC_KEY) emailjs.init(EMAIL_KEYS.PUBLIC_KEY);
  }, []);

  const buildQuoteSummary = (fName: string, lName: string, uEmail: string) => {
    // Dates & nights
    const dateStr = data.dateRange?.from
      ? `${new Date(data.dateRange.from).toLocaleDateString()} to ${new Date(data.dateRange.to || "").toLocaleDateString()}`
      : "No dates selected";
    let nights = 1;
    if (data.dateRange?.from && data.dateRange?.to) {
      const start = new Date(data.dateRange.from);
      const end = new Date(data.dateRange.to);
      nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Rooms
    let roomsSubtotal = 0;
    let roomLines = "";
    Object.entries(data.roomCounts || {}).forEach(([name, qty]) => {
      if (qty > 0) {
        const room = SITE_CONFIG.rooms.find(r => r.name === name);
        const total = (room?.pricePerNight || 0) * qty * nights;
        roomsSubtotal += total;
        roomLines += `\n  - ${qty}x ${name} x ${nights} nights @ $${room?.pricePerNight}/night = $${total.toFixed(2)}`;
      }
    });

    // Meals
    let adultMealTotal = 0;
    let childMealTotal = 0;
    let mealLines = "  - No meal plan selected";
    if (data.wantsMeals) {
      const { adultBreakfastPrice, adultLunchPrice, adultSupperPrice, childMealRatePerYear } = SITE_CONFIG.meals;
      const fullDays = Math.max(0, nights - 1);
      const totalBreakfasts = fullDays + 1;
      const totalLunches = fullDays + (data.lastMeal === "Lunch" ? 1 : 0);
      const totalSuppers = fullDays + (data.firstMeal === "Supper" ? 1 : 0);
      const adultDailyTotal =
        totalBreakfasts * adultBreakfastPrice +
        totalLunches * adultLunchPrice +
        totalSuppers * adultSupperPrice;
      adultMealTotal = (data.adultCount || 0) * adultDailyTotal;
      const costPerChildMeal = childMealRatePerYear * (data.childAge || 5);
      childMealTotal = (data.childCount || 0) * costPerChildMeal * (totalBreakfasts + totalLunches + totalSuppers);
      mealLines = `  - ${totalBreakfasts}x breakfast, ${totalLunches}x lunch, ${totalSuppers}x supper`
        + `\n  - ${data.adultCount} adults = $${adultMealTotal.toFixed(2)}`
        + ((data.childCount || 0) > 0 ? `\n  - ${data.childCount} children (avg age ${data.childAge}) = $${childMealTotal.toFixed(2)}` : "");
    }

    // Activities
    let activitiesSubtotal = 0;
    let activityLines = "  - No activities selected";
    const actEntries = Object.entries(data.activities || {}).filter(([, q]) => q > 0);
    if (actEntries.length > 0) {
      activityLines = "";
      actEntries.forEach(([name, qty]) => {
        const act = SITE_CONFIG.activities.find(a => a.name === name);
        const total = (act?.price || 0) * qty;
        activitiesSubtotal += total;
        activityLines += `\n  - ${qty}x ${name} @ $${act?.price}/${act?.unit} = $${total.toFixed(2)}`;
      });
    }

    // Totals
    const subtotal = roomsSubtotal + adultMealTotal + childMealTotal + activitiesSubtotal;
    const taxLines = SITE_CONFIG.taxes.map(t =>
      `  - ${t.name} (${(t.rate * 100).toFixed(0)}%): $${(subtotal * t.rate).toFixed(2)}`
    ).join("\n");
    const totalTax = SITE_CONFIG.taxes.reduce((sum, t) => sum + subtotal * t.rate, 0);
    const grandTotal = subtotal + totalTax;

    return `
QUOTE REQUEST — ${SITE_CONFIG.venueName.toUpperCase()}
${"=".repeat(50)}
CUSTOMER:   ${fName} ${lName}
EMAIL:      ${uEmail}
EVENT TYPE: ${data.specificType || data.eventSegment || "Not specified"}
GUESTS:     ${data.adultCount} adults, ${data.childCount || 0} children
DATES:      ${dateStr} (${nights} night${nights !== 1 ? "s" : ""})

LODGING:${roomLines || "\n  - None selected"}
  Rooms subtotal: $${roomsSubtotal.toFixed(2)}

CATERING:
${mealLines}
  Meals subtotal: $${(adultMealTotal + childMealTotal).toFixed(2)}

ACTIVITIES:${activityLines}
  Activities subtotal: $${activitiesSubtotal.toFixed(2)}

${"─".repeat(50)}
SUBTOTAL:   $${subtotal.toFixed(2)}
TAXES:
${taxLines}
${"─".repeat(50)}
TOTAL ESTIMATE: $${grandTotal.toFixed(2)}
${"=".repeat(50)}
This is an estimate only. Final pricing confirmed upon booking.
    `.trim();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const fName = formData.get("first_name") as string;
    const lName = formData.get("last_name") as string;
    const uEmail = formData.get("user_email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;
    setSubmittedName(fName);

    const quoteSummary = buildQuoteSummary(fName, lName, uEmail);

    try {
      await emailjs.send(
        EMAIL_KEYS.SERVICE_ID,
        EMAIL_KEYS.TEMPLATE_ID,
        {
          to_name: `${SITE_CONFIG.venueName} Coordinator`,
          from_name: `${fName} ${lName}`,
          reply_to: uEmail,
          message: quoteSummary + (message ? `\n\nADDITIONAL NOTES:\n${message}` : ""),
        },
        EMAIL_KEYS.PUBLIC_KEY
      );
      setSent(true);
      setTimeout(() => { reset(); router.push("/"); }, 6000);
    } catch (err: any) {
      alert("Email Error: " + (err?.te
