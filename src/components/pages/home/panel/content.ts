import { Camera, FlaskConical, MemoryStick, Video } from "lucide-react";
import { PHOTO_LOCATIONS, type MediaItem, type PhotoLocation } from "#/components/three.js/earth/data";
import { EXPERIMENTS, LAB_PANEL } from "#/components/three.js/voyager/data";
import type { PanelHeaderModel, PanelTag } from "./panel.types";

/** A quote longer than this (characters) is set smaller. */
export const QUOTE_LONG_AT = 120;

export const isLongQuote = (text: string) => text.length > QUOTE_LONG_AT;

/** "51.51° N, 0.13° W". */
export function formatCoords(lat: number, lng: number): string {
  const part = (deg: number, pos: string, neg: string) =>
    `${Math.abs(deg).toFixed(2)}° ${deg >= 0 ? pos : neg}`;
  return `${part(lat, "N", "S")}, ${part(lng, "E", "W")}`;
}

/** "1 clip", "4 photos". */
export const countLabel = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

export function mediaCounts(media: readonly MediaItem[]) {
  const clips = media.filter((m) => m.type === "video").length;
  return { photos: media.length - clips, clips };
}

/** A place's media as tags: "4 photos", "1 clip" (zero counts left out). */
function mediaTags(media: readonly MediaItem[]): PanelTag[] {
  const { photos, clips } = mediaCounts(media);
  const tags: PanelTag[] = [];
  if (photos) tags.push({ icon: Camera, label: countLabel(photos, "photo") });
  if (clips) tags.push({ icon: Video, label: countLabel(clips, "clip") });
  return tags;
}

export function placeHeader(loc: PhotoLocation): PanelHeaderModel {
  return {
    eyebrow: { place: loc.country, detail: formatCoords(loc.lat, loc.lng) },
    title: loc.title,
    blurb: loc.blurb ?? "",
    tags: mediaTags(loc.media),
  };
}

export function labHeader(): PanelHeaderModel {
  return {
    eyebrow: LAB_PANEL.eyebrow,
    title: LAB_PANEL.title,
    blurb: LAB_PANEL.blurb,
    tags: [
      { icon: FlaskConical, label: countLabel(EXPERIMENTS.length, "experiment") },
      { icon: MemoryStick, label: LAB_PANEL.cardTag },
    ],
  };
}

/** A place's label says what it opens: "5 shots". */
export const placeLabelMeta = (loc: PhotoLocation) => countLabel(loc.media.length, "shot");

/** …and names it in full: "Open London: 4 photos and 1 clip". */
export const placeLabelAria = (loc: PhotoLocation) =>
  `Open ${loc.place}: ${mediaTags(loc.media)
    .map((tag) => tag.label)
    .join(" and ")}`;

/** A place's name on its pill. */
export const shortName = (loc: PhotoLocation) => loc.short ?? loc.place;

/** `i` wrapped into 0…n−1 (from either end). */
export const wrapIndex = (i: number, n: number) => ((i % n) + n) % n;

export const findPlace = (id: string | null) => PHOTO_LOCATIONS.find((l) => l.id === id) ?? null;

/** The place `step` places after `id` (before, when negative), wrapping round. */
export function adjacentPlace(id: string, step: number): PhotoLocation {
  const i = PHOTO_LOCATIONS.findIndex((l) => l.id === id);
  return PHOTO_LOCATIONS[wrapIndex(i + step, PHOTO_LOCATIONS.length)];
}
