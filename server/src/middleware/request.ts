import crypto from "node:crypto";

import type { RequestHandler } from "express";

/**
 * Assigns (or reuses) a request ID and echoes it in the `x-request-id`
 * response header. Every structured log and error envelope includes it.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const value = req.header("x-request-id") ?? crypto.randomUUID();
  req.id = value;
  res.setHeader("x-request-id", value);
  next();
};