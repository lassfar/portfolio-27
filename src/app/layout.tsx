import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SmoothScrollProvider from "#/components/providers/SmoothScrollProvider";
import "#/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
