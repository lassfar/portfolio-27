/**
 * Photo/video locations plotted as pins on the Earth globe (M3).
 *
 * Each PLACE is one pin at true lat/lng; clicking it opens a GALLERY of that
 * place's media (photos + short video clips) in the luxurious side panel, with a
 * per-place story and per-photo captions. A pin's 3D position comes from
 * `latLngToVector3(lat, lng, EARTH.radius)`.
 *
 * ── Adding real media ────────────────────────────────────────────────────────
 * Drop files under /public and point `src` at them (leading slash = /public):
 *   photos → /public/photos/<place-id>/<name>.jpg   (jpg or webp)
 *   videos → /public/videos/<place-id>/<name>.mp4   (h264 mp4; webm optional)
 *   poster → a still frame for each video, e.g. /public/photos/<place-id>/<name>-poster.jpg
 * The gallery shows an elegant placeholder tile until the real file exists, so
 * you can wire coordinates + captions now and drop the media in later.
 */

export type MediaItem = {
  type: "image" | "video";
  src: string; // /public path, e.g. "/photos/london/thames-frost.jpg"
  poster?: string; // still frame for videos (recommended)
  caption?: string; // shown under the media in the lightbox
  /** Optional intrinsic aspect (w/h) — lets the panel reserve space before load. */
  aspect?: number;
};

export type PhotoLocation = {
  id: string;
  place: string; // "London", "New Forest — Brockenhurst"
  country: string;
  lat: number; // degrees, +N
  lng: number; // degrees, +E
  blurb?: string; // a sentence of story about the place / the trip
  media: MediaItem[]; // the gallery for this pin
};

/**
 * Real places (media are PLACEHOLDERS for now — replace `src`/`poster`/`caption`
 * with your actual files under /public/photos and /public/videos).
 */
export const PHOTO_LOCATIONS: PhotoLocation[] = [
  {
    id: "london",
    place: "London",
    country: "United Kingdom",
    lat: 51.5074,
    lng: -0.1278,
    blurb: "The city I keep coming back to — grey light, warm corners.",
    media: [
      { type: "image", src: "/photos/london/01.jpg", caption: "Placeholder — London 01" },
      { type: "image", src: "/photos/london/02.jpg", caption: "Placeholder — London 02" },
      { type: "image", src: "/photos/london/03.jpg", caption: "Placeholder — London 03" },
      { type: "image", src: "/photos/london/04.jpg", caption: "Placeholder — London 04" },
      {
        type: "video",
        src: "/videos/london/01.mp4",
        poster: "/photos/london/01-poster.jpg",
        caption: "Placeholder — London clip",
      },
    ],
  },
  {
    id: "brockenhurst",
    place: "New Forest — Brockenhurst",
    country: "United Kingdom",
    lat: 50.8198,
    lng: -1.573,
    blurb: "Wild ponies, low mist, and the quiet of the New Forest.",
    media: [
      { type: "image", src: "/photos/brockenhurst/01.jpg", caption: "Placeholder — Brockenhurst 01" },
      { type: "image", src: "/photos/brockenhurst/02.jpg", caption: "Placeholder — Brockenhurst 02" },
      { type: "image", src: "/photos/brockenhurst/03.jpg", caption: "Placeholder — Brockenhurst 03" },
      {
        type: "video",
        src: "/videos/brockenhurst/01.mp4",
        poster: "/photos/brockenhurst/01-poster.jpg",
        caption: "Placeholder — Brockenhurst clip",
      },
    ],
  },
];
