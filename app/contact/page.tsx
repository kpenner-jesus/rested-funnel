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
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
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

    // --- 1. THE PRICE MAP (Adjust these numbers to your actual rates) ---
    const prices: Record<string, number> = {
      // Lodging (Per Night)
      "Bachelor Suite": 129,
      "Couples Suite": 159,
      "Family Suite": 189,
      "Two-Bedroom Suite": 249,
      // Activities (Flat Fee)
      "Canoe Rental": 25,
      "Tubing & Rafting": 35,
      "Pontoon Boat Experience": 150,
      "Hoopla Island Obstacle Course": 20,
      "Bannock Bake Activity": 15,
      "Firepit with S'mores": 10,
      "Wolf Howl Hike (Guided)": 20,
      "Petroforms Guided Tour": 30,
      // Meals (Per Person, Per Day)
      "Meal Plan Rate": 45 
    };

    // --- 2. CALCULATE LODGING ---
    let roomList = "";
    let roomTotal = 0;
    Object.entries(data.roomCounts || {}).forEach(([name, qty]) => {
      if (qty > 0) {
        const price = prices[name] || 0;
        const subtotal = price * qty;
        roomTotal += subtotal;
        roomList += `\n- ${qty}x ${name} ($${price}/ea): $${subtotal}`;
      }
    });

    // --- 3. CALCULATE ACTIVITIES ---
    let actList = "";
    let actTotal = 0;
    Object.entries(data.activities || {}).forEach(([name, qty]) => {
      if (qty > 0) {
        const price = prices[name] || 0;
        const subtotal = price * qty;
        actTotal += subtotal;
        actList += `\n- ${qty}x ${name} ($${price}/ea): $${subtotal}`;
      }
    });

    // --- 4. CALCULATE MEALS ---
    let mealTotal = 0;
    let mealSummary = "None selected";
    if (data.wantsMeals) {
      const totalPeople = (data.adultCount || 0) + (data.childCount || 0);
      // For now, we calculate a single day's meal cost. 
      // If you want to multiply by nights, we can add that logic next!
      mealTotal = totalPeople * (prices["Meal Plan Rate"] || 0);
      mealSummary = `Meal Plan for ${totalPeople} guests ($${prices["Meal Plan Rate"]}/person): $${mealTotal}`;
    }

    const grandTotal = roomTotal + actTotal + mealTotal;
    const dateStr = data.dateRange?.from 
      ? `${new Date(data.dateRange.from).toLocaleDateString()} to ${new Date(data.dateRange.to || "").toLocaleDateString()}`
      : "Not specified";

    const emailContent = `
OFFICIAL QUOTE REQUEST - WILDERNESS EDGE
-----------------------------------------
CUSTOMER: ${fName} ${lName}
EMAIL: ${uEmail}

STAY DETAILS:
- Dates: ${dateStr}
- Guests: ${data.adultCount} Adults, ${data.childCount} Children
- Lodging:${roomList || "\n  None selected"}
  LODGING SUBTOTAL: $${roomTotal}

CATERING:
- ${mealSummary}
- Schedule: ${data.firstMeal || "N/A"} to ${data.lastMeal || "N/A"}

ACTIVITIES:${actList || "\n  None selected"}
  ACTIVITIES SUBTOTAL: $${actTotal}

-----------------------------------------
ESTIMATED GRAND TOTAL: $${grandTotal}
-----------------------------------------
    `;

    try {
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
      setTimeout(() => { reset(); router.push("/"); }, 5000);
    } catch (err: any) {
      alert("Error: " + (err?.text || "Check your keys."));
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
            Thank you, {submittedName}. Your itemized quote including lodging, meals, and activities is on its way.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 font-sans text-stone-900">
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-2xl border border-stone-200">
        <h1 className="text-3xl font-black mb-2 text-center">Final Step</h1>
        <p className="text-stone-500 text-center mb-8 italic">Secure your Wilderness Edge estimate</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required name="first_name" placeholder="First Name" className="p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-emerald-600" />
            <input required name="last_name" placeholder="Last Name" className="p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-emerald-600" />
          </div>
          <input required name="user_email" type="email" placeholder="Email Address" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-emerald-600" />
          <button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-5 rounded-2xl shadow-xl text-xl mt-4">
            {loading ? "Finalizing Quote..." : "Email My Official Quote"}
          </button>
        </form>
      </div>
    </div>
  );
}