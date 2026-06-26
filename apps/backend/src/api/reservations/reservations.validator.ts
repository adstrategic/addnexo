import { z } from "zod";

// Schema for creating a reservation
export const createReservationSchema = z.object({
  dispatchOrderUId: z
    .number({
      error: "Dispatch order item ID is required",
    })
    .int()
    .positive("Dispatch order item ID must be positive"),
  invcaruniId: z
    .number({
      error: "Product ID is required",
    })
    .int()
    .positive("Product ID must be positive"),
  kardexLoteId: z
    .number({
      error: "Kardex lote ID is required",
    })
    .int()
    .positive("Kardex lote ID must be positive"),
  cantidad: z
    .number({
      error: "Quantity is required",
    })
    .int()
    .positive("Quantity must be greater than 0")
    .max(999999, "Quantity cannot exceed 999999"),
});

// Schema for listing reservations
export const listReservationsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  estado: z.enum(["ACTIVE", "EXPIRED", "RELEASED", "CONSUMED"]).optional(),
  productoId: z.coerce.number().int().positive().optional(),
  dispatchOrderUId: z.coerce.number().int().positive().optional(),
  dispatchOrderId: z.coerce.number().int().positive().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
});

// Schema for getting reservation by ID
export const getReservationByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// Schema for releasing a reservation
export const releaseReservationSchema = z.object({
  motivo: z
    .string()
    .max(100, "Motivo must be 100 characters or less")
    .optional(),
});

// Schema for getting reserved quantity by lote
export const getReservedQuantityByLoteSchema = z.object({
  kardexLoteId: z.coerce
    .number()
    .int()
    .positive("Kardex lote ID must be a positive number"),
});

// Type exports
export type CreateReservationDto = z.infer<typeof createReservationSchema>;
export type ListReservationsQuery = z.infer<typeof listReservationsSchema>;
export type ReleaseReservationDto = z.infer<typeof releaseReservationSchema>;
