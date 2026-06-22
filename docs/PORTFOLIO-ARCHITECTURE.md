# Portfolio-27 — Design & Motion Architecture

> Reference for the creative direction, motion system, and phased build roadmap.
> Concept: **Sunrise Journey** (narrative spine) executed with **Living Canvas / generative R3F** (technique for key moments).
> Goal: an internationally hireable portfolio that proves senior frontend craft + creative range.

---

## 1. The Concept

**Metaphor:** Scrolling the site is a journey through a day — **Dawn → Midday → Dusk → Night**.
The sun (already your logo + About shape) is the recurring character. Light is the design language: where the user is in the "day" controls color temperature, contrast, and the mood of each section.

Why this works for you:
- Reuses what you've built (sun shapes, peach palette, the About scroll-scrub).
- Gives every section a *reason* to look the way it does — cohesion reads as "senior taste."
- One committed metaphor is rare in dev portfolios → memorable.

**The two layers:**

| Layer | Role | Tech |
|---|---|---|
| **Sunrise Journey** | Narrative, color, mood, scroll story | GSAP + ScrollTrigger + ScrollSmoother + CSS gradients |
| **Living Canvas** | 2–3 "wow" moments that react to scroll/cursor | Three.js + React Three Fiber + shaders |

---

## 2. Scroll Narrative — Section by Section

| # | Section | Time of day | Mood / Light | Signature moment |
|---|---|---|---|---|
| 1 | **Hero** | Dawn | Dark sky, sun cresting horizon, peach light breaking | Sun rises as titles animate; (Phase 2) generative sky/sun shader |
| 2 | **About** | Sunrise → morning | Warming, sun fully visible, glow bleeding upward | Sun scales on scroll (✅ done); light bleeds over Hero (✅ done) |
| 3 | **Skills & Stack** | Midday | Brightest, highest contrast, confident | Skills as "celestial bodies" / orbit, or light-up grid on scroll |
| 4 | **Lab / Experiments** | Afternoon → golden hour | Playful, experimental, warm | Each experiment is an interactive canvas (native R3F home) |
| 5 | **Contact / Footer** | Dusk → night | Cooling to blue/indigo, stars, calm | Sun sets; CTA glows like the last light; (Phase 2) star particles |

**The background is a single continuous gradient** that shifts across the whole scroll — this is the thread that ties every section into one "day." One source of truth (a scroll-progress value) drives it.

---

## 3. Visual System

### Color roles (map your existing tokens to the metaphor)

| Token | Value | Journey role |
|---|---|---|
| `--color-rich-black` | `#19191C` | Night sky / base canvas |
| `--color-dark` | `#27272A` | Panels, depth, pre-dawn |
| `--color-peach` | `#FFB266` | **The sun / primary light source** |
| `--color-dark-peach` | `#FF8000` | Intense light, golden hour, hover |
| `--color-light-peach` | `#FFE3C7` | Soft diffused light, haze |
| `--color-baby-blue` | `#2489FF` | Daytime sky / cool accent |
| `--color-light-baby-blue` | `#C5E0FF` | Dusk transition, distance |

> **Add for the journey:** an indigo/deep-blue for night (`--color-night: #11131f` or similar) so Contact can cool down. Keep all new tokens in `globals.css @theme`.

### Typography
- `--font-great-vibes` — display/emotional headers (the "art" voice). Already used in Hero/About.
- `--font-krone-one` — geometric labels, section eyebrows, nav (the "engineer" voice).
- `--font-sans` — body copy.
- **Rule:** Great Vibes for feeling, Krona One for structure. The contrast *is* "code meets art."

### Light as a system
- Glows = `radial-gradient` + `blur` + peach, never hard shapes.
- Elevation = how lit something is, not drop shadows.
- Accent interactions emit light (hover → `dark-peach` bloom).

---

## 4. Motion System

### Principles
1. **Motion has meaning** — every animation reinforces the day-journey or guides attention. No motion for decoration alone.
2. **One scroll source of truth** — ScrollSmoother drives ScrollTrigger; everything scrubs off the same progress.
3. **Reveal, don't startle** — entrances are soft (`power1/2.out`), exits quick.
4. **Respect `prefers-reduced-motion`** — already handled in `SmoothScrollProvider`; every signature animation needs a reduced fallback.
5. **60fps or cut it** — transform/opacity only; no animating layout properties.

### Reusable hook library (your `components/hooks/motions/`)

| Hook | Status | Purpose |
|---|---|---|
| `texts/useTextWritingMotion` | ✅ | Single element char write-in |
| `texts/useTextsWritingMotion` | ✅ | Sequence of elements writing in |
| `texts/useTextsTypewriterSequenceMotion` | ✅ | Write → erase → write loop (Hero titles) |
| `texts/useTextsSlideMotion` | ✅ | Cycle stacked texts with slide |
| `scroll/useScrollProgress` | ⬜ TODO | Expose global 0→1 day progress (drives bg gradient) |
| `scroll/useScrollReveal` | ⬜ TODO | Generic "fade/translate in on enter" (replaces ad-hoc fromTo) |
| `scroll/useParallax` | ⬜ TODO | Wrapper around ScrollSmoother data-speed for arbitrary els |
| `backgrounds/useDayGradient` | ⬜ TODO | Tween bg gradient stops across scroll |

> **Tech-debt to fold in (existing Notion tasks):** merge `useTextWritingMotion` + `useTextsWritingMotion` (P27-33); fix `position` tween arg (P27-35).

---

## 5. Technical Architecture

### Folder structure (extends current)

```
src/
├── app/
│   ├── layout.tsx              # SmoothScrollProvider wraps everything
│   └── page.tsx               # composes home sections
├── components/
│   ├── UI/                     # design-system primitives (Button, etc.)
│   ├── providers/
│   │   ├── SmoothScrollProvider.tsx   # ✅ ScrollSmoother
│   │   └── DayCycleProvider.tsx       # ⬜ global scroll-progress context
│   ├── hooks/motions/          # reusable GSAP hooks (see §4)
│   ├── three/                  # R3F scenes (rename from three.js/)
│   │   ├── Canvas/             # shared <Canvas> setup, perf guards
│   │   ├── sun/                # generative sun/sky shader
│   │   └── particles/          # stars, dust
│   ├── pages/home/
│   │   ├── Hero.tsx
│   │   ├── about/
│   │   ├── skills/
│   │   ├── lab/
│   │   └── contact/
│   └── assets/pictures/        # SVG shapes & logos
└── styles/globals.css          # @theme tokens (single source)
```

### State / data flow
- **Global scroll progress** → `DayCycleProvider` (Zustand or a Jotai atom) holds a `0→1` value updated by one ScrollTrigger. Background gradient, sun position, and section moods all read from it. *One driver, many readers.*
- **Per-section animation** → local `useGSAP` in each section component, scoped with refs.
- **3D scenes** → isolated under `components/three/`, mounted only where needed, lazy-loaded.

### R3F integration rules (important for perf)
- One `<Canvas>` per scene, **lazy-loaded** with `next/dynamic` + `ssr: false`.
- Pause rendering when off-screen (`frameloop="demand"` or visibility check).
- Keep DOM and WebGL concerns separate — GSAP animates DOM, R3F animates the scene; sync via the shared scroll-progress value.
- Always provide a static/CSS fallback for reduced-motion and low-power devices.

---

## 6. Phased Build Roadmap

> Philosophy: **always shippable.** Each phase leaves a complete, deployable site. You upgrade fidelity, you never have a broken half-state.

### Phase 1 — Foundation in GSAP/CSS (learn timelines & scroll)
Ship the *whole journey* with zero Three.js. Proves the concept, gives you a real site to show.

- [ ] `DayCycleProvider` + `useScrollProgress` — global 0→1 day value
- [ ] `useDayGradient` — animated background gradient across scroll (dawn→night)
- [ ] `useScrollReveal` — standardize section entrances (replace ad-hoc `fromTo`)
- [ ] Build **Skills** section (celestial/orbit layout, reveal on scroll)
- [ ] Build **Contact/Footer** (dusk theme, glowing CTA, social links)
- [ ] Scaffold **Lab** index (grid of experiment cards)
- [ ] Multi-page routing + page transitions (Sprint 2 tasks P27-26/27/28)

### Phase 2 — Living Canvas moments (learn R3F + shaders)
Upgrade the 2 highest-impact moments to real 3D. This is the "tough portfolio" differentiator.

- [ ] Shared `<Canvas>` setup + perf guards under `components/three/Canvas/`
- [ ] **Hero generative sun/sky** — gradient/noise shader sun that reacts to cursor + scroll
- [ ] **Contact star field** — particle system that emerges at "night"
- [ ] First real **Lab experiment** (e.g. a shader playground or interactive geometry)
- [ ] Lazy-load + reduced-motion fallbacks for every scene

### Phase 3 — Polish & ship (the senior bar)
- [ ] Performance pass — Lighthouse 90+, lazy assets, font-display, no CLS
- [ ] Accessibility — keyboard nav, focus states, reduced-motion parity, alt text
- [ ] SEO/OG — metadata per page, social cards, sitemap
- [ ] Cross-device QA — the mobile audit (P27-32) extended site-wide
- [ ] Deploy (Vercel), custom domain, analytics

---

## 7. Learning Path (you're new to R3F/shaders)

Tackle in this order — each builds on the last:

1. **GSAP timelines & ScrollTrigger** — you're already here. Master the position parameter and scrub. (Phase 1)
2. **React Three Fiber basics** — mesh, material, camera, `useFrame`. Build a spinning cube, then a sphere = your sun.
3. **Drei helpers** — `@react-three/drei` (already installed) for controls, loaders, shaders shortcuts.
4. **Shaders (GLSL)** — start with a gradient fragment shader for the sky, then add noise for clouds/sun surface. This is the deep end — worth it for international roles.
5. **Syncing R3F with scroll** — feed the shared `scroll-progress` value into shader uniforms.

Reference material: GSAP docs (ScrollTrigger, ScrollSmoother), R3F docs, "The Book of Shaders," Bruno Simon's Three.js Journey.

---

## 8. Quality Bar — "Internationally Hireable"

Recruiters/leads abroad look for these signals. Treat as a checklist:

- [ ] **Concept clarity** — a visitor can describe the idea in one sentence.
- [ ] **Craft** — pixel-tight spacing, type rhythm, intentional color.
- [ ] **Performance** — fast on mid-range mobile, no jank, Lighthouse 90+.
- [ ] **Accessibility** — works with keyboard, screen reader, reduced motion.
- [ ] **Code quality** — the repo itself is a portfolio piece (it's public). Clean hooks, typed, documented.
- [ ] **One technical showpiece** — the R3F sun/shader proves depth, not just CSS.
- [ ] **Story** — the About section makes them remember *you*, not just the visuals.

---

## 9. Open Decisions (revisit as you go)

- Night token value for the dusk/Contact cool-down.
- Skills layout: orbit/constellation vs. lit-grid — prototype both.
- Lab: how many experiments at launch? (Recommend 1 strong > 3 weak.)
- Page transitions: route-based (View Transitions API) vs. GSAP-driven.

---

*Living document — update as the design evolves. Pair with `CLAUDE.md` (engineering rules) and the Notion Backlog (task tracking).*
