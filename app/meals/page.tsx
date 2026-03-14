"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

const MEAL_CONFIG = [
  { key: "breakfast",      label: "Breakfast",      icon: "🌅", adultPrice: SITE_CONFIG.meals.adultBreakfastPrice,  desc: "Hot breakfast buffet" },
  { key: "lunch",          label: "Lunch",           icon: "☀️", adultPrice: SITE_CONFIG.meals.adultLunchPrice,      desc: "Lunch buffet" },
  { key: "supper",         label: "Supper",          icon: "🍽️", adultPrice: SITE_CONFIG.meals.adultSupperPrice,     desc: "Chef's choice supper buffet" },
  { key: "nightsnack",     label: "Night Snack",     icon: "🍪", adultPrice: SITE_CONFIG.meals.nightSnackPrice,      desc: "Cookies & fresh fruit" },
  { key: "nutritionbreak", label: "Nutrition Break", icon: "☕", adultPrice: SITE_CONFIG.meals.nutritionBreakPrice,  desc: "Coffee, tea & light snack" },
];

const getMealsForDay = (t: "arrival" | "middle" | "departure") => {
  if (t === "arrival")   return ["supper", "nightsnack"];
  if (t === "departure") return ["breakfast", "nutritionbreak"];
  return ["breakfast", "lunch", "supper", "nightsnack", "nutritionbreak"];
};

export default function MealsPage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("isGroupBooking") !== "true") router.replace("/");
    else setIsAllowed(true);
  }, [router]);

  const adults         = useBookingStore((s) => s.adults);
  const children       = useBookingStore((s) => s.children);
  const childrenAvgAge = useBookingStore((s) => s.childrenAvgAge);
  const checkIn        = useBookingStore((s) => s.checkIn);
  const checkOut       = useBookingStore((s) => s.checkOut);
  const storedMeals    = useBookingStore((s) => s.selectedMeals);
  const setSelectedMeals = useBookingStore((s) => s.setSelectedMeals);

  const [selected, setSelected] = useState<Record<string, boolean>>(storedMeals || {});
  const progress = Math.round((6 / 8) * 100);

  const days = useMemo(() => {
    if (!checkIn || !checkOut) return [];
    const start = new Date(checkIn + "T00:00:00");
    const end   = new Date(checkOut + "T00:00:00");
    const total = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (total <= 0) return [];
    return Array.from({ length: total + 1 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const type = i === 0 ? "arrival" : i === total ? "departure" : "middle";
      const label = d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
      const prefix = type === "arrival" ? "Arrival" : type === "departure" ? "Departure" : `Day ${i + 1}`;
      return { date: dateStr, label: `${prefix} · ${label}`, type, meals: getMealsForDay(type as any) };
    });
  }, [checkIn, checkOut]);

  const getMealCost = (mealKey: string) => {
    const m = MEAL_CONFIG.find((x) => x.key === mealKey);
    if (!m) return 0;
    const adult = m.adultPrice * adults;
    const kids  = children > 0 && childrenAvgAge > 0
      ? (mealKey === "nightsnack" ? SITE_CONFIG.meals.childNightSnackRate : SITE_CONFIG.meals.childMealRatePerYear) * childrenAvgAge * children
      : 0;
    return adult + kids;
  };

  const toggle = (date: string, key: string) => {
    const k = `${date}_${key}`;
    const updated = { ...selected, [k]: !selected[k] };
    setSelected(updated);
    setSelectedMeals(updated);
  };

  const isChecked = (date: string, key: string) => !!selected[`${date}_${key}`];

  const toggleDay = (day: typeof days[0], all: boolean) => {
    const updated = { ...selected };
    day.meals.forEach((k) => { updated[`${day.date}_${k}`] = all; });
    setSelected(updated);
    setSelectedMeals(updated);
  };

  // Select / clear ALL meals across ALL days
  const toggleAllDays = (selectAll: boolean) => {
    const updated = { ...selected };
    days.forEach((day) => {
      day.meals.forEach((k) => { updated[`${day.date}_${k}`] = selectAll; });
    });
    setSelected(updated);
    setSelectedMeals(updated);
  };

  const grandTotal = days.reduce((sum, day) =>
    sum + day.meals.reduce((s, k) => s + (isChecked(day.date, k) ? getMealCost(k) : 0), 0), 0);
  const totalSelections = Object.values(selected).filter(Boolean).length;

  // Are all possible meals selected?
  const allPossible = days.reduce((s, d) => s + d.meals.length, 0);
  const allSelected = totalSelections === allPossible && allPossible > 0;

  if (!isAllowed) return (
    <div className="tf-step"><div className="tf-body" style={{ justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Checking access…</p>
    </div></div>
  );

  if (days.length === 0) return (
    <div className="tf-step"><div className="tf-body" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Please set your dates first.</p>
      <button className="tf-ok" onClick={() => router.push("/dates")}>← Set dates</button>
    </div></div>
  );

  return (
    <div className="tf-step" style={{ paddingBottom: totalSelections > 0 ? "5rem" : "0" }}>
      <div className="tf-progress">
        <div className="tf-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="tf-body" style={{ justifyContent: "flex-start", paddingTop: "3rem" }}>
        <div className="tf-step-label tf-animate">Step 6 of 8</div>
        <h1 className="tf-question tf-animate tf-animate-delay-1">
          Plan your <em>meals</em>
        </h1>
        <p className="tf-subtext tf-animate tf-animate-delay-2">
          {adults} adult{adults !== 1 ? "s" : ""}
          {children > 0 ? ` + ${children} children (avg age ${childrenAvgAge})` : ""}
          {" · "}{days.length} day{days.length !== 1 ? "s" : ""} · All optional
        </p>

        {/* Global select all / clear all */}
        <div className="tf-animate tf-animate-delay-2" style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "center" }}>
          <button
            onClick={() => toggleAllDays(true)}
            style={{
              padding: "0.45rem 1rem",
              background: allSelected ? "var(--text-primary)" : "rgba(255,255,255,0.72)",
              border: "1.5px solid",
              borderColor: allSelected ? "var(--text-primary)" : "rgba(0,0,0,0.12)",
              borderRadius: 100,
              fontSize: "0.8rem",
              fontWeight: 500,
              color: allSelected ? "white" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-body)",
            }}>
            Select all meals for entire stay
          </button>
          {totalSelections > 0 && (
            <button
              onClick={() => toggleAllDays(false)}
              style={{
                padding: "0.45rem 1rem",
                background: "transparent",
                border: "none",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "var(--font-body)",
              }}>
              Clear all
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", width: "100%" }}>
          {days.map((day, di) => {
            const dayTotal = day.meals.reduce((s, k) => s + (isChecked(day.date, k) ? getMealCost(k) : 0), 0);
            const allOn = day.meals.every((k) => isChecked(day.date, k));
            return (
              <div key={day.date}
                className={`tf-invoice-section tf-animate tf-animate-delay-${Math.min(di + 3, 8)}`}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.875rem 1.25rem",
                  background: "rgba(0,0,0,0.025)",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{day.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      {day.meals.length} meal{day.meals.length !== 1 ? "s" : ""} available
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    {dayTotal > 0 && (
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--accent)" }}>
                        ${dayTotal.toFixed(2)}
                      </span>
                    )}
                    <button onClick={() => toggleDay(day, !allOn)}
                      style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "var(--font-body)" }}>
                      {allOn ? "Clear" : "Select all"}
                    </button>
                  </div>
                </div>
                {day.meals.map((mealKey) => {
                  const meal = MEAL_CONFIG.find((m) => m.key === mealKey);
                  if (!meal) return null;
                  const checked = isChecked(day.date, mealKey);
                  const cost = getMealCost(mealKey);
                  return (
                    <div key={mealKey}
                      className={`tf-meal-row ${checked ? "checked" : ""}`}
                      onClick={() => toggle(day.date, mealKey)}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flex: 1 }}>
                        <div className="tf-meal-check" />
                        <span style={{ fontSize: "1.1rem" }}>{meal.icon}</span>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{meal.label}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 300 }}>{meal.desc}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontWeight: checked ? 600 : 400, fontSize: "0.875rem", color: checked ? "var(--accent)" : "var(--text-muted)" }}>
                          ${cost.toFixed(2)}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 300 }}>
                          {adults}×${meal.adultPrice.toFixed(2)}{children > 0 ? "+kids" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <button className="tf-ok" onClick={() => router.push("/activities")} style={{ marginTop: "2rem" }}>
          {totalSelections > 0 ? "Continue to activities" : "Continue without meals"}
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className="tf-back" onClick={() => router.back()}>← Back</button>
      </div>

      {totalSelections > 0 && (
        <div className="tf-total-bar no-print">
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{totalSelections} meal service{totalSelections !== 1 ? "s" : ""}</div>
            <div className="tf-total-label">before tax</div>
          </div>
          <div className="tf-total-amount">${grandTotal.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
