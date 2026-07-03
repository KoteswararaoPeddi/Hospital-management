# UI Tokens

Design tokens for **MediNex+**, defined in `frontend/src/shared/styles/theme.css` (imported by
`app/globals.css`). The palette is a **violet** primary on a **light neutral** base (white surfaces,
slate text) — a clean, modern light healthcare UI. Use these exact tokens throughout; **never**
hardcode hex or use raw Tailwind color classes (`bg-violet-600`, `text-gray-400`).

> Source of truth: `src/shared/styles/theme.css`. If a token changes there, update this file.
> The app is **light by default** — `:root` holds the **light** theme. A `.dark` block exists as an
> override (no toggle/`next-themes` wired). The resolved values below are the **light** values.

---

## How It's Structured

`theme.css` has layers (Tailwind v4 — no `tailwind.config.ts` for tokens):

1. **`@theme` foundation** — raw palette scales, the typography scale, **and the font families**.
   These generate utilities like `bg-violet-600`, `text-neutral-900`, `text-h2`, `font-sans`,
   `font-display`. Key foundation scales:
   - `--color-violet-*` — **primary brand** (base `--color-violet-600: #7c3aed`). Matches the
     landing design's `#7C3AED` family.
   - `--color-neutral-*` — **neutral / surfaces / text** (slate; base dark `#0f172a`).
   - `--color-red-*`, `--color-amber-*`, `--color-green-*`, `--color-blue-*` — feedback/accents.
   - Font families: `--font-sans` → `var(--font-inter)` (base), `--font-display` →
     `var(--font-playfair)` (the italic display accents).
   - Legacy scales (`emerald-teal`, `charcoal-black`, `purple`, `grey`, …) remain in the file but
     are **not** the MediNex+ semantic set — prefer the semantic tokens / violet scale.
2. **`:root` semantic layer** — named CSS vars pointing at the palette (`--primary`, `--secondary`,
   `--background`, `--surface`, `--foreground`, `--border`, `--ring`, …) **and** shadcn aliases
   (`--card`, `--popover`, `--muted`, `--accent`, `--destructive`, `--sidebar-*`).
3. **`@theme inline`** — bridges the semantic vars into Tailwind's `--color-*` namespace so
   utilities (`bg-primary`, `text-foreground`, `border-border`, `bg-card`, …) are generated.

```tsx
// Correct — generated utility classes
className="bg-primary text-primary-fg"
className="bg-card text-foreground border-border"

// Correct — CSS variable directly when a utility doesn't fit (e.g. gradients)
style={{ background: "linear-gradient(135deg, var(--color-violet-600), var(--color-violet-700))" }}

// Never — hardcoded hex / raw Tailwind colors
className="bg-[#7c3aed] text-gray-400"
className="bg-violet-600"   // raw Tailwind scale, not a project token — chrome uses semantic primary
```

For conditional/merged classes, always use `cn` from `@lib/utils`.

---

## Semantic Tokens (use these in components)

The active theme is **light**. Values below are the resolved light values.

| Role                 | Utility examples                                | Value (via palette)              |
| -------------------- | ----------------------------------------------- | -------------------------------- |
| Primary (brand)      | `bg-primary` `text-primary` `border-primary`    | violet-600 `#7c3aed`             |
| Primary hover        | `bg-primary-hover`                              | violet-700 `#6d28d9`             |
| Primary subtle       | `bg-primary-subtle`                             | violet-50 `#f5f3ff`              |
| On-primary text      | `text-primary-fg`                               | white `#ffffff`                  |
| Secondary            | `bg-secondary` `text-secondary`                 | neutral-100 `#f1f5f9`            |
| Danger / destructive | `bg-danger` / `bg-destructive`                  | red-600 `#dc2626`                |
| Warning              | `bg-warning`                                    | amber-500 `#f59e0b`              |
| Success              | `bg-success`                                    | green-600 `#16a34a`              |
| Info                 | `bg-info`                                       | blue-600 `#2563eb`               |
| Page background      | `bg-background`                                 | neutral-50 `#f8fafc`             |
| Surface / card       | `bg-surface` / `bg-card`                        | white `#ffffff`                  |
| Raised / muted       | `bg-surface-raised` / `bg-muted`                | neutral-100 `#f1f5f9`            |
| Foreground text      | `text-foreground` / `text-card-foreground`      | near-black neutral-900 `#0f172a` |
| Muted text           | `text-muted-foreground`                         | mid-grey (neutral-500)           |
| Subtle text          | `text-subtle-foreground`                        | lighter grey (neutral-400)       |
| Border               | `border-border`                                 | neutral-200 `#e2e8f0`            |
| Strong border        | `border-border-strong`                          | neutral-300                      |
| Input border         | `border-input`                                  | neutral-200                      |
| Focus ring           | `ring-ring` / `outline-ring`                    | violet (primary)                 |

Each colored role also has `-hover`, `-subtle`, and `-fg` variants (e.g. `bg-danger-subtle`,
`text-warning-fg`). White surfaces/text use `bg-surface`/`text-primary-fg` — **never** `bg-white`/
`text-white` literals.

> The violet scale itself (`bg-violet-50` … `bg-violet-950`) is available for the **decorative**
> brand needs the landing page has (gradients, soft tints, dark-section accents). Prefer the semantic
> `primary`/`primary-subtle` tokens for component chrome; reach for the raw violet scale only for
> gradients and one-off decorative fills.

---

## Typography Scale

Defined in `@theme` → generates `text-*` size utilities:

| Utility            | Size  |  | Utility           | Size |
| ------------------ | ----- |--| ----------------- | ---- |
| `text-display-2xl` | 52px  |  | `text-body-lg`    | 16px |
| `text-display-xl`  | 48px  |  | `text-body-base`  | 14px |
| `text-display-lg`  | 35px  |  | `text-body-sm`    | 12px |
| `text-h1`          | 29px  |  | `text-label-lg`   | 14px |
| `text-h2`          | 24px  |  | `text-label-base` | 12px |
| `text-h3`          | 20px  |  | `text-label-sm`   | 11px |
| `text-h4`          | 16px  |  | `text-caption`    | 11px |
| `text-h5`          | 14px  |  |                   |      |
| `text-h6`          | 12px  |  |                   |      |

### Fonts

- **Inter** is the base sans, loaded via `next/font/google` in the root layout, exposed as
  `--font-inter`, wired to `--font-sans` in `@theme`; `html` applies `font-sans` in `globals.css`.
- **Playfair Display** (italic) powers the **display accents** in headings (e.g. the italic
  "Anywhere!" / "Healthcare." emphasis), loaded as `--font-playfair`, wired to `--font-display` →
  use the `font-display italic` utility on the emphasized span.

If `cn()` merges a custom `text-*` size token, that token must be registered in the
`extendTailwindMerge` list in `src/shared/lib/utils.ts` (so a size class is not conflated with a
colour class and dropped).

---

## Radius

`--radius: 0.625rem` (10px). shadcn derives `rounded-sm/md/lg/xl` from it. Use the `rounded-*`
utilities, not arbitrary pixel radii.

---

## Theme — Light by Default

MediNex+ ships a **light theme by default**. `:root` holds the light surfaces and text
(`--background` neutral-50, `--surface`/`--card` white, `--border` neutral-200, `--foreground`
neutral-900, `--primary` violet-600). A **`.dark` block** overrides the same semantic vars with dark
values (future dark theme; no toggle wired). A `@custom-variant dark (&:is(.dark *))` is declared in
`globals.css` so `dark:` utilities still resolve under a `.dark` ancestor.

> The landing page's dark **AI-prescription** section is an intentional dark band on an otherwise
> light page — it uses the violet scale on a dark backdrop, not the `.dark` theme.

---

## Invariants

- Never hardcode hex in components — use the token utilities (or `var(--token)` when a utility
  doesn't fit, e.g. multi-stop gradients).
- Never use raw Tailwind color classes. The raw **violet** scale is acceptable **only** for
  decorative brand fills; component chrome uses semantic `primary`. Never `bg-emerald-500`,
  `text-gray-400`, `text-white`, `bg-white` (use `text-primary-fg`, `bg-surface`).
- Primary brand is **violet** (`primary`); `secondary` is a light neutral. Don't reintroduce the
  legacy emerald-teal as the brand.
- The app is **light by default**. Build with semantic tokens so components render correctly in
  either theme.
- Borders default to `border-border`; `border-strong` for stronger edges, `border-input` for form
  fields. Never `border-gray-*`.
- Radius comes from `--radius` via `rounded-*` — don't hardcode pixel radii.
- Type uses the scale utilities — never arbitrary `text-[Npx]`.
- Fonts: base is **Inter** (`font-sans`); italic display accents use **Playfair** (`font-display
  italic`). Don't reintroduce Poppins.
