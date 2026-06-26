import type { StatementPdfPayload } from "./schema.js";
import { renderHtmlToPdfBuffer } from "./render-pdf.js";
import { buildStatementHtml } from "./statement-html.js";

export async function generateStatementPdf(
  payload: StatementPdfPayload,
): Promise<Buffer> {
  const html = buildStatementHtml(payload);
  return renderHtmlToPdfBuffer(html, { documentType: "statement" });
}
