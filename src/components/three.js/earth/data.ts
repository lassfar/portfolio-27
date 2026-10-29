/**
 * Photo/video locations plotted as pins on the Earth globe (M3).
 *
 * Each PLACE is one pin at true lat/lng; clicking it (or its label) opens a GALLERY of
 * that place's media (photos + short video clips) in the scene's panel (P27-80), under
 * its title and story, with per-photo captions. A pin's 3D position comes from
 * `latLngToVector3(lat, lng, EARTH.radius)`.
 *
 * ── Adding real media ────────────────────────────────────────────────────────
 * Drop files under /public and point `src` at them (leading slash = /public):
 *   photos → /public/photos/<place-id>/<name>.jpg: the master (about 2000 px), with its
 *            `width`, `height`, `blur` and `alt`. next/image serves each screen the size it
 *            needs, in AVIF or WebP (P27-106; Netlify's image CDN on the live site)
 *   videos → /public/videos/<place-id>/<name>.mp4   (h264 mp4; webm optional)
 *   poster → a still frame for each video, e.g. /public/photos/<place-id>/<name>-poster.jpg
 * The gallery shows an elegant placeholder tile until the real file exists, so
 * you can wire coordinates + captions now and drop the media in later.
 */

export type MediaItem = {
  type: "image" | "video";
  src: string; // /public path, e.g. "/photos/london/tower-bridge.jpg"
  /** A real photo's size in px (its master): next/image's shape and its widest version. */
  width?: number;
  height?: number;
  /** A tiny blurred copy (a data URL) shown while it loads. */
  blur?: string;
  /** What the photo shows, plainly (the caption is the story; this is for screen readers). */
  alt?: string;
  poster?: string; // still frame for videos (recommended)
  caption?: string; // shown under the media in the lightbox
  /** Optional intrinsic aspect (w/h) — lets the panel reserve space before load. */
  aspect?: number;
};

/** The London photos' masters (P27-106): their size and blur image (the sharp script's output). */
const LONDON_FILES: Record<string, Pick<MediaItem, "width" | "height" | "blur">> = {
  "tower-bridge": {
    width: 2000,
    height: 1333,
    blur: "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAAAwAgCdASoQAAsAAsBMJaACdIE5wABXrxG/gADeM/EiqXcqPuwa3t+Ctvf+sfIvE6N/k2aKSL9u0y5hEmU/Rv9nXpMFPgvZ+S4i+QhCgAA=",
  },
  cahoots: {
    width: 2000,
    height: 1333,
    blur: "data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAAAwAgCdASoQAAsAAsBMJbACdAERHzDyyJ5pgAD+9F+83MSqeXlC8ibLI8a9nrcxLQpf/xEhtBzRc7txksVgEZVjilcFss3cYIn8k2p8XPW2EvnWeb+PE5S0CVcfbrusAAA=",
  },
  "autumn-oak": {
    width: 1500,
    height: 1000,
    blur: "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAAAwAgCdASoQAAsAAsBMJaACdAEWp0hKujwIAAD6miTdVkBDkWsB0GiNPinUk3Kp0e1MSBzD5x8E2hfSxnBQm368wqT4yDISM9kMAyFoaAAAAA==",
  },
  "arcade-lights": {
    width: 2000,
    height: 1333,
    blur: "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAADQAQCdASoQAAsAAsBMJYgCdACxhO7AAAD+99RUbr9jEztLtunjwiXY0agrGvDlEYvZ+9k2pNFH66ti4ncp9lIbQzIofg0tfrQgy1SKAAA=",
  },
  "green-roof": {
    width: 2000,
    height: 1333,
    blur: "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAABwAgCdASoQAAsAAsBMJZACdAYubq6bjBUgfETgAP7zUv9Z6W8T4b37T5ZmyGi2yXdd2GAA6vJsxGwsBErmDISFCtCdSOmWaP7xB+sxe+h5HaEWG9yepW5jrRai9vjvBtHchIg0AAA=",
  },
  "goose-reeds": {
    width: 2000,
    height: 1333,
    blur: "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAADQAQCdASoQAAsAAsBMJagCdACXSpzYAAD+7vLf6hAv4jniFBL8wQdwWCaIXwnuHurSiz/rkPIb4kCy/HGpi9pSueyTlr68VBaArG8v6HX6Xvifjp0zdeRnYhHgAA==",
  },
  "goose-watch": {
    width: 2000,
    height: 1333,
    blur: "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAAAQAgCdASoQAAsAAsBMJZgCdAD8a+3UNKyQAP7xosCudHN8J/jaXdShxH23ETy9Z/QMa7j0i4UgUSSS8bkUdDml97opTZd5oaV5TubVNHAAAA==",
  },
};

/** One of the London photos: its master, its caption and what it shows. */
const london = (name: string, caption: string, alt: string): MediaItem => ({
  type: "image",
  src: `/photos/london/${name}.jpg`,
  ...LONDON_FILES[name],
  caption,
  alt,
});

export type PhotoLocation = {
  id: string;
  place: string; // "London", "New Forest — Brockenhurst" (its label)
  /** A shorter name for the panel's place pills, when `place` is long ("New Forest"). */
  short?: string;
  /** The panel's title, its key word in peach between asterisks ("Back to *London*"). */
  title: string;
  country: string;
  lat: number; // degrees, +N
  lng: number; // degrees, +E
  blurb?: string; // a sentence of story about the place / the trip
  media: MediaItem[]; // the gallery for this pin
  /** Which side of the pin the always-on label sits (default "top-left"). Use
   *  this to fan out clustered places — e.g. London top-right, Brockenhurst
   *  top-left — so their labels don't collide. */
  labelAnchor?: "top-left" | "top-right";
};

/**
 * Real places. London has its first real photos (P27-106); Brockenhurst's and Morocco's
 * media are still PLACEHOLDERS: replace `src`/`poster`/`caption` with the real files.
 */
export const PHOTO_LOCATIONS: PhotoLocation[] = [
  {
    id: "london",
    place: "London",
    title: "Back to *London*",
    country: "United Kingdom",
    lat: 51.5074,
    lng: -0.1278,
    labelAnchor: "top-right", // fan out from nearby Brockenhurst (top-left)
    blurb: "The city I keep coming back to — grey light, warm corners.",
    media: [
      london(
        "tower-bridge",
        "Tower Bridge, catching the last gold of the day",
        "Tower Bridge over the Thames at sunset, its stone towers lit gold",
      ),
      london(
        "cahoots",
        "A neon door under the arches in Borough",
        "The Cahoots bar front under a railway arch: neon letters, old postal signs and lanterns",
      ),
      london(
        "autumn-oak",
        "One oak still holding on to its autumn",
        "A large oak in a park in autumn, a few branches still covered in yellow leaves",
      ),
      london(
        "arcade-lights",
        "An arcade at Christmas, its light spun like thread",
        "A shopping arcade at Christmas: white light sculptures hanging over golden branches and red baubles",
      ),
      london(
        "green-roof",
        "A shed roof that became a garden",
        "The pointed wooden roof of a shed, planted with red valerian and succulents",
      ),
      london(
        "goose-reeds",
        "A goose keeping watch from the reeds",
        "A Canada goose standing in green reeds, a second goose half hidden behind",
      ),
      london(
        "goose-watch",
        "Head up, while the other one stays hidden",
        "A Canada goose with its neck raised in the reeds, another one sitting behind it",
      ),
    ],
  },
  {
    id: "brockenhurst",
    place: "New Forest — Brockenhurst",
    short: "New Forest",
    title: "New Forest, *Brockenhurst*",
    country: "United Kingdom",
    lat: 50.8198,
    lng: -1.573,
    blurb: "Wild ponies, low mist, and the quiet of the New Forest.",
    media: [
      {
        type: "image",
        src: "/photos/brockenhurst/01.jpg",
        caption: "Placeholder — Brockenhurst 01",
      },
      {
        type: "image",
        src: "/photos/brockenhurst/02.jpg",
        caption: "Placeholder — Brockenhurst 02",
      },
      {
        type: "image",
        src: "/photos/brockenhurst/03.jpg",
        caption: "Placeholder — Brockenhurst 03",
      },
      {
        type: "video",
        src: "/videos/brockenhurst/01.mp4",
        poster: "/photos/brockenhurst/01-poster.jpg",
        caption: "Placeholder — Brockenhurst clip",
      },
    ],
  },
  {
    id: "morocco",
    place: "Morocco",
    title: "Home, *Morocco*",
    country: "Morocco",
    lat: 31.6295, // Marrakesh — a central, recognizable spot on the map
    lng: -7.9811,
    blurb: "Home — warm light, warmer people.",
    media: [
      { type: "image", src: "/photos/morocco/01.jpg", caption: "Placeholder — Morocco 01" },
      { type: "image", src: "/photos/morocco/02.jpg", caption: "Placeholder — Morocco 02" },
      { type: "image", src: "/photos/morocco/03.jpg", caption: "Placeholder — Morocco 03" },
      {
        type: "video",
        src: "/videos/morocco/01.mp4",
        poster: "/photos/morocco/01-poster.jpg",
        caption: "Placeholder — Morocco clip",
      },
    ],
  },
];
