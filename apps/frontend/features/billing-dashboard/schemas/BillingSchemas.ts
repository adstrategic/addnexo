import { z } from "zod";

export const billingStatusSchema = z.enum(["paid", "pending", "overdue"]);
export const paymentMethodSchema = z.enum([
  "Bank Transfer",
  "Credit Card",
  "Check",
  "Cash",
]);

export const billingInvoiceSchema = z.object({
  id: z.string(),
  invoice_number: z.string(),
  client: z.string(),
  issue_date: z.string(),
  due_date: z.string(),
  amount: z.number(),
  tax: z.number(),
  total: z.number(),
  status: billingStatusSchema,
  payment_method: paymentMethodSchema.nullable(),
  notes: z.string().optional(),
});

export const monthlyRevenueSchema = z.object({
  month: z.string(),
  revenue: z.number(),
  paid: z.number(),
});

export const methodDatumSchema = z.object({
  method: paymentMethodSchema,
  amount: z.number(),
});

export const billingDashboardResponseSchema = z.object({
  rows: z.array(billingInvoiceSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
  }),
  kpis: z.object({
    totalInvoices: z.number(),
    totalRevenue: z.number(),
    paidAmount: z.number(),
    outstandingAmount: z.number(),
  }),
  statusStats: z.object({
    paid: z.number(),
    pending: z.number(),
    overdue: z.number(),
  }),
  methodData: z.array(methodDatumSchema),
  monthlyData: z.array(monthlyRevenueSchema),
  filterOptions: z.object({
    clients: z.array(z.string()),
    vendors: z.array(z.string()),
  }),
});

export type BillingStatus = z.infer<typeof billingStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type BillingInvoice = z.infer<typeof billingInvoiceSchema>;
export type MonthlyRevenue = z.infer<typeof monthlyRevenueSchema>;
export type MethodDatum = z.infer<typeof methodDatumSchema>;
export type BillingDashboardResponse = z.infer<
  typeof billingDashboardResponseSchema
>;

/** Local UI filter state for the billing dashboard. */
export interface BillingFilterState {
  search: string;
  status: string;
  clientId?: number;
  vendorId?: number;
  dateFrom: string;
  dateTo: string;
}

export interface BillingDashboardQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  clientId?: number;
  vendorId?: number;
  dateFrom?: string;
  dateTo?: string;
}
