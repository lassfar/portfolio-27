import { describe, expect, it } from "vitest";
import { Camera, Video } from "lucide-react";
import { PHOTO_LOCATIONS, type PhotoLocation } from "#/components/three.js/earth/data";
import {
  adjacentPlace,
  countLabel,
  formatCoords,
  isLongQuote,
  labHeader,
  placeHeader,
  placeLabelAria,
  placeLabelMeta,
  QUOTE_LONG_AT,
  shortName,
  wrapIndex,
} from "./content";

const place = (media: PhotoLocation["media"]): PhotoLocation => ({
  id: "x",
  place: "Somewhere",
  title: "*Somewhere*",
  country: "Nowhere",
  lat: 0,
  lng: 0,
  media,
});
const photo = { type: "image", src: "/a.jpg" } as const;
const clip = { type: "video", src: "/a.mp4" } as const;

describe("the panels' words", () => {
  it("write coordinates in all four directions, to two decimals", () => {
    expect(formatCoords(51.5074, -0.1278)).toBe("51.51° N, 0.13° W");
    expect(formatCoords(-33.8688, 151.2093)).toBe("33.87° S, 151.21° E");
    expect(formatCoords(0, 0)).toBe("0.00° N, 0.00° E");
  });

  it("count in the singular and the plural", () => {
    expect(countLabel(1, "clip")).toBe("1 clip");
    expect(countLabel(4, "photo")).toBe("4 photos");
  });

  it("tag a place's photos and clips, leaving out what it has none of", () => {
    expect(placeHeader(place([photo, photo, clip])).tags).toEqual([
      { icon: Camera, label: "2 photos" },
      { icon: Video, label: "1 clip" },
    ]);
    expect(placeHeader(place([photo])).tags).toEqual([{ icon: Camera, label: "1 photo" }]);
  });

  it("head a place with its country and coordinates, and the Lab with Parker", () => {
    const london = PHOTO_LOCATIONS.find((l) => l.id === "london")!;
    expect(placeHeader(london).eyebrow).toEqual({
      place: "United Kingdom",
      detail: "51.51° N, 0.13° W",
    });
    expect(placeHeader(london).title).toBe("Back to *London*");
    expect(labHeader().eyebrow.place).toBe("Parker Solar Probe");
    expect(labHeader().tags.map((t) => t.label)).toEqual([
      "3 experiments",
      "On Parker’s memory card",
    ]);
  });

  it("say on a place's label what it opens", () => {
    const london = PHOTO_LOCATIONS.find((l) => l.id === "london")!;
    expect(placeLabelMeta(london)).toBe("5 shots");
    expect(placeLabelAria(london)).toBe("Open London: 4 photos and 1 clip");
    expect(placeLabelAria(place([photo]))).toBe("Open Somewhere: 1 photo");
  });

  it("give every place a title with a peach word, and long names a short one", () => {
    for (const loc of PHOTO_LOCATIONS) expect(loc.title).toMatch(/\*[^*]+\*/);
    expect(shortName(PHOTO_LOCATIONS.find((l) => l.id === "brockenhurst")!)).toBe("New Forest");
    expect(shortName(PHOTO_LOCATIONS.find((l) => l.id === "london")!)).toBe("London");
  });

  it("set long quotes smaller", () => {
    expect(isLongQuote("x".repeat(QUOTE_LONG_AT))).toBe(false);
    expect(isLongQuote("x".repeat(QUOTE_LONG_AT + 1))).toBe(true);
    expect(isLongQuote(labHeader().blurb)).toBe(true);
  });

  it("step through the places and the photos, wrapping round", () => {
    const ids = PHOTO_LOCATIONS.map((l) => l.id);
    expect(adjacentPlace(ids[0], 1).id).toBe(ids[1]);
    expect(adjacentPlace(ids[0], -1).id).toBe(ids[ids.length - 1]);
    expect(adjacentPlace(ids[ids.length - 1], 1).id).toBe(ids[0]);
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(5, 5)).toBe(0);
    expect(wrapIndex(-6, 5)).toBe(4);
  });
});
