"use client";

import { useRouter } from "next/navigation";
import { useFunnelStore } from "./store";

export default function Home() {
  const router = useRouter();
  const { setSegment } = useFunnelStore();

  const handleChoice = (segment: "group" | "family" | "wedding") => {
    setSegment(segment);
    router.push("/details");
  };

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* Hero Section */}
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
            Your journey to the perfect retreat starts here. Let&apos;s build your custom quote in 60 seconds.
          </p>
        </div>
      </div>

      {/* Choice Section */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-20 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Group Retreat */}
          <button 
            onClick={() => handleChoice("group")}
            className="bg-white p-8 rounded-3xl shadow-2xl hover:scale-105 transition-transform text-left border border-stone-100 group"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl mb-6 flex items-center justify-center text-3xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">👥</div>
            <h2 className="text-2xl font-black mb-2">Group Retreat</h2>
            <p className="text-stone-500">Perfect for corporate teams, church groups, or large organizations.</p>
          </button>

          {/* Family Gathering */}
          <button 
            onClick={() => handleChoice("family")}
            className="bg-white p-8 rounded-3xl shadow-2xl hover:scale-105 transition-transform text-left border border-stone-100 group"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-2xl mb-6 flex items-center justify-center text-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors">🏡</div>
            <h2 className="text-2xl font-black mb-2">Family & Friends</h2>
            <p className="text-stone-500">Reunions, birthdays, or just a weekend getaway with your inner circle.</p>
          </button>

          {/* Wedding */}
          <button 
            onClick={() => handleChoice("wedding")}
            className="bg-white p-8 rounded-3xl shadow-2xl hover:scale-105 transition-transform text-left border border-stone-100 group"
          >
            <div className="w-16 h-16 bg-rose-100 rounded-2xl mb-6 flex items-center justify-center text-3xl group-hover:bg-rose-600 group-hover:text-white transition-colors">💍</div>
            <h2 className="text-2xl font-black mb-2">Weddings</h2>
            <p className="text-stone-500">Celebrate your big day surrounded by nature&apos;s untamed beauty.</p>
          </button>

        </div>

        <div className="mt-16 text-center">
          <p className="text-stone-400 uppercase tracking-widest text-sm font-bold">
            Trusted by over 500 groups annually
          </p>
        </div>
      </div>
    </main>
  );
}