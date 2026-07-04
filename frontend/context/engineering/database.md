# Database — Engineering Decisions (Prisma / PostgreSQL)

> ⚠ **Domain + drift status (read first).** The schema in
> [`backend/prisma/schema.prisma`](../../../backend/prisma/schema.prisma) models a **PantryChef**
> recipe/pantry app (`User`, `Preference`, `PantryItem`, `Recipe`, `MealPlanEntry`, `ShoppingItem`) —
> **not** MediNex+ healthcare. It will be replaced. Also, the schema has **drifted** from its only
> migration (see Gotchas). The *modelling patterns* below are genuinely worth learning and transfer
> directly to the healthcare schema; the *entities* do not.

---

### `cuid()` string primary keys, not auto-increment integers

**What / Where / Why** — Every model uses `id String @id @default(cuid())`
([`schema.prisma:64`](../../../backend/prisma/schema.prisma) and each model) instead of an
auto-incrementing integer.

**Learn:**
1. **Vocabulary**
   - **`cuid`** — a collision-resistant unique ID generated *without* a round-trip to the database.
   - **Enumeration attack** — guessing `/users/2`, `/users/3`… because sequential IDs are predictable.
2. **❌ naive vs ✅ our real code**
   ```prisma
   // ❌ naive — sequential, guessable, leaks row counts
   id Int @id @default(autoincrement())

   // ✅ schema.prisma
   id String @id @default(cuid())
   ```
3. **Plain-english why** — Sequential integers reveal how many rows exist and let anyone walk your
   API by incrementing a number. Opaque IDs can be generated client- or app-side before insertion,
   don't leak volume, and are safe to expose in URLs.
4. **Where else you'd use this** — any public-facing resource URL; IDs generated offline before a
   batch insert; distributed inserts where you can't coordinate a sequence; idempotency keys.
5. **Rule of thumb** — Public IDs should be opaque and non-sequential; save auto-increment for internal-only tables.

---

### Snake_case tables via `@@map`, camelCase in code

**What / Where / Why** — Models declare `@@map("pantry_items")`, `@@map("meal_plan_entries")`, etc.
so the database uses SQL-idiomatic `snake_case` table names while Prisma code stays `camelCase`.

**Learn:**
1. **Plain-english why** — SQL convention is `snake_case`; JS/TS convention is `camelCase`. `@@map`
   lets each side follow its own norm, so raw SQL, DBAs, and ORMs all read naturally. `(concept-light)`
2. **Where else you'd use this** — `@map` on individual columns; ORM naming strategies in general;
   mapping API JSON keys to internal field names.
3. **Rule of thumb** — Let each layer use its native naming convention and map at the boundary.

---

### Every per-user row is scoped to `User` with `onDelete: Cascade`

**What / Where / Why** — Each owned model has `user User @relation(fields:[userId], references:[id],
onDelete: Cascade)` ([`schema.prisma:86,102,124,141,159`](../../../backend/prisma/schema.prisma)).
Deleting a user removes all their pantry items, recipes, plan entries, and shopping items in one
DB-enforced operation.

**Learn:**
1. **Vocabulary**
   - **Cascade delete** — deleting a parent row automatically deletes the child rows referencing it.
   - **Orphan row** — a child whose parent no longer exists; a data-integrity bug.
2. **❌ naive vs ✅ our real code**
   ```ts
   // ❌ naive — remember to hand-delete every child table, in the right order, or orphan data
   await prisma.recipe.deleteMany({ where: { userId } });
   await prisma.pantryItem.deleteMany({ where: { userId } });
   await prisma.user.delete({ where: { id: userId } }); // forget one → orphans
   ```
   ```prisma
   // ✅ schema.prisma — the database guarantees it
   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
   ```
3. **Plain-english why** — Integrity rules enforced in the database can't be bypassed by a forgetful
   code path, a second service, or a manual query. One `user.delete` cleans up everything atomically.
4. **Where else you'd use this** — deleting an org and its members; a post and its comments; a cart and
   its line items; GDPR "delete all my data" flows. (Choose `SetNull`/`Restrict` when children must survive.)
5. **Rule of thumb** — Encode ownership and cleanup in the schema, not in application code you have to remember to run.

---

### Composite `@@unique` to model "one row per slot"

**What / Where / Why** — [`schema.prisma:144`](../../../backend/prisma/schema.prisma):
`@@unique([userId, date, slot])` on `MealPlanEntry` guarantees a user can have at most one meal per
`(date, slot)` — the DB refuses a second BREAKFAST on the same day.

**Learn:**
1. **Plain-english why** — "No duplicates for this combination" is a rule the database can enforce
   perfectly with a composite unique index. Doing it in code (check-then-insert) has a race window
   where two concurrent requests both pass the check and both insert. The constraint has no race.
2. **Where else you'd use this** — one vote per `(user, poll)`; one enrollment per `(student, course)`;
   one like per `(user, post)`; one calendar booking per `(room, timeslot)`.
3. **Rule of thumb** — Uniqueness rules belong in a unique constraint, not a pre-insert `SELECT`.

---

### Composite indexes shaped like the queries (`userId` first)

**What / Where / Why** — `Recipe` carries `@@index([userId])`, `@@index([userId, cuisine])`,
`@@index([userId, difficulty])` ([`schema.prisma:127-129`](../../../backend/prisma/schema.prisma));
`MealPlanEntry` has `@@index([userId, date])`. Every list query filters by owner first, then by a
facet, so the indexes lead with `userId`.

**Learn:**
1. **Vocabulary**
   - **Composite index** — an index on several columns in a specific order.
   - **Leftmost-prefix rule** — a composite index on `(a, b)` also speeds queries filtering on just `a`,
     but not queries filtering on just `b`.
2. **Plain-english why** — Index column order must match how you query. Because every screen shows
   "*my* recipes, optionally filtered by cuisine/difficulty," `(userId, cuisine)` serves both the
   `userId`-only list and the `userId + cuisine` filter. A `(cuisine, userId)` index would help neither
   as well.
3. **Where else you'd use this** — `(tenantId, status)` dashboards; `(userId, createdAt)` timelines;
   `(conversationId, sentAt)` message history; any multi-tenant "my X filtered by Y" list.
4. **Rule of thumb** — Index for your real queries, most-selective/always-present column first; don't index columns you never filter on.

---

### `Json` columns for variable-shape sub-structures

**What / Where / Why** — `Recipe.ingredients`, `steps`, `nutrition`, `tips` are `Json`
([`schema.prisma:116-119`](../../../backend/prisma/schema.prisma)) rather than separate normalized
tables, because they are read/written as a whole and never queried field-by-field.

**Learn:**
1. **Plain-english why** — Normalize data you filter, join, or aggregate on. For a blob you always
   load and save together as one unit (a recipe's step list), a child table adds joins and migrations
   for no query benefit — a `Json` column is simpler and just as correct. The trade-off: you *can't*
   efficiently query "all recipes with >30g protein" without extracting that field.
2. **Where else you'd use this** — audit-log payloads; webhook bodies; per-user settings blobs; API
   response snapshots; flexible form answers. (Promote a field to a real column the moment you need to filter on it.)
3. **Rule of thumb** — Normalize what you query; `Json` what you only ever read and write whole.

---

### `@db.Date` when you mean a calendar day, not an instant

**What / Where / Why** — `PantryItem.expiryDate` and `MealPlanEntry.date` use `DateTime @db.Date`
([`schema.prisma:97,136`](../../../backend/prisma/schema.prisma)) so they store a *date* with no time
or timezone, instead of a full timestamp.

**Learn:**
1. **Plain-english why** — "Expires on the 5th" and "planned for Tuesday" are calendar facts, not
   moments in time. Storing them as full timestamps drags in timezone bugs (does midnight UTC belong to
   Monday or Tuesday for a user in LA?). `@db.Date` stores exactly the concept you mean.
2. **Where else you'd use this** — birthdays; invoice due dates; holidays; check-in/check-out dates;
   report "as-of" dates. (Use a real timestamp for *events* — created-at, logged-in-at.)
3. **Rule of thumb** — Use a date type for calendar days and a timestamp for instants; never conflate the two.

---

## Gotchas / Learned (database)

- **Schema ↔ migration drift.** `schema.prisma:67` declares `hashedRefreshToken String?` on `User`,
  but the only migration (`migrations/20260627230051_init/migration.sql`) creates the `users` table
  **without** that column. So the Prisma schema and the actual DB structure disagree — a `prisma
  migrate dev` is pending. **Lesson:** editing `schema.prisma` does *nothing* to the database until a
  migration is generated and applied; always regenerate the migration in the same change that edits the model.
- **Domain replacement pending.** These entities are PantryChef's. The patterns (cuid, cascade
  scoping, composite unique/index, `@db.Date`, `Json` blobs) carry straight over to a healthcare
  schema (`Patient`, `Appointment`, `Doctor`, `Invoice`) — reuse the *patterns*, not the *tables*.
  `(no lesson — pure fact)`
