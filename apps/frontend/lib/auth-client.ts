import { createAuthClient } from "better-auth/react";
import { ac, roles } from "@repo/auth-config";
import {
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { toast } from "sonner";

/**
 * Auth client for the Next.js frontend.
 * When using the Next.js proxy (rewrites), baseURL is same-origin so cookies work.
 * Otherwise set NEXT_PUBLIC_API_URL and use credentials: "include".
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  fetchOptions: {
    credentials: "include",
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
    },
  },
  plugins: [
    organizationClient({
      ac,
      roles: {
        admin: roles.admin,
        warehouse_manager: roles.warehouse_manager,
      },
    }),
    lastLoginMethodClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
