import { TipoMovimiento, TipoPropositoMovkar } from "../types/server-types";
import { z } from "zod";

// Movement type form validation schema
export const movementTypeFormSchema = z.object({
  // Required fields
  TTipo: z
    .number({
      error: "Movement type is required",
    })
    .min(1, "Type must be 1 (Entry) or 2 (Exit)")
    .max(2, "Type must be 1 (Entry) or 2 (Exit)"),

  TClase: z
    .number({
      error: "Movement class is required",
    })
    .int("Class must be a whole number")
    .min(1, "Class must be between 1 and 99")
    .max(99, "Class must be between 1 and 99"),

  TDescripcion: z
    .string()
    .min(1, "Description is required")
    .max(50, "Description cannot exceed 50 characters"),

  TAbreviatura: z
    .string()
    .min(1, "Abbreviation is required")
    .max(10, "Abbreviation cannot exceed 10 characters"),

  // Optional purpose field
  TProposito: z.enum(TipoPropositoMovkar).nullish(),

  // Boolean configuration fields
  TAfecta: z.boolean().default(true),
  TPedido: z.boolean().default(false),
  TFactura: z.boolean().default(false),
  TProv: z.boolean().default(false),
  TCliente: z.boolean().default(false),
  TRequiere: z.boolean().default(false),
  TRecalcular: z.boolean().default(false),
  TAjusteInventario: z.boolean().default(false),
});

export const movementTypeResponseSchema = movementTypeFormSchema.extend({
  TId: z.number().int().positive(),
  TOrgSecuencia: z.number().int().positive(),
  TOrganizationId: z.string(),
});

// Infer the type from the schema
export type MovementTypeFormData = z.infer<typeof movementTypeFormSchema>;
export type ActualizarMovementTypeData = Partial<MovementTypeFormData>;

// Transform API data to form format (for editing)
export function transformFromApiFormat(
  apiData: TipoMovimiento,
): MovementTypeFormData {
  return {
    TTipo: apiData.TTipo,
    TClase: apiData.TClase,
    TDescripcion: apiData.TDescripcion,
    TAbreviatura: apiData.TAbreviatura,
    TAfecta: apiData.TAfecta,
    TPedido: apiData.TPedido,
    TFactura: apiData.TFactura,
    TProv: apiData.TProv,
    TCliente: apiData.TCliente,
    TRequiere: apiData.TRequiere,
    TRecalcular: apiData.TRecalcular,
    TAjusteInventario: apiData.TAjusteInventario,
    // Include TProposito only if it's null/undefined (can be assigned)
    // Otherwise exclude it (immutable once assigned)
    TProposito:
      apiData.TProposito === null || apiData.TProposito === undefined
        ? undefined
        : apiData.TProposito,
  };
}
