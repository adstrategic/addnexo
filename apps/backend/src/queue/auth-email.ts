export const AUTH_EMAIL_JOB_NAMES = {
  invitation: "auth.invitation",
  resetPassword: "auth.reset-password",
} as const;

export interface AuthResetPasswordEmailJobData {
  appName: string;
  resetUrl: string;
  to: string;
  token: string;
  userName?: null | string;
}

export interface AuthInvitationEmailJobData {
  appName: string;
  inviteId: string;
  inviterName?: null | string;
  organizationName: string;
  role: string;
  to: string;
}

export type AuthEmailJobData =
  | AuthInvitationEmailJobData
  | AuthResetPasswordEmailJobData;
