# Portfolio-27 — Home Page Structure (Visual Wireframes)

> Static visualization of the home page layout, section by section.
> Each block shows: the **layout** (what the eye sees), the **DOM tree**, and the **motion** (what animates).
> Pair with `PORTFOLIO-ARCHITECTURE.md` (the concept) and `CLAUDE.md` (the rules).

Legend: `☀` sun · `✦` light/glow · `▓` filled · `░` faint · `→` animates · `⟳` loops · `⤓` on scroll

---

## The whole page at a glance

The background is **one continuous gradient** scrolling from dawn to night.

```
        TIME OF DAY        SECTION                 BG MOOD
   ┌────────────────────────────────────────────────────────┐
   │  🌅  Dawn          │  1. HERO            │  dark → peach │  ← you are here on load
   │  🌄  Sunrise       │  2. ABOUT           │  warming      │
   │  ☀️  Midday        │  3. SKILLS          │  bright       │
   │  🌇  Golden hour   │  4. LAB             │  warm/playful │
   │  🌆  Dusk → Night  │  5. CONTACT/FOOTER  │  cooling blue │
   └────────────────────────────────────────────────────────┘
                         ▲ one scroll-progress value drives all of it
```

```
<main> (bg-rich-black, continuous day-gradient overlay)
 ├─ <Hero />          ← Dawn
 ├─ <About />         ← Sunrise
 ├─ <Skills />        ← Midday      (to build)
 ├─ <Lab />           ← Golden hour (to build)
 └─ <Contact />       ← Dusk/Night  (to build)
```

---

## 1 ░ HERO — "Dawn"  ✅ built

```
┌──────────────────────────────────────────────────────────┐
│  ░░░░░░░░░  dark panel (bg-dark, rounded, scales in) ░░░░ │
│                                                          │
│                      ╭─────────╮                         │
│                      │   ☀ logo │  → fade in (last)       │
│                      ╰─────────╯                         │
│                                                          │
│              ✦ Crafted Realities ✦                       │  ⟳ typewriter
│              (write → erase → next, loops)               │     loop
│                                                          │
│      I'm Aymane, a Product-focused Frontend Engineer…    │  → chars write in
│      ✦ Crafted with an artist's eye & engineer's mind    │  → chars write in
│                                                          │
│                    ┌──────────┐                          │
│                    │ Explore  │   → fade in (last)        │
│                    └──────────┘                          │
└──────────────────────────────────────────────────────────┘
   min-h-screen · overflow-hidden · content centered (m-auto)
```

**DOM**
```
section.home-hero (min-h-screen, overflow-hidden, relative)
 ├─ div.foreground-panel (absolute, bg-dark, rounded)        → scale/opacity in
 └─ section > div.content (flex-col, centered)
     ├─ SunriseLogo                                          → fade (delay 3.5s)
     ├─ div.titles (grid — 3 h1 stacked in 1 cell)           ⟳ typewriter loop
     │    ├─ h1 "Crafted Realities"
     │    ├─ h1 "Build to Scale"
     │    └─ h1 "Elegant Experiences"
     ├─ p.intro  (Aymane bio)                                → write in
     ├─ p.intro  (tagline)                                   → write in
     └─ div > Button "Explore"                               → fade (delay 3.5s)
```

**Motion order:** panel scales in → titles loop forever → intros write in → logo + button fade in last.

---

## 2 ░ ABOUT — "Sunrise"  ✅ built

```
┌──────────────────────────────────────────────────────────┐
│            ✦ ✦ ✦ glow bleeds UP over Hero ✦ ✦ ✦          │  ⤓ scale grows
│                  ✦  ✦  ✦  ✦  ✦  ✦                        │     with scroll
│                                                          │
│                 ╭───────────────╮                        │
│                 │   ☀ half-sun   │   ⤓ scale 0 → 1        │
│                 ╰───────────────╯      on scroll          │
│                ───────────────────  (peach divider)      │
│                                                          │
│              Beyond  The  Code                            │  → write + fade in
│                                                          │
└──────────────────────────────────────────────────────────┘
   min-h-screen · overflow-x-clip (lets glow bleed up, blocks h-scroll)
```

**DOM**
```
section.home-about (min-h-screen, overflow-x-clip, z-20)
 └─ div.content (flex-col, centered)
     ├─ div (relative)
     │    ├─ HalfSunShape  (the sun)        ⤓ scale 0→1   on scroll
     │    └─ HalfSunShape  (the shine/glow) ⤓ scale 0→big on scroll
     ├─ div.divider (peach bar)
     └─ h2 "Beyond The Code"                → write in + fade
```

**Key trick:** `overflow-x-clip` (not `hidden`) lets the shine grow **upward over the Hero** while still blocking horizontal scroll. `z-20` lifts About above Hero so the glow paints on top.

---

## 3 ░ SKILLS — "Midday"  ⬜ to build

Brightest section. Skills as **celestial bodies** orbiting, or a **lit-up grid** that illuminates on scroll.

```
┌──────────────────────────────────────────────────────────┐
│                    ☀  (full midday sun)                   │
│                                                          │
│        ◦ React        ◦ Next.js        ◦ TypeScript       │  ⤓ light up
│              ◦ GSAP         ◦ Three.js                    │     one by one
│        ◦ Tailwind     ◦ R3F          ◦ Zustand            │     on scroll
│                                                          │
│         "An artist's eye + an engineer's mindset"         │
└──────────────────────────────────────────────────────────┘
```

**DOM (proposed)**
```
section.home-skills (min-h-screen)
 ├─ div.sun (midday, full brightness)
 ├─ ul.skills-grid  (or orbit container)
 │    └─ li.skill × N                       ⤓ reveal/illuminate on scroll
 └─ p.statement
```

---

## 4 ░ LAB — "Golden Hour"  ⬜ to build

Playground. Each card is a live, interactive mini-canvas (native home for R3F).

```
┌──────────────────────────────────────────────────────────┐
│   THE LAB ✦  experiments in motion & code                │
│                                                          │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│   │ ▓ canvas │   │ ▓ canvas │   │ ▓ canvas │  → reveal    │
│   │  hover→  │   │  hover→  │   │  hover→  │     on scroll│
│   │  live!   │   │  live!   │   │  live!   │              │
│   └──────────┘   └──────────┘   └──────────┘             │
└──────────────────────────────────────────────────────────┘
```

**DOM (proposed)**
```
section.home-lab (min-h-screen)
 ├─ header (eyebrow + title)
 └─ ul.lab-grid
      └─ li.experiment-card × N             ⤓ reveal; ▶ interactive on hover
           └─ <Canvas> (lazy, ssr:false)
```

---

## 5 ░ CONTACT / FOOTER — "Dusk → Night"  ⬜ to build

Sun sets, sky cools to indigo, stars emerge. The CTA glows like last light.

```
┌──────────────────────────────────────────────────────────┐
│   ·  ✦   ·    ·   ✦    ·   ·   ✦   ·  (stars fade in)     │  ⤓ particles
│                  ☾  (sun has set)                         │     emerge
│                                                          │
│              Let's build something.                      │
│             ┌───────────────────────┐                    │
│             │  ✦ Get in touch  ✦    │  → glowing CTA      │
│             └───────────────────────┘                    │
│                                                          │
│   GitHub · LinkedIn · Email          © 2026 Aymane       │
└──────────────────────────────────────────────────────────┘
```

**DOM (proposed)**
```
footer.home-contact (night theme)
 ├─ div.starfield  (<Canvas> particles, lazy)   ⤓ emerge on scroll
 ├─ h2 "Let's build something"
 ├─ a.cta "Get in touch"                         → glow/pulse
 └─ nav.socials + small print
```

---

## How the sections connect (the "thread")

```
   scroll position
        │
        ▼
 ┌─────────────────┐     reads      ┌──────────────────────┐
 │ DayCycleProvider│ ─────────────► │ background gradient   │
 │  (0 → 1 value)  │ ─────────────► │ sun position / mood   │
 │  to build ⬜    │ ─────────────► │ section reveal timing │
 └─────────────────┘ ─────────────► │ (future) shader time  │
        ▲                            └──────────────────────┘
        │ one ScrollTrigger updates it
        └────────────────────────────────
```

**One driver, many readers.** Every section's mood comes from the same scroll value — that's what makes it feel like one continuous "day" instead of five separate pages stacked together.

---

*Wireframes are conceptual, not pixel-spec. Build order & system details live in `PORTFOLIO-ARCHITECTURE.md` §6.*
