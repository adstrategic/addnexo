import type { DispatchOrderPdfPayload } from "./schema.js";
import { buildDispatchOrderHtml } from "./dispatch-order-html.js";
import { renderHtmlToPdfBuffer } from "./render-pdf.js";

export async function generateDispatchOrderPdf(
  payload: DispatchOrderPdfPayload,
): Promise<Buffer> {
  const html = buildDispatchOrderHtml(payload);
  return renderHtmlToPdfBuffer(html, { documentType: "dispatch-order" });
}
