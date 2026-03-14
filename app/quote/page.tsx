"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFunnelStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

export default function QuoteStep() {
  const router = useRouter();
  const { data } = useFunnelStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { setIsLoaded(true); }, []);
  if (!isLoaded) return null;

  // ── NIGHTS ─────────────────────────────────────────────
  let nights = 1;
  if (data.dateRange?.from && data.dateRange?.to) {
    const start = new Date(data.dateRange.from);
    const end = new Date(data.dateRange.to);
    nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // ── ROOMS ──────────────────────────────────────────────
  let roomsSubtotal = 0;
  const roomLineItems: { name: string; qty: number; nights: number; total: number }[] = [];
  Object.entries(data.roomCounts || {}).forEach(([name, qty]) => {
    if (qty > 0) {
      const room = SITE_CONFIG.rooms.find(r => r.name === name);
      const total = (room?.pricePerNight || 0) * qty * nights;
      roomsSubtotal += total;
      roomLineItems.push({ name, qty, nights, total });
    }
  });

  // ── MEALS ──────────────────────────────────────────────
  // Meal count logic: full days get B+L+S, check-in gets supper only, check-out gets B or B+L
  let adultMealTotal = 0;
  let childMealTotal = 0;
  let mealBreakdown = { breakfast: 0, lunch: 0, supper: 0 };

  if (data.wantsMeals) {
    const { adultBreakfastPrice, adultLunchPrice, adultSupperPrice, childMealRatePerYear } = SITE_CONFIG.meals;
    const fullDays = Math.max(0, nights - 1);

    // Check-in day: supper only (if selected). Check-out: breakfast always, lunch if selected.
    const checkInSuppers = data.firstMeal === "Supper" ? 1 : 0;
    const checkOutLunches = data.lastMeal === "Lunch" ? 1 : 0;

    const totalBreakfasts = fullDays + 1; // full days + checkout day
    const totalLunches = fullDays + checkOutLunches;
    const totalSuppers = fullDays + checkInSuppers;

    mealBreakdown = { breakfast: totalBreakfasts, lunch: totalLunches, supper: totalSuppers };

    const adultDailyTotal =
      totalBreakfasts * adultBreakfastPrice +
      totalLunches * adultLunchPrice +
      totalSuppers * adultSupperPrice;

    adultMealTotal = (data.adultCount || 0) * adultDailyTotal;

    const costPerChildMeal = childMealRatePerYear * (data.childAge || 5);
    const totalChildMeals = totalBreakfasts + totalLunches + totalSuppers;
    childMealTotal = (data.childCount || 0) * costPerChildMeal * totalChildMeals;
  }

  // ── ACTIVITIES ─────────────────────────────────────────
  let activitiesSubtotal = 0;
  const activityLineItems: { name: string; qty: number; total: number }[] = [];
  Object.entries(data.activities || {}).forEach(([name, qty]) => {
    if (qty > 0) {
      const act = SITE_CONFIG.activities.find(a => a.name === name);
      const total = (act?.price || 0) * qty;
      activitiesSubtotal += total;
      activityLineItems.push({ name, qty, total });
    }
  });

  // ── TOTALS ─────────────────────────────────────────────
  const subtotal = roomsSubtotal + adultMealTotal + childMealTotal + activitiesSubtotal;
  const taxLines = SITE_CONFIG.taxes.map(t => ({ name: t.name, rate: t.rate, amount: subtotal * t.rate }));
  const totalTax = taxLines.reduce((sum, t) => sum + t.amount, 0);
  const grandTotal = subtotal + totalTax;

  const dateStr = data.dateRange?.from
    ? `${new Date(data.dateRange.from).toLocaleDateString()} – ${new Date(data.dateRange.to || "").toLocaleDateString()}`
    : "No dates selected";

  return (
    <div className="min-h-screen bg-stone-50 pb-20 pt-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 shadow-2xl border border-stone-200">

        {/* Header */}
        <div className="text-center border-b border-stone-100 pb-8 mb-8">
          <h1 className="text-4xl font-black text-stone-900 mb-1">Estimate Summary</h1>
          <p className="text-stone-500 font-medium uppercase text-sm tracking-wide">{SITE_CONFIG.venueName}</p>
          <p className="text-stone-400 text-sm mt-1">{dateStr} · {nights} night{nights !== 1 ? "s" : ""} · {(data.adultCount || 0) + (data.childCount || 0)} guests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

          {/* Lodging */}
          <div className="space-y-3">
            <h3 className="font-bold text-stone-400 uppercase text-xs tracking-widest">Lodging</h3>
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 space-y-2">
              {roomLineItems.length === 0 && <p className="text-stone-400 text-sm italic">No rooms selected.</p>}
              {roomLineItems.map(r => (
                <div key={r.name} className="flex justify-between text-sm">
                  <span>{r.qty}× {r.name} × {r.nights} nights</span>
                  <span className="font-bold">${r.total.toFixed(2)}</span>
                </div>
              ))}
              {roomLineItems.length > 0 && (
                <div className="flex justify-between font-bold border-t border-stone-200 pt-2 mt-2">
                  <span>Rooms subtotal</span>
                  <span>${roomsSubtotal.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Meals */}
            {data.wantsMeals && (
              <>
                <h3 className="font-bold text-stone-400 uppercase text-xs tracking-widest pt-2">Catering</h3>
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 space-y-2 text-sm">
                  <p className="text-stone-500 text-xs mb-2">
                    {mealBreakdown.breakfast}× breakfast · {mealBreakdown.lunch}× lunch · {mealBreakdown.supper}× supper
                  </p>
                  <div className="flex justify-between">
                    <span>{data.adultCount} adults</span>
                    <span className="font-bold">${adultMealTotal.toFixed(2)}</span>
                  </div>
                  {(data.childCount || 0) > 0 && (
                    <div className="flex j
