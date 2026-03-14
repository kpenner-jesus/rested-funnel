"use client";

import { useRouter } from "next/navigation";
import { useFunnelStore } from "./store";

export default function WelcomeStep() {
  const router = useRouter();
  const setFunnelData = useFunnelStore((state) => state.setData);

  // --- KEPT EXACTLY AS PROVIDED ---
  const handleSegmentSelection = (segment: string) => {
    setFunnelData({ 
      eventSegment: segment,
      adultCount: 1,
      childCount: 0 
    });
    router.push("/event-type");
  };

  // --- KEPT EXACTLY AS PROVIDED ---
  const segments = [
    { name: "Group Retreat", desc: "(Church, Corporate, Youth...)" },
    { name: "Group Conference", desc: "(Business, Gov, Non-Profit...)" },
    { name: "Family Gathering", desc: "(Reunion, Holiday, Milestone)" },
    { name: "Wedding", desc: "(Ceremony, Reception, or Both)" },
    { name: "Individual Guest", desc: "(Solo, Couple, Small Group)" },
  ];

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* BEAUTIFUL BACKGROUND GRAPHIC SECTION */}
      <div className="relative h-[60vh] flex items-center justify-center bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80" 
            alt="Wilderness Edge Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter uppercase">
            Wilderness Edge
          </h1>
          <p className="text-xl md:text-2xl text-emerald-100 font-light max-w-2xl mx-auto">
            Welcome to Manitoba&apos;s premier waterfront venue. Let&apos;s build your personalized quote.
          </p>
        </div>
      </div>

      {/* ORIGINAL BUTTONS AND LINKS SECTION */}
      <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-20 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((seg) => (
            <button
              key={seg.name}
              onClick={() => handleSegmentSelection(seg.name)}
              className="bg-white p-8 rounded-3xl shadow-2xl hover:scale-[1.02] transition-all text-left border border-stone-100 group flex flex-col h-full shadow-emerald-900/5"
            >
              <span className="text-2xl font-black text-stone-800 group-hover:text-emerald-700 transition-colors mb-2">
                {seg.name}
              </span>
              <span className="text-sm text-stone-400 font-medium leading-relaxed">
                {seg.desc}
              </span>
              <div className="mt-auto pt-6 flex items-center text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                SELECT CATEGORY →
              </div>
            </button>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-stone-400 uppercase tracking-widest text-xs font-black">
            Step 1 of 5 • Trusted by over 500 groups annually
          </p>
        </div>
      </div>
    </main>
  );
}