import { Great_Vibes, Krona_One } from "next/font/google";

/**
 * The display fonts, self-hosted by Next at build time (P27-78): Latin-only woff2 files
 * served from this site (visitors never contact Google), the hero's font preloaded, with
 * a size-matched fallback so nothing jumps when it swaps in. Their CSS variables feed the
 * @theme tokens in globals.css (`font-great-vibes`, `font-krone-one`).
 */
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
