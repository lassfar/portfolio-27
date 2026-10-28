import type { Metadata, Viewport } from "next";
import { PAGE_CONTROLS_ID } from "#/components/pages/home/motion/pageControls";
import { MOTION_SCRIPT } from "#/stores/motionPreference";
import "#/styles/globals.css";
import { greatVibes, kronaOne } from "./fonts";
import { SITE } from "./site";

/**
 * What search engines and link previews read (P27-98): one address (the canonical: `?motion=`
 * serves the same page), the title and description in Aymane's voice, and a share card (its
 * image: opengraph-image.tsx).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
};

export const viewport: Viewport = { themeColor: SITE.background };

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
        {/* The page's own controls, first in the Tab order: the Reduce motion switch (P27-95),
            then "Skip to Contact" (P27-99). A header: the page's banner landmark (P27-101). */}
        <header id={PAGE_CONTROLS_ID} data-mode-keep>
          {/* Its name for screen readers: without JS (the book), it holds nothing else. */}
          <span className="sr-only">Aymane Lassfar</span>
        </header>
        {children}
      </body>
    </html>
  );
}
