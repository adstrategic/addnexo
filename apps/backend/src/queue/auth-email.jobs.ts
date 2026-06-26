import {
  AUTH_EMAIL_JOB_NAMES,
  type AuthEmailJobData,
  type AuthInvitationEmailJobData,
  type AuthResetPasswordEmailJobData,
} from "./auth-email.js";

interface Logger {
  error: (...args: unknown[]) => void;
}

interface QueueLike {
  add: (
    name: string,
    data: AuthEmailJobData,
    options: { jobId: string },
  ) => Promise<unknown>;
}

async function resolveQueue(queue?: QueueLike): Promise<QueueLike> {
  if (queue) {
    return queue;
  }
  const module = await import("./queues.js");
  return module.authEmailQueue;
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getResetPasswordJobId(
  data: AuthResetPasswordEmailJobData,
): string {
  return `${AUTH_EMAIL_JOB_NAMES.resetPassword}:${sanitizeEmail(data.to)}:${data.token}`;
}

export function getInvitationJobId(data: AuthInvitationEmailJobData): string {
  return `${AUTH_EMAIL_JOB_NAMES.invitation}:${sanitizeEmail(data.to)}:${data.inviteId}`;
}

export async function enqueueResetPasswordEmailJob(
  data: AuthResetPasswordEmailJobData,
  deps: { logger?: Logger; queue?: QueueLike } = {},
): Promise<boolean> {
  const queue = await resolveQueue(deps.queue);
  const logger = deps.logger ?? console;

  try {
    const jobId = getResetPasswordJobId(data);
    await queue.add(AUTH_EMAIL_JOB_NAMES.resetPassword, data, {
      jobId,
    });
    console.info("auth_email_enqueued", {
      kind: AUTH_EMAIL_JOB_NAMES.resetPassword,
      to: sanitizeEmail(data.to),
      jobId,
    });
    return true;
  } catch (error) {
    logger.error("auth_email_enqueue_failed", {
      error: error instanceof Error ? error.message : "Unknown queue error",
      kind: AUTH_EMAIL_JOB_NAMES.resetPassword,
      tokenSuffix: data.token.slice(-6),
      to: sanitizeEmail(data.to),
    });
    return false;
  }
}

export async function enqueueInvitationEmailJob(
  data: AuthInvitationEmailJobData,
  deps: { logger?: Logger; queue?: QueueLike } = {},
): Promise<boolean> {
  const queue = await resolveQueue(deps.queue);
  const logger = deps.logger ?? console;

  try {
    const jobId = getInvitationJobId(data);
    await queue.add(AUTH_EMAIL_JOB_NAMES.invitation, data, {
      jobId,
    });
    console.info("auth_email_enqueued", {
      inviteId: data.inviteId,
      kind: AUTH_EMAIL_JOB_NAMES.invitation,
      to: sanitizeEmail(data.to),
      jobId,
    });
    return true;
  } catch (error) {
    logger.error("auth_email_enqueue_failed", {
      error: error instanceof Error ? error.message : "Unknown queue error",
      inviteId: data.inviteId,
      kind: AUTH_EMAIL_JOB_NAMES.invitation,
      to: sanitizeEmail(data.to),
    });
    return false;
  }
}
