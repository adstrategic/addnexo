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
