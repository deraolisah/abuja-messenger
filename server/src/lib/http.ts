// apps/api/src/lib/http.ts
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodError } from "zod";

import { HttpError } from "./errors";

export const asyncHandler =
  <R extends Request = Request>(
    fn: (req: R, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as R, res, next)).catch(next);
  };

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Zod errors thrown from .parse()
  if (isZodError(err)) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Some fields need attention.",
        details: err.flatten().fieldErrors,
      },
    });
  }

  // Mongoose duplicate key (unique email)
  if (typeof err === "object" && err && "code" in err && (err as { code?: number }).code === 11000) {
    return res.status(409).json({
      error: { code: "DUPLICATE", message: "That record already exists." },
    });
  }

  console.error("💥 Unhandled error:", err);
  return res.status(500).json({
    error: { code: "INTERNAL", message: "Something went wrong. Please try again." },
  });
}

function isZodError(err: unknown): err is ZodError {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: string }).name === "ZodError"
  );
}