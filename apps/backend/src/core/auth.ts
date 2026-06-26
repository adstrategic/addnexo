import "dotenv/config";
import { ac, roles } from "@repo/auth-config";
import { prisma } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
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

  databaseHooks: {
    session: {
      create: {
        before: async (data) => {
          if (data.activeOrganizationId != null) return;
          const userId = data.userId as string | undefined;
          if (!userId) return;

          const members = await prisma.member.findMany({
            where: { userId },
            select: { organizationId: true },
          });
          if (members.length !== 1) return;
          const sole = members[0];
          if (!sole) return;

          return {
            data: { activeOrganizationId: sole.organizationId },
          };
        },
      },
    },
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
      // The organization creator is assigned this role. Must exist in `roles`
      // below and carry `invitation: ["create"]` so the creator can invite.
      creatorRole: "admin",
      invitationExpiresIn: 60 * 60 * 48, // 48 hours
      organizationHooks: {
        afterAcceptInvitation: async ({ organization, user }) => {
          console.log(
            `✓ ${user.email} accepted invitation to ${organization.name}`,
          );
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
      },
      organizationLimit: 5,
      roles: {
        admin: roles.admin,
        warehouse_manager: roles.warehouse_manager,
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

  trustedOrigins: [envVars.FRONTEND_URL].filter(Boolean),
});

export type Auth = typeof auth;
