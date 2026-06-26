import { prisma } from "@repo/db";

import {
  BUSINESS_TZ,
  isMondayOrThursdayInBogota,
  toDateStringInTimezone,
} from "../../lib/business-dates.js";
import { sendStatementScheduledReminderEmail } from "../../lib/email.service.js";
import {
  createEmailSendLog,
  hasEmailSendLog,
} from "./business-email-send-log.service.js";
import {
  getClienteIdsWithOutstandingBalanceAndOverdue,
  getStatementData,
} from "./invoices.service.js";
import { generateStatementPDF } from "./pdf/statement-pdf.service.js";

export function statementCycleScopeKey(
  clienteId: number,
  calendarDateStr: string,
): string {
  return `statement_cycle:${clienteId}:${calendarDateStr}`;
}

export function parseStatementScheduledDryRun(): boolean {
  const v = (process.env.STATEMENT_SCHEDULED_DRY_RUN ?? "")
    .trim()
    .toLowerCase();
  return ["1", "true", "yes"].includes(v);
}

export interface StatementScheduledRunStats {
  dryRun: boolean;
  errors: number;
  sent: number;
  skippedAlreadySent: number;
  skippedDisabled: number;
  skippedNoEmail: number;
  skippedNotMonThu: boolean;
}

export interface StatementScheduledTestRunStats extends Omit<
  StatementScheduledRunStats,
  "skippedNoEmail" | "skippedNotMonThu"
> {
  testEmail: string;
  testMode: true;
}

function clienteDisplayName(row: {
  CNombreCliente: string;
  CRazonSocial: string;
}): string {
  return row.CRazonSocial?.trim() || row.CNombreCliente?.trim() || "Customer";
}

export async function runStatementScheduledReminders(): Promise<StatementScheduledRunStats> {
  const dryRun = parseStatementScheduledDryRun();
  const now = new Date();

  const stats: StatementScheduledRunStats = {
    dryRun,
    skippedNotMonThu: false,
    sent: 0,
    skippedAlreadySent: 0,
    skippedNoEmail: 0,
    skippedDisabled: 0,
    errors: 0,
  };

  if (!isMondayOrThursdayInBogota(now)) {
    stats.skippedNotMonThu = true;
    console.log(
      `[statement-scheduled] skip: not Monday or Thursday in ${BUSINESS_TZ} (today=${toDateStringInTimezone(now, BUSINESS_TZ)})`,
    );
    return stats;
  }

  const todayStr = toDateStringInTimezone(now, BUSINESS_TZ);

  const orgs = await prisma.organization.findMany({
    select: { id: true, statementScheduledRemindersEnabled: true },
  });

  for (const {
    id: organizationId,
    statementScheduledRemindersEnabled,
  } of orgs) {
    if (!statementScheduledRemindersEnabled) {
      stats.skippedDisabled += 1;
      console.log(`[statement-scheduled] skip disabled org=${organizationId}`);
      continue;
    }

    const clienteIds =
      await getClienteIdsWithOutstandingBalanceAndOverdue(organizationId);

    for (const clienteId of clienteIds) {
      const scopeKey = statementCycleScopeKey(clienteId, todayStr);
      if (await hasEmailSendLog(organizationId, scopeKey)) {
        stats.skippedAlreadySent += 1;
        continue;
      }

      const cltemae = await prisma.cltemae.findFirst({
        where: { CId: clienteId, COrganizationId: organizationId },
        select: {
          CCorreo1: true,
          CCorreo2: true,
          CRazonSocial: true,
          CNombreCliente: true,
        },
      });

      if (!cltemae) {
        stats.skippedNoEmail += 1;
        continue;
      }

      const emails = [cltemae.CCorreo1, cltemae.CCorreo2].filter(
        (e): e is string => Boolean(e && e !== "N/A"),
      );
      if (emails.length === 0) {
        stats.skippedNoEmail += 1;
        console.warn(
          `[statement-scheduled] skip no email org=${organizationId} clienteId=${clienteId}`,
        );
        continue;
      }

      if (dryRun) {
        console.log(
          `[statement-scheduled] DRY_RUN would send org=${organizationId} clienteId=${clienteId} emails=${emails.join(",")}`,
        );
        stats.sent += 1;
        continue;
      }

      try {
        const pdfBuffer = await generateStatementPDF(clienteId, organizationId);
        const clientName = clienteDisplayName(cltemae);
        const { total } = await getStatementData(clienteId, organizationId);

        let anySuccess = false;
        for (const toEmail of emails) {
          try {
            await sendStatementScheduledReminderEmail(
              toEmail,
              clientName,
              total,
              pdfBuffer,
            );
            anySuccess = true;
          } catch (err) {
            console.error(
              `[statement-scheduled] email failed org=${organizationId} clienteId=${clienteId} to=${toEmail}:`,
              err,
            );
            stats.errors += 1;
          }
        }

        if (anySuccess) {
          await createEmailSendLog(organizationId, scopeKey);
          stats.sent += 1;
        }
      } catch (err) {
        console.error(
          `[statement-scheduled] failed org=${organizationId} clienteId=${clienteId}:`,
          err,
        );
        stats.errors += 1;
      }
    }
  }

  return stats;
}

/** Test-only run: all outstanding-balance statements go to `testEmail` only (never client emails). */
export async function runStatementScheduledRemindersForTestEmail(
  testEmail: string,
): Promise<StatementScheduledTestRunStats> {
  const dryRun = parseStatementScheduledDryRun();
  const now = new Date();
  const redirectTo = testEmail.trim();

  const stats: StatementScheduledTestRunStats = {
    testMode: true,
    testEmail: redirectTo,
    dryRun,
    sent: 0,
    skippedAlreadySent: 0,
    skippedDisabled: 0,
    errors: 0,
  };

  console.log(
    `[statement-scheduled] TEST mode — all statements redirected to ${redirectTo} (client emails never used; no send logs; Mon/Thu skipped)`,
  );

  const orgs = await prisma.organization.findMany({
    select: { id: true, statementScheduledRemindersEnabled: true },
  });

  for (const {
    id: organizationId,
    statementScheduledRemindersEnabled,
  } of orgs) {
    if (!statementScheduledRemindersEnabled) {
      stats.skippedDisabled += 1;
      console.log(
        `[statement-scheduled] TEST skip disabled org=${organizationId}`,
      );
      continue;
    }

    const clienteIds =
      await getClienteIdsWithOutstandingBalanceAndOverdue(organizationId);

    for (const clienteId of clienteIds) {
      const cltemae = await prisma.cltemae.findFirst({
        where: { CId: clienteId, COrganizationId: organizationId },
        select: {
          CRazonSocial: true,
          CNombreCliente: true,
        },
      });

      const clientName = cltemae
        ? clienteDisplayName(cltemae)
        : `Cliente ${clienteId}`;

      if (dryRun) {
        console.log(
          `[statement-scheduled] TEST DRY_RUN would send org=${organizationId} clienteId=${clienteId} client=${clientName} to=${redirectTo} (not to client email)`,
        );
        stats.sent += 1;
        continue;
      }

      try {
        const pdfBuffer = await generateStatementPDF(clienteId, organizationId);
        const { total } = await getStatementData(clienteId, organizationId);

        await sendStatementScheduledReminderEmail(
          redirectTo,
          clientName,
          total,
          pdfBuffer,
          { skipBcc: true },
        );
        stats.sent += 1;
        console.log(
          `[statement-scheduled] TEST sent org=${organizationId} clienteId=${clienteId} client=${clientName} to=${redirectTo} (not to client email)`,
        );
      } catch (err) {
        console.error(
          `[statement-scheduled] TEST failed org=${organizationId} clienteId=${clienteId}:`,
          err,
        );
        stats.errors += 1;
      }
    }
  }

  return stats;
}
