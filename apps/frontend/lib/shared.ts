import type { ReadonlyURLSearchParams } from "next/navigation";

const allowedCallbackSet: ReadonlySet<string> = new Set(["/", "/device"]);

export const getPostAuthRedirect = (target = "/"): string =>
  `/period/select?callbackURL=${encodeURIComponent(target)}`;

export const getCallbackURL = (
  queryParams: ReadonlyURLSearchParams,
): string => {
  const callbackUrl = queryParams.get("callbackUrl");
  const target =
    callbackUrl && allowedCallbackSet.has(callbackUrl) ? callbackUrl : "/";
  return getPostAuthRedirect(target);
};

/**
 * Resolves where to send a user after authentication.
 * Invite links bypass the /period/select wrapper and return straight to /invite/{id}.
 * All other flows go through the normal callbackURL -> period select flow.
 */
export const resolvePostAuthTarget = (
  queryParams: ReadonlyURLSearchParams,
): string => {
  const redirect = queryParams.get("redirect");
  if (redirect && redirect.startsWith("/invite/")) {
    return redirect;
  }
  return getCallbackURL(queryParams);
};
