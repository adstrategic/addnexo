import { DocumentType, type OutboxEvent, OutboxStatus, prisma } from "@repo/db";

import { generateDispatchOrderPDF } from "../api/dispatch-order/pdf/dispatch-order-pdf.service.js";
import { uploadDocumentBuffer } from "../api/documents/documents.service.js";
import { generateInvoicePDF } from "../api/invoices/pdf/invoice-pdf.service.js";
import {
  type BatchEmailResult,
  sendAdminInvoiceFailureNotification,
  sendDispatchOrderEmailBatch,
  sendInvoiceEmailBatch,
} from "../lib/email.service.js";
import {
  filterPendingEmails,
  normalizeDispatchRecipientEmails,
} from "./outbox-worker.helpers.js";

// Type for email results stored in outbox event
interface EmailResults {
  adminNotified?: boolean;
  permanentFailed?: { email: string; error: string }[];
  sent?: string[];
}

/**
 * Helper function to send admin notification if there are permanent failures
 * Returns the updated adminNotified status
 */
async function notifyAdminIfNeeded(
  existingResults: EmailResults,
  permanentFailures: { email: string; error: string }[],
  invoiceNumber: number,
  clienteNombre: string,
  organizationId: string,
): Promise<boolean> {
  // Skip if no permanent failures or already notified
  if (permanentFailures.length === 0 || existingResults.adminNotified) {
    return existingResults.adminNotified ?? false;
  }

  try {
    await sendAdminInvoiceFailureNotification(
      invoiceNumber,
      clienteNombre,
      permanentFailures,
      organizationId,
    );
    return true; // Notification sent successfully
  } catch (error) {
    // Log error but don't throw - notification failure shouldn't break the worker
    console.error(
      `Failed to send admin notification for invoice #${String(invoiceNumber)}:`,
      error,
    );
    return false; // Notification failed, but we continue
  }
}

/**
 * Process pending outbox events
 */
export async function processOutboxEvents() {
  const events = await prisma.outboxEvent.findMany({
    where: {
      status: OutboxStatus.PENDING,
      processAfter: { lte: new Date() },
      attempts: { lt: 3 }, // maxAttempts is 3
    },
    take: 10, // Process in batches
    orderBy: { createdAt: "asc" },
  });

  for (const event of events) {
    try {
      // Optimistic concurrency control - claim event only if still PENDING
      const claimed = await prisma.outboxEvent.updateMany({
        where: {
          id: event.id,
          status: OutboxStatus.PENDING, // Only claim if still pending
        },
        data: {
          status: OutboxStatus.PROCESSING,
          attempts: { increment: 1 },
        },
      });

      // If count is 0, another worker already claimed it - skip
      if (claimed.count === 0) {
        continue;
      }

      await handleEvent(event);

      // Mark as processed
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: OutboxStatus.PROCESSED,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      const nextAttempt = event.attempts + 1;
      const isMaxed = nextAttempt >= event.maxAttempts;

      // Exponential backoff: 1min, 5min, 15min
      const delayMs = Math.pow(3, nextAttempt) * 60000;

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: isMaxed ? OutboxStatus.FAILED : OutboxStatus.PENDING,
          lastError: errorMessage.substring(0, 500),
          processAfter: new Date(Date.now() + delayMs),
        },
      });
    }
  }
}

async function handleEvent(event: OutboxEvent) {
  try {
    switch (event.eventType) {
      case "DISPATCH_ORDER_EMITTED":
        await processDispatchOrderEmitted(event);
        break;
      case "INVOICE_CREATED":
        await processInvoiceCreated(event);
        break;
      default:
        throw new Error(`Unknown event type: ${String(event.eventType)}`);
    }
  } catch (error) {
    console.error("Error handling event:", error);
    throw error;
  }
}

async function processInvoiceCreated(event: OutboxEvent) {
  const {
    secuencia,
    clienteEmail,
    clienteEmail2,
    nro,
    clienteNombre,
    usuario,
  } = event.payload as {
    clienteEmail: string;
    clienteEmail2: string;
    clienteNombre: string;
    nro: number;
    secuencia: number;
    usuario: string;
  };

  // Step 1: Generate PDF
  const pdfBuffer: Buffer = await generateInvoicePDF(
    secuencia,
    event.organizationId,
  );

  // Step 2: Upload to S3 (if not done)
  if (!event.s3Uploaded) {
    await uploadDocumentBuffer(
      pdfBuffer,
      `invoice-${String(nro)}.pdf`,
      DocumentType.INVOICE,
      event.aggregateId,
      event.organizationId,
      usuario,
    );
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { s3Uploaded: true },
    });
  }

  // Step 3: Send emails in batch (if not done and not skipped)
  if (!event.emailSent && !event.emailSkipped) {
    // Collect all valid emails
    let emails = [clienteEmail, clienteEmail2].filter(
      (email) => email && email !== "N/A",
    );

    // Filter out emails that already permanently failed or were successfully sent
    const existingResults: EmailResults =
      (event.emailResults as EmailResults) || {};

    if (existingResults.permanentFailed) {
      const permanentFailedEmails = new Set(
        existingResults.permanentFailed.map((f) => f.email),
      );
      emails = emails.filter((email) => !permanentFailedEmails.has(email));
    }

    if (existingResults.sent) {
      const sentEmails = new Set(existingResults.sent);
      emails = emails.filter((email) => !sentEmails.has(email));
    }

    if (emails.length > 0) {
      const result: BatchEmailResult = await sendInvoiceEmailBatch(
        emails,
        nro,
        clienteNombre || "Valued Customer",
        pdfBuffer,
      );

      // Merge new results with existing results
      const mergedSent = [...(existingResults.sent ?? []), ...result.success];
      const mergedPermanentFailed = [
        ...(existingResults.permanentFailed ?? []),
        ...result.permanentFailures,
      ];

      // Check if there are transient failures - these should trigger retry
      if (result.transientFailures.length > 0) {
        // Store partial progress before throwing
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            emailResults: {
              sent: mergedSent,
              permanentFailed: mergedPermanentFailed,
              adminNotified: existingResults.adminNotified ?? false,
            },
          },
        });
        // Throw error to trigger retry for transient failures
        throw new Error(
          `Transient email failures: ${result.transientFailures
            .map((f) => `${f.email} (${f.error})`)
            .join(", ")}`,
        );
      }

      // Send admin notification if there are permanent failures
      const adminNotified = await notifyAdminIfNeeded(
        existingResults,
        mergedPermanentFailed,
        nro,
        clienteNombre || "Valued Customer",
        event.organizationId,
      );

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          emailSent: mergedSent.length > 0,
          emailSkipped:
            mergedSent.length === 0 && mergedPermanentFailed.length > 0,
          emailResults: {
            sent: mergedSent,
            permanentFailed: mergedPermanentFailed,
            adminNotified,
          },
        },
      });
    } else {
      // All emails either sent or permanently failed - mark as complete
      const adminNotified = await notifyAdminIfNeeded(
        existingResults,
        existingResults.permanentFailed ?? [],
        nro,
        clienteNombre || "Valued Customer",
        event.organizationId,
      );

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          emailSent: (existingResults.sent?.length ?? 0) > 0,
          emailSkipped: true,
          emailResults: {
            ...existingResults,
            adminNotified,
          },
        },
      });
    }
  }
}

async function processDispatchOrderEmitted(event: OutboxEvent) {
  console.log("processDispatchOrderEmitted", event);
  const { secuencia, nro, usuario } = event.payload as {
    nro: number;
    organizationId: string;
    secuencia: number;
    usuario: string;
  };

  // Step 1: Generate PDF
  const pdfBuffer: Buffer = await generateDispatchOrderPDF(
    secuencia,
    event.organizationId,
  );

  console.log("pdfBuffer", pdfBuffer);

  // Step 2: Upload to S3 (if not done)
  if (!event.s3Uploaded) {
    await uploadDocumentBuffer(
      pdfBuffer,
      `dispatch-order-${String(nro)}.pdf`,
      DocumentType.DISPATCH_ORDER,
      event.aggregateId,
      event.organizationId,
      usuario,
    );
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { s3Uploaded: true },
    });
  }

  // Step 3: Send emails in batch (if not done and not skipped)
  if (!event.emailSent && !event.emailSkipped) {
    const warehouseManagers = await prisma.member.findMany({
      where: {
        organizationId: event.organizationId,
        role: "warehouse_manager",
      },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    console.log("warehouseManagers", warehouseManagers);

    const warehouseManagerEmails = normalizeDispatchRecipientEmails(
      warehouseManagers.map((member) => member.user.email),
    );

    const organization = await prisma.organization.findUnique({
      where: { id: event.organizationId },
      select: { name: true },
    });

    const existingResults: EmailResults =
      (event.emailResults as EmailResults) ?? {};
    console.log("existingResults", existingResults);
    const emails = filterPendingEmails(warehouseManagerEmails, existingResults);
    console.log("emails", emails);
    if (emails.length > 0) {
      const result: BatchEmailResult = await sendDispatchOrderEmailBatch(
        emails,
        nro,
        organization?.name,
        pdfBuffer,
      );

      // Merge new results with existing results
      const mergedSent = [...(existingResults.sent ?? []), ...result.success];
      const mergedPermanentFailed = [
        ...(existingResults.permanentFailed ?? []),
        ...result.permanentFailures,
      ];

      // Check if there are transient failures - these should trigger retry
      if (result.transientFailures.length > 0) {
        // Store partial progress before throwing
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            emailResults: {
              sent: mergedSent,
              permanentFailed: mergedPermanentFailed,
              adminNotified: existingResults.adminNotified ?? false,
            },
          },
        });

        // Throw error to trigger retry for transient failures
        throw new Error(
          `Transient email failures: ${result.transientFailures
            .map((f) => `${f.email} (${f.error})`)
            .join(", ")}`,
        );
      }

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          emailSent: mergedSent.length > 0,
          emailSkipped:
            mergedSent.length === 0 && mergedPermanentFailed.length > 0,
          emailResults: {
            sent: mergedSent,
            permanentFailed: mergedPermanentFailed,
            adminNotified: existingResults.adminNotified ?? false,
          },
        },
      });
    } else {
      // No emails to send (either no managers or all already processed)
      const hasNoWarehouseManagers = warehouseManagerEmails.length === 0;
      const allPermanentlyFailed =
        (existingResults.permanentFailed?.length ?? 0) > 0 &&
        (existingResults.sent?.length ?? 0) === 0;

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          emailSent: (existingResults.sent?.length ?? 0) > 0,
          emailSkipped: hasNoWarehouseManagers || allPermanentlyFailed,
          emailResults: {
            ...existingResults,
            adminNotified: existingResults.adminNotified ?? false,
          },
        },
      });
    }
  }
}

/**
 * Processes a single OutboxEvent by ID, called from the BullMQ worker.
 * Uses the same optimistic-claim pattern as processOutboxEvents() to be
 * safe against concurrent cron and BullMQ runs.
 */
export async function processSingleOutboxEvent(eventId: number): Promise<void> {
  const event = await prisma.outboxEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    // Deleted or never existed - no-op so BullMQ marks the job complete.
    console.warn(
      `[outbox-worker] Event ${String(eventId)} not found; skipping.`,
    );
    return;
  }

  // Already processed (cron ran first) - skip silently.
  if (event.status === OutboxStatus.PROCESSED) {
    console.log(
      `[outbox-worker] Event ${String(eventId)} already PROCESSED; skipping.`,
    );
    return;
  }

  // Optimistic claim: PENDING -> PROCESSING
  const claimed = await prisma.outboxEvent.updateMany({
    where: { id: event.id, status: OutboxStatus.PENDING },
    data: {
      status: OutboxStatus.PROCESSING,
      attempts: { increment: 1 },
    },
  });

  if (claimed.count === 0) {
    // Another worker beat us to it.
    console.log(
      `[outbox-worker] Event ${String(eventId)} already claimed by another worker; skipping.`,
    );
    return;
  }

  try {
    await handleEvent(event);

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { status: OutboxStatus.PROCESSED, processedAt: new Date() },
    });
  } catch (error) {
    const nextAttempt = event.attempts + 1;
    const isMaxed = nextAttempt >= event.maxAttempts;
    const delayMs = Math.pow(3, nextAttempt) * 60_000; // 1min, 5min, 15min

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: isMaxed ? OutboxStatus.FAILED : OutboxStatus.PENDING,
        lastError: errorMessage.substring(0, 500),
        processAfter: new Date(Date.now() + delayMs),
      },
    });

    // Re-throw so BullMQ knows the job failed and applies its own retry.
    throw error;
  }
}
