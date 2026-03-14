// ============================================================
//  app/layout.tsx — THE OUTER SHELL OF THE ENTIRE APP
// ============================================================
//
//  This file wraps every single page in the funnel. Anything
//  you put here appears on ALL pages — the browser tab title,
//  the favicon, global fonts, and the base background color.
//
//  WHAT THIS FILE CONTROLS
//  ────────────────────────
//  • The <html> and <body> tags that surround every page
//  • The browser tab title and meta description
//    (what Google and social media previews show)
//  • The favicon (the small icon in the browser tab)
//  • The global font loaded from Google Fonts
//  • The base background color applied to every page
//
//  WHAT TO CHANGE FOR YOUR VENUE
//  ───────────────────────────────
//  1. Title and description — update the metadata block below.
//     These are the only two things most venues need to change.
//
//  2. Favicon — replace /public/favicon.ico with your own icon.
//     Any 32×32 or 64×64 .ico or .png file works. Some venues
//     use a cropped version of their logo.
//
//  3. Font — the default is "Lato" from Google Fonts, which is
//     clean and professional. To change it, update the Google
//     Fonts import URL and the fontFamily in the body className.
//     Popular alternatives: Inter, Nunito, Source Sans 3.
//
//  4. Background color — the base is bg-stone-950 (near black).
//     This is the dark forest premium look. If you want a lighter
//     base, change it to bg-white or bg-stone-50 here and update
//     the individual page backgrounds to match.
//
//  AI CUSTOMIZATION TIP
//  ─────────────────────
//  This is the first file an AI assistant should update when
//  rebranding this funnel for a new venue. Tell it:
//  "Update layout.tsx for [Venue Name]. Their tagline is
//  [tagline]. Use the same dark forest style."
//
// ============================================================

import type { Metadata } from "next";

// ── PAGE METADATA ────────────────────────────────────────────
// These values power the browser tab, Google search results,
// and social media link previews (Open Graph).
//
// title       — Shows in the browser tab and search results.
//               Format: "Page Action | Venue Name"
//               Keep it under 60 characters for best SEO.
//
// description — Shows under the title in Google search results.
//               Keep it under 160 characters.
//               Write it as a call to action for your guests.
export const metadata: Metadata = {
  title: {
    // The "template" wraps every page's individual title.
    // A page that sets title="Select Rooms" will show as:
    // "Select Rooms | Wilderness Edge Retreat & Conference Centre"
    template: "%s | Wilderness Edge Retreat & Conference Centre",
    // This is the default title used when a page doesn't set its own.
    default: "Wilderness Edge Retreat & Conference Centre — Group Booking",
  },
  description:
    "Plan and price your group retreat, conference, or family gathering " +
    "at Wilderness Edge in Pinawa, Manitoba. Select rooms, meals, meeting " +
    "spaces and activities — get an instant quote in minutes.",
  // Optional: add your venue's URL here for canonical SEO
  // metadataBase: new URL("https://wildernessedge.com"),
};

// ── ROOT LAYOUT ──────────────────────────────────────────────
// RootLayout wraps every page. The {children} slot is where
// each individual page (rooms, meals, quote, etc.) is inserted.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // lang="en" helps screen readers and search engines understand
    // the language of your content. Change to "fr" for French venues.
    <html lang="en">

      <head>
        {/*
          ── GOOGLE FONT ──────────────────────────────────────
          Lato is a clean, professional sans-serif that reads
          well at all sizes. The two weights loaded are:
            400 — body text (regular)
            700 — headings and prices (bold)

          To change the font:
            1. Go to fonts.google.com
            2. Pick a font and select weights 400 and 700
            3. Copy the <link> tags Google provides
            4. Paste them here, replacing the Lato links below
            5. Update the font-family in the <body> below

          Popular alternatives for retreat/conference venues:
            • Inter      — modern, very readable
            • Nunito     — friendly, rounded
            • Raleway    — elegant, slightly upscale
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap"
          rel="stylesheet"
        />

        {/*
          ── FAVICON ──────────────────────────────────────────
          The small icon shown in the browser tab.
          Replace /public/favicon.ico with your venue's icon.
          Recommended: a 64×64px version of your logo mark.

          If you don't have a favicon yet, delete this line —
          the browser will just show a blank tab icon, which
          is fine during development.
        */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body
        style={{ fontFamily: "'Lato', sans-serif" }}
        className={[
          // Base background — dark stone (near black).
          // This is the "dark forest premium" base color.
          // Every page sets its own background too, but this
          // prevents any flash of white during page transitions.
          "bg-stone-950",

          // Remove default browser margin/padding
          "m-0 p-0",

          // Smooth font rendering on Mac/iOS
          "antialiased",
        ].join(" ")}
      >
        {/*
          {children} is where Next.js inserts the current page.
          You can add a global header or footer here if needed —
          for example, a venue logo bar at the top of every page.

          Currently the funnel has no persistent header because
          each page has its own step indicator. If you want a
          shared header (e.g. logo + phone number), add it here:

          <header className="...">
            <img src={SITE_CONFIG.venueLogo} ... />
            <span>{SITE_CONFIG.venuePhone}</span>
          </header>

          Remember to import SITE_CONFIG from "../siteConfig" if
          you add any venue data here.
        */}
        {children}
      </body>

    </html>
  );
}
