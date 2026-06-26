import * as z from "zod";

export const almacenSchema = z.object({
  ALCiudadId: z
    .number({
      error: "You need to assign a city",
    })
    .int()
    .positive("The selected city is not valid"),
  ALDireccion: z.string({ error: "The address is required." }).min(1).max(50),
  ALNombre: z
    .string({ error: "The name is required." })
    .min(1, "The name cannot be empty.")
    .max(50),
  ALResponsable: z
    .string({ error: "The responsible is required." })
    .min(1)
    .max(50),
  ALTelefono: z
    .string()
    .min(1, "The phone is required.")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "The phone must have a valid international format (e.g. +573011234567)",
    ),
});

export const actualizarAlmacenSchema = almacenSchema.partial();

export type ActualizarAlmacenDto = z.infer<typeof actualizarAlmacenSchema>;
export type AlmacenDto = z.infer<typeof almacenSchema>;
