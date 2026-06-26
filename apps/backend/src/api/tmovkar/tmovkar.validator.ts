import { TipoPropositoMovkar } from "@repo/db";
import { z } from "zod";

const tipoMovimientoBaseSchema = z.object({
  TTipo: z
    .number({ error: "The type is required." })
    .refine((val) => val === 1 || val === 2, {
      message: "The type must be either 1 or 2.",
    }),
  TClase: z
    .number({ error: "The code is required." })
    .int()
    .min(1, { message: "The code must be at least 1." })
    .max(99, { message: "The code must be at most 99." }),
  TDescripcion: z
    .string({ error: "The description is required." })
    .min(1)
    .max(30),
  TAbreviatura: z
    .string({ error: "The abbreviation is required." })
    .min(1)
    .max(10),
  // TODO: Add TValor proximamente
  // TValor: z
  //   .number({ error: "The value is required." })
  //   .int()
  //   .min(0, { message: "The value must be at least 0." }),
  TAfecta: z.boolean({
    error: "You must indicate if it affects inventory.",
  }),
  TRequiere: z.boolean({
    error: "You must indicate if it requires a purchase order.",
  }),
  TPedido: z.boolean({
    error: "You must indicate if it requires a order.",
  }),
  TFactura: z.boolean({
    error: "You must indicate if it requires a invoice.",
  }),
  TProv: z.boolean({
    error: "You must indicate if it requires a provider.",
  }),
  TCliente: z.boolean({
    error: "You must indicate if it requires a customer.",
  }),
  TRecalcular: z.boolean({
    error: "You must indicate if it requires a recalculation.",
  }),
  TAjusteInventario: z
    .boolean({
      error: "You must indicate if it is an inventory adjustment.",
    })
    .default(false),
  TProposito: z.enum(TipoPropositoMovkar).nullable().optional(),
});

// Flags that cannot be combined with an inventory adjustment type
export const FLAGS_EXCLUYENTES_AJUSTE = [
  "TRequiere",
  "TPedido",
  "TFactura",
  "TProv",
  "TCliente",
  "TRecalcular",
] as const;

export const tipoMovimientoSchema = tipoMovimientoBaseSchema.superRefine(
  (data, ctx) => {
    if (!data.TAjusteInventario) return;
    for (const field of FLAGS_EXCLUYENTES_AJUSTE) {
      if (data[field]) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message:
            "This option must be disabled for an inventory adjustment type.",
        });
      }
    }
    if (!data.TAfecta) {
      ctx.addIssue({
        code: "custom",
        path: ["TAfecta"],
        message: "An inventory adjustment type must affect inventory.",
      });
    }
    if (data.TProposito != null) {
      ctx.addIssue({
        code: "custom",
        path: ["TProposito"],
        message: "An inventory adjustment type cannot have a purpose assigned.",
      });
    }
  },
);

// Partial updates are validated against the merged record in the service,
// since the payload alone cannot prove the exclusivity rule.
export const actualizarTipoMovimientoSchema =
  tipoMovimientoBaseSchema.partial();

export type TipoMovimientoDto = z.infer<typeof tipoMovimientoSchema>;
export type ActualizarTipoMovimientoDto = z.infer<
  typeof actualizarTipoMovimientoSchema
>;

export const listTiposMovimientoSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional().default(""),
});

export type ListTiposMovimientoOptions = z.infer<
  typeof listTiposMovimientoSchema
>;
