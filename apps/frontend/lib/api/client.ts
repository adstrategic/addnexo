"use client";

import axios, { type AxiosError, type AxiosInstance } from "axios";

/**
 * Base API client configured with backend URL and auth headers
 *
 * Token Refresh: Clerk automatically handles token refresh
 * - Tokens expire every ~60 seconds
 * - Clerk refreshes tokens ~10 seconds before expiration
 * - getToken() always returns a fresh, valid token
 * - No manual refresh logic needed!
 */
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const client = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  // Response interceptor: single place for redirects on auth/subscription errors.
  // Mutations and queries both get redirect here; handleMutationError only shows toasts.
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data as
        | { code?: string; error?: string; redirectTo?: string }
        | undefined;
      const code = data?.code ?? data?.error;

      if (typeof window !== "undefined" && status !== undefined) {
        if (status === 401) {
          window.location.href = "/sign-in";
        } else if (status === 403 && code === "BUSINESS_REQUIRED") {
          window.location.href = data?.redirectTo ?? "/setup";
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();
