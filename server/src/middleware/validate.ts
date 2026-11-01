import type { RequestHandler } from "express";
import type { ZodType } from "zod";

/**
 * Validates `req.body` against a Zod schema. Replaces `req.body` with the
 * parsed (typed) result so downstream code sees sanitized data.
 * Throws a ZodError which the global error handler converts to a 400.
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}