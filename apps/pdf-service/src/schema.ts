import { z } from "zod";

export const invoicePdfPayloadSchema = z.object({
  client: z.object({
    address: z.string(),
    contact: z.string(),
    email: z.string(),
    name: z.string(),
    phone: z.string(),
  }),
  company: z.object({
    address: z.string(),
    email: z.string(),
    logoDataUrl: z.string(),
    name: z.string(),
    phone: z.string(),
  }),
  invoice: z.object({
    dueDate: z.string(),
    issueDate: z.string(),
    message: z.string().optional(),
    number: z.string(),
    purchaseOrder: z.string().optional(),
  }),
  items: z.array(
    z.object({
      amount: z.number(),
      description: z.string(),
      index: z.number(),
      quantity: z.number(),
      unitPrice: z.number(),
    }),
  ),
  pacaTerms: z.string(),
  totals: z.object({
    discount: z.number(),
    subtotal: z.number(),
    total: z.number(),
  }),
  wireTransferInstructions: z.string(),
});

export type InvoicePdfPayload = z.infer<typeof invoicePdfPayloadSchema>;

export const dispatchOrderPdfPayloadSchema = z.object({
  cityInfo: z.string(),
  company: z.object({
    logoDataUrl: z.string(),
  }),
  dispatchOrderNumber: z.string(),
  issueDate: z.string(),
  items: z.array(
    z.object({
      lot: z.string(),
      product: z.string(),
      quantity: z.number(),
      totalWeightKg: z.number(),
    }),
  ),
  pacaTerms: z.string(),
  pickUpAddress: z.string(),
  purchaseOrderRef: z.string().optional(),
  totalQuantity: z.number(),
  totalWeightKg: z.number(),
  vendorName: z.string(),
});

export type DispatchOrderPdfPayload = z.infer<
  typeof dispatchOrderPdfPayloadSchema
>;

export const statementPdfPayloadSchema = z.object({
  clientName: z.string(),
  company: z.object({
    address: z.string(),
    dumsNo: z.string(),
    email: z.string(),
    logoDataUrl: z.string(),
    name: z.string(),
    pacaNo: z.string(),
    phone: z.string(),
  }),
  rows: z.array(
    z.object({
      amount: z.number(),
      dueDate: z.string(),
      invoiceNumber: z.string(),
      isPastDue: z.boolean(),
      issueDate: z.string(),
    }),
  ),
  statementDate: z.string(),
  total: z.number(),
});

export type StatementPdfPayload = z.infer<typeof statementPdfPayloadSchema>;
