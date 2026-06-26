import { paginationMetaSchema } from "@/lib/api/types";
import { fixedDateFromPrisma } from "@/lib/date";
import { z } from "zod";
import { dispatchOrderHeaderSchema } from "./dispatch-order-schema";
import { clientResponseSchema } from "@/features/clients/schemas/ClientSchema";
import { vendorResponseSchema } from "@/features/vendors/schemas/VendorSchema";
import { cityResponseSchema } from "@/features/geography/schemas/cities.schema";

const nullableApiDate = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .nullable();

const invcaruniRelationSchema = z
  .object({
    CKDescripcion: z.string().optional(),
    CKPesoPromedioKg: z.number().optional(),
    origenPais: z.object({ nombre: z.string() }).loose().optional(),
  })
  .loose()
  .optional();

export const dispatchOrderEstadoSchema = z.enum([
  "DRAFT",
  "EMITTED",
  "DISPATCHED",
  "INVOICED",
  "ANULATED",
]);

export const dispatchOrderModoSalidaSchema = z.enum(["MANUAL", "AUTOMATICO"]);

/** Parsed dispatch order line item from API (Prisma DispatchOrderU + relations) */
export const dispatchOrderItemResponseSchema = z
  .object({
    DOUId: z.number().int().positive(),
    DOUInvcaruniId: z.number().int().positive(),
    // Prisma Decimal fields can arrive as numeric strings; coerce to be safe.
    DOUCantidad: z.coerce.number(),
    DOUVrUnitario: z.coerce.number(),
    DOUDescuento: z.coerce.number(),
    DOUTieneImpuesto: z.boolean(),
    DOULote: z.union([z.number(), z.string(), z.null()]).transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const n = Number(val);
      return Number.isNaN(n) ? null : n;
    }),
    DOUNroDocumento: z.string().nullable().optional(),
    DOUReservado: z.boolean().optional(),
    DOUModoSalida: dispatchOrderModoSalidaSchema.optional(),
    DOUPesoTotalKg: z.coerce.number().optional(),
    DOUVrBruto: z.coerce.number().optional(),
    DOUVrNeto: z.coerce.number().optional(),
    DOUDetalle: z.string(),
    creadoOModificado: nullableApiDate,
    invcaruni: invcaruniRelationSchema,
    tipoMovimiento: z.record(z.string(), z.unknown()).optional(),
  })
  .loose();

export const listDispatchOrdersParamsSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().optional(),
  estado: dispatchOrderEstadoSchema.optional(),
  clienteId: z.coerce.number().int().optional(),
  vendedorId: z.coerce.number().int().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
});

/** Full dispatch order from list/detail/mutation APIs */
export const dispatchOrderResponseSchema = dispatchOrderHeaderSchema
  .extend({
    DOGId: z.number().int().positive(),
    DOGOrgSecuencia: z.number().int().positive(),
    DOGNro: z.number().int(),
    DOGEstado: dispatchOrderEstadoSchema,
    DOGValorTotalNeto: z.number().optional(),
    DOGValorTotalBruto: z.number().optional(),
    DOGTotalDescuento: z.number().optional(),
    DOGTotalIVA: z.number().optional(),
    DOGPesoTotalKg: z.number().optional(),
    DOGFechaEmision: nullableApiDate,
    DOGFechaDespacho: nullableApiDate,
    DOGFechaVencimiento: nullableApiDate,
    DOGFechaFacturacion: nullableApiDate,
    DOGEmittedPdfNeedsWarehouseRefresh: z.boolean().optional(),
    DOGFechaCreado: z
      .union([z.string(), z.date()])
      .transform((val) =>
        val instanceof Date
          ? fixedDateFromPrisma(val)
          : fixedDateFromPrisma(new Date(val)),
      ),
    cltemae: clientResponseSchema,
    vendedor: vendorResponseSchema,
    ciudad: cityResponseSchema.optional(),
    dispatchOrderU: z.array(dispatchOrderItemResponseSchema),
    dispatchOrderReturns: z.array(dispatchOrderItemResponseSchema).optional(),
  })
  .loose();

export const dispatchOrderListResponseSchema = z.object({
  data: z.array(dispatchOrderResponseSchema),
  pagination: paginationMetaSchema,
});

export const dispatchOrderMutationResponseSchema = z.object({
  message: z.string().optional(),
  factura: dispatchOrderResponseSchema.optional(),
  dispatchOrder: dispatchOrderResponseSchema.optional(),
  data: dispatchOrderResponseSchema.optional(),
});

export const dispatchOrderItemsResponseSchema = z.object({
  items: z.array(dispatchOrderItemResponseSchema),
  warnings: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
});

export const movimientosSalidaResponseSchema = z.object({
  movimientos: z.array(z.record(z.string(), z.unknown())),
});

export const devolucionItemsResponseSchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())),
});

export const siguienteNumeroResponseSchema = z.object({
  siguienteNumero: z.number(),
});

export type ListDispatchOrdersParams = z.infer<
  typeof listDispatchOrdersParamsSchema
>;
export type DispatchOrderEstado = z.infer<typeof dispatchOrderEstadoSchema>;
export type DispatchOrderItemResponse = z.infer<
  typeof dispatchOrderItemResponseSchema
>;
export type DispatchOrderResponse = z.infer<typeof dispatchOrderResponseSchema>;
export type DispatchOrderListResponse = z.infer<
  typeof dispatchOrderListResponseSchema
>;
export type DispatchOrderMutationResponse = z.infer<
  typeof dispatchOrderMutationResponseSchema
>;
export type DispatchOrderItemsResponse = z.infer<
  typeof dispatchOrderItemsResponseSchema
>;
export type UpdateDispatchOrderItemResponse = DispatchOrderItemsResponse;
export type MovimientosSalidaResponse = z.infer<
  typeof movimientosSalidaResponseSchema
>;
export type DevolucionItemsResponse = z.infer<
  typeof devolucionItemsResponseSchema
>;
export type SiguienteNumeroResponse = z.infer<
  typeof siguienteNumeroResponseSchema
>;
