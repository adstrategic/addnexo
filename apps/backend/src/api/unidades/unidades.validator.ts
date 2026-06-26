import * as z from "zod";

export const unidadMedidaSchema = z.object({
  UMDescripcion: z
    .string({ error: "The description is required." })
    .min(1, "The description cannot be empty.")
    .max(30),
  UMNombre: z
    .string({ error: "The name/code is required." })
    .min(1, "The name/code cannot be empty.")
    .max(10, "The name/code cannot exceed 10 characters."),
});

export const actualizarUnidadMedidaSchema = unidadMedidaSchema.partial();

export type ActualizarUnidadMedidaDto = z.infer<
  typeof actualizarUnidadMedidaSchema
>;
export type UnidadMedidaDto = z.infer<typeof unidadMedidaSchema>;
