import "dotenv/config";
import { ac, roles } from "@repo/auth-config";
import { prisma } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { organization } from "better-auth/plugins/organization";

import { envVars } from "./envVars.js";

/**
 * Better Auth instance – session-based auth on the backend.
 * Handles: email/password, sessions (cookies), multi-tenant organizations with RBAC.
 * No JWT or bearer plugins; sessions only.
 */
export const auth = betterAuth({
  advanced: {
    crossSubDomainCookies: { enabled: false },
  },

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },

  experimental: {
    joins: true,
  },

  plugins: [
    organization({
      ac,
      allowUserToCreateOrganization: true,
      invitationExpiresIn: 60 * 60 * 48, // 48 hours
      organizationHooks: {
        afterAcceptInvitation: async ({ organization, user }) => {
          console.log(
            `✓ ${user.email} accepted invitation to ${organization.name}`,
          );
        },
        afterCreateOrganization: async ({ member }) => {
          await prisma.member.update({
            data: { role: "owner" },
            where: { id: member.id },
          });
        },
        afterDeleteOrganization: async ({ user }) => {
          const remainingOrgs = await prisma.member.count({
            where: { userId: user.id },
          });
          if (remainingOrgs === 0) {
            await prisma.session.updateMany({
              data: { activeOrganizationId: null },
              where: { userId: user.id },
            });
            console.log(`⚠️ User ${user.email} has no organizations left`);
          }
        },
        beforeSetActiveOrganization: async ({
          organizationId,
          user,
        }: {
          organizationId: null | string;
          user: { email: string; id: string; name: string };
        }) => {
          if (!organizationId) return;
          const membership = await prisma.member.findFirst({
            where: { organizationId, userId: user.id },
          });
          if (!membership) {
            throw new APIError("FORBIDDEN", {
              message: "You are not a member of this organization.",
            });
          }
        },
      },
      organizationLimit: 5,
      roles: {
        admin: roles.admin,
        owner: roles.owner,
        warehouseManager: roles.warehouseManager,
      },
      async sendInvitationEmail(data) {
        console.log("📧 Invitation email would be sent to:", data.email);
        console.log(
          "   Organization:",
          data.organization.name,
          "Role:",
          data.role,
        );
        console.log(
          "   Invite link:",
          `${envVars.FRONTEND_URL}/invite/${data.id}`,
        );
        // TODO: wire your email service
      },
    }),
  ],

  secret: envVars.BETTER_AUTH_SECRET,

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every day
  },

  trustedOrigins: [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL].filter(
    Boolean,
  ),
});

export type Auth = typeof auth;
