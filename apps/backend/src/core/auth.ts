import "dotenv/config";
import { ac, roles } from "@repo/auth-config";
import { prisma } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins/organization";

import { envVars } from "./envVars.js";
import {
  enqueueInvitationEmailJob,
  enqueueResetPasswordEmailJob,
} from "../queue/auth-email.jobs.js";

const APP_NAME = "ADDNEXO";
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Better Auth instance – session-based auth on the backend.
 * Handles: email/password, sessions (cookies), multi-tenant organizations with RBAC.
 * No JWT or bearer plugins; sessions only.
 */
export const auth = betterAuth({
  advanced: {
    // In production the frontend and backend live on different origins, so
    // cookies must carry the cross-site attributes required by browsers.
    // In development we leave cookie attributes at Better Auth's defaults so
    // the session cookie is sent correctly on cross-origin fetch requests
    // between the frontend (port 3000) and backend (port 4000).
    ...(!isDevelopment && {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        partitioned: true,
      },
    }),
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
    async sendResetPassword({ token, user, url }) {
      void enqueueResetPasswordEmailJob({
        appName: APP_NAME,
        resetUrl: url,
        token,
        to: user.email,
        userName: user.name,
      }).then((result) => {
        if (!result) {
          console.error("auth_reset_password_enqueue_failed", {
            userId: user.id,
          });
        }
      });
    },
  },

  experimental: {
    joins: true,
  },

  plugins: [
    organization({
      ac,
      allowUserToCreateOrganization: true,
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
        void enqueueInvitationEmailJob({
          appName: APP_NAME,
          inviteId: data.id,
          inviterName: data.inviter.user.name,
          organizationName: data.organization.name,
          role: data.role,
          to: data.email,
        }).then((result) => {
          if (!result) {
            console.error("auth_invitation_enqueue_failed", {
              invitationId: data.id,
              organizationId: data.organization.id,
            });
          }
        });
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
