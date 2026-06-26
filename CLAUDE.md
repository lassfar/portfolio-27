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
| `--color-peach` | `#FFA14A` | Primary accent, CTAs, body text accents |
| `--color-dark-peach` | `#EF7D14` | Hover state, high-contrast accents |
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
| Type | When to use |
|---|---|
| `feat` | New feature or section |
| `fix` | Bug fix |
| `chore` | Tooling, config, cleanup, deps |
| `refactor` | Code change with no behavior change |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `style` | Formatting, missing semicolons (no logic change) |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `build` | Build system or dependency changes |
| `revert` | Reverting a previous commit |

### Commit hook enforcement

Husky validates every commit with two checks:
1. **Prefix check** — must start with `P27-{number} - `
2. **Commitlint** — type must be valid, description must start with capital letter

Failing either check rejects the commit with a clear error message.

### Rules
- Every commit must reference a Notion task ID (P27-X)
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
