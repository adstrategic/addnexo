import { Resend } from "resend";
import { BUSINESS_TZ } from "./business-dates.js";

const STATEMENT_TEMPLATE_ALIAS =
  process.env.RESEND_STATEMENT_TEMPLATE_ALIAS ?? "statement-addnexo";

const STATEMENT_EMAIL_BCC = ["adstrategicbusiness@gmail.com"];

let resendClient: null | Resend = null;

export function getResendClient(): null | Resend {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const resend = {
  emails: {
    send: (...args: Parameters<Resend["emails"]["send"]>) => {
      const client = getResendClient();
      if (!client) {
        throw new Error("Missing API key. Pass RESEND_API_KEY in environment.");
      }
      return client.emails.send(...args);
    },
  },
};

// Types for batch email results
export interface BatchEmailResult {
  success: string[];
  permanentFailures: Array<{ email: string; error: string }>;
  transientFailures: Array<{ email: string; error: string }>;
}

// Error classification helper
function isTransientError(error: any): boolean {
  const transientCodes = ["rate_limit_exceeded", "internal_server_error"];
  const transientStatusCodes = [429, 500, 502, 503, 504];

  return (
    transientCodes.includes(error?.name) ||
    transientStatusCodes.includes(error?.statusCode) ||
    error?.code === "ECONNREFUSED" ||
    error?.code === "ETIMEDOUT" ||
    error?.code === "ENOTFOUND"
  );
}

export interface AuthEmailTemplate {
  html: string;
  subject: string;
  text: string;
}

interface BuildAuthResetPasswordEmailParams {
  appName?: string;
  resetUrl: string;
  userEmail: string;
  userName?: null | string;
}

interface BuildAuthOrganizationInvitationEmailParams {
  appName?: string;
  inviteId: string;
  inviterName?: null | string;
  organizationName: string;
  role: string;
}

export function buildAuthResetPasswordEmail({
  appName = "Inventory System",
  resetUrl,
  userEmail,
  userName,
}: BuildAuthResetPasswordEmailParams): AuthEmailTemplate {
  const safeName = userName?.trim() || userEmail;
  return {
    subject: `${appName} password reset request`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset your password</h2>
        <p>Hello ${safeName},</p>
        <p>We received a request to reset the password for <strong>${userEmail}</strong>.</p>
        <p>Use the button below to set a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #111827; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Regards,<br>${appName}</p>
      </div>
    `,
    text: `Reset your password\n\nHello ${safeName},\n\nWe received a request to reset the password for ${userEmail}.\n\nReset link: ${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nRegards,\n${appName}`,
  };
}

export function buildAuthOrganizationInvitationEmail({
  appName = "Inventory System",
  inviteId,
  inviterName,
  organizationName,
  role,
}: BuildAuthOrganizationInvitationEmailParams): AuthEmailTemplate {
  const actorName = inviterName?.trim() || "An admin";
  const inviteUrl = `${process.env.FRONTEND_URL ?? ""}/invite/${inviteId}`;

  return {
    subject: `Invitation to join ${organizationName} on ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're invited to join ${organizationName}</h2>
        <p>${actorName} invited you to join <strong>${organizationName}</strong> as <strong>${role}</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background: #111827; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept invitation
          </a>
        </p>
        <p>If you did not expect this invitation, you can ignore this email.</p>
        <p>Regards,<br>${appName}</p>
      </div>
    `,
    text: `You're invited to join ${organizationName}\n\n${actorName} invited you to join ${organizationName} as ${role}.\n\nAccept invitation: ${inviteUrl}\n\nIf you did not expect this invitation, you can ignore this email.\n\nRegards,\n${appName}`,
  };
}

export async function sendAuthResetPasswordEmail({
  appName,
  resetUrl,
  to,
  userName,
}: {
  appName?: string;
  resetUrl: string;
  to: string;
  userName?: null | string;
}): Promise<{ error?: string; success: boolean }> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { error: "Email service not configured", success: false };
  }

  const email = buildAuthResetPasswordEmail({
    appName,
    resetUrl,
    userEmail: to,
    userName,
  });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      html: email.html,
      subject: email.subject,
      text: email.text,
      to,
    });
    return { success: true };
  } catch (error: any) {
    return { error: error?.message ?? "Unknown email error", success: false };
  }
}

export async function sendAuthOrganizationInvitationEmail({
  appName,
  inviteId,
  inviterName,
  organizationName,
  role,
  to,
}: {
  appName?: string;
  inviteId: string;
  inviterName?: null | string;
  organizationName: string;
  role: string;
  to: string;
}): Promise<{ error?: string; success: boolean }> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { error: "Email service not configured", success: false };
  }

  const email = buildAuthOrganizationInvitationEmail({
    appName,
    inviteId,
    inviterName,
    organizationName,
    role,
  });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      html: email.html,
      subject: email.subject,
      text: email.text,
      to,
    });
    return { success: true };
  } catch (error: any) {
    return { error: error?.message ?? "Unknown email error", success: false };
  }
}

/**
 * Envía notificaciones por email a los bodegueros cuando se emite un dispatch order
 * @param emails - Array de emails de los bodegueros
 * @param dispatchOrderNumber - Número de la dispatch order emitida
 * @param organizationName - Nombre de la organización (opcional)
 * @param pdfBuffer - Buffer del PDF de la dispatch order para adjuntar (opcional)
 */
export async function sendDispatchOrderNotification(
  emails: string[],
  dispatchOrderNumber: number,
  organizationName?: string,
  pdfBuffer?: Buffer,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not configured. No emails will be sent.");
    return;
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn(
      "RESEND_FROM_EMAIL is not configured. No emails will be sent.",
    );
    return;
  }

  if (emails.length === 0) {
    console.log("No warehouse staff to notify.");
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const subject = `New Dispatch Order Issued - #${dispatchOrderNumber}`;

  const organizationText = organizationName
    ? ` from organization ${organizationName}`
    : "";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Dispatch Order Issued</h2>
      <p>Hello,</p>
      <p>A new dispatch order${organizationText} has been issued that requires your review.</p>
      <p><strong>Dispatch Order Number:</strong> #${dispatchOrderNumber}</p>
      <p>Please review the dispatch order document attached.</p>
      <p>Regards,<br>Inventory System</p>
    </div>
  `;

  const textContent = `A new dispatch order${organizationText} has been issued that requires your review.\n\nDispatch Order Number: #${dispatchOrderNumber}\n\n`;

  // Preparar attachments si hay PDF
  const attachments = pdfBuffer
    ? [
        {
          content: pdfBuffer.toString("base64"),
          filename: `dispatch-order-${dispatchOrderNumber}.pdf`,
        },
      ]
    : undefined;

  const emailPromises = emails.map((email) =>
    resend.emails.send({
      from: fromEmail,
      to: email,
      subject: subject,
      html: htmlContent,
      text: textContent,
      ...(attachments && { attachments }),
    }),
  );

  const results = await Promise.allSettled(emailPromises);
}

/**
 * Sends invoice email to client with PDF attachment
 */
export async function sendInvoiceEmail(
  email: string,
  invoiceNumber: number,
  clienteNombre: string,
  pdfBuffer: Buffer,
  organizationId?: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Email service not configured. Invoice email not sent.");
    return;
  }

  if (!email || email === "N/A") {
    console.log(`No valid email address for invoice #${invoiceNumber}`);
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const subject = `Invoice #${invoiceNumber} - ${clienteNombre}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Invoice #${invoiceNumber}</h2>
      <p>Dear ${clienteNombre},</p>
      <p>Please find attached your invoice #${invoiceNumber}.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Regards,<br>ADDNEXO</p>
    </div>
  `;

  const textContent = `Dear ${clienteNombre},\n\nPlease find attached your invoice #${invoiceNumber}.\n\nRegards,\nADDNEXO`;

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: subject,
    html: htmlContent,
    text: textContent,
    attachments: [
      {
        content: pdfBuffer.toString("base64"),
        filename: `invoice-${invoiceNumber}.pdf`,
      },
    ],
  });
}

const STATEMENT_EMAIL_SUBJECT_PREFIX = "Your statement from ADDNEXO";

/** Calendar day the statement is sent (America/Bogota), same TZ as the PDF statement date. */
function formatStatementSendDate(sentAt: Date = new Date()): string {
  return sentAt.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: BUSINESS_TZ,
  });
}

function buildStatementEmailSubject(sentAt: Date = new Date()): string {
  return `${STATEMENT_EMAIL_SUBJECT_PREFIX} - ${formatStatementSendDate(sentAt)}`;
}

/** Resend `amount` template variable (string, en-US, max 2 decimal places). */
function formatStatementAmount(total: number): string {
  return Number(total.toFixed(2)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildStatementTemplateVariables(options: {
  toEmail: string;
  clientName: string;
  amount: number;
  sentAt?: Date;
}) {
  const { toEmail, clientName, amount, sentAt = new Date() } = options;
  const email = toEmail.trim();
  const name = clientName.trim() || "Customer";
  const date = formatStatementSendDate(sentAt);

  return {
    client_email: email,
    client_name: name,
    customer_email: email,
    customer_name: name,
    date,
    amount: formatStatementAmount(amount),
  };
}

function statementPdfFilename(
  clientName: string,
  sentAt: Date = new Date(),
): string {
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, "-");
  const datePart = formatStatementSendDate(sentAt).replace(/\//g, "-");
  return `statement-${safeName}-${datePart}.pdf`;
}

async function sendStatementEmailWithTemplate(options: {
  toEmail: string;
  clientName: string;
  amount: number;
  pdfBuffer: Buffer;
  bcc?: string[];
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    // Throw (instead of silent return) so the queue job fails visibly rather
    // than being marked "completed" without an email ever being sent.
    throw new Error(
      "Email service not configured: RESEND_API_KEY and/or RESEND_FROM_EMAIL are missing. Statement email not sent.",
    );
  }

  const { toEmail, clientName, amount, pdfBuffer, bcc } = options;
  const sentAt = new Date();
  const subject = buildStatementEmailSubject(sentAt);

  if (!toEmail || toEmail === "N/A") {
    throw new Error(
      `No valid email address for statement to ${clientName} (received "${toEmail}").`,
    );
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const filename = statementPdfFilename(clientName, sentAt);

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    ...(bcc?.length ? { bcc } : {}),
    subject,
    template: {
      id: STATEMENT_TEMPLATE_ALIAS,
      variables: buildStatementTemplateVariables({
        toEmail,
        clientName,
        amount,
        sentAt,
      }),
    },
    attachments: [
      {
        content: pdfBuffer.toString("base64"),
        filename,
      },
    ],
  });

  if (error) {
    console.error(
      `[statement-email] Resend rejected statement to ${toEmail} (template=${STATEMENT_TEMPLATE_ALIAS}):`,
      error,
    );
    throw error;
  }

  console.info(
    `[statement-email] sent to ${toEmail} (Resend id=${data?.id ?? "unknown"}, template=${STATEMENT_TEMPLATE_ALIAS})`,
  );
}

/**
 * Sends statement email to client with PDF attachment (Resend template).
 */
export async function sendStatementEmail(
  toEmail: string,
  clientName: string,
  amount: number,
  pdfBuffer: Buffer,
): Promise<void> {
  await sendStatementEmailWithTemplate({
    toEmail,
    clientName,
    amount,
    pdfBuffer,
    bcc: STATEMENT_EMAIL_BCC,
  });
}

/** Same subject and template as {@link sendStatementEmail}; optional BCC skip for tests. */
export async function sendStatementScheduledReminderEmail(
  toEmail: string,
  clientName: string,
  amount: number,
  pdfBuffer: Buffer,
  options?: { skipBcc?: boolean },
): Promise<void> {
  await sendStatementEmailWithTemplate({
    toEmail,
    clientName,
    amount,
    pdfBuffer,
    ...(options?.skipBcc ? {} : { bcc: STATEMENT_EMAIL_BCC }),
  });
}

/**
 * Builds HTML content for invoice email
 */
function buildInvoiceEmailHtml(
  invoiceNumber: number,
  clienteNombre: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Invoice #${invoiceNumber}</h2>
      <p>Dear ${clienteNombre},</p>
      <p>Please find attached your invoice #${invoiceNumber}.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Regards,<br>ADDNEXO</p>
    </div>
  `;
}

/**
 * Builds text content for invoice email
 */
function buildInvoiceEmailText(
  invoiceNumber: number,
  clienteNombre: string,
): string {
  return `Dear ${clienteNombre},\n\nPlease find attached your invoice #${invoiceNumber}.\n\nRegards,\nADDNEXO`;
}

function buildInvoiceDueTodayEmailHtml(
  invoiceNumber: number,
  clienteNombre: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Invoice #${invoiceNumber} — payment due today</h2>
      <p>Dear ${clienteNombre},</p>
      <p>This invoice is <strong>due for payment today</strong>. Please find your invoice #${invoiceNumber} attached.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Regards,<br>ADDNEXO</p>
    </div>
  `;
}

function buildInvoiceDueTodayEmailText(
  invoiceNumber: number,
  clienteNombre: string,
): string {
  return `Dear ${clienteNombre},\n\nThis invoice is due for payment today. Please find attached your invoice #${invoiceNumber}.\n\nRegards,\nADDNEXO`;
}

/**
 * Sends invoice PDF emails with copy indicating payment is due today (cron use).
 */
export async function sendInvoiceDueTodayEmailBatch(
  emails: string[],
  invoiceNumber: number,
  clienteNombre: string,
  pdfBuffer: Buffer,
): Promise<BatchEmailResult> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn(
      "Email service not configured. Invoice due-today emails not sent.",
    );
    return {
      success: [],
      permanentFailures: emails.map((email) => ({
        email,
        error: "Email service not configured",
      })),
      transientFailures: [],
    };
  }

  const validEmails = emails.filter((email) => email && email !== "N/A");

  if (validEmails.length === 0) {
    return {
      success: [],
      permanentFailures: [],
      transientFailures: [],
    };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const subject = `Invoice #${invoiceNumber} — due today - ${clienteNombre}`;
  const htmlContent = buildInvoiceDueTodayEmailHtml(
    invoiceNumber,
    clienteNombre,
  );
  const textContent = buildInvoiceDueTodayEmailText(
    invoiceNumber,
    clienteNombre,
  );
  const attachment = {
    content: pdfBuffer.toString("base64"),
    filename: `invoice-${invoiceNumber}.pdf`,
  };

  const emailPayloads = validEmails.map((email) => ({
    from: fromEmail,
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
    attachments: [attachment],
  }));

  try {
    const emailPromises = emailPayloads.map((payload, index) =>
      resend.emails
        .send(payload)
        .then(() => ({ email: validEmails[index], success: true }))
        .catch((error: any) => ({
          email: validEmails[index],
          success: false,
          error,
        })),
    );

    const results = await Promise.allSettled(emailPromises);

    const success: string[] = [];
    const permanentFailures: Array<{ email: string; error: string }> = [];
    const transientFailures: Array<{ email: string; error: string }> = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        const emailResult = result.value;
        if (emailResult.success) {
          success.push(emailResult.email!);
        } else {
          const errorResult = emailResult as {
            email: string;
            success: false;
            error: any;
          };
          if (isTransientError(errorResult.error)) {
            transientFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Transient error",
            });
          } else {
            permanentFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Permanent error",
            });
          }
        }
      } else {
        transientFailures.push({
          email: "unknown",
          error: result.reason?.message || "Promise rejection",
        });
      }
    }

    return {
      success,
      permanentFailures,
      transientFailures,
    };
  } catch (error: any) {
    if (isTransientError(error)) {
      return {
        success: [],
        permanentFailures: [],
        transientFailures: validEmails.map((email) => ({
          email,
          error: error.message || "Network error",
        })),
      };
    }
    return {
      success: [],
      permanentFailures: validEmails.map((email) => ({
        email,
        error: error.message || "Unknown error",
      })),
      transientFailures: [],
    };
  }
}

/**
 * Sends invoice emails in batch using Resend batch API
 * Returns detailed results for each email (success, permanent failure, transient failure)
 */
export async function sendInvoiceEmailBatch(
  emails: string[],
  invoiceNumber: number,
  clienteNombre: string,
  pdfBuffer: Buffer,
): Promise<BatchEmailResult> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Email service not configured. Invoice emails not sent.");
    return {
      success: [],
      permanentFailures: emails.map((email) => ({
        email,
        error: "Email service not configured",
      })),
      transientFailures: [],
    };
  }

  // Filter out invalid emails
  const validEmails = emails.filter((email) => email && email !== "N/A");

  if (validEmails.length === 0) {
    return {
      success: [],
      permanentFailures: [],
      transientFailures: [],
    };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const subject = `Invoice #${invoiceNumber} - ${clienteNombre}`;
  const htmlContent = buildInvoiceEmailHtml(invoiceNumber, clienteNombre);
  const textContent = buildInvoiceEmailText(invoiceNumber, clienteNombre);
  const attachment = {
    content: pdfBuffer.toString("base64"),
    filename: `invoice-${invoiceNumber}.pdf`,
  };

  // Prepare batch email payloads
  const emailPayloads = validEmails.map((email) => ({
    from: fromEmail,
    to: email,
    subject: subject,
    html: htmlContent,
    text: textContent,
    attachments: [attachment],
  }));

  try {
    // Send emails in parallel using Promise.allSettled
    // This provides similar performance to batch API while being compatible
    const emailPromises = emailPayloads.map((payload, index) =>
      resend.emails
        .send(payload)
        .then(() => ({ email: validEmails[index], success: true }))
        .catch((error: any) => ({
          email: validEmails[index],
          success: false,
          error,
        })),
    );

    const results = await Promise.allSettled(emailPromises);

    // Process results
    const success: string[] = [];
    const permanentFailures: Array<{ email: string; error: string }> = [];
    const transientFailures: Array<{ email: string; error: string }> = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        const emailResult = result.value;
        if (emailResult.success) {
          success.push(emailResult.email!);
        } else {
          // Type guard: if success is false, error must exist
          const errorResult = emailResult as {
            email: string;
            success: false;
            error: any;
          };
          // Classify the error
          if (isTransientError(errorResult.error)) {
            transientFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Transient error",
            });
          } else {
            permanentFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Permanent error",
            });
          }
        }
      } else {
        // Promise itself was rejected - treat as transient
        transientFailures.push({
          email: "unknown",
          error: result.reason?.message || "Promise rejection",
        });
      }
    }

    return {
      success,
      permanentFailures,
      transientFailures,
    };
  } catch (error: any) {
    // Network or other errors - classify
    if (isTransientError(error)) {
      return {
        success: [],
        permanentFailures: [],
        transientFailures: validEmails.map((email) => ({
          email,
          error: error.message || "Network error",
        })),
      };
    } else {
      return {
        success: [],
        permanentFailures: validEmails.map((email) => ({
          email,
          error: error.message || "Unknown error",
        })),
        transientFailures: [],
      };
    }
  }
}

/**
 * Builds HTML content for dispatch order email
 */
function buildDispatchOrderEmailHtml(
  dispatchOrderNumber: number,
  organizationName?: string,
): string {
  const organizationText = organizationName
    ? ` from organization ${organizationName}`
    : "";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Dispatch Order Issued</h2>
      <p>Hello,</p>
      <p>A new dispatch order${organizationText} has been issued that requires your review.</p>
      <p><strong>Dispatch Order Number:</strong> #${dispatchOrderNumber}</p>
      <p>Please review the dispatch order document attached.</p>
      <p>Regards,<br>Inventory System</p>
    </div>
  `;
}

/**
 * Builds text content for dispatch order email
 */
function buildDispatchOrderEmailText(
  dispatchOrderNumber: number,
  organizationName?: string,
): string {
  const organizationText = organizationName
    ? ` from organization ${organizationName}`
    : "";
  return `A new dispatch order${organizationText} has been issued that requires your review.\n\nDispatch Order Number: #${dispatchOrderNumber}\n\nPlease review the dispatch order document attached.\n\nRegards,\nInventory System`;
}

function buildDispatchOrderDispatchedClientEmailHtml(
  dispatchOrderNumber: number,
  organizationName: string | undefined,
  clientName: string,
): string {
  const organizationText = organizationName ? ` (${organizationName})` : "";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Dispatch Order #${dispatchOrderNumber}</h2>
      <p>Dear ${clientName},</p>
      <p>Your dispatch order #${dispatchOrderNumber}${organizationText} has been dispatched.</p>
      <p>Please find the dispatch order document attached.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Regards,<br>ADDNEXO</p>
    </div>
  `;
}

function buildDispatchOrderDispatchedClientEmailText(
  dispatchOrderNumber: number,
  organizationName: string | undefined,
  clientName: string,
): string {
  const organizationText = organizationName ? ` (${organizationName})` : "";
  return `Dear ${clientName},\n\nYour dispatch order #${dispatchOrderNumber}${organizationText} has been dispatched.\n\nPlease find the dispatch order document attached.\n\nIf you have any questions, please don't hesitate to contact us.\n\nRegards,\nADDNEXO`;
}

/**
 * Sends dispatched dispatch-order emails to the client (Resend, same attachment to each address).
 */
export async function sendDispatchOrderDispatchedClientEmailBatch(
  emails: string[],
  dispatchOrderNumber: number,
  organizationName: string | undefined,
  clientName: string,
  pdfBuffer: Buffer,
): Promise<BatchEmailResult> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn(
      "Email service not configured. Dispatch order client emails not sent.",
    );
    return {
      success: [],
      permanentFailures: emails.map((email) => ({
        email,
        error: "Email service not configured",
      })),
      transientFailures: [],
    };
  }

  const validEmails = emails.filter((email) => email && email !== "N/A");

  if (validEmails.length === 0) {
    return {
      success: [],
      permanentFailures: [],
      transientFailures: [],
    };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const subject = `Dispatch Order #${dispatchOrderNumber} — Dispatched`;
  const htmlContent = buildDispatchOrderDispatchedClientEmailHtml(
    dispatchOrderNumber,
    organizationName,
    clientName,
  );
  const textContent = buildDispatchOrderDispatchedClientEmailText(
    dispatchOrderNumber,
    organizationName,
    clientName,
  );
  const attachment = {
    content: pdfBuffer.toString("base64"),
    filename: `dispatch-order-${dispatchOrderNumber}.pdf`,
  };

  const emailPayloads = validEmails.map((email) => ({
    from: fromEmail,
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
    attachments: [attachment],
  }));

  try {
    const emailPromises = emailPayloads.map((payload, index) =>
      resend.emails
        .send(payload)
        .then(() => ({ email: validEmails[index], success: true }))
        .catch((error: any) => ({
          email: validEmails[index],
          success: false,
          error,
        })),
    );

    const results = await Promise.allSettled(emailPromises);

    const success: string[] = [];
    const permanentFailures: Array<{ email: string; error: string }> = [];
    const transientFailures: Array<{ email: string; error: string }> = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        const emailResult = result.value;
        if (emailResult.success) {
          success.push(emailResult.email!);
        } else {
          const errorResult = emailResult as {
            email: string;
            success: false;
            error: any;
          };
          if (isTransientError(errorResult.error)) {
            transientFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Transient error",
            });
          } else {
            permanentFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Permanent error",
            });
          }
        }
      } else {
        transientFailures.push({
          email: "unknown",
          error: result.reason?.message || "Promise rejection",
        });
      }
    }

    return {
      success,
      permanentFailures,
      transientFailures,
    };
  } catch (error: any) {
    if (isTransientError(error)) {
      return {
        success: [],
        permanentFailures: [],
        transientFailures: validEmails.map((email) => ({
          email,
          error: error.message || "Network error",
        })),
      };
    }
    return {
      success: [],
      permanentFailures: validEmails.map((email) => ({
        email,
        error: error.message || "Unknown error",
      })),
      transientFailures: [],
    };
  }
}

/**
 * Sends dispatch order emails in batch using Resend
 * Returns detailed results for each email (success, permanent failure, transient failure)
 */
export async function sendDispatchOrderEmailBatch(
  emails: string[],
  dispatchOrderNumber: number,
  organizationName: string | undefined,
  pdfBuffer: Buffer,
): Promise<BatchEmailResult> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn(
      "Email service not configured. Dispatch order emails not sent.",
    );
    return {
      success: [],
      permanentFailures: emails.map((email) => ({
        email,
        error: "Email service not configured",
      })),
      transientFailures: [],
    };
  }

  // Filter out invalid emails
  const validEmails = emails.filter((email) => email && email !== "N/A");

  if (validEmails.length === 0) {
    return {
      success: [],
      permanentFailures: [],
      transientFailures: [],
    };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const subject = `New Dispatch Order Issued - #${dispatchOrderNumber}`;
  const htmlContent = buildDispatchOrderEmailHtml(
    dispatchOrderNumber,
    organizationName,
  );
  const textContent = buildDispatchOrderEmailText(
    dispatchOrderNumber,
    organizationName,
  );
  const attachment = {
    content: pdfBuffer.toString("base64"),
    filename: `dispatch-order-${dispatchOrderNumber}.pdf`,
  };

  // Prepare batch email payloads
  const emailPayloads = validEmails.map((email) => ({
    from: fromEmail,
    to: email,
    subject: subject,
    html: htmlContent,
    text: textContent,
    attachments: [attachment],
  }));

  try {
    // Send emails in parallel using Promise.allSettled
    // This provides similar performance to batch API while being compatible
    const emailPromises = emailPayloads.map((payload, index) =>
      resend.emails
        .send(payload)
        .then(() => ({ email: validEmails[index], success: true }))
        .catch((error: any) => ({
          email: validEmails[index],
          success: false,
          error,
        })),
    );

    const results = await Promise.allSettled(emailPromises);

    // Process results
    const success: string[] = [];
    const permanentFailures: Array<{ email: string; error: string }> = [];
    const transientFailures: Array<{ email: string; error: string }> = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        const emailResult = result.value;
        if (emailResult.success) {
          success.push(emailResult.email!);
        } else {
          // Type guard: if success is false, error must exist
          const errorResult = emailResult as {
            email: string;
            success: false;
            error: any;
          };
          // Classify the error
          if (isTransientError(errorResult.error)) {
            transientFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Transient error",
            });
          } else {
            permanentFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Permanent error",
            });
          }
        }
      } else {
        // Promise itself was rejected - treat as transient
        transientFailures.push({
          email: "unknown",
          error: result.reason?.message || "Promise rejection",
        });
      }
    }

    return {
      success,
      permanentFailures,
      transientFailures,
    };
  } catch (error: any) {
    // Network or other errors - classify
    if (isTransientError(error)) {
      return {
        success: [],
        permanentFailures: [],
        transientFailures: validEmails.map((email) => ({
          email,
          error: error.message || "Network error",
        })),
      };
    } else {
      return {
        success: [],
        permanentFailures: validEmails.map((email) => ({
          email,
          error: error.message || "Unknown error",
        })),
        transientFailures: [],
      };
    }
  }
}

/**
 * Sends an issued purchase order (with PDF) to the supplier email(s).
 * Mirrors sendDispatchOrderEmailBatch but for the buy side.
 */
export async function sendPurchaseOrderEmailBatch(
  emails: string[],
  purchaseOrderNumber: number,
  organizationName: string | undefined,
  pdfBuffer: Buffer,
): Promise<BatchEmailResult> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn(
      "Email service not configured. Purchase order emails not sent.",
    );
    return {
      success: [],
      permanentFailures: emails.map((email) => ({
        email,
        error: "Email service not configured",
      })),
      transientFailures: [],
    };
  }

  const validEmails = emails.filter((email) => email && email !== "N/A");
  if (validEmails.length === 0) {
    return { success: [], permanentFailures: [], transientFailures: [] };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const subject = `New Purchase Order Issued - #${purchaseOrderNumber}`;
  const orgLine = organizationName ? ` from ${organizationName}` : "";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Purchase Order #${purchaseOrderNumber}</h2>
      <p>Hello,</p>
      <p>A new purchase order${orgLine} has been issued. The details are attached as a PDF.</p>
      <p>Thank you.</p>
    </div>`;
  const textContent = `New Purchase Order #${purchaseOrderNumber}\n\nA new purchase order${orgLine} has been issued. The details are attached as a PDF.`;
  const attachment = {
    content: pdfBuffer.toString("base64"),
    filename: `purchase-order-${purchaseOrderNumber}.pdf`,
  };

  const emailPayloads = validEmails.map((email) => ({
    from: fromEmail,
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
    attachments: [attachment],
  }));

  try {
    const emailPromises = emailPayloads.map((payload, index) =>
      resend.emails
        .send(payload)
        .then(() => ({ email: validEmails[index], success: true }))
        .catch((error: any) => ({
          email: validEmails[index],
          success: false,
          error,
        })),
    );

    const results = await Promise.allSettled(emailPromises);

    const success: string[] = [];
    const permanentFailures: Array<{ email: string; error: string }> = [];
    const transientFailures: Array<{ email: string; error: string }> = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        const emailResult = result.value;
        if (emailResult.success) {
          success.push(emailResult.email!);
        } else {
          const errorResult = emailResult as {
            email: string;
            success: false;
            error: any;
          };
          if (isTransientError(errorResult.error)) {
            transientFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Transient error",
            });
          } else {
            permanentFailures.push({
              email: errorResult.email,
              error:
                errorResult.error?.message ||
                errorResult.error?.name ||
                "Permanent error",
            });
          }
        }
      } else {
        transientFailures.push({
          email: "unknown",
          error: result.reason?.message || "Promise rejection",
        });
      }
    }

    return { success, permanentFailures, transientFailures };
  } catch (error: any) {
    if (isTransientError(error)) {
      return {
        success: [],
        permanentFailures: [],
        transientFailures: validEmails.map((email) => ({
          email,
          error: error.message || "Network error",
        })),
      };
    }
    return {
      success: [],
      permanentFailures: validEmails.map((email) => ({
        email,
        error: error.message || "Unknown error",
      })),
      transientFailures: [],
    };
  }
}

/**
 * Sends admin notification when invoice email delivery fails permanently
 */
export async function sendAdminInvoiceFailureNotification(
  invoiceNumber: number,
  clienteNombre: string,
  failedEmails: Array<{ email: string; error: string }>,
  organizationId?: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Email service not configured. Admin notification not sent.");
    return;
  }

  const adminEmail = "adstrategicbusiness@gmail.com";
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const subject = `Invoice Email Delivery Failed - Invoice #${invoiceNumber}`;

  // Build list of failed emails with errors
  const failedEmailsList = failedEmails
    .map(
      (f) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${f.email}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${f.error}</td>
    </tr>
  `,
    )
    .join("");

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Invoice Email Delivery Failed</h2>
      <p>Dear Admin,</p>
      <p>The system was unable to deliver invoice emails to the following recipients:</p>
      
      <div style="margin: 20px 0;">
        <p><strong>Invoice Number:</strong> #${invoiceNumber}</p>
        <p><strong>Client Name:</strong> ${clienteNombre}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <h3 style="color: #333; margin-top: 30px;">Failed Email Addresses:</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Email Address</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Error</th>
          </tr>
        </thead>
        <tbody>
          ${failedEmailsList}
        </tbody>
      </table>

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Action Required:</strong> Please verify the email addresses for this client and update them if necessary.
      </p>

      <p style="margin-top: 20px;">
        Regards,<br>
        Inventory System
      </p>
    </div>
  `;

  const textContent = `Invoice Email Delivery Failed

Invoice Number: #${invoiceNumber}
Client Name: ${clienteNombre}
Timestamp: ${new Date().toLocaleString()}

Failed Email Addresses:
${failedEmails.map((f) => `  - ${f.email}: ${f.error}`).join("\n")}

Action Required: Please verify the email addresses for this client and update them if necessary.

Regards,
Inventory System`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: subject,
      html: htmlContent,
      text: textContent,
    });
  } catch (error: any) {
    // Log error but don't throw - we don't want notification failures to break the worker
    console.error(
      `Failed to send admin notification for invoice #${invoiceNumber}:`,
      error,
    );
  }
}

export async function sendClienteRegistroInviteEmail(params: {
  inviteUrl: string;
  organizationName: string;
  to: string;
}): Promise<boolean> {
  const client = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!client || !fromEmail) {
    return false;
  }
  const { inviteUrl, organizationName, to } = params;
  try {
    await client.emails.send({
      from: fromEmail,
      to,
      subject: `Complete your registration — ${organizationName}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0e5829;">${organizationName}</h2>
        <p>You have been invited to complete your customer registration.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#2c854d;color:#fff;text-decoration:none;border-radius:6px;">Complete registration</a></p>
        <p style="font-size:12px;color:#666;">If the button does not work, copy this link:<br/>${inviteUrl}</p>
      </div>`,
      text: `${organizationName} — Complete your customer registration:\n${inviteUrl}`,
    });
    return true;
  } catch (e) {
    console.error("sendClienteRegistroInviteEmail", e);
    return false;
  }
}
export async function sendVendorRegistroInviteEmail(params: {
  inviteUrl: string;
  organizationName: string;
  to: string;
}): Promise<boolean> {
  const client = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!client || !fromEmail) {
    return false;
  }
  const { inviteUrl, organizationName, to } = params;
  try {
    await client.emails.send({
      from: fromEmail,
      to,
      subject: `Complete your registration — ${organizationName}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0e5829;">${organizationName}</h2>
        <p>You have been invited to complete your vendor registration.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#2c854d;color:#fff;text-decoration:none;border-radius:6px;">Complete registration</a></p>
        <p style="font-size:12px;color:#666;">If the button does not work, copy this link:<br/>${inviteUrl}</p>
      </div>`,
      text: `${organizationName} — Complete your vendor registration:\n${inviteUrl}`,
    });
    return true;
  } catch (e) {
    console.error("sendVendorRegistroInviteEmail", e);
    return false;
  }
}
export async function sendSupplierRegistroInviteEmail(params: {
  inviteUrl: string;
  organizationName: string;
  to: string;
}): Promise<boolean> {
  const client = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!client || !fromEmail) {
    return false;
  }
  const { inviteUrl, organizationName, to } = params;
  try {
    await client.emails.send({
      from: fromEmail,
      to,
      subject: `Complete your registration — ${organizationName}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0e5829;">${organizationName}</h2>
        <p>You have been invited to complete your supplier registration.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#2c854d;color:#fff;text-decoration:none;border-radius:6px;">Complete registration</a></p>
        <p style="font-size:12px;color:#666;">If the button does not work, copy this link:<br/>${inviteUrl}</p>
      </div>`,
      text: `${organizationName} — Complete your supplier registration:\n${inviteUrl}`,
    });
    return true;
  } catch (e) {
    console.error("sendSupplierRegistroInviteEmail", e);
    return false;
  }
}
