# Library Docs

How **MediNex+** uses each third-party library — the project-specific patterns and
constraints, not general API docs. Read the relevant section before implementing a feature
that touches one of these. The app is split into `frontend/` (Next.js) and `backend/`
(NestJS); sections are grouped accordingly.

Order of authority: `node_modules/next/dist/docs` (for Next.js) → this file → general knowledge.

---

# Frontend

## axios

The single most important frontend pattern. **All authenticated backend calls go through
the shared instance** — never a bare `fetch`/`axios()`.

```typescript
// shared/lib/axios.config.ts
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // backend origin + /api
  withCredentials: true,                    // auth rides on HTTP-only cookies
})
```

The response interceptor owns cross-cutting concerns:

- **401** → single-flight token refresh (`POST /auth/refresh`) + replay original request;
  on refresh failure, redirect to `/login`. Concurrent 401s queue behind one refresh
  (`isRefreshing` + `failedQueue`).
- **403** → toast "You don't have access to that."
- **5xx** → toast a generic message + console error.

**Rules:**

- Import the default export from `@lib/axios.config` in every service.
- Services return unwrapped, typed domain data (unwrap the `{ success, message, data }` envelope → `.data.data`).
- Don't re-implement 401/403/5xx per call — the interceptor owns it.
- The refresh call uses a bare `axios.post` so it can't recurse through the interceptor.
- Feature services live in `features/<domain>/api/*.service.ts` (`auth.service`, and future
  `appointments.service`, `patients.service`, `pharmacy.service`, `lab.service`, `billing.service`).
  Every service returns tenant-scoped, typed domain data.

## shadcn/ui (Radix + Base UI)

UI primitives live in `src/shared/components/ui` (button, card, input, select, dialog,
table, sheet/drawer, tabs, calendar, tooltip, …), styled with `class-variance-authority`
for variants and the design tokens.

**Rules:**

- Reuse and extend primitives from `shared/components/ui` — don't pull raw Radix/Base UI into feature code.
- Add new primitives via the shadcn workflow (`components.json`); style them with tokens, never hex.
- Compose feature composites (`PantryRow`, `RecipeCard`, `MealSlot`, `ShoppingItemRow`) in the feature or `shared/components`.

## Tailwind CSS v4

- Tokens are defined with `@theme` in `shared/styles/theme.css` (imported by `app/globals.css`) — **no `tailwind.config.ts`** for colors/tokens. See ui-tokens.md.
- Utilities are generated from `--color-*`, `--text-*`, `--radius`, and `--font-*` variables (e.g. `bg-primary`, `text-foreground`, `border-border`, `text-h2`, `font-sans`, `font-display`).
- **Style with utilities only — no hand-written CSS files / CSS modules** for components. A decorative gradient may be expressed inline via `style={{ ... }}` using `var(--color-*)` tokens (the sole exception).
- For conditional/merged classes use the `cn` helper from `@lib/utils`. Never concatenate class strings by hand.

## React Hook Form + Zod

Every form (login, signup, pantry item, preferences, generator filters). The Zod schema is
the single source of truth.

```typescript
const form = useForm<PantryItemValues>({
  resolver: zodResolver(pantryItemSchema),
  defaultValues: DEFAULTS,
  mode: "onBlur",
})
```

- Schemas live in the feature's `schemas/`; derive types via `z.infer`.
- Validate before calling a service. Build inputs from the shared form-field components, not raw inputs.

## Zustand

Cross-cutting client state only: `auth.store` (user/session) and any shared counters chrome
needs (e.g. pantry low-stock count, shopping-list count for a navbar badge).

- Select narrow slices: `useAuthStore((s) => s.user)`.
- Auth checks here are **UX only** — the backend is the authorization source of truth.

## recharts (optional)

For dashboard / finance analytics visualisation (revenue, appointment trends, etc.). Keep charts
behind the views that need them; dynamic-import heavy charts. Style via token-backed colors.

## lucide-react

Icon set. Direct named imports; size via `className` (`size-4`) or the `size` prop; color
via token-backed classes, never raw hex.

---

# Backend

## NestJS

- One **module** per domain (`auth`, `hospitals`, `users`, `doctors`, `patients`,
  `appointments`, `prescriptions`, `ai`, `pharmacy`, `lab`, `billing`); controllers are thin,
  services hold logic. Every per-tenant query is scoped to `hospitalId`.
- Global `ValidationPipe` (`whitelist: true, transform: true`) in `main.ts`; `cookie-parser` enabled; CORS configured with `credentials: true` and the frontend origin.
- Use Nest exceptions (`NotFoundException`, `ForbiddenException`, …); a global exception filter shapes them into `{ success, message }`.
- A global response interceptor wraps successful returns in `{ success: true, message, data }`.

```typescript
// main.ts (essentials)
app.use(cookieParser())
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
app.enableCors({ origin: process.env.CORS_ORIGIN, credentials: true })
app.setGlobalPrefix("api")
```

## Prisma

- Single injectable `PrismaService extends PrismaClient` (connects `onModuleInit`). Inject it into services; **never** `new PrismaClient()` elsewhere.
- Schema in `prisma/schema.prisma`; change it via `npx prisma migrate dev --name <change>`; commit migrations. `prisma generate` runs on install/migrate.
- Use `select`/`include` deliberately; **never select or return `passwordHash`**.
- Flexible sub-shapes (e.g. prescription `items`, invoice `lineItems`) are stored as `Json`
  columns; `role`, `appointmentStatus`, `prescriptionSource`, etc. are **enums** shared across models.
- **Every query is scoped to the tenant** (`hospitalId`), plus `userId` where user-owned. An
  AI-drafted prescription is created as a `draft` and persisted as `approved` only on doctor review.

```typescript
// appointments.service.ts
const items = await this.prisma.appointment.findMany({
  where: { hospitalId },
  orderBy: { scheduledAt: "asc" },
})
```

## Passport JWT + cookies

- Two tokens: short-lived `access_token`, long-lived `refresh_token`, both **HTTP-only cookies**.
- `JwtStrategy` extracts the token from the request cookie (custom extractor), validates, and returns the user payload.
- Global `JwtAuthGuard`; `@Public()` decorator opts public routes (`/auth/register`, `/auth/login`, `/auth/refresh`) out.
- `/auth/refresh` validates the refresh token and re-issues both cookies. `/auth/logout` clears them.

## bcryptjs

- Hash passwords with a cost factor of 10–12 on register and password change.
- Compare with `bcrypt.compare` on login. Never log, return, or expose the hash.

## class-validator + class-transformer

- Every request body is a **DTO class** with validation decorators (`@IsEmail`, `@IsString`, `@IsInt`, `@Min`, `@IsEnum`, `@IsOptional`, `@IsDateString`, …).
- `whitelist: true` strips unknown properties; `transform: true` coerces query params (e.g. the meal-plan `week`) to their typed form.

```typescript
export class CreatePantryItemDto {
  @IsString() @MinLength(1) name: string
  @IsNumber() @Min(0) quantity: number
  @IsString() unit: string
  @IsOptional() @IsDateString() expiryDate?: string
  @IsOptional() @IsNumber() @Min(0) lowStockThreshold?: number
}
```

## Config validation (`@nestjs/config` + class-validator)

Configuration is **validated at boot** so a bad env crashes the app at startup, not on the
first request. `config/env.validation.ts` defines an `EnvironmentVariables` class with
class-validator decorators; `ConfigModule.forRoot({ isGlobal: true, load: [configuration],
validate: validateEnv })` runs it.

- Validate presence/type of `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and the
  AI provider key (once chosen); optional `PORT`, `CORS_ORIGIN`, `NODE_ENV` with defaults.
- `config/configuration.ts` returns a **typed, namespaced** object (`jwt.accessSecret`, `ai.model`,
  …). In feature code read config via `ConfigService.get(...)` / `getOrThrow(...)`, **never**
  `process.env`.

## helmet + `@nestjs/throttler` (security)

- `app.use(helmet())` in `main.ts` for security headers.
- A **global** `ThrottlerGuard` (via `APP_GUARD`) rate-limits everything; tighten limits on
  `/auth/*` (brute force) and any paid AI endpoint (each call costs an AI request) with a
  route-level `@Throttle(...)`.

## nestjs-pino + `LoggingInterceptor` (logging)

- `LoggerModule.forRoot({ pinoHttp: { autoLogging: false, ... } })`; `app.useLogger(app.get(
  Logger))` and create the app with `bufferLogs: true`. `pino-pretty` transport in dev only;
  redact `authorization` / `cookie` headers.
- `autoLogging` is **off** so a single `LoggingInterceptor` owns request logs (method, url,
  status, latency). Never `console.log` in app code — inject the pino logger.

## PrismaExceptionFilter

A dedicated `@Catch(Prisma.PrismaClientKnownRequestError)` filter maps DB error codes to clean
HTTP responses, keeping the `{ success: false, message }` envelope:

- `P2002` (unique constraint) → **409 Conflict**
- `P2025` (record not found) → **404 Not Found**
- `P2003` (FK constraint) → **400 Bad Request**

Register it **before** `AllExceptionsFilter` in `useGlobalFilters(...)` so Prisma errors are
handled by the specific filter and never fall through to the generic 500.

## Auth decorators (`@Public`, `@CurrentUser`) + graceful shutdown

- `@Public()` (sets metadata) marks the few routes the global `JwtAuthGuard` should skip.
- `@CurrentUser()` is a param decorator returning `request.user` (set by `JwtStrategy`), so the
  `userId` always comes from the verified JWT: `list(@CurrentUser("id") userId: string)`.
- `app.enableShutdownHooks()` in `main.ts` so Prisma disconnects cleanly on SIGTERM/SIGINT.

## Testing (Jest)

- **Unit:** `*.service.spec.ts` next to each service — logic with `PrismaService` mocked.
- **e2e:** `test/*.e2e-spec.ts` — real HTTP through the app against a dedicated test database.

---

## AI — prescription drafting (server-side, provider TBD)

MediNex+'s AI runs **server-side in NestJS only**, isolated in the `ai/` module and injected into
`prescriptions`. The AI key lives only in `backend/.env` — never exposed to the browser; the frontend
only talks to our own NestJS endpoint.

> **Provider is an open decision.** The legacy recipe app used Google Gemini (`@google/genai`); the
> prescription feature's provider/model should be confirmed before the `ai/` module is built. Whatever
> is chosen, keep it behind the `ai/` service interface so swapping it touches one file. **Document the
> chosen provider, SDK, and model id here once decided.**

### Pattern (provider-agnostic)

- The `prescriptions` service builds a prompt from the **tenant-scoped** patient diagnosis/history/
  vitals and asks the AI for a **structured prescription as JSON** (medicines, dose, frequency,
  duration) so the frontend renders fields directly.
- **Validate the parsed JSON** (Zod/DTO) before returning — treat model output as untrusted.
- The AI result is created as a **`draft`**; it is persisted as `approved` only when the doctor
  reviews and confirms. **AI never finalizes a prescription on its own.**

### Failure handling

- Wrap every AI call in try/catch. On error (timeout, quota, malformed output), return a clean
  4xx/5xx with a friendly message — the rest of the platform must keep working without AI.
- Log failures with an `[AiService]` prefix; never log the API key. The AI key is backend-only —
  never `NEXT_PUBLIC_`, never sent to the client.

---

## Out of scope (for now)

See project-overview.md for the current scope. MediNex+ marketing surfaces pricing tiers, but a live
payment integration is **not** wired yet — don't add a payment SDK until that phase. Don't add an auth
provider beyond the JWT/bcryptjs flow above. If any new integration is introduced, document its
pattern here first.
</content>
