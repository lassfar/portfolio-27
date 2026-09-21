# M4 — The Lab · Voyager 1

> Status: **M4a shipped** · Notion: P27-60 · Sketch: [`10-lab-voyager.html`](10-lab-voyager.html)

The maker's work, sent into the dark. After Earth, a fast dust corridor rushes you
out to **Voyager 1**; its **Golden Record** opens the experiment gallery. Voyager
then carries the "message" onward → Contact (future).

## As built (M4a)

- **Voyager is a SOLID, lit craft** built from primitive geometry (parabolic dish +
  rim + feed, ten-sided bus, magnetometer / science / RTG booms, a scan-platform +
  camera lens, and a glowing **Golden Record**) — every part rooted on the bus, lit
  by the scene's first real lights. *(Reversed the original "dotted point-cloud" idea.)*
- **The trip is a real flythrough:** a world-space dust corridor built along the
  actual Earth→Voyager path, with **speed-reactive streaks** (length + brightness
  from the camera's true per-frame velocity). One **decelerating fly** lands directly
  on the readable Voyager (no tiny-speck-then-zoom); a **Pale Blue Dot** (Earth)
  lingers behind — see `voyager/TravelDust.tsx`, `PaleBlueDot.tsx`, `config.ts`.
- **Part of the space:** the craft **mirrors `useSceneRotation`** (like the Saturn),
  so dragging turns the cosmos and Voyager as one.
- **Golden Record → experiments** overlay: `pinScreen`/`PinLabels` → `RecordLabel`,
  `EarthGallery` portal → `LabExperiments` + `ExperimentsPanel` + `useLabStore`.
  M4a tiles are placeholders.
- **Scroll:** the master pin (`JOURNEY.pinLength`) grew; `useVoyageScroll` clamps at
  1 at the old end (Earth holds) and a new **`useLabScroll`** drives the Lab beat.

**Remaining:** M4b — wire the parked `experiment/worlds-solar-system` (P27-47) as the
first real lazy-loaded tile. M4c — reduced-motion, mobile, a11y, Contact handoff. A
future beat flies OUT from Voyager → galaxy (append after `voyageEnd`, mirror the
Lab-scroll pattern).

---

_Original plan below (kept for reference; superseded by "As built" where they differ)._

---

## 1. Scroll re-timing (the one non-trivial part)

Today the master pin drives `useVoyageScroll` 0→1 as Saturn→Earth, with Earth full
at `voyage = 1`. Adding the Lab means **lengthening the pin (~+40% scroll distance)**
and re-scoping the phase fractions, plus adding an **Earth plateau** so the pins /
gallery stay usable before the pull-back.

| Voyage | Beat | Camera / state |
|---|---|---|
| `0.00–0.22` | Saturn → wide | existing `FLYOUT` |
| `0.22–0.38` | wide → Earth dive | dive to `useEarthAnchor` |
| `0.38–0.55` | **Earth plateau** | camera holds; pins + labels + gallery interactive |
| `0.55–0.68` | pull back from Earth | Earth recedes / shrinks |
| `0.68–0.88` | fly to Voyager | approach `useVoyagerAnchor`; craft assembles in |
| `0.88–1.00` | Voyager dwell | Golden Record interactive → hand-off stub to Contact |

**Key refactor:** Earth's "full view" gates currently read global voyage
(`EARTH.pinLabelsAt`, `approach = remap01(voyage, flyoutEnd, 1)` in `EarthPins.tsx`).
These move to an **Earth-window remap** (`remap01(voyage, earthInStart, earthPlateauEnd)`)
so labels/pins key off the plateau, not the end of the whole journey. All fractions
land in config as tunables.

> **Lower-risk fallback** if the re-time gets fiddly: keep Earth ending at `voyage=1`
> and drive the Lab from a **second pinned section** + `useLabScroll`, with `CameraRig`
> reading both stores. Try the re-scope (truer to "one journey") first.

---

## 2. New files & config

```
src/components/three.js/voyager/
  Voyager.tsx        # dotted point-cloud craft (dish, bus, booms, Golden Record)
  GoldenRecord.tsx   # the glowing gold disc + hit target (opens tiles)
  config.ts          # VOYAGER (geometry, dots, spin) + LAB_CAM (offset, ease)
  data.ts            # EXPERIMENTS[] (id, title, blurb, thumb, loader) — like PHOTO_LOCATIONS
src/stores/useVoyagerAnchor.ts   # mirror of useEarthAnchor (live world pos)
src/stores/useLabStore.ts        # open/close experiment overlay (mirror useGalleryStore)
src/components/pages/home/lab/
  LabExperiments.tsx  # overlay/portal host (mirror EarthGallery)
  ExperimentTile.tsx  # lazy-loaded canvas wrapper (dynamic import per experiment)
```

Config additions: `VOYAGE.labApproachStart/End`, `earthPlateauStart/End`,
`earthPullbackStart/End`; `EARTH` gates re-based to the Earth window.

---

## 3. The dotted Voyager (M4a)

- Silhouette in peach / light-peach points, same shader family as the dotted Earth:
  **high-gain dish** (hero shape), **decagonal bus**, **magnetometer + science booms**
  (thin point-lines), **Golden Record** disc on the bus.
- Slow idle tumble + **drag-to-rotate** (reuse the Earth/Saturn spin logic).
- Assembles in from drifting particles on approach (reversible on scroll-up), like
  Saturn / Earth.
- Publishes world position to `useVoyagerAnchor`; `CameraRig` flies to it via the
  existing enter-mode lerp.

## 4. The Golden Record → tiles (M4b)

- Record glows + shows a label — **reuse `pinScreen` + the `PinLabels` overlay** (P27-59).
- Click → `useLabStore.open()` → `LabExperiments` overlay (**reuse the `EarthGallery`
  portal pattern**).
- **First tile = parked `experiment/worlds-solar-system` (P27-47)**, brought in and
  **lazy-loaded** (dynamic import; canvas mounts only when opened). Remaining tiles
  render as dim "coming soon".

## 5. Hand-off to Contact (stub in M4a, full when Contact is built)

Voyager drifts onward, background deepens, first galaxy stars bleed in. The Record's
"message into the dark" is the literal seed of the Contact galaxy ("send it into orbit").

---

## 6. Reuse map

| Need | Reuse |
|---|---|
| Fly-to-Voyager camera | `CameraRig` enter-mode + `useVoyagerAnchor` |
| Dotted craft | dotted-Earth point-cloud + shader |
| Drag / idle spin | Earth / Saturn spin logic |
| Record label | `pinScreen` + `PinLabels` |
| Experiment overlay | `EarthGallery` portal + `useGalleryStore` → `useLabStore` |
| First tile | parked worlds scene (P27-47) |
| Scroll phase | `JOURNEY` / `VOYAGE` config + master pin |

---

## 7. Milestones & acceptance

- **M4a — the beat exists:** pin extended + fractions re-scoped (Earth plateau intact,
  pins still clickable); pull-back from Earth; dotted Voyager assembles + idle tumble +
  drag; title "Half-finished thoughts" writes in, copy fades up; Contact hand-off stub.
  *Accept: scroll star→Earth→Voyager reads as one continuous journey, reversible; Earth
  pins/labels still work on the plateau; tsc/eslint/tests clean.*
- **M4b — the Record:** Golden Record glows + label + click → overlay hosting the parked
  worlds scene, lazy-loaded; dim "coming soon" tiles. *Accept: click opens/closes cleanly,
  worlds canvas mounts only on open, no jank on the globe.*
- **M4c — polish:** reduced-motion (assembly + tumble), mobile layout + particle counts,
  a11y (record focusable, overlay focus-trap — reuse gallery's).

---

## 8. Copy

Brief's Lab line still works verbatim, reframed by Voyager:

> **Half-finished thoughts**
> "This is where I tinker — small experiments in motion, shaders, and code. More will
> drift into orbit soon."

---

## 9. Risks / open items

- **Scroll re-timing** is the main risk — re-basing Earth's gates + total pin length
  needs a careful in-browser scrub pass.
- **Dot budget:** Voyager + Earth + system on screen during the pull-back — watch
  particle totals on mobile.
- **Voyager readability:** the dotted silhouette must still read as *Voyager* (dish +
  booms) at the arrival framing — validate in the HTML sketch before building.
