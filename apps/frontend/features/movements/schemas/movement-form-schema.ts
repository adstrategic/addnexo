import { z } from "zod";
import { TipoMovimiento } from "@/features/movement-types";

/** One line: product, quantity, cost/price. Entrada uses header MVLote; exit manual uses line lots / lotesManual. */
export const lineaSchema = z.object({
  invcaruniId: z.coerce
    .number({ error: "Select the product" })
    .int()
    .positive(),
  MVCantidad: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  MVCostoPrecio: z.coerce
    .number()
    .min(0, "Cost/price must be greater than or equal to 0"),
  MVLote: z.string().trim().max(100).optional(),
  /** Lot document when using single-lot manual exit (with MVLote + MVCantidad). */
  MVLoteNroDocumento: z.string().trim().optional(),
  lotesManual: z
    .array(
      z.object({
        lote: z.string().trim().min(1),
        nroDocumento: z.string(),
        cantidad: z.number(),
      }),
    )
    .optional(),
  /**
   * Client-side sentinel set by MovementLineRow from the average-cost lookup.
   * Drives adjustment cost validation; never sent to the backend (the payload
   * builder lists fields explicitly so this is dropped).
   */
  _hasAvgCost: z.boolean().optional().default(false),
});

export type LineaFormData = z.infer<typeof lineaSchema>;

// Factory function para crear el schema con validaciones condicionales.
// periodMes/periodAno scope MVFecha to the active working period (not the
// calendar month), matching the date picker in MovementForm.
export const createMovementFormSchema = (
  tiposMovimiento: TipoMovimiento[],
  periodMes: number,
  periodAno: number,
) => {
  return z
    .object({
      grupoNro: z.coerce.number().int().positive().optional(),
      MVTipoMovimientoId: z.coerce
        .number({ error: "Select the movement type" })
        .int()
        .positive(),
      almacenId: z.coerce
        .number({ error: "Select the warehouse" })
        .int()
        .positive(),
      ciudadId: z.coerce.number({ error: "Select the city" }).int().positive(),
      MVClienteId: z.coerce.number().optional(),
      MVProveedorId: z.coerce.number().optional(),
      MVFecha: z.coerce.date({ error: "Select the movement date" }).refine(
        (fecha) => {
          const hoy = new Date();
          const periodYear = periodAno >= 100 ? periodAno : 2000 + periodAno;
          const isCurrentMonth =
            periodMes === hoy.getMonth() + 1 &&
            periodYear === hoy.getFullYear();
          const inicio = new Date(periodYear, periodMes - 1, 1);
          // Current period is capped at today; a past period spans its full month.
          const fin = isCurrentMonth
            ? hoy
            : new Date(periodYear, periodMes, 0);
          return fecha >= inicio && fecha <= fin;
        },
        {
          message: "Date must be within the active period",
        },
      ),
      MVEsCostoTemporalCero: z.boolean().default(false),
      MVNroDocumento: z
        .string({ error: "Document number is required." })
        .trim()
        .max(100, { message: "Document number cannot exceed 100 characters." }),
      /** Header lot / PO for entrada (same value applied to each line DTO). */
      MVLote: z.string().trim().max(100).optional(),
      MVDescuento: z.coerce.number().min(0).default(0),
      MVImpuesto: z.coerce.number().min(0).default(0),
      modoSalida: z
        .enum(["automatico", "manual"])
        .optional()
        .default("automatico"),
      lineas: z.array(lineaSchema).min(1, "Add at least one product item"),
    })
    .superRefine((data, ctx) => {
      if (!data.MVTipoMovimientoId || data.MVTipoMovimientoId <= 0) {
        return;
      }

      const tipo = tiposMovimiento.find(
        (t) => t.TId === data.MVTipoMovimientoId,
      );
      const esSalida = tipo?.TTipo === 2;
      const esEntrada = tipo?.TTipo === 1;
      const esAjuste = tipo?.TAjusteInventario === true;
      const entryWithoutCost = data.MVEsCostoTemporalCero === true;

      if (!data.lineas || data.lineas.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one product line",
          path: ["lineas"],
        });
        return;
      }

      if (esEntrada && !data.MVLote?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Lot / PO is required",
          path: ["MVLote"],
        });
      }

      data.lineas.forEach((linea, index) => {
        if (linea.invcaruniId <= 0) {
          ctx.addIssue({
            code: "custom",
            message: "Select the product",
            path: ["lineas", index, "invcaruniId"],
          });
        }
        if (linea.MVCantidad < 0.01) {
          ctx.addIssue({
            code: "custom",
            message: "Quantity must be greater than 0",
            path: ["lineas", index, "MVCantidad"],
          });
        }
        if (linea.MVCostoPrecio < 0) {
          ctx.addIssue({
            code: "custom",
            message: "Cost/price must be greater than or equal to 0",
            path: ["lineas", index, "MVCostoPrecio"],
          });
        }
        if (!esSalida && !esAjuste && entryWithoutCost && linea.MVCostoPrecio !== 0) {
          ctx.addIssue({
            code: "custom",
            message: "Cost must be 0 when entry without cost is checked",
            path: ["lineas", index, "MVCostoPrecio"],
          });
        }
        if (
          !esSalida &&
          !esAjuste &&
          !entryWithoutCost &&
          linea.MVCostoPrecio === 0
        ) {
          ctx.addIssue({
            code: "custom",
            message:
              "Cost must be greater than 0 or check the temporary zero cost option",
            path: ["lineas", index, "MVCostoPrecio"],
          });
        }
        // Adjustments only need a cost when the product has no average cost on
        // record (first-time registration). When it already has one, the backend
        // values the movement from the kardex avg cost.
        if (
          esAjuste &&
          !esSalida &&
          linea.invcaruniId > 0 &&
          !linea._hasAvgCost &&
          (linea.MVCostoPrecio ?? 0) <= 0
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Cost is required — this product has no average cost on record",
            path: ["lineas", index, "MVCostoPrecio"],
          });
        }
        if (esSalida && data.modoSalida === "manual") {
          const hasLotesManual =
            linea.lotesManual && linea.lotesManual.length > 0;
          const hasSingleLot =
            Boolean(linea.MVLote?.trim()) &&
            typeof linea.MVLoteNroDocumento === "string" &&
            linea.MVLoteNroDocumento.trim().length > 0;
          if (!hasLotesManual && !hasSingleLot) {
            ctx.addIssue({
              code: "custom",
              message: "Select at least one lot for this line",
              path: ["lineas", index, "lotesManual"],
            });
          } else if (hasLotesManual) {
            const totalLotes = linea.lotesManual!.reduce(
              (sum, l) => sum + l.cantidad,
              0,
            );
            if (Math.abs(totalLotes - linea.MVCantidad) > 0.001) {
              ctx.addIssue({
                code: "custom",
                message: "Lot quantities must match line quantity",
                path: ["lineas", index, "lotesManual"],
              });
            }
          }
        }
      });

      if (tipo?.TProv === true) {
        if (data.MVProveedorId === undefined || data.MVProveedorId <= 0) {
          ctx.addIssue({
            code: "custom",
            message: "Supplier is required",
            path: ["MVProveedorId"],
          });
        }
      }

      if (tipo?.TCliente === true && !esAjuste) {
        if (data.MVClienteId === undefined || data.MVClienteId <= 0) {
          ctx.addIssue({
            code: "custom",
            message: "Customer is required",
            path: ["MVClienteId"],
          });
        }
      }
    });
};

// Type export for form data (header + lineas; each line is LineaFormData)
export type MovementFormData = z.infer<
  ReturnType<typeof createMovementFormSchema>
>;

// Backend expects one full movement per line; we build it from header + line
export type MovementFormDataSingle = Omit<
  MovementFormData,
  "lineas" | "grupoNro"
> & {
  invcaruniId: number;
  MVCantidad: number;
  MVCostoPrecio: number;
  MVLote?: string;
  MVLoteNroDocumento?: string;
  MVCostoSalida?: number;
  lotesManual?: { lote: string; nroDocumento: string; cantidad: number }[];
};
