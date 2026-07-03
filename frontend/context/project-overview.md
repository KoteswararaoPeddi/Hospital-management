# Project Overview

## About the Project

**MediNex+** is a **multi-tenant hospital management SaaS platform** that connects doctors and
patients. Each hospital signs up as its own tenant and runs its entire operation in one place:
appointments, patient records (EMR), doctor and staff scheduling, pharmacy and inventory, lab and
diagnostics, billing, and finance analytics. A standout capability is **AI-assisted prescriptions**,
where the platform drafts a complete prescription (by text or by voice) and the doctor simply
reviews and approves.

The app is split into two deployables:

```
frontend/   → Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui
backend/    → NestJS + Prisma + PostgreSQL  (REST API, JWT auth, multi-tenant)
```

The frontend never talks to the database or any AI provider directly. It calls **our own** NestJS
API; the API owns authentication, tenant isolation, persistence, and every AI call. Secrets live
only on the backend.

> **Migration note:** this codebase began life as *PantryChef* (an AI recipe generator) and is being
> repurposed into MediNex+. The recipe domain (pantry, recipes, generator, meal planner, shopping)
> is being removed and replaced with the hospital domain. Some scaffolding (auth, the app shell,
> shared UI primitives) is retained and rebranded.

---

## The Problem It Solves

Hospitals and clinics run on a patchwork of disconnected tools, paper, and manual processes:
appointments by phone, records in filing cabinets, prescriptions handwritten and misread, billing
reconciled by hand across departments. MediNex+ removes that friction. It gives a hospital one
secure system where patients book online, records are digital and access-controlled, prescriptions
are drafted by AI and reviewed by doctors, and pharmacy, lab, and finance all reconcile together.

---

## Core User Flow

```
Hospital signs up (becomes a tenant)
      ↓
Configure hospital → add departments, doctors, staff (assign roles)
      ↓
Patients book appointments (24/7 online) ──reminders──┐
      ↓                                                │
Doctor runs the consultation                           │
   ├─ views patient record / history (EMR)             │
   └─ AI drafts prescription → doctor reviews & approves
      ↓
Pharmacy dispenses · Lab processes tests · results delivered
      ↓
Billing & payments captured → finance analytics update in real time
```

---

## Features In Scope

1. **Public landing page** — the marketing site at `/` (hero, solutions, AI prescription, pricing,
   FAQ, etc.) that sells MediNex+ and routes visitors to sign up / book a demo.
2. **Authentication & multi-tenancy** — hospital sign-up and login; every data-bearing route is
   scoped to the authenticated user **and** their hospital (tenant).
3. **Hospital & staff management** — departments, doctor and staff records, roles, and scheduling.
4. **Appointments** — online booking, calendars, automated SMS/email reminders, status tracking.
5. **Patient records (EMR)** — secure, access-controlled patient histories, vitals, and documents.
6. **AI-assisted prescriptions** — draft a prescription from diagnosis/history (text or voice);
   the doctor reviews and approves. AI never prescribes unilaterally.
7. **Pharmacy & inventory** — counter sales, stock alerts, purchase orders, expiry/batch tracking,
   billing integration.
8. **Lab & diagnostics** — sample tracking, test report generation, result delivery, lab billing.
9. **Billing & finance analytics** — billing queues, invoicing, revenue analytics, expense/payroll.
10. **Responsive UI** — modern, responsive design across mobile, tablet, and desktop.

---

## Features Out of Scope (for now)

- A native mobile app (the web app is responsive instead).
- Insurance-claim clearinghouse integrations.
- Public patient social features (forums, reviews feeds).
- Hardware/device integrations beyond standard web inputs.

> Scope grows by phase (see build-plan.md). The **current** focus is the public landing page and
> removing the legacy recipe pages; hospital feature modules follow.

---

## Target Audience

- **Hospitals and clinics** that want to run their whole operation on one secure platform.
- **Doctors** who want less administrative load (online scheduling, AI-drafted prescriptions).
- **Patients** who want effortless booking, reminders, and digital records.
- **Hospital administrators / finance teams** who need billing, inventory, and analytics in one place.

---

## Success Criteria

- A hospital can sign up, configure its team, and start accepting appointments quickly.
- Patients can book and receive reminders without friction; doctors run consultations with records
  and AI-drafted prescriptions at hand.
- Pharmacy, lab, and billing reconcile together; finance analytics reflect reality in real time.
- Every tenant's data is isolated and access-controlled; no cross-tenant leakage.
- The UI is consistent (shared tokens + shadcn primitives) and responsive on every breakpoint.
- AI failures degrade gracefully — the rest of the platform keeps working when AI is unavailable.
