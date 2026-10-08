import type { Metadata } from "next";
import { PAGE_CONTROLS_ID } from "#/components/pages/home/motion/pageControls";
import { MOTION_SCRIPT } from "#/stores/motionPreference";
import "#/styles/globals.css";
import { greatVibes, kronaOne } from "./fonts";

export const metadata: Metadata = {
  title: "Aymane Lassfar — Frontend Developer",
  description:
    "Senior Frontend Developer with 7 years of experience crafting high-quality web experiences with React, Next.js, and modern JavaScript.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: browser extensions (Dark Reader, Grammarly, …)
    // inject attributes on <html>/<body> before React hydrates, which would
    // otherwise trip a hydration mismatch. This suppresses ONLY these root
    // elements' own attribute diffs — it does not mask real app mismatches.
    // The fonts' variables sit on <html>: the @theme tokens that use them live on :root.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${greatVibes.variable} ${kronaOne.variable}`}
    >
      <head>
        {/* Marks <html> with the motion mode (`data-motion`) before the first paint (P27-91).
            A plain script: next/script's beforeInteractive would run only once Next has loaded. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </head>
      {/* The page's black on the body: the journey's smooth scroll fixes its content, so the
          page itself has no height to paint (P27-93). */}
      <body suppressHydrationWarning className="dark bg-rich-black antialiased">
        {/* The page's own controls, first in the Tab order: the Reduce motion switch (P27-95). */}
        <div id={PAGE_CONTROLS_ID} data-mode-keep />
        {children}
      </body>
    </html>
  );
}
