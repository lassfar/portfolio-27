/**
 * Photo locations plotted on the Earth globe (M3). Scaffolded now so the globe,
 * the lat/lng math, and the future pins/cards all share one typed source of
 * truth. Drop real captures in later: set `lat`/`lng` to where the photo was
 * taken and point `src` at the image (e.g. under /public/photos/…).
 *
 * A pin's 3D position comes from `latLngToVector3(lat, lng, EARTH.radius)`.
 */
export type PhotoLocation = {
  id: string;
  city: string;
  country: string;
  lat: number; // degrees, +N
  lng: number; // degrees, +E
  caption: string;
  src: string; // image path (placeholder until real photos are added)
};

/** Placeholder captures — replace coords + src with real ones in M3. */
export const PHOTO_LOCATIONS: PhotoLocation[] = [
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    lat: 51.5074,
    lng: -0.1278,
    caption: "Placeholder — London, UK",
    src: "/photos/placeholder.jpg",
  },
  {
    id: "paris",
    city: "Paris",
    country: "France",
    lat: 48.8566,
    lng: 2.3522,
    caption: "Placeholder — Paris, France",
    src: "/photos/placeholder.jpg",
  },
  {
    id: "marrakesh",
    city: "Marrakesh",
    country: "Morocco",
    lat: 31.6295,
    lng: -7.9811,
    caption: "Placeholder — Marrakesh, Morocco",
    src: "/photos/placeholder.jpg",
  },
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    caption: "Placeholder — Tokyo, Japan",
    src: "/photos/placeholder.jpg",
  },
  {
    id: "new-york",
    city: "New York",
    country: "United States",
    lat: 40.7128,
    lng: -74.006,
    caption: "Placeholder — New York, USA",
    src: "/photos/placeholder.jpg",
  },
];
