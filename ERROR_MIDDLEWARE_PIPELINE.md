# Backend Error Middleware & Frontend Alignment

A reference for how AddPosts handles errors end-to-end: from a Zod/business
failure in an Express route, through the central error handler, across the wire
as a single flat envelope, and into typed frontend handling (toasts + per-field
form errors).

Use this to compare against another project's approach. The defining trait here
is **one envelope shape for every error path** plus **one Zod contract shared by
both ends**.

---

## 1. The Contract: One Flat Error Envelope

Every non-2xx response from the backend — no matter what threw it — serializes to
the same JSON shape:

```jsonc
{
  "error": "Validation failed with 2 errors", // human-readable message (always present)
  "code":  "ERR_VALID",                        // stable machine code (enum)
  "fields": {                                   // optional: per-field validation messages
    "targets.0.platform": ["Invalid platform"],
    "scheduledAt":        ["Must be in the future"]
  },
  "redirectTo": "/setup",                       // optional: client should navigate here
  "readOnly":   true,                           // optional: subscription/read-only signal
  "details":    { /* ... */ }                   // optional: plan-limit metadata
}
```

Key properties:

- **`error`** and **`code`** are always present. `code` is a closed enum
  ([`ErrorCode`](apps/backend/src/errors/types.d.ts)) so the frontend can branch
  on it without string-matching messages.
- **`fields`** uses **dot-notation paths** (`targets.0.platform`,
  `targets.0.metadata.title`). This is the same path syntax both Zod and React
  Hook Form understand — which is what makes per-field alignment "free."
- Everything else (`redirectTo`, `readOnly`, `details`) is optional and only
  appears when the specific error type carries it.

The envelope type lives in two mirrored places:

| Side     | Type                | File |
|----------|---------------------|------|
| Backend  | `ErrorResponseBody` | [errorHandler.ts:9](apps/backend/src/middleware/errorHandler.ts#L9) |
| Frontend | `ApiErrorBody`      | [client.ts:28](apps/web/core/api/client.ts#L28) |

---

## 2. Pipeline Structure

```
                          BACKEND
  ┌─────────────────────────────────────────────────────────────┐
  │  Route handler                                                │
  │    │                                                          │
  │    ├─ validateRequest(schema)  ──► schema.parseAsync(body)    │
  │    │      │ ZodError                                          │
  │    │      └─► zodErrorToFieldValidationError()                │
  │    │              │ FieldValidationError (extends CustomError)│
  │    │              ▼                                            │
  │    ├─ throw EntityNotFoundError / ConflictError / ...         │
  │    │      (any CustomError subclass)                          │
  │    │                                                          │
  │    └─ Prisma / Multer / unknown error                         │
  │              │                                                │
  │              ▼  next(err)                                     │
  │      ┌──────────────────────────────────┐                    │
  │      │  errorHandler (last app.use)      │                    │
  │      │   CustomError   → status + body   │                    │
  │      │   MulterError   → 400 ERR_VALID   │                    │
  │      │   PlanLimit...  → status + details│                    │
  │      │   Prisma known  → 409/404/400     │                    │
  │      │   unknown       → 500 (masked)    │                    │
  │      └──────────────────────────────────┘                    │
  │              │  res.status(n).json({ error, code, fields? })  │
  └──────────────┼──────────────────────────────────────────────┘
                 │  HTTP (the one envelope)
  ┌──────────────▼──────────────────────────────────────────────┐
  │  apiFetch / xhrUpload                                         │
  │    !res.ok → parse envelope → throw ApiError(status, msg,     │
  │                                              code, fields)    │
  │                          FRONTEND                             │
  │    │                                                          │
  │    ├─ toastApiError(error)        → sonner toast             │
  │    └─ applyApiFieldErrors(error, setError) → RHF per-field   │
  └─────────────────────────────────────────────────────────────┘
```

### Backend layers

1. **Error model** — a base [`CustomError`](apps/backend/src/errors/CustomError.ts)
   holding `{ code, message, statusCode }`. Domain subclasses in
   [EntityErrors.ts](apps/backend/src/errors/EntityErrors.ts) default the code +
   status so route code just does `throw new EntityNotFoundError("Post not found")`.
   `FieldValidationError` adds the `fields` map; `BusinessRequiredError` /
   `SubscriptionRequiredError` add `redirectTo` / `readOnly`.

2. **Validation middleware** — [`validateRequest(schema)`](apps/backend/src/middleware/validate.ts)
   runs `schema.parseAsync(req.body)`, overwrites `req.body` with the *parsed/
   coerced* value, and on failure converts the `ZodError` into a
   `FieldValidationError` via
   [`zodErrorToFieldValidationError`](apps/backend/src/lib/zodError.ts), then
   `next(err)`. It does **not** send a response — it hands off to the central
   handler so validation errors share the exact same envelope as everything else.

3. **Central error handler** — [`errorHandler`](apps/backend/src/middleware/errorHandler.ts),
   registered **last** in [server.ts:69](apps/backend/src/server.ts#L69). It is a
   type-dispatch funnel: `CustomError` → serialize its fields; `MulterError`,
   `PlanLimitExceededError`, Prisma known errors → translate to the envelope;
   anything unknown → logged and masked as a generic 500 (full message only in
   development).

### Frontend layers

4. **Transport** — a single typed fetch wrapper
   [`apiFetch`](apps/web/core/api/client.ts) (and its progress-reporting twin
   [`xhrUpload`](apps/web/core/api/upload.ts) for multipart). On `!res.ok` it
   parses the envelope and throws a typed
   [`ApiError`](apps/web/core/api/client.ts#L35) carrying `status`, `message`,
   `code`, and `fields`. On success it optionally validates the body against a Zod
   schema and hard-fails with `ResponseValidationError` on drift.

5. **Presentation** — two consumers of `ApiError`:
   - [`toastApiError`](apps/web/core/toast.ts) — generic UX; every mutation
     `onError` funnels through it. Summarizes `fields` into the toast body.
   - [`applyApiFieldErrors`](apps/web/features/posts/forms/composeForm.ts#L144) —
     loops `error.fields` and calls RHF `setError(path, ...)` so each message
     lands on the exact form input.

---

## 3. How It Aligns With the Frontend

Three deliberate design choices keep the two ends in lock-step:

### a) One shared Zod schema, used on both ends

The same schema object (e.g. `CreatePostSchema` from
[`@addposts/schemas`](packages/schemas/src/post.ts)) is:

- imported by the backend route: `validateRequest(CreatePostSchema)`
  ([posts.ts:141](apps/backend/src/routes/posts.ts#L141)), and
- imported by the frontend form resolver
  ([composeForm.ts:15](apps/web/features/posts/forms/composeForm.ts#L15)).

So the client validates against the identical rules the server enforces. The
client catches most issues before the request; if anything slips through (or a
business rule only the server knows about fails), the server rejects with the
*same* error semantics.

### b) Dot-notation field paths are the lingua franca

`zodErrorToFieldValidationError` builds keys with `issue.path.join(".")`
(producing `targets.0.platform`). React Hook Form's `setError` accepts that exact
path syntax. No translation layer is needed — `applyApiFieldErrors` passes the
backend's key straight to `setError`. Cross-field refinements (empty Zod path)
bucket under `_errors`.

### c) Mirrored envelope types

`ErrorResponseBody` (backend) and `ApiErrorBody` (frontend) describe the same
shape. The frontend's `ApiError` class is the typed in-app representation; the
optional fields (`fields`, `redirectTo`, `readOnly`) line up one-to-one with the
backend error subclasses that emit them.

---

## 4. Patterns

| Pattern | Where | Why it matters |
|---|---|---|
| **Single error envelope** | errorHandler + apiFetch | Frontend has exactly one shape to parse; no special-casing per route. |
| **Central error funnel** (Express error middleware registered last) | [server.ts:69](apps/backend/src/server.ts#L69) | Routes `throw`/`next(err)` and never format responses themselves. |
| **Error-as-class hierarchy** | CustomError + subclasses | `throw new ConflictError()` is self-describing; status/code defaulted. |
| **Adapter: Zod → domain error** | zodErrorToFieldValidationError | Validation failures become ordinary `CustomError`s, so they take the same path as business errors. |
| **Validation middleware delegates, never responds** | validateRequest | One source of truth for response formatting (the handler). |
| **Parse-and-replace** | `req.body = await schema.parseAsync(...)` | Downstream handlers get coerced/typed data, not raw input. |
| **Shared schema package** | `@addposts/schemas` | Client and server validate identically; types are inferred, not duplicated. |
| **Typed transport boundary** | apiFetch → `ApiError` | The rest of the app catches one typed error, branches on `code`. |
| **Path-as-protocol** | dot-notation keys | Backend field keys feed RHF `setError` with zero mapping. |
| **Fail-closed on response drift** | `schema.safeParse` + `ResponseValidationError` | Wire-shape regressions surface immediately in dev, not as silent bad renders. |
| **Production masking** | unknown → generic 500 | Internal error details never leak; full detail kept for dev + logs. |

---

## 5. Summary — How It Works

1. A route either calls `validateRequest(schema)` or throws a domain error
   (`EntityNotFoundError`, `ConflictError`, …). Validation failures are converted
   from `ZodError` into a `FieldValidationError` carrying dot-notation `fields`.
2. All of these are (or become) a `CustomError` and propagate via `next(err)` to
   the **single** `errorHandler` registered last in the Express app. Non-custom
   errors (Multer, Prisma, plan limits, unknowns) are translated there into the
   same envelope; unknowns are logged and masked.
3. The handler emits one flat JSON shape — `{ error, code, fields?, redirectTo?,
   readOnly?, details? }` — with the appropriate HTTP status.
4. On the client, `apiFetch`/`xhrUpload` detect `!res.ok`, parse that envelope,
   and throw a typed `ApiError(status, message, code, fields)`.
5. Consumers handle it uniformly: `toastApiError` for general UX, and
   `applyApiFieldErrors` to drop `fields` straight into React Hook Form via
   `setError` — possible because backend field keys and RHF field paths use the
   **same** dot-notation, and because **both ends validate against the same Zod
   schema** from `@addposts/schemas`.

The net effect: adding a new error type means adding one `CustomError` subclass;
the entire transport + presentation pipeline already knows how to carry and show
it.
