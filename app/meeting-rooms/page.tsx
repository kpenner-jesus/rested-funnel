// ============================================================
//  app/meeting-rooms/page.tsx — STEP: SELECT MEETING ROOMS
// ============================================================
//
//  This page is ONLY shown to groups at or above the
//  groupMinimum threshold set in siteConfig.ts (default: 20).
//  Smaller groups are routed around it automatically.
//
//  WHAT THIS PAGE DOES
//  ────────────────────
//  Shows a card for each meeting room defined in
//  siteConfig.meetingRooms. Each card displays:
//    • A photo of the room
//    • Room name and description
//    • Feature highlights (bullet points)
//    • Price per day
//    • A +/− quantity selector (almost always 0 or 1)
//
//  When the guest clicks Continue, their selections are saved
//  to the Zustand store (meetingRoomCounts) and they proceed
//  to the Meals page.
//
//  GUARD CLAUSE — DIRECT ACCESS PROTECTION
//  ─────────────────────────────────────────
//  If someone navigates directly to /meeting-rooms without
//  going through the funnel (or if they're a small group),
//  they are redirected to the home page. This prevents
//  confusion and broken state.
//
//  CUSTOMIZATION TIPS
//  ───────────────────
//  • To add, remove or edit meeting rooms: update
//    siteConfig.meetingRooms — no changes needed here.
//  • To change what comes after this step: update the
//    router.push("/meals") call in handleContinue.
//  • If your venue charges per half-day instead of per day,
//    change pricePerDay to pricePerHalfDay in siteConfig.ts
//    and update the label "/ day" below to "/ half-day".
//  • If your venue has no meeting rooms at all, set
//    meetingRooms: [] in siteConfig.ts and this page will
//    show a "no rooms available" message, but guests will
//    never reach it anyway due to the routing in guests/page.tsx.
//
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store";
import { SITE_CONFIG } from "../siteConfig";

export default function MeetingRoomsPage() {
  const router = useRouter();

  // ── GUARD CLAUSE ─────────────────────────────────────────
  //  Check sessionStorage for the routing flag set in guests/page.tsx.
  //  If this guest isn't flagged as a group booking, send them home.
  //  useEffect runs after the component mounts (client-side only),
  //  which is why we also have the isAllowed state check below.
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const flag = sessionStorage.getItem("isGroupBooking");
    if (flag !== "true") {
      // Not a group booking — redirect to start
      router.replace("/");
    } else {
      setIsAllowed(true);
    }
  }, [router]);

  // ── STORE ────────────────────────────────────────────────
  // Read existing selections (in case guest came back to edit)
  const storedCounts = useBookingStore((s) => s.meetingRoomCounts);
  const setMeetingRoomCount = useBookingStore((s) => s.setMeetingRoomCount);
  const adults = useBookingStore((s) => s.adults);
  const checkIn = useBookingStore((s) => s.checkIn);
  const checkOut = useBookingStore((s) => s.checkOut);

  // ── LOCAL STATE ──────────────────────────────────────────
  // Local copy of counts so the UI updates instantly on +/−
  // without waiting for the global store to re-render.
  const [counts, setCounts] = useState<Record<string, number>>(
    storedCounts || {}
  );

  // ── HELPERS ──────────────────────────────────────────────

  // Calculate number of nights between check-in and check-out.
  // Meeting rooms are priced per day so this drives the subtotal preview.
  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const diff =
      new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  })();

  // Get the current quantity for a room (0 if not yet selected)
  const getCount = (sku: string) => counts[sku] ?? 0;

  // Increment or decrement a room's quantity, clamped between
  // 0 and the room's maxQty defined in siteConfig.
  const adjustCount = (sku: string, delta: number, maxQty: number) => {
    const current = getCount(sku);
    const next = Math.min(maxQty, Math.max(0, current + delta));
    const updated = { ...counts, [sku]: next };
    setCounts(updated);
    // Also write to the store immediately so other pages see it
    setMeetingRoomCount(sku, next);
  };

  // Calculate the running subtotal for all selected meeting rooms.
  // This gives the guest a live preview as they select rooms.
  const meetingRoomSubtotal = SITE_CONFIG.meetingRooms.reduce((sum, room) => {
    const qty = getCount(room.sku);
    // Multiply by nights: if you stay 3 nights you need the room 3 days
    return sum + room.pricePerDay * qty * Math.max(1, nights);
  }, 0);

  // How many rooms has the guest selected in total?
  const totalRoomsSelected = Object.values(counts).reduce(
    (sum, qty) => sum + qty,
    0
  );

  // ── NAVIGATION ───────────────────────────────────────────
  const handleContinue = () => {
    // Allow continuing with zero meeting rooms — some groups
    // bring their own spaces or use the dining room.
    router.push("/meals");
  };

  // ── RENDER GUARD ─────────────────────────────────────────
  // Don't render anything until we've confirmed access.
  // This prevents a flash of content before the redirect fires.
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-500 text-sm">Checking access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="bg-stone-900 border-b border-stone-800 px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-emerald-500 mb-1">
            Step 5 of 8
          </p>
          <h1 className="text-2xl font-bold text-stone-100">
            Select your meeting rooms
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            {adults} adults · {nights > 0 ? `${nights} night${nights !== 1 ? "s" : ""}` : "dates not set"} · Priced per day
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ── INTRO NOTE ───────────────────────────────────────
            Explains to the guest that meeting rooms are optional
            and that they can select more than one.
        ─────────────────────────────────────────────────────── */}
        <div className="bg-stone-900 border border-stone-800 rounded-lg px-5 py-4 mb-8 text-sm text-stone-400">
          <span className="text-stone-300 font-medium">Meeting rooms are optional.</span>{" "}
          Select as many as your group needs. Prices shown are per day.
          Your coordinator will confirm final room assignments and layout
          options when they follow up on your quote.
        </div>

        {/* ── ROOM CARDS ───────────────────────────────────────
            One card per meeting room in siteConfig.meetingRooms.
            To add or remove rooms, edit siteConfig.ts only.
        ─────────────────────────────────────────────────────── */}
        {SITE_CONFIG.meetingRooms.length === 0 ? (
          // Fallback if siteConfig.meetingRooms is empty []
          <div className="text-center py-20 text-stone-500">
            <p className="text-lg">No meeting rooms configured.</p>
            <p className="text-sm mt-2">
              Add rooms to the meetingRooms array in siteConfig.ts.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {SITE_CONFIG.meetingRooms.map((room) => {
              const qty = getCount(room.sku);
              const isSelected = qty > 0;

              return (
                <div
                  key={room.sku}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-stone-900"
                      : "border-stone-800 bg-stone-900 hover:border-stone-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row">

                    {/* Room photo */}
                    <div className="sm:w-56 sm:flex-shrink-0 h-48 sm:h-auto overflow-hidden">
                      {room.imageUrl ? (
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          className="w-full h-full object-cover"
                          // Graceful fallback if image URL is broken
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        // Placeholder when no image is provided
                        <div className="w-full h-full bg-stone-800 flex items-center
                                        justify-center text-stone-600 text-sm">
                          No photo
                        </div>
                      )}
                    </div>

                    {/* Room details */}
                    <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                      <div>
                        {/* Room name and price */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-stone-100">
                            {room.name}
                          </h3>
                          <div className="text-right flex-shrink-0">
                            <div className="text-emerald-400 font-bold text-lg">
                              ${room.pricePerDay.toLocaleString()}
                            </div>
                            <div className="text-stone-500 text-xs">/ day</div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-stone-400 text-sm leading-relaxed mb-3">
                          {room.description}
                        </p>

                        {/* Feature tags */}
                        {room.features && room.features.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {room.features.map((feature, i) => (
                              <span
                                key={i}
                                className="text-xs bg-stone-800 border border-stone-700
                                           text-stone-400 rounded-full px-3 py-1"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ── QUANTITY CONTROLS ──────────────────────────────
                          +/− buttons to select how many of this room to book.
                          For most meeting rooms, maxQty is 1 (you only have
                          one Manitoba Room). The − button is disabled at 0.
                      ──────────────────────────────────────────────────── */}
                      <div className="flex items-center justify-between pt-3
                                      border-t border-stone-800">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustCount(room.sku, -1, room.maxQty)}
                            disabled={qty === 0}
                            className="w-9 h-9 rounded-full border border-stone-700
                                       text-stone-300 hover:bg-stone-800 disabled:opacity-30
                                       disabled:cursor-not-allowed text-lg font-bold
                                       flex items-center justify-center transition-colors"
                          >
                            −
                          </button>

                          <span className={`w-6 text-center font-bold text-lg ${
                            isSelected ? "text-emerald-400" : "text-stone-500"
                          }`}>
                            {qty}
                          </span>

                          <button
                            onClick={() => adjustCount(room.sku, 1, room.maxQty)}
                            disabled={qty >= room.maxQty}
                            className="w-9 h-9 rounded-full border border-stone-700
                                       text-stone-300 hover:bg-stone-800 disabled:opacity-30
                                       disabled:cursor-not-allowed text-lg font-bold
                                       flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Per-room subtotal preview */}
                        {isSelected && nights > 0 && (
                          <div className="text-right text-sm">
                            <div className="text-stone-400">
                              ${room.pricePerDay.toLocaleString()} × {nights} day{nights !== 1 ? "s" : ""}
                            </div>
                            <div className="text-emerald-400 font-semibold">
                              = ${(room.pricePerDay * nights).toLocaleString()}
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
        )}

        {/* ── RUNNING TOTAL ────────────────────────────────────
            Shows a live meeting room subtotal as rooms are selected.
            Only visible once at least one room is selected.
        ─────────────────────────────────────────────────────── */}
        {totalRoomsSelected > 0 && (
          <div className="mt-6 bg-stone-900 border border-emerald-800 rounded-xl
                          px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-stone-400">
                {totalRoomsSelected} meeting room{totalRoomsSelected !== 1 ? "s" : ""} selected
              </div>
              {nights > 0 && (
                <div className="text-xs text-stone-500 mt-0.5">
                  {nights} day{nights !== 1 ? "s" : ""} · before tax
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold text-xl">
                ${meetingRoomSubtotal.toLocaleString()}
              </div>
              <div className="text-stone-500 text-xs">meeting rooms subtotal</div>
            </div>
          </div>
        )}

        {/* ── NAVIGATION ───────────────────────────────────────── */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-lg border border-stone-700
                       text-stone-300 hover:bg-stone-800 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500
                       text-white font-semibold transition-colors"
          >
            {totalRoomsSelected > 0
              ? `Continue with ${totalRoomsSelected} room${totalRoomsSelected !== 1 ? "s" : ""} →`
              : "Continue without meeting rooms →"}
          </button>
        </div>

        {/* Skip note */}
        <p className="text-center text-stone-600 text-xs mt-4">
          Not sure yet? You can skip this step — your coordinator will
          discuss room options when they follow up on your quote.
        </p>

      </div>
    </div>
  );
}
