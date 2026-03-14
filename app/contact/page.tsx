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
    const pubKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (pubKey) {
      emailjs.init(pubKey);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fName = (formData.get("first_name") as string) || "Guest";
    const lName = (formData.get("last_name") as string) || "";
    const uEmail = (formData.get("user_email") as string) || "";
    setSubmittedName(fName);

    // --- 1. PRICE CONFIG ---
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

    // --- 2. DATES ---
    const checkIn = data?.dateRange?.from ? new Date(data.dateRange.from) : new Date();
    const checkOut = data?.dateRange?.to ? new Date(data.dateRange.to) : new Date();
    const nights = Math.max(1, Math.ceil(Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const days = nights + 1;

    // --- 3. CALCULATIONS ---
    let roomList = "";
    let roomTotal = 0;
    const roomCounts = data?.roomCounts || {};
    Object.entries(roomCounts).forEach(([name, qty]) => {
      const quantity = Number(qty) || 0;
      if (quantity > 0) {
        const price = prices[name] || 0;
        const sub = price * quantity * nights;
        roomTotal += sub;
        roomList += `\n- ${quantity}x ${name} ($${price}/nt x ${nights}): $${sub}`;
      }
    });

    let actList = "";
    let actTotal = 0;
    const activities = data?.activities || {};
    Object.entries(activities).forEach(([name, qty]) => {
      const quantity = Number(qty) || 0;
      if (quantity > 0) {
        const price = prices[name] || 0;
        const sub = price * quantity;
        actTotal += sub;
        actList += `\n- ${quantity}x ${name} ($${price} ea): $${sub}`;
      }
    });

    let mealTotal = 0;
    let mealDetails = "No meal plan.";
    if (data?.wantsMeals) {
      const aCount = data.adultCount || 0;
      const cCount = data.childCount || 0;
      const cAge = data.childAge || 5;
      const adultDaily = aCount * (prices["Adult Meal Rate"] || 0);
      const childDaily = cCount * (cAge * (prices["Child Meal Price Per Year"] || 0));
      mealTotal = (adultDaily + childDaily) * days;
      mealDetails = `Adults(${aCount}), Kids(${cCount}, Age ${cAge}). Total: $${mealTotal}`;
    }

    const total = roomTotal + actTotal + mealTotal;

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          to_name: "Wilderness Edge",
          from_name: `${fName} ${lName}`,
          reply_to: uEmail,
          message: `Quote for ${fName}:\nLodging: $${roomTotal}${roomList}\nMeals: ${mealDetails}\nActivities: $${actTotal}${actList}\n\nGRAND TOTAL: $${total}`
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );
      setSent(true);
      setTimeout(() => { reset(); router.push("/"); }, 5000);
    } catch (err) {
      console.error(err);
      alert("Submission Error. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="bg-white p-12 rounded-3xl shadow-xl text-center">
        <h2 className="text-3xl font-black text-emerald-700">Sent!</h2>
        <p className="mt-4 text-stone-600 font-sans">Thank you, {submittedName}.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4 font-sans text-stone-900">
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl">
        <h1 className="text-2xl font-black mb-6 text-center">Get Your Quote</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required name="first_name" placeholder="First Name" className="w-full p-4 border rounded-xl" />
          <input required name="last_name" placeholder="Last Name" className="w-full p-4 border rounded-xl" />
          <input required name="user_email" type="email" placeholder="Email" className="w-full p-4 border rounded-xl" />
          <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white font-bold py-4 rounded-xl">
            {loading ? "Processing..." : "Email Quote"}
          </button>
        </form>
      </div>
    </div>
  );
}