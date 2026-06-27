import { z } from "zod";

export const crearMovimientoSchema = z
  .object({
    MVTipoMovimientoId: z
      .number({ error: "Movement type is required." })
      .int()
      .min(1, { message: "Movement type must be valid." }),

    /** Lot identifier (purchase order ref / same as operational lot in Kardex). */
    MVLote: z.string().trim().max(100).optional(),

    /** Lot document number when using single-lot manual exit (with MVLote + MVCantidad). */
    MVLoteNroDocumento: z.string().trim().min(1).optional(),

    MVProveedorId: z.number().int().optional().nullable(),

    MVClienteId: z.number().int().optional().nullable(),

    // Nuevos campos para selección manual de lotes
    modoSalida: z.enum(["automatico", "manual"]).optional(),

    lotesManual: z
      .array(
        z.object({
          lote: z
            .string()
            .trim()
            .min(1, { message: "Lot identifier required." }),
          nroDocumento: z
            .string()
            .min(1, { message: "Document number required." }),
          cantidad: z
            .number()
            .min(0.01, { message: "Quantity must be greater than 0." }),
        }),
      )
      .optional(),

    MVFecha: z.coerce.date({ error: "Date is required." }).refine(
      (fecha) => {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        // Validar que la fecha esté entre el inicio del mes actual y hoy
        return fecha >= inicioMes && fecha <= hoy;
      },
      {
        message:
          "Date must be between the start of the current month and today.",
      },
    ),

    MVNroDocumento: z
      .string({ error: "Document number is required." })
      .trim()
      .max(100, { message: "Document number cannot exceed 100 characters." }),

    MVCantidad: z
      .number({ error: "Quantity is required." })
      .min(0.01, { message: "Quantity must be greater than 0." })
      .max(9999999, { message: "Quantity cannot exceed 7 digits." }),

    MVCostoPrecio: z
      .number({ error: "Cost/price is required." })
      .min(0, { message: "Cost/price must be greater than or equal to 0." })
      .max(999999999.99, { message: "Cost/price is too high." }),

    MVEsCostoTemporalCero: z.boolean().optional().default(false),

    MVCostoSalida: z
      .number()
      .min(0, { message: "Exit cost must be greater than or equal to 0." })
      .max(9999999.99, { message: "Exit cost is too high." })
      .optional(),

    MVDescuento: z
      .number()
      .min(0, { message: "Discount must be greater than or equal to 0." })
      .max(999999.99, { message: "Discount is too high." })
      .optional()
      .default(0),

    MVImpuesto: z
      .number()
      .min(0, { message: "Tax must be greater than or equal to 0." })
      .max(999999.99, { message: "Tax is too high." })
      .optional()
      .default(0),

    // Campos opcionales para el frontend
    descripcionProducto: z.string().optional(),
    referenciaProducto: z.string().optional(),
    nombreProveedor: z.string().optional(),
    nombreCliente: z.string().optional(),

    // Información adicional para validaciones
    invcaruniId: z.number().int().min(1),
    almacenId: z.number().int().min(1),
    ciudadId: z.number().int().min(1), // Requerido para KardexLote
  })
  .refine(
    (data) => {
      // Validación: Si es salida manual, requiere lotesManual O (MVLote + MVLoteNroDocumento)
      if (data.modoSalida !== "manual") return true;
      const hasSingleLot =
        Boolean(data.MVLote?.trim()) &&
        typeof data.MVLoteNroDocumento === "string" &&
        data.MVLoteNroDocumento.trim().length > 0;
      return Boolean(data.lotesManual?.length) || hasSingleLot;
    },
    {
      message:
        "You must specify at least one lot (lotesManual or MVLote + MVLoteNroDocumento) when exit mode is manual.",
    },
  )
  .refine(
    (data) => {
      if (
        data.modoSalida !== "manual" &&
        data.modoSalida !== "automatico" &&
        !data.MVLote?.trim()
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Lot identifier is required when exit mode is not manual or FIFO automatic.",
    },
  )
  .refine(
    (data) => {
      // Validación: Si MVEsCostoTemporalCero = true, entonces MVCostoPrecio debe ser 0
      // (solo aplica para entradas, pero validamos aquí ya que el campo es requerido)
      if (data.MVEsCostoTemporalCero && data.MVCostoPrecio !== 0) {
        return false;
      }
      return true;
    },
    {
      message: "Cost/price must be 0 when marked as temporary zero cost.",
      path: ["MVCostoPrecio"],
    },
  );
export const buscarMovimientosSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional().default(""),
  tipoMovimiento: z.coerce.number().int().optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().optional(),
  kardexLoteId: z.coerce.number().int().optional(),
  proveedorId: z.coerce.number().int().optional(),
  clienteId: z.coerce.number().int().optional(),
  // Product-scoped filters used by the kardex dashboard transaction log
  invcaruniId: z.coerce.number().int().positive().optional(),
  group: z.string().optional(),
  country: z.string().optional(),
  nroDocumento: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? undefined : val,
    z.string().trim().max(100).optional(),
  ),
});

export const validarExistenciasSchema = z.object({
  kardexLoteId: z.number().int().min(1),
  cantidad: z.number().min(0.01),
  tipoMovimiento: z.number().int().min(1).max(2), // 1=Entrada, 2=Salida
});

// export const crearMovimientoCompletoSchema = z.object({
//   // Datos del movimiento
//   movimiento: movimientoKardexSchema,

// });

// export type MovimientoKardexDto = z.infer<typeof movimientoKardexSchema>;
/** Bulk create: array of movement DTOs (one per line), processed in one transaction. */
export const crearMovimientosBulkSchema = z.object({
  lineas: z
    .array(crearMovimientoSchema)
    .min(1, { message: "At least one line is required." })
    .max(500, { message: "Cannot exceed 500 lines per request." }),
});

export type CrearMovimientosBulkDto = z.infer<
  typeof crearMovimientosBulkSchema
>;

export type BuscarMovimientosOptions = z.infer<typeof buscarMovimientosSchema>;
export type ValidarExistenciasDto = z.infer<typeof validarExistenciasSchema>;
export type CrearMovimientoDto = z.infer<typeof crearMovimientoSchema>;

// Schemas auxiliares para operaciones específicas
export const consultarKardexSchema = z.object({
  invcaruniId: z.number().int().min(1),
  almacenId: z.number().int().min(1),
  lote: z.number().int().min(1),
  ciudadId: z.number().int().min(1),
  fechaInicio: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  fechaFin: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
});

export const calcularCostoPromedioSchema = z.object({
  kardexLoteId: z.number().int().min(1),
  nuevaCantidad: z.number().min(0.01),
  nuevoCosto: z.number().min(0),
  tipoOperacion: z.enum(["entrada", "salida"]),
});

export const actualizarCostoCeroSchema = z.object({
  nuevoCosto: z
    .number({ error: "New cost is required." })
    .min(0.01, { message: "New cost must be greater than 0." })
    .max(999999999.99, { message: "New cost is too high." }),
});

export const obtenerUltimoLoteSchema = z.object({
  invcaruniId: z.coerce.number().int().min(1),
  almacenId: z.coerce.number().int().min(1),
  nroDocumento: z.string().trim().max(100).optional(), // Optional for backward compatibility
});

/** Query params for GET /movkar/costo-promedio */
export const costoPromedioQuerySchema = z.object({
  invcaruniId: z.coerce.number().int().positive(),
  almacenId: z.coerce.number().int().positive(),
});

export type ConsultarKardexDto = z.infer<typeof consultarKardexSchema>;
export type CalcularCostoPromedioDto = z.infer<
  typeof calcularCostoPromedioSchema
>;
export type ActualizarCostoCeroDto = z.infer<typeof actualizarCostoCeroSchema>;
export type CostoPromedioQuery = z.infer<typeof costoPromedioQuerySchema>;
