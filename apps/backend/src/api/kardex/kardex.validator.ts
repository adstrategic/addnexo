import { z } from "zod";

export const listKardexSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  almacenId: z.coerce.number().int().positive().optional(),
  productoId: z.coerce.number().int().positive().optional(),
});

export const getKardexBySecuenciaSchema = z.object({
  sequence: z.coerce.number().int().positive(),
});

export const updateKardexSettingsSchema = z.object({
  KExistenciaMin: z.coerce.number().int().min(0).optional(),
  KExistenciaMax: z.coerce.number().int().min(0).optional(),
  KTiempoReposicion: z.coerce.number().int().min(0).optional(),
  KNroTarjeta: z.string().max(6).optional(),
  KUltimoDetalle: z.string().max(20).optional(),
});

export const listKardexLotesSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  ciudadId: z.coerce.number().int().positive().optional(),
});

export const getKardexLotesByKardexIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const getLotesDisponiblesSchema = z.object({
  productoId: z.coerce.number().int().positive(),
  almacenId: z.coerce.number().int().positive(),
});

export type ListKardexDto = z.infer<typeof listKardexSchema>;
export type UpdateKardexSettingsDto = z.infer<
  typeof updateKardexSettingsSchema
>;
export type ListKardexLotesDto = z.infer<typeof listKardexLotesSchema>;
export type GetLotesDisponiblesDto = z.infer<typeof getLotesDisponiblesSchema>;
