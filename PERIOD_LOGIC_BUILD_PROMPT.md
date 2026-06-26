# Prompt — Implement Period Management System

Use this prompt in the new project to build the period management system from scratch
with all the improvements over the original implementation.

---

## The Prompt

I need you to implement a full **period management system** for an inventory application.
A "period" is a calendar month+year that scopes all inventory data — dashboards, kardex
records, and movements are all filtered to the user's currently selected period. Periods
can be "closed" at month-end, which locks them against further edits and carries opening
balances forward to the next period.

Below is a complete specification. Build exactly this — no more, no less.

---

### Core concepts

- Every piece of inventory data (Kardex rows, movements) belongs to a `(month, year)` pair
- Each user has one **active period** per organization — all their reads and writes are
  scoped to it
- Month-end **closing** locks a period and creates opening-balance rows for the next period
- Closing is org-wide: once an admin closes a period, all users in that org are blocked
  from writing to it
- Multiple users in the same org can be in different active periods simultaneously

---

### Database (Prisma)

Add two models to the business schema:

```prisma
model ActivePeriod {
  id             Int      @id @default(autoincrement())
  userId         String
  organizationId String
  month          Int                       // 1–12
  year           Int                       // 4-digit, e.g. 2025
  updatedAt      DateTime @updatedAt

  @@unique([userId, organizationId])       // one active period per user per org
  @@map("active_periods")
}

model PeriodClosing {
  id             Int      @id @default(autoincrement())
  organizationId String
  month          Int
  year           Int
  closedAt       DateTime @default(now())
  closedBy       String                    // email of the user who closed it

  @@unique([organizationId, month, year])  // one closing record per org/month/year
  @@map("period_closings")
}
```

**Important:** Use 4-digit `year` (`Int`), not 2-digit. No conversion helpers needed.

---

### Backend — Period service

Create `src/api/period/period.service.ts` with these functions:

#### Helpers
```typescript
// Returns { month, year } for today
function currentPeriod(): { month: number; year: number }

// Returns the next calendar month (handles Dec → Jan year rollover)
function nextPeriod(month: number, year: number): { month: number; year: number }

// Returns "May 2025" style label
function buildPeriodLabel(month: number, year: number): string
```

#### `getActivePeriod(userId, organizationId)`
Looks up the user's active period. Fallback chain:
1. Row from `active_periods` for `(userId, organizationId)`
2. If no row: `nextPeriod(lastClosedPeriod)` — puts user in the month after the last closed one
3. If no closed periods exist at all: `currentPeriod()`

#### `setActivePeriod(userId, organizationId, month, year)`
Upsert on the `(userId, organizationId)` unique key.

#### `listAvailablePeriods(organizationId)`
Returns all distinct `(month, year)` pairs that have Kardex records for the org,
plus the current calendar month if not already in the list. Each item includes a
`closed: boolean` flag. Sorted oldest → newest.

#### `checkClosingStatus(organizationId)`
Returns:
```typescript
{
  periodsNeedingClose: Array<{ month: number; year: number; label: string }>;
  lastClosedPeriod: { month: number; year: number } | null;
}
```
Checks ALL calendar months between the oldest Kardex record and today. Returns the
full list of months that have Kardex records but no `PeriodClosing` record, sorted
oldest first. This way if a team skips multiple months, all of them surface at once.

#### `validatePreClose(organizationId, month, year)`
Finds all entry movements with zero inventory cost in the period. Excludes inventory
adjustment movements (they are allowed to have zero cost). Returns either
`{ valid: true }` or `{ valid: false, entries: [...], message: string }`.

#### `closePeriod(organizationId, month, year, closedBy)`
Atomic transaction:
1. Guard: throw if `PeriodClosing` already exists for this period
2. Call `validatePreClose` — throw if invalid
3. Compute next period
4. Load all Kardex rows for `(org, month, year)` with their lot children
5. Inside `$transaction`:
   - For each Kardex row: create a new row for next period with
     `openingBalance = closingBalance` from the current period
   - For each lot with `closingBalance > 0`: create a new lot row for next period
     with `openingBalance = closingBalance`. Skip zero-balance lots.
   - Include idempotency check on lot creation to prevent duplicates
   - Insert `PeriodClosing` record (locks the period)
6. Return `{ kardexCreated, lotsCreated, newPeriod }`

#### `isPeriodOpen(organizationId, month, year)`
Returns `true` if no `PeriodClosing` record exists for `(org, month, year)`.
Used by the movement service to block writes in closed periods.

---

### Backend — Context middleware

Create `src/middleware/context.middleware.ts`:

- Runs on every request after authentication
- Reads `activeOrganizationId` from `req.auth.session`
- Calls `getActivePeriod(userId, organizationId)` — this is a fast indexed DB
  lookup, one per request
- If the lookup fails, falls back to `currentPeriod()` (non-blocking, request continues)
- Sets `req.context = { organizationId, user, month, year }`
- Export a `getContext(req)` helper that controllers call:
  ```typescript
  const { organizationId, user, month, year } = getContext(req);
  ```

All controllers that return period-scoped data must use `getContext` — they must
NOT accept `month`/`year` as query params (the server is authoritative for the
active period).

---

### Backend — API routes

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/period/available` | List selectable periods |
| `GET` | `/api/period/active` | Get user's active period + `closed` flag |
| `POST` | `/api/period/active` | Set user's active period |
| `GET` | `/api/period/status` | Returns `periodsNeedingClose` list |
| `GET` | `/api/period/close/validate` | Pre-close validation for a given month/year |
| `POST` | `/api/period/close` | Execute month-end closing |

For `POST /api/period/active`, validate body with Zod:
```typescript
z.object({ month: z.number().int().min(1).max(12), year: z.number().int().min(2000) })
```

---

### Frontend — Period context

Create `lib/context/period-context.tsx`:

```typescript
interface PeriodContextValue {
  month: number;
  year: number;
  label: string;               // "May 2025"
  closed: boolean;             // period is locked
  loading: boolean;
  // Optimistically update context immediately, then confirm from server
  setActivePeriod: (month: number, year: number) => Promise<void>;
  refreshPeriod: () => Promise<void>;
}
```

**Important implementation detail for `setActivePeriod`:**
1. Immediately update `month`/`year`/`label` in state (optimistic update — UI feels instant)
2. Call `periodoApi.setActive(month, year)` in the background
3. Call `refreshPeriod()` to confirm the server's state
4. If server call fails, revert to previous state

Use a `generationId` ref (increment on every fetch) so stale responses from slow
network calls are discarded — only the latest fetch wins.

---

### Frontend — Period selection page

Create `app/(protected)/period/select/page.tsx`:

This is where the user lands after login and whenever they want to switch periods.

1. On load: call `getStatus()` and `listAvailable()` in parallel
2. If `periodsNeedingClose` has items, show the oldest one in `ClosingModal` inline
   before allowing navigation to any period — the user must close (or be a non-admin
   who sees "contact admin") before proceeding
3. After closing, re-check status. If more periods need closing, show the next one.
   Repeat until `periodsNeedingClose` is empty.
4. When user selects a period: call `setActivePeriod(month, year)` from context, then
   redirect to `callbackURL` query param (default `/`)

This page is the **single authoritative place** where closing is enforced. No guard
component is needed on other pages.

---

### Frontend — In-page period switcher

Create `components/shared/PeriodDropdown.tsx` for use in dashboard filter bars:

- Shows a combobox/popover with available periods
- On select:
  1. Call `context.setActivePeriod(month, year)` — optimistic update makes the label
     change immediately
  2. No redirect needed — the dashboard's `useEffect` will re-run because `month`/`year`
     changed in context (see below)
- Show a spinner while saving is in flight

---

### Frontend — How data pages must use the period

Every page that fetches period-scoped data **must** consume the period from context
and include it in fetch dependencies:

```typescript
// In any dashboard or list page:
const { month, year } = usePeriod();

useEffect(() => {
  fetchData({ month, year, ...otherFilters });
}, [month, year, ...otherFilters]);    // ← month and year are required here
```

If using React Query:
```typescript
useQuery({
  queryKey: ['dashboard', month, year, ...otherFilters],
  queryFn: () => fetchData({ ...otherFilters }),  // backend resolves period from session
})
```

The backend resolves the authoritative period from the DB, so the frontend does not
need to send `month`/`year` in the request body. But it MUST include them in the
query key / dependency array so React knows to re-fetch when the period changes.

---

### Frontend — Closing modal component

Create `components/period/ClosingModal.tsx`:

Steps:
1. **Idle** — show warning: "Month X needs to be closed before proceeding"
2. **Validating** — call `validatePreClose`; show spinner
3. **Invalid** — show list of entries with zero cost; block close button
4. **Closing** — call `closePeriod`; show spinner
5. **Done** — call `onClosed` callback

For non-admins: replace the close button with "Contact your administrator to close this period."
Admins see the full flow.

---

### What NOT to build

- **No `PeriodoGuard` component** — the period selector page handles all closing enforcement
- **No localStorage gates** — checking status on the selector page on every visit is fine
  (it is one lightweight API call, not a query per page navigation)
- **No 2-digit year helpers** — use 4-digit year throughout
- **No `necesitaCierre` that only checks one month** — use the full `checkClosingStatus`
  that returns the complete list

---

### Summary of improvements over the reference implementation

| Issue in reference | Fix in this implementation |
|---|---|
| `useEffect` missing `mes`/`ano` deps — stale data after period switch | All data pages include `month`/`year` in deps |
| Optimistic period switch — label lags behind | `setActivePeriod` updates context immediately |
| Race condition on fast period switches | `generationId` counter discards stale fetches |
| 2-digit year requiring `expandAno()` helper | 4-digit year stored natively |
| `necesitaCierre` only surfaces one unclosed month | `checkClosingStatus` returns full list, oldest first |
| `PeriodoGuard` stamps localStorage before user closes | Guard removed entirely; selector page enforces it |
| localStorage gate is per-browser, not per-user | No localStorage used |
