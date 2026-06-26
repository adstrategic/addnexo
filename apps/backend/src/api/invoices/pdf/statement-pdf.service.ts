import { EstadoFactura } from "@repo/db";
import { getStatementData } from "../invoices.service.js";
import type { StatementPdfPayload } from "../../../pdf/pdf-contracts.js";
import { requestStatementPdf } from "../../../pdf/pdf-service.client.js";
import {
  BUSINESS_TZ,
  formatDateDdMmYyyyInTimezone,
  INVOICE_DATE_ONLY_TZ,
} from "../../../lib/business-dates.js";
import { fileURLToPath } from "node:url";
import fs from "fs";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLogoDataUrl(): string {
  const logoPath = path.join(__dirname, "../../../assets/addnexo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  return `data:image/png;base64,${logoBase64}`;
}

const STATEMENT_COMPANY = {
  address: "1309 Diner Dr, Cedar Park",
  dumsNo: "000000000",
  email: "adstrategicbusiness@gmail.com",
  name: "ADDNEXO",
  pacaNo: "00000000",
  phone: "+1 754 254 9069",
};

export async function buildStatementPdfPayload(
  clienteId: number,
  organizationId: string,
): Promise<StatementPdfPayload> {
  const { rows, clientName, total } = await getStatementData(
    clienteId,
    organizationId,
  );
  if (rows.length === 0) {
    throw new Error("No invoices with balance found for this client");
  }

  return {
    clientName,
    company: {
      ...STATEMENT_COMPANY,
      logoDataUrl: getLogoDataUrl(),
    },
    rows: rows.map((row) => ({
      amount: row.amount,
      dueDate: formatDateDdMmYyyyInTimezone(row.dueDate, INVOICE_DATE_ONLY_TZ),
      invoiceNumber: row.invoiceNumber.toString(),
      isPastDue: row.estado === EstadoFactura.OVERDUE,
      issueDate: formatDateDdMmYyyyInTimezone(
        row.issueDate,
        INVOICE_DATE_ONLY_TZ,
      ),
    })),
    statementDate: formatDateDdMmYyyyInTimezone(new Date(), BUSINESS_TZ),
    total,
  };
}

export async function generateStatementPDF(
  clienteId: number,
  organizationId: string,
): Promise<Buffer> {
  const payload = await buildStatementPdfPayload(clienteId, organizationId);
  return requestStatementPdf(payload);
}
