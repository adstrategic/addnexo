import { z } from "zod";

// Period (mes/ano) is intentionally NOT part of the query: it is resolved
// server-side from the caller's active period via the context middleware.
export const inventoryDashboardQuerySchema = z.object({
  dateRange: z
    .enum(["30d", "60d", "90d", "6m", "1y", "Custom"])
    .optional()
    .default("6m"),
  country: z.string().optional().default("All"),
  product: z.string().optional().default("All"),
  invcaruniId: z.coerce.number().int().positive().optional(),
  group: z.string().optional().default("All"),
  search: z.string().optional().default(""),
  productPage: z.coerce.number().int().min(1).optional().default(1),
  productLimit: z.coerce.number().int().min(1).max(100).optional().default(10),
  lotPage: z.coerce.number().int().min(1).optional().default(1),
  lotLimit: z.coerce.number().int().min(1).max(100).optional().default(10),
  lotSearch: z.string().optional().default(""),
});

export type InventoryDashboardQueryDto = z.infer<
  typeof inventoryDashboardQuerySchema
>;

export const billingDashboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional().default(""),
  status: z
    .enum(["All", "paid", "pending", "overdue"])
    .optional()
    .default("All"),
  client: z.string().optional().default("All"),
  vendor: z.string().optional().default("All"),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type BillingDashboardQueryDto = z.infer<
  typeof billingDashboardQuerySchema
>;
