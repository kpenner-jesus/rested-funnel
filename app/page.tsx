"use client";
import { useRouter } from "next/navigation";
import { useBookingStore } from "./store";
import { SITE_CONFIG } from "./siteConfig";

export default function HomePage() {
  const router = useRouter();
  const setSegment   = useBookingStore((s) => s.setSegment);
  const setEventType = useBookingStore((s) => s.setEventType);

  const handleSegmentSelect = (segmentName: string) => {
    setSegment(segmentName);
    setEventType("");
    const segmentConfig = SITE_CONFIG.eventSegments.find((s) => s.name === segmentName);
    if (segmentConfig && segmentConfig.types.length > 0) {
      router.push("/event-type");
    } else {
      router.push("/guests");
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="relative h-56 sm:h-72 overflow-hidden">
        {SITE_CONFIG.heroImageUrl && (
          <img
            src={SITE_CONFIG.heroImageUrl}
            alt={SITE_CONFIG.venueName}
            className="w-full h-full object-cover opacity-60"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 to-stone-950/80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          {SITE_CONFIG.venueLogo && (
            <img
              src={SITE_CONFIG.venueLogo}
              alt={SITE_CONFIG.venueName}
              className="h-12 w-auto object-contain mb-3 drop-shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
            {SITE_CONFIG.venueName}
          </h1>
          {SITE_CONFIG.venueTagline && (
            <p className="text-stone-300 text-sm mt-1 drop-shadow">
              {SITE_CONFIG.venueTagline}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-stone-100">
            What brings you to {SITE_CONFIG.venueName.split(" ")[0]}?
          </h2>
          <p className="text-stone-400 text-sm mt-2">
            Select the option that best describes your visit and we will tailor your quote accordingly.
          </p>
        </div>

        <div className="space-y-3">
          {SITE_CONFIG.eventSegments.map((segment) => (
            <button
              key={segment.name}
              onClick={() => handleSegmentSelect(segment.name)}
              className="w-full text-left px-5 py-4 rounded-xl border border-stone-700 bg-stone-900 hover:border-emerald-600 hover:bg-stone-800 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-100 group-hover:text-emerald-400 transition-colors">
                    {segment.name}
                  </div>
                  {segment.desc && (
                    <div className="text-stone-500 text-sm mt-0.5">{segment.desc}</div>
                  )}
                </div>
                <div className="text-stone-600 group-hover:text-emerald-500 transition-colors text-lg">→</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center text-stone-600 text-xs space-y-1">
          <p>Questions? We are happy to help.</p>
          <p>
            <a href={`tel:${SITE_CONFIG.venuePhone}`} className="hover:text-emerald-500 transition-colors">
              {SITE_CONFIG.venuePhone}
            </a>
            {" · "}
            <a href={`mailto:${SITE_CONFIG.venueEmail}`} className="hover:text-emerald-500 transition-colors">
              {SITE_CONFIG.venueEmail}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
