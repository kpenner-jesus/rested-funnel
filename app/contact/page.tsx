"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFunnelStore } from "../store";
import emailjs from "@emailjs/browser";

export default function ContactStep() {
  const router = useRouter();
  const { data, reset } = useFunnelStore();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  useEffect(() => { 
    setIsLoaded(true);
    // Initialize using the Public Key from Vercel Environment Variables
    const pubKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (pubKey) {
      emailjs.init(pubKey);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fName = formData.get("first_name") as string;
    const lName = formData.get("last_name") as string;
    const uEmail = formData.get("user_email") as string;
    setSubmittedName(fName);

    // --- 1. THE PRICE MAP (Names match card titles exactly) ---
    const prices: Record<string, number> = {
      "Bachelor Suite": 129,
      "Couples Suite": 159,
      "Family Suite": 189,
      "Two-Bedroom Suite": 249,
      "Canoe Rental": 25,
      "Tubing & Rafting": 35,
      "Pontoon Boat Experience": 150,
      "Hoopla Island Obstacle Course": 20,
      "Bannock Bake Activity": 15,
      "Firepit with S'mores": 10,
      "Wolf Howl Hike (Guided)": 20,
      "Petroforms Guided Tour": 30,
      "Adult Meal Rate": 45,
      "Child Meal Price Per Year": 4 
    };

    // --- 2. CALCULATE DURATION ---
    const checkIn = data.dateRange?.from ? new Date(data.dateRange.from) : new Date();
    const checkOut = data.dateRange?.to ? new Date(data.dateRange.to) : new Date();
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const days = nights + 1;

    // --- 3. CALCULATE ROOMS ---
    let roomList = "";
    let roomTotal = 0;
    Object.entries(data.roomCounts || {}).forEach(([name, qty]) => {
      if (qty > 0) {
        const subtotal = (prices[name] || 0) * qty * nights;
        roomTotal += subtotal;
        roomList += `\n- ${qty}x ${name} ($${prices[name]}/night x ${nights} nights): $${subtotal}`;
      }
    });

    // --- 4. CALCULATE ACTIVITIES ---
    let actList = "";
    let actTotal = 0;
    Object.entries(data.activities || {}).forEach(([name, qty]) => {
      if (qty > 0) {
        const subtotal = (prices[name] || 0) * qty;
        actTotal += subtotal;
        actList += `\n- ${qty}x ${name} ($${prices[name]} ea): $${subtotal}`;
      }
    });

    // --- 5. CALCULATE MEALS ---
    let mealTotal = 0;
    let mealDetails = "No meal plan selected.";
    if (data.wantsMeals) {
      const adultMealDay = (data.adultCount || 0) * prices["Adult Meal Rate"];
      const childMealDay = (data.childCount || 0) * ((data.childAge || 5) * prices["Child Meal Price Per Year"]);
      mealTotal = (adultMealDay + childMealDay) * days;
      mealDetails = `
- Adults: ${data.adultCount} x $${prices["Adult Meal Rate"]}/day
- Children (Avg Age ${data.childAge}): ${data.childCount} x $${(data.childAge || 5) * prices["Child Meal Price Per Year"]}/day
- Duration: ${days} days (${data.firstMeal} to ${data.lastMeal})
- Meal Subtotal: $${mealTotal}`;
    }

    const grandTotal = roomTotal + actTotal + mealTotal;
    const dateStr = `${checkIn.toLocaleDateString()} to ${checkOut.toLocaleDateString()}`;

    // --- 6. FORMAT EMAIL ---
    const emailContent = `
OFFICIAL QUOTE REQUEST - WILDERNESS EDGE
-----------------------------------------
CUSTOMER: ${fName} ${lName}
EMAIL: ${uEmail}

STAY DETAILS:
- Dates: ${dateStr} (${nights} nights)
- Guests: ${data.adultCount} Adults, ${data.childCount} Children
- Lodging:${roomList || "\n  None selected"}
  LODGING TOTAL: $${roomTotal}

CATERING (MEAL PLAN):
${mealDetails}

ACTIVITIES:${actList || "\n  None selected"}
  ACTIVITIES TOTAL: $${actTotal}

-----------------------------------------
ESTIMATED GRAND TOTAL: $${grandTotal}
-----------------------------------------
    `;

    try {
      // Pulling directly from Vercel's secure environment
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!, 
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!, 
        {
          to_name: "Wilderness Edge Coordinator",
          from_name: `${fName} ${lName}`,
          reply_to: uEmail,
          message: emailContent
        }, 
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      setSent(true);
      setTimeout(() => { reset(); router.push("/"); }, 6000);
    } catch (err: any) {
      alert("Error: " + (err?.text || "Communication error. Check your Vercel Environment Variables."));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  if (sent) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold">✓</div>
          <h2 className="text-3xl font-black text-stone-900 mb-2">Quote Sent!</h2>
          <p className="text-stone-500 mb-6 text-lg tracking-tight">
            Thank you, {submittedName}. Your quote is on its way.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 font-sans text-stone-900">
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-2xl border border-stone-200">
        <h1 className="text-3xl font-black mb-2 text-center tracking-tight">Final Step</h1>
        <p className="text-stone-500 text-center mb-8">Enter your details to receive your Wilderness Edge estimate.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required name="first_name" placeholder="First Name" className="p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-emerald-600 transition-all" />
            <input required name="last_name" placeholder="Last Name" className="p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-emerald-600 transition-all" />
          </div>
          <input required name="user_email" type="email" placeholder="Email Address" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-emerald-600 transition-all" />
          <button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-5 rounded-2xl shadow-xl text-xl mt-4 transition-all active:scale-95">
            {loading ? "Generating..." : "Email My Official Quote"}
          </button>
        </form>
      </div>
    </div>
  );
}