# Inventory Adjustment & Movement Type Validation — Change Log

This document describes the end-to-end changes made to inventory adjustment logic and movement type validation. It is intended to help an agent rebuilding the project in a different stack understand the **business rules and the reasoning** behind each change, so the same logic can be reimplemented correctly.

---

## Overview of the Two Feature Areas

1. **Movement Type configuration (`tmovkar`)** — when marking a movement type as "Inventory Adjustment", a set of incompatible flags must be automatically cleared and locked both in the UI and on the server.

2. **Inventory adjustment movements (`movkar`)** — when registering a movement of a type flagged as inventory adjustment, the cost logic works differently from a normal importation or sale: the system should use the current average cost without recalculating it, and handle the first-time registration of a product as a special case.

---

## Part 1 — Movement Type: Inventory Adjustment Flag Constraints

### Background

A `TipoMovimiento` (movement type, table `tmovkar`) controls how a movement is processed. Each type has a set of boolean flags. When `TAjusteInventario = true`, the movement type is a stock correction — it cannot require supplier, client, purchase order, invoice, or avg-cost recalculation. These flags are semantically incompatible with an adjustment.

Previously, no validation existed for this: a user could create a movement type with `TAjusteInventario = true` and `TProv = true` at the same time. The form on the frontend didn't enforce anything either. The backend would accept the contradictory combination.

### Backend changes

**File:** `apps/backend/src/api/tmovkar/tmovkar.validator.ts`

The incompatible flags are declared in a constant:

```typescript
const inventoryAdjustmentIncompatibleFields = [
  "TPedido",    // Requires Client Purchase Order
  "TFactura",   // Requires Invoice
  "TProv",      // Requires Supplier
  "TCliente",   // Requires Client
  "TRequiere",  // Requires Supplier Purchase Order
  "TRecalcular" // Recalculates average cost
] as const;
```

A **Zod `superRefine`** runs on both create and update schemas and rejects any combination where `TAjusteInventario = true` along with any of the above flags set to `true`, or a non-null `TProposito`:

```typescript
const inventoryAdjustmentRefinement = (data, ctx) => {
  if (!data.TAjusteInventario) return;

  if (data.TProposito) {
    ctx.addIssue({ ... path: ["TProposito"] });
  }

  for (const field of inventoryAdjustmentIncompatibleFields) {
    if (data[field]) {
      ctx.addIssue({ ... path: [field] });
    }
  }
};
```

A **normalization transform** runs immediately after validation and forces all incompatible flags to `false` / `null` when `TAjusteInventario = true`. This acts as a server-side safety net even if bad data somehow passes:

```typescript
export function normalizeInventoryAdjustmentData<T>(data: T): T {
  if (!data.TAjusteInventario) return data;
  return {
    ...data,
    TPedido: false, TFactura: false, TProv: false,
    TCliente: false, TRequiere: false, TRecalcular: false,
    TProposito: null,
  };
}
```

This transform is applied via `.transform(normalizeInventoryAdjustmentData)` on the create schema, and explicitly called in the update service before writing to the DB.

**File:** `apps/backend/src/api/tmovkar/tmovkar.service.ts`

On **create** (line ~104):
```typescript
const normalizedData = normalizeInventoryAdjustmentData(data);
// then create with normalizedData
```

On **update** (line ~172): the current DB record is merged with the incoming patch, then normalization is applied to the merged object. Only the changed fields plus the forced incompatible fields are written back:
```typescript
const mergedData = { ...actual, ...data };
const normalizedData = normalizeInventoryAdjustmentData(mergedData);
const updateData = {
  ...data,
  ...(normalizedData.TAjusteInventario
    ? { TPedido: false, TFactura: false, TProv: false,
        TCliente: false, TRequiere: false, TRecalcular: false,
        TProposito: null }
    : {}),
};
```

Additionally, `TTipo` (entry vs. exit) and `TClase` (class) are **immutable after creation** — attempting to change them throws a validation error. `TProposito` (purpose) is also immutable after it has been assigned once; it can only be set when the current value is `null`.

### Frontend changes

**File:** `apps/frontend/features/movement-types/schemas/movement-type-schema.ts`

The frontend schema mirrors the backend validation with its own `superRefine`:

```typescript
export const movementTypeFormSchema = z.object({
  // ...all fields...
  TAjusteInventario: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (!data.TAjusteInventario) return;

  if (data.TProposito) {
    ctx.addIssue({ path: ["TProposito"], message: "Purpose must be none for inventory adjustment movement types." });
  }

  const incompatibleFlags = [
    { field: "TPedido", label: "Requires Client Purchase Order" },
    { field: "TFactura", label: "Requires Invoice" },
    { field: "TProv",   label: "Requires Supplier" },
    { field: "TCliente", label: "Requires Client" },
    { field: "TRequiere", label: "Requires Supplier Purchase Order" },
    { field: "TRecalcular", label: "Requires Recalculation of Average Cost" },
  ];

  for (const { field, label } of incompatibleFlags) {
    if (data[field]) {
      ctx.addIssue({ path: [field], message: `${label} cannot be enabled for inventory adjustment movement types.` });
    }
  }
});
```

**File:** `apps/frontend/features/movement-types/forms/form-fields/RequirementsFields.tsx`

The UI proactively resets and disables incompatible fields the moment `TAjusteInventario` is checked. It watches the checkbox value via `useWatch`:

```typescript
const tAjusteInventario = useWatch({ control, name: "TAjusteInventario" });

const applyInventoryAdjustmentConstraints = (checked: boolean) => {
  if (!checked) return;
  form.setValue("TPedido", false);
  form.setValue("TFactura", false);
  form.setValue("TProv", false);
  form.setValue("TCliente", false);
  form.setValue("TRequiere", false);
  form.setValue("TRecalcular", false);
  form.setValue("TProposito", undefined);
};
```

The `TAjusteInventario` checkbox triggers this when changed:
```tsx
onCheckedChange={(checked) => {
  const value = checked === true;
  field.onChange(value);
  applyInventoryAdjustmentConstraints(value);
}}
```

All other requirement checkboxes (`TProv`, `TCliente`) are rendered with `disabled={isLoading || tAjusteInventario}` so they cannot be interacted with while adjustment is active.

**Note:** The flags `TPedido`, `TFactura`, and `TRequiere` are not shown in the UI at all — they are internal flags not exposed to the user. Only `TProv` (Requires Supplier) and `TCliente` (Requires Client) appear as checkboxes.

**File:** `apps/frontend/features/movement-types/forms/form-fields/ConfigurationFields.tsx`

`TRecalcular` is disabled when adjustment is active:
```tsx
<Checkbox
  checked={field.value}
  onCheckedChange={field.onChange}
  disabled={isLoading || tAjusteInventario}
/>
```

The Purpose selector is also locked to "None" when adjustment is active:
```tsx
<Select
  value={tAjusteInventario ? "__NONE__" : field.value || undefined}
  disabled={isLoading || isLoadingPurposes || tAjusteInventario}
>
```

In edit mode, Purpose is displayed as read-only static text if it has already been assigned (immutability rule).

---

## Part 2 — Movement Registration: Inventory Adjustment Cost Logic

### Background

When registering a movement (table `movkar`), the cost handling for inventory adjustments is different from normal importations and sales. The three cost fields involved are:

| Field | Meaning |
|---|---|
| `MVCostoPrecio` | Input price from the form. For entries, it is the purchase price. Zeroed out on stored records. |
| `MVCostoUltimo` | The per-unit last/acquisition cost stored on the movement record. Set to `MVCostoPrecio`. |
| `MVCostoSalida` | The weighted average cost at the time of movement. Used for COGS calculations. |

For **normal importations** (`TRecalcular = true`): the user provides `MVCostoPrecio`, the system calculates a new weighted average and stores it as `MVCostoSalida`. The parent kardex (`KCostoPromedio`, `KCostoUltimo`) is updated.

For **inventory adjustments** (`TAjusteInventario = true`, `TRecalcular = false` by constraint): the user does not provide a cost — the existing avg cost is used to value the movement. The parent kardex avg cost is NOT recalculated. The adjustment just changes quantity while keeping the existing valuation.

### The problems that were fixed

1. **Cost was recorded as 0**: Adjustments were being stored with `MVCostoSalida = 0` and `MVCostoUltimo = 0` because the backend used `data.MVCostoPrecio` (which is 0 for adjustments) instead of the current avg cost.

2. **KardexLote and KardexDet cost fields stayed at 0**: The `preservarCostos` flag (which skips writing cost fields on lote/det records) was applied to all `TRecalcular = false` movements, including adjustments. For new lote/det records this meant the cost fields were never initialized.

3. **First-time registration was not handled**: When registering a product via adjustment for the first time (no previous kardex avg cost), the system needed to behave like an importation and set the avg cost on the kardex parent, lote, and det records. This was not implemented.

4. **Frontend showed a cost input for adjustments** (or didn't show it): No condition existed to show the cost input only when the product has no avg cost.

5. **Period filter missing on avg cost lookup**: The API endpoint that returns the current avg cost for a product was not filtering by the active period (month/year), so it could return a cost from a previous period.

### Backend changes

**File:** `apps/backend/src/api/movkar/movkar.service.ts`

#### Skip supplier/client validation for adjustments (line ~525)

```typescript
if (!devolucionDeCliente && !tipoMovimiento.TAjusteInventario) {
  await validarProveedorCliente(...);
}
```

Adjustments are stock corrections with no commercial partner, so this check is bypassed entirely.

#### Skip cost > 0 validation for adjustments (line ~536)

```typescript
if (
  tipoMovimiento.TTipo === 1 &&
  !tipoMovimiento.TAjusteInventario &&
  !data.MVEsCostoTemporalCero &&
  (data.MVCostoPrecio ?? 0) === 0
) {
  throw new Error("Cost/price must be greater than 0 ...");
}
```

Only non-adjustment entries require a cost > 0 (or the temporary-zero flag).

#### Inject current avg cost for adjustments with no user-provided cost (line ~553)

When an adjustment comes in with `MVCostoPrecio = 0` (the usual case — product already has avg cost), the backend injects the current kardex avg cost so value calculations are correct:

```typescript
let dataEntrada = data;
if (tipoMovimiento.TAjusteInventario && (data.MVCostoPrecio ?? 0) === 0) {
  const costoPromedio = Number(kardex.KCostoPromedio || 0);
  dataEntrada = { ...data, MVCostoPrecio: costoPromedio };
}
```

Only `MVCostoPrecio` is set here — not `MVCostoSalida`. The `procesarEntrada` function handles `MVCostoSalida` internally from `costoInventarioEntrada`.

#### First-time adjustment detection (line ~560)

If the user provided a cost AND the kardex has no avg cost yet, this is a new-product registration via adjustment. It should be treated like an importation so the kardex avg cost and last cost are properly initialized:

```typescript
const esPrimerRegistroAjuste =
  tipoMovimiento.TAjusteInventario &&
  (dataEntrada.MVCostoPrecio ?? 0) > 0 &&
  Number(kardex.KCostoPromedio || 0) === 0;

return await procesarEntrada(
  tx, kardex, dataEntrada, tipoMovimiento, organizationId,
  invcaruniId, almacenId, ciudadId, usuario,
  esPrimerRegistroAjuste ? true : calcularCostoPromedio,  // override
  devolucionDeCliente, mes, ano,
);
```

This detection is reliable because the frontend only shows the cost input when the avg cost is 0 (see frontend section below).

#### Cost fields on the Movkar record (inside `procesarEntrada`, line ~1212)

```typescript
MVCostoUltimo: costoCompra,       // purchase price (or user-provided cost for first-time adjustments)
MVCostoPrecio: 0,                 // always zeroed — the input price is not stored
MVCostoSalida: calcularCostoPromedio
  ? nuevoCostoPromedioCalculado
  : (data.MVCostoSalida ?? costoInventarioEntrada),
```

For subsequent adjustments: `calcularCostoPromedio = false`, so `MVCostoSalida` gets `costoInventarioEntrada` (the injected avg cost from the step above).

#### KardexLote and KardexDet cost fields (inside `procesarEntrada`, line ~1232)

The `preservarCostos` flag controls whether cost fields (`KLCostoUltimo`, `KLCostoPromedio`, `KDCostoUltimo`, `KDCostoPromedio`) are written during kardexLote/kardexDet updates. It was originally `true` for all `TRecalcular = false` movements, which meant adjustment lote/det records were created with cost = 0 and never updated.

The fix introduces `esAjusteSinRecalculo` to exempt adjustments from this rule:

```typescript
const esAjusteSinRecalculo =
  tipoMovimiento.TAjusteInventario && !calcularCostoPromedio;

const costoParaKardexLoteDet = calcularCostoPromedio
  ? costoInventarioEntrada
  : (data.MVCostoSalida ?? costoInventarioEntrada);

const costoPromedioParaLote = calcularCostoPromedio
  ? nuevoCostoPromedioCalculado
  : esAjusteSinRecalculo
    ? costoInventarioEntrada   // use current avg cost for adjustment lotes
    : 0;                       // other TRecalcular=false movements: don't touch

await actualizarKardexDet(
  tx, kardexDet.KDId, tipoMovimiento.TTipo, data.MVCantidad,
  costoParaKardexLoteDet,
  !calcularCostoPromedio && !esAjusteSinRecalculo,  // preservarCostos
);

await actualizarKardexLote({
  tx, kardexLoteId: kardexLote.KLId, tipoMovimiento: tipoMovimiento.TTipo,
  cantidad: data.MVCantidad, costoUltimo: costoParaKardexLoteDet,
  costoPromedioCalculado: costoPromedioParaLote,
  fechaMovimiento: data.MVFecha,
  preservarCostos: !calcularCostoPromedio && !esAjusteSinRecalculo,
});
```

**Why `preservarCostos` still exists for non-adjustment `TRecalcular=false` movements:** These are movements that operate between a cost-0 importation and its later cost update. The cost fields on their lote/det records should not be overwritten — they will be set correctly when the pending importation cost is updated. Adjustments create their own new lote records so this concern doesn't apply to them.

#### `actualizarKardexPadre` is NOT called for adjustments

The parent kardex avg cost (`KCostoPromedio`, `KCostoUltimo`) is only updated when `calcularCostoPromedio = true` (line ~1263):

```typescript
if (calcularCostoPromedio) {
  await actualizarKardexPadre(tx, kardex.KId, ...);
}
```

For subsequent adjustments `calcularCostoPromedio = false`, so the parent avg cost is left untouched — which is the correct behavior.

#### Period-filtered avg cost lookup

**File:** `apps/backend/src/api/movkar/movkar.service.ts` — `obtenerCostoPromedioProducto`  
**File:** `apps/backend/src/api/movkar/movkar.controller.ts` — `obtenerCostoPromedioHandler`

The kardex table has one record per product + warehouse + period (`KMes`, `KAno`). The endpoint that the frontend calls to determine whether a product has an avg cost now filters by the active period. The period is read from the session context (not from the request body):

```typescript
// Controller
const { organizationId, usuario, mes, ano } = getContext(req);
// ... pass mes, ano to service

// Service
export const obtenerCostoPromedioProducto = async (
  tx, organizationId, invcaruniId, almacenId,
  mes?: number, ano?: number,
) => {
  const kardex = await tx.kardex.findFirst({
    where: {
      KOrganizationId: organizationId,
      KInvcaruniId: invcaruniId,
      KAlmacenId: almacenId,
      ...(mes !== undefined && ano !== undefined ? { KMes: mes, KAno: ano } : {}),
    },
    select: { KCostoPromedio: true },
  });
  return { costoPromedio: Number(kardex?.KCostoPromedio || 0) };
};
```

`mes`/`ano` are optional so that other callers in the dispatch-order and invoice services (which don't have period context) continue working with the original `findFirst` behavior.

### Frontend changes

**File:** `apps/frontend/features/movements/schemas/movement-form-schema.ts`

A sentinel field `_hasAvgCost` is added to `lineaSchema`:

```typescript
_hasAvgCost: z.boolean().optional().default(false),
```

This field is set programmatically by `MovementLineRow` and is never sent to the backend (it is stripped when building the submission payload). It drives the conditional cost validation in `superRefine`:

```typescript
// In superRefine, inside the lineas.forEach loop:
if (esAjuste && !esSalida && linea.invcaruniId > 0 && !linea._hasAvgCost && (linea.MVCostoPrecio ?? 0) <= 0) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Cost is required — this product has no average cost on record",
    path: ["lineas", index, "MVCostoPrecio"],
  });
}
```

The existing cost validation for regular entries explicitly excludes adjustments:
```typescript
// Regular entry (no adjustment): cost must be > 0 or mark as temporary zero
if (!esSalida && !esAjuste && !entryWithoutCost && linea.MVCostoPrecio === 0) {
  ctx.addIssue({ ... });
}
```

**File:** `apps/frontend/features/movements/forms/MovementLineRow.tsx`

The hook `useCostoPromedio` is called when adjustment mode is active and a product + warehouse are selected. The API endpoint returns the avg cost for the current period (the period filter is handled server-side):

```typescript
const shouldFetchAvgCost =
  esAjusteInventario && productoId > 0 && (almacenId ?? 0) > 0;

const { costoPromedio, isLoading: isLoadingCosto } = useCostoPromedio({
  productoId: shouldFetchAvgCost ? productoId : 0,
  almacenId: shouldFetchAvgCost ? (almacenId ?? 0) : 0,
});

// Show cost input only when the product has no avg cost in the current period
const showAdjustmentCostInput =
  esAjusteInventario &&
  productoId > 0 &&
  (almacenId ?? 0) > 0 &&
  !isLoadingCosto &&
  costoPromedio === 0;
```

The `_hasAvgCost` sentinel and `MVCostoPrecio` reset are managed in a `useEffect` that reacts to the fetched avg cost:

```typescript
useEffect(() => {
  if (!esAjusteInventario) return;
  if (!productoId || productoId <= 0 || !almacenId || almacenId <= 0) {
    setValue(`lineas.${index}.MVCostoPrecio`, 0);
    setValue(`lineas.${index}._hasAvgCost`, false);
    return;
  }
  if (isLoadingCosto) return;

  setValue(`lineas.${index}._hasAvgCost`, costoPromedio > 0);
  if (costoPromedio > 0) {
    // Avg cost exists — zero out the cost field; backend will use the avg cost
    setValue(`lineas.${index}.MVCostoPrecio`, 0);
  }
  // Avg cost = 0 → leave MVCostoPrecio for the user to fill in
}, [esAjusteInventario, productoId, almacenId, costoPromedio, isLoadingCosto, index, setValue]);
```

The cost cell in the table renders three states:
- **Loading spinner** (`Loader2`): while the avg cost API call is in flight
- **Cost input**: when `showAdjustmentCostInput = true` (product has no avg cost in current period)
- **Empty cell** (`null`): when product has an avg cost — no input shown, no cost required

```tsx
<TableCell>
  {esAjusteInventario && productoId > 0 && (almacenId ?? 0) > 0 && isLoadingCosto ? (
    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  ) : (!esAjusteInventario || showAdjustmentCostInput) ? (
    <FormField
      control={control}
      name={`lineas.${index}.MVCostoPrecio`}
      render={...}
    />
  ) : null}
</TableCell>
```

**File:** `apps/frontend/features/movements/forms/MovementForm.tsx`

The cost column header was previously hidden entirely for adjustments. It now always renders, with a label that varies by movement type:

```tsx
// Before:
{!esAjuste && (
  <TableHead>{esSalida ? "Sale price" : "Inventory cost"}</TableHead>
)}

// After:
<TableHead>
  {esSalida ? "Sale price" : esAjuste ? "Unit cost" : "Inventory cost"}
</TableHead>
```

The `newLineaDefault` object (default values for a new line added to the form) includes `_hasAvgCost: false`:
```typescript
const newLineaDefault = {
  invcaruniId: 0,
  MVCantidad: 0,
  MVCostoPrecio: 0,
  _hasAvgCost: false,
  // ...
};
```

---

## Part 3 — Supplier / Client Validation: Backend Now Enforces Movement Type Flags

### Background

Each movement type has two flags that express commercial partner requirements:

- `TProv` — the movement type **requires a supplier** to be selected (only meaningful for entry movements, `TTipo = 1`)
- `TCliente` — the movement type **requires a customer** to be selected (only meaningful for exit movements, `TTipo = 2`)

Previously, these flags were only enforced on the **frontend** — the form would show a supplier or customer selector and block submission if empty. The **backend accepted any movement regardless**, so anyone calling the API directly (or with a stale frontend) could register a movement without a supplier/customer even when the movement type required one. The backend also never verified that a provided supplier or customer ID actually belonged to the organization.

### Backend changes

**File:** `apps/backend/src/api/movkar/movkar.service.ts` — `validarProveedorCliente` (line ~431)

A new validation function reads the flags directly from the `tmovkar` record and enforces them:

```typescript
export const validarProveedorCliente = async (
  tipoMovimiento: any,
  proveedorId: number | null,
  clienteId: number | null,
  organizationId: string,
  tx?: Prisma.TransactionClient,
) => {
  const shouldRequireProveedor =
    tipoMovimiento.TTipo === 1 && tipoMovimiento.TProv === true;
  const shouldRequireCliente =
    tipoMovimiento.TTipo === 2 && tipoMovimiento.TCliente === true;

  if (shouldRequireProveedor && !proveedorId) {
    throw new Error("Supplier required for this type of movement");
  }

  if (shouldRequireCliente && !clienteId) {
    throw new Error("Client required for this type of movement");
  }

  // If IDs are present, validate they exist in the organization (even when not required)
  if (proveedorId) {
    const proveedor = await client.mproved.findFirst({
      where: { MPId: proveedorId, MPOrganizationId: organizationId },
    });
    if (!proveedor) throw new Error("Supplier not registered");
  }

  if (clienteId) {
    const cliente = await client.cltemae.findFirst({
      where: { CId: clienteId, COrganizationId: organizationId },
    });
    if (!cliente) throw new Error("Client not registered");
  }
};
```

Two things are enforced here that the frontend alone could not guarantee:

1. **Required flag enforcement**: If `TProv = true` and no `proveedorId` is provided, the movement is rejected. Same for `TCliente`. The source of truth is the movement type record in the database, not whatever the frontend sent.

2. **Organization ownership check**: If a supplier or customer ID is provided (even when not strictly required by the movement type), it must exist and belong to the same organization. This prevents cross-tenant data access.

This function is called inside `crearMovimientoConTx`, **but only for non-adjustment movements** (line ~525):

```typescript
if (!devolucionDeCliente && !tipoMovimiento.TAjusteInventario) {
  await validarProveedorCliente(
    tipoMovimiento,
    data.MVProveedorId || null,
    data.MVClienteId || null,
    organizationId,
    tx,
  );
}
```

Inventory adjustments are excluded because `TAjusteInventario = true` forces `TProv = false` and `TCliente = false` by the normalization rules in Part 1, so there is never a commercial partner requirement for adjustments.

### Frontend validation (unchanged in shape, aligned in behavior)

**File:** `apps/frontend/features/movements/schemas/movement-form-schema.ts`

The frontend still performs the same checks via `superRefine` — reading the flags from the selected movement type object passed into the schema factory:

```typescript
// Supplier: checked for any movement type where TProv = true
if (selectedTipoMovimiento?.TProv === true) {
  if (data.MVProveedorId === undefined || data.MVProveedorId <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Supplier is required",
      path: ["MVProveedorId"],
    });
  }
}

// Customer: checked for exits where TCliente = true, but NOT for adjustments
if (selectedTipoMovimiento?.TCliente === true && !esAjuste) {
  if (data.MVClienteId === undefined || data.MVClienteId <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Customer is required",
      path: ["MVClienteId"],
    });
  }
}
```

The `!esAjuste` guard on the client check is consistent with the backend skip: adjustment movement types cannot have `TCliente = true` (enforced by Part 1 normalization), so this guard is defensive but the flags themselves will always be false for adjustments.

### What changed end-to-end

| Layer | Before | After |
|---|---|---|
| Frontend | Checked `TProv`/`TCliente` flags and blocked form submission | Same — unchanged |
| Backend (required check) | Not enforced — API accepted movements with no supplier/client | Now throws if required flag is set and ID is missing |
| Backend (ownership check) | Not enforced — any ID was accepted | Now verifies the supplier/client belongs to the organization |
| Adjustments | Frontend conditionally required client | Backend skips validation entirely; frontend `!esAjuste` guard prevents false client requirement |

---

## Summary: Complete Behavior by Scenario

| Scenario | `calcularCostoPromedio` | Cost input shown | `MVCostoPrecio` stored | `MVCostoSalida` stored | Kardex parent updated |
|---|---|---|---|---|---|
| Normal importation | `true` | Always | `0` (zeroed) | New weighted avg | Yes (`KCostoPromedio`, `KCostoUltimo`) |
| Normal importation — cost-0 | `true` + flag | Always (disabled) | `0` | `0` | Not cost fields |
| Adjustment — product has avg cost | `false` | Never (hidden) | `0` | Current avg cost | No |
| Adjustment — product has NO avg cost (first time) | `true` (overridden) | Yes (user fills) | `0` | User-provided cost | Yes (initialized) |
| Exit / sale | n/a | Always (sale price) | Sale price | Pre-existing avg cost | No |
