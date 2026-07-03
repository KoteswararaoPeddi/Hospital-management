# Build Plan

A plan for **MediNex+** — a multi-tenant hospital management SaaS. Two deployables: `frontend/`
(Next.js 16 + React 19 + Tailwind v4 + shadcn/ui) and `backend/` (NestJS + Prisma + PostgreSQL).
Mark items `[x]` as they land and keep progress-tracker.md in sync.

## Core Principle

Build **vertical slices, back to front**. For each hospital feature: define the Prisma model + NestJS
module + DTOs (tenant-scoped), expose the endpoint, then build the frontend service + UI against it
and verify the whole slice end to end. Auth + tenancy come first because every other slice is
per-tenant. The public landing page is the exception — it's static marketing UI with no backend.

The API is the source of truth; no mock data layer stands in for it. Where UI must render before its
endpoint exists, stub the service behind a typed interface and replace it when the endpoint lands.

---

## Phase 0 — Foundation & Rebrand (current)

- [x] Frontend scaffolded: Next.js 16 + React 19 + TypeScript (strict); App Router
- [x] Tailwind v4 + tw-animate-css; `theme.css` tokens imported by `globals.css`
- [x] shadcn/ui initialized (`components.json`); base primitives in `src/shared/components/ui`
- [x] **Rebranded tokens to MediNex+**: violet primary (`#7C3AED` family) in `theme.css` (light theme)
- [x] **Fonts**: Inter (base) + Playfair Display (italic display accents) via `next/font/google`
- [x] **Removed legacy recipe pages/features** (generate, recipes, pantry, meal-plan, shopping) and
      repaired the non-recipe files that depended on them (app-nav, dashboard, settings)
- [x] **Public landing page** at `/` built from the design (nav, hero, trusted-by, solutions, AI
      prescription, why-choose, how-it-works, testimonials, pricing, FAQ, CTA, footer, Book-demo
      modal) — Tailwind utilities + shadcn primitives, token-driven
- [x] Backend scaffolded (NestJS): `main.ts`, global interceptor + filter, Prisma service/module

---

## Phase 1 — Authentication & Multi-tenancy (everything else depends on this)

- [x] Backend `auth` module: register + login (bcryptjs), JWT issue/verify, refresh rotation, logout
- [ ] **Tenancy:** `Hospital` (tenant) model; register creates a hospital + its first admin user;
      every authenticated request resolves `hospitalId` from the session
- [ ] Frontend `(auth)` pages rebranded to MediNex+ (login + signup), `auth.service`, `auth.store`
- [ ] `(app)` layout guards the session; unauthenticated users redirect to `/login`
- [ ] Verified end to end: hospital sign-up → log in → protected page → refresh → log out

---

## Phase 2 — Hospital & Staff Management

- [ ] Backend `hospitals` + `users` + `doctors` modules (tenant-scoped): departments, doctors,
      staff, roles, scheduling
- [ ] Frontend: hospital settings, team management (invite/roles)

---

## Phase 3 — Patients (EMR)

- [ ] Backend `patients` module: records scoped to the tenant
- [ ] Frontend: patient list + detail (history, vitals, documents)

---

## Phase 4 — Appointments

- [ ] Backend `appointments` module: booking, calendar queries, status, reminders
- [ ] Frontend: booking flow + calendar + reminders

---

## Phase 5 — AI-assisted Prescriptions

- [ ] Confirm the **AI provider** (see architecture.md) and wire the isolated `ai/` module
- [ ] Backend `prescriptions` module: AI draft (text/voice) → `draft`; doctor review → `approved`
- [ ] Frontend: prescription review UI (edit/approve/reject); never auto-submitted; graceful fallback

---

## Phase 6 — Pharmacy & Inventory

- [ ] Backend `pharmacy` module: stock, batches/expiry, counter sales, purchase orders
- [ ] Frontend: inventory + counter sales + alerts

---

## Phase 7 — Lab & Diagnostics

- [ ] Backend `lab` module: sample tracking, test orders, results delivery
- [ ] Frontend: lab orders + results

---

## Phase 8 — Billing & Finance Analytics

- [ ] Backend `billing` module: invoicing, payments, revenue/expense analytics
- [ ] Frontend: billing queue + invoices + finance dashboard (recharts)

---

## Phase 9 — Polish

- [ ] Responsive pass across mobile, tablet, desktop (every page incl. landing)
- [ ] Loading / empty / error states for each data view (see ui-rules.md → States)
- [ ] Toasts for create/save/delete and AI failures (sonner)
- [ ] Accessibility pass: labels, focus states, keyboard nav, reduced-motion
- [ ] Metadata / favicon / OG; final visual consistency pass

---

## Phase Summary

| Phase                                   | Status        |
| --------------------------------------- | ------------- |
| 0 — Foundation & Rebrand                | Done (rebrand + landing page) |
| 1 — Authentication & Multi-tenancy      | Backend auth done; tenancy + FE rebrand pending |
| 2 — Hospital & Staff Management         | Not started   |
| 3 — Patients (EMR)                      | Not started   |
| 4 — Appointments                        | Not started   |
| 5 — AI-assisted Prescriptions           | Not started   |
| 6 — Pharmacy & Inventory                | Not started   |
| 7 — Lab & Diagnostics                   | Not started   |
| 8 — Billing & Finance Analytics         | Not started   |
| 9 — Polish                              | Not started   |
