import { NextFunction, Request, Response } from "express";
import * as z from "zod";

import { zodErrorToFieldValidationError } from "../lib/zodError.js";

/**
 * Validates req.body against the given schema and replaces it with the parsed/
 * coerced value. On failure it delegates to the central error handler via
 * next(err) instead of formatting its own response, so validation errors share
 * the exact same envelope as every other error in the app.
 */
export const validateRequest =
  (schema: z.ZodType) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(zodErrorToFieldValidationError(error));
      } else {
        next(error);
      }
    }
  };
