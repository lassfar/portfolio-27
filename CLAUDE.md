# Portfolio-27 — CLAUDE.md

Project context for Claude Code. Read this before touching any file.

## Project

Personal portfolio for **Aymane Lassfar**, Senior Frontend Developer.
Goal: prove production-grade code quality and creative frontend skill to recruiters.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-based config) |
| Animation | GSAP 3 + SplitText + ScrollTrigger |
| 3D | Three.js + React Three Fiber (@react-three/fiber) |
| State | Zustand (global), Jotai (atomic) |
| Component Dev | Storybook v10 |
| Testing | Vitest + Playwright (browser-mode) |
| Package Manager | npm |

## Folder Structure

```
src/
├── app/                        # Next.js App Router (layout, page, favicon)
├── components/
│   ├── UI/                     # Reusable design system components (Button, etc.)
│   ├── assets/pictures/        # SVG components (logos, shapes)
│   ├── hooks/motions/          # Reusable GSAP animation hooks
│   │   ├── backgrounds/        # Background animation hooks
│   │   ├── shapes/             # Shape animation hooks
│   │   └── texts/              # Text animation hooks
│   ├── pages/                  # Page-level section components
│   │   └── home/               # Home page sections (Hero, About, etc.)
│   └── three.js/               # React Three Fiber components
├── stories/                    # Storybook stories
└── styles/
    └── globals.css             # Global styles + Tailwind v4 @theme tokens
```

## Path Aliases

```ts
"#/*" → "src/*"
```

Use `#/components/...`, `#/styles/...`, etc. Never use relative `../` imports.

## Design Tokens

All tokens are defined in `src/styles/globals.css` under `@theme`. Do not add colors to `tailwind.config.ts`.

### Colors
| Token | Value | Usage |
|---|---|---|
| `--color-rich-black` | `#19191C` | Page background |
| `--color-dark` | `#27272A` | Card / panel backgrounds |
| `--color-peach` | `#FFB266` | Primary accent, CTAs |
| `--color-dark-peach` | `#FF8000` | Hover state for peach |
| `--color-light-peach` | `#FFE3C7` | Subtle peach tints |
| `--color-baby-blue` | `#2489FF` | Secondary accent |
| `--color-light-baby-blue` | `#C5E0FF` | Subtle blue tints |
| `--color-gray-slate` | `#D9D9D9` | Borders, dividers |

### Typography
| Token | Font |
|---|---|
| `--font-great-vibes` | Great Vibes (self-hosted, cursive display) |
| `--font-krone-one` | Krona One (self-hosted, geometric sans) |
| `--font-sans` | Helvetica Neue, system sans |

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

### Commit format (Conventional Commits)
```
feat(scope): short description
fix(scope): short description
chore(scope): short description
refactor(scope): short description
docs(scope): short description
```

### Rules
- One logical change per commit
- Never commit with `markers: true` in GSAP code
- Never commit commented-out code blocks
- Never commit `.DS_Store`, log files, or zip files

## Task Management

Notion workspace: **Portfolio-27**
- All tasks tracked in the **Backlog** database
- Active sprint tracked in **Current Sprint** page
- Bugs go in the **Bugs** database
- Technical debt goes in the **Technical Debt** database

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest
npm run storybook    # Storybook on :6006
```
