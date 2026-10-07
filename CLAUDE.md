# Portfolio-27 — CLAUDE.md

Project context for Claude Code. Read this before touching any file.

## Project

Personal portfolio for **Aymane Lassfar**, Senior Frontend Developer.
Goal: prove production-grade code quality and creative frontend skill to recruiters.

## Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 16 (App Router)                           |
| Language        | TypeScript (strict)                               |
| Styling         | Tailwind CSS v4 (CSS-based config)                |
| Animation       | GSAP 3 + SplitText + ScrollTrigger                |
| 3D              | Three.js + React Three Fiber (@react-three/fiber) |
| State           | Zustand                                           |
| Component Dev   | Storybook v10                                     |
| Testing         | Vitest + Playwright (browser-mode)                |
| Package Manager | npm                                               |

## Folder Structure

```
src/
├── app/                        # Next.js App Router (layout, page, fonts, icons)
├── components/
│   ├── UI/                     # Design system: buttons, cards, forms, glass, icons, labels, links, swash, tags, text, tooltip
│   ├── assets/pictures/        # SVG components (logos, shapes)
│   ├── hooks/                  # Shared hooks (useIsClient, useTimeout, …)
│   │   ├── a11y/               # Accessibility helpers (inert outside a dialog)
│   │   └── motions/            # Reusable GSAP animation hooks: backgrounds/, blocks/, shapes/, texts/
│   ├── pages/home/             # The home page
│   │   ├── Hero.tsx            # The pinned journey: hero, About, Craft and Contact overlays
│   │   ├── hooks/              # useCosmicJourney: one scroll drives the whole story
│   │   ├── story/              # The story's words, shared by the journey and the calm book
│   │   ├── scroll/             # Glides, the chapter map, goTo()
│   │   ├── timeline/           # The story timeline and the chapter title
│   │   ├── subtitles/          # The voice lines
│   │   ├── phase-nav/          # The navigation assistant (the orb)
│   │   ├── panel/              # The side panel (a place, the Lab)
│   │   ├── gallery/            # Photos: chips, stepper, Lightbox
│   │   ├── labels/             # Labels anchored to the 3D scene
│   │   ├── lab/                # The Lab: the memory card, experiments
│   │   ├── skills/             # The Craft: the constellation
│   │   └── contact/            # The contact form
│   ├── providers/              # SmoothScrollProvider (ScrollSmoother)
│   └── three.js/               # React Three Fiber
│       ├── scene/              # The canvas, quality, performance, dev panel
│       ├── star/               # The star, and the scroll map (config.ts: JOURNEY)
│       ├── planet/             # Saturn
│       ├── solar/              # The solar system and the Sun
│       ├── earth/              # The dotted Earth, and the places (data.ts)
│       ├── parker/             # The Parker Solar Probe
│       ├── voyager/            # The Lab's config and copy (data.ts)
│       └── galaxy/             # The Milky Way
├── stores/                     # Zustand stores and small shared state, one per file (incl. useMotion)
├── stories/                    # Storybook helpers (Introduction, galleries); stories sit next to their component
└── styles/
    └── globals.css             # Global styles, Tailwind v4 @theme tokens and custom variants
```

## Path Aliases

```ts
"#/*" → "src/*"
```

Use `#/components/...`, `#/styles/...`, etc. Never use relative `../` imports.

## Design Tokens

All tokens are defined in `src/styles/globals.css` under `@theme`. Do not add colors to `tailwind.config.ts`.

### Colors

| Token                     | Value     | Usage                                   |
| ------------------------- | --------- | --------------------------------------- |
| `--color-rich-black`      | `#19191C` | Page background                         |
| `--color-dark`            | `#27272A` | Card / panel backgrounds                |
| `--color-peach`           | `#FFA14A` | Primary accent, CTAs, body text accents |
| `--color-dark-peach`      | `#EF7D14` | Hover state, high-contrast accents      |
| `--color-light-peach`     | `#FFE3C7` | Subtle peach tints                      |
| `--color-baby-blue`       | `#2489FF` | Secondary accent                        |
| `--color-light-baby-blue` | `#C5E0FF` | Subtle blue tints                       |
| `--color-gray-slate`      | `#D9D9D9` | Borders, dividers                       |

### Typography

| Token                | Font                                       |
| -------------------- | ------------------------------------------ |
| `--font-great-vibes` | Great Vibes (self-hosted, cursive display) |
| `--font-krone-one`   | Krona One (self-hosted, geometric sans)    |
| `--font-sans`        | Helvetica Neue, system sans                |

## Naming Conventions

- **Components:** PascalCase (`HeroSection.tsx`, `Button.tsx`)
- **Hooks:** camelCase prefixed with `use` (`useTextWritingMotion.ts`)
- **Types:** PascalCase, exported from `.types.ts` files alongside the component
- **CSS classes:** BEM-like (`home-hero__title`, `home-about__content`)
- **Stories:** Colocated with the component (`Button.stories.tsx`)

## Animation Rules

- All GSAP animations must use the `useGSAP` hook from `@gsap/react` — never raw `useEffect`
- Register plugins at module level: `gsap.registerPlugin(SplitText)`
- **Never commit `markers: true`** in ScrollTrigger — debug only, remove before committing
- Always return a cleanup function from `useGSAP` when using SplitText (call `.revert()`)

## Git Workflow

### Branch naming

```
feat/section-name        # New feature or section
fix/bug-description      # Bug fix
chore/task-description   # Tooling, config, cleanup
refactor/what-changed    # Refactoring without behavior change
```

### Commit format

Every commit **must** include the Notion task ID. Format enforced by Husky + Commitlint:

```
P27-{number} - {type}({scope}): {Description starting with capital letter}
```

**Examples:**

```
P27-5 - feat(Hero): Add entrance animation with GSAP SplitText
P27-12 - fix(About): Correct scroll trigger start offset
P27-3 - chore(deps): Upgrade GSAP to v3.13
P27-8 - refactor(Button): Extract size logic into getSize helper
P27-21 - docs(readme): Add deployment instructions
```

**Valid types:**

| Type       | When to use                                      |
| ---------- | ------------------------------------------------ |
| `feat`     | New feature or section                           |
| `fix`      | Bug fix                                          |
| `chore`    | Tooling, config, cleanup, deps                   |
| `refactor` | Code change with no behavior change              |
| `docs`     | Documentation only                               |
| `test`     | Adding or updating tests                         |
| `style`    | Formatting, missing semicolons (no logic change) |
| `perf`     | Performance improvement                          |
| `ci`       | CI/CD pipeline changes                           |
| `build`    | Build system or dependency changes               |
| `revert`   | Reverting a previous commit                      |

### Commit hook enforcement

Before every commit (`pre-commit`), Husky:

1. **Formats** the commit's files with Prettier and adds them back (lint-staged)
2. **Lints** the whole project: any ESLint error **or warning** rejects the commit
3. **Tests**: the whole Vitest suite (unit + Storybook)

Then it validates the message (`commit-msg`) with two checks:

1. **Prefix check** — must start with `P27-{number} - `
2. **Commitlint** — type must be valid, description must start with capital letter

Failing any step rejects the commit with a clear error message.

### Formatting

Prettier owns the formatting (`prettier.config.mjs`): double quotes, semicolons, trailing
commas, 2 spaces, lines up to 100 characters, and Tailwind classes sorted (in `className`
and inside `clsx(…)`). ESLint leaves style to it (`eslint-config-prettier`). Don't
hand-format; run `npm run format`, or let the commit hook do it.

### Rules

- Every commit must reference a Notion task ID (P27-X)
- One logical change per commit
- Never commit with `markers: true` in GSAP code
- Never commit commented-out code blocks
- Never commit `.DS_Store`, log files, or zip files

## Task Management

Notion workspace: **Portfolio-27**

- Everything is tracked in the one **Backlog** database: tasks, bugs (Type `Bug`) and technical debt (Type `Tech Debt`), so every item gets a `P27-N` ID for its commits
- The **Bugs** and **Tech Debt** views list those two Types, each with its own template
- Active sprint tracked in **Current Sprint** page

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint (no errors, no warnings)
npm run format       # Prettier: format the whole project
npm run format:check # Prettier: list unformatted files, change nothing
npm test             # Vitest
npm run storybook    # Storybook on :6006
```
