# Architecture

MediNex+ is a **full-stack, multi-tenant** application in two deployables. The frontend renders the
UI and talks **only** to our own REST API; the backend owns authentication, tenant isolation,
persistence, and every AI call.

```
frontend/   → Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui
backend/    → NestJS + Prisma + PostgreSQL  (REST API under /api, JWT auth, multi-tenant)
```

The browser never sees the database or any secret/API key. AI runs server-side in NestJS.

> **Migration note:** the repo started as *PantryChef* (recipe app). The recipe domain is being
> removed; the hospital domain replaces it. Retained scaffolding (auth, app shell, shared UI) is
> rebranded to MediNex+. The backend domain model below is the **target** for MediNex+.

---

## Stack

### Frontend

| Layer        | Tool                                   | Purpose                                                       |
| ------------ | -------------------------------------- | ------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router)                | Routing, rendering, route groups                              |
| UI runtime   | React 19                               | Component model                                               |
| Language     | TypeScript (strict)                    | Throughout                                                    |
| Styling      | Tailwind CSS v4 + tw-animate-css       | Utility styling and animation (no hand-written CSS files)     |
| Components   | shadcn/ui (Radix + Base UI)            | Accessible UI primitives in `src/shared/components/ui`        |
| Icons        | lucide-react                           | Icon set                                                      |
| Fonts        | `next/font/google` — Inter + Playfair  | Inter base (`--font-inter`), Playfair italic display accents (`--font-playfair`) |
| HTTP         | axios (shared instance)                | All API calls; JWT + 401-refresh handled by the interceptor  |
| Forms        | React Hook Form + Zod                  | Every form (auth, hospital config, demo request, …)          |
| Client state | Zustand                                | Cross-cutting client state (`auth.store`, demo-modal store)   |
| Charts       | recharts                               | Dashboard / finance analytics visualisation                  |

### Backend

| Layer        | Tool                                   | Purpose                                                       |
| ------------ | -------------------------------------- | ------------------------------------------------------------- |
| Framework    | NestJS                                 | Modular REST API; controllers thin, services hold logic       |
| ORM          | Prisma                                 | Typed DB access + migrations                                  |
| Database     | PostgreSQL                             | Tenants, users, doctors, patients, appointments, prescriptions, pharmacy, lab, billing |
| Auth         | Passport JWT + bcryptjs                | JWT sessions (HTTP-only cookies); password hashing            |
| Validation   | class-validator / class-transformer    | Request DTO validation + boot-time env validation            |
| Security     | helmet + `@nestjs/throttler`           | Security headers; rate limiting (esp. `/auth`)               |
| Logging      | nestjs-pino (pino)                     | Structured request logging via a `LoggingInterceptor`         |
| AI           | server-side AI (provider TBD)          | AI-assisted prescription drafting (server-side only)          |

> **AI is server-side only.** Any AI key lives only in `backend/.env`, never `NEXT_PUBLIC_`, never
> sent to the browser. The frontend only calls our own endpoint. **AI provider is an open decision**
> for MediNex+ — the legacy recipe app used Google Gemini; confirm the prescription feature's provider
> before that module is built (document the choice here when made).

---

## Multi-tenancy

MediNex+ is **multi-tenant**: each hospital is a tenant (`Hospital`). Every user belongs to a
hospital, and **every data-bearing query is scoped to the tenant** (`hospitalId`) in addition to the
authenticated user. The `hospitalId` is derived from the verified JWT/session on the server — never
trusted from the client. No query may read or write across tenants.

---

## Domain Model (Prisma / PostgreSQL) — target

```
Hospital        id, name, slug (unique), plan, createdAt          ← the tenant
User            id, hospitalId, email (unique), passwordHash, role, name, createdAt
Department      id, hospitalId, name
Doctor          id, hospitalId, userId?, name, specialty, departmentId
Patient         id, hospitalId, name, dob, contact, ...
Appointment     id, hospitalId, patientId, doctorId, scheduledAt, status
Prescription    id, hospitalId, appointmentId, doctorId, patientId,
                items (Json), source (AI | manual), status (draft | approved), createdAt
PharmacyItem    id, hospitalId, name, stock, batch, expiry, price
LabOrder        id, hospitalId, patientId, test, status, resultUrl?
Invoice         id, hospitalId, patientId, lineItems (Json), total, status
```

- `Role`, `AppointmentStatus`, `PrescriptionSource`, etc. are enums.
- An **AI-drafted prescription is created as `draft`** and only becomes `approved` when the doctor
  confirms — AI never finalizes on its own.
- **Never select or return `passwordHash`.** Every row is scoped to `hospitalId` (+ `userId` where
  user-owned).

---

## Backend Folder Structure (production-grade, four layers)

A **modular monolith**: one deployable, strict module boundaries. Four top-level layers — `config/`,
`common/`, `prisma/`, and `modules/`. Feature modules live under `src/modules/`.

```
backend/
├── prisma/  (schema.prisma, migrations/, seed.ts)
└── src/
    ├── main.ts          → bootstrap: pipes, filters, interceptors, helmet, CORS, shutdown hooks
    ├── app.module.ts    → root: config + infra + all feature modules
    ├── config/          → typed, boot-validated configuration (app refuses to boot on bad env)
    ├── common/          → cross-cutting, domain-agnostic (decorators, filters, interceptors, guards). Imports NOTHING from modules/.
    ├── prisma/          → PrismaService + PrismaModule (@Global)
    └── modules/         → one folder per domain
        ├── auth/         → register/login/refresh/logout, JwtStrategy, guard
        ├── hospitals/    → tenant onboarding + settings (the tenant root)
        ├── users/        → staff accounts, roles
        ├── doctors/      → doctor + department records, scheduling
        ├── patients/     → patient records (EMR)
        ├── appointments/ → booking, calendar, reminders
        ├── prescriptions/→ prescriptions (incl. AI draft → doctor review)
        ├── ai/           → AI provider wrapper (isolated), injected into prescriptions
        ├── pharmacy/     → inventory, counter sales, purchase orders
        ├── lab/          → sample tracking, results
        └── billing/      → invoicing, payments, finance analytics
```

### Discipline (what keeps it production-grade)

- `common/` and `prisma/` **never import from `modules/`**. A module **never imports another
  module's internals** — only its **exported service** through the Nest module system.
- **Controllers are thin** — HTTP only: route, `@CurrentUser()` / tenant, call service, return.
- **Services own logic and persistence** — scope every query to `hospitalId` (+ `userId`), throw
  Nest exceptions; never return raw DB errors.
- **DTOs are the input contract** — every body is a validated class; `ValidationPipe({ whitelist:
  true })` strips undeclared properties.
- **Entities are the output contract** — class-transformer `@Exclude()`/`@Expose()` so
  `passwordHash` can never serialize out.
- **The AI module is isolated** — wraps the provider behind a service interface, injected into
  `prescriptions`. Swapping providers/models touches one file.

---

## Frontend Folder Structure

Feature-based. Routing lives in `src/app` (thin route entries using route groups), feature UI lives
in `src/features/*`, cross-cutting UI/utilities live in `src/shared`.

```
frontend/src/
├── app/
│   ├── layout.tsx          → Root layout: metadata, Inter + Playfair fonts
│   ├── globals.css         → Tailwind entry + imports theme.css
│   ├── page.tsx            → "/" → the public MediNex+ landing page
│   ├── (auth)/             → login + signup (no app chrome)
│   └── (app)/              → authenticated app shell (nav + main)
│       ├── layout.tsx      → guards session; renders chrome
│       ├── dashboard/page.tsx
│       └── settings/page.tsx
│       └── (future: appointments, patients, doctors, pharmacy, lab, billing)
│
├── features/               → one vertical slice per domain
│   ├── landing/            → the public landing page (sections, constants, cta-styles, demo-modal store)
│   ├── auth/               → login/signup forms, auth service, store
│   ├── dashboard/          → dashboard cards/view
│   ├── settings/           → account settings
│   └── (future: appointments, patients, pharmacy, lab, billing, prescriptions)
│       each slice may carry: components/ · constants.ts · stores/ · schemas/ · api/ · types/
│
└── shared/
    ├── components/ui/      → shadcn/ui primitives
    ├── components/         → shared composites + GlobalHosts (Toaster + ConfirmDialog)
    ├── config/             → app navigation config
    ├── constants/          → route paths, enum labels
    ├── lib/                → axios.config.ts, utils.ts (cn)
    ├── stores/             → auth.store, confirm.store (Zustand)
    ├── types/
    └── styles/theme.css    → design tokens (see ui-tokens.md)
```

### Import aliases (`frontend/tsconfig.json`)

```jsonc
"@/*": ["./src/*"]  ·  "@app/*"  ·  "@features/*"  ·  "@shared/*"  ·  "@components/*": ["./src/shared/components/*"]  ·  "@lib/*": ["./src/shared/lib/*"]
```

Use these — never deep relative imports. `cn` from `@lib/utils`; primitives from `@components/ui/*`;
the shared axios instance from `@lib/axios.config`.

---

## Rendering & Data Flow

- **Server Components by default.** A component becomes a Client Component (`"use client"`) only when
  it needs interactivity — forms, tabs, accordions, anything reading a Zustand store. Push the
  boundary as low as possible (e.g. the landing page is a Server Component composing sections; only
  the nav/tabs/accordion/pricing-toggle/demo-modal are client).
- **All authenticated reads/writes go through the shared axios instance** (`@lib/axios.config`) to
  feature **services** (`features/*/api/*.service.ts`). The interceptor owns 401-refresh, 403, 5xx.
- **Auth** rides on HTTP-only cookies; axios uses `withCredentials: true`; on 401 it single-flights a
  refresh and replays, redirecting to `/login` on failure.

---

## Invariants

- The **frontend never** holds secrets, talks to the database, or calls an AI provider directly.
- **Multi-tenant:** every data-bearing route is scoped to the authenticated user's `hospitalId`
  (derived from the verified session, never client-supplied) — no cross-tenant access.
- **Never select, return, or log `passwordHash`.** Hash with bcryptjs; compare on login.
- Frontend: `src/app/*` holds route entries only — compose feature components; no business logic in
  pages/layouts. A feature never imports another feature's internals; `shared` never imports from
  `features`/`app`.
- All cross-cutting frontend HTTP goes through the shared axios instance and feature services — never
  a bare `fetch`/`axios()` in a component.
- **UI is built with Tailwind utilities + tokens + shadcn primitives** — no hand-written CSS files,
  no hand-rolled components shadcn provides (gradients via inline `style` with `var(--color-*)` are
  the sole exception).
- Backend: one **module per domain** under `src/modules/`; controllers thin, services hold logic;
  every request body is a validated DTO. `common/`/`prisma/` never import from `modules/`.
- **Config is validated at boot**; read config via `ConfigService`, not `process.env`, in feature
  code. **Secure by default** — global `JwtAuthGuard`; only `@Public()` routes are open.
- **AI is server-side, isolated, and advisory** — an AI-drafted prescription is a `draft` the doctor
  must approve; an AI outage must never break the rest of the app.
- **Light theme**, **violet** brand, **Inter/Playfair** fonts — every surface uses semantic tokens.
  No hardcoded hex or raw Tailwind color classes in components.
