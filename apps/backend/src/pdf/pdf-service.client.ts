import type {
  DispatchOrderPdfPayload,
  InvoicePdfPayload,
  StatementPdfPayload,
} from "./pdf-contracts.js";

function getPdfServiceConfig(): { url: string; key: string } {
  const url = process.env.PDF_SERVICE_URL;
  // Shared secret with the pdf-service; it validates the x-pdf-service-key
  // header against its own PDF_SERVICE_SECRET, so both sides read the same var.
  const key = process.env.PDF_SERVICE_SECRET;
  if (!url || !key) {
    throw new Error(
      "Missing required environment variables: PDF_SERVICE_URL and PDF_SERVICE_SECRET must be set",
    );
  }
  return { url, key };
}

async function postToPdfService(
  endpoint: string,
  payload: unknown,
): Promise<Buffer> {
  const { url, key } = getPdfServiceConfig();
  const res = await fetch(`${url}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pdf-service-key": key,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `PDF service error at ${endpoint}: HTTP ${res.status}${body ? ` — ${body}` : ""}`,
    );
  }

  return Buffer.from(await res.arrayBuffer());
}

export function requestInvoicePdf(
  payload: InvoicePdfPayload,
): Promise<Buffer> {
  return postToPdfService("/generate-invoice", payload);
}

export function requestDispatchOrderPdf(
  payload: DispatchOrderPdfPayload,
): Promise<Buffer> {
  return postToPdfService("/generate-dispatch-order", payload);
}

export function requestStatementPdf(
  payload: StatementPdfPayload,
): Promise<Buffer> {
  return postToPdfService("/generate-statement", payload);
}
