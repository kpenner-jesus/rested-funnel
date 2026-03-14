// ============================================================
//  app/event-type/page.tsx — STEP: WHAT KIND OF EVENT?
// ============================================================
//
//  This page lets the guest pick the specific type of event
//  within the segment they chose on the previous page.
//
//  For example:
//    Segment: "Group Retreat"
//    Event Types: Church / Faith-based, Corporate, Youth, etc.
//
//  WHAT THIS PAGE DOES
//  ────────────────────
//  • Reads the segment chosen on the home page from the store
//  • Looks up the event types for that segment in siteConfig
//  • Displays them as selectable cards
//  • Saves the choice and continues to /guests
//
//  SKIPPING THIS STEP
//  ───────────────────
//  If the chosen segment has an empty types array (e.g.
//  "Individual Guest"), this page is skipped automatically
//  by the home page — guests go straight from the segment
//  selector to /guests.
//
//  CUSTOMIZATION TIPS
//  ───────────────────
//  • To add or remove event types: edit siteConfig.eventSegments
//  • To skip this step for all segments: remove the event-type
//    route from the home page navigation entirely and go straight
//    to /guests after segment selection
//
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

export default function EventTypePage() {
  const router = useRouter();

  // ── STORE ────────────────────────────────────────────────
  const segment      = useBookingStore((s) => s.segment);
  const storedType   = useBookingStore((s) => s.eventType);
  const setEventType = useBookingStore((s) => s.setEventType);

  // ── LOCAL STATE ──────────────────────────────────────────
  const [selected, setSelected] = useState(storedType || "");
  const [error, setError] = useState("");

  // Find the segment config to get its event types
  const segmentConfig = SITE_CONFIG.eventSegments.find(
    (s) => s.name === segment
  );
  const eventTypes = segmentConfig?.types ?? [];

  // ── NAVIGATION ───────────────────────────────────────────
  const handleSubmit = () => {
    if (!selected) {
      setError("Please select an event type to continue.");
      return;
    }
    setEventType(selected);
    router.push("/guests");
  };

  // If no segment is set (direct navigation), go back to start
  if (!segment) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center
                      justify-center px-6">
        <div className="text-center">
          <p className="text-stone-400 mb-4">
            Please start from the beginning.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500
                       text-white font-semibold transition-colors"
          >
            Start over
          </button>
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
            Step 1b of 8
          </p>
          <h1 className="text-2xl font-bold text-stone-100">
            What type of {segment.toLowerCase()}?
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            This helps us tailor your quote and assign the right coordinator.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10 space-y-4">

        {/* ── EVENT TYPE CARDS ─────────────────────────────────── */}
        {eventTypes.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSelected(type);
              setError("");
            }}
            className={`w-full text-left px-5 py-4 rounded-xl border
                        transition-all font-medium ${
              selected === type
                ? "bg-emerald-900 border-emerald-500 text-emerald-100"
                : "bg-stone-900 border-stone-700 text-stone-300 hover:border-stone-500"
            }`}
          >
            {type}
          </button>
        ))}

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
            className="flex-1 px-6 py-3 rounded-lg border border-stone-700
                       text-stone-300 hover:bg-stone-800 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 rounded-lg bg-emerald-600
                       hover:bg-emerald-500 text-white font-semibold
                       transition-colors"
          >
            Continue →
          </button>
        </div>

      </div>
    </div>
  );
}
