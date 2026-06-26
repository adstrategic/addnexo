import { Worker } from "bullmq";

import { processSingleOutboxEvent } from "../workers/outbox-worker.js";
import {
  clientHasOutstandingBalanceInvoices,
  getStatementData,
} from "../api/invoices/invoices.service.js";
import { generateStatementPDF } from "../api/invoices/pdf/statement-pdf.service.js";
import { sendStatementEmail } from "../lib/email.service.js";
import { notifyClientDispatchedWithEmitPdfFromS3 } from "../api/dispatch-order/dispatch-order.service.js";
import {
  sendAuthOrganizationInvitationEmail,
  sendAuthResetPasswordEmail,
} from "../lib/email.service.js";
import { createAuthEmailJobProcessor } from "./auth-email.processor.js";
import { getWorkerConnectionOptions } from "./connection.js";
import type {
  OutboxProcessJobData,
  EmailStatementJobData,
  EmailDispatchDispatchedJobData,
} from "./queues.js";
import { type AuthEmailJobData } from "./queues.js";

const connection = getWorkerConnectionOptions();

export function startOutboxWorker(): Worker<OutboxProcessJobData> {
  const worker = new Worker<OutboxProcessJobData>(
    "outbox-process",
    async (job) => {
      await processSingleOutboxEvent(job.data.eventId);
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] outbox-process job ${String(job?.id)} (eventId=${String(job?.data.eventId)}) failed:`,
      err instanceof Error ? err.message : err,
    );
  });

  return worker;
}

export function startStatementEmailWorker(): Worker<EmailStatementJobData> {
  const worker = new Worker<EmailStatementJobData>(
    "email-statement",
    async (job) => {
      const { clienteId, organizationId, email } = job.data;
      console.info(
        `[queue] email-statement job ${String(job.id)} started clienteId=${clienteId} email=${email}`,
      );

      const hasOutstandingBalance = await clientHasOutstandingBalanceInvoices(
        clienteId,
        organizationId,
      );
      if (!hasOutstandingBalance) {
        throw new Error(
          `Statement skipped: clienteId=${clienteId} has no invoices with outstanding balance`,
        );
      }

      const { clientName, total } = await getStatementData(
        clienteId,
        organizationId,
      );

      const pdfBuffer = await generateStatementPDF(clienteId, organizationId);
      console.info(
        `[queue] email-statement job ${String(job.id)} PDF generated (${pdfBuffer.length} bytes), sending to ${email}`,
      );

      await sendStatementEmail(email, clientName, total, pdfBuffer);
    },
    { connection },
  );

  worker.on("completed", (job) => {
    console.info(
      `[queue] email-statement job ${String(job.id)} completed (clienteId=${String(job.data.clienteId)})`,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] email-statement job ${String(job?.id)} (clienteId=${String(job?.data.clienteId)}) failed:`,
      err instanceof Error ? err.message : err,
    );
  });

  return worker;
}

export function startDispatchDispatchedEmailWorker(): Worker<EmailDispatchDispatchedJobData> {
  const worker = new Worker<EmailDispatchDispatchedJobData>(
    "email-dispatch-dispatched",
    async (job) => {
      const {
        dispatchOrderGId,
        DOGNro,
        organizationId,
        clienteEmail1,
        clienteEmail2,
        clientDisplayName,
      } = job.data;

      await notifyClientDispatchedWithEmitPdfFromS3({
        DOGId: dispatchOrderGId,
        DOGNro,
        DOGCorreo1: clienteEmail1,
        DOGCorreo2: clienteEmail2,
        clientDisplayName,
        organizationId,
      });
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] email-dispatch-dispatched job ${String(job?.id)} (DOGId=${String(job?.data.dispatchOrderGId)}) failed:`,
      err instanceof Error ? err.message : err,
    );
  });

  return worker;
}

const processAuthEmailJob = createAuthEmailJobProcessor({
  sendInvitation: sendAuthOrganizationInvitationEmail,
  sendResetPassword: sendAuthResetPasswordEmail,
});

export function startAuthEmailWorker(): Worker<AuthEmailJobData> {
  const worker = new Worker<AuthEmailJobData>(
    "auth-email",
    async (job) => {
      await processAuthEmailJob(job);
      console.info("auth_email_sent", {
        kind: job.name,
        jobId: String(job.id),
        to:
          "to" in job.data && typeof job.data.to === "string"
            ? job.data.to.trim().toLowerCase()
            : "unknown",
      });
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] auth-email job ${String(job?.id)} (${job?.name ?? "unknown"}) failed:`,
      err instanceof Error ? err.message : err,
    );
  });

  return worker;
}

export function startWorkers(): {
  authEmailWorker: Worker<AuthEmailJobData>;
  outboxWorker: Worker<OutboxProcessJobData>;
  statementEmailWorker: Worker<EmailStatementJobData>;
  dispatchDispatchedEmailWorker: Worker<EmailDispatchDispatchedJobData>;
} {
  const authEmailWorker = startAuthEmailWorker();
  const outboxWorker = startOutboxWorker();
  const statementEmailWorker = startStatementEmailWorker();
  const dispatchDispatchedEmailWorker = startDispatchDispatchedEmailWorker();

  console.log(
    "[queue] Workers started: auth-email, outbox-process, email-statement, email-dispatch-dispatched",
  );
  return {
    authEmailWorker,
    outboxWorker,
    statementEmailWorker,
    dispatchDispatchedEmailWorker,
  };
}
