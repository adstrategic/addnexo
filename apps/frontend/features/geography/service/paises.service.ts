import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import { z } from "zod";

const paisSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  codigo: z.string().optional(),
});

export type PaisOption = z.infer<typeof paisSchema>;

/** GET /geography/paises — matches backend searchPaisesHandler */
export async function searchPaises(
  q?: string,
  options?: { id?: number },
): Promise<PaisOption[]> {
  try {
    const params = options?.id
      ? { id: options.id }
      : { q: q ?? "" };

    const { data } = await apiClient.get<unknown[]>("/geography/paises", {
      params,
    });
    return z.array(paisSchema).parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}
