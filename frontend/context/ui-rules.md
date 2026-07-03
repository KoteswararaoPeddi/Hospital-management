# UI Rules

How MediNex+'s UI should look, behave, and read. Pairs with ui-tokens.md (colors/typography) and
ui-registry.md (built components). Keep every page visually consistent — shared tokens and
primitives, one set of conventions, one light theme.

---

## How we build UI (non-negotiable)

- **Style with Tailwind utility classes + the design tokens.** No hand-written CSS files or CSS
  modules for component styling. The one sanctioned exception is a multi-stop gradient or decorative
  effect expressed inline via `style={{ ... }}` using `var(--color-*)` tokens (e.g. the landing
  hero/CTA gradients) — chrome still uses token utilities.
- **Use shadcn/ui primitives — never hand-roll what shadcn provides.** Button, Card, Dialog, Input,
  Select, Checkbox, Tabs, Accordion, Dropdown, Tooltip, Sheet, etc. Add them with the CLI
  (`npx shadcn@latest add ...`) into `src/shared/components/ui`. Only build by hand for genuine
  composites (e.g. `SolutionCard`, `PricingCard`, a dashboard mock) — composed **from** shadcn
  primitives + tokens.
- **All content text goes through `Typography`** (`@components/ui/typography`) via its
  `variant`/`weight` props — not raw `text-*` size classes in feature/page code. Colour and layout
  stay on `className`. This applies to the landing page too: use `Typography as="h1"/"h2"/"p"/...`
  with the right `variant`; for responsive marketing headings, scale up with **type-scale tokens** in
  `className` (e.g. `lg:text-display-2xl`) — never arbitrary `text-[Npx]`. (Interactive controls —
  buttons, links-styled-as-buttons, nav anchors — keep their utility classes, like shadcn `Button`.)
- Use `cn` from `@lib/utils` for conditional/merged classes — never hand-concatenate class strings.

---

## Layout

- **Three layout contexts.**
  - **Public** — the marketing landing page at `/` (own nav + footer, no app chrome).
  - **`(auth)`** — login/signup: a centered card on the light background, no app chrome.
  - **`(app)`** — authenticated hospital app: a persistent shell (top nav / sidebar) + a centered
    main content area with comfortable padding.
- **Navigation is route-based** — each app area is its own route under `(app)`; the active route is
  reflected in the nav.
- Build **responsive**: the landing page reflows its grids and collapses the nav to a mobile drawer;
  app nav collapses on mobile; tables/grids reflow to fewer columns or stacked cards. Verify mobile,
  tablet, and desktop.

---

## Cards & Surfaces

- Content panels use `bg-card` with `border border-border` and a `rounded-lg`/`rounded-xl` radius
  (from `--radius`); add a subtle shadow for raised/floating elements.
- Page background is `bg-background`; raised/muted panels use `bg-surface-raised` / `bg-muted`; soft
  brand surfaces use `bg-primary-subtle`.
- Keep card chrome quiet so content stands out.

---

## Components (use shadcn primitives)

- Build on the primitives in `src/shared/components/ui`. Don't hand-roll equivalents. Add new
  primitives via the shadcn CLI when a feature needs one (e.g. `tabs`, `accordion` for the landing
  page).
- Promote a feature component to `shared/components` only once a second feature needs it.
- Buttons: `primary` for the main action, an outline/quiet variant for secondary, ghost for tertiary.
  One primary action per view.
- Every form uses label + control + inline error, driven by RHF + Zod (see code-standards.md).

---

## Color & Type Usage

- Follow ui-tokens.md. Brand actions, links, and active states use `primary` (violet). Feedback uses
  `success`/`warning`/`danger`/`info`.
- Use the typography scale (`text-display-*`, `text-h1`…`text-h6`, `text-body-*`, `text-label-*`)
  rather than arbitrary sizes. Marketing headlines use `display-*`; page titles `text-h1`/`text-h2`;
  card titles `text-h4`; body stays `text-body-base`.
- The **Playfair italic display accent** (`font-display italic`) is reserved for the emphasized span
  in marketing headings (e.g. "Anywhere!", "Healthcare."). Don't use it for body copy.
- Never hardcode hex or use raw Tailwind color classes (including `text-white`/`bg-white` — use
  `text-primary-fg`/`bg-surface`).

---

## Page patterns

- **Landing page (`/`):** a long marketing page composed of section components — sticky nav (mobile
  drawer), hero (headline + dashboard preview + floating proof cards), trusted-by logos, solutions
  cards, a dark AI-prescription section (tabbed: Smart / Voice), why-choose grid, how-it-works steps,
  testimonials, pricing (with a billing toggle), FAQ (accordion), CTA band, and footer. CTAs route to
  `/signup` and `/login`, or open the **Book demo** modal. Each section is its own component; only the
  interactive bits (`nav`, tabs, accordion, pricing toggle, demo modal) are Client Components.
- **Auth (login/signup):** a single centered card — logo, heading, the form (email/password),
  primary submit, and a link to the other auth page. Inline errors; submitting state.
- **Dashboard:** the hospital's at-a-glance home — KPI stat cards (appointments, patients, revenue),
  quick actions, and (as features land) appointment lists, alerts, and charts.
- **Appointments / Patients / Pharmacy / Lab / Billing (future):** list/table + detail patterns with
  search and filters, built on shadcn `Table`/`Dialog`/`Select`; every row scoped to the tenant.
- **AI prescription review (future):** the AI-drafted prescription presented for the doctor to edit,
  approve, or reject — never auto-submitted.

---

## States (every data view)

Every app page reads/writes through the API — handle all states:

- **Loading:** shadcn `Skeleton` or a spinner while fetching. Disable triggers while a slow action
  (e.g. AI drafting) runs.
- **Empty:** guide the user to the next action ("No appointments scheduled yet, add one to get
  started.").
- **Error:** a human-readable message with a retry where sensible. **AI errors** must never break the
  page — show a friendly fallback and keep the rest usable.
- **Forms:** inline validation errors (what's wrong + how to fix), a disabled/submitting state, and a
  success confirmation (toast via sonner).
- **Images:** meaningful `alt` text; use `next/image`.

---

## UX Writing / UI Content Standards

Good UI content tells users what to do, what happened, and what happens next. Apply these everywhere;
consistency matters more than any single choice.

1. **Be clear, not clever** — ✅ "Book demo" · "Create account" / ❌ "Let's get you set up!"
2. **Action-oriented buttons** — ✅ "Book appointment" · "Add patient" · "Save prescription"
3. **Keep labels short** — ✅ "Patient name" / ❌ "Please enter the patient's full name"
4. **Errors explain the problem** — ✅ "Enter a valid email address." / ❌ "Invalid input"
5. **Empty states guide** — ✅ "No patients yet, add your first one." / ❌ "No data found."
6. **Success confirms completion** — ✅ "Appointment booked" / ❌ "Success!"
7. **Avoid trailing periods in short UI text** (buttons, labels, toasts); periods fine in sentences.
8. **Consistency** — pick one term and use it everywhere (e.g. "Appointment", not "Booking"/"Visit").
9. **Sentence case** — ✅ "Book appointment" / ❌ "Book Appointment".
10. **Reduce cognitive load** — one refined thought; don't make users read more than necessary.

**Never use a long hyphen (em dash `—` or en dash `–`) in UI content.** Use a comma, or rewrite as a
separate sentence.

---

## Do Nots

- **Never write a custom CSS file or hand-roll a component shadcn provides.** Tailwind utilities +
  tokens + shadcn primitives only (gradients via inline `style` with `var(--color-*)` tokens are the
  sole exception).
- **Never use a long hyphen (em dash / en dash) in UI content.**
- Never use raw Tailwind color classes for chrome (`bg-emerald-500`, `text-gray-400`, `text-white`,
  `bg-white`) — use tokens.
- Never define colors in a config file — tokens live in `theme.css` (`@theme`).
- Never reintroduce Poppins or the emerald-teal brand — the brand is **violet**, the base font
  **Inter**, display accents **Playfair**.
- Never use arbitrary `text-[Npx]` sizes or hardcoded `rounded-[..]` radii — use the type scale and
  `rounded-*`.
- Never ship a form without validation, a submitting state, and a success/error message.
- Never let an AI failure break a page — always show a friendly fallback. AI never prescribes without
  doctor review.
- Never put business logic or data fetching in a `page.tsx` — compose feature components.
