# Period Management & Inventory Closing — Architecture Reference

This document explains the full period-management system: how periods are stored,
how they filter data, how month-end closing works, where the stale-data bug lives,
and what a cleaner implementation would look like. Written as a reference to port
this logic to a new project.

---

## 1. Concepts

| Term | Meaning |
|---|---|
| **Period (Período)** | A calendar month+year pair stored as `(mes: 1-12, ano: 2-digit)` |
| **Active Period** | The period a user is currently "working in" — all reads and writes are scoped to it |
| **Closed Period** | A period locked after month-end closing — no new movements allowed |
| **PeriodoCierre** | DB record that marks a period as closed |
| **PeriodoActivo** | DB record that stores each user's current active period |

---

## 2. Database Schema

### `periodos_activos` — Active period per user
File: `apps/backend/prisma/schema/business.prisma`

```prisma
model PeriodoActivo {
  id             Int      @id @default(autoincrement())
  userId         String
  organizationId String
  mes            Int      @db.SmallInt   // 1–12
  ano            Int      @db.SmallInt   // 2-digit year, e.g. 25 = 2025
  updatedAt      DateTime @updatedAt

  @@unique([userId, organizationId])     // one active period per user per org
  @@map("periodos_activos")
}
```

**Design choice:** Period is stored per user, not per session. Multiple users in the
same org can be in different periods simultaneously (e.g., finance closes the month
while operations stays in the current month).

### `periodos_cierre` — Month-end lock records
```prisma
model PeriodoCierre {
  id             Int      @id @default(autoincrement())
  organizationId String
  mes            Int      @db.SmallInt
  ano            Int      @db.SmallInt
  cerradoEn      DateTime @default(now())
  cerradoPor     String   @db.VarChar(50)   // email of who closed it

  @@unique([organizationId, mes, ano])       // one closing record per org/month/year
  @@map("periodos_cierre")
}
```

**Design choice:** Closing is org-wide (not per user). Once closed by any admin, all
users in that org are blocked from creating movements in that period.

### Session model (auth context)
File: `apps/backend/prisma/schema/auth.prisma`, lines 23–39

```prisma
model Session {
  activeOrganizationId String?
  ...
}
```

The `activeOrganizationId` on the session is what the backend middleware reads to
resolve which organization each request belongs to. The period is then looked up
from `periodos_activos` using `(userId, activeOrganizationId)`.

---

## 3. Backend — Period Service

File: `apps/backend/src/api/periodo/periodo.service.ts`

### Helper utilities (lines 8–49)

```typescript
expandAno(ano)              // 25 → 2025
buildPeriodLabel(mes, ano)  // (5, 25) → "Mayo 2025"
nextPeriod(mes, ano)        // (12, 25) → { mes:1, ano:26 }  (year rollover)
currentPeriod()             // today's mes/ano using 2-digit year
```

### `getPeriodoActivo(userId, organizationId)` — lines 117–134
Looks up the user's active period. Falls back in this order:
1. Row from `periodos_activos` for `(userId, organizationId)`
2. If no row: `nextPeriod(lastClosedPeriod)` — puts user in the month after the last closed one
3. If no closed periods exist: `currentPeriod()` — today's calendar month

This fallback means a brand-new user always lands in a sensible period without
needing any explicit setup.

### `setPeriodoActivo(userId, organizationId, mes, ano)` — lines 139–150
Upsert on the `(userId, organizationId)` unique key. Atomic, no race conditions.

### `obtenerPeriodosDisponibles(organizationId)` — lines 67–107
Returns all distinct `(KMes, KAno)` pairs that have Kardex records, plus the
current calendar month if missing, decorated with a `cerrado` boolean.

### `necesitaCierre(organizationId)` — lines 177–222
Checks whether the **previous calendar month** has been closed yet:
1. Computes previous month relative to today
2. If org has no Kardex records → `necesitaCierre: false` (nothing to close)
3. Looks for a `PeriodoCierre` record for `(org, prevMes, prevAno)`
4. Returns `{ necesitaCierre, periodoACerrar, ultimoPeriodoCerrado }`

### `validarPreCierre(organizationId, mes, ano)` — lines 246–299
Pre-close validation. Finds all entry movements (`TTipo=1`) with zero inventory
cost (`MVCostoSalida = 0` or `MVEsCostoTemporalCero = true`). Inventory adjustments
(`TAjusteInventario = true`) are excluded — they are allowed to have zero cost.

### `cerrarMes(organizationId, mes, ano, usuario)` — lines 321–469
The atomic month-end closing transaction:

1. Guard: reject if `PeriodoCierre` already exists for this period
2. Pre-close validation: reject if any entry has zero cost
3. Compute next period with `nextPeriod(mes, ano)`
4. Load all `Kardex` rows for `(org, mes, ano)` with their `KardexLote` children
5. Inside `$transaction`:
   - For each `Kardex` row: create a new row for next period where
     `KExistenciaInicial = KExistenciaFin` (carry-forward of closing balance)
   - For each `KardexLote` with `KLExistenciaFin > 0`: create a new lot row for
     next period where `KLExistenciaInicial = KLExistenciaFin`
   - Zero-balance lots are NOT carried forward (line 404)
   - Idempotency check on lots (lines 406–418) prevents duplicate creation
   - Insert `PeriodoCierre` record (locks the period)
6. Return `{ kardexCreados, kardexLotesCreados, periodoNuevo }`

**This transaction is the core of the closing.** All three writes (Kardex, KardexLote,
PeriodoCierre) happen atomically — if any fails the period remains open and no
partial data is left.

### `esPeriodoAbierto(organizationId, mes, ano)` — lines 479–488
Single lookup on the `(org, mes, ano)` unique index. Returns `true` if no
`PeriodoCierre` exists (period is open). Used by the movement service to block
writes in closed periods.

---

## 4. Backend — Context Middleware

File: `apps/backend/src/middleware/context.middleware.ts`

```
Every request
  → extractContext middleware
    → reads activeOrganizationId from req.auth.session
    → calls getPeriodoActivo(userId, orgId)   ← DB lookup on every request
    → sets req.context = { organizationId, usuario, mes, ano }
  → controller calls getContext(req) to read mes/ano
  → passes mes/ano to service for filtering
```

Key lines:
- Line 39: `activeOrgId = req.auth?.session?.activeOrganizationId`
- Line 50: `const periodo = await getPeriodoActivo(userId, activeOrgId)`
- Line 65–72: `req.context = { organizationId, usuario, mes, ano }`
- Line 53–58: If lookup throws, fallback to current calendar month (non-blocking)

**Consequence:** The period is resolved fresh from the DB on **every request**.
This means that as soon as `setPeriodoActivo` writes a new period to the DB, the
very next API call from that user will use the new period — no cache to invalidate,
no JWT to re-issue.

The `getContext(req)` helper (lines 113–125) is then called in every controller that
needs org+period context:

```typescript
const { organizationId, usuario, mes, ano } = getContext(req);
```

---

## 5. Backend — API Routes

File: `apps/backend/src/api/periodo/periodo.routes.ts`

| Method | Path | Handler |
|---|---|---|
| `GET` | `/api/inventario/periodo/disponibles` | List selectable periods |
| `GET` | `/api/inventario/periodo/activo` | Get user's active period |
| `POST` | `/api/inventario/periodo/activo` | Set user's active period |
| `GET` | `/api/inventario/periodo/status` | Check if previous month needs closing |
| `GET` | `/api/inventario/periodo/cierre/validar` | Pre-close validation |
| `POST` | `/api/inventario/periodo/cierre` | Execute month-end closing |

---

## 6. How Period Filters Data — Backend Modules

### Dashboard
File: `apps/backend/src/api/dashboard/dashboard.service.ts`
- Controller (`dashboard.controller.ts`, line 15) calls `getContext(req)` to extract `mes`/`ano`
- Passes them directly into the service, which builds Prisma WHERE clauses with `KMes: mes, KAno: ano`

### Kardex list
File: `apps/backend/src/api/kardex/kardex.service.ts`, lines 10–67
- `listKardex` receives `mes`/`ano` from the controller
- Line 25–29: `where: { KMes: mes, KAno: ano }` — only rows for the active period are returned

### Movements (Movkar)
File: `apps/backend/src/api/movkar/movkar.service.ts`
- `listarMovimientos` (line 82–88): filters `MVFecha` to the month boundaries of the active period
- `validarMesCerrado` (lines 414–426): called before creating a movement; throws if
  `esPeriodoAbierto` returns `false`

---

## 7. Frontend — Period Context

File: `apps/frontend/lib/context/periodo-context.tsx`

```typescript
interface PeriodoContextValue {
  mes: number;           // 1–12
  ano: number;           // 2-digit year
  label: string;         // "Mayo 2025"
  cerrado: boolean;      // period is locked
  loading: boolean;      // initial fetch pending
  refreshPeriodo: () => Promise<void>;
}
```

- `PeriodoProvider` initialises to the current calendar month, then immediately
  fetches the real active period from `GET /api/inventario/periodo/activo` (line 48)
- The fetch runs once on mount (line 57–59)
- `refreshPeriodo` re-runs the same fetch and updates state
- The context wraps all `(protected)` routes via `app/(protected)/layout.tsx`

### Period selection flow

File: `apps/frontend/app/(protected)/period/select/page.tsx`

After login, the user lands here. The page:
1. Loads available periods (`listarDisponibles`) and closing status (`getStatus`) in parallel
2. When user clicks a period:
   - If the selected period is the current calendar month AND the previous month
     needs closing → intercept with `ClosingModal` inline
   - Otherwise → call `periodoApi.setActivo(mes, ano)`, then `refreshPeriodo()`,
     then redirect to `callbackURL`
3. After closing completes → re-check status → if clean, navigate to selected period

### DashboardFilterBar period switcher

File: `apps/frontend/components/shared/DashboardFilterBar.tsx`, lines 51–133

A period dropdown embedded in the inventory dashboard's filter bar. When a different
period is selected (lines 67–82):
1. `periodoApi.setActivo(p.mes, p.ano)` — writes new period to DB
2. `refreshPeriodo()` — updates PeriodoContext state with new mes/ano/label

### Period Guard

File: `apps/frontend/components/periodo/periodo-guard.tsx`

Mounted inside the protected layout alongside the main content. Checks once per
page load (with a 24-hour localStorage gate) whether the previous month needs
closing. If yes, shows a full-screen overlay with `ClosingModal`. Non-admins see
a "contact admin" message instead of the close button.

---

## 8. Authentication ↔ Period Connection

```
User signs in
  → Better Auth creates Session with activeOrganizationId
  → Frontend redirects to /period/select?callbackURL=/
  → User selects a period
  → periodoApi.setActivo(mes, ano) → upserts periodos_activos row
  → refreshPeriodo() → PeriodoContext updated
  → Redirect to callback URL

Subsequent page loads
  → PeriodoProvider mounts → GET /api/inventario/periodo/activo
  → Backend middleware reads session.activeOrganizationId + userId
  → Looks up periodos_activos → returns stored mes/ano
  → PeriodoContext reflects server state
```

The period is **not embedded in the JWT or session token**. It lives in the DB,
resolved fresh per request in the middleware. This is correct because the period
can change at any time without requiring a re-login.

---

## 9. Known Bug — Stale Data After Period Switch

### Root cause

File: `apps/frontend/components/inventory/InventoryDashboard.tsx`, lines 92–164

The main `useEffect` that fetches dashboard data has this dependency array:

```typescript
useEffect(() => {
  // fetch inventoryDashboardApi.getDashboard(...)
}, [
  filters.country,
  filters.product,
  filters.invcaruniId,
  filters.group,
  productPage,
  kardexSearch,
  // ⚠️ mes and ano are NOT here
]);
```

`InventoryDashboard` does **not** call `usePeriodo()`. It relies entirely on the
backend to resolve the period. But the dashboard's `useEffect` only re-runs when
its filter state changes — not when the active period changes.

**What happens when the user switches periods from the DashboardFilterBar:**
1. `DashboardFilterBar/PeriodFilter.handleSelect` runs
2. `periodoApi.setActivo(p.mes, p.ano)` → DB updated ✓
3. `refreshPeriodo()` → PeriodoContext state updated ✓ (label in navbar changes)
4. `DashboardFilterBar` re-renders with new label ✓
5. **`InventoryDashboard`'s `useEffect` does NOT re-run** — its deps haven't changed
6. User sees the old period's data until they change a filter or reload

### Fix

Import `usePeriodo` in `InventoryDashboard` and add `mes`/`ano` to the dependency
array:

```typescript
// at the top of InventoryDashboard
const { mes, ano } = usePeriodo();

// in the useEffect deps:
}, [filters.country, filters.product, filters.invcaruniId, filters.group,
    productPage, kardexSearch, mes, ano]);   // ← add these two
```

The same pattern applies to any other page that calls a period-scoped API without
period values in its fetch dependencies.

---

## 10. Current Approach Assessment

### What works well

- **DB-resident period, resolved per-request in middleware.** No JWT refresh needed
  when the period changes. The period is available to every backend handler with a
  single `getContext(req)` call.
- **Atomic closing transaction.** Kardex carry-forward, lot carry-forward, and the
  `PeriodoCierre` lock are all committed together. A failure leaves the period open
  with no partial data.
- **Per-user active period.** Multiple users can work in different periods
  simultaneously without interfering with each other.
- **Fallback chain in `getPeriodoActivo`.** A brand-new user always gets a sensible
  default without any manual setup.
- **Zero-cost entry validation before close.** Prevents closing with incorrect
  costing data.

### What could be improved

#### 1. Frontend — period as a React dependency (the active bug)

Currently, dashboard and kardex pages do not include `mes`/`ano` from context in
their fetch `useEffect` dependency arrays. They rely on the backend to "just know"
the period, which works for the initial load, but breaks after an in-page period
switch.

**Recommended fix:** Consume `usePeriodo()` in every page that fetches period-scoped
data and include `mes`/`ano` in the query dependencies. If using React Query, make
the period part of the query key: `['dashboard', mes, ano, ...otherFilters]`.

#### 2. Race condition in period switching

Current flow in `DashboardFilterBar` (lines 72–74):
```typescript
await periodoApi.setActivo(p.mes, p.ano);  // write to DB
await refreshPeriodo();                     // read from DB
// refetch data (doesn't happen automatically — this is the bug)
```

If the user switches periods very quickly, a stale `refreshPeriodo` response could
arrive after a second switch and overwrite the correct period in context. The context
uses plain `useState` with no cancellation.

**Recommended fix:** Use an `AbortController` or a `generationId` counter in the
context's fetch so older fetches are discarded.

#### 3. Period stored as 2-digit year

`ano` is stored as `SmallInt` with a 2-digit convention (e.g. `25` for 2025). This
requires the `expandAno()` helper everywhere a 4-digit year is needed and creates
year-2100 ambiguity.

**Recommended fix (new project):** Store `ano` as a 4-digit integer. The database
cost is negligible (`Int` vs `SmallInt`) and it removes the entire helper function
and the mental overhead of the conversion.

#### 4. `necesitaCierre` only checks the immediately previous month

If a team skips two months without closing, `necesitaCierre` only surfaces the most
recent unclosed month. The modal must be dismissed and re-opened to close the second
one.

**Recommended fix:** Return a list of all unclosed months that have Kardex records,
sorted oldest-first, so the user is guided through them in order.

#### 5. Closing status check in `PeriodoGuard` runs every page load (with 24h gate)

The guard writes to `localStorage` to avoid hammering the API, but:
- The 24h window means a period that needed closing can be silently skipped until
  the next day
- `localStorage` is per-browser; if the same user logs in from a different machine
  the gate won't be there

**Recommended fix:** Move the "has closing been dismissed today" state to the DB or
session, or simply call the status endpoint on route change to the period selector
rather than on every page load.

#### 6. No optimistic update on period switch

After the user clicks a new period in the dropdown, there is a short window where
the label still shows the old period (while `setActivo` + `refreshPeriodo` are in
flight). The `saving` spinner is shown in the dropdown but the main data area
doesn't signal loading.

**Recommended fix:** Optimistically update the context's `mes`/`ano`/`label`
immediately when `setActivo` is called, then confirm with the server's response.
This makes the UI feel instant.

#### 7. Per-request DB lookup in middleware

Every request calls `getPeriodoActivo(userId, orgId)`, which is a single indexed
PK lookup and is fast. However, at higher request rates this adds latency and DB
load.

**Alternative:** Encode the active period in a short-lived cookie (e.g. 5-minute
TTL) that the middleware reads first. If the cookie is present and not expired, skip
the DB call. Invalidate the cookie when `setPeriodoActivo` is called. This is an
optional optimisation — the current approach is fine for typical usage.

---

## 11. File Index

### Backend
| File | Role |
|---|---|
| `apps/backend/src/api/periodo/periodo.service.ts` | All period business logic |
| `apps/backend/src/api/periodo/periodo.controller.ts` | HTTP handlers |
| `apps/backend/src/api/periodo/periodo.routes.ts` | Route definitions |
| `apps/backend/src/api/periodo/periodo.validator.ts` | Zod input validation |
| `apps/backend/src/middleware/context.middleware.ts` | Per-request period resolution |
| `apps/backend/src/api/kardex/kardex.service.ts` | Filters kardex by mes/ano |
| `apps/backend/src/api/movkar/movkar.service.ts` | Validates closed period on write |
| `apps/backend/src/api/dashboard/dashboard.service.ts` | Period-scoped KPIs |
| `apps/backend/prisma/schema/business.prisma` | PeriodoActivo, PeriodoCierre models |
| `apps/backend/prisma/schema/auth.prisma` | Session with activeOrganizationId |

### Frontend
| File | Role |
|---|---|
| `apps/frontend/lib/context/periodo-context.tsx` | Global React context for active period |
| `apps/frontend/lib/api/periodo.ts` | API client functions |
| `apps/frontend/app/(protected)/layout.tsx` | Mounts PeriodoProvider + PeriodoGuard |
| `apps/frontend/app/(protected)/period/select/page.tsx` | Post-login period selection page |
| `apps/frontend/components/shared/DashboardFilterBar.tsx` | In-page period switcher dropdown |
| `apps/frontend/components/periodo/closing-modal.tsx` | Month-end closing wizard |
| `apps/frontend/components/periodo/period-selector.tsx` | Period grid selector |
| `apps/frontend/components/periodo/periodo-guard.tsx` | Closing reminder overlay |
| `apps/frontend/components/inventory/InventoryDashboard.tsx` | **Bug location** — missing mes/ano in useEffect deps |

---

## 12. Recommended Architecture for New Project

```
DB: two tables
  ├─ active_periods (user_id, org_id, month, year)  ← 4-digit year
  └─ period_closings (org_id, month, year, closed_at, closed_by)

Backend middleware
  └─ resolves (org_id, month, year) from DB on every request
     → attaches to req.context
     → all services read from req.context

Frontend
  ├─ PeriodoContext — holds { mes, ano, label, cerrado }
  │   ├─ fetched once on mount
  │   └─ refreshPeriodo() called after every setActivo()
  ├─ Every page that fetches period-scoped data:
  │   └─ const { mes, ano } = usePeriodo()
  │      useEffect(..., [mes, ano, ...otherFilters])  ← include period in deps
  └─ Period switch flow:
      1. periodoApi.setActivo(mes, ano)  — optimistically update context
      2. refreshPeriodo()                — confirm from server
      3. data-fetching effects re-run   — because mes/ano changed in deps
```

The key insight is that the period must appear in frontend query dependency arrays
just like any other filter. The backend resolving it server-side is correct for
security (you can't pass an arbitrary period and bypass the server's authoritative
value), but the frontend still needs to know when it changed so it can re-fetch.
