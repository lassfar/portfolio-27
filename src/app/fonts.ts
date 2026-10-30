import { Great_Vibes, Hanken_Grotesk, Krona_One } from "next/font/google";

/**
 * The site's fonts, self-hosted by Next at build time (P27-78): Latin-only woff2 files
 * served from this site (visitors never contact Google), the ones the first screen needs
 * preloaded, with a size-matched fallback so nothing jumps when they swap in. Their CSS
 * variables feed the @theme tokens in globals.css (`font-sans`, `font-great-vibes`,
 * `font-krone-one`).
 */

/**
 * The body text (P27-111): one variable file for every weight the site uses (300, 400,
 * 500). Self-hosted so it's the same everywhere: the system stack it replaced was Helvetica
 * Neue on a Mac but Arial on Windows, which has no Light, so the text drew a weight bolder.
 */
export const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken-grotesk-face",
});

export const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-great-vibes-face",
});

/** Not used on the page yet: never preloaded, only downloaded where it's used. */
export const kronaOne = Krona_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-krona-one-face",
  preload: false,
});
