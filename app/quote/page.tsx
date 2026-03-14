"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// This "@" shortcut tells Vercel to look in the root folder for the store
import { useFunnelStore } from "@/store";

export default function QuotePage() {
  const router = useRouter();
  const { data } = useFunnelStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return null;

  // Simple logic to show a summary before the final contact form
  const totalGuests = (data.adultCount || 0) + (data.childCount || 0);

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 font-sans text-stone-900">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-2xl border border-stone-200">
        <h1 className="text-3xl font-black mb-2 text-center tracking-tight">Your Selection Summary</h1>
        <p className="text-stone-500 text-center mb-8 italic">Review your details before we send the official quote.</p>
        
        <div className="space-y-4">
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-700 mb-2">Group Details</h3>
            <p className="text-lg font-medium">Segment: {data.eventSegment || "Not selected"}</p>
            <p className="text-lg font-medium">Type: {data.specificType || "Not selected"}</p>
            <p className="text-lg font-medium">Total Guests: {totalGuests}</p>
          </div>

          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-700 mb-2">Plan Details</h3>
            <p className="text-lg font-medium">Meal Plan: {data.wantsMeals ? "Included" : "Not requested"}</p>
            <p className="text-lg font-medium">Dates: {data.dateRange?.from ? new Date(data.dateRange.from).toLocaleDateString() : "TBD"}</p>
          </div>
        </div>

        <div className="mt-10">
          <button 
            onClick={() => router.push("/contact")}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-5 rounded-2xl shadow-xl text-xl transition-all active:scale-95"
          >
            Final Step: Receive Itemized Quote →
          </button>
          
          <button 
            onClick={() => router.back()}
            className="w-full mt-4 text-stone-400 font-medium hover:text-stone-600 transition-colors"
          >
            ← Go Back and Edit
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-stone-400 text-sm tracking-widest uppercase">Wilderness Edge Retreat & Conference Centre</p>
      </div>
    </div>
  );
}