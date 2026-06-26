import type { InvoicePdfPayload } from "./schema.js";
import { buildInvoiceHtml } from "./invoice-html.js";
import { renderHtmlToPdfBuffer } from "./render-pdf.js";

export async function generateInvoicePdf(
  payload: InvoicePdfPayload,
): Promise<Buffer> {
  const html = buildInvoiceHtml(payload);
  return renderHtmlToPdfBuffer(html, { documentType: "invoice" });
}
