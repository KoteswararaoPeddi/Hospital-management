# Backend — Engineering Decisions (NestJS)

> ⚠ **Scaffold status (read first).** The backend is currently an **early NestJS scaffold that does
> not yet compile as-is.** [`src/main.ts`](../../../backend/src/main.ts) and
> [`src/app.module.ts`](../../../backend/src/app.module.ts) import modules that do **not exist in the
> tree yet** — `./config/*`, `./common/guards/jwt-auth.guard`, `./common/filters/prisma-exception.filter`,
> `./modules/auth/auth.module`, `./modules/health/health.module`. It also still carries **PantryChef**
> naming (a recipe/pantry app) rather than MediNex+ healthcare. The patterns below are real and
> instructive, but treat the wiring as *intended structure*, not *working code*. See the Gotchas at
> the bottom.

---

### Harden the app at the composition root, before it listens

**What / Where / Why** — All cross-cutting HTTP protections are applied once in `bootstrap()`
([`src/main.ts:16-26`](../../../backend/src/main.ts)) — `helmet()`, `cookieParser()`, a global
`ValidationPipe`, global exception filters, CORS with credentials, a global `/api` prefix, and
shutdown hooks — rather than being sprinkled per-controller or per-route.

**Learn:**
1. **Vocabulary**
   - **Composition root** — the single place where the whole app is assembled and configured. In Nest
     that's `main.ts` / the root module.
   - **`helmet`** — middleware that sets safe HTTP response headers (CSP, HSTS, no-sniff, etc.).
   - **`ValidationPipe({ whitelist, transform })`** — validates incoming DTOs; `whitelist` strips
     unknown fields, `transform` coerces payloads into the DTO class instance.
2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — protections added ad hoc, easy to forget on a new route
   @Post() create(@Body() body: any) { if (!body.email) throw ... }

   // ✅ src/main.ts — applied globally, once
   app.use(helmet());
   app.use(cookieParser());
   app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
   app.enableCors({ origin: config.get("corsOrigin", { infer: true }), credentials: true });
   ```
3. **Plain-english why** — Security and validation you have to *remember* to add per route is
   security you will eventually forget. Applying it at the composition root makes it the default
   for every current and future endpoint — new routes are protected without anyone doing anything.
4. **Where else you'd use this** — global logging/metrics middleware; a default cache-control header;
   registering a global auth guard; setting a uniform API version prefix.
5. **Rule of thumb** — Cross-cutting concerns belong at the composition root, not on individual handlers.

---

### Order global guards: rate-limit first, auth second, secure-by-default

**What / Where / Why** — In [`src/app.module.ts:28-32`](../../../backend/src/app.module.ts) the
`ThrottlerGuard` is registered as an `APP_GUARD` *before* the `JwtAuthGuard`. Registering
`JwtAuthGuard` globally makes **every** route authenticated unless it opts out — the secure default —
instead of remembering to add `@UseGuards()` to each protected controller.

**Learn:**
1. **Vocabulary**
   - **`APP_GUARD`** — a Nest DI token; providing a guard under it makes that guard apply to the whole app.
   - **Throttler / rate limiting** — rejecting a client that sends too many requests in a time window.
   - **Secure-by-default** — protection is on unless explicitly turned off (vs off unless turned on).
2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — opt-in auth; one forgotten decorator = an open endpoint
   @UseGuards(JwtAuthGuard) @Controller("recipes") class RecipesController {}

   // ✅ src/app.module.ts — opt-out auth, applied globally, throttle checked first
   providers: [
     { provide: APP_GUARD, useClass: ThrottlerGuard }, // rate limit first
     { provide: APP_GUARD, useClass: JwtAuthGuard },    // then auth (secure by default)
   ]
   ```
3. **Plain-english why** — Order matters: throttling *before* auth means an attacker flooding the
   login route is cut off before you spend CPU verifying tokens. Global auth means the dangerous
   mistake (an accidentally-public route) requires an explicit `@Public()` decorator, so it's visible
   in review instead of invisible by omission.
4. **Where else you'd use this** — global authorization/roles guard; a global tenant-scoping guard in
   multi-tenant apps; ordering a decompression middleware before a body-size limit; CSRF check before
   business logic.
5. **Rule of thumb** — Make the safe thing the default and the unsafe thing require a visible opt-out; order guards cheapest-and-most-protective first.

---

### Register the specific exception filter before the catch-all

**What / Where / Why** — [`src/main.ts:20`](../../../backend/src/main.ts) registers
`new PrismaExceptionFilter()` *before* `new AllExceptionsFilter()`. Nest matches global filters in
registration order, so DB-specific errors get mapped to the right status *before* the generic
`@Catch()` filter would turn them into an opaque 500.

**Learn:**
1. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — catch-all first swallows everything as 500, Prisma filter never runs
   app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());

   // ✅ src/main.ts — specific first, catch-all last
   app.useGlobalFilters(new PrismaExceptionFilter(), new AllExceptionsFilter());
   ```
2. **Plain-english why** — A catch-all handler that runs first never lets a more specific handler
   see the error. Specific-to-general ordering is the same principle as ordering `catch` blocks or
   route patterns: the narrow match must come before the wildcard.
3. **Where else you'd use this** — ordering Express error middleware; `switch`/`if` branches from
   most-specific to default; route registration (`/users/me` before `/users/:id`); pattern matching arms.
4. **Rule of thumb** — Specific handlers before catch-alls, always.

> Note: `PrismaExceptionFilter` is referenced but not present in the tree yet — see Gotchas.

---

### One canonical success envelope, applied by a global interceptor

**What / Where / Why** — [`src/common/interceptors/response.interceptor.ts`](../../../backend/src/common/interceptors/response.interceptor.ts)
wraps every successful controller return in `{ success: true, message, data }`. A handler may return
`{ message, data }` to set its own message; otherwise its return becomes `data` with a generic `"OK"`.
The `AllExceptionsFilter` produces the mirror shape `{ success: false, message }` on errors. The
frontend then unwraps `res.data.data` uniformly.

**Learn:**
1. **Vocabulary**
   - **Interceptor** — Nest construct that can transform a handler's return value on the way out.
   - **Response envelope** — a consistent wrapper object around every payload.
2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — every controller invents its own shape; the client guesses each one
   return { ok: true, recipe };          // one route
   return items;                          // another route

   // ✅ response.interceptor.ts — one shape for all
   return next.handle().pipe(map((payload) =>
     hasDataAndMessage(payload)
       ? { success: true, message: payload.message, data: payload.data }
       : { success: true, message: "OK", data: payload }));
   ```
3. **Plain-english why** — When every response has the same shape, the client writes the unwrapping
   logic *once* and every call site benefits. Ad-hoc shapes push that cost onto every consumer and
   invite subtle mismatches. The opt-in `message` keeps flexibility without breaking the contract.
4. **Where else you'd use this** — any REST API consumed by a typed client; a GraphQL error-extensions
   convention; paginated list envelopes (`{ data, page, total }`); event payload schemas on a queue.
5. **Rule of thumb** — Pick one response shape, enforce it centrally, and let clients unwrap it once.

---

### Never leak internal errors; log the real one, return a generic message

**What / Where / Why** — [`src/common/filters/all-exceptions.filter.ts:37-44`](../../../backend/src/common/filters/all-exceptions.filter.ts):
known `HttpException`s keep their status and message; anything else is logged *server-side* (method,
URL, stack) and returned to the client as a plain 500 `"Something went wrong."`

**Learn:**
1. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — leaks stack traces / DB details to the client
   res.status(500).json({ error: exception.message, stack: exception.stack });

   // ✅ all-exceptions.filter.ts
   this.logger.error(`[${request.method} ${request.url}] ${exception.message}`, exception.stack);
   response.status(status).json({ success: false, message: "Something went wrong. Please try again." });
   ```
2. **Plain-english why** — Raw error text often reveals table names, file paths, or library versions
   an attacker can use. The operator needs the detail; the client only needs to know it failed. So
   log richly on the server, respond blandly to the client.
3. **Where else you'd use this** — any public API error path; auth failures (don't reveal *which*
   field was wrong on login); file-upload errors; third-party integration failures.
4. **Rule of thumb** — Log for the operator, respond for the attacker: detail inward, generic outward.

---

### Validate environment at boot; refuse to start if it's wrong

**What / Where / Why** — [`src/app.module.ts:16-20`](../../../backend/src/app.module.ts) loads config
via `ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv })`. A bad
or missing env var makes the app **fail to boot** rather than crash later on first use.

**Learn:**
1. **Plain-english why** — A missing `DATABASE_URL` should stop the process at second zero with a clear
   message, not surface as a confusing runtime error on the first request an hour into production.
   Fail fast, fail loud, at startup.
2. **Where else you'd use this** — validating secrets/keys on boot; checking a required migration has
   run; asserting a feature-flag config is well-formed; verifying an external service URL is reachable at startup.
3. **Rule of thumb** — Validate config once at startup and crash early — never trust env vars to be present or valid at call time.

> Note: `configuration` and `validateEnv` (`./config/*`) are referenced but not present yet — see Gotchas.

---

### `PrismaService` is the single DB entrypoint, exported from a `@Global` module

**What / Where / Why** — [`src/prisma/prisma.service.ts`](../../../backend/src/prisma/prisma.service.ts)
extends `PrismaClient` and connects in `onModuleInit`; [`prisma.module.ts`](../../../backend/src/prisma/prisma.module.ts)
marks it `@Global()`. Every feature injects this one service — never `new PrismaClient()`.

**Learn:**
1. **Vocabulary**
   - **Connection pool** — a reusable set of DB connections; each `PrismaClient` owns its own pool.
   - **`@Global()` module** — its exports are available app-wide without re-importing per module.
2. **Plain-english why** — Each `new PrismaClient()` opens a *separate* connection pool; scatter them
   and you exhaust the database's connection limit. One shared, injected client keeps a single pool and
   a single lifecycle (connect on init, disconnect on shutdown via `enableShutdownHooks`).
3. **Where else you'd use this** — a shared Redis/HTTP client; a single S3 client; one message-broker
   connection; any expensive, pooled, or stateful resource.
4. **Rule of thumb** — Expensive connections are singletons: create once, inject everywhere, never `new` them inline.

---

## Gotchas / Learned (backend)

- **Domain mismatch — scaffold is PantryChef, product is MediNex+.** `schema.prisma`, `main.ts`
  (`"PantryChef API listening…"`), and the feature-module comments describe a recipe/pantry app. The
  models and modules will need to be replaced with healthcare domains (patients, appointments, staff,
  billing) before this backend serves MediNex+. `(no lesson — pure fact, but flagged as a real risk)`
- **Won't compile yet — dangling imports.** `main.ts`/`app.module.ts` import `./config/*`,
  `./common/guards/jwt-auth.guard`, `./common/filters/prisma-exception.filter`, `./modules/auth/auth.module`,
  `./modules/health/health.module`, none of which exist in `src/`. The scaffold documents *intended*
  structure ahead of the code. **Lesson:** a composition root that references not-yet-built modules is
  fine as a plan, but should be tracked as incomplete (`[~]`) — it is not runnable.
