import {
  AUTH_EMAIL_JOB_NAMES,
  type AuthEmailJobData,
  type AuthInvitationEmailJobData,
  type AuthResetPasswordEmailJobData,
} from "./auth-email.js";

type SendResult = Promise<{ error?: string; success: boolean }>;

interface AuthEmailProcessorDeps {
  sendInvitation: (data: AuthInvitationEmailJobData) => SendResult;
  sendResetPassword: (data: AuthResetPasswordEmailJobData) => SendResult;
}

export function createAuthEmailJobProcessor(deps: AuthEmailProcessorDeps) {
  return async (job: {
    data: AuthEmailJobData;
    name: string;
  }): Promise<void> => {
    if (job.name === AUTH_EMAIL_JOB_NAMES.resetPassword) {
      const result = await deps.sendResetPassword(
        job.data as AuthResetPasswordEmailJobData,
      );
      if (!result.success) {
        throw new Error(result.error ?? "Reset password email failed");
      }
      return;
    }

    if (job.name === AUTH_EMAIL_JOB_NAMES.invitation) {
      const result = await deps.sendInvitation(
        job.data as AuthInvitationEmailJobData,
      );
      if (!result.success) {
        throw new Error(result.error ?? "Invitation email failed");
      }
      return;
    }

    throw new Error(`Unsupported auth email job: ${job.name}`);
  };
}
