# Progress Tracker

Update this file after every completed feature/slice. Any AI agent reading this should immediately
know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** **MediNex+ migration (Phase 0 complete).** The codebase is being repurposed from
*PantryChef* (an AI recipe app) into **MediNex+**, a multi-tenant hospital management SaaS. The
context docs are rewritten for MediNex+ (product, architecture, tokens, rules, plan). The theme is
rebranded to violet + Inter/Playfair, the legacy recipe pages are removed, and the **public landing
page** is built from the design — using **Tailwind utilities + shadcn primitives** (no custom CSS
files, no hand-rolled components).

**Done (this build):**

- **Docs rebranded to MediNex+** — all nine `context/*.md` now describe the hospital-management
  product, the multi-tenant backend, the light **violet** theme, **Inter + Playfair** fonts, and the
  Tailwind+shadcn build rule.
- **Theme + fonts** — `theme.css` has the `--color-violet-*` scale + `--font-sans`/`--font-display`
  tokens; semantic `--primary*`/`--ring` repointed to violet (light `:root`, dark `.dark`).
  `layout.tsx` loads Inter + Playfair and sets MediNex+ metadata.
- **Legacy recipe features removed** — `generate`/`recipes`/`pantry`/`meal-plan`/`shopping` route
  pages + feature dirs deleted; `app-nav.ts` (Dashboard, Settings), `DashboardView.tsx` (minimal
  hospital placeholder), `PreferencesSection.tsx` (inlined constants) repaired so the build stays green.
- **Landing page** (`features/landing`, 19 components) built from the design — Tailwind utilities +
  tokens + shadcn primitives (`Tabs`, `Accordion`, `Dialog`), no CSS files. Wired to `app/page.tsx`.
  Sections: sticky nav + mobile drawer, hero + dashboard mock + floating cards, trusted-by, 4 solution
  cards, dark AI-prescription (Smart/Voice tabs), why-choose, how-it-works, testimonials, pricing
  (billing toggle), FAQ (accordion), CTA, footer, Book-demo modal (RHF + Zod). Installed shadcn
  `accordion` + `tabs`.
- **Rule-compliance pass** — removed all hardcoded hex, raw color classes (incl. `text-white`/
  `bg-white` → `text-primary-fg`/`bg-surface`), arbitrary `text-[Npx]` sizes, and hardcoded
  `rounded-[..]` radii; feedback states use `danger`/`warning`/`success`. Decorative one-offs (brand
  gradients via inline `style` with `var(--color-*)`, gold stars, blue "voice" accent, `bg-neutral-900`
  dark surfaces) kept per the tokens' decorative allowance.
- **Verified:** `npm run build` clean — routes `/`, `/dashboard`, `/login`, `/settings`, `/signup`;
  TypeScript passes; recipe routes gone.

**Backend (from the prior build):** NestJS scaffold with register/login/refresh/logout, bcryptjs
hashing, JWT in HTTP-only cookies, refresh rotation. To be extended with the `Hospital` tenant model
and tenant scoping (Phase 1).

**Next:**

- Phase 1 — add the `Hospital` tenant model + tenant scoping on the backend, and rebrand the
  `(auth)` pages; then begin the hospital feature slices (build-plan.md phases 2+).

---

## Progress

See build-plan.md for the full per-phase breakdown.

- [x] Phase 0 — Foundation & Rebrand (docs + theme/fonts + recipe removal + landing page)
- [~] Phase 1 — Auth & Multi-tenancy (backend auth done; tenancy + FE rebrand pending)
- [ ] Phases 2–8 — Hospital feature modules (not started)
- [ ] Phase 9 — Polish

---

## Decisions Made During Build

- **Product pivot:** PantryChef (recipes) → **MediNex+** (multi-tenant hospital management). Recipe
  domain removed; hospital domain is the target (see architecture.md).
- **Stack:** Frontend — Next.js 16 + React 19 + TypeScript (strict) + Tailwind v4 + shadcn/ui.
  Backend — NestJS + Prisma + PostgreSQL. Frontend talks only to the NestJS REST API.
- **Theme:** **light**, **violet** primary (`#7C3AED` family). Replaces the old emerald-teal brand.
- **Fonts:** **Inter** base + **Playfair Display** italic display accents. Replaces Poppins.
- **UI build rule:** Tailwind utilities + tokens + shadcn primitives only — no custom CSS files, no
  hand-rolled components shadcn provides (inline `style` gradients with `var(--color-*)` excepted).
- **Multi-tenancy:** every data-bearing route scoped to `hospitalId` (from the verified session).
- **AI provider:** open decision for the prescription feature (legacy app used Google Gemini); confirm
  before building the `ai/`/`prescriptions` modules.

---

## Notes

- **tailwind-merge / custom type scale:** `cn()` in `src/shared/lib/utils.ts` registers the custom
  `text-*` size tokens with `extendTailwindMerge` so size classes (`text-h2`) aren't conflated with
  colour classes and dropped. Any new `text-size` token added to `theme.css` must be added there too.
- **Dev-server tip:** deleting files while `next dev` is running can corrupt the Turbopack `.next`
  cache. If a fatal "out of memory" / "can't resolve" appears, stop dev servers, `rm -rf .next`, and
  start a single `npm run dev`.
