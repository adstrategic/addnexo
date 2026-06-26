import { z } from "zod";

export type { RequestContext } from "../middleware/context.middleware.js";

// Generic helper for nullable optional fields that converts empty strings to null
export const nullableOptional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    schema.nullable().optional(),
  );
