import type { RequestHandler } from "express";

/**
 * Wraps an async route handler so that rejected promises are forwarded to
 * Express's error middleware. Without this, throwing inside an async handler
 * silently hangs the request.
 */
export function asyncRoute(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}