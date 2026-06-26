import * as z from "zod";

import { FieldValidationError } from "../errors/EntityErrors.js";

/**
 * Converts a ZodError into a FieldValidationError carrying dot-notation field
 * paths (e.g. "items.0.DOUCantidad") so the central error handler can emit the
 * standard envelope and the frontend can drop each message onto the matching
 * React Hook Form input. Cross-field issues (empty path) bucket under "_errors".
 */
export function zodErrorToFieldValidationError(
  error: z.ZodError,
): FieldValidationError {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".") || "_errors";
    (fields[path] ??= []).push(issue.message);
  }

  const count = error.issues.length;
  return new FieldValidationError({
    code: "ERR_VALID",
    statusCode: 400,
    message: `Validation failed with ${count} error${count === 1 ? "" : "s"}`,
    fields,
  });
}
