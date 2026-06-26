import { Prisma } from "@repo/db";

export type DecimalLike = null | number | Prisma.Decimal | string | undefined;

/** Coerce Prisma Decimal (or numeric string) to a JSON-safe number. */
export function toApiNumber(value: DecimalLike): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}

export function mapDecimalFields<T extends Record<string, unknown>>(
  entity: T,
  fields: readonly string[],
): T {
  const mapped = { ...entity } as Record<string, unknown>;
  for (const field of fields) {
    if (field in mapped && mapped[field] != null) {
      mapped[field] = toApiNumber(mapped[field] as DecimalLike);
    }
  }
  return mapped as T;
}
