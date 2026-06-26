import { EstadoFactura, prisma } from "@repo/db";

import {
  BUSINESS_TZ,
  INVOICE_DATE_ONLY_TZ,
  toDateStringInTimezone,
} from "../../lib/business-dates.js";
import { sendInvoiceDueTodayEmailBatch } from "../../lib/email.service.js";
import {
  createEmailSendLog,
  hasEmailSendLog,
} from "./business-email-send-log.service.js";
import { generateInvoicePDF } from "./pdf/invoice-pdf.service.js";

export function invoiceDueTodayScopeKey(
  facturaId: number,
  calendarDateStr: string,
): string {
  return `invoice_due_today:${facturaId}:${calendarDateStr}`;
}

export function parseInvoiceDueTodayDryRun(): boolean {
  const v = (process.env.INVOICE_DUE_TODAY_DRY_RUN ?? "").trim().toLowerCase();
  return ["1", "true", "yes"].includes(v);
}

export interface InvoiceDueTodayRunStats {
  dryRun: boolean;
  errors: number;
  sent: number;
  skippedAlreadySent: number;
  skippedNoEmail: number;
}

function clienteDisplayName(row: {
  CNombreCliente: string;
  CRazonSocial: string;
}): string {
  return row.CRazonSocial?.trim() || row.CNombreCliente?.trim() || "Customer";
}

export async function runInvoiceDueTodayReminders(): Promise<InvoiceDueTodayRunStats> {
  const dryRun = parseInvoiceDueTodayDryRun();
  const now = new Date();
  const todayStr = toDateStringInTimezone(now, BUSINESS_TZ);

  const stats: InvoiceDueTodayRunStats = {
    dryRun,
    sent: 0,
    skippedAlreadySent: 0,
    skippedNoEmail: 0,
    errors: 0,
  };

  const rows = await prisma.facturag.findMany({
    where: {
      FGSaldo: { gt: 0 },
      FGEstado: { in: [EstadoFactura.ACTIVE, EstadoFactura.OVERDUE] },
    },
    select: {
      FGId: true,
      FGOrganizationId: true,
      FGOrgSecuencia: true,
      FGNro: true,
      FGFechaVencimiento: true,
      FGCorreo1: true,
      FGCorreo2: true,
      cltemae: {
        select: { CRazonSocial: true, CNombreCliente: true },
      },
    },
  });

  // FGFechaVencimiento is a @db.Date (stored as UTC midnight), so its calendar day is
  // read in UTC; "today" (todayStr) is the current calendar day in the business timezone.
  const dueToday = rows.filter(
    (r) =>
      toDateStringInTimezone(r.FGFechaVencimiento, INVOICE_DATE_ONLY_TZ) ===
      todayStr,
  );

  for (const r of dueToday) {
    const scopeKey = invoiceDueTodayScopeKey(r.FGId, todayStr);
    if (await hasEmailSendLog(r.FGOrganizationId, scopeKey)) {
      stats.skippedAlreadySent += 1;
      continue;
    }

    const emails = [r.FGCorreo1, r.FGCorreo2].filter((e): e is string =>
      Boolean(e && e !== "N/A"),
    );
    if (emails.length === 0) {
      stats.skippedNoEmail += 1;
      console.warn(
        `[invoice-due-today] skip no email org=${r.FGOrganizationId} FGId=${r.FGId} nro=${r.FGNro}`,
      );
      continue;
    }

    if (dryRun) {
      console.log(
        `[invoice-due-today] DRY_RUN would send org=${r.FGOrganizationId} FGId=${r.FGId} nro=${r.FGNro} emails=${emails.join(",")}`,
      );
      stats.sent += 1;
      continue;
    }

    try {
      const pdfBuffer = await generateInvoicePDF(
        r.FGOrgSecuencia,
        r.FGOrganizationId,
      );
      const name = clienteDisplayName(r.cltemae);
      const batch = await sendInvoiceDueTodayEmailBatch(
        emails,
        r.FGNro,
        name,
        pdfBuffer,
      );
      if (batch.success.length > 0) {
        await createEmailSendLog(r.FGOrganizationId, scopeKey);
        stats.sent += 1;
      }
      if (
        batch.permanentFailures.length > 0 ||
        batch.transientFailures.length > 0
      ) {
        stats.errors +=
          batch.permanentFailures.length + batch.transientFailures.length;
        console.warn(
          `[invoice-due-today] partial failure FGId=${r.FGId} nro=${r.FGNro}:`,
          batch,
        );
      }
    } catch (err) {
      console.error(
        `[invoice-due-today] failed org=${r.FGOrganizationId} FGId=${r.FGId}:`,
        err,
      );
      stats.errors += 1;
    }
  }

  return stats;
}
