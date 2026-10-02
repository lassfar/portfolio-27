import type { Metadata } from "next";
import SmoothScrollProvider from "#/components/providers/SmoothScrollProvider";
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
      <body suppressHydrationWarning className="antialiased dark">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
