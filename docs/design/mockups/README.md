# Home Page Mockups

Static, browser-openable visual mockups of the Portfolio-27 home page, in the real brand palette.
Open the `.html` files directly in a browser (no build step, no dependencies beyond Google Fonts).

| File | Concept | Feeling | Palette lean |
|---|---|---|---|
| [`01-sunrise-journey.html`](01-sunrise-journey.html) | **Sunrise Journey** | Warm, narrative, dawn→night scroll | Peach / dark-peach |
| [`02-living-canvas.html`](02-living-canvas.html) | **Living Canvas** | Cosmic, generative, reactive | Peach + baby-blue on space-black |
| [`03-living-canvas-personal.html`](03-living-canvas-personal.html) | **Living Canvas + voice** | Cosmic with personal copy + NASA-style nebula star | Peach + baby-blue |
| [`04-living-canvas-3d-worlds.html`](04-living-canvas-3d-worlds.html) | **Living Canvas + 3D worlds** ⭐ current | Each section a space object: planet, camera constellation, photo-worlds, galaxy | Peach + baby-blue |

| [`05-content-draft.html`](05-content-draft.html) | **Content draft** ⭐ copy | Full final-quality copy for every section, in Aymane's voice | Peach + baby-blue |

| [`06-motion-storyboard.html`](06-motion-storyboard.html) | **Motion storyboard** ⭐ animation | How every section enters, where 3D lives, how text/scroll behave, start→end arc | Peach + baby-blue |

⭐ **`04`** is the current visual direction; **`05`** is the written content; **`06`** is how it all moves.

## The two directions

**01 — Sunrise Journey** (current lead concept)
Scrolling = a day passing. Each section is a time of day (dawn, sunrise, midday, golden hour, night),
and the background warms then cools across the whole page. Builds directly on the sun motif and
peach palette already in the codebase. Mostly GSAP + CSS — approachable to build.

**02 — Living Canvas** (alternative / more immersive)
The page is a generative cosmos. The sun becomes a glowing star you can disturb with the cursor,
skills form a constellation that draws itself, and the Lab is a field of shader/particle portals.
Heavier on Three.js / R3F — higher effort, bigger technical "wow", leans on the blue tokens for a
cooler, deep-space mood.

## How to choose

These aren't mutually exclusive — the recommended path is **Sunrise Journey as the narrative spine**
with **Living Canvas techniques applied to 2–3 key moments** (Hero star, Lab portals, Contact stars).
See [`../../PORTFOLIO-ARCHITECTURE.md`](../../PORTFOLIO-ARCHITECTURE.md) for the phased build plan and
[`../../HOME-PAGE-STRUCTURE.md`](../../HOME-PAGE-STRUCTURE.md) for the section-by-section wireframes.

> These are conceptual mockups, not pixel specs — spacing, type scale, and motion are illustrative.
